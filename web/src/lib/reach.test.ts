import { describe, expect, it } from "vitest";
import { REACH_EVIDENCE_ID, reachPlan } from "./reach";
import type { EquityFacts } from "./equity";
import type { Dataset, Indicator, Region } from "./types";

const ind: Indicator = {
  id: 1, slug: "breast-screening", nameEn: "Breast cancer screening", nameFi: "x", unit: "%", higherIsBetter: true,
  stage: "detection", strategyGoal: "", gender: "female", sourceUrl: "",
};
const muni = (id: number, name: string, parentId: number): Region => ({ id, name, isNational: false, kind: "municipality", parentId });
const regions: Region[] = [
  { id: 10, name: "County A", isNational: false, kind: "county", parentId: null },
  { id: 20, name: "Helsingin kaupunki", isNational: false, kind: "county", parentId: null },
  muni(101, "A1", 10), muni(102, "A2", 10), muni(103, "A3", 10), muni(46, "Helsinki", 20),
];
const L = (language: string, count: number) => ({ language, count });
const ds: Dataset = {
  regions, values: [], fetchedAt: "", source: "snapshot",
  languages: [
    { regionId: 101, year: 2025, total: 1000, top: [L("Russian", 100), L("Arabic", 50), L("Somali", 10), L("Estonian", 5), L("Thai", 4), L("Polish", 3)] },
    { regionId: 102, year: 2025, total: 3000, top: [L("Arabic", 150), L("Russian", 100), L("English", 20), L("Kurdish", 5)] },
    { regionId: 103, year: 2025, total: 9000, top: [L("Russian", 9000)] }, // not lagging: must be ignored
    { regionId: 46, year: 2025, total: 1000, top: [L("Russian", 215), L("Somali", 161), L("Finnish", 9999), L("Swedish", 999), L("Sami", 99), L("Total", 99999)] },
  ],
};
const row = (id: number, gap: number) => ({ region: regions.find((r) => r.id === id)!, value: 70 + gap, gapToCounty: gap });
const equity = (rows: ReturnType<typeof row>[], count = 3): EquityFacts => ({
  municipalityCount: count, applicable: count >= 2, associations: [],
  lagging: [{ indicator: ind, year: 2024, countyValue: 70, rows }],
});

describe("reachPlan", () => {
  const plan = reachPlan(ds, 10, ind, equity([row(101, -5), row(102, -2), row(103, 3)]))!;

  it("uses only lagging municipalities (gapToCounty < 0)", () => {
    expect(plan.areas).toEqual([{ regionId: 101, name: "A1" }, { regionId: 102, name: "A2" }]);
    expect(plan.indicatorId).toBe(1);
    expect(plan.year).toBe(2025);
  });
  it("sums languages over the areas, top 5 in descending order", () => {
    expect(plan.languages.map((l) => [l.language, l.count])).toEqual([
      ["Arabic", 200], ["Russian", 200], ["Somali", 10], ["Estonian", 5], ["English", 20],
    ].sort((a, b) => (b[1] as number) - (a[1] as number) || String(a[0]).localeCompare(String(b[0]))));
    expect(plan.languages).toHaveLength(5);
  });
  it("shares are % of the areas' population, 1 decimal", () => {
    expect(plan.languages[0].sharePct).toBe(5); // 200 / 4000
    expect(plan.languages.find((l) => l.language === "Somali")?.sharePct).toBe(0.3); // 10 / 4000 = 0.25 -> 0.3
  });
  it("uses the county's own municipality when it has at most one (Helsinki), excluding Finnish/Swedish/Sami/totals", () => {
    const p = reachPlan(ds, 20, ind, equity([], 1))!;
    expect(p.areas).toEqual([{ regionId: 46, name: "Helsinki" }]);
    expect(p.languages).toEqual([
      { language: "Russian", count: 215, sharePct: 21.5 },
      { language: "Somali", count: 161, sharePct: 16.1 },
    ]);
  });
  it("excludes Finnish, Swedish and Sami even if present", () => {
    const names = reachPlan(ds, 20, ind, equity([], 1))!.languages.map((l) => l.language);
    expect(names).not.toContain("Finnish");
    expect(names).not.toContain("Swedish");
    expect(names).not.toContain("Sami");
  });
  it("is null without language data, or without areas", () => {
    expect(reachPlan({ ...ds, languages: undefined }, 10, ind, equity([row(101, -5)]))).toBeNull();
    expect(reachPlan(ds, 10, ind, equity([row(103, 3)]))).toBeNull();
  });
  it("gives four actions citing the roadmap evidence", () => {
    expect(plan.actions).toHaveLength(4);
    expect(plan.actions.every((a) => a.evidenceId === REACH_EVIDENCE_ID && a.text.length > 10)).toBe(true);
  });
});
