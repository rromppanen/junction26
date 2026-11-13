import { describe, expect, it } from "vitest";
import snapshot from "../data/screening.json";
import { analyse, fallbackDraft, Observation, recommend, validateRows, wilson } from "./analysis";
import { normalise, parseCSV, suggestMapping } from "./csv";
import { validateDraft } from "./brief";

const rows = snapshot.rows;
const sample = (group: string, overrides: Partial<Observation> = {}): Observation => ({ year: 2024, dimension: "Test", cohort: "Synthetic test cohort", group, invited: 100, attended: 80, referred: 20, completed: 18, ...overrides });

describe("official source and comparisons", () => {
  it("validates every extracted row and all published totals", () => {
    expect(validateRows(rows)).toHaveLength(240);
    expect(new Set(rows.map(r => `${r.year}/${r.dimension}`)).size).toBe(25);
  });
  it("reproduces the language counts and uses the disjoint remainder", () => {
    const result = analyse(rows, 2024, "Language", "Routine + risk-group screening", "participation");
    const other = result.find(r => r.row.group === "Other / missing language")!;
    expect(other.numerator).toBe(19374);
    expect(other.denominator).toBe(34391);
    expect(other.rate).toBeCloseTo(19374 / 34391 * 100, 10);
    expect(other.benchmark).toBeCloseTo(196304 / 257719 * 100, 10);
    expect(other.gap).toBeCloseTo(-19.8352757, 6);
    expect(other.status).toBe("review");
  });
  it("keeps routine and combined cohorts separate", () => {
    const age = analyse(rows, 2024, "Age", "Routine age-based screening", "participation");
    expect(age.reduce((sum, f) => sum + f.denominator, 0)).toBe(280812);
    const language = analyse(rows, 2024, "Language", "Routine + risk-group screening", "participation");
    expect(language.reduce((sum, f) => sum + f.denominator, 0)).toBe(292110);
  });
  it("preserves low recorded completion as a reporting/access question", () => {
    const finding = analyse(rows, 2024, "Region", "Routine age-based screening", "followup").find(f => f.row.group === "Varsinais-Suomi")!;
    expect([finding.numerator, finding.denominator]).toEqual([4, 190]);
    expect(finding.status).toBe("review");
    expect(recommend(finding)[0].id).toBe("reconcile");
    expect(fallbackDraft(finding).interpretation).toContain("Incomplete reporting");
  });
});

describe("analysis limits", () => {
  it("handles missing follow-up and no denominator without a false zero finding", () => {
    const result = analyse([sample("A", { referred: null, completed: null }), sample("B")], 2024, "Test", "Synthetic test cohort", "followup");
    expect(result.every(f => f.status === "insufficient")).toBe(true);
    expect(result.find(f => f.row.group === "A")?.gap).toBeNull();
    expect(fallbackDraft(result.find(f => f.row.group === "A")!).interpretation).toContain("No pathway gap or cause can be established");
  });
  it("does not recommend a service change when there is no disparity", () => {
    const finding = analyse([sample("A"), sample("B")], 2024, "Test", "Synthetic test cohort", "participation")[0];
    expect(finding.gap).toBe(0);
    expect(finding.status).toBe("within");
    expect(recommend(finding)[0].id).toBe("monitor");
    expect(fallbackDraft(finding).interpretation).toContain("does not fall below");
  });
  it("does not flag a small extreme group or a single group", () => {
    const small = analyse([sample("A", { invited: 10, attended: 1, referred: 0, completed: 0 }), sample("B")], 2024, "Test", "Synthetic test cohort", "participation");
    expect(small.find(f => f.row.group === "A")?.status).toBe("insufficient");
    expect(analyse([sample("A")], 2024, "Test", "Synthetic test cohort", "participation")[0].gap).toBeNull();
  });
  it("has a valid Wilson interval at boundary rates", () => {
    expect(wilson(0, 0)).toBeNull();
    expect(wilson(0, 100)?.[0]).toBeCloseTo(0);
    expect(wilson(100, 100)?.[1]).toBeCloseTo(100);
    expect(wilson(80, 100)?.[0]).toBeCloseTo(71.117, 2);
  });
  it("rejects invalid counts, duplicate keys and totals that do not reconcile", () => {
    expect(() => validateRows([sample("A", { completed: 21 })])).toThrow("completed ≤");
    expect(() => validateRows([sample("A"), sample("A")])).toThrow("duplicate");
    expect(() => validateRows([sample("A"), sample("All groups", { invited: 200 })])).toThrow("reconcile");
    expect(() => validateRows([sample("A", { invited: Infinity })])).toThrow("whole counts");
  });
});

describe("CSV mapping", () => {
  it("supports renamed headers, quoted commas, UTF-8 BOM, and CRLF", () => {
    const table = parseCSV('\uFEFFperiod,population,eligible,screened\r\n2024,"Group, A",100,70\r\n2024,B,100,90');
    const result = normalise(table, suggestMapping(table.headers));
    expect(result[0].group).toBe("Group, A");
    expect(result[0].attended).toBe(70);
    expect(result[0].completed).toBeNull();
  });
  it("accepts semicolon CSV and escaped quotes", () => {
    expect(parseCSV('year;group;invited;attended\n2024;"Group ""A""";100;80').rows[0][1]).toBe('Group "A"');
  });
  it("rejects truncated, ragged and ambiguous header data", () => {
    expect(() => parseCSV('a,b\n"unfinished,1')).toThrow("Unclosed");
    expect(() => parseCSV('a,b\n1,2,3')).toThrow("consistent");
    expect(() => parseCSV('a,a\n1,2')).toThrow("unique");
    expect(() => parseCSV('a,b\n"x"oops,y')).toThrow("Unexpected");
  });
  it("rejects percentages and incomplete paired follow-up counts", () => {
    const table = parseCSV('year,group,invited,attended,referred\n2024,A,100,80,10');
    expect(() => normalise(table, suggestMapping(table.headers))).toThrow("both");
    const rates = parseCSV('year,group,invited,attended\n2024,A,100,80%');
    expect(() => normalise(rates, suggestMapping(rates.headers))).toThrow("whole count");
  });
});

describe("model draft boundary", () => {
  const valid = { headline: "Review the observed difference", interpretation: "Causes remain unresolved; reporting completeness needs review.", nextQuestion: "Are examinations recorded consistently?", evidenceIds: ["report", "quality"] };
  it("accepts a structurally valid qualitative draft", () => expect(validateDraft(valid)).toEqual(valid));
  it("rejects made-up citations, quantities and causal promises", () => {
    expect(() => validateDraft({ ...valid, evidenceIds: ["invented"] })).toThrow("evidence");
    expect(() => validateDraft({ ...valid, interpretation: "This will save 100 lives" })).toThrow("Unsupported");
    expect(() => validateDraft({ ...valid, interpretation: "The root cause is low capacity" })).toThrow("Unsupported");
  });
});
