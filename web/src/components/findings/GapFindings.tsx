"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSearch, ListChecks, Map as MapIcon, RotateCcw, SearchX, Users } from "lucide-react";
import { AppHeader, HeaderLink, IconHeading, More, StatusIcon } from "@/components/ui";
import { FadeIn } from "@/components/intake/fade";
import { findGaps, LEVEL_PP, METRIC_LABEL, MIN_GROUP, type Dimension, type Finding, type GapStatus, type GroupStat, type MetricId } from "@/lib/gaps";
import { kindLabel } from "@/lib/gaps";
import { ROWS_KEY, SETUP_KEY, type AnalysisSetup } from "@/lib/intake/setup";
import type { GapStatus as ChartStatus } from "@/lib/types";
import { groupLabel, groupPhrase } from "./groupWords";

type Loaded = { setup: AnalysisSetup; rows: string[][] } | "missing" | null;

const SHOWN_FINDINGS = 5;
const ICON_STATUS: Record<GapStatus, ChartStatus> = { behind: "behind", ahead: "ahead", level: "on-par", unclear: "on-par", few: "no-data" };
const STATUS_WORD: Record<GapStatus, string> = { behind: "Behind", ahead: "Ahead", level: "Level", unclear: "Maybe, too few to be sure", few: `Under ${MIN_GROUP} people` };

const n0 = (v: number) => Math.round(v).toLocaleString("en-GB");
const pct = (v: number | null) => (v === null ? "–" : `${v.toFixed(0)}%`);
const plural = (v: number, one: string, many: string) => `${Math.abs(v).toFixed(0)} ${Math.round(Math.abs(v)) === 1 ? one : many}`;
const pts = (v: number) => plural(v, "point", "points");
const days = (v: number | null) => (v === null ? "–" : `${v.toFixed(0)} d`);

function sentence(f: Finding): { lead: string; detail: string | null } {
  const { dimension: d, metric: m, group: g } = f;
  const who = groupPhrase(d.kind, d.label, g.value);
  if (m === "wait") {
    return { lead: `${who} waited ${g.gap!.toFixed(0)} days longer than everyone else (${g.figure!.toFixed(0)} vs ${g.rest!.toFixed(0)} days).`, detail: null };
  }
  const verb = m === "participation" ? "took part in screening" : "completed follow-up after a positive result";
  const more = m === "participation" ? "would have been screened" : "would have had their follow-up";
  return {
    lead: `${who} ${verb} ${pts(g.gap!)} less often than everyone else (${pct(g.figure)} vs ${pct(g.rest)}).`,
    detail: g.missing > 0 ? `About ${n0(g.missing)} more ${g.missing === 1 ? "person" : "people"} ${more} at the same rate.` : null,
  };
}

function trend(f: Finding, firstYear: number | null, years: number[]): string | null {
  if (f.dimension.pooled[f.metric]) return `${years[0]}–${years.at(-1)} added together.`;
  const { gap, firstGap } = f.group;
  if (firstYear === null || gap === null || firstGap === null) return null;
  // Rates: a more negative gap is wider. Waits: a larger gap is wider.
  const wider = f.metric === "wait" ? gap - firstGap : firstGap - gap;
  // Year-to-year noise in an aggregate file is easily a point or two.
  if (Math.abs(wider) < 2) return `About the same as in ${firstYear}.`;
  return `${wider > 0 ? "Wider" : "Narrower"} by ${f.metric === "wait" ? plural(wider, "day", "days") : pts(wider)} since ${firstYear}.`;
}

