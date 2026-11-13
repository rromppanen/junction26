import { describe, expect, it } from "vitest";
import { impactFacts, peoplePer1000ToReach } from "./impact";
import type { GapFacts } from "./types";

const fact = (indicatorId: number, value: number | null, national: number | null, target: number | null): GapFacts => ({
  indicatorId, regionId: 1, year: 2023, value, national, bestQuartile: null,
  gapToNational: null, gapToBestQuartile: null, rank: null, rankOf: 0, trend3y: null, target, gapToTarget: null, status: "behind",
});

describe("peoplePer1000ToReach", () => {
  it("rounds up whole people per 1,000", () => {
    expect(peoplePer1000ToReach(74.3, 80)).toBe(57);
  });
  it("is 0 when already reached", () => {
    expect(peoplePer1000ToReach(85, 80)).toBe(0);
  });
  it("never returns -0 for tiny or zero gaps", () => {
    expect(Object.is(peoplePer1000ToReach(80, 80), 0)).toBe(true);
    expect(Object.is(peoplePer1000ToReach(80.04, 80), 0)).toBe(true);
    expect(Object.is(peoplePer1000ToReach(79.96, 80), 0)).toBe(true);
  });
  it("is null on missing input", () => {
    expect(peoplePer1000ToReach(null, 80)).toBeNull();
    expect(peoplePer1000ToReach(70, null)).toBeNull();
  });
});

describe("impactFacts", () => {
  it("returns one row per indicator that has a target", () => {
    const rows = impactFacts([fact(1, 74.3, 76, 80), fact(2, 50, 55, null), fact(3, 85, 76, 80)]);
    expect(rows).toEqual([
      { indicatorId: 1, toTarget: 57, toNational: 17 },
      { indicatorId: 3, toTarget: 0, toNational: 0 },
    ]);
  });
});
