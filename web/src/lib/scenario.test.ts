import { describe, expect, it } from "vitest";
import { computeScenario, type ScenarioInputs } from "./scenario";

const base: ScenarioInputs = { today: 74.3, target: 80, invitedPerYear: null, costPerScreen: null, cancersPer1000Screened: null };

describe("computeScenario", () => {
  it("sizes the gap per 1,000 with no other inputs", () => {
    expect(computeScenario(base)).toEqual({
      extraPer1000: 57, extraPerYear: null, extraCostPerYear: null, extraCancersPerYear: null, costPerExtraCancer: null,
    });
  });
  it("scales to people per year", () => {
    expect(computeScenario({ ...base, invitedPerYear: 30000 }).extraPerYear).toBe(1710);
  });
  it("computes cost, cancers and cost per cancer", () => {
    const r = computeScenario({ ...base, invitedPerYear: 30000, costPerScreen: 50, cancersPer1000Screened: 5 });
    expect(r.extraCostPerYear).toBe(85500);
    expect(r.extraCancersPerYear).toBe(8.6);
    expect(r.costPerExtraCancer).toBe(9942);
  });
  it("cost does not need the cancer rate", () => {
    const r = computeScenario({ ...base, invitedPerYear: 30000, costPerScreen: 50 });
    expect(r.extraCostPerYear).toBe(85500);
    expect(r.extraCancersPerYear).toBeNull();
    expect(r.costPerExtraCancer).toBeNull();
  });
  it("cost per cancer is null when no cancers are expected", () => {
    const r = computeScenario({ ...base, invitedPerYear: 30000, costPerScreen: 50, cancersPer1000Screened: 0 });
    expect(r.extraCancersPerYear).toBe(0);
    expect(r.costPerExtraCancer).toBeNull();
  });
  it("returns zeros when the target is already reached", () => {
    const r = computeScenario({ today: 85, target: 80, invitedPerYear: 30000, costPerScreen: 50, cancersPer1000Screened: 5 });
    expect(r).toEqual({ extraPer1000: 0, extraPerYear: 0, extraCostPerYear: 0, extraCancersPerYear: 0, costPerExtraCancer: null });
  });
  it("treats NaN and negative inputs as missing", () => {
    expect(computeScenario({ ...base, invitedPerYear: NaN, costPerScreen: 50 }).extraPerYear).toBeNull();
    expect(computeScenario({ ...base, invitedPerYear: -5 }).extraPerYear).toBeNull();
    expect(computeScenario({ ...base, invitedPerYear: 30000, costPerScreen: NaN }).extraCostPerYear).toBeNull();
    expect(computeScenario({ ...base, invitedPerYear: 30000, cancersPer1000Screened: -1 }).extraCancersPerYear).toBeNull();
  });
});
