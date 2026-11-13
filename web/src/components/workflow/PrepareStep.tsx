"use client";

import { useState } from "react";
import { validateRows } from "@/lib/analysis";
import { fields, Mapping, normalise, requiredFields, suggestMapping } from "@/lib/csv";
import type { InputDataset, PreparedDataset } from "./types";

export default function PrepareStep({ input, initialMapping, onPrepared, onBack }: {
  input: InputDataset;
  initialMapping?: Mapping;
  onPrepared: (dataset: PreparedDataset) => void;
  onBack: () => void;
}) {
  const [mapping, setMapping] = useState<Mapping | null>(() => input.kind === "csv" ? initialMapping ?? suggestMapping(input.table.headers) : null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  function prepare() {
    if (!confirmed) return;
    try {
      const rows = input.kind === "official" ? validateRows(input.rows) : normalise(input.table, mapping!);
      if (!rows.some(row => row.group !== "All groups")) throw new Error("Include population groups, not only an All groups total.");
      onPrepared({ name: input.name, rows, sha256: input.sha256, official: input.kind === "official",
        ...(input.kind === "official" ? { sourceUrl: input.sourceUrl } : { mapping: mapping! }) });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The dataset could not be validated."); }
  }

  return <>
    <h1>Prepare the data</h1>
    <p className="intro">Check what the columns mean before analysing.</p>
    <p className="file-summary"><strong>{input.name}</strong><span>{input.kind === "official" ? input.rows.length : input.table.rows.length} rows</span></p>
    {input.kind === "official" ? <div className="summary-box">
      <p>The published Registry columns are already mapped: year, population group, cohort, invited, attended, referred and recorded examination.</p>
      <p className="muted">Demographic tables pool routine and risk-group screening. Age and region tables use routine screening only; they are analysed separately.</p>
      <a href={input.sourceUrl} target="_blank" rel="noreferrer">Original Registry tables ↗</a>
    </div> : mapping && <>
      <div className="table-wrap"><table className="mapping-table"><thead><tr><th>Field</th><th>Your column</th><th>First value</th></tr></thead><tbody>
        {fields.map(field => <tr key={field}>
          <th scope="row">{field}{requiredFields.includes(field) ? " *" : ""}</th>
          <td><select aria-label={`Map ${field}`} value={mapping[field]} onChange={event => {
            setMapping({ ...mapping, [field]: event.target.value }); setConfirmed(false); setError("");
          }}><option value="">{requiredFields.includes(field) ? "Choose a column" : "Not provided"}</option>
            {input.table.headers.map(header => <option key={header}>{header}</option>)}</select></td>
          <td>{mapping[field] ? input.table.rows[0][input.table.headers.indexOf(mapping[field])] : "—"}</td>
        </tr>)}
      </tbody></table></div>
      <p className="muted small">* Required. Without dimension or cohort columns, use the mapped group column name and a user-confirmed screening cohort. Missing paired follow-up counts disable that analysis.</p>
    </>}
    <label className="confirmation"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>
      <span>I confirm the definitions: public aggregate cervical-screening counts, with disjoint and comparable groups in each cohort and year.</span>
    </label>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="step-actions"><button className="secondary" onClick={onBack}>Back</button><button onClick={prepare} disabled={!confirmed}>Continue to analysis</button></div>
  </>;
}
