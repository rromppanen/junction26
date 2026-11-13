"use client";

import { useState } from "react";
import { analyse, count, metricLabel, Metric, pct, pp } from "@/lib/analysis";
import type { AnalysisResult, AnalysisSelection, PreparedDataset } from "./types";
import { findingStatus } from "./types";

const unique = <T,>(values: T[]) => [...new Set(values)];
export default function AnalyseStep({ dataset, previous, onAnalysed, onContinue, onBack }: {
  dataset: PreparedDataset;
  previous: AnalysisResult | null;
  onAnalysed: (result: AnalysisResult) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const years = unique(dataset.rows.map(row => row.year)).sort((a, b) => b - a);
  const [year, setYear] = useState(previous?.selection.year ?? years[0]);
  const dimensions = unique(dataset.rows.filter(row => row.year === year).map(row => row.dimension));
  const [dimension, setDimension] = useState(previous?.selection.dimension ?? (dimensions.includes("Language") ? "Language" : dimensions[0]));
  const selectedDimension = dimensions.includes(dimension) ? dimension : dimensions[0];
  const cohorts = unique(dataset.rows.filter(row => row.year === year && row.dimension === selectedDimension).map(row => row.cohort));
  const [cohort, setCohort] = useState(previous?.selection.cohort ?? cohorts[0]);
  const selectedCohort = cohorts.includes(cohort) ? cohort : cohorts[0];
  const [metric, setMetric] = useState<Metric>(previous?.selection.metric ?? "participation");
  const [result, setResult] = useState<AnalysisResult | null>(previous);
  const selection: AnalysisSelection = { year, dimension: selectedDimension, cohort: selectedCohort, metric };
  const current = result && JSON.stringify(result.selection) === JSON.stringify(selection) ? result : null;

  function run() {
    const findings = analyse(dataset.rows, year, selectedDimension, selectedCohort, metric);
    const selected = findings.find(f => f.status === "review") ?? findings.find(f => f.status === "within") ?? findings[0];
    const next = { selection, findings, selectedGroup: selected?.row.group ?? "", generatedAt: new Date().toISOString() };
    setResult(next); onAnalysed(next);
  }
  function selectGroup(group: string) {
    if (!current) return;
    const next = { ...current, selectedGroup: group }; setResult(next); onAnalysed(next);
  }

  return <>
    <h1>Analyse the dataset</h1>
    <p className="intro">Choose a comparison, then run the analysis.</p>
    <div className="analysis-controls">
      <label>Compare by<select value={selectedDimension} onChange={event => setDimension(event.target.value)}>{dimensions.map(d => <option key={d}>{d}</option>)}</select></label>
      <label>Year<select value={year} onChange={event => setYear(Number(event.target.value))}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
      <label>Measure<select value={metric} onChange={event => setMetric(event.target.value as Metric)}><option value="participation">Screening participation</option><option value="followup">Recorded follow-up completion</option></select></label>
      {cohorts.length > 1 && <label>Cohort<select value={selectedCohort} onChange={event => setCohort(event.target.value)}>{cohorts.map(c => <option key={c}>{c}</option>)}</select></label>}
    </div>
    <p className="muted small">{selectedCohort}</p>
    <button onClick={run} className="run-button">Run analysis</button>
    {current && <section aria-live="polite">
      <h2>Findings</h2>
      <p className="muted">Select a group for the recommendation step.</p>
      <div className="table-wrap"><table><thead><tr><th>Group</th><th>Rate</th><th>Rest of groups</th><th>Difference</th><th>Assessment</th></tr></thead><tbody>
        {current.findings.map(finding => <tr key={finding.row.group} className={current.selectedGroup === finding.row.group ? "selected-row" : ""}>
          <th scope="row"><button className="group-button" aria-pressed={current.selectedGroup === finding.row.group} onClick={() => selectGroup(finding.row.group)}>{finding.row.group}</button><span className="row-note">{count(finding.denominator)} {metric === "participation" ? "invited" : "referred"}</span></th>
          <td>{finding.denominator ? pct(finding.rate) : "No data"}</td>
          <td>{finding.benchmark === null ? "—" : pct(finding.benchmark)}</td>
          <td>{finding.gap === null ? "—" : pp(finding.gap)}</td>
          <td><span className={`status ${finding.status}`}>{findingStatus(finding.status)}</span></td>
        </tr>)}
      </tbody></table></div>
      {!current.findings.length && <p>No population groups are available for this selection.</p>}
      <details><summary>How this analysis works</summary>
        <p>{metricLabel(metric)} is compared with the remaining disjoint groups using their actual denominators. A review signal means at least 5 percentage points below those groups, with at least 30 observations in both denominators.</p>
        <p>These are descriptive, unadjusted comparisons, not significance tests or causal findings. Unknown categories are retained. Population tables are separate views and cannot be joined into individual records.</p>
      </details>
    </section>}
    <div className="step-actions"><button className="secondary" onClick={onBack}>Back</button><button disabled={!current?.selectedGroup} onClick={onContinue}>Continue to recommendations</button></div>
  </>;
}
