import { describe, expect, it } from "vitest";
import { diagnosePathway } from "./fingerprint";
import type { GapFacts, GapStatus, Indicator, PathwayStage } from "./types";

const ind = (id: number, stage: PathwayStage): Indicator => ({
  id, slug: `i${id}`, nameEn: `I${id}`, nameFi: `I${id}`, unit: "%", higherIsBetter: true, stage,
  strategyGoal: "g", gender: "total", sourceUrl: "u",
});
const fact = (indicatorId: number, status: GapStatus): GapFacts => ({
  indicatorId, regionId: 1, year: 2023, value: status === "no-data" ? null : 50, national: 60, bestQuartile: 70,
  gapToNational: null, gapToBestQuartile: null, rank: null, rankOf: 0, trend3y: null, target: null, gapToTarget: null, status,
});
const inds = [ind(1, "detection"), ind(2, "detection"), ind(3, "outcome"), ind(4, "outcome")];

describe("diagnosePathway", () => {
  it("detection when only detection is behind", () => {
    const r = diagnosePathway([fact(1, "behind"), fact(2, "on-par"), fact(3, "ahead"), fact(4, "on-par")], inds);
    expect(r).toEqual({ pattern: "detection", detectionBehind: 1, detectionTotal: 2, outcomeBehind: 0, outcomeTotal: 2 });
  });
  it("after-detection when only outcome is behind", () => {
    const r = diagnosePathway([fact(1, "on-par"), fact(2, "ahead"), fact(3, "behind"), fact(4, "on-par")], inds);
    expect(r.pattern).toBe("after-detection");
  });
  it("both / none", () => {
    expect(diagnosePathway([fact(1, "behind"), fact(2, "ahead"), fact(3, "behind"), fact(4, "ahead")], inds).pattern).toBe("both");
    expect(diagnosePathway([fact(1, "ahead"), fact(2, "on-par"), fact(3, "ahead"), fact(4, "on-par")], inds).pattern).toBe("none");
  });
  it("unknown when every fact is no-data", () => {
    const r = diagnosePathway([fact(1, "no-data"), fact(2, "no-data"), fact(3, "no-data"), fact(4, "no-data")], inds);
    expect(r).toEqual({ pattern: "unknown", detectionBehind: 0, detectionTotal: 0, outcomeBehind: 0, outcomeTotal: 0 });
  });
  it("ignores no-data facts in totals", () => {
    const r = diagnosePathway([fact(1, "behind"), fact(2, "no-data"), fact(3, "no-data"), fact(4, "on-par")], inds);
    expect(r).toMatchObject({ pattern: "detection", detectionTotal: 1, outcomeTotal: 1 });
  });
});

import { describeFingerprint } from "./fingerprint";
import { fallbackBrief } from "./analyst";

describe("describeFingerprint", () => {
  it("does not claim survival is on par when there is no survival data", () => {
    const fp = diagnosePathway([fact(1, "behind"), fact(2, "behind"), fact(3, "no-data"), fact(4, "no-data")], inds);
    expect(fp.pattern).toBe("detection");
    const t = describeFingerprint(fp);
    expect(t).toMatch(/no survival data/);
    expect(t).not.toMatch(/on par/);
  });
  it("does not claim screening is on par when there is no screening data", () => {
    const t = describeFingerprint(diagnosePathway([fact(1, "no-data"), fact(2, "no-data"), fact(3, "behind"), fact(4, "ahead")], inds));
    expect(t).toMatch(/no screening data/);
  });
  it("one-sided none names the missing side; ahead is not called on par", () => {
    const t = describeFingerprint(diagnosePathway([fact(1, "ahead"), fact(2, "ahead"), fact(3, "no-data"), fact(4, "no-data")], inds));
    expect(t).toMatch(/no survival data/);
    expect(t).not.toMatch(/on par/);
    expect(describeFingerprint(diagnosePathway([fact(1, "ahead"), fact(2, "on-par"), fact(3, "ahead"), fact(4, "on-par")], inds)))
      .toMatch(/both at or above/);
  });
});

describe("fallbackBrief names the pattern", () => {
  it("with a gap", () => {
    const b = fallbackBrief({ regionName: "X", indicators: inds, facts: [{ ...fact(1, "behind"), gapToNational: -5 }, fact(3, "on-par")] });
    expect(b.headline).toMatch(/gap starts at detection/);
  });
  it("without a usable worst fact", () => {
    const b = fallbackBrief({ regionName: "X", indicators: inds, facts: [fact(1, "no-data")] });
    expect(b.headline).toMatch(/too little data to place the gap/);
  });
});
