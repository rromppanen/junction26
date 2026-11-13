import { describe, expect, it } from "vitest";
import { association, associationSentence, equityFacts, equityNumbers, laggingMunicipalities, municipalitiesOf } from "./equity";
import type { Dataset, Indicator, Region } from "./types";

const base: Omit<Indicator, "id" | "higherIsBetter" | "slug"> = {
  nameEn: "x", nameFi: "x", unit: "%", stage: "detection", strategyGoal: "", gender: "total", sourceUrl: "",
};
const screening: Indicator = { ...base, id: 1, slug: "screen", higherIsBetter: true };
const waiting: Indicator = { ...base, id: 2, slug: "wait", higherIsBetter: false };
const foreign: Indicator = { ...base, id: 5102, slug: "foreign-background", higherIsBetter: true };

const POP = 127;
const Y = 2024;
const v = (indicatorId: number, regionId: number, value: number, year = Y) => ({ indicatorId, regionId, year, value });
const muni = (id: number, parentId: number): Region => ({ id, name: `m${id}`, isNational: false, kind: "municipality", parentId });

// County 10 has municipalities 101..108 (108 is tiny); county 20 has 201.
const regions: Region[] = [
  { id: 0, name: "Koko maa", isNational: true, kind: "national", parentId: null },
  { id: 10, name: "County A", isNational: false, kind: "county", parentId: null },
  { id: 20, name: "County B", isNational: false, kind: "county", parentId: null },
  ...[101, 102, 103, 104, 105, 106, 107, 108].map((id) => muni(id, 10)),
  muni(201, 20),
];
const screen = [60, 70, 65, 80, 75, 90, 85, 10]; // 101..108
const values = [
  v(1, 10, 72),
  v(2, 10, 30),
  ...[101, 102, 103, 104, 105, 106, 107, 108].flatMap((id, i) => [
    v(POP, id, id === 108 ? 500 : 10_000),
    v(1, id, screen[i]),
    v(2, id, 30 + i), // waiting: higher = worse, 108 worst, 101 best
    v(5102, id, 1000 - screen[i]), // perfectly opposite ranks to screening
  ]),
  v(POP, 201, 50_000),
  v(1, 201, 5),
];
const ds: Dataset = { regions, values, fetchedAt: "", source: "snapshot" };

describe("municipalitiesOf", () => {
  it("returns the county's municipalities with at least 2,000 residents", () => {
    expect(municipalitiesOf(ds, 10).map((r) => r.id)).toEqual([101, 102, 103, 104, 105, 106, 107]);
  });
  it("excludes other counties' municipalities", () => {
    expect(municipalitiesOf(ds, 20).map((r) => r.id)).toEqual([201]);
  });
  it("respects a custom minimum population", () => {
    expect(municipalitiesOf(ds, 10, 0).map((r) => r.id)).toContain(108);
  });
});

describe("laggingMunicipalities", () => {
  it("sorts worst first, with the sign-corrected gap to the county", () => {
    const rows = laggingMunicipalities(ds, screening, 10, Y);
    expect(rows.map((r) => r.region.id)).toEqual([101, 103, 102, 105, 104]);
    expect(rows[0]).toMatchObject({ value: 60, gapToCounty: -12 });
  });
  it("sign-corrects when lower is better", () => {
    const rows = laggingMunicipalities(ds, waiting, 10, Y, 2);
    expect(rows.map((r) => r.region.id)).toEqual([107, 106]);
    expect(rows[0].gapToCounty).toBe(-6); // 36 vs county 30 is worse
  });
  it("returns nothing when the county has no value", () => {
    expect(laggingMunicipalities(ds, screening, 20, Y)).toEqual([]);
  });
});

describe("association", () => {
  it("returns rho = -1 for perfectly opposite ranks", () => {
    expect(association(ds, screening, foreign, 10, Y)).toEqual({ rho: -1, n: 7 });
  });
  it("returns null when fewer than 6 municipalities have both values", () => {
    expect(association(ds, screening, foreign, 20, Y)).toBeNull();
  });
});

describe("equityFacts", () => {
  it("is not applicable for a county with a single municipality (Helsinki case)", () => {
    const e = equityFacts(ds, 20, [screening], [foreign]);
    expect(e).toMatchObject({ applicable: false, municipalityCount: 1, lagging: [], associations: [] });
  });
  it("collects lagging municipalities and strong associations with a plain-English, area-level sentence", () => {
    const e = equityFacts(ds, 10, [screening], [foreign]);
    expect(e.applicable).toBe(true);
    expect(e.lagging[0]).toMatchObject({ year: Y, countyValue: 72 });
    expect(e.associations).toHaveLength(1);
    expect(e.associations[0].sentence).toBe(
      "In this county, municipalities with more residents of foreign background tend to have lower x (area-level, n = 7).",
    );
    expect(equityNumbers(e)).toEqual(expect.arrayContaining([72, 60, -12, -1, 7]));
  });
  it("phrases a positive association as higher", () => {
    const breast: Indicator = { ...screening, slug: "breast-screening" };
    expect(associationSentence(breast, { ...foreign, id: 180 }, { rho: 0.52, n: 14 })).toBe(
      "In this county, municipalities with a higher education level tend to have higher breast screening attendance (area-level, n = 14).",
    );
  });
});
