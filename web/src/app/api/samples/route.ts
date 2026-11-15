import { parseEntries } from "@/lib/sample/sync-core";
import { appendLog, claimLease, readLog, resetLog } from "@/lib/sample/sync-log";

export const dynamic = "force-dynamic";

const MAX_BODY = 64_000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function int(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/**
 * GET /api/samples?since=N&seedAt=T → LogPage
 * The shared demo log from entry N onwards (from 0 when T is not the current seed).
 * The phone app and the nurse board poll this, so a phone and a laptop see each other's actions.
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  try {
    return json(await readLog(int(q.get("since")) ?? 0, int(q.get("seedAt"))));
  } catch (e) {
    console.error("[samples] read failed", e);
    return json({ error: "Log unavailable" }, 502);
  }
}

/**
 * POST /api/samples
 *   { seedAt, entries: LogEntry[] } → { status: "ok" | "stale" | "full" }
 *   { reset: true } → { seedAt }
 *   { lease: id, release?: true } → { holder }   (who runs the household simulation)
 */
export async function POST(req: Request): Promise<Response> {
  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: "Too large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }
  try {
    if (body?.reset === true) return json({ seedAt: await resetLog() });
    // { lease: id, release? } → { holder }: only the holder's robots page runs the household simulation.
    if (typeof body?.lease === "string") {
      if (body.lease.length === 0 || body.lease.length > 64) return json({ error: "Bad lease" }, 400);
      return json({ holder: await claimLease(body.lease, body.release === true) });
    }
    const seedAt = typeof body?.seedAt === "number" ? int(String(body.seedAt)) : null;
    const entries = parseEntries(body?.entries);
    if (seedAt === null || !entries) return json({ error: "Bad entries" }, 400);
    return json({ status: await appendLog(seedAt, entries) });
  } catch (e) {
    console.error("[samples] write failed", e);
    return json({ error: "Log unavailable" }, 502);
  }
}
