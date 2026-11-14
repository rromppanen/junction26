import snapshot from "../src/data/screening.json" with { type: "json" };
import { analyseDataset } from "../src/lib/pipeline/analyse";
import { fallbackDraft, recommend } from "../src/lib/analysis";
import { reviewedSources } from "../src/lib/pipeline/research";
import { fields } from "../src/lib/csv";
import type { PipelineEvent, PipelineReport, PreparedData } from "../src/lib/pipeline/types";

const dataset: PreparedData = { name: snapshot.manifest.title, sha256: snapshot.manifest.sha256, rows: snapshot.rows,
  mapping: Object.fromEntries(fields.map(field => [field, field])) as PreparedData["mapping"], official: true,
  mappingMode: "known-schema", cleaning: ["Verified schema.", "Totals reconcile."], warnings: [] };
const findings = analyseDataset(dataset);
const { rows, ...metadata } = dataset;
export const report: PipelineReport = { dataset: { ...metadata, rowCount: rows.length },
  findings, interpretation: fallbackDraft(findings.focus[0]), recommendations: findings.focus.map(finding => ({ ...recommend(finding)[0], findingId: finding.id })),
  sources: reviewedSources, integrations: { gemini: "not-configured", context: "not-configured", recommendationMode: "templates" }, generatedAt: "2026-11-13T18:00:00Z" };
export function resultStream(value = report) {
  const events: PipelineEvent[] = [
    { type: "progress", stage: "prepare", status: "running", message: "Reading the dataset." },
    { type: "progress", stage: "prepare", status: "complete", message: "Rows validated." },
    { type: "progress", stage: "analyse", status: "running", message: "Comparing groups." },
    { type: "progress", stage: "analyse", status: "complete", message: "Comparisons complete." },
    { type: "progress", stage: "research", status: "running", message: "Searching evidence." },
    { type: "progress", stage: "research", status: "complete", message: "Sources available." },
    { type: "progress", stage: "recommend", status: "running", message: "Generating recommendations." },
    { type: "progress", stage: "recommend", status: "complete", message: "Proposals checked." },
    { type: "result", report: value },
  ];
  return events.map(event => JSON.stringify(event)).join("\n") + "\n";
}
