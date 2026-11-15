import { MAX_LOG_LENGTH, type LogEntry, type LogPage } from "./sync-core";

/**
 * Server side of the shared demo log.
 * With Upstash Redis credentials (the Vercel marketplace sets KV_REST_API_URL and KV_REST_API_TOKEN)
 * every server instance shares one log. Without them the log lives in this process's memory,
 * which is enough for local development but is not shared between serverless instances.
 */
const SEED_KEY = "farmagusta:demo:seedAt";
const LOG_KEY = "farmagusta:demo:log";
const LEASE_KEY = "farmagusta:demo:simLease";

type Redis = { url: string; token: string };

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function call<T>(r: Redis, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${r.url}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${r.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Redis ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

type Reply = { result?: unknown; error?: string };

function results(replies: Reply[]): unknown[] {
  return replies.map((r) => {
    if (r.error) throw new Error(`Redis error: ${r.error}`);
    return r.result;
  });
}

// In-memory fallback, kept on globalThis so dev-server reloads keep it.
const mem = ((globalThis as { __farmagustaLog?: { seedAt: number; log: LogEntry[] } }).__farmagustaLog ??= {
  seedAt: Date.now(),
  log: [],
});

/** Entries from index `since`; from 0 when the caller's seed is out of date. */
export async function readLog(since: number, clientSeedAt: number | null): Promise<LogPage> {
  const r = redis();
  if (!r) {
    const from = clientSeedAt === mem.seedAt ? Math.min(since, mem.log.length) : 0;
    return { seedAt: mem.seedAt, from, entries: mem.log.slice(from), durable: false };
  }
  const [, seedRaw, page] = results(
    await call<Reply[]>(r, "/pipeline", [
      ["SET", SEED_KEY, String(Date.now()), "NX"],
      ["GET", SEED_KEY],
      ["LRANGE", LOG_KEY, String(since), "-1"],
    ]),
  );
  const seedAt = Number(seedRaw);
  let from = since;
  let raw = page as string[];
  if (clientSeedAt !== seedAt && since > 0) {
    from = 0;
    raw = (await call<Reply>(r, "", ["LRANGE", LOG_KEY, "0", "-1"])).result as string[];
  }
  return { seedAt, from, entries: raw.map((s) => JSON.parse(s) as LogEntry), durable: true };
}

// Appends only if the log still belongs to the caller's seed, so writes made before a reset are dropped.
const APPEND = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return -1 end
if redis.call('LLEN', KEYS[2]) >= tonumber(ARGV[2]) then return -2 end
for i = 3, #ARGV do redis.call('RPUSH', KEYS[2], ARGV[i]) end
return 1`;

/** "ok", or "stale" when the log was reset since the caller read it, or "full". */
export async function appendLog(seedAt: number, entries: LogEntry[]): Promise<"ok" | "stale" | "full"> {
  const r = redis();
  if (!r) {
    if (seedAt !== mem.seedAt) return "stale";
    if (mem.log.length >= MAX_LOG_LENGTH) return "full";
    mem.log.push(...entries);
    return "ok";
  }
  const out = await call<Reply>(r, "", [
    "EVAL",
    APPEND,
    "2",
    SEED_KEY,
    LOG_KEY,
    String(seedAt),
    String(MAX_LOG_LENGTH),
    ...entries.map((e) => JSON.stringify(e)),
  ]);
  if (out.error) throw new Error(`Redis error: ${out.error}`);
  return out.result === 1 ? "ok" : out.result === -1 ? "stale" : "full";
}

// The new seed is always later than the old one, even for two resets in the same millisecond;
// otherwise a write made before the second reset would still match and be accepted.
const RESET = `
local old = tonumber(redis.call('GET', KEYS[1]) or '0') or 0
local seed = math.max(tonumber(ARGV[1]), old + 1)
redis.call('SET', KEYS[1], string.format('%.0f', seed))
redis.call('DEL', KEYS[2])
return string.format('%.0f', seed)`;

/** Starts a new, empty log seeded at the current time (or just after the previous seed). */
export async function resetLog(): Promise<number> {
  const r = redis();
  if (!r) {
    mem.seedAt = Math.max(Date.now(), mem.seedAt + 1);
    mem.log = [];
    return mem.seedAt;
  }
  const out = await call<Reply>(r, "", ["EVAL", RESET, "2", SEED_KEY, LOG_KEY, String(Date.now())]);
  if (out.error) throw new Error(`Redis error: ${out.error}`);
  return Number(out.result);
}

// ---- Who runs the household simulation ---------------------------------------------------------

/**
 * How long a simulation lease lasts without renewal. Every open robots page would otherwise run the
 * simulation and write the same bookings twice (robots jumping between runs, vanishing, reappearing).
 */
export const LEASE_MS = 6_000;

const CLAIM = `
local cur = redis.call('GET', KEYS[1])
if (not cur) or cur == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])
  return ARGV[1]
end
return cur`;

const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('DEL', KEYS[1]) end
return 1`;

const memLease = ((globalThis as { __farmagustaLease?: { holder: string; until: number } }).__farmagustaLease ??= { holder: "", until: 0 });

/**
 * Claims (or renews) the simulation lease for `id`; returns who holds it now. With `release`, gives it
 * up if `id` holds it, so another page can take over at once.
 */
export async function claimLease(id: string, release = false, now = Date.now()): Promise<string> {
  const r = redis();
  if (!r) {
    if (release) {
      if (memLease.holder === id) memLease.until = 0;
      return "";
    }
    if (!memLease.holder || memLease.holder === id || now >= memLease.until) {
      memLease.holder = id;
      memLease.until = now + LEASE_MS;
    }
    return memLease.holder;
  }
  const out = release
    ? await call<Reply>(r, "", ["EVAL", RELEASE, "1", LEASE_KEY, id])
    : await call<Reply>(r, "", ["EVAL", CLAIM, "1", LEASE_KEY, id, String(LEASE_MS)]);
  if (out.error) throw new Error(`Redis error: ${out.error}`);
  return release ? "" : String(out.result ?? "");
}
