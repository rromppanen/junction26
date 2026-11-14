import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import rows from "@/data/mortality.json";
import { countyMortality, isCountyArea, parseMortalityCsv, type MortalityRow } from "./mortality";

const data = rows as MortalityRow[];

describe("mortality data", () => {
  it("matches the Registry export it was generated from", () => {
    const csv = readFileSync(join(__dirname, "../../data/cancer-registry/mortality-2020-2024.csv"), "utf8");
    expect(parseMortalityCsv(csv)).toEqual(data);
  });

  it("has 23 counties and a national total close to the strategy's 13,300 deaths a year", () => {
    expect(new Set(data.filter((r) => isCountyArea(r.area)).map((r) => r.area)).size).toBe(23);
    const perYear = data.filter((r) => r.area === "Koko maa").reduce((s, r) => s + r.deaths, 0) / 5;
    expect(perYear).toBeGreaterThan(13000);
    expect(perYear).toBeLessThan(13800);
  });
});

describe("countyMortality", () => {
  it("compares Helsinki with Finland, by sex", () => {
    const m = countyMortality(data, "Helsingin kaupunki")!;
    expect(m.women.rate).toBe(181.61);
    expect(m.women.national).toBe(172.36);
    expect(m.women.diff).toBe(9.3);
    expect(m.women.status).toBe("behind"); // 5.4% above Finland
    expect(m.men.status).toBe("on-par"); // 1.0% above Finland
    expect(m.women.rankOf).toBe(23);
  });

  it("ranks the lowest rate first", () => {
    expect(countyMortality(data, "Pohjois-Savon hyvinvointialue")!.women.rank).toBe(1);
  });

  it("returns null for an unknown area", () => {
    expect(countyMortality(data, "Nowhere")).toBeNull();
  });

  it("rejects a row with an unknown sex", () => {
    expect(() => parseMortalityCsv("a;b;c;d\nKoko maa;Muut;1;1,0")).toThrow(/unknown sex/);
  });
});
