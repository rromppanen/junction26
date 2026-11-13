"use client";

import { count, metricLabel, pct, pp } from "@/lib/analysis";
import type { PipelineReport, Source } from "@/lib/pipeline/types";

function SourceLink({ source }: { source: Source }) { return <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>; }
function assessment(status: string) { return status === "review" ? "Review signal" : status === "within" ? "Within threshold" : "Insufficient data"; }

export default function ResultsPanel({ report, onRestart }: { report: PipelineReport; onRestart: () => void }) {
  const { findings, integrations } = report;
  const reviews = findings.all.filter(finding => finding.status === "review");
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "care-equity-results.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <p className="eyebrow">ANALYSIS COMPLETE</p>
    <h1>{reviews.length ? "Here’s what needs attention." : "Your results are ready."}</h1>
    <p className="intro">{report.dataset.name} · {count(report.dataset.rowCount)} rows · latest period in each comparable cohort</p>
    <p className="integration-note">{integrations.recommendationMode === "gemini" ? "Recommendations generated with Gemini." : integrations.gemini === "not-configured" ? "Gemini is not configured. Showing source-based proposals." : "Gemini was unavailable or its response failed checks. Showing source-based proposals."} {integrations.context === "ok" ? "Context.dev retrieved additional evidence." : integrations.context === "not-configured" ? "Context.dev is not configured; reviewed guidelines were used." : "Live evidence was unavailable; reviewed guidelines were used."}</p>
    <section className="insights" aria-labelledby="insights-title">
      <h2 id="insights-title">Key insights</h2>
      <p className="muted small">Prioritised descriptive signals, not statistical significance or proven causes.</p>
      {findings.focus.map((finding, index) => <article className={`insight ${index === 0 ? "primary-insight" : ""}`} key={finding.id}>
        <div className="insight-heading"><div><span className="eyebrow">{finding.row.dimension} · {finding.row.year}</span><h3>{finding.row.group}</h3></div><strong className="gap-value">{finding.gap === null ? "No comparison" : pp(finding.gap)}</strong></div>
        <p>{metricLabel(finding.metric)}: <strong>{finding.denominator ? pct(finding.rate) : "no data"}</strong>{finding.benchmark !== null && <> vs <strong>{pct(finding.benchmark)}</strong> in the remaining groups</>}. <span className={`status ${finding.status}`}>{assessment(finding.status)}</span></p>
        <p className="small"><strong>Measured step:</strong> {finding.status === "insufficient" ? "Not established" : finding.stage}.</p>
        {finding.metric === "followup" && <p className="muted small">Verify reporting completeness before interpreting this as an access problem. These counts do not measure waiting times.</p>}
        {index === 0 && <div className="interpretation"><p>{report.interpretation.interpretation}</p><p><strong>Next question:</strong> {report.interpretation.nextQuestion}</p></div>}
        <div className="linked-actions"><h4>Recommended next action</h4>
          {report.recommendations.filter(action => action.findingId === finding.id).map(action => <section className="recommendation" key={action.id}>
            <h3>{action.title}</h3><p className="muted small">Proposed owner: {action.owner}</p>
            <ol>{action.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <p className="small"><strong>Evaluate with:</strong> {action.measure}</p>
            <p className="muted small">{action.timeframe}. This is a planning proposal, not a clinical target.</p>
            <p className="source-links"><span>Evidence:</span>{action.evidenceIds.map(id => { const source = report.sources.find(source => source.id === id); return source ? <SourceLink key={id} source={source}/> : null; })}</p>
            <details><summary>What the evidence supports</summary>{action.evidenceIds.map(id => {
              const source = report.sources.find(source => source.id === id);
              return source ? <div className="source" key={id}><SourceLink source={source}/><p className="small">{source.text}</p><p className="small muted">{source.locator} · {source.kind === "web" ? "Retrieved excerpt; appraisal required." : "Reviewed source summary."}</p><p className="small muted">{source.limitation}</p></div> : null;
            })}</details>
          </section>)}
          {!report.recommendations.some(action => action.findingId === finding.id) && <p className="muted small">No additional evidence-supported action was generated for this finding. Review the data before selecting an intervention.</p>}
        </div>
      </article>)}
    </section>
    <p className="limits">Causes remain unresolved. Recommendations need a service lead’s review; local benefits are not established. This screening dataset does not measure survival or treatment-start timeliness.</p>
    <details><summary>How your data were standardised and cleaned</summary>
      <ul>{report.dataset.cleaning.map(change => <li key={change}>{change}</li>)}</ul>
      {report.dataset.warnings.map(warning => <p key={warning}>{warning}</p>)}
      <p className="small">Column mapping: {report.dataset.mappingMode}. Source checksum: <code>{report.dataset.sha256}</code>.</p>
      <div className="table-wrap"><table><thead><tr><th>Standard field</th><th>Original column</th></tr></thead><tbody>{Object.entries(report.dataset.mapping).map(([field, column]) => <tr key={field}><td>{field}</td><td>{column || "Not provided"}</td></tr>)}</tbody></table></div>
    </details>
    <details><summary>All findings and analysis method</summary>
      <p>Every available dimension is analysed in its latest period, separately by cohort. Groups are compared with their disjoint remainder. Review signals use a descriptive five-percentage-point threshold and at least thirty observations in both denominators. No significance tests, confounder adjustment or causal identification are performed.</p>
      <div className="table-wrap"><table><thead><tr><th>Group / period</th><th>Measure</th><th>Rate</th><th>Difference</th><th>Assessment</th></tr></thead><tbody>{findings.all.map(finding => <tr key={finding.id}><th scope="row">{finding.row.group}<span className="row-note">{finding.row.dimension} · {finding.row.year} · {finding.row.cohort}</span></th><td>{metricLabel(finding.metric)}</td><td>{finding.denominator ? pct(finding.rate) : "No data"}</td><td>{finding.gap === null ? "—" : pp(finding.gap)}</td><td>{assessment(finding.status)}</td></tr>)}</tbody></table></div>
    </details>
    <details><summary>Evidence library and Context.dev results</summary>{report.sources.map(source => <div className="source" key={source.id}><SourceLink source={source}/><p>{source.text}</p><p className="small muted">{source.kind} · {source.locator}{source.retrievedAt ? ` · Retrieved ${source.retrievedAt}` : ""}</p><p className="small muted">{source.limitation}</p></div>)}</details>
    <div className="step-actions"><button className="secondary" onClick={onRestart}>Analyse another dataset</button><button onClick={download}>Download results</button></div>
  </>;
}
