"use client";

import { PARAM_META } from "@/data/simulatorAssumptions";
import { quantile, type SensitivityRow } from "@/lib/simulator";
import { eur, eurShort, niceStep, num } from "./format";
import type { SimCounty } from "./types";

/**
 * Attendance by county, latest year, with Finland and the target drawn as reference lines.
 * Counties below Finland every year are drawn in the "behind" colour; a county left out of the totals is faded.
 */
export function AttendanceChart({
  counties,
  national,
  target,
  included,
  focus,
  year,
  onToggle,
}: {
  counties: SimCounty[];
  national: number | null;
  target: number;
  included: ReadonlySet<number>;
  focus: number | null;
  year: number;
  onToggle: (id: number) => void;
}) {
  const rows = [...counties].sort((a, b) => a.attendance - b.attendance);
  const W = 720, rowH = 22, top = 26, left = 150, right = 52;
  const H = top + rows.length * rowH + 40;
  const x0 = 70, x1 = 90;
  const sx = (v: number) => left + ((Math.min(Math.max(v, x0), x1) - x0) / (x1 - x0)) * (W - left - right);
  const bottom = top + rows.length * rowH;
  const ticks = [70, 75, 80, 85, 90];
  const behind = rows.filter((c) => c.persistent).map((c) => c.name);
  const summary = `Breast screening attendance by county in ${year}. Lowest: ${rows[0]?.name} ${num(rows[0]?.attendance ?? NaN, 1)}%. Highest: ${rows.at(-1)?.name} ${num(rows.at(-1)?.attendance ?? NaN, 1)}%. Below Finland every year: ${behind.join(", ") || "none"}.`;

  return (
    <figure>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-label={summary}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={top - 6} y2={bottom} stroke="var(--rule)" strokeWidth={1} />
              <text x={sx(t)} y={bottom + 16} fontSize={11} fill="var(--muted)" textAnchor="middle">{t}%</text>
            </g>
          ))}
          {rows.map((c, i) => {
            const y = top + i * rowH;
            const hasGap = c.attendance < target;
            const faded = hasGap && !included.has(c.id);
            return (
              <g
                key={c.id}
                opacity={faded ? 0.35 : 1}
                onClick={() => hasGap && onToggle(c.id)}
                style={{ cursor: hasGap ? "pointer" : "default" }}
              >
                <title>{`${c.name}: ${num(c.attendance, 1)}%${hasGap ? (faded ? " (left out; click to include)" : " (click to leave out)") : ""}`}</title>
                <rect x={0} y={y} width={W} height={rowH} fill="transparent" />
                <text
                  x={left - 8}
                  y={y + rowH / 2 + 4}
                  fontSize={12}
                  fill="var(--ink)"
                  fontWeight={focus === c.id ? 700 : 400}
                  textAnchor="end"
                >
                  {c.name}
                </text>
                <rect
                  x={sx(x0)}
                  y={y + 5}
                  width={Math.max(0, sx(c.attendance) - sx(x0))}
                  height={rowH - 10}
                  fill={c.persistent ? "var(--behind)" : "var(--par)"}
                />
                <text x={sx(c.attendance) + 5} y={y + rowH / 2 + 4} fontSize={11} fill="var(--ink)" className="tabular-nums">
                  {num(c.attendance, 1)}
                </text>
              </g>
            );
          })}
          {national !== null && (
            <g>
              <line x1={sx(national)} x2={sx(national)} y1={top - 6} y2={bottom} stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="4 3" />
              <text x={sx(national)} y={bottom + 32} fontSize={11} fill="var(--muted)" textAnchor="middle">
                Finland {num(national, 1)}%
              </text>
            </g>
          )}
          <line x1={sx(target)} x2={sx(target)} y1={top - 6} y2={bottom} stroke="var(--ink)" strokeWidth={2} />
          <text x={sx(target)} y={top - 11} fontSize={11} fontWeight={600} fill="var(--ink)" textAnchor="middle">
            Target {num(target, 1)}%
          </text>
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 bg-behind" /> Below Finland every year 2019–{year}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 bg-par" /> Other counties
        </span>
        <span>Click a county to leave it out of the totals.</span>
      </figcaption>
    </figure>
  );
}

/**
 * One-way sensitivity ("tornado"): the cost per life-year with each assumption at its low and its high value.
 */
