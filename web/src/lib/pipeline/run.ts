import { prepare } from "./prepare";
import { analyseDataset } from "./analyse";
import { research } from "./research";
import { generateRecommendations } from "./recommend";
import type { PipelineEvent, PipelineInput, PipelineReport, Stage } from "./types";

export async function runPipeline(input: PipelineInput, emit: (event: PipelineEvent) => void, signal?: AbortSignal): Promise<PipelineReport> {
  const progress = (stage: Stage, status: "running" | "complete", message: string) => {
    signal?.throwIfAborted(); emit({ type: "progress", stage, status, message });
  };
  progress("prepare", "running", "Reading the dataset, mapping columns and validating count definitions.");
  const dataset = await prepare(input, signal);
  progress("prepare", "complete", `${dataset.rows.length} rows standardised and validated. ${dataset.cleaning[1]}`);
  progress("analyse", "running", "Comparing every available population dimension in its latest reporting period.");
  const findings = analyseDataset(dataset);
  if (!findings.focus.length) throw new Error("The dataset has no population groups to analyse.");
  progress("analyse", "complete", `${findings.all.length} group/measure comparisons calculated. ${findings.all.filter(finding => finding.status === "review").length} descriptive review signals.`);
  progress("research", "running", process.env.CONTEXT_DEV_API_KEY ? "Retrieving relevant public evidence with Context.dev and matching reviewed guidelines." : "Matching reviewed guidelines. Context.dev is not configured.");
  const evidence = await research(findings, signal);
  progress("research", "complete", evidence.context.status === "ok" ? `${evidence.context.snippets.length} Context.dev excerpts retrieved alongside reviewed guidelines.` : evidence.context.status === "not-configured" ? "Context.dev key is not configured; using the reviewed guideline library." : "Live evidence was unavailable or empty; using the reviewed guideline library.");
  progress("recommend", "running", process.env.GEMINI_API_KEY ? "Generating evidence-linked recommendations with Gemini and checking the response." : "Preparing evidence-linked proposals from source-based templates. Gemini is not configured.");
  const recommendations = await generateRecommendations(findings, evidence.sources, signal);
  progress("recommend", "complete", recommendations.mode === "gemini" ? "Gemini recommendations generated and checked. Source applicability still needs review." : "Source-based proposals prepared. Gemini is unavailable or not configured.");
  const { rows, ...metadata } = dataset;
  const report: PipelineReport = { dataset: { ...metadata, rowCount: rows.length }, findings, interpretation: recommendations.interpretation, recommendations: recommendations.recommendations,
    sources: evidence.sources, integrations: { gemini: recommendations.status, context: evidence.context.status, recommendationMode: recommendations.mode }, generatedAt: new Date().toISOString() };
  emit({ type: "result", report });
  return report;
}
