import { afterEach, describe, expect, it, vi } from "vitest";
import { getLiveEvidence, toSnippets } from "./context";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("ported Context.dev adapter", () => {
  it("uses highlight text, caps excerpts and filters untrusted or duplicate URLs", () => {
    const results = [
      { url: "https://thl.fi/guidance", title: "Guidance", description: "Fallback", highlights: { code: "SUCCESS", highlights: ["Review referrals."] } },
      { url: "https://thl.fi/guidance", description: "Duplicate" },
      { url: "https://thl.fi.evil.example/report", description: "Untrusted" },
      { url: "http://127.0.0.1/internal", description: "Local" },
      { url: "https://user:password@thl.fi/report", description: "Credentials" },
      { url: "https://syoparekisteri.fi/report", description: "a".repeat(1000) },
    ];
    const snippets = toSnippets({ results });
    expect(snippets).toHaveLength(2); expect(snippets[0]).toMatchObject({ id: "live:1", text: "Review referrals." });
    expect(snippets[1].text).toHaveLength(900); expect(toSnippets(null)).toEqual([]);
  });
  it("does not make requests without credentials", async () => {
    vi.stubEnv("CONTEXT_DEV_API_KEY", ""); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await getLiveEvidence("missing-key-test")).status).toBe("not-configured"); expect(fetch).not.toHaveBeenCalled();
  });
  it("does not cache failure but caches a successful result", async () => {
    vi.stubEnv("CONTEXT_DEV_API_KEY", "test-only-context-key");
    const fetch = vi.fn().mockResolvedValueOnce(new Response("private provider detail", { status: 403 })).mockResolvedValue(Response.json({ results: [{ url: "https://thl.fi/test-context", description: "Public guidance." }] }));
    vi.stubGlobal("fetch", fetch);
    expect((await getLiveEvidence("context-cache-test")).status).toBe("error");
    expect((await getLiveEvidence("context-cache-test")).status).toBe("ok");
    expect((await getLiveEvidence("context-cache-test")).status).toBe("ok");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
