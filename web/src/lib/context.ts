// Adapted from origin/feat/gap-radar:web/src/lib/context.ts.
// Uses the same Context.dev endpoint, Bearer key and highlight response format.
import type { Source } from "./pipeline/types";

export type LiveContext = { status: "ok" | "empty" | "not-configured" | "error"; snippets: Source[]; fetchedAt: string | null };
const ENDPOINT = "https://api.context.dev/v1/web/search";
const MAX_TEXT = 900;
const TRUSTED = ["syoparekisteri.fi", "cancerregistry.fi", "thl.fi", "fican.fi", "kaypahoito.fi", "stm.fi", "cochrane.org", "cochranelibrary.com", "pubmed.ncbi.nlm.nih.gov"];
const cache = new Map<string, { at: number; value: LiveContext }>();
const clean = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);

export function toSnippets(body: unknown): Source[] {
  const results = (body as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const snippets: Source[] = [];
  for (const item of results) {
    if (!item || typeof item !== "object") continue;
    const result = item as { url?: unknown; title?: unknown; description?: unknown; highlights?: { code?: string; highlights?: unknown } };
    if (typeof result.url !== "string") continue;
    let url: URL;
    try { url = new URL(result.url); } catch { continue; }
    if (url.protocol !== "https:" || url.username || url.password || !TRUSTED.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) continue;
    if (snippets.some(source => source.url === url.href)) continue;
    const highlights = result.highlights?.code === "SUCCESS" ? result.highlights.highlights : null;
    const text = clean(typeof highlights === "string" ? highlights : Array.isArray(highlights) ? highlights.filter(v => typeof v === "string").join(" … ") : typeof result.description === "string" ? result.description : "");
    if (!text) continue;
    snippets.push({ id: `live:${snippets.length + 1}`, title: clean(typeof result.title === "string" ? result.title : url.hostname), url: url.href, text,
      locator: "Context.dev search highlight", kind: "web", limitation: "Retrieved excerpt, not independently appraised. Verify the original source and local applicability; not proof of causation or treatment benefit." });
    if (snippets.length === 4) break;
  }
  return snippets;
}

export async function getLiveEvidence(query: string, signal?: AbortSignal): Promise<LiveContext> {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) return { status: "not-configured", snippets: [], fetchedAt: null };
  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.value;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, numResults: 6, country: "fi", languages: ["en", "fi", "sv"],
        includeDomains: TRUSTED, highlightsOptions: { enabled: true, maxCharacters: MAX_TEXT },
        timeoutOpts: { milliseconds: 8000, behavior: "return-partial" }, tags: ["care-equity-lab"] }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Context.dev request failed.");
    const fetchedAt = new Date().toISOString();
    const snippets = toSnippets(await response.json()).map(source => ({ ...source, retrievedAt: fetchedAt }));
    const value: LiveContext = { status: snippets.length ? "ok" : "empty", snippets, fetchedAt };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(query, { at: Date.now(), value });
    return value;
  } catch {
    signal?.throwIfAborted();
    return { status: "error", snippets: [], fetchedAt: null };
  }
}
