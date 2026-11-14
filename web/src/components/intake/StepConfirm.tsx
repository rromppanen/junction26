"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import type { Question } from "@/lib/intake/clarify";
import type { Table } from "@/lib/intake/csv";
import { FIELDS, validateMapping, type Field, type Mapping } from "@/lib/intake/fields";
import { PUBLIC_DATASETS, type AnalysisSetup, type Audience, type Level } from "@/lib/intake/setup";
import { IconHeading } from "@/components/ui";
import type { QuestionsDone } from "./StepQuestions";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "county-board", label: "County board" },
  { value: "screening-unit", label: "Screening unit" },
  { value: "national", label: "National level" },
];
const LEVELS: { value: Level; label: string }[] = [
  { value: "municipality", label: "Municipalities" },
  { value: "county", label: "Wellbeing services counties" },
  { value: "national", label: "Whole country" },
];
const selectCls = "rounded-[3px] border border-rule bg-white px-2 py-1 text-sm";

type Props = {
  datasets: AnalysisSetup["datasets"];
  table: Table | null;
  fileName: string;
  result: QuestionsDone;
  onBack: () => void;
  onConfirm: (setup: AnalysisSetup) => void;
};

export function StepConfirm({ datasets, table, fileName, result, onBack, onConfirm }: Props) {
  const [mapping, setMapping] = useState<Mapping>(() => {
    if (!table) return {};
    const base = Object.fromEntries(table.headers.map((h) => [h, "ignore" as Field])) as Mapping;
    return { ...base, ...(result.mapping ?? {}) };
  });
  const [audience, setAudience] = useState<Audience>(result.audience);
  const [level, setLevel] = useState<Level>(result.level);
  const [countyId, setCountyId] = useState<number | null>(result.countyId);

  const countyQuestion: Question | undefined = result.questions.find((q) => q.kind === "county");
  const counties = countyQuestion?.options ?? [];
  const errors = useMemo(() => (table ? validateMapping(table, mapping) : []), [table, mapping]);
  const effectiveCounty = level === "national" ? null : countyId;
  const needsCounty = level !== "national" && countyId === null;

  return (
    <section aria-labelledby="step3-h" className="space-y-8">
      <IconHeading icon={ClipboardCheck} as="h3" id="step3-h" className="text-lg">
        Check your setup
      </IconHeading>

      {result.notes.length > 0 && (
        <ul className="max-w-2xl list-disc space-y-1 pl-5 text-sm text-muted">
          {result.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      {table && (
        <div>
          <h4 className="font-medium">Columns in {fileName}</h4>
          <table className="mt-2 border-collapse text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="border-b border-rule px-2 py-1 font-semibold">Column in your file</th>
                <th scope="col" className="border-b border-rule px-2 py-1 font-semibold">Used as</th>
              </tr>
            </thead>
            <tbody>
              {table.headers.map((h, i) => (
                <tr key={i}>
                  <td className="border-b border-rule px-2 py-1">{h}</td>
                  <td className="border-b border-rule px-2 py-1">
                    <select
                      aria-label={`Field for column ${h}`}
                      className={selectCls}
                      value={mapping[h] ?? "ignore"}
                      onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as Field }))}
                    >
                      {FIELDS.map((f) => <option key={f.id} value={f.id}>{f.labelEn}</option>)}
                      <option value="ignore">Not needed (ignore)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors.length > 0 && (
            <ul role="alert" className="mt-3 max-w-2xl list-disc space-y-1 rounded-[3px] border border-rule bg-par-soft p-3 pl-8 text-sm">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid max-w-md gap-3 text-sm">
        <label className="grid gap-1">
          <span className="font-medium">Who is this for?</span>
          <select className={selectCls} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
            {AUDIENCES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Level of detail</span>
          <select
            className={selectCls}
            value={level}
            onChange={(e) => {
              const l = e.target.value as Level;
              setLevel(l);
              if (l === "national") setCountyId(null);
            }}
          >
            {LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        {level !== "national" && (
          <label className="grid gap-1">
            <span className="font-medium">County</span>
            <select
              className={selectCls}
              value={countyId === null ? "" : String(countyId)}
              onChange={(e) => setCountyId(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">No county chosen</option>
              {counties.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="rounded-[3px] border border-rule px-3 py-1.5 text-sm hover:bg-par-soft">
          Back
        </button>
        <button
          type="button"
          disabled={errors.length > 0 || needsCounty}
          onClick={() =>
            onConfirm({
              datasets,
              upload: table
                ? { fileName, headers: table.headers, rowCount: table.rows.length, mapping }
                : null,
              audience,
              level,
              countyId: effectiveCounty,
            })
          }
          className="rounded-[3px] bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm setup
        </button>
        {needsCounty && <p className="self-center text-sm text-muted">Choose a county, or set the level to Whole country</p>}
      </div>
    </section>
  );
}

const AUDIENCE_TEXT: Record<Audience, string> = {
  "county-board": "a county board",
  "screening-unit": "a screening unit",
  national: "national level",
};
const LEVEL_TEXT: Record<Level, string> = {
  municipality: "municipality level",
  county: "county level",
  national: "the national level",
};

export function SetupSummary({
  setup,
  countyName,
  onStartOver,
}: {
  setup: AnalysisSetup;
  countyName: string | null;
  onStartOver: () => void;
}) {
  const names = setup.datasets.map((id) => {
    const d = PUBLIC_DATASETS.find((p) => p.id === id);
    return d ? `${d.nameEn} (${d.source})` : id;
  });
  const mapped = setup.upload
    ? FIELDS.filter((f) => Object.values(setup.upload!.mapping).includes(f.id)).map((f) => f.labelEn)
    : [];
  const href = setup.countyId !== null ? `/county/${setup.countyId}` : "/";
  const label =
    setup.countyId !== null ? `Continue to ${countyName ?? "the county"}'s pathway` : "Continue to the national view";

  return (
    <section aria-labelledby="step4-h" className="space-y-4">
      <IconHeading icon={CheckCircle2} as="h3" id="step4-h" className="text-lg">
        Your setup
      </IconHeading>
      <ul className="max-w-2xl list-disc space-y-1 pl-5 text-sm">
        <li>Public data: {names.length > 0 ? names.join("; ") : "none"}.</li>
        <li>
          {setup.upload
            ? `Your file ${setup.upload.fileName} with ${setup.upload.rowCount} ${setup.upload.rowCount === 1 ? "row" : "rows"}, using these fields: ${mapped.join(", ") || "none"}.`
            : "No file of your own."}
        </li>
        <li>
          Prepared for {AUDIENCE_TEXT[setup.audience]}, looking at {LEVEL_TEXT[setup.level]}
          {countyName ? `, for ${countyName}` : ""}.
        </li>
      </ul>
      <div className="flex items-center gap-4">
        <Link href={href} className="link text-sm font-medium">{label}</Link>
        <button type="button" onClick={onStartOver} className="rounded-[3px] border border-rule px-3 py-1.5 text-sm hover:bg-par-soft">
          Start over
        </button>
      </div>
    </section>
  );
}
