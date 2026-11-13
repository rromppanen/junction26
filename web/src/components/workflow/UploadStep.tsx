"use client";

import { useState } from "react";
import { parseCSV } from "@/lib/csv";
import type { InputDataset } from "./types";

export default function UploadStep({ onUpload, onDemo }: {
  onUpload: (dataset: InputDataset) => void;
  onDemo: () => void;
}) {
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  async function readFile(file: File) {
    setError("");
    setReading(true);
    try {
      if (file.size > 1_000_000) throw new Error("Choose a CSV under 1 MB.");
      const text = await file.text();
      const table = parseCSV(text);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      const sha256 = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
      onUpload({ kind: "csv", name: file.name, table, sha256 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be read.");
    } finally { setReading(false); }
  }

  return <>
    <h1>Upload a dataset</h1>
    <p className="intro">Start with public aggregate cervical-screening counts.</p>
    <div className="upload-area">
      <label htmlFor="dataset-file">Choose a CSV file</label>
      <input id="dataset-file" type="file" accept=".csv,text/csv"
        disabled={reading} onChange={event => {
          const file = event.target.files?.[0];
          if (file) void readFile(file);
          event.target.value = "";
        }}/>
      <p className="muted">Up to 1 MB. Files stay in this tab. Do not upload patient records.</p>
    </div>
    {reading && <p role="status">Reading and checking the file…</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="demo-option">
      <p>Don’t have a file ready?</p>
      <button className="secondary" onClick={onDemo} disabled={reading}>Use the public demo dataset</button>
      <a href="/data/screening.csv" download>Download the example CSV</a>
    </div>
    <details>
      <summary>Required data</summary>
      <p>Year, population group, invited count and attended count. Optionally include paired referred and completed counts. Groups in each cohort and year must be disjoint and comparable.</p>
      <p>This prototype supports screening counts, not arbitrary clinical studies. Column names can be mapped in the next step.</p>
    </details>
  </>;
}
