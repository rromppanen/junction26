import { describe, expect, it } from "vitest";
import { computeGap, latestYear, rankCounties, ON_PAR_THRESHOLD } from "./gap";
import type { Dataset, Indicator } from "./types";

const base: Omit<Indicator, "id" | "higherIsBetter"> = {
  slug: "x", nameEn: "x", nameFi: "x", unit: "%", stage: "detection",
  goal3: "3.2", gender: "total", sourceUrl: "",
};
const up: Indicator = { ...base, id: 1, higherIsBetter: true };
const down: Indicator = { ...base, id: 2, higherIsBetter: false };

// regions: 0 = national, 10..13 counties (13 has no data)
const v = (indicatorId: number, regionId: number, year: number, value: number) => ({ indicatorId, regionId, year, value });
const ds: Dataset = {
  regions: [
    { id: 0, name: "Koko maa", isNational: true },
    { id: 10, name: "A", isNational: false },
    { id: 11, name: "B", isNational: false },
    { id: 12, name: "C", isNational: false },
    { id: 13, name: "D", isNational: false },
  ],
  values: [
    v(1, 0, 2023, 70), v(1, 10, 2023, 60), v(1, 11, 2023, 71), v(1, 12, 2023, 80),
    v(1, 10, 2020, 55), v(1, 0, 2024, 99),
    v(2, 0, 2023, 10), v(2, 10, 2023, 20), v(2, 11, 2023, 5), v(2, 12, 2023, 11),
  ],
  fetchedAt: "", source: "snapshot",
};

describe("gap engine", () => {
  it("latestYear ignores national-only years", () => {
    expect(latestYear(ds, up)).toBe(2023);
  });

  it("computes gaps for higherIsBetter", () => {
    const g = computeGap(ds, up, 10, 2023);
    expect(g.value).toBe(60);
    expect(g.national).toBe(70);
    expect(g.gapToNational).toBe(-10);
    expect(g.bestQuartile).toBe(75.5); // p75 of 60,71,80
    expect(g.gapToBestQuartile).toBe(-15.5);
    expect(g.rank).toBe(3);
    expect(g.rankOf).toBe(3);
    expect(g.trend3y).toBe(5);
    expect(g.status).toBe("behind");
  });

  it("sign-corrects when lower is better", () => {
    const g = computeGap(ds, down, 10, 2023);
    expect(g.gapToNational).toBe(-10); // 20 vs 10 is worse
    expect(g.bestQuartile).toBe(8); // p25 of 5,11,20
    expect(g.rank).toBe(3);
    const best = computeGap(ds, down, 11, 2023);
    expect(best.rank).toBe(1);
    expect(best.gapToNational).toBe(5);
    expect(best.status).toBe("ahead");
  });

  it("status thresholds", () => {
    expect(computeGap(ds, up, 11, 2023).status).toBe("on-par"); // +1
    expect(computeGap(ds, down, 12, 2023).status).toBe("on-par"); // -1
    expect(ON_PAR_THRESHOLD).toBe(2);
  });

  it("handles missing data", () => {
    const g = computeGap(ds, up, 13, 2023);
    expect(g).toMatchObject({ value: null, gapToNational: null, rank: null, trend3y: null, status: "no-data", rankOf: 3 });
    expect(computeGap(ds, up, 11, 2023).trend3y).toBeNull();
  });

  it("rankCounties sorts best first, no-data last, excludes national", () => {
    expect(rankCounties(ds, up, 2023).map((g) => g.regionId)).toEqual([12, 11, 10, 13]);
    expect(rankCounties(ds, down, 2023).map((g) => g.regionId)).toEqual([11, 12, 10, 13]);
  });
});
