import { fmt } from "./format";

type Pt = { year: number; value: number };

type EndLabel = { y: number; text: string; fill: string; weight: number };

const byYear = (pts: Pt[]) => [...pts].sort((a, b) => a.year - b.year);

/**
 * Small trend chart, labelled directly: each line carries its latest value at its right end, so there
 * is no legend to look up. The county line is heavy ink; Finland is dashed; the best-quarter boundary is
 * a thin blue line. A national target, when one exists, is drawn as a dotted line and named.
 */
export function TrendChart({
  county,
  national,
  best = [],
  unit,
  target = null,
  countyName,
}: {
  county: Pt[];
  national: Pt[];
  /** Value at the best-quartile boundary among counties, per year. */
  best?: Pt[];
  unit: string;
  /** Official national target, drawn as a reference line. */
  target?: number | null;
  countyName: string;
}) {
  const W = 360, H = 140, P = { l: 34, r: 106, t: 10, b: 22 };
  const all = [...county, ...national, ...best];
  if (all.length === 0) return <p className="text-sm text-muted">Sotkanet has no yearly figures to draw for this measure.</p>;

  const years = all.map((p) => p.year);
  const x0 = Math.min(...years), x1 = Math.max(...years);
  const vals = all.map((p) => p.value).concat(target !== null ? [target] : []);
  let y0 = Math.min(...vals), y1 = Math.max(...vals);
  const pad = (y1 - y0) * 0.12 || 1;
  y0 -= pad; y1 += pad;
  const sx = (y: number) => P.l + ((y - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const sy = (v: number) => H - P.b - ((v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = (pts: Pt[]) =>
    byYear(pts).map((p, i) => `${i ? "L" : "M"}${sx(p.year).toFixed(1)},${sy(p.value).toFixed(1)}`).join(" ");

  const c = byYear(county), n = byYear(national), b = byYear(best);
  const firstC = c[0], lastC = c.at(-1), lastN = n.at(-1), lastB = b.at(-1);

  const targetText = target === null ? "" : Number.isInteger(target) ? `${target}${unit === "%" ? "%" : ` ${unit}`}` : fmt(target, unit);

  // End-of-line labels, nudged apart so they never overlap.
  const labels: EndLabel[] = [];
  if (lastC) labels.push({ y: sy(lastC.value), text: fmt(lastC.value, unit), fill: "var(--ink)", weight: 700 });
  if (lastN) labels.push({ y: sy(lastN.value), text: `Finland ${fmt(lastN.value, unit)}`, fill: "var(--muted)", weight: 400 });
  if (lastB && b.length > 1) labels.push({ y: sy(lastB.value), text: `Best quarter ${fmt(lastB.value, unit)}`, fill: "var(--ahead)", weight: 400 });
  if (target !== null) labels.push({ y: sy(target), text: `${targetText} target`, fill: "var(--ink)", weight: 400 });
  labels.sort((a, z) => a.y - z.y);
  const GAP = 13;
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + GAP);
  const overflow = (labels.at(-1)?.y ?? 0) - (H - P.b + 2);
  if (overflow > 0) labels.forEach((l) => (l.y -= overflow));
  const labelX = sx(x1) + 6;

  const summary = [
    firstC && lastC && firstC.year !== lastC.year
      ? `${countyName}: ${fmt(firstC.value, unit)} in ${firstC.year}, ${fmt(lastC.value, unit)} in ${lastC.year}.`
      : lastC && `${countyName}: ${fmt(lastC.value, unit)} in ${lastC.year}.`,
    lastN && `Finland: ${fmt(lastN.value, unit)} in ${lastN.year}.`,
    target !== null && `National target: ${targetText}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={summary}>
        <line x1={P.l} x2={sx(x1)} y1={H - P.b} y2={H - P.b} stroke="var(--rule)" strokeWidth={1} />
        <text x={P.l} y={H - 5} fontSize={11} fill="var(--muted)">{x0}</text>
        {x1 !== x0 && <text x={sx(x1)} y={H - 5} fontSize={11} fill="var(--muted)" textAnchor="end">{x1}</text>}

        {target !== null && (
          <g>
            <line x1={P.l} x2={sx(x1)} y1={sy(target)} y2={sy(target)} stroke="var(--ink)" strokeWidth={1} strokeDasharray="1 3" strokeLinecap="round" />
          </g>
        )}

        {b.length > 1 && <path d={path(b)} fill="none" stroke="var(--ahead)" strokeWidth={1.25} strokeOpacity={0.8} />}
        <path d={path(n)} fill="none" stroke="var(--par)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={path(c)} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {lastC && <circle cx={sx(lastC.year)} cy={sy(lastC.value)} r={3.5} fill="var(--ink)" />}

        {firstC && lastC && firstC.year !== lastC.year && (
          <text x={P.l - 5} y={sy(firstC.value) + 3.5} fontSize={11} fill="var(--ink)" textAnchor="end">{fmt(firstC.value)}</text>
        )}
        {labels.map((l) => (
          <text key={l.text} x={labelX} y={l.y + 4} fontSize={11} fill={l.fill} fontWeight={l.weight}>{l.text}</text>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        The heavy line is {countyName}.{unit && unit !== "%" ? ` Figures in ${unit}.` : ""}
      </figcaption>
    </figure>
  );
}