/** The findings for an uploaded file: gaps between every kind of group the file has. */
export function GapFindings() {
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [metric, setMetric] = useState<MetricId>("participation");

  useEffect(() => {
    try {
      const setup = JSON.parse(sessionStorage.getItem(SETUP_KEY) ?? "null") as AnalysisSetup | null;
      const rows = JSON.parse(sessionStorage.getItem(ROWS_KEY) ?? "null") as string[][] | null;
      setLoaded(setup?.upload && Array.isArray(rows) ? { setup, rows } : "missing");
    } catch {
      setLoaded("missing");
    }
  }, []);

  const report = useMemo(() => {
    if (!loaded || loaded === "missing") return null;
    const u = loaded.setup.upload!;
    return findGaps({ headers: u.headers, rows: loaded.rows }, u.mapping, u.groupKinds ?? {});
  }, [loaded]);

  useEffect(() => {
    if (report && !report.metrics.includes(metric) && report.metrics.length) setMetric(report.metrics[0]);
  }, [report, metric]);

  if (loaded === null) return null;
  if (loaded === "missing" || !report) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <FadeIn className="space-y-4">
          <h1 className="text-heading font-semibold">No data to look at yet</h1>
          <p className="text-lede text-muted">Your file stays in this browser tab only. Start an analysis to see the gaps in it.</p>
          <Link href="/" className="inline-block rounded-[6px] bg-ink px-6 py-3 font-medium text-white">Start an analysis</Link>
        </FadeIn>
      </main>
    );
  }

  const { setup } = loaded;
  const u = setup.upload!;
  const county = setup.countyId;
  const top = report.findings.slice(0, SHOWN_FINDINGS);
  const rest = report.findings.length - top.length;
  const breakdowns = report.dimensions.filter((d) => d.byMetric[metric]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/" icon={RotateCcw} label="New analysis" />
        {county !== null && <HeaderLink href={`/county/${county}`} icon={ArrowLeft} label="Public data brief" title="This county's brief from public registers" />}
        <HeaderLink href="/map" icon={MapIcon} label="Map" />
      </AppHeader>

      <FadeIn>
        <h1 className="text-display font-semibold tracking-[-0.02em]">Gaps in your data</h1>
        <p className="mt-3 max-w-3xl text-lede text-muted">
          {u.fileName}
          {report.year !== null && <>, {report.year}</>}. I compared people {report.dimensions.length} ways
          {report.dimensions.length ? `: by ${report.dimensions.map((d) => d.label.toLowerCase()).join(", ")}` : ""}. Each group is
          set against everyone else in the same breakdown.
        </p>
      </FadeIn>

      <section aria-labelledby="top-h" className="mt-12">
        <FadeIn delay={200}>
          <IconHeading icon={FileSearch} id="top-h" className="text-title">Biggest gaps</IconHeading>
        </FadeIn>
        {top.length === 0 ? (
          <FadeIn delay={300}>
            <p className="mt-4 max-w-2xl text-lede">
              No clear gaps. Every group is within {LEVEL_PP} points of everyone else, or too small to tell.
            </p>
          </FadeIn>
        ) : (
          <ol className="mt-5 space-y-3">
            {top.map((f, i) => {
              const s = sentence(f);
              const t = trend(f, report.firstYear, report.years);
              return (
                <FadeIn key={`${f.dimension.header}-${f.metric}-${f.group.value}`} delay={300 + i * 140}>
                  <li className="grid grid-cols-[4.5rem_1fr] gap-4 rounded-[6px] border border-rule bg-surface p-4 sm:grid-cols-[6rem_1fr]">
                    <div className="text-behind">
                      <div className="text-heading font-semibold leading-none tabular-nums">
                        {f.metric === "wait" ? `+${f.group.gap!.toFixed(0)}` : `−${Math.abs(f.group.gap!).toFixed(0)}`}
                      </div>
                      <div className="mt-1 text-caption">{f.metric === "wait" ? "days" : "points"}</div>
                    </div>
                    <div>
                      <p className="font-medium">{s.lead}</p>
                      <p className="mt-1 text-small text-muted">
                        {[s.detail, t, `${f.dimension.label} · ${METRIC_LABEL[f.metric].toLowerCase()}`].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </li>
                </FadeIn>
              );
            })}
          </ol>
        )}
        {rest > 0 && <p className="mt-3 text-small text-muted">{rest} more {rest === 1 ? "gap" : "gaps"} in the breakdowns below.</p>}
      </section>

      <section aria-labelledby="all-h" className="mt-14">
        <IconHeading icon={Users} id="all-h" className="text-title">Every breakdown</IconHeading>
        {report.metrics.length > 1 && (
          <div role="tablist" aria-label="Pathway step" className="mt-4 flex flex-wrap gap-2">
            {report.metrics.map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={metric === m}
                onClick={() => setMetric(m)}
                className={`rounded-full border px-3 py-1 text-small ${metric === m ? "border-ink bg-ink text-white" : "border-rule text-muted hover:border-par"}`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        )}
        <div className="mt-6 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {breakdowns.map((d) => <Breakdown key={d.header} d={d} metric={metric} years={report.years} />)}
        </div>
      </section>

      {report.absent.length > 0 && (
        <section aria-labelledby="absent-h" className="mt-14">
          <IconHeading icon={SearchX} id="absent-h" className="text-title">Not in this file</IconHeading>
          <p className="mt-3 max-w-2xl">
            Your file has no column for {listText(report.absent.map((k) => kindLabel(k).toLowerCase()))}, so gaps between those
            groups can&apos;t be checked yet. Add any of them to the export and run the analysis again.
          </p>
        </section>
      )}

      <More label="How this is worked out" icon={ListChecks} className="mt-12">
        Every number comes straight from your file; the AI only worked out what each column means. For each way of grouping
        people, every group is compared with everyone else in that breakdown, in the latest year
        {report.firstYear !== null ? ` (${report.year}, with the change since ${report.firstYear})` : ""}. Where the file has
        total rows (&ldquo;yhteensä&rdquo;), only rows that break down one thing at a time are used. A gap counts as clear when it
        is at least {LEVEL_PP} points and unlikely to be chance (a two-proportion test, |z| ≥ 2). Groups under {MIN_GROUP}{" "}
        people are not shown: their figures swing too much and could point to individuals. &ldquo;People missed&rdquo; is how
        many more in the group would have completed the step at everyone else&apos;s rate. Waits are averages weighted by
        the number of people.
      </More>
    </main>
  );
}

const listText = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);

function Breakdown({ d, metric, years }: { d: Dimension; metric: MetricId; years: number[] }) {
  const groups = d.byMetric[metric]!;
  const isWait = metric === "wait";
  const max = isWait ? Math.max(...groups.map((g) => g.figure ?? 0), 1) : 100;
  return (
    <article>
      <h3 className="font-semibold">
        {d.label} <span className="text-small font-normal text-muted">· column {d.header}</span>
      </h3>
      {d.pooled[metric] && (
        <p className="mt-0.5 text-caption text-muted">
          {years[0]}–{years.at(-1)} added together: some groups are too small in one year.
        </p>
      )}
      <ol className="mt-3">
        {groups.map((g) => <Row key={g.value} d={d} g={g} max={max} isWait={isWait} />)}
      </ol>
    </article>
  );
}

function Row({ d, g, max, isWait }: { d: Dimension; g: GroupStat; max: number; isWait: boolean }) {
  const tone = g.status === "behind" ? "bg-behind" : g.status === "ahead" ? "bg-ahead" : "bg-par";
  const text = g.status === "behind" ? "text-behind" : g.status === "ahead" ? "text-ahead" : "text-muted";
  const label = groupLabel(d.kind, g.value);
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem_4.5rem] items-center gap-x-3 border-b border-rule py-2 text-small" title={STATUS_WORD[g.status]}>
      <span className="truncate" title={label === g.value ? g.value : `${label} (${g.value})`}>{label}</span>
      {g.figure === null ? (
        <span className="col-span-3 text-muted">
          {g.n < MIN_GROUP ? `Under ${MIN_GROUP} people, not shown` : "Too few others to compare with"}
        </span>
      ) : (
        <>
          <span className="relative h-2 rounded-full bg-par-soft" aria-hidden>
            <span className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: `${Math.min(100, (g.figure / max) * 100)}%` }} />
            {g.rest !== null && <span className="absolute -inset-y-1 w-px bg-ink" style={{ left: `${Math.min(100, (g.rest / max) * 100)}%` }} />}
          </span>
          <span className="text-right font-semibold tabular-nums">{isWait ? days(g.figure) : pct(g.figure)}</span>
          <span className={`inline-flex items-center justify-end gap-1 tabular-nums ${text}`}>
            <StatusIcon status={ICON_STATUS[g.status]} />
            {g.gap === null ? "" : `${g.gap > 0 ? "+" : g.gap < 0 ? "−" : "±"}${Math.abs(g.gap).toFixed(0)}`}
          </span>
        </>
      )}
    </li>
  );
}
