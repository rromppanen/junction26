import { describe, expect, it } from "vitest";
import { extraNumbers, fallbackBrief, knownSourceIds } from "./analyst";
import type { EquityFacts } from "./equity";
import { validateBrief } from "./validate";
import type { GapFacts, Indicator } from "./types";

const ind: Indicator = {
  id: 1, slug: "breast", nameEn: "Breast screening", nameFi: "Rinta", unit: "%", higherIsBetter: true, stage: "detection",
  strategyGoal: "Goal 2", target: { value: 80, label: "80%", evidenceId: "strategy-goal2-screening-80" }, gender: "female", sourceUrl: "u",
};
const f: GapFacts = {
  indicatorId: 1, regionId: 1, year: 2023, value: 74.3, national: 76, bestQuartile: 80,
  gapToNational: -1.7, gapToBestQuartile: -5.7, rank: 5, rankOf: 21, trend3y: null, target: 80, gapToTarget: -5.7, status: "behind",
};

describe("fallbackBrief", () => {
  it("mentions people per 1,000 needed to reach the target", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [f], indicators: [ind] });
    expect(b.finding).toMatch(/about 57 more of every 1,000/);
  });
});

const muni = (id: number, name: string) => ({ id, name, isNational: false, kind: "municipality" as const, parentId: 1 });
const equity: EquityFacts = {
  municipalityCount: 10,
  applicable: true,
  lagging: [
    {
      indicator: ind, year: 2023, countyValue: 74.3,
      rows: [
        { region: muni(5, "Siuntio"), value: 66.8, gapToCounty: -7.5 },
        { region: muni(6, "Hanko"), value: 69.7, gapToCounty: -4.6 },
      ],
    },
  ],
  associations: [
    { indicator: ind, context: { ...ind, id: 180, slug: "education-level" }, year: 2023, rho: -0.88, n: 10, sentence: "s" },
  ],
};

describe("equity in the brief", () => {
  it("fallback finding names the municipalities furthest behind", () => {
    const b = fallbackBrief({ regionName: "Länsi-Uusimaa", facts: [f], indicators: [ind], equity });
    expect(b.finding).toMatch(/Siuntio \(66\.8%\)/);
    expect(b.finding).toMatch(/Hanko \(69\.7%\)/);
  });

  it("validator accepts municipality values, gaps, rho and n via extra numbers", () => {
    const input = { regionName: "X", facts: [f], indicators: [ind], equity };
    const brief = fallbackBrief(input);
    brief.headline = "Siuntio is at 66.8%, 7.5 points below; rho 0.88 across 10 municipalities";
    expect(validateBrief(brief, [f], ["strategy-goal2-screening-80"], extraNumbers(input)).filter((e) => e.startsWith("Number"))).toEqual([]);
    expect(validateBrief(brief, [f], [], []).filter((e) => e.startsWith("Number")).length).toBeGreaterThan(0);
  });
});

describe("peer twin in the analyst", () => {
  const peer = {
    twinName: "Pohjois-Savo", indicator: ind, countyValue: 74.3, twinValue: 85.1,
    snippets: [{ id: "peer:1", title: "t", url: "https://x.fi", text: "Kutsu ja muistutus" }],
  };
  it("passes the twin and county values to the validator and makes peer ids citable", () => {
    const input = { regionName: "Helsinki", facts: [f], indicators: [ind], peer };
    expect(extraNumbers(input)).toEqual(expect.arrayContaining([85.1, 74.3]));
    expect(knownSourceIds([ind], [], peer.snippets)).toContain("peer:1");
    const brief = {
      headline: "h", finding: "Pohjois-Savo reaches 85.1% against 74.3%.", pathwayStage: "detection" as const,
      recommendations: [1, 2, 3].map(() => ({ action: "a", owner: "o", timeframe: "t", goal3Indicator: "g", sources: ["peer:1"] })),
      limitations: [], generatedBy: "gemini" as const,
    };
    expect(validateBrief(brief, [f], knownSourceIds([ind], [], peer.snippets), extraNumbers(input))).toEqual([]);
    expect(validateBrief(brief, [f], knownSourceIds([ind], []), extraNumbers(input))).toHaveLength(3);
  });
});

describe("fallbackBrief in Finnish", () => {
  it("writes Finnish text with decimal commas that still validates", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [f], indicators: [ind], language: "fi" });
    expect(b.headline).toMatch(/74,3/);
    expect(b.finding).toMatch(/57/);
    expect(b.finding).not.toMatch(/\bthe\b|nationally/);
    expect(b.recommendations).toHaveLength(3);
    expect(validateBrief(b, [f], knownSourceIds([ind]), extraNumbers({ regionName: "Helsinki", facts: [f], indicators: [ind] }))).toEqual([]);
  });
  it("accepts a Finnish decimal comma in a brief", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [f], indicators: [ind], language: "fi" });
    b.headline = "Seulontaosallistuminen 74,3 % vs 76 %";
    expect(validateBrief(b, [f], knownSourceIds([ind]), [57])).toEqual([]);
    b.headline = "Seulontaosallistuminen 64,3 %";
    expect(validateBrief(b, [f], knownSourceIds([ind]), [57])).not.toEqual([]);
  });
});

describe("fallbackBrief when no stage is behind", () => {
  const ahead: GapFacts = { ...f, value: 78, gapToNational: 2, gapToBestQuartile: -2, status: "ahead", gapToTarget: -2 };
  it("does not describe a gap (English)", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [ahead], indicators: [ind] });
    expect(b.headline).toMatch(/no gap against the national level/);
    expect(b.headline).toMatch(/Weakest relative measure/);
    expect(b.headline).not.toMatch(/the gap starts|no clear gap/);
    expect(b.finding).toMatch(/No measure is below the national level/);
    expect(b.finding).not.toMatch(/best-performing/);
  });
  it("does not describe a gap (Finnish)", () => {
    const b = fallbackBrief({ regionName: "Helsinki", facts: [ahead], indicators: [ind], language: "fi" });
    expect(b.headline).toMatch(/ei eroa valtakunnalliseen tasoon/);
    expect(b.finding).toMatch(/Mikään mittari ei ole valtakunnallista tasoa heikompi/);
  });
});

describe("equityPrompt", () => {
  it("sends only municipalities behind the county to Gemini", async () => {
    const { equityPrompt } = await import("./analyst");
    const e: EquityFacts = {
      ...equity,
      lagging: [{ indicator: ind, year: 2023, countyValue: 74.3, rows: [
        { region: muni(5, "Siuntio"), value: 66.8, gapToCounty: -7.5 },
        { region: muni(7, "Kirkkonummi"), value: 80, gapToCounty: 5.7 },
      ] }],
    };
    const p = equityPrompt(e) as { lagging: { worstMunicipalities: { name: string }[] }[] };
    expect(p.lagging[0].worstMunicipalities.map((m) => m.name)).toEqual(["Siuntio"]);
  });
});
