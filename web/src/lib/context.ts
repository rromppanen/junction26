// Server-only module: calls Context.dev with CONTEXT_DEV_API_KEY. Do not import from client components.
// Live county context (spec component 6): public web pages about the county's cancer care and access times.

export type LiveSnippet = {
  id: string; // "live:1", "live:2", ... (citable source id for the analyst)
  title: string;
  url: string;
  text: string; // short excerpt, Finnish or Swedish as published
};

export type LiveContext = {
  status: "ok" | "empty" | "not-configured" | "error";
  snippets: LiveSnippet[];
  fetchedAt: string | null; // ISO timestamp of the Context.dev call
};

import type { Indicator } from "./types";

const ENDPOINT = "https://api.context.dev/v1/web/search";
const TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8_000;
const MAX_RESULTS = 4;
const MAX_TEXT = 400;

type SearchResult = {
  url?: string;
  title?: string;
  description?: string;
  highlights?: { highlights?: string[] | string | null; code?: string };
};

const cache = new Map<string, { at: number; value: Promise<LiveContext> }>();

/** Social and video sites rank well but are not citable sources for a policy brief. */
const EXCLUDE_DOMAINS = ["instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com", "youtube.com", "linkedin.com"];

export function buildQuery(regionName: string): string {
  // Åland's health service (ÅHS) publishes in Swedish; a Finnish query finds only national reports.
  if (/ahvenanmaa|åland/i.test(regionName)) return "Ålands hälso- och sjukvård ÅHS cancervård vårdgaranti";
  return `"${regionName}" syöpä hoitoon pääsy syöpähoito`;
}

function clean(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1).trimEnd()}…` : t;
}

/** Turns a Context.dev /web/search response into citable snippets. Pure; exported for tests. */
export function toSnippets(body: unknown, idPrefix = "live"): LiveSnippet[] {
  const results = (body as { results?: SearchResult[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: LiveSnippet[] = [];
  for (const r of results) {
    if (!r?.url || !/^https?:\/\//.test(r.url)) continue;
    const h = r.highlights;
    const hl = h?.code === "SUCCESS" ? (Array.isArray(h.highlights) ? h.highlights.join(" … ") : h.highlights) : null;
    const text = clean(hl || r.description || "");
    if (!text) continue;
    out.push({ id: `${idPrefix}:${out.length + 1}`, title: clean(r.title || r.url), url: r.url, text });
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

async function fetchLive(query: string, apiKey: string, idPrefix: string): Promise<LiveContext> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      numResults: MAX_RESULTS + 2,
      country: "fi",
      languages: ["fi", "sv"],
      excludeDomains: EXCLUDE_DOMAINS,
      highlightsOptions: { enabled: true, maxCharacters: MAX_TEXT },
      timeoutOpts: { milliseconds: TIMEOUT_MS, behavior: "return-partial" },
      tags: ["gap-radar"],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS + 2_000),
  });
  if (!res.ok) throw new Error(`Context.dev ${res.status}`);
  const snippets = toSnippets(await res.json(), idPrefix);
  return { status: snippets.length ? "ok" : "empty", snippets, fetchedAt: new Date().toISOString() };
}

/** Shared cached, never-throwing lookup. Failures are not cached for 24 h. */
function cached(key: string, query: string, idPrefix: string): Promise<LiveContext> {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) return Promise.resolve({ status: "not-configured", snippets: [], fetchedAt: null });
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = fetchLive(query, apiKey, idPrefix).catch((e) => {
    console.warn("[context] live search failed:", e instanceof Error ? e.message : e);
    cache.delete(key);
    return { status: "error", snippets: [], fetchedAt: null } satisfies LiveContext;
  });
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Never throws: on any failure the brief still renders without live context. */
export function getLiveContext(regionName: string): Promise<LiveContext> {
  return cached(regionName, buildQuery(regionName), "live");
}

/** Public pages from a better-performing peer county about how it runs the programme. Ids are "peer:<n>". */
export function peerQuery(twinName: string, ind: Pick<Indicator, "nameFi" | "stage">): string {
  // Screening (detection) is about invitations and reminders; survival (outcome) is about the care pathway.
  const suffix = ind.stage === "outcome" ? "syöpä hoitoketju hoitoon pääsy" : "seulonta kutsu muistutus";
  return `"${twinName}" ${ind.nameFi} ${suffix}`;
}

export function getPeerPractices(twinName: string, ind: Pick<Indicator, "id" | "nameFi" | "stage">): Promise<LiveContext> {
  return cached(`peer:${twinName}:${ind.id}`, peerQuery(twinName, ind), "peer");
}
