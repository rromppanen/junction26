// Live county context from the open web via Context.dev (server-only: uses CONTEXT_DEV_API_KEY).
// Finds the county's own public pages about cancer care and access times, so the analyst can build
// on what the county already does. Any failure returns [] and the brief still renders.

export type LiveSnippet = {
  id: string; // "live:<n>", cited by the analyst like any other source id
  title: string;
  url: string;
  text: string; // short description returned by the search
};

const ENDPOINT = "https://api.context.dev/v1/web/search";
const TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const cache = new Map<string, { at: number; snippets: LiveSnippet[] }>();

export function liveContextEnabled(): boolean {
  return Boolean(process.env.CONTEXT_DEV_API_KEY);
}

export function countyQuery(regionName: string): string {
  return `${regionName} syöpä hoitoonpääsy hoitoketju`;
}

type SearchResult = { url?: string; title?: string; description?: string };

export function toSnippets(results: SearchResult[], max = 4): LiveSnippet[] {
  return results
    .filter((r) => r.url && (r.title || r.description))
    .slice(0, max)
    .map((r, i) => ({
      id: `live:${i + 1}`,
      title: (r.title ?? r.url ?? "").trim(),
      url: r.url!,
      text: (r.description ?? "").trim().slice(0, 300),
    }));
}

export async function getCountyContext(regionName: string): Promise<LiveSnippet[]> {
  const key = process.env.CONTEXT_DEV_API_KEY;
  if (!key) return [];
  const hit = cache.get(regionName);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.snippets;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: countyQuery(regionName), numResults: 6, country: "fi", descriptionMaxCharacters: 300 }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn("[context] search failed:", res.status, (await res.text()).slice(0, 200));
      return [];
    }
    const json = (await res.json()) as { results?: SearchResult[] };
    const snippets = toSnippets(json.results ?? []);
    cache.set(regionName, { at: Date.now(), snippets });
    return snippets;
  } catch (err) {
    console.warn("[context] search error:", err instanceof Error ? err.message : err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
