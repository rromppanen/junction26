"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuestionInput } from "@/lib/intake/clarify";
import type { Table } from "@/lib/intake/csv";
import { validateMapping, type Field, type Mapping } from "@/lib/intake/fields";
import { PUBLIC_DATASETS, ROWS_KEY, SETUP_KEY, type AnalysisSetup, type Level, type PublicDataset } from "@/lib/intake/setup";
import type { Understanding } from "@/lib/intake/understand";
import type { PublicTable } from "@/lib/publicTable";
import { FadeIn, useLeave } from "./fade";
import { StepConversation, type Resolved } from "./StepConversation";
import { DEFAULT_DATASETS, StepData } from "./StepData";
import { StepReading } from "./StepReading";

/** Same value as NATIONAL in lib/intake/understand (a server module, so not imported here). */
const NATIONAL = "national";

type Phase = "data" | "reading" | "ask" | "done";

type Settled = { mapping: Mapping | null; countyId: number | null; level: Level };

/** Applies the conversation's answers on top of what the AI understood on its own. */
function settle(u: Understanding, resolved: Resolved[]): Settled {
  const mapping: Mapping | null = u.mapping ? { ...u.mapping } : null;
  let countyId = u.place.countyId;
  let level = u.place.level;
  for (const { question, value } of resolved) {
    const chosen = value ?? question.guess?.value ?? null;
    if (question.kind === "column" && question.column && mapping) {
      if (chosen) mapping[question.column] = chosen as Field;
    } else if (question.kind === "county" && chosen) {
      if (chosen === NATIONAL) {
        countyId = null;
        level = "national";
      } else {
        countyId = Number(chosen);
        if (level === "national") level = "county";
      }
    }
  }
  return { mapping, countyId, level };
}

/**
 * The start page (/) as a conversation: choose data, the AI reads it, asks only what it is unsure about
 * (one question at a time), then hands over to the findings. Every screen fades in and out.
 */
export function IntakeFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("data");
  const phaseRef = useRef<HTMLDivElement>(null);
  const previousPhase = useRef(phase);
  useEffect(() => {
    if (previousPhase.current !== phase) {
      phaseRef.current?.focus();
      previousPhase.current = phase;
    }
  }, [phase]);
  const [datasets, setDatasets] = useState<PublicDataset[]>(DEFAULT_DATASETS);
  const [table, setTable] = useState<Table | null>(null);
  const [fileName, setFileName] = useState("");
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [settled, setSettled] = useState<Settled | null>(null);
  const { leaving, leave } = useLeave();

  const input: QuestionInput = useMemo(
    () => ({ datasets, headers: table ? table.headers : null, sample: table ? table.rows.slice(0, 5) : null }),
    [datasets, table],
  );
  const go = (next: Phase, before?: () => void) => leave(() => { before?.(); setPhase(next); });

  return (
    <div className={leaving ? "fade-out" : ""}>
      <nav aria-label="Analysis setup progress" className="mb-8">
        <ol className="flex flex-wrap gap-2 text-sm">
          {([['data', 'Choose data'], ['reading', 'Review data'], ['ask', 'Clarify scope'], ['done', 'Ready']] as const).map(([step, label], i) => (
            <li key={step} aria-current={phase === step ? "step" : undefined}
              className={`rounded-md border px-3 py-2 ${phase === step ? "border-brand bg-brand text-white" : "border-rule text-muted"}`}>{i + 1}. {label}</li>
          ))}
        </ol>
      </nav>
      <div key={phase} ref={phaseRef} tabIndex={-1}>
        {phase === "data" && (
          <StepData
            datasets={datasets}
            table={table}
            fileName={fileName}
            onDatasets={setDatasets}
            onFile={(t, name) => { setTable(t); setFileName(name); }}
            onContinue={() => go("reading")}
          />
        )}
        {phase === "reading" && (
          <StepReading
            input={input}
            fileName={fileName}
            onBack={() => go("data")}
            onUnderstood={(u) => {
              if (u.questions.length) go("ask", () => setUnderstanding(u));
              else go("done", () => { setUnderstanding(u); setSettled(settle(u, [])); });
            }}
          />
        )}
        {phase === "ask" && understanding && (
          <StepConversation
            input={input}
            questions={understanding.questions}
            onDone={(resolved) => go("done", () => setSettled(settle(understanding, resolved)))}
          />
        )}
        {phase === "done" && understanding && settled && (
          <StepDone
            datasets={datasets}
            table={table}
            fileName={fileName}
            understanding={understanding}
            settled={settled}
            onFindings={async (chosen) => {
              let setup = chosen;
              let rows = setup.upload && table ? table.rows : null;
              // Public data only: the same gap screens, on the public datasets shaped as one table.
              if (!setup.upload && setup.datasets.length) {
                try {
                  const pub = await fetch("/api/public-data").then((r) => (r.ok ? (r.json() as Promise<PublicTable>) : null));
                  if (pub) {
                    setup = { ...setup, upload: { fileName: pub.fileName, headers: pub.headers, rowCount: pub.rows.length, mapping: pub.mapping, groupKinds: pub.groupKinds, isPublic: true } };
                    rows = pub.rows;
                  }
                } catch {
                  // offline: fall back to the public-data brief below
                }
              }
              try {
                sessionStorage.setItem(SETUP_KEY, JSON.stringify(setup));
                if (setup.upload && rows) sessionStorage.setItem(ROWS_KEY, JSON.stringify(rows));
                else sessionStorage.removeItem(ROWS_KEY);
              } catch {
                // storage unavailable: the findings page says so
              }
              // With a file, the findings are the gaps in it; otherwise the public-data brief.
              const href = setup.upload ? "/findings" : setup.countyId !== null ? `/county/${setup.countyId}` : "/map";
              leave(() => router.push(href));
            }}
            onStartOver={() =>
              go("data", () => {
                setUnderstanding(null);
                setSettled(null);
                setTable(null);
                setFileName("");
                setDatasets(DEFAULT_DATASETS);
              })
            }
          />
        )}
      </div>
    </div>
  );
}

