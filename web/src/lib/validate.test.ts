import { describe, expect, it } from "vitest";
import { validateBrief } from "./validate";
import type { Brief, GapFacts } from "./types";

const facts: GapFacts[] = [{
  indicatorId: 1, regionId: 10, year: 2023, value: 60.4, national: 70, bestQuartile: 75.5,
  gapToNational: -9.6, gapToBestQuartile: -15.1, rank: 18, rankOf: 21, trend3y: -2.3, target: null, gapToTarget: null, status: "behind",
}];
const known = ["strategy-p33-3.1", "sotkanet:1"];
const rec = (action: string, sources = ["sotkanet:1"]) => ({ action, owner: "o", timeframe: "6 months", goal3Indicator: "3.2", sources });

const valid = (): Brief => ({
  headline: "Screening at 60,4% vs 70% nationally in 2023",
  finding: "Ranked 18 of 21, 9.6 points behind; fell 2.3 points in 3 years (Goal 3.2).",
  pathwayStage: "detection",
  recommendations: [rec("Close the 15.1 point gap"), rec("Do 2 things", ["strategy-p33-3.1"]), rec("Target 75.5% by 2027")],
  limitations: [], generatedBy: "fallback",
});

describe("validateBrief", () => {
  it("accepts a valid brief", () => {
    expect(validateBrief(valid(), facts, known)).toEqual([]);
  });
  it("rejects a recommendation without sources", () => {
    const b = valid(); b.recommendations[0].sources = [];
    expect(validateBrief(b, facts, known).join()).toMatch(/no sources/);
  });
  it("rejects an unknown source", () => {
    const b = valid(); b.recommendations[1].sources = ["made-up"];
    expect(validateBrief(b, facts, known).join()).toMatch(/unknown source/);
  });
  it("rejects an invented number", () => {
    const b = valid(); b.finding = "Coverage dropped by 42.7 points";
    expect(validateBrief(b, facts, known).join()).toMatch(/42.7/);
  });
  it("ignores document references like THL guidance 21/2016 and action 3.1.2", () => {
    const b = valid();
    b.recommendations[1] = rec("Track access against THL guidance 21/2016 and roadmap action 3.1.2.");
    expect(validateBrief(b, facts, known)).toEqual([]);
    b.finding = "Guidance 21/2016 says 42.7 days";
    expect(validateBrief(b, facts, known).join()).toMatch(/42.7/);
  });
  it("rejects wrong recommendation count", () => {
    const b = valid(); b.recommendations.pop();
    expect(validateBrief(b, facts, known).join()).toMatch(/exactly 3/);
  });
  it("accepts impact numbers only when passed as extra", () => {
    const b = valid();
    b.finding = "About 57 more of every 1,000 invited need to attend.";
    expect(validateBrief(b, facts, known).join()).toMatch(/57/);
    expect(validateBrief(b, facts, known, [57])).toEqual([]);
  });
});
