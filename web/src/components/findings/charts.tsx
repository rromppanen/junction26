"use client";

import { PersonStanding } from "lucide-react";
import countyShapes from "@/data/county-shapes.json";
import municipalityShapes from "@/data/municipality-shapes.json";
import { shortName } from "@/components/format";
import { StatusIcon } from "@/components/ui";
import type { GroupStat, MetricId } from "@/lib/gaps";
import type { GroupKind } from "@/lib/intake/fields";
import { ICON_STATUS, STATUS_WORD } from "./findingWords";
import { groupLabel } from "./groupWords";

/**
 * Figures for one gap's dashboard. Each shows every group in the gap's breakdown for the gap's step, with the
 * gap's own group picked out in the "behind" colour and the rest in neutral grey; status is never colour alone
 * (labels, icons and a table view on the same page carry it too).
 */

type Props = { kind: GroupKind; groups: GroupStat[]; selected: string; metric: MetricId };

const fmtFigure = (m: MetricId, v: number | null) => (v === null ? "–" : m === "wait" ? `${v.toFixed(0)} d` : `${v.toFixed(0)}%`);
const tooltip = (kind: GroupKind, g: GroupStat, m: MetricId) =>
  `${groupLabel(kind, g.value)}: ${fmtFigure(m, g.figure)}${g.rest !== null ? ` (everyone else ${fmtFigure(m, g.rest)})` : ""} · ${STATUS_WORD[g.status]}`;

function Legend({ selectedLabel }: { selectedLabel: string }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-behind" />{selectedLabel}</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-par" />Other groups</span>
    </p>
  );
}

/* ---------- Area: a map of the municipalities (or counties) in the file ---------- */

type Shape = { name: string; d: string; label: number[]; bbox: number[] };
const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();
const MUNI = new Map((municipalityShapes.municipalities as (Shape & { sv?: string })[]).flatMap((m) => [[norm(m.name), m], ...(m.sv ? [[norm(m.sv), m] as const] : [])]));
const COUNTY = new Map((countyShapes.counties as Shape[]).flatMap((c) => [[norm(c.name), c], [norm(shortName(c.name)), c]]));
const FILL: Record<GroupStat["status"], string> = { behind: "var(--behind)", ahead: "var(--ahead)", level: "var(--par-soft)", unclear: "var(--par-soft)", few: "var(--surface)" };

