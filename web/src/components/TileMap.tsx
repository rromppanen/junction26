import Link from "next/link";
import type { GapFacts, Region } from "@/lib/types";
import { ON_PAR_THRESHOLD } from "@/lib/gap";
import { STATUS_CLASSES, fmt, shortName } from "./format";

// Rough geographic grid (col, row) for Finland's wellbeing services counties, matched by name prefix.
const LAYOUT: [string, number, number][] = [
  ["Lapin", 2, 0],
  ["Pohjois-Pohjanmaan", 2, 1],
  ["Kainuun", 3, 1],
  ["Keski-Pohjanmaan", 1, 2],
  ["Pohjois-Savon", 3, 2],
  ["Pohjois-Karjalan", 4, 2],
  ["Pohjanmaan", 0, 3],
  ["Etelä-Pohjanmaan", 1, 3],
  ["Keski-Suomen", 2, 3],
  ["Etelä-Savon", 3, 3],
  ["Satakunnan", 0, 4],
  ["Pirkanmaan", 1, 4],
  ["Päijät-Hämeen", 2, 4],
  ["Kymenlaakson", 3, 4],
  ["Etelä-Karjalan", 4, 4],
  ["Varsinais-Suomen", 0, 5],
  ["Kanta-Hämeen", 1, 5],
  ["Keski-Uudenmaan", 2, 5],
  ["Itä-Uudenmaan", 3, 5],
  ["Länsi-Uudenmaan", 1, 6],
  ["Helsin", 2, 6],
  ["Vantaan", 3, 6],
  ["Ahvenanmaa", 0, 6],
];

function place(name: string): [number, number] | null {
  // Longest matching prefix wins (so "Pohjanmaan" does not swallow "Pohjois-Pohjanmaan").
  const hit = LAYOUT.filter(([p]) => name.startsWith(p)).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? [hit[1], hit[2]] : null;
}

export function TileMap({
  regions,
  facts,
  unit,
}: {
  regions: Region[];
  facts: Map<number, GapFacts>;
  unit: string;
}) {
  const counties = regions.filter((r) => r.kind === "county");
  const placed: { r: Region; col: number; row: number }[] = [];
  const unplaced: Region[] = [];
  for (const r of counties) {
    const p = place(r.name);
    if (p) placed.push({ r, col: p[0], row: p[1] });
    else unplaced.push(r);
  }
  const tile = (r: Region) => {
    const f = facts.get(r.id);
    const status = f?.status ?? "no-data";
    return (
      <Link
        href={`/county/${r.id}`}
        title={`${shortName(r.name)}: ${fmt(f?.value, unit)}`}
        className={`flex h-full flex-col justify-between rounded-[3px] px-1.5 pb-1 pt-1.5 text-left leading-none outline-offset-2 hover:outline-2 hover:outline-ink ${STATUS_CLASSES[status]}`}
      >
        <span lang="fi" className="font-narrow line-clamp-2 hyphens-auto text-[11px] leading-[1.1] [overflow-wrap:anywhere] sm:text-xs">{shortName(r.name)}</span>
        <span className="font-narrow text-base font-semibold tabular-nums sm:text-lg">{fmt(f?.value, unit)}</span>
      </Link>
    );
  };
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gridAutoRows: "minmax(56px, auto)" }}
        role="list"
        aria-label="Tile map of wellbeing services counties"
      >
        {placed.map(({ r, col, row }) => (
          <div key={r.id} role="listitem" style={{ gridColumn: col + 1, gridRow: row + 1 }}>
            {tile(r)}
          </div>
        ))}
      </div>
      {unplaced.length > 0 && (
        <div className="mt-1 grid grid-cols-5 gap-1">
          {unplaced.map((r) => (
            <div key={r.id} className="h-[56px]">{tile(r)}</div>
          ))}
        </div>
      )}
      <MapLegend unit={unit === "%" ? "points" : unit} />
    </div>
  );
}

/** Colour key, worded with the same threshold the ranking uses (ON_PAR_THRESHOLD). */
export function MapLegend({ unit = "points" }: { unit?: string }) {
  const t = `${ON_PAR_THRESHOLD} ${unit}`;
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <Legend cls="bg-behind" label={`More than ${t} behind Finland`} />
      <Legend cls="bg-rule" label={`Within ${t}`} />
      <Legend cls="bg-ahead" label={`More than ${t} ahead`} />
      <Legend cls="border border-dashed border-par" label="No figure" />
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-[2px] ${cls}`} />
      {label}
    </span>
  );
}