export function SensitivityChart({ rows, current }: { rows: SensitivityRow[]; current: number }) {
  const top = rows.slice(0, 8);
  if (!Number.isFinite(current) || top.length === 0) {
    return <p className="text-sm text-muted">Include at least one county below the target to see what drives the result.</p>;
  }
  const vals = top.flatMap((r) => [r.icerLow, r.icerHigh]).concat(current).filter(Number.isFinite);
  let mn = Math.min(0, ...vals), mx = Math.max(...vals);
  const pad = (mx - mn) * 0.04;
  mn -= pad;
  mx += pad;
  const W = 560, left = 210, right = 16, rowH = 26, topY = 28;
  const H = topY + top.length * rowH + 28;
  const sx = (v: number) => left + ((v - mn) / (mx - mn)) * (W - left - right);
  const step = niceStep((mx - mn) / 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(mn / step) * step; v <= mx; v += step) ticks.push(v);
  const bar = (v: number) => (Number.isFinite(v) ? { x: sx(Math.min(v, current)), w: Math.abs(sx(v) - sx(current)) } : null);

  return (
    <figure>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[460px]"
          role="img"
          aria-label={`Cost per life-year is most sensitive to ${top.slice(0, 3).map((r) => PARAM_META[r.key].label.toLowerCase()).join(", ")}.`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={topY - 4} y2={H - 26} stroke="var(--rule)" />
              <text x={sx(t)} y={H - 10} fontSize={11} fill="var(--muted)" textAnchor="middle">{eurShort(t)}</text>
            </g>
          ))}
          {top.map((r, i) => {
            const y = topY + i * rowH;
            const lo = bar(r.icerLow), hi = bar(r.icerHigh);
            return (
              <g key={r.key}>
                <title>{`${PARAM_META[r.key].label}: ${eur(r.icerLow)} at its low value, ${eur(r.icerHigh)} at its high value`}</title>
                <text x={left - 8} y={y + rowH / 2 + 4} fontSize={12} fill="var(--ink)" textAnchor="end">{PARAM_META[r.key].label}</text>
                {lo && <rect x={lo.x} y={y + 6} width={lo.w} height={rowH - 12} fill="var(--par-soft)" stroke="var(--par)" strokeWidth={1} />}
                {hi && <rect x={hi.x} y={y + 6} width={hi.w} height={rowH - 12} fill="var(--ink)" />}
              </g>
            );
          })}
          <line x1={sx(current)} x2={sx(current)} y1={topY - 4} y2={topY + top.length * rowH} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={sx(current)} y={topY - 10} fontSize={11} fontWeight={600} fill="var(--ink)" textAnchor="middle">Now {eur(current)}</text>
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 border border-par bg-par-soft" /> Assumption at its low value
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 bg-ink" /> At its high value
        </span>
      </figcaption>
    </figure>
  );
}

/** Distribution of cost per life-year across the Monte Carlo draws (middle 99%). */
export function CostHistogram({ values, reference = 20000 }: { values: number[]; reference?: number }) {
  if (values.length < 10) return null;
  const lo = quantile(values, 0.005), hi = quantile(values, 0.995);
  const bins = 32, w = (hi - lo) / bins || 1;
  const counts = new Array<number>(bins).fill(0);
  for (const v of values) counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)))]++;
  const W = 560, H = 160, l = 8, r = 8, t = 20, b = 26;
  const maxC = Math.max(...counts);
  const sx = (v: number) => l + ((v - lo) / (hi - lo || 1)) * (W - l - r);
  const step = niceStep((hi - lo) / 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  const median = quantile(values, 0.5);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Across the draws, the median cost per life-year is ${eur(median)}.`}>
        <line x1={l} x2={W - r} y1={H - b} y2={H - b} stroke="var(--rule)" />
        {counts.map((c, i) => {
          const h = (c / maxC) * (H - t - b);
          return <rect key={i} x={sx(lo + i * w) + 0.5} y={H - b - h} width={Math.max(0, sx(lo + (i + 1) * w) - sx(lo + i * w) - 1)} height={h} fill="var(--ink)" opacity={0.75} />;
        })}
        {ticks.map((v) => (
          <text key={v} x={sx(v)} y={H - 8} fontSize={11} fill="var(--muted)" textAnchor="middle">{eurShort(v)}</text>
        ))}
        <line x1={sx(median)} x2={sx(median)} y1={t - 6} y2={H - b} stroke="var(--muted)" strokeDasharray="4 3" />
        <text x={Math.min(sx(median) + 4, W - 110)} y={t + 4} fontSize={11} fill="var(--ink)">Median {eurShort(median)}</text>
        {reference > lo && reference < hi && (
          <g>
            <line x1={sx(reference)} x2={sx(reference)} y1={t - 6} y2={H - b} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="1 3" strokeLinecap="round" />
            <text x={sx(reference) - 4} y={t + 20} fontSize={11} fill="var(--ink)" textAnchor="end">{eurShort(reference)}</text>
          </g>
        )}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">Cost per life-year gained across the draws (middle 99% shown).</figcaption>
    </figure>
  );
}
