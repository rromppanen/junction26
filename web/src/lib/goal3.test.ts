import { afterEach, describe, expect, it, vi } from "vitest";
import snapshot from "../data/screening.json";
import goal3 from "../data/goal3.json";
import { analyse, recommend } from "./analysis";
import { goal3Outcome } from "./goal3";
import { evidenceIds } from "../data/evidence";
import { fields } from "./csv";
import { analyseDataset } from "./pipeline/analyse";
import { generateRecommendations, outcomeReviews } from "./pipeline/recommend";
import { reviewedSources } from "./pipeline/research";
import type { PreparedData } from "./pipeline/types";

const regions = [...new Set(snapshot.rows.filter(r => r.dimension === "Region" && r.group !== "All groups").map(r => r.group))];

describe("Goal 3 outcome data", () => {
  it("covers every screening region in every screening year", () => {
    expect(regions).toHaveLength(23);
    for (const year of [2020, 2021, 2022, 2023, 2024]) for (const region of regions) expect(goal3Outcome(region, year)?.year).toBe(year);
  });
  it("reproduces published values and the national comparison", () => {
    expect(goal3Outcome("Etelä-Karjala", 2024)).toMatchObject({ value: 56, national: 73, gap: -17, year: 2024 });
    expect(goal3Outcome("Varsinais-Suomi", 2024)).toMatchObject({ value: 86, national: 73, gap: 13 });
    expect(goal3.manifest.indicator).toBe(3626);
  });
  it("uses the latest year at or before the request, and returns null for non-counties", () => {
    expect(goal3Outcome("Kainuu", 2030)?.year).toBe(2024);
    expect(goal3Outcome("Kainuu", 2018)).toBeNull();
    expect(goal3Outcome("Other / missing language", 2024)).toBeNull();
  });
});

describe("Goal 3 recommendations", () => {
  const finding = (group: string) => analyse(snapshot.rows, 2024, "Region", "Routine age-based screening", "participation").find(f => f.row.group === group)!;
  it("adds an outcome review when county survival is well below the national level", () => {
    const actions = recommend(finding("Etelä-Karjala"), goal3Outcome("Etelä-Karjala", 2024));
    expect(actions.at(-1)?.id).toBe("outcome");
    expect(actions.at(-1)?.evidenceIds.every(id => evidenceIds.includes(id))).toBe(true);
  });
  it("does not add it near or above the national level, or without outcome data", () => {
    expect(recommend(finding("Varsinais-Suomi"), goal3Outcome("Varsinais-Suomi", 2024)).some(a => a.id === "outcome")).toBe(false);
    expect(recommend(finding("Kainuu"), goal3Outcome("Kainuu", 2024)).some(a => a.id === "outcome")).toBe(false);
    expect(recommend(finding("Etelä-Karjala")).some(a => a.id === "outcome")).toBe(false);
  });
});

describe("Goal 3 in the automatic pipeline", () => {
  const dataset: PreparedData = { name: "test", sha256: "x", rows: snapshot.rows, mapping: Object.fromEntries(fields.map(f => [f, f])) as PreparedData["mapping"],
    official: true, mappingMode: "known-schema", cleaning: [], warnings: [] };
  const findings = analyseDataset(dataset);
  it("attaches survival to Region findings only", () => {
    expect(findings.all.filter(f => f.row.dimension === "Region").every(f => f.outcome?.region === f.row.group)).toBe(true);
    expect(findings.all.filter(f => f.row.dimension !== "Region").every(f => f.outcome === undefined)).toBe(true);
  });
  it("adds a deterministic outcome review for a low-survival focus county, and none otherwise", () => {
    const low = findings.all.find(f => f.row.group === "Etelä-Karjala")!;
    const high = findings.all.find(f => f.row.group === "Varsinais-Suomi")!;
    expect(outcomeReviews({ ...findings, focus: [low, high] })).toEqual([expect.objectContaining({ findingId: low.id, evidenceIds: ["survival", "strategy"] })]);
    expect(reviewedSources.find(s => s.id === "survival")?.kind).toBe("data");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("appends the outcome review to template recommendations", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const low = findings.all.find(f => f.row.group === "Etelä-Karjala")!;
    const result = await generateRecommendations({ ...findings, focus: [low] }, reviewedSources);
    expect(result.recommendations.map(a => a.id)).toEqual([`${low.id}:template`, `${low.id}:outcome`]);
  });
});
