import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "@/data/simulatorAssumptions";
import { assumptionsReportHtml, assumptionsToCsv } from "./assumptionsExport";
import { parseAssumptionsCsv, scenarioParams } from "./simulator";

describe("assumptionsToCsv", () => {
  it("reads back through the upload parser with the same figures and statuses", () => {
    const parsed = parseAssumptionsCsv(assumptionsToCsv(DEFAULT_ASSUMPTIONS));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    for (const a of DEFAULT_ASSUMPTIONS) {
      const b = parsed.assumptions.find((x) => x.key === a.key)!;
      expect([b.base, b.low, b.high, b.status]).toEqual([a.base, a.low, a.high, a.status]);
    }
  });

  it("writes the user's choices as the base value", () => {
    const parsed = parseAssumptionsCsv(assumptionsToCsv(DEFAULT_ASSUMPTIONS, { target_attendance: 80, cost_outreach: 75 }));
    if (!parsed.ok) throw new Error("did not parse");
    expect(parsed.assumptions.find((a) => a.key === "target_attendance")!.base).toBe(80);
    expect(parsed.assumptions.find((a) => a.key === "cost_outreach")!.base).toBe(75);
  });

  it("keeps the unit column free of commas so the columns stay aligned", () => {
    const rows = assumptionsToCsv(DEFAULT_ASSUMPTIONS).trim().split("\r\n").slice(1);
    for (const r of rows) expect(r.split(",").length).toBeGreaterThanOrEqual(7);
    expect(rows.find((r) => r.startsWith("incidence_50_69"))!.split(",")[5]).toBe("DERIVED");
  });
});

describe("assumptionsReportHtml", () => {
  it("lists every figure with its source and escapes the text", () => {
    const html = assumptionsReportHtml(DEFAULT_ASSUMPTIONS, scenarioParams(DEFAULT_ASSUMPTIONS, "central"), "central", new Date(2026, 10, 14));
    expect(html).toContain("Breast screening simulator: assumptions");
    expect(html).toContain("14 November 2026");
    expect(html).toContain("Treatment cost, distant");
    expect(html).toContain("Heinävaara");
    expect(html).not.toMatch(/<script/i);
  });
});
