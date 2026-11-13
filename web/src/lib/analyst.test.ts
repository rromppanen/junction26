import { describe, expect, it } from "vitest";
import { fallbackBrief } from "./analyst";
import type { GapFacts, Indicator } from "./types";

const ind: Indicator = {
  id: 1, slug: "breast", nameEn: "Breast screening", nameFi: "Rinta", unit: "%", higherIsBetter: true, stage: "detection",
  strategyGoal: "Goal 2", target: { value: 80, label: "80%", evidenceId: "strategy-goal2-screening-80" }, gender: "female", sourceUrl: "u",
};
const f: GapFacts = {
  indicatorId: 1, regionId: 1, year: 2023, value: 74.3, national: 76, bestQuartile: 80,
  gapToNational: -1.7, gapToBestQuartile: -5.7, rank: 5, rankOf: 21, trend3y: null, target: 80, gapToTarget: -5.7, status: "behind",
};

describe("fallbackBrief", () => {
  it("mentions people per 1,000 needed to reach the target", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [f], indicators: [ind] });
    expect(b.finding).toMatch(/about 57 more of every 1,000/);
  });
});
