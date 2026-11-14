import { describe, expect, it } from "vitest";
import registry from "@/data/registry.json";
import { accessOption, countyPathway, rankBreaks, rates, serviceOption, settledYear } from "./pathway";
import type { RegistryData } from "./registryTypes";

const data = (registry as unknown as RegistryData).colorectal;
const none = { perTest: null, perColonoscopy: null, perContact: null };
const PAIJAT_HAME = 975, HELSINKI = 960, VARSINAIS_SUOMI = 978, ETELA_SAVO = 959;

describe("registry data", () => {
  it("has 22 counties for every year and uses the second-latest year as settled", () => {
    for (const y of data.years) expect(Object.keys(data.counties[y])).toHaveLength(22);
    expect(settledYear(data)).toBe(data.years[data.years.length - 2]);
  });
  it("reproduces the published 2023 national figures", () => {
    const n = data.national[2023];
    expect([n.findings.positive, n.findings.noColonoscopy, n.findings.cancer, n.findings.advancedPrecursor]).toEqual([16501, 3536, 771, 5258]);
    expect(rates(n.all, n.findings)).toEqual({ participation: 74.4, positivity: 5.3, examined: 78.6 });
  });
});

describe("countyPathway", () => {
  it("returns null for a region outside the programme", () => {
    expect(countyPathway(data, 956)).toBeNull(); // Åland
  });
  it("computes Päijät-Häme's 2023 pathway", () => {
    const p = countyPathway(data, PAIJAT_HAME)!;
    expect(p.year).toBe(2023);
    expect(p.findings.positive).toBe(739);
    expect(p.examinedPeople).toBe(547);
    expect(p.rates.examined).toBe(74);
  });
});

describe("rankBreaks", () => {
  it("puts the service break first where people come but positives are not examined", () => {
    expect(rankBreaks(countyPathway(data, PAIJAT_HAME)!)[0].kind).toBe("service");
  });
  it("puts the access break first where positives are examined but fewer people take part", () => {
    expect(rankBreaks(countyPathway(data, VARSINAIS_SUOMI)!)[0].kind).toBe("access");
  });
  it("ranks by findings missed, not by head count", () => {
    const [first, second] = rankBreaks(countyPathway(data, HELSINKI)!);
    expect(first.kind).toBe("service");
    expect(second.people).toBeGreaterThan(first.people); // more people lost at access, fewer findings
    expect(first.cancers).toBeGreaterThan(second.cancers);
  });
  it("finds no break in a county at or above the best quarter on both steps", () => {
    expect(rankBreaks(countyPathway(data, ETELA_SAVO)!).every((b) => b.people === 0)).toBe(true);
  });
});

describe("options", () => {
  const p = countyPathway(data, PAIJAT_HAME)!;
  it("service option: colonoscopies, findings and cost to reach a target share examined", () => {
    const r = serviceOption(p, 84, { ...none, perColonoscopy: 614, perContact: 100 });
    expect(r.extraColonoscopies).toBe(74); // 739 × 10 points
    expect(r.cancers).toBe(4.4);
    expect(r.advanced).toBe(30);
    expect(r.cost).toBe(192 * 100 + 74 * 614);
    expect(r.costPerFinding).toBe(Math.round((192 * 100 + 74 * 614) / (4.4 + 30)));
  });
  it("needs every cost it uses, and invents none", () => {
    expect(serviceOption(p, 84, { ...none, perColonoscopy: 614 }).cost).toBeNull();
    expect(accessOption(p, 80, { perTest: null, perColonoscopy: 614, perContact: 5 }).cost).toBeNull();
  });
  it("access option: extra participants and the colonoscopies that follow at the county's own rates", () => {
    const r = accessOption(p, 80, { perTest: 10, perColonoscopy: 614, perContact: 5 });
    expect(r.extraParticipants).toBe(Math.ceil(17480 * (80 - 76.2) / 100 - 1e-9));
    expect(r.extraColonoscopies).toBe(Math.round(r.extraParticipants * 0.056 * 0.74));
    expect(r.cost).toBe(Math.round(r.extraParticipants * 15 + r.extraColonoscopies * 614));
  });
  it("a target at or below today changes nothing", () => {
    expect(serviceOption(p, 70, none).extraColonoscopies).toBe(0);
    expect(accessOption(p, 70, none).extraParticipants).toBe(0);
  });
});
