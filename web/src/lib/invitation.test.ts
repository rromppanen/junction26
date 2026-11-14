import { describe, expect, it } from "vitest";
import {
  COST_PER_SCREEN,
  DEFAULT_LAYERS,
  NATIONAL_INVITED,
  NATIONAL_SEGMENTS,
  countySegments,
  runDesign,
  type Layer,
  type Segments,
} from "./invitation";

const seg: Segments = { native: { invited: 1000, attendance: 0.8 }, other: { invited: 100, attendance: 0.6 } };
const layer = (over: Partial<Layer>): Layer => ({ ...DEFAULT_LAYERS[0], ...over });

describe("countySegments", () => {
  it("reproduces the national figures for an average county", () => {
    const national = (NATIONAL_SEGMENTS.native.participated + NATIONAL_SEGMENTS.other.participated) / NATIONAL_INVITED;
    const s = countySegments({ women: 692744, attendancePct: national * 100, nationalWomen: 692744, foreignPer1000: 90, nationalForeignPer1000: 90 });
    expect(s.native.invited + s.other.invited).toBeCloseTo(NATIONAL_INVITED, 0);
    expect(s.other.invited).toBeCloseTo(NATIONAL_SEGMENTS.other.invited, 0);
    expect(s.native.attendance).toBeCloseTo(0.832, 3);
    expect(s.other.attendance).toBeCloseTo(0.608, 3);
  });

  it("keeps the county's measured attendance as the weighted mean", () => {
    const s = countySegments({ women: 50000, attendancePct: 74, nationalWomen: 692744, foreignPer1000: 250, nationalForeignPer1000: 90 });
    const mean = (s.native.invited * s.native.attendance + s.other.invited * s.other.attendance) / (s.native.invited + s.other.invited);
    expect(mean).toBeCloseTo(0.74, 6);
    expect(s.other.invited / (s.native.invited + s.other.invited)).toBeGreaterThan(0.15);
  });
});

describe("runDesign", () => {
  it("changes nothing with no layers", () => {
    const r = runDesign(seg, []);
    expect(r.extraScreened).toBe(0);
    expect(r.totalCost).toBe(0);
    expect(r.costPerExtra).toBeNull();
    expect(r.after.attendance).toBeCloseTo(r.before.attendance, 9);
  });

  it("converts a share of non-attenders and charges for letters and mammograms", () => {
    const r = runDesign(seg, [layer({ target: "all", reaches: "invited", effect: 0.1, costPerReached: 1 })]);
    // 200 + 40 missing; 10% come.
    expect(r.extraScreened).toBeCloseTo(24, 6);
    expect(r.layerCost).toBeCloseTo(1100, 6);
    expect(r.screenCost).toBeCloseTo(24 * COST_PER_SCREEN, 6);
  });

  it("applies layers to whoever is left, so two layers never claim the same woman", () => {
    const a = layer({ id: "rebook", reaches: "missing", effect: 0.5, costPerReached: 0 });
    const b = layer({ id: "second", reaches: "missing", effect: 0.5, costPerReached: 0 });
    const r = runDesign(seg, [a, b]);
    expect(r.extraScreened).toBeCloseTo(240 * 0.75, 6);
    expect(r.layers[1].reached).toBeCloseTo(120, 6);
  });

  it("targets only the other-language group when asked", () => {
    const r = runDesign(seg, [layer({ target: "other", reaches: "invited", effect: 0.5, costPerReached: 1 })]);
    expect(r.layers[0].reached).toBe(100);
    expect(r.extraScreened).toBeCloseTo(20, 6);
    expect(r.after.bySegment.native).toBeCloseTo(0.8, 9);
    expect(r.after.bySegment.other).toBeCloseTo(0.8, 9);
  });

  it("records outside screening without adding mammograms, after every other layer", () => {
    const re = layer({ id: "elsewhere", kind: "reclassify", reaches: "missing", effect: 0.5, costPerReached: 0 });
    const call = layer({ id: "second", reaches: "missing", effect: 0.5, costPerReached: 0 });
    const r = runDesign(seg, [re, call]);
    expect(r.layers.map((l) => l.id)).toEqual(["second", "elsewhere"]);
    expect(r.extraScreened).toBeCloseTo(120, 6);
    expect(r.recordedElsewhere).toBeCloseTo(60, 6);
    expect(r.screenCost).toBeCloseTo(120 * COST_PER_SCREEN, 6);
    expect(r.recordedAttendance).toBeGreaterThan(r.after.attendance);
    expect(r.after.attendance).toBeCloseTo((860 + 120) / 1100, 9);
  });

  it("runs the default layers to a plausible result", () => {
    const r = runDesign(seg, DEFAULT_LAYERS);
    expect(r.after.attendance).toBeGreaterThan(r.before.attendance);
    expect(r.after.attendance).toBeLessThan(1);
    expect(r.after.bySegment.other - r.before.bySegment.other).toBeGreaterThan(r.after.bySegment.native - r.before.bySegment.native);
  });
});
