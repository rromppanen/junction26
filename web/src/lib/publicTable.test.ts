import { describe, expect, it } from "vitest";
import { getDataset } from "./data";
import { findGaps } from "./gaps";
import { validateMapping } from "./intake/fields";
import { publicTable } from "./publicTable";

describe("publicTable", () => {
  it("turns the Registry counts into a table the gap engine reads: counties, sex, language, education, birthplace", async () => {
    const ds = await getDataset();
    const t = publicTable(ds.regions.filter((r) => r.kind === "county"));
    const table = { headers: t.headers, rows: t.rows };
    expect(validateMapping(table, t.mapping).filter((e) => !/must be a whole/.test(e))).toEqual([]);
    const r = findGaps(table, t.mapping, t.groupKinds);
    expect(r.dimensions.map((d) => d.kind).sort()).toEqual(["birthCountry", "education", "language", "region", "sex"]);
    expect(r.metrics).toEqual(["participation", "followUp"]);
    // Counties are named, and men take part less than women nationally (Registry: 2022 73% vs 81%).
    expect(r.dimensions.find((d) => d.kind === "region")!.byMetric.participation!.some((g) => g.value === "Pirkanmaa")).toBe(true);
    expect(r.findings.some((f) => f.dimension.kind === "sex" && f.group.value === "mies" && f.metric === "participation")).toBe(true);
    expect(r.findings.some((f) => f.dimension.kind === "language" && f.metric === "participation")).toBe(true);
  });
});