export function AreaMap({ kind, groups, selected, metric }: Props) {
  const shapes = groups.map((g) => ({ g, s: MUNI.get(norm(g.value)) ?? COUNTY.get(norm(g.value)) })).filter((x): x is { g: GroupStat; s: Shape } => !!x.s);
  if (shapes.length < groups.length / 2) return <Bars kind={kind} groups={groups} selected={selected} metric={metric} />;
  const [x0, y0, x1, y1] = shapes.reduce(
    ([a, b, c, d], { s }) => [Math.min(a, s.bbox[0]), Math.min(b, s.bbox[1]), Math.max(c, s.bbox[2]), Math.max(d, s.bbox[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
  const pad = Math.max(x1 - x0, y1 - y0) * 0.06;
  const sel = shapes.find((x) => x.g.value === selected);
  return (
    <figure>
      <svg viewBox={`${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`} className="mx-auto block max-h-[440px] w-full" role="img" aria-label={`Map of ${groups.length} areas, ${groupLabel(kind, selected)} highlighted`}>
        {shapes.map(({ g, s }) => (
          <path key={g.value} d={s.d} fill={FILL[g.status]} stroke="var(--paper)" strokeWidth={0.8} strokeLinejoin="round">
            <title>{tooltip(kind, g, metric)}</title>
          </path>
        ))}
        {sel && <path d={sel.s.d} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" pointerEvents="none" />}
        {shapes.map(({ g, s }) => (
          <text key={g.value} x={s.label[0]} y={s.label[1]} textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
            className={g.value === selected ? "fill-ink font-semibold" : "fill-ink/70"} style={{ fontSize: Math.max(x1 - x0, y1 - y0) / 34 }}>
            {g.value === selected ? `${s.name} ${fmtFigure(metric, g.figure)}` : s.name}
          </text>
        ))}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
        {(["behind", "level", "ahead", "few"] as const).filter((st) => groups.some((g) => g.status === st || (st === "level" && g.status === "unclear"))).map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-3.5 rounded-sm border border-rule" style={{ background: FILL[st] }} />
            {st === "behind" ? "Behind the rest" : st === "ahead" ? "Ahead of the rest" : st === "level" ? "About level" : "Too few to show"}
          </span>
        ))}
        <span>Outlined: {groupLabel(kind, selected)}.</span>
      </figcaption>
    </figure>
  );
}

/* ---------- Sex (or any two or three groups): people pictograms, ten per group ---------- */

export function PeopleCompare({ kind, groups, selected, metric }: Props) {
  const shown = groups.filter((g) => g.figure !== null);
  return (
    <figure>
      <div className="grid gap-6 sm:grid-cols-2">
        {shown.map((g) => {
          const on = g.value === selected;
          const filled = Math.round((g.figure ?? 0) / 10);
          return (
            <div key={g.value} title={tooltip(kind, g, metric)}>
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{groupLabel(kind, g.value)}</span>
                <span className={`text-heading font-semibold tabular-nums ${on ? "text-behind" : ""}`}>{fmtFigure(metric, g.figure)}</span>
              </p>
              <div aria-hidden className="mt-2 flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <PersonStanding key={i} size={30} strokeWidth={2} className={i < filled ? (on ? "text-behind" : "text-par") : "text-rule"} />
                ))}
              </div>
              <p className="mt-1 text-caption text-muted">
                About {filled} in 10 {metric === "participation" ? "took part" : "completed follow-up"}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

/* ---------- Age: columns in age order, with everyone else as a reference line ---------- */

const ageStart = (v: string) => Number(/\d+/.exec(v)?.[0] ?? Infinity);

export function AgeColumns({ kind, groups, selected, metric }: Props) {
  const ordered = [...groups].sort((a, b) => ageStart(a.value) - ageStart(b.value));
  const max = metric === "wait" ? Math.max(...ordered.map((g) => g.figure ?? 0)) * 1.15 : 100;
  const sel = ordered.find((g) => g.value === selected);
  const H = 200;
  return (
    <figure>
      <div className="relative mt-6" style={{ height: H + 24 }}>
        <div className="absolute inset-x-0 top-0 flex items-end gap-2" style={{ height: H }}>
          {ordered.map((g) => (
            <div key={g.value} className="relative flex h-full flex-1 justify-center" title={tooltip(kind, g, metric)}>
              <div className={`absolute bottom-0 w-full max-w-16 rounded-t-[4px] ${g.value === selected ? "bg-behind" : "bg-par"}`} style={{ height: `${((g.figure ?? 0) / max) * 100}%` }}>
                <span className="absolute inset-x-0 top-1.5 text-center text-small font-semibold tabular-nums text-white">{fmtFigure(metric, g.figure)}</span>
              </div>
            </div>
          ))}
        </div>
        {sel?.rest != null && <div aria-hidden className="pointer-events-none absolute inset-x-0 border-t-2 border-ink" style={{ top: H - (sel.rest / max) * H }} />}
        <div className="absolute inset-x-0 flex gap-2 border-t border-rule pt-1" style={{ top: H }}>
          {ordered.map((g) => <span key={g.value} className={`flex-1 text-center text-caption ${g.value === selected ? "font-semibold" : "text-muted"}`}>{g.value}</span>)}
        </div>
      </div>
      <Legend selectedLabel={groupLabel(kind, selected)} />
      {sel?.rest != null && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-caption text-muted">
          <span aria-hidden className="h-0.5 w-4 bg-ink" />
          Everyone else, compared with {groupLabel(kind, selected)}: {fmtFigure(metric, sel.rest)}
        </p>
      )}
    </figure>
  );
}

/* ---------- Language, nationality, country of birth, background: out of every 100 people ---------- */

export function DotGrids({ kind, groups, selected, metric }: Props) {
  if (metric === "wait") return <Bars kind={kind} groups={groups} selected={selected} metric={metric} />;
  const shown = [...groups].filter((g) => g.figure !== null).sort((a, b) => (a.value === selected ? -1 : b.value === selected ? 1 : 0)).slice(0, 8);
  return (
    <figure>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((g) => {
          const on = g.value === selected;
          const filled = Math.round(g.figure ?? 0);
          return (
            <div key={g.value} title={tooltip(kind, g, metric)}>
              <p className={`text-small ${on ? "font-semibold" : ""}`}>{groupLabel(kind, g.value)}</p>
              <svg viewBox="0 0 100 100" className="mt-1.5 w-full max-w-[150px]" aria-hidden>
                {Array.from({ length: 100 }, (_, i) => (
                  <circle key={i} cx={5 + (i % 10) * 10} cy={5 + Math.floor(i / 10) * 10} r={3.6}
                    fill={i < filled ? (on ? "var(--behind)" : "var(--par)") : "var(--par-soft)"} />
                ))}
              </svg>
              <p className="mt-1 text-caption text-muted">
                <span className={`font-semibold tabular-nums ${on ? "text-behind" : "text-ink"}`}>{filled}</span> of 100
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-caption text-muted">
        Each dot is one person in 100 {metric === "participation" ? "invited; filled dots took part" : "with a positive result; filled dots completed follow-up"}.
      </p>
    </figure>
  );
}

/* ---------- Anything else: ranked bars with everyone else marked ---------- */

export function Bars({ kind, groups, selected, metric }: Props) {
  const max = metric === "wait" ? Math.max(...groups.map((g) => g.figure ?? 0), 1) : 100;
  return (
    <figure>
      <ol>
        {groups.map((g) => {
          const on = g.value === selected;
          return (
            <li key={g.value} className="grid grid-cols-[minmax(0,10rem)_1fr_3.5rem_3.5rem] items-center gap-x-3 border-b border-rule py-2 text-small" title={tooltip(kind, g, metric)}>
              <span className={`truncate ${on ? "font-semibold" : ""}`}>{groupLabel(kind, g.value)}</span>
              {g.figure === null ? (
                <span className="col-span-3 text-muted">Under 20 people, not shown</span>
              ) : (
                <>
                  <span className="relative h-2 rounded-full bg-par-soft" aria-hidden>
                    <span className={`absolute inset-y-0 left-0 rounded-full ${on ? "bg-behind" : "bg-par"}`} style={{ width: `${Math.min(100, (g.figure / max) * 100)}%` }} />
                    {g.rest !== null && <span className="absolute -inset-y-1 w-px bg-ink" style={{ left: `${Math.min(100, (g.rest / max) * 100)}%` }} />}
                  </span>
                  <span className="text-right font-semibold tabular-nums">{fmtFigure(metric, g.figure)}</span>
                  <span className="inline-flex items-center justify-end gap-1 text-muted tabular-nums">
                    <StatusIcon status={ICON_STATUS[g.status]} />
                    {g.gap === null ? "" : `${g.gap > 0 ? "+" : "−"}${Math.abs(g.gap).toFixed(0)}`}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-caption text-muted">The thin line in each bar is everyone else in the breakdown.</p>
    </figure>
  );
}

/** Picks the figure that suits the kind of group. */
export function GroupFigure(p: Props) {
  if (p.kind === "region") return <AreaMap {...p} />;
  if (p.kind === "sex" || (p.groups.filter((g) => g.figure !== null).length <= 2 && p.metric !== "wait" && p.kind !== "migrantBackground")) return <PeopleCompare {...p} />;
  if (p.kind === "age") return <AgeColumns {...p} />;
  if (["language", "nationality", "birthCountry", "migrantBackground"].includes(p.kind)) return <DotGrids {...p} />;
  return <Bars {...p} />;
}

export const FIGURE_TITLE: Record<GroupKind, string> = {
  region: "Across the area",
  sex: "Women and men",
  age: "By age group",
  language: "Out of every 100 people, by language",
  nationality: "Out of every 100 people, by nationality",
  birthCountry: "Out of every 100 people, by country of birth",
  migrantBackground: "Out of every 100 people, by background",
  education: "By education",
  income: "By income",
  other: "Every group",
};

/* ---------- Over time: the group and everyone else, one line each ---------- */

export function TrendLine({ series, metric, label }: { series: { year: number; group: number | null; rest: number | null }[]; metric: MetricId; label: string }) {
  const W = 640, H = 220, L = 40, R = 130, T = 12, B = 28;
  const vals = series.flatMap((s) => [s.group, s.rest]).filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  // Round steps (10 points, or 5/10/20 days) so the axis reads at a glance.
  const step = metric === "wait" ? (Math.max(...vals) > 60 ? 20 : Math.max(...vals) > 25 ? 10 : 5) : Math.max(...vals) - Math.min(...vals) > 40 ? 20 : 10;
  const lo = metric === "wait" ? 0 : Math.max(0, Math.floor((Math.min(...vals) - 5) / step) * step);
  const hi = metric === "wait" ? Math.ceil((Math.max(...vals) * 1.1) / step) * step : Math.min(100, Math.ceil((Math.max(...vals) + 5) / step) * step);
  const x = (i: number) => L + (series.length === 1 ? 0 : (i / (series.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const line = (key: "group" | "rest") =>
    series.map((s, i) => (s[key] === null ? null : `${x(i)},${y(s[key]!)}`)).filter(Boolean).join(" ");
  const last = series.at(-1)!;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label} and everyone else, ${series[0].year}–${last.year}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth={1} />
            <text x={L - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[11px] tabular-nums">{fmtFigure(metric, t)}</text>
          </g>
        ))}
        {series.map((s, i) => <text key={s.year} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">{s.year}</text>)}
        <polyline points={line("rest")} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
        <polyline points={line("group")} fill="none" stroke="var(--behind)" strokeWidth={2} strokeLinejoin="round" />
        {series.map((s, i) => (
          <g key={s.year}>
            {s.rest !== null && <circle cx={x(i)} cy={y(s.rest)} r={4.5} fill="var(--ink)" stroke="var(--paper)" strokeWidth={2}><title>{`${s.year} everyone else: ${fmtFigure(metric, s.rest)}`}</title></circle>}
            {s.group !== null && <circle cx={x(i)} cy={y(s.group)} r={4.5} fill="var(--behind)" stroke="var(--paper)" strokeWidth={2}><title>{`${s.year} ${label}: ${fmtFigure(metric, s.group)}`}</title></circle>}
          </g>
        ))}
        {last.rest !== null && <text x={x(series.length - 1) + 10} y={y(last.rest)} dominantBaseline="middle" className="fill-ink text-[12px]">Everyone else</text>}
        {last.group !== null && <text x={x(series.length - 1) + 10} y={y(last.group)} dominantBaseline="middle" className="fill-behind text-[12px] font-semibold">{label.length > 18 ? `${label.slice(0, 17)}…` : label}</text>}
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-4 text-caption text-muted">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4 bg-behind" />{label}</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4 bg-ink" />Everyone else</span>
      </p>
    </figure>
  );
}
