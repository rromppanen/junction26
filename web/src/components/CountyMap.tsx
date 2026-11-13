import type { CSSProperties } from "react";
import shapes from "@/data/county-shapes.json";
import type { GapFacts, GapStatus, Region } from "@/lib/types";
import { MapLegend, TileMap } from "./TileMap";
import { STATUS_LABEL, fmt, shortName } from "./format";

// Local to this file for now; could move to format.ts. "points" for percentages, the unit otherwise.
function gapUnit(unit: string): string {
  return unit === "%" ? "points" : unit;
}

// The two direct annotations sit in the Gulf of Bothnia, west of Ostrobothnia and south of Lapland's
// Swedish border, where no county is drawn. Coordinates are in the shape file's units.
const VIEW = { x: -104, y: -4 };
const NOTE_RIGHT = 150; // right edge of the note column; Lapland and Pohjois-Pohjanmaa start east of ~200
const NOTE_TOP = [395, 555]; // upper and lower note; the lower one must end above Pohjanmaa (y ~685)

type Note = { key: string; heading: string; lines: string[]; status: GapStatus; target: number[]; inInset: boolean };

type Shape = { name: string; d: string; label: number[]; bbox: number[] };

const BY_NAME = new Map<string, Shape>((shapes.counties as Shape[]).map((s) => [s.name, s]));
const CAPITAL = new Set(shapes.capitalRegion);
// In the inset, Helsinki and Vantaa–Kerava are too small for a label inside; set them in the sea with a leader line.
const INSET_CALLOUT: Record<string, [number, number]> = {
  "Helsingin kaupunki": [287, 1127],
  "Vantaan ja Keravan hyvinvointialue": [342, 1124],
};

const FILL: Record<GapStatus, string> = {
  behind: "var(--behind)",
  "on-par": "var(--rule)",
  ahead: "var(--ahead)",
  "no-data": "var(--surface)",
};
const LABEL: Record<GapStatus, string> = {
  behind: "#fff",
  "on-par": "var(--ink)",
  ahead: "#fff",
  "no-data": "var(--muted)",
};

/**
 * Choropleth of the wellbeing services counties (Statistics Finland boundaries, see scripts/shapes.ts).
 * The five capital-region counties are drawn again, enlarged, underneath, because on the whole-country
 * map they are only a few pixels wide. Falls back to the tile grid if a county has no shape.
 */
