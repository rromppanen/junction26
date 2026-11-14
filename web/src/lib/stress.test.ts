import { describe, expect, it } from "vitest";
import { loadPathway } from "./pathwayData";
import { capacityDrop } from "./stress";

describe("capacityDrop", () => {
  const p = loadPathway(960)!.pathway;

  it("removes the same share of colonoscopies and the findings they carry", () => {
    const r = capacityDrop(p, 20);
    expect(r.lostColonoscopies).toBe(Math.round(p.examinedPeople * 0.2));
    expect(r.examinedAfter).toBe(p.examinedPeople - r.lostColonoscopies);
    expect(r.cancers).toBeCloseTo(r.lostColonoscopies * p.yield.cancerPerColonoscopy, 0);
    expect(r.examinedPctAfter).toBeLessThan(p.rates.examined);
  });

  it("does nothing at 0% and clamps out-of-range drops", () => {
    expect(capacityDrop(p, 0).lostColonoscopies).toBe(0);
    expect(capacityDrop(p, 150).examinedAfter).toBe(0);
    expect(capacityDrop(p, -5).lostColonoscopies).toBe(0);
  });
});
