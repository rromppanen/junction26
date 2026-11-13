import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/brief/route";

const selection = { year: 2023, dimension: "Language", cohort: "Routine + risk-group screening", group: "Other / missing language", metric: "participation", useAI: true };
const request = (body = selection) => new Request("http://localhost/api/brief", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("server model boundary", () => {
  it("makes no external call when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", ""); const external = vi.fn(); vi.stubGlobal("fetch", external);
    const response = await POST(request()); const result = await response.json();
    expect(result.mode).toBe("template"); expect(result.reason).toContain("No model key"); expect(external).not.toHaveBeenCalled();
  });
  it("falls back on provider failure without exposing provider responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("provider detail", { status: 429 })));
    const result = await (await POST(request())).json();
    expect(result.mode).toBe("template"); expect(JSON.stringify(result)).not.toContain("provider detail");
  });
  it("rejects model drafts that invent numbers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-placeholder");
    const content = { headline: "Review this gap", interpretation: "The solution saves 500 lives.", nextQuestion: "What happens next?", evidenceIds: ["report", "quality"] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }] })));
    expect((await (await POST(request())).json()).mode).toBe("template");
  });
  it("returns a validated draft and labels a later cache hit", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-placeholder");
    const content = { headline: "A measured difference warrants review", interpretation: "Causes remain unresolved. Verify source completeness before choosing an action.", nextQuestion: "Are invitations reaching the intended participants?", evidenceIds: ["report", "quality"] };
    const external = vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }] }));
    vi.stubGlobal("fetch", external);
    const first = await (await POST(request())).json(); expect(first.mode).toBe("ai"); expect(first.draft).toEqual(content);
    expect((await (await POST(request())).json()).mode).toBe("cached-ai"); expect(external).toHaveBeenCalledTimes(1);
  });
});
