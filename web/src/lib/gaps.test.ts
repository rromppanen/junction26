import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findGaps, gapDetail, gapId } from "./gaps";
import { parseCSV } from "./intake/csv";
import { suggestMapping, validateMapping, type Mapping } from "./intake/fields";

const H = ["year", "area", "lang", "sex", "invited", "attended"];
const map: Mapping = { year: "year", area: "region", lang: "group", sex: "group", invited: "invited", attended: "attended" };

describe("findGaps", () => {
  it("compares each group with everyone else and counts the people missed (full cross-table, no totals)", () => {
    const rows = [
      ["2024", "A", "fi", "m", "500", "350"],
      ["2024", "A", "fi", "f", "500", "400"],
      ["2024", "A", "ru", "m", "50", "20"],
      ["2024", "A", "ru", "f", "50", "25"],
    ];
    const r = findGaps({ headers: H, rows }, map, { lang: "language", sex: "sex" });
    const lang = r.dimensions.find((d) => d.header === "lang")!;
    expect(lang.label).toBe("Language");
    const ru = lang.byMetric.participation!.find((g) => g.value === "ru")!;
    expect(ru.figure).toBeCloseTo(45);
    expect(ru.rest).toBeCloseTo(75);
    expect(ru.gap).toBeCloseTo(-30);
    expect(ru.status).toBe("behind");
    expect(ru.missing).toBe(30); // 100 people x (75% - 45%)
    // Ranked by what closing the gap is worth: men (550 x 10 points = 55 people) before Russian speakers (30).
    expect(r.findings.map((f) => [f.group.value, f.group.missing])).toEqual([["m", 55], ["ru", 30]]);
    // One area only: nothing to compare, so no area dimension.
    expect(r.dimensions.map((d) => d.header)).toEqual(["lang", "sex"]);
    expect(r.absent).toEqual(expect.arrayContaining(["age", "migrantBackground"]));
    expect(r.absent).not.toContain("language");
  });

  it("uses only the margin rows when the file has total rows (long export)", () => {
    const rows = [
      ["2024", "A", "yhteensä", "yhteensä", "1100", "795"],
      ["2024", "A", "fi", "yhteensä", "1000", "750"],
      ["2024", "A", "ru", "yhteensä", "100", "45"],
      ["2024", "A", "yhteensä", "m", "550", "370"],
      ["2024", "A", "yhteensä", "f", "550", "425"],
    ];
    const r = findGaps({ headers: H, rows }, map, { lang: "language", sex: "sex" });
    const lang = r.dimensions.find((d) => d.header === "lang")!.byMetric.participation!;
    expect(lang.map((g) => [g.value, g.n])).toEqual([["ru", 100], ["fi", 1000]]);
    const sex = r.dimensions.find((d) => d.header === "sex")!.byMetric.participation!;
    expect(sex.find((g) => g.value === "m")!.n).toBe(550);
  });

  it("hides groups that are too small and calls small differences level or unclear", () => {
    const rows = [
      ["2024", "A", "fi", "m", "1000", "700"],
      ["2024", "A", "sv", "m", "10", "2"],
      ["2024", "A", "en", "m", "40", "25"],
    ];
    const g = findGaps({ headers: H, rows }, map).dimensions[0].byMetric.participation!;
    expect(g.find((x) => x.value === "sv")).toMatchObject({ status: "few", figure: null });
    expect(g.find((x) => x.value === "en")!.status).toBe("unclear"); // 62.5% vs ~69.3%, but only 40 people
  });

  it("reports the latest year and how the gap has moved since the first year", () => {
    const rows = [
      ["2022", "A", "fi", "m", "1000", "700"],
      ["2022", "A", "ru", "m", "200", "120"],
      ["2024", "A", "fi", "m", "1000", "700"],
      ["2024", "A", "ru", "m", "200", "80"],
    ];
    const r = findGaps({ headers: H, rows }, map);
    expect([r.year, r.firstYear]).toEqual([2024, 2022]);
    const ru = r.findings[0].group;
    expect(ru.gap).toBeCloseTo(-30);
    expect(ru.firstGap).toBeCloseTo(-10);
  });

  it("adds years together when a group is too small in the latest year", () => {
    const rows = [
      ["2023", "A", "fi", "m", "1000", "700"],
      ["2023", "A", "ru", "m", "15", "6"],
      ["2024", "A", "fi", "m", "1000", "700"],
      ["2024", "A", "ru", "m", "15", "6"],
    ];
    const d = findGaps({ headers: H, rows }, map).dimensions[0];
    expect(d.pooled.participation).toBe(true);
    expect(d.byMetric.participation!.find((g) => g.value === "ru")).toMatchObject({ n: 30, status: "behind", firstGap: null });
  });

    it("finds the planted gaps in the demo file", () => {
    const table = parseCSV(readFileSync(join(__dirname, "../../public/demo/suolistoseulonta_pkarjala_2022-2024.csv"), "utf8"));
    const m: Mapping = { ...suggestMapping(table.headers), osall: "attended", pos: "positive", kolono_tehty: "examined" };
    expect(validateMapping(table, m)).toEqual([]);
    const r = findGaps(table, m, { sukupuoli: "sex", ikäryhmä: "age", kieli: "language", kansalaisuus: "nationality", tausta: "migrantBackground" });
    expect(r.metrics).toEqual(["participation", "followUp", "wait"]);
    expect(r.dimensions.map((d) => d.kind).sort()).toEqual(["age", "language", "migrantBackground", "nationality", "region", "sex"]);
    const behind = new Set(r.findings.filter((f) => f.metric === "participation").map((f) => f.group.value));
    for (const v of ["mies", "venäjä", "muu", "ulkomaalaistaustainen", "Lieksa", "56–59"]) expect(behind).toContain(v);
    expect(behind).not.toContain("nainen");
    expect(r.absent).toEqual(["education", "income"]);
    // Rate gaps by people missed, then wait gaps by extra days of waiting.
    const rates = r.findings.filter((f) => f.metric !== "wait").map((f) => f.group.missing);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
    expect(r.findings.findIndex((f) => f.metric === "wait")).toBeGreaterThanOrEqual(rates.length);
  });

  it("gives a gap's detail: both sides along the pathway, the trend by year and the knock-on positives", () => {
    const h = ["year", "lang", "invited", "attended", "positive"];
    const m: Mapping = { year: "year", lang: "group", invited: "invited", attended: "attended", positive: "positive" };
    const rows = [
      ["2023", "fi", "1000", "700", "35"],
      ["2023", "ru", "100", "60", "3"],
      ["2024", "fi", "1000", "700", "35"],
      ["2024", "ru", "100", "40", "2"],
    ];
    const t = { headers: h, rows };
    const f = findGaps(t, m, { lang: "language" }).findings[0];
    const d = gapDetail(t, m, { lang: "language" }, gapId(f))!;
    expect(d.span).toBe("2024");
    expect(d.group).toMatchObject({ invited: 100, attended: 40, positive: 2 });
    expect(d.rest).toMatchObject({ invited: 1000, attended: 700, positive: 35 });
    expect(d.series.map((s) => [s.year, Math.round(s.group!), Math.round(s.rest!)])).toEqual([[2023, 60, 70], [2024, 40, 70]]);
    expect(d.extraPositives).toBe(2); // 30 people missed x 5% positive among everyone else
    expect(gapDetail(t, m, {}, "participation|lang|nope")).toBeNull();
  });
});
