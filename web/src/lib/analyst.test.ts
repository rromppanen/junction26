import { describe, expect, it } from "vitest";
import { extraNumbers, fallbackBrief } from "./analyst";
import type { EquityFacts } from "./equity";
import { validateBrief } from "./validate";
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

const muni = (id: number, name: string) => ({ id, name, isNational: false, kind: "municipality" as const, parentId: 1 });
const equity: EquityFacts = {
  municipalityCount: 10,
  applicable: true,
  lagging: [
    {
      indicator: ind, year: 2023, countyValue: 74.3,
      rows: [
        { region: muni(5, "Siuntio"), value: 66.8, gapToCounty: -7.5 },
        { region: muni(6, "Hanko"), value: 69.7, gapToCounty: -4.6 },
      ],
    },
  ],
  associations: [
    { indicator: ind, context: { ...ind, id: 180, slug: "education-level" }, year: 2023, rho: -0.88, n: 10, sentence: "s" },
  ],
};

describe("equity in the brief", () => {
  it("fallback finding names the municipalities furthest behind", () => {
    const b = fallbackBrief({ regionName: "Länsi-Uusimaa", facts: [f], indicators: [ind], equity });
    expect(b.finding).toMatch(/Siuntio \(66\.8%\)/);
    expect(b.finding).toMatch(/Hanko \(69\.7%\)/);
  });

  it("validator accepts municipality values, gaps, rho and n via extra numbers", () => {
    const input = { regionName: "X", facts: [f], indicators: [ind], equity };
    const brief = fallbackBrief(input);
    brief.headline = "Siuntio is at 66.8%, 7.5 points below; rho 0.88 across 10 municipalities";
    expect(validateBrief(brief, [f], ["strategy-goal2-screening-80"], extraNumbers(input)).filter((e) => e.startsWith("Number"))).toEqual([]);
    expect(validateBrief(brief, [f], [], []).filter((e) => e.startsWith("Number")).length).toBeGreaterThan(0);
  });
});
