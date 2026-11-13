import { describe, expect, it } from "vitest";
import { findPeerTwin, worstIndicator } from "./peers";
import type { Dataset, Indicator, Region } from "./types";

const ind: Indicator = {
  id: 1, slug: "s", nameEn: "x", nameFi: "x", unit: "%", higherIsBetter: true,
  stage: "detection", strategyGoal: "", gender: "total", sourceUrl: "",
};
const lowerBetter: Indicator = { ...ind, id: 2, higherIsBetter: false };
const Y = 2024;
const v = (indicatorId: number, regionId: number, value: number, year = Y) => ({ indicatorId, regionId, year, value });
const county = (id: number): Region => ({ id, name: `C${id}`, isNational: false, kind: "county", parentId: null });

// county: [attendance, population, education]
function build(rows: Record<number, [number, number, number]>, extra: Dataset["values"] = []): Dataset {
  const regions: Region[] = [
    { id: 0, name: "Koko maa", isNational: true, kind: "national", parentId: null },
    ...Object.keys(rows).map((k) => county(Number(k))),
    { id: 900, name: "Muni", isNational: false, kind: "municipality", parentId: 10 },
  ];
  const values = Object.entries(rows).flatMap(([k, [a, p, e]]) => [v(1, +k, a), v(2, +k, 100 - a), v(127, +k, p), v(180, +k, e)]);
  return { regions, values: [...values, ...extra], fetchedAt: "", source: "snapshot" };
}

describe("findPeerTwin", () => {
  const ds = build({
    10: [70, 100_000, 300],
    20: [80, 110_000, 305], // similar, better
    30: [90, 1_000_000, 400], // better but very different
    40: [60, 100_000, 300], // identical profile but worse
    50: [71, 100_000, 300], // similar but < 2 points better
  });

  it("picks the most similar county among those at least 2 points better", () => {
    const t = findPeerTwin(ds, ind, 10, Y);
    expect(t?.twin.id).toBe(20);
    expect(t?.twinValue).toBe(80);
    expect(t?.similarity).toBeGreaterThan(0);
    expect(t?.similarity).toBeLessThanOrEqual(1);
  });

  it("never returns the county itself or a worse performer", () => {
    for (const id of [10, 20, 30, 40, 50]) {
      const t = findPeerTwin(ds, ind, id, Y);
      if (t) {
        expect(t.twin.id).not.toBe(id);
        const own = ds.values.find((x) => x.indicatorId === 1 && x.regionId === id)!.value;
        expect(t.twinValue).toBeGreaterThanOrEqual(own + 2);
      }
    }
  });

  it("returns null when no county is better, and for unknown counties", () => {
    expect(findPeerTwin(ds, ind, 30, Y)).toBeNull();
    expect(findPeerTwin(ds, ind, 999, Y)).toBeNull();
  });

  it("respects lower-is-better indicators", () => {
    const t = findPeerTwin(ds, lowerBetter, 10, Y); // county 10 = 30, county 20 = 20 (better by 10)
    expect(t?.twin.id).toBe(20);
    expect(t?.twinValue).toBe(20);
  });

  it("ignores municipalities and counties without the indicator or context", () => {
    const d = build(
      { 10: [70, 100_000, 300], 20: [80, 500_000, 350] },
      [v(1, 900, 99), v(127, 900, 100_000), v(180, 900, 300), v(1, 77, 95)],
    );
    d.regions.push(county(77)); // has attendance but no population/education
    expect(findPeerTwin(d, ind, 10, Y)?.twin.id).toBe(20);
  });
});

describe("worstIndicator", () => {
  it("picks the most-behind indicator and returns null when none is behind", () => {
    const f = (indicatorId: number, gapToNational: number | null, status: "behind" | "ahead" | "on-par" | "no-data") =>
      ({ indicatorId, gapToNational, status }) as never;
    expect(worstIndicator([f(1, -3, "behind"), f(2, -8, "behind"), f(3, 4, "ahead")])?.indicatorId).toBe(2);
    expect(worstIndicator([f(1, 1, "ahead"), f(2, 0, "on-par"), f(3, null, "no-data")])).toBeNull();
  });
});
