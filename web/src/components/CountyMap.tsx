import shapes from "@/data/county-shapes.json";
import type { GapFacts, GapStatus, Region } from "@/lib/types";
import { MapLegend, TileMap } from "./TileMap";
import { STATUS_LABEL, fmt, shortName } from "./format";

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
  const counties = regions.filter((r) => !r.isNational);
  if (counties.some((r) => !BY_NAME.has(r.name))) return <TileMap regions={regions} facts={facts} unit={unit} />;

  const items = counties.map((r) => {
    const f = facts.get(r.id);
    const status: GapStatus = f?.status ?? "no-data";
    return { r, s: BY_NAME.get(r.name)!, status, value: fmt(f?.value, unit) };
  });

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

  return (
    <div>
      <svg
        viewBox={`-4 -4 ${shapes.width + 8} ${shapes.height + 8}`}
        className="mx-auto block h-auto w-full max-w-[460px]"
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
      </svg>

      <p className="mb-1 mt-5 text-xs text-muted">Helsinki and the rest of Uusimaa, enlarged</p>
      <svg
        viewBox={`${cx0 - pad} ${cy0 - pad} ${cx1 - cx0 + pad * 2} ${cy1 - cy0 + pad * 2}`}
        className="block h-auto w-full rounded-[3px] border border-dashed border-par"
        role="group"
        aria-label="Capital region counties, enlarged"
      >
        {capital.map((it) => area(it, { showName: true }))}
      </svg>

      <MapLegend />
      <p className="mt-2 text-[11px] text-muted">Boundaries: Statistics Finland, 2026 (CC BY 4.0).</p>
    </div>
  );
}
