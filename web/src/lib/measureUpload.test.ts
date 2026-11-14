import { describe, expect, it } from "vitest";
import { MEASURE_CSV_HEADER } from "@/data/measureKit";
import { exampleMeasureCsv, parseMeasureCsv } from "./measureUpload";

describe("parseMeasureCsv", () => {
  it("builds one sorted series per measure with the change from first to last month", () => {
    const r = parseMeasureCsv(exampleMeasureCsv());
    expect(r.error).toBeNull();
    expect(r.series.map((s) => s.id)).toEqual(["referral-to-specialist", "suspicion-to-diagnosis", "diagnosis-to-treatment"]);
    expect(r.series[0].points).toHaveLength(6);
    expect(r.series[0].change).toBe(-8);
  });

  it("accepts semicolons and decimal commas, as Finnish Excel saves them", () => {
    const r = parseMeasureCsv(`${MEASURE_CSV_HEADER.replace(/,/g, ";")}\n2026-02;;referral-to-specialist;12,5;30\n2026-01;;referral-to-specialist;14;28`);
    expect(r.series[0].points.map((p) => p.month)).toEqual(["2026-01", "2026-02"]);
    expect(r.series[0].last.days).toBe(12.5);
  });

  it("skips rows it can't read and explains a wrong header", () => {
    const r = parseMeasureCsv(`${MEASURE_CSV_HEADER}\n2026-13,,referral-to-specialist,10,\n2026-01,,unknown,10,\n2026-01,,referral-to-specialist,,\n2026-01,,referral-to-specialist,9,`);
    expect(r.skipped).toBe(3);
    expect(r.series[0].points).toEqual([{ month: "2026-01", days: 9, patients: null }]);
    expect(parseMeasureCsv("a,b\n1,2").error).toMatch(/first line/);
  });

  it("filters by cancer type when asked", () => {
    const csv = `${MEASURE_CSV_HEADER}\n2026-01,rinta,referral-to-specialist,10,\n2026-01,suoli,referral-to-specialist,20,`;
    expect(parseMeasureCsv(csv, "rinta").series[0].last.days).toBe(10);
  });
});
