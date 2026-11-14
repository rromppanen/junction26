"use client";

import { useId, useRef, useState } from "react";
import { Check, Database, FileUp } from "lucide-react";
import { parseCSV, type Table } from "@/lib/intake/csv";
import { personalDataHeaders } from "@/lib/intake/privacy";
import { PUBLIC_DATASETS, type PublicDataset } from "@/lib/intake/setup";
import { FadeIn } from "./fade";

const MAX_BYTES = 1_000_000;
export const DEFAULT_DATASETS: PublicDataset[] = ["sotkanet-screening", "registry-pathway"];

type Props = {
  datasets: PublicDataset[];
  table: Table | null;
  fileName: string;
  onDatasets: (datasets: PublicDataset[]) => void;
  onFile: (table: Table | null, fileName: string) => void;
  onContinue: () => void;
};

const tile = "flex w-full items-start gap-3 rounded-[6px] border p-4 text-left transition-colors";

/** The first screen: a title, one instruction and two choices. Nothing else. */
export function StepData({ datasets, table, fileName, onDatasets, onFile, onContinue }: Props) {
  const fileId = useId();
  const [problem, setProblem] = useState<string | null>(null);
  const requestRef = useRef(0);
  const usePublic = datasets.length > 0;

  async function handleFile(file: File | undefined) {
    const request = ++requestRef.current;
    setProblem(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setProblem("That file is over 1 MB. Use an aggregate CSV under 1 MB.");
      return;
    }
    try {
      const text = await file.text();
      if (request !== requestRef.current) return;
      const parsed = parseCSV(text);
      const bad = personalDataHeaders(parsed.headers);
      if (bad.length > 0) {
        setProblem(`I can't use this file: ${bad.join(", ")} look like personal data. Please use aggregate figures only.`);
        onFile(null, "");
        return;
      }
      onFile(parsed, file.name);
    } catch (e) {
      if (request !== requestRef.current) return;
      setProblem(e instanceof Error ? e.message : "Could not read this file.");
    }
  }

  const toggleDataset = (id: PublicDataset) =>
    onDatasets(datasets.includes(id) ? datasets.filter((d) => d !== id) : [...datasets, id]);
  const canContinue = usePublic || table !== null;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <FadeIn>
          <h1 className="text-display font-semibold tracking-[-0.02em]">What should we look at?</h1>
        </FadeIn>
        <FadeIn delay={180}>
          <p className="text-lede text-muted">Pick public data, add a file of your own, or both.</p>
        </FadeIn>
      </div>

      <FadeIn delay={360} className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={usePublic}
          onClick={() => onDatasets(usePublic ? [] : DEFAULT_DATASETS)}
          className={`${tile} ${usePublic ? "border-ink bg-surface" : "border-rule hover:border-par"}`}
        >
          <Database aria-hidden size={22} className="mt-0.5 shrink-0" />
          <span className="flex-1">
            <span className="block font-semibold">Public data</span>
            <span className="block text-small text-muted">Finnish registers, ready to use</span>
          </span>
          {usePublic && <Check aria-hidden size={18} className="shrink-0" />}
        </button>

        <label
          htmlFor={fileId}
          className={`${tile} cursor-pointer focus-within:ring-2 focus-within:ring-highlight ${table ? "border-ink bg-surface" : "border-rule hover:border-par"}`}
        >
          <FileUp aria-hidden size={22} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Your own file</span>
            <span className="block truncate text-small text-muted">
              {table
                ? `${fileName} · ${table.rows.length} rows · ${table.headers.length} columns`
                : "An aggregate CSV, read in your browser"}
            </span>
          </span>
          {table && <Check aria-hidden size={18} className="shrink-0" />}
          <input
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void handleFile(file);
            }}
          />
        </label>
      </FadeIn>

      {usePublic && (
        <FadeIn className="-mt-6 flex flex-wrap gap-2">
          {PUBLIC_DATASETS.map((d) => {
            const on = datasets.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                title={`${d.description} (${d.source})`}
                onClick={() => toggleDataset(d.id)}
                className={`rounded-full border px-3 py-1 text-small ${on ? "border-ink bg-ink text-white" : "border-rule text-muted hover:border-par"}`}
              >
                {d.nameEn}
              </button>
            );
          })}
        </FadeIn>
      )}

      {problem && (
        <FadeIn key={problem}>
          <p role="alert" className="text-small text-behind">{problem}</p>
        </FadeIn>
      )}

      <FadeIn delay={540}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rounded-[6px] bg-ink px-6 py-3 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          Start
        </button>
      </FadeIn>
    </div>
  );
}