export function CountyMap({
  regions,
  facts,
  unit,
}: {
  regions: Region[];
  facts: Map<number, GapFacts>;
  unit: string;
}) {
  const counties = regions.filter((r) => r.kind === "county");
  if (counties.some((r) => !BY_NAME.has(r.name))) return <TileMap regions={regions} facts={facts} unit={unit} />;

  const items = counties.map((r) => {
    const f = facts.get(r.id);
    const status: GapStatus = f?.status ?? "no-data";
    return { r, s: BY_NAME.get(r.name)!, status, value: fmt(f?.value, unit) };
  });

  const notes = mapNotes(items.map((it) => ({ ...it, f: facts.get(it.r.id) })), unit);

  const area = (it: (typeof items)[number], { showName }: { showName: boolean }) => {
    const callout = showName ? INSET_CALLOUT[it.r.name] : undefined;
    const [lx, ly] = callout ?? it.s.label;
    return (
    <a
      key={it.r.id}
      href={`/county/${it.r.id}`}
      aria-label={`${shortName(it.r.name)}: ${it.value}, ${STATUS_LABEL[it.status].toLowerCase()}`}
      className="group outline-none"
    >
      <title>{`${shortName(it.r.name)}: ${it.value}`}</title>
      <path
        d={it.s.d}
        fill={FILL[it.status]}
        stroke="var(--surface)"
        strokeWidth={showName ? 0.8 : 1.6}
        strokeLinejoin="round"
        strokeDasharray={it.status === "no-data" ? "3 2" : undefined}
      />
      {/* separate outline so hover/focus shows a thick ink edge without shifting the fills */}
      <path
        d={it.s.d}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={showName ? 1.2 : 3}
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        pointerEvents="none"
      />
      {callout && (
        <line
          x1={it.s.label[0]}
          y1={it.s.label[1]}
          x2={lx}
          y2={ly - 7}
          stroke="var(--ink)"
          strokeWidth={0.4}
          pointerEvents="none"
        />
      )}
      {(showName || !CAPITAL.has(it.r.name)) && (
        <text
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={callout ? "var(--ink)" : LABEL[it.status]}
          // halo in the county's own colour keeps the figure legible where it crosses a border or islands
          stroke={callout ? "var(--surface)" : FILL[it.status]}
          strokeWidth={showName ? 1.5 : 4}
          paintOrder="stroke"
          fontSize={showName ? 6.5 : 21}
          fontWeight={600}
          className="font-narrow pointer-events-none tabular-nums"
        >
          {showName && (
            <tspan x={lx} dy="-0.6em" fontWeight={400}>
              {shortName(it.r.name).replace(" and ", "–")}
            </tspan>
          )}
          <tspan x={lx} dy={showName ? "1.2em" : 0}>
            {it.value}
          </tspan>
        </text>
      )}
    </a>
    );
  };

  const [cx0, cy0, cx1, cy1] = shapes.capitalBox;
  const pad = 4;
  const capital = items.filter((it) => CAPITAL.has(it.r.name));

  const vw = shapes.width + 4 - VIEW.x;
  const vh = shapes.height + 8;
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  return (
    <div>
      <div className="relative mx-auto max-w-[520px]">
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${vw} ${vh}`}
          className="block h-auto w-full"
          role="group"
          aria-label="Map of Finland's wellbeing services counties, coloured by gap to the whole country"
        >
          {items.map((it) => area(it, { showName: false }))}
          <rect
            x={cx0 - pad}
            y={cy0 - pad}
            width={cx1 - cx0 + pad * 2}
            height={cy1 - cy0 + pad * 2}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            pointerEvents="none"
          />
          {notes.map((n, i) => (
            <g key={n.key} pointerEvents="none" aria-hidden>
              {/* leaders only where the notes sit on the map (sm and up); on phones the notes go below it */}
              {/* leader from the end of the note's top rule to a ring round the county's figure */}
              <polyline
                className="hidden sm:inline"
                points={`${NOTE_RIGHT},${NOTE_TOP[i]} ${NOTE_RIGHT + 14},${NOTE_TOP[i]} ${n.target[0]},${n.target[1]}`}
                fill="none"
                stroke="var(--surface)"
                strokeWidth={4}
              />
              <polyline
                className="hidden sm:inline"
                points={`${NOTE_RIGHT},${NOTE_TOP[i]} ${NOTE_RIGHT + 14},${NOTE_TOP[i]} ${n.target[0]},${n.target[1]}`}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={1.2}
              />
              <circle
                cx={n.target[0]}
                cy={n.target[1]}
                r={n.inInset ? 14 : 30}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={2}
              />
            </g>
          ))}
        </svg>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:contents">
        {notes.map((n, i) => (
          <p
            key={n.key}
            className={`border-t-2 pt-1 text-xs leading-[1.25] sm:absolute sm:left-0 sm:top-[var(--note-top)] sm:w-[var(--note-w)] ${
              n.status === "behind" ? "border-behind" : n.status === "ahead" ? "border-ahead" : "border-ink"
            }`}
            style={
              { "--note-top": pct(NOTE_TOP[i] - VIEW.y, vh), "--note-w": pct(NOTE_RIGHT - VIEW.x, vw) } as CSSProperties
            }
          >
            <span className="block text-muted">{n.heading}</span>
            {n.lines.map((l, j) => (
              <span key={j} className={`block ${j === 0 ? "font-narrow text-sm font-semibold sm:text-base" : ""}`}>
                {l}
              </span>
            ))}
          </p>
        ))}
        </div>
      </div>

      <p className="mb-1 mt-5 text-xs text-muted">Helsinki and the rest of Uusimaa, enlarged</p>
      <svg
        viewBox={`${cx0 - pad} ${cy0 - pad} ${cx1 - cx0 + pad * 2} ${cy1 - cy0 + pad * 2}`}
        className="block h-auto w-full rounded-[3px] border border-dashed border-par"
        role="group"
        aria-label="Capital region counties, enlarged"
      >
        {capital.map((it) => area(it, { showName: true }))}
      </svg>

      <MapLegend unit={gapUnit(unit)} />
      <p className="mt-2 text-[11px] text-muted">Boundaries: Statistics Finland, 2026 (CC BY 4.0).</p>
    </div>
  );
}

/**
 * The best and the weakest county, written out so the map can be read without the legend.
 * Skipped when fewer than two counties have a figure.
 */
function mapNotes(
  items: { r: Region; s: Shape; status: GapStatus; value: string; f: GapFacts | undefined }[],
  unit: string,
): Note[] {
  const ranked = items.filter((it) => it.f?.rank != null).sort((a, b) => a.f!.rank! - b.f!.rank!);
  if (ranked.length < 2) return [];
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const note = (it: (typeof ranked)[number], end: "best" | "worst"): Note => {
    const g = it.f!.gapToNational;
    const inInset = CAPITAL.has(it.r.name);
    const heading =
      end === "worst"
        ? it.status === "behind" ? "Furthest behind" : "Weakest figure"
        : it.status === "ahead" ? "Furthest ahead" : "Best figure";
    const gapLine =
      g === null
        ? ""
        : g === 0
          ? "Level with Finland"
          : `${Math.abs(g).toFixed(1)} ${gapUnit(unit)} ${g < 0 ? "behind" : "ahead of"} Finland`;
    return {
      key: end,
      heading,
      lines: [`${shortName(it.r.name)} ${it.value}`, gapLine, inInset ? "Shown enlarged below" : ""].filter(Boolean),
      status: it.status,
      target: it.s.label,
      inInset,
    };
  };
  // the upper note points at the county further north so the two leaders do not cross
  return [note(best, "best"), note(worst, "worst")].sort((a, b) => a.target[1] - b.target[1]);
}
