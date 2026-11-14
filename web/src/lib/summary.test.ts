import { describe, expect, it } from "vitest";
import { INDICATORS } from "@/data/indicators";
import { PATHWAY_COSTS } from "@/data/pathwayCosts";
import { loadPathway } from "./pathwayData";
import { serviceOption } from "./pathway";
import { countySummary, programmeName } from "./summary";
import { countyMortality, type MortalityRow } from "./mortality";
import mortalityRows from "@/data/mortality.json";
import type { GapFacts, Recommendation } from "./types";

const breast = INDICATORS.find((i) => i.slug === "breast-screening")!;
const cervical = INDICATORS.find((i) => i.slug === "cervical-screening")!;

const fact = (indicatorId: number, value: number, target: number | null): GapFacts => ({
  indicatorId,
  regionId: 960,
  year: 2024,
  value,
  national: 81.6,
  bestQuartile: 85,
  gapToNational: value - 81.6,
  gapToBestQuartile: value - 85,
  rank: 22,
  rankOf: 22,
  trend3y: 0,
  target,
  gapToTarget: target === null ? null : value - target,
  status: "behind",
});

const rec: Recommendation = {
  action: "Send breast screening invitations in Somali and Arabic.",
  owner: "Screening unit",
  timeframe: "Within 6 months",
  goal3Indicator: "Goal 2",
  sources: [],
};

const costs = { perColonoscopy: PATHWAY_COSTS.perColonoscopy.value, perContact: PATHWAY_COSTS.perContact.value, perTest: null };

describe("programmeName", () => {
  it("takes the cancer name from a screening indicator", () => {
    expect(programmeName(breast)).toBe("Breast");
  });
});

describe("countySummary", () => {
  const view = loadPathway(960);

  it("keeps supporting summary lines when no bowel pathway is available", () => {
    expect(view).not.toBeNull();
    const lines = countySummary({
      name: "Helsinki",
      facts: [fact(breast.id, 74.3, 80), fact(cervical.id, 70.1, 80)],
      indicators: INDICATORS,
      pathway: null,
      reach: {
        plan: { indicatorId: breast.id, areas: [{ regionId: 1, name: "Itäinen" }], languages: [{ language: "Russian", count: 10, sharePct: 1 }, { language: "Somali", count: 9, sharePct: 1 }], year: 2025, actions: [] },
        indicator: breast,
      },
      firstAction: rec,
      costs,
    });
    expect(lines.map((l) => l.key)).toEqual(["gap", "who", "first"]);
    // The worst gap is cervical (9.9 points), not breast (5.7).
    expect(lines[0].text).toBe("Cervical screening: 70.1% took part in 2024, 9.9 points short of the 80% target (Finland 81.6%).");
    expect(lines[1].text).toBe("Breast screening attendance is lowest in Itäinen. The largest foreign languages spoken there are Russian and Somali.");
    expect(lines[2].text).toBe("Send breast screening invitations in Somali and Arabic. Who: Screening unit. By when: Within 6 months.");
  });

  it("keeps the opening on one bowel decision and distinguishes scenarios from observations", () => {
    const lines = countySummary({ name: "Päijät-Häme", facts: [fact(cervical.id, 68.9, 80)], indicators: INDICATORS,
      pathway: loadPathway(975), reach: null, firstAction: rec, costs });
    expect(lines.map((line) => line.key)).toEqual(["gap", "where", "option", "first"]);
    expect(lines[0].text).toContain("positive bowel tests");
    expect(lines[1].text).toContain("not an observed outcome");
    expect(lines[2].text).toContain("local costs and endoscopy capacity");
    expect(lines[3].text).not.toContain(rec.action);
  });

  it("states the costed option with the same figures as the decision board", () => {
    const p = view!.pathway;
    const opt = serviceOption(p, p.bestQuarter.examined, costs);
    const line = countySummary({ name: "Helsinki", facts: [], indicators: INDICATORS, pathway: view, reach: null, firstAction: undefined, costs })
      .find((l) => l.key === "option");
    expect(opt.cost).not.toBeNull();
    expect(line?.text).toContain(`€${opt.cost!.toLocaleString("en-GB")}`);
  });

  it("words a one-municipality county as a whole", () => {
    const lines = countySummary({
      name: "Helsinki", facts: [], indicators: INDICATORS, pathway: null, firstAction: undefined, costs,
      reach: {
        plan: { indicatorId: breast.id, areas: [{ regionId: 91, name: "Helsinki" }], languages: [{ language: "Russian", count: 1, sharePct: 1 }], year: 2025, actions: [] },
        indicator: breast,
      },
    });
    expect(lines[0].text).toBe("Helsinki is a single municipality, so breast screening outreach covers all of it. The largest foreign languages spoken there are Russian.");
  });

  it("adds Goal 3's mortality line after the gap", () => {
    const mortality = countyMortality(mortalityRows as MortalityRow[], "Helsingin kaupunki");
    const lines = countySummary({
      name: "Helsinki", facts: [fact(breast.id, 74.3, 80)], indicators: INDICATORS, pathway: null, reach: null,
      firstAction: undefined, costs, mortality,
    });
    expect(lines.map((l) => l.key)).toEqual(["gap", "goal3"]);
    expect(lines[1].text).toBe(
      "Cancer deaths 2020–2024: 181.6 per 100,000 women (above Finland's 172.4) and 263.3 per 100,000 men (about level with Finland's 260.7), age-standardised.",
    );
  });

  it("leaves out lines whose data is missing, never guessing", () => {
    const lines = countySummary({ name: "Ahvenanmaa", facts: [], indicators: INDICATORS, pathway: null, reach: null, firstAction: undefined, costs });
    expect(lines).toEqual([]);
  });

  it("says when every screening meets the target", () => {
    const lines = countySummary({ name: "X", facts: [fact(breast.id, 86, 80)], indicators: INDICATORS, pathway: null, reach: null, firstAction: undefined, costs });
    expect(lines[0].text).toBe("Every screening programme with a figure meets the 80% target; the lowest is breast at 86.0%.");
  });
});
