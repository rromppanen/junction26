"use client";

import { useState } from "react";
import type { PipelineInput } from "@/lib/pipeline/types";

export default function UploadStep({ onUpload }: { onUpload: (input: PipelineInput) => void }) {
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function read(file: File) {
    setError(""); setReading(true);
    try {
      if (file.size > 1_000_000) throw new Error("Choose a CSV under 1 MB.");
      onUpload({ kind: "csv", name: file.name, csv: await file.text() });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read the file."); }
    finally { setReading(false); }
  }
  return <>
    <p className="eyebrow">FROM DATA TO AN EVIDENCE-BASED NEXT STEP</p>
    <h1>Upload your data.<br/>We’ll take it from here.</h1>
    <p className="intro">We standardise and clean the dataset, find population differences, and generate recommendations with their evidence.</p>
    <div className="upload-area">
      <label htmlFor="dataset-file">Upload a public screening dataset</label>
      <input id="dataset-file" type="file" accept=".csv,text/csv" disabled={reading} onChange={event => {
        const file = event.target.files?.[0]; if (file) void read(file); event.target.value = "";
      }}/>
      <p className="muted small">CSV · up to 1 MB · public aggregate cervical-screening counts</p>
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    <p className="privacy-note">Uploading starts processing automatically. Gemini may receive column examples and aggregate findings; Context.dev searches public evidence. Do not upload patient records.</p>
    <div className="demo-option"><button className="secondary" onClick={() => onUpload({ kind: "demo" })} disabled={reading}>Try the public Registry dataset</button><a href="/data/screening.csv" download>Example CSV</a></div>
    <details><summary>What data can I use?</summary><p>This first prototype supports year, population group, invited and attended counts, plus optional paired referral and examination counts. Different column names and common numeric formatting are handled automatically. If a field’s meaning cannot be established, we ask one focused question.</p></details>
  </>;
}
