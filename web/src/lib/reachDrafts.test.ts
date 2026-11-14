import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReachDrafts, resetReachDraftsCache, type Draft } from "./reachDrafts";
import type { ReachPlan } from "./reach";
import type { Indicator } from "./types";

const ind = { id: 1, slug: "breast-screening", nameEn: "Breast cancer screening" } as Indicator;
const plan = (langs: string[]): ReachPlan => ({
  indicatorId: 1, areas: [{ regionId: 1, name: "A" }], year: 2025, actions: [],
  languages: langs.map((language) => ({ language, count: 10, sharePct: 1 })),
});
// Script-correct sample text per language, with both placeholders.
const SAMPLE: Record<string, string> = {
  Russian: "Приглашаем на бесплатный скрининг. Звоните [phone] или [link].",
  Arabic: "ندعوكم إلى فحص مجاني. اتصلوا [phone] أو [link].",
  Somali: "Waxaan kugu casuumaynaa baaritaan bilaash ah. Wac [phone] ama [link].",
  English: "You are invited to free screening. Call [phone] or go to [link].",
};
const draft = (language: string, invitation = SAMPLE[language] ?? `Invitation ${language} [phone] [link]`): Draft =>
  ({ language, invitation, sms: invitation.slice(0, 150), backTranslation: "You are invited. Call [phone] or [link]." });

beforeEach(() => resetReachDraftsCache());

describe("getReachDrafts", () => {
  it("returns generated drafts with status ok", async () => {
    const gen = vi.fn().mockResolvedValue([draft("Russian"), draft("Arabic")]);
    const r = await getReachDrafts(plan(["Russian", "Arabic"]), ind, gen);
    expect(r.status).toBe("ok");
    expect(r.drafts.map((d) => d.language)).toEqual(["Russian", "Arabic"]);
  });
  it("caches per indicator and sorted language list (order-insensitive)", async () => {
    const gen = vi.fn().mockResolvedValue([draft("Russian"), draft("Arabic")]);
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

  it("rejects a draft that uses the wrong alphabet, retries once, and withholds it if still wrong", async () => {
    const bad = draft("Somali", "Waxaad ballansan kartaa ё badali kartaa [phone] [link]");
    const gen = vi.fn().mockResolvedValue([draft("Russian"), bad]);
    const r = await getReachDrafts(plan(["Russian", "Somali"]), ind, gen);
    expect(gen).toHaveBeenCalledTimes(2);
    expect(r.status).toBe("ok");
    expect(r.drafts.map((d) => d.language)).toEqual(["Russian"]);
    expect(r.withheld).toEqual([{ language: "Somali", reason: expect.stringMatching(/alphabet/) }]);
  });

  it("keeps the retry's answer when it fixes the problem", async () => {
    const gen = vi.fn()
      .mockResolvedValueOnce([draft("Russian", "Приглашаем free screening [phone] [link] ё ok"), draft("Somali", "Wac ё [phone] [link]")])
      .mockResolvedValueOnce([draft("Russian"), draft("Somali")]);
    const r = await getReachDrafts(plan(["Russian", "Somali"]), ind, gen);
    expect(r.drafts.map((d) => d.language)).toEqual(["Russian", "Somali"]);
    expect(r.withheld).toEqual([]);
  });

  it("rejects missing placeholders and an SMS over 160 characters", async () => {
    const noLink = draft("English", "You are invited. Call [phone].");
    const longSms = { ...draft("Arabic"), sms: "ا".repeat(161) + " [phone] [link]" };
    const gen = vi.fn().mockResolvedValue([noLink, longSms]);
    const r = await getReachDrafts(plan(["English", "Arabic"]), ind, gen);
    expect(r.status).toBe("fallback");
    expect(r.withheld.map((w) => w.reason).join(" ")).toMatch(/\[link\][\s\S]*160|160[\s\S]*\[link\]/);
  });
});
