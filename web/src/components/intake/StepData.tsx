"use client";

import { useId, useRef, useState } from "react";
import { Database, Upload } from "lucide-react";
import { parseCSV, type Table } from "@/lib/intake/csv";
import { personalDataHeaders } from "@/lib/intake/privacy";
import { PUBLIC_DATASETS, type PublicDataset } from "@/lib/intake/setup";
import { IconHeading } from "@/components/ui";

const MAX_BYTES = 1_000_000;

type Props = {
  datasets: PublicDataset[];
  table: Table | null;
  fileName: string;
  error: string | null;
  onDatasets: (datasets: PublicDataset[]) => void;
  onFile: (table: Table | null, fileName: string) => void;
  onError: (message: string) => void;
  onContinue: () => void;
};

export function StepData({ datasets, table, fileName, error, onDatasets, onFile, onError, onContinue }: Props) {
  const fileId = useId();
  const [flagged, setFlagged] = useState<string[]>([]);
  const requestRef = useRef(0);

  const toggle = (id: PublicDataset) =>
    onDatasets(datasets.includes(id) ? datasets.filter((d) => d !== id) : [...datasets, id]);

  async function handleFile(file: File | undefined) {
    const request = ++requestRef.current;
    setFlagged([]);
    if (!file) {
      onFile(null, "");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("Use a CSV under 1 MB with aggregate data only.");
      return;
    }
    try {
      const text = await file.text();
      if (request !== requestRef.current) return;
      const parsed = parseCSV(text);
      const bad = personalDataHeaders(parsed.headers);
      if (bad.length > 0) {
        setFlagged(bad);
        onFile(null, "");
        return;
      }
      onFile(parsed, file.name);
    } catch (e) {
      if (request !== requestRef.current) return;
      onError(e instanceof Error ? e.message : "Could not read this file.");
    }
  }

  const canContinue = datasets.length > 0 || table !== null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="public-h">
        <IconHeading icon={Database} as="h2" id="public-h" className="text-lg">Public datasets</IconHeading>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PUBLIC_DATASETS.map((d) => (
            <li key={d.id} className="rounded-[3px] border border-rule p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={datasets.includes(d.id)}
                  onChange={() => toggle(d.id)}
                />
                <span>
                  <span className="block font-medium">{d.nameEn}</span>
                  <span className="block text-xs text-muted">{d.source}</span>
                  <span className="mt-1 block text-sm">{d.description}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="upload-h">
        <IconHeading icon={Upload} as="h2" id="upload-h" className="text-lg">Your own data (optional)</IconHeading>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Aggregate data only, no personal data. The file is read in your browser; only column names and up to 5
          sample rows are sent on.
        </p>
        <label htmlFor={fileId} className="mt-3 block text-sm font-medium">CSV file (up to 1 MB)</label>
        <input
          id={fileId}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void handleFile(file);
          }}
          className="mt-1 block w-full max-w-md text-sm"
        />

        {flagged.length > 0 && (
          <div role="alert" className="mt-3 max-w-2xl rounded-[3px] border border-rule bg-par-soft p-3 text-sm">
            This file was not loaded because these columns look like personal data: <strong>{flagged.join(", ")}</strong>.
            Please upload an aggregate file without personal data.
          </div>
        )}
        {error && (
          <div role="alert" className="mt-3 max-w-2xl rounded-[3px] border border-rule bg-par-soft p-3 text-sm">
            {error}
          </div>
        )}

        {table && (
          <div className="mt-4">
            <p className="text-sm">
              <strong>{fileName}</strong>: {table.rows.length} {table.rows.length === 1 ? "row" : "rows"},{" "}
              {table.headers.length} columns. First {Math.min(5, table.rows.length)} shown.
            </p>
            <button type="button" onClick={() => { requestRef.current++; setFlagged([]); onFile(null, ""); }}
              className="mt-2 rounded-[3px] border border-rule px-3 py-2 text-sm hover:bg-par-soft">Remove file</button>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i} scope="col" className="whitespace-nowrap border-b border-rule px-2 py-1 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      {table.headers.map((_, j) => (
                        <td key={j} className="whitespace-nowrap border-b border-rule px-2 py-1">{r[j] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rounded-[3px] bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue to scope
        </button>
        {!canContinue && <p className="mt-2 text-sm text-muted">Choose a public dataset or upload a file to continue.</p>}
      </div>
    </div>
  );
}
