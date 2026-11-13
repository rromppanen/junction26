import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/pipeline/route";
import { fields, Mapping } from "../csv";
import { analyseDataset } from "./analyse";
import { checkMapping, cleanCounts, prepare } from "./prepare";
import { reviewedSources } from "./research";
import { validateRecommendations } from "./recommend";
import { runPipeline } from "./run";
import { NeedsAttention, PipelineEvent } from "./types";

const csv = "year,language,invited,attended,referred,completed\n2024,A,100,50,20,10\n2024,B,100,90,20,20";
const mapping = Object.fromEntries(fields.map(field => [field, ["year", "invited", "attended", "referred", "completed"].includes(field) ? field : field === "group" ? "language" : ""])) as Mapping;
const reply = (value: unknown) => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
beforeEach(() => { vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("CONTEXT_DEV_API_KEY", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("automatic preparation", () => {
  it("cleans formatting, retains provenance, and never imputes missing outcomes", async () => {
    const data = await prepare({ kind: "csv", name: "counts.csv", csv: 'year,language,invited,attended,referred,completed\n2024,A,"1,000",500.0,NA,NA\n2024,B,1000,800,20,20' });
    expect(data.rows[0]).toMatchObject({ invited: 1000, attended: 500, referred: null, completed: null, dimension: "Language" });
    expect(data.cleaning[1]).toContain("4 numeric");
    expect(data.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.rows[0].locator).toContain("counts.csv");
  });
  it("does not turn fractional values or percentages into whole counts", () => {
    const table = cleanCounts({ headers: ["invited", "attended"], rows: [["100.5", "80%"]] }, mapping);
    expect(table.changes).toBe(0);
    expect(table.table.rows[0]).toEqual(["100.5", "80%"]);
  });
  it("asks only for unresolved fields and resumes with an explicit correction", async () => {
    const input = { kind: "csv" as const, name: "renamed.csv", csv: "year,language,invited,observed_total\n2024,A,100,50\n2024,B,100,90" };
    try { await prepare(input); throw new Error("Expected attention"); }
    catch (error) { expect(error).toBeInstanceOf(NeedsAttention); expect((error as NeedsAttention).attention.fields).toEqual(["attended"]); }
    const data = await prepare({ ...input, mapping: { ...mapping, attended: "observed_total", referred: "", completed: "" } });
    expect(data.mappingMode).toBe("user-corrected"); expect(data.rows[0].attended).toBe(50);
  });
  it("uses Gemini to resolve unfamiliar headers automatically", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-gemini-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply({ mapping: { ...mapping, attended: "observed_total", referred: "", completed: "" }, uncertainFields: [] })));
    const data = await prepare({ kind: "csv", name: "renamed.csv", csv: "year,language,invited,observed_total\n2024,A,100,50\n2024,B,100,90" });
    expect(data.mappingMode).toBe("gemini"); expect(data.rows[0].attended).toBe(50);
  });
  it("rejects invented columns, duplicate mappings and implausible counts", async () => {
    expect(() => checkMapping({ mapping, uncertainFields: [] }, ["year"])).toThrow("existing header");
    expect(() => checkMapping({ mapping: { ...mapping, group: "year" }, uncertainFields: [] }, Object.values(mapping))).toThrow("multiple concepts");
    await expect(prepare({ kind: "csv", name: "bad.csv", csv: "year,group,invited,attended\n2024,A,100,101" })).rejects.toThrow("counts must satisfy");
    await expect(prepare({ kind: "csv", name: "long-header.csv", csv: `${"x".repeat(161)},group,invited,attended\n2024,A,100,50` })).rejects.toThrow("160 characters");
  });
});

describe("whole-dataset analysis and evidence validation", () => {
  it("automatically analyses both measures across every latest comparable slice", async () => {
    const findings = analyseDataset(await prepare({ kind: "demo" }));
    expect(findings.all).toHaveLength(86);
    expect(new Set(findings.all.map(finding => finding.row.dimension)).size).toBe(5);
    expect(findings.all.every(finding => finding.row.year === 2024)).toBe(true);
    expect(findings.focus[0].row.group).toBe("Varsinais-Suomi");
    expect(findings.focus[0].stage).toBe("Referral → recorded examination");
  });
  it("does not force a negative finding from equal group outcomes", async () => {
    const report = await runPipeline({ kind: "csv", name: "equal.csv", csv: "year,group,invited,attended\n2024,A,100,80\n2024,B,100,80" }, () => {});
    expect(report.findings.all.every(finding => finding.status === "within")).toBe(true);
    expect(report.interpretation.interpretation).toContain("does not fall below");
    expect(report.recommendations[0].id).toContain("template");
  });
  it("requires reviewed intervention evidence and a real finding reference", async () => {
    const findings = analyseDataset(await prepare({ kind: "csv", name: "counts.csv", csv }));
    const value = { interpretation: { headline: "Review the measured difference", interpretation: "Causes remain unresolved.", nextQuestion: "Are reports complete?", evidenceIds: ["report", "quality"] }, recommendations: [{ findingId: findings.focus[0].id, title: "Review the process", owner: "Programme lead", timeframe: "During the initial review", steps: ["Check reporting completeness."], measure: "Recorded completion", evidenceIds: ["report"] }] };
    expect(() => validateRecommendations(value, findings, reviewedSources)).toThrow("guideline");
    value.recommendations[0].evidenceIds = ["quality"];
    expect(validateRecommendations(value, findings, reviewedSources).recommendations).toHaveLength(1);
    value.recommendations[0].findingId = "invented";
    expect(() => validateRecommendations(value, findings, reviewedSources)).toThrow("focus finding");
  });
});

