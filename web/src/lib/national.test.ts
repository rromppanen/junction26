import { describe, expect, it } from "vitest";
import { REGISTRY } from "./pathwayData";
import { countyPathway, rankBreaks } from "./pathway";
import { earlyWarnings, improvers, languageGaps, nationalPathway } from "./national";
import type { GapFacts } from "./types";

describe("nationalPathway", () => {
  const n = nationalPathway(REGISTRY.colorectal);

  it("matches the Registry's national counts for the settled year", () => {
    expect(n.year).toBe(2023);
    expect(n.positive).toBe(16501);
    expect(n.unexamined).toBe(3536);
    expect(n.unexaminedPct).toBe(21.4);
    expect(n.notReturned).toBeGreaterThan(100000);
  });

  it("finds 28% of the 2022 cohort's bowel cancers missed by the programme", () => {
    expect(n.missed).toEqual({ cohortYear: 2022, total: 1241, nonParticipant: 259, positiveNoColonoscopy: 87, sharePct: 27.9 });
  });

  it("sums the best-quarter gains over every county in the programme", () => {
    let colonoscopies = 0;
    for (const id of Object.keys(REGISTRY.colorectal.counties[2023]).map(Number)) {
      const p = countyPathway(REGISTRY.colorectal, id, 2023)!;
      colonoscopies += rankBreaks(p).find((b) => b.kind === "service")!.people;
    }
    expect(n.bestQuarter.colonoscopies).toBe(colonoscopies);
    expect(n.bestQuarter.counties).toBe(Object.keys(REGISTRY.colorectal.counties[2023]).length);
  });
});

describe("languageGaps", () => {
  it("compares other mother tongues with Finnish, Swedish or Sami in each programme", () => {
    const g = languageGaps(REGISTRY.groups);
    expect(g.map((x) => x.programme)).toEqual(["breast", "colorectal", "cervical"]);
    for (const x of g) expect(x.other).toBeLessThan(x.native);
    expect(g.find((x) => x.programme === "colorectal")).toMatchObject({ other: 53.4, native: 74.5 });
  });
});

describe("earlyWarnings", () => {
  const f = (regionId: number, trend3y: number | null, target: number | null = 80): GapFacts => ({
    indicatorId: 3621, regionId, year: 2024, value: 78, national: 81, bestQuartile: 85, gapToNational: -3, gapToBestQuartile: -7,
    rank: 1, rankOf: 22, trend3y, target, gapToTarget: target === null ? null : 78 - target, status: "behind",
  });

  it("lists falls of a point or more, largest first, screening only", () => {
    const w = earlyWarnings([f(1, -0.5), f(2, -1.0), f(3, -2.4), f(4, null), f(5, -3, null)]);
    expect(w.map((x) => x.regionId)).toEqual([3, 2]);
    expect(w[0]).toMatchObject({ drop: 2.4, belowTarget: true });
  });

  it("lists rises of a point or more as practices to replicate, largest first", () => {
    const up = improvers([f(1, 0.5), f(2, 1.0), f(3, 3.2), f(4, -2)]);
    expect(up.map((x) => x.regionId)).toEqual([3, 2]);
    expect(up[0].rise).toBe(3.2);
  });
});
