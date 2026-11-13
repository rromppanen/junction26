import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReachDrafts, resetReachDraftsCache, type Draft } from "./reachDrafts";
import type { ReachPlan } from "./reach";
import type { Indicator } from "./types";

const ind = { id: 1, slug: "breast-screening", nameEn: "Breast cancer screening" } as Indicator;
const plan = (langs: string[]): ReachPlan => ({
  indicatorId: 1, areas: [{ regionId: 1, name: "A" }], year: 2025, actions: [],
  languages: langs.map((language) => ({ language, count: 10, sharePct: 1 })),
});
const draft = (language: string): Draft => ({ language, invitation: `inv ${language} [phone] [link]`, sms: "sms", backTranslation: "back" });

beforeEach(() => resetReachDraftsCache());

describe("getReachDrafts", () => {
  it("returns generated drafts with status ok", async () => {
    const gen = vi.fn().mockResolvedValue([draft("Russian"), draft("Arabic")]);
    const r = await getReachDrafts(plan(["Russian", "Arabic"]), ind, gen);
    expect(r.status).toBe("ok");
    expect(r.drafts.map((d) => d.language)).toEqual(["Russian", "Arabic"]);
  });
  it("caches per indicator and sorted language list (order-insensitive)", async () => {
    const gen = vi.fn().mockResolvedValue([draft("Russian")]);
    await getReachDrafts(plan(["Russian", "Arabic"]), ind, gen);
    await getReachDrafts(plan(["Arabic", "Russian"]), ind, gen);
    expect(gen).toHaveBeenCalledTimes(1);
    await getReachDrafts(plan(["Arabic"]), ind, gen);
    expect(gen).toHaveBeenCalledTimes(2);
  });
  it("falls back to an English template on error, and never caches the failure", async () => {
    const gen = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce([draft("Russian")]);
    const bad = await getReachDrafts(plan(["Russian"]), ind, gen);
    expect(bad.status).toBe("fallback");
    expect(bad.drafts).toHaveLength(1);
    expect(bad.drafts[0].language).toBe("English");
    expect(bad.drafts[0].invitation).toContain("[phone]");
    expect(bad.drafts[0].sms.length).toBeLessThanOrEqual(160);
    const good = await getReachDrafts(plan(["Russian"]), ind, gen);
    expect(good.status).toBe("ok");
    expect(gen).toHaveBeenCalledTimes(2);
  });
  it("falls back on an empty or malformed answer", async () => {
    expect((await getReachDrafts(plan(["Russian"]), ind, vi.fn().mockResolvedValue([]))).status).toBe("fallback");
  });
  it("falls back on timeout", async () => {
    const gen = vi.fn(() => new Promise<Draft[]>(() => {}));
    const r = await getReachDrafts(plan(["Russian"]), ind, gen, 20);
    expect(r.status).toBe("fallback");
  });
  it("falls back without a key when using the default generator", async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      expect((await getReachDrafts(plan(["Russian"]), ind)).status).toBe("fallback");
    } finally {
      if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
    }
  });
});
