"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { exampleMeasureCsv, parseMeasureCsv, type MeasureSeries, type ParsedMeasures } from "@/lib/measureUpload";

function Spark({ s }: { s: MeasureSeries }) {
  const W = 220, H = 56, P = 6;
  const days = s.points.map((p) => p.days);
  const lo = Math.min(...days), hi = Math.max(...days);
  const x = (i: number) => P + (i / Math.max(1, s.points.length - 1)) * (W - 2 * P);
  const y = (d: number) => H - P - ((d - lo) / (hi - lo || 1)) * (H - 2 * P);
  const path = s.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.days).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[220px]" role="img" aria-label={`${s.name}: ${s.first.days} days in ${s.first.month}, ${s.last.days} in ${s.last.month}`}>
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={x(s.points.length - 1)} cy={y(s.last.days)} r={3} fill="var(--ink)" />
    </svg>
  );
}

/** Closes the learning loop: the county loads its own monthly delays and sees whether they moved. */
export function MeasureUpload() {
  const [parsed, setParsed] = useState<ParsedMeasures | null>(null);
  const [source, setSource] = useState<"file" | "example" | null>(null);

  return (
    <div className="mt-6 border-t border-rule pt-5">
      <h3 className="font-semibold">Did it work? Load your filled-in file</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Fill in the CSV above each month and load it here to see each delay over time. The file stays in your browser; nothing is sent anywhere.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 hover:bg-par-soft">
          <Upload aria-hidden size={14} /> Load your CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) f.text().then((t) => { setParsed(parseMeasureCsv(t)); setSource("file"); });
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => { setParsed(parseMeasureCsv(exampleMeasureCsv())); setSource("example"); }} className="rounded-[3px] border border-rule px-2.5 py-1 hover:bg-par-soft">
          Try with example figures
        </button>
      </div>
      {parsed?.error && <p className="mt-3 text-sm font-semibold text-behind" role="alert">{parsed.error}</p>}
      {parsed && parsed.series.length > 0 && (
        <div className="mt-4">
          {source === "example" && (
            <p className="mb-3 inline-block rounded-[3px] bg-par-soft px-2 py-1 text-xs font-semibold">Example figures, not any county&rsquo;s data</p>
          )}
          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
            {parsed.series.map((s) => (
              <li key={s.id}>
                <p className="text-sm font-semibold">{s.name}</p>
                <Spark s={s} />
                <p className="text-sm">
                  <strong className="tabular-nums">{s.last.days} days</strong> in {s.last.month}{" "}
                  <span className={s.change < 0 ? "text-ahead" : s.change > 0 ? "text-behind" : "text-muted"}>
                    ({s.change > 0 ? "+" : s.change < 0 ? "−" : "±"}{Math.abs(s.change)} since {s.first.month})
                  </span>
                </p>
              </li>
            ))}
          </ul>
          {parsed.skipped > 0 && <p className="mt-2 text-xs text-muted">{parsed.skipped} rows couldn&rsquo;t be read and were skipped.</p>}
        </div>
      )}
    </div>
  );
}
