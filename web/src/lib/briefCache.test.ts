import { describe, expect, it, vi } from "vitest";
import { createBriefCache } from "./briefCache";
import type { AnalystInput } from "./analyst";
import type { Brief } from "./types";

const brief = (h: string): Brief => ({ headline: h, finding: "", pathwayStage: "detection", recommendations: [], limitations: [], generatedBy: "fallback" });
const input = (language?: "en" | "fi"): AnalystInput => ({ regionName: "Helsinki", facts: [], indicators: [], language });

describe("createBriefCache", () => {
  it("calls the generator once for two calls within 10 minutes", async () => {
    let t = 0;
    const gen = vi.fn(async () => brief("a"));
    const get = createBriefCache(gen, () => t);
    await get(input("fi"));
    t += 9 * 60_000;
    await get(input("fi"));
    expect(gen).toHaveBeenCalledTimes(1);
    t += 2 * 60_000;
    await get(input("fi"));
    expect(gen).toHaveBeenCalledTimes(2);
  });
  it("calls again for another language or region", async () => {
    const gen = vi.fn(async () => brief("a"));
    const get = createBriefCache(gen, () => 0);
    await get(input("fi"));
    await get(input("en"));
    await get(input());
    await get({ ...input("fi"), regionName: "Lappi" });
    expect(gen).toHaveBeenCalledTimes(3);
  });
  it("shares in-flight requests", async () => {
    const gen = vi.fn(() => new Promise<Brief>((r) => setTimeout(() => r(brief("a")), 10)));
    const get = createBriefCache(gen, () => 0);
    await Promise.all([get(input("fi")), get(input("fi"))]);
    expect(gen).toHaveBeenCalledTimes(1);
  });
  it("does not cache a rejected promise", async () => {
    const gen = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(brief("ok"));
    const get = createBriefCache(gen, () => 0);
    await expect(get(input("fi"))).rejects.toThrow();
    expect((await get(input("fi"))).headline).toBe("ok");
    expect(gen).toHaveBeenCalledTimes(2);
  });
});