describe("automatic pipeline integration", () => {
  it("streams actual stages and returns labelled fallback proposals without keys", async () => {
    const external = vi.fn(); vi.stubGlobal("fetch", external);
    const response = await POST(new Request("http://localhost/api/pipeline", { method: "POST", body: JSON.stringify({ kind: "demo" }) }));
    const events = (await response.text()).trim().split("\n").map(line => JSON.parse(line) as PipelineEvent);
    expect(events.filter(event => event.type === "progress")).toHaveLength(8);
    const result = events.at(-1); expect(result?.type).toBe("result");
    if (result?.type !== "result") throw new Error("Missing result");
    expect(result.report.integrations).toEqual({ gemini: "not-configured", context: "not-configured", recommendationMode: "templates" });
    expect(result.report.recommendations.length).toBeGreaterThan(0); expect(external).not.toHaveBeenCalled();
  });
  it("runs uploaded data through Gemini mapping, Context.dev search and generated recommendations", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-gemini-key"); vi.stubEnv("CONTEXT_DEV_API_KEY", "test-only-context-key");
    const external = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      if (url.includes("context.dev")) return Response.json({ results: [{ url: "https://thl.fi/screening-guidance", title: "Screening guidance", description: "Reconcile screening referrals with examination records." }] });
      const body = JSON.parse(options.body as string);
      if (body.generationConfig.responseSchema.properties.mapping) return reply({ mapping, uncertainFields: [] });
      const input = JSON.parse(body.contents[0].parts[0].text);
      return reply({ interpretation: { headline: "A measured gap warrants review", interpretation: "Causes remain unresolved. Check reporting completeness before changing services.", nextQuestion: "Are examination reports complete?", evidenceIds: ["report", "quality", "live:1"] }, recommendations: [{ findingId: input.findings[0].id, title: "Reconcile follow-up records", owner: "Screening programme lead", timeframe: "During the initial review", steps: ["Review unresolved referrals and reporting completeness."], measure: "Recorded examination completion", evidenceIds: ["quality", "live:1"] }] });
    });
    vi.stubGlobal("fetch", external);
    const report = await runPipeline({ kind: "csv", name: "counts.csv", csv }, () => {});
    expect(report.dataset.mappingMode).toBe("gemini");
    expect(report.integrations).toEqual({ gemini: "ok", context: "ok", recommendationMode: "gemini" });
    expect(report.recommendations[0].title).toBe("Reconcile follow-up records");
    expect(report.sources.some(source => source.id === "live:1")).toBe(true);
    const search = external.mock.calls.find(([url]) => String(url).includes("context.dev"));
    expect(search?.[1].headers.Authorization).toBe("Bearer test-only-context-key");
    expect(JSON.parse(search?.[1].body as string).query).not.toContain("counts.csv");
  });
  it("falls back after provider errors or rejected generated recommendations", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-gemini-key");
    const external = vi.fn().mockResolvedValue(reply({ interpretation: { headline: "Saves 500 lives" }, recommendations: [] }));
    vi.stubGlobal("fetch", external);
    const report = await runPipeline({ kind: "demo" }, () => {});
    expect(report.integrations.gemini).toBe("error"); expect(report.integrations.recommendationMode).toBe("templates");
    expect(external).toHaveBeenCalledTimes(2);
  });
  it("returns an attention event for ambiguous input and rejects malformed or oversized requests", async () => {
    const response = await POST(new Request("http://localhost/api/pipeline", { method: "POST", body: JSON.stringify({ kind: "csv", name: "unknown.csv", csv: "year,group,invited,mystery\n2024,A,100,50" }) }));
    expect(await response.text()).toContain('"type":"attention"');
    expect((await POST(new Request("http://localhost/api/pipeline", { method: "POST", body: "invalid" }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/pipeline", { method: "POST", body: "x".repeat(2_100_001) }))).status).toBe(400);
  });
  it("exposes configuration flags without disclosing keys", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-private-value");
    const text = await (await GET()).text(); expect(text).toContain('"geminiConfigured":true'); expect(text).not.toContain("test-only-private-value");
  });
});
