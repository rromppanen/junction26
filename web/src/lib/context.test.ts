import { afterEach, describe, expect, it, vi } from "vitest";
import { getLiveContext, toSnippets } from "./context";

const result = (over: object = {}) => ({
  url: "https://example.fi/syopa",
  title: "Syöpähoito",
  description: "Kuvaus",
  highlights: { highlights: ["Hoitoon pääsy 14 päivää"], code: "SUCCESS" },
  ...over,
});

describe("toSnippets", () => {
  it("prefers highlights, numbers ids and caps results", () => {
    const s = toSnippets({ results: Array.from({ length: 6 }, () => result()) });
    expect(s).toHaveLength(4);
    expect(s[0]).toMatchObject({ id: "live:1", text: "Hoitoon pääsy 14 päivää", url: "https://example.fi/syopa" });
    expect(s[3].id).toBe("live:4");
  });

  it("falls back to description when highlights were not scraped", () => {
    const [s] = toSnippets({ results: [result({ highlights: { highlights: null, code: "WEBSITE_BLOCKED" } })] });
    expect(s.text).toBe("Kuvaus");
  });

  it("skips results without a URL or text, and tolerates bad bodies", () => {
    expect(toSnippets({ results: [result({ url: "" }), result({ description: "", highlights: null })] })).toEqual([]);
    expect(toSnippets(null)).toEqual([]);
    expect(toSnippets({ error: "x" })).toEqual([]);
  });

  it("truncates long text", () => {
    const [s] = toSnippets({ results: [result({ highlights: { highlights: "a".repeat(1000), code: "SUCCESS" } })] });
    expect(s.text.length).toBeLessThanOrEqual(400);
  });
});

describe("getLiveContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports not-configured without a key and makes no request", async () => {
    vi.stubEnv("CONTEXT_DEV_API_KEY", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await getLiveContext("A")).status).toBe("not-configured");
    expect(f).not.toHaveBeenCalled();
  });

  it("returns an empty error result instead of throwing", async () => {
    vi.stubEnv("CONTEXT_DEV_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 402 })));
    const ctx = await getLiveContext("B");
    expect(ctx).toMatchObject({ status: "error", snippets: [] });
  });

  it("sends the key and caches successful results", async () => {
    vi.stubEnv("CONTEXT_DEV_API_KEY", "k");
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [result()] })));
    vi.stubGlobal("fetch", f);
    const a = await getLiveContext("C");
    const b = await getLiveContext("C");
    expect(a.status).toBe("ok");
    expect(b).toBe(a);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer k");
  });
});
