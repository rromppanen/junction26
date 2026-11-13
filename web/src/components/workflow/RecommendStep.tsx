"use client";

import { useEffect, useState } from "react";
import { count, Draft, fallbackDraft, metricLabel, pct, pp, recommend } from "@/lib/analysis";
import { evidence } from "@/data/evidence";
import type { AnalysisResult, PreparedDataset } from "./types";
import { findingStatus } from "./types";

type BriefResult = { draft: Draft; mode: string; reason: string; generatedAt?: string };

export default function RecommendStep({ dataset, analysis, onBack, onRestart }: {
  dataset: PreparedDataset;
  analysis: AnalysisResult;
  onBack: () => void;
  onRestart: () => void;
}) {
  const finding = analysis.findings.find(f => f.row.group === analysis.selectedGroup)!;
  const actions = recommend(finding);
  const [brief, setBrief] = useState<BriefResult>({ draft: fallbackDraft(finding), mode: "template", reason: "Source-based interpretation template." });
  const [loading, setLoading] = useState(dataset.official);
  const sourceIds = new Set(["report", "quality", ...actions.flatMap(action => action.evidenceIds), ...brief.draft.evidenceIds]);
  const sources = evidence.filter(source => sourceIds.has(source.id));

  useEffect(() => {
    if (!dataset.official) return;
    const controller = new AbortController();
    let disposed = false;
    const timer = setTimeout(() => controller.abort(), 25000);
    async function draft() {
      try {
        const response = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ ...analysis.selection, group: finding.row.group, useAI: true }) });
        if (!response.ok) throw new Error("Brief service unavailable.");
        const result: BriefResult = await response.json();
        if (!disposed) setBrief(result);
      } catch {
        if (!disposed) setBrief({ draft: fallbackDraft(finding), mode: "template", reason: "AI drafting unavailable or timed out. Showing the source-based interpretation template." });
      } finally { clearTimeout(timer); if (!disposed) setLoading(false); }
    }
    void draft();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [dataset.official, analysis, finding]);

  function exportResults() {
    const data = JSON.stringify({ dataset: { name: dataset.name, sha256: dataset.sha256, sourceUrl: dataset.sourceUrl, official: dataset.official }, analysis, interpretation: brief, recommendations: actions, sources }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "care-equity-results.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <h1>Recommendations</h1>
    <p className="intro">{finding.row.group} · {analysis.selection.year} · {metricLabel(analysis.selection.metric)}</p>
    <section className="finding-summary">
      <h2>What the data show</h2>
      <p>{finding.denominator ? <><strong>{pct(finding.rate)}</strong> ({count(finding.numerator)} / {count(finding.denominator)})</> : "No recorded denominator"}
        {finding.benchmark !== null && <> compared with <strong>{pct(finding.benchmark)}</strong> in the remaining groups.</>}
      </p>
      <p>{finding.gap !== null && <strong>{pp(finding.gap)} · </strong>}{findingStatus(finding.status)}</p>
      <h3>Where the difference appears</h3>
      {loading && <p className="muted small" role="status">Preparing an interpretation. Calculated findings and proposals are available below.</p>}
      <p>{brief.draft.interpretation}</p>
      <p className="muted"><strong>Next question:</strong> {brief.draft.nextQuestion}</p>
      <span className="mode-label">{brief.mode === "ai" ? "AI draft · needs source review" : brief.mode === "cached-ai" ? "Cached AI draft · needs source review" : "Source-based template"}</span>
    </section>
    <section>
      <h2>What to do next</h2>
      {actions.map((action, index) => <article className="recommendation" key={action.id}>
        <h3>{index + 1}. {action.title}</h3>
        <p className="muted small">Owner: {action.owner}</p>
        <ol>{action.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p><strong>Measure:</strong> {action.measure}</p>
        <p className="muted small">{action.timeframe}. Proposed planning window, not a clinical target.</p>
        <p className="source-links"><span>Evidence:</span>{action.evidenceIds.map(id => {
          const source = evidence.find(item => item.id === id)!;
          return <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>;
        })}</p>
      </article>)}
    </section>
    <p className="limits">Causes remain unresolved. Recorded follow-up is not a waiting-time measure. Review applicability before implementing an action; local benefits are not established.</p>
    <details><summary>Sources and analysis details</summary>
      <p>{dataset.official ? "Official Registry data" : `Uploaded counts: ${dataset.name}. Registry references explain definitions and guidance; they do not verify uploaded values.`}</p>
      <p className="small">Source row: {finding.row.locator ?? "See uploaded CSV"}</p>
      {finding.interval && <p className="small">Illustrative 95% Wilson binomial interval: {pct(finding.interval[0])}–{pct(finding.interval[1])}. This is not the publisher’s inferential comparison.</p>}
      <p className="small">{brief.reason} {brief.generatedAt && `Generated ${brief.generatedAt}.`}</p>
      {sources.map(source => <div className="source" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><p className="small">{source.locator}</p><p className="small muted">{source.limitation}</p></div>)}
      <p className="small">This prototype measures screening processes. It does not directly measure Goal 3 survival, mortality or timely treatment, and is not a systematic literature review.</p>
    </details>
    <div className="step-actions"><button className="secondary" onClick={onBack}>Back to analysis</button><button onClick={exportResults}>Download results</button></div>
    <button className="text-button restart" onClick={onRestart}>Start a new analysis</button>
  </>;
}
