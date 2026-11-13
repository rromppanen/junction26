import { fmt } from "./format";

type Pt = { year: number; value: number };

export function TrendChart({
  county,
  national,
  best = [],
  unit,
}: {
  county: Pt[];
  national: Pt[];
  /** Value at the best-quartile boundary among counties, per year. */
  best?: Pt[];
  unit: string;
}) {
  const W = 320, H = 120, P = { l: 34, r: 8, t: 10, b: 20 };
  const all = [...county, ...national, ...best];
  if (all.length === 0) return <p className="text-sm text-muted">No yearly figures to draw for this one.</p>;
  const years = all.map((p) => p.year);
  const x0 = Math.min(...years), x1 = Math.max(...years);
  let y0 = Math.min(...all.map((p) => p.value)), y1 = Math.max(...all.map((p) => p.value));
  const pad = (y1 - y0) * 0.15 || 1;
  y0 -= pad; y1 += pad;
  const sx = (y: number) => P.l + ((y - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const sy = (v: number) => H - P.b - ((v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = (pts: Pt[]) =>
    [...pts].sort((a, b) => a.year - b.year).map((p, i) => `${i ? "L" : "M"}${sx(p.year).toFixed(1)},${sy(p.value).toFixed(1)}`).join(" ");
  const lastC = [...county].sort((a, b) => b.year - a.year)[0];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="County versus national trend">
        {[y0 + pad, y1 - pad].map((v, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={sy(v)} y2={sy(v)} stroke="var(--rule)" strokeWidth={1} />
            <text x={P.l - 4} y={sy(v) + 3} textAnchor="end" fontSize={9} fill="var(--muted)">{fmt(v)}</text>
          </g>
        ))}
        <text x={P.l} y={H - 4} fontSize={9} fill="var(--muted)">{x0}</text>
        <text x={W - P.r} y={H - 4} fontSize={9} fill="var(--muted)" textAnchor="end">{x1}</text>
        {best.length > 1 && (
          <path d={path(best)} fill="none" stroke="var(--ahead)" strokeWidth={1.25} strokeOpacity={0.75} />
        )}
        <path d={path(national)} fill="none" stroke="var(--par)" strokeWidth={1.5} strokeDasharray="3 3" />
        <path d={path(county)} fill="none" stroke="var(--ink)" strokeWidth={2.25} strokeLinejoin="round" />
        {lastC && <circle cx={sx(lastC.year)} cy={sy(lastC.value)} r={3.5} fill="var(--ink)" />}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-ink" />This county</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-par" />Whole country</span>
        {best.length > 1 && (
          <span className="inline-flex items-center gap-1"><span className="inline-block h-px w-4 bg-ahead" />Best quarter of counties</span>
        )}
        {unit && unit !== "%" && <span>{unit}</span>}
      </figcaption>
    </figure>
  );
}
