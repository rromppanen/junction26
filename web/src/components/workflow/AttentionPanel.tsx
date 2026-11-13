"use client";

import { useState } from "react";
import type { Field, Mapping } from "@/lib/csv";
import type { Attention } from "@/lib/pipeline/types";

export default function AttentionPanel({ attention, onContinue, onReplace }: {
  attention: Attention; onContinue: (mapping: Mapping) => void; onReplace: () => void;
}) {
  const [mapping, setMapping] = useState(attention.mapping);
  const labels: Record<Field, string> = { year: "Reporting year", group: "Population group", dimension: "Group dimension", cohort: "Screening cohort", invited: "Invited count", attended: "Attended count", referred: "Referral count", completed: "Recorded examination count" };
  return <section className="attention-panel" aria-labelledby="attention-title">
    <p className="eyebrow">ONE DETAIL NEEDS YOUR ATTENTION</p>
    <h1 id="attention-title">Help us resolve the column meaning.</h1>
    <p className="intro">{attention.message}</p>
    <div className="clarification-fields">{attention.fields.map(field => <label key={field}>{labels[field]}<select aria-label={labels[field]} value={mapping[field]} onChange={event => setMapping({ ...mapping, [field]: event.target.value })}><option value="">Not provided</option>{attention.headers.map(header => <option key={header}>{header}</option>)}</select></label>)}</div>
    <p className="muted small">If the file has no suitable column, choose another extract. Missing counts will not be invented.</p>
    <div className="step-actions"><button className="secondary" onClick={onReplace}>Choose another file</button><button onClick={() => onContinue(mapping)}>Continue automatically</button></div>
  </section>;
}