const listText = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

function StepDone({
  datasets,
  table,
  fileName,
  understanding,
  settled,
  onFindings,
  onStartOver,
}: {
  datasets: PublicDataset[];
  table: Table | null;
  fileName: string;
  understanding: Understanding;
  settled: Settled;
  onFindings: (setup: AnalysisSetup) => void;
  onStartOver: () => void;
}) {
  const errors = table && settled.mapping ? validateMapping(table, settled.mapping) : [];
  const fileOk = table !== null && errors.length === 0;
  const place =
    settled.level === "national" || settled.countyId === null
      ? "the whole country"
      : (understanding.places.find((p) => p.value === String(settled.countyId))?.label ?? "your county");
  const names = datasets.map((id) => PUBLIC_DATASETS.find((d) => d.id === id)?.nameEn.toLowerCase() ?? id);
  const sources = [...names, ...(fileOk ? [fileName] : [])];
  const asked = understanding.questions.length > 0;

  const setup = (withFile: boolean): AnalysisSetup => ({
    datasets,
    upload: withFile && table && settled.mapping
      ? { fileName, headers: table.headers, rowCount: table.rows.length, mapping: settled.mapping, groupKinds: understanding.groupKinds }
      : null,
    audience: settled.level === "national" ? "national" : "county-board",
    level: settled.level,
    countyId: settled.level === "national" ? null : settled.countyId,
    placeName: place,
  });
  const canOpen = datasets.length > 0 || fileOk;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <FadeIn>
          <h2 className="text-heading font-semibold tracking-[-0.01em]">
            {asked ? "Thanks, that's everything I needed." : "I've got everything I need."}
          </h2>
        </FadeIn>
        <FadeIn delay={300}>
          <p className="text-lede text-muted">
            I&apos;ll look at {place}
            {sources.length ? `, using ${listText(sources)}` : ""}.
          </p>
        </FadeIn>
        {table && !fileOk && (
          <FadeIn delay={600}>
            <p className="text-lede text-behind">
              I can&apos;t use {fileName} yet: {errors.slice(0, 2).join(" ")}
            </p>
          </FadeIn>
        )}
      </div>
      <FadeIn delay={900} className="flex flex-wrap items-center gap-3">
        {canOpen && (
          <button
            type="button"
            onClick={() => onFindings(setup(fileOk))}
            className="rounded-xl bg-brand px-6 py-3 font-medium text-white"
          >
            {fileOk ? "See the findings" : settled.countyId !== null ? "Open county brief" : "Explore counties on the map"}
          </button>
        )}
        {settled.countyId !== null && <Link href="/map" className="inline-flex min-h-11 items-center rounded-md border border-rule px-4 py-2 text-sm font-medium hover:bg-surface">Compare counties on the map</Link>}
        <button type="button" onClick={onStartOver} className="px-2 py-3 text-small text-muted hover:text-ink">
          Start over
        </button>
      </FadeIn>
    </div>
  );
}
