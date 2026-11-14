import type { EquityFacts } from "./equity";
import { municipalitiesOf } from "./equity";
import type { Dataset, Indicator } from "./types";

/** Roadmap p. 10: immigrants take part in screening less often. */
export const REACH_EVIDENCE_ID = "roadmap-p10-socioeconomic";

/** Not foreign languages (and totals), in case a snapshot carries them. */
const EXCLUDED = new Set(["finnish", "swedish", "sami", "total", "national languages, total", "foreign languages, total"]);

export type ReachAction = { text: string; evidenceId: string };
export type ReachPlan = {
  indicatorId: number;
  areas: { regionId: number; name: string }[];
  languages: { language: string; count: number; sharePct: number }[];
  year: number;
  actions: ReachAction[];
};

export const REACH_ACTIONS: ReachAction[] = [
  "Send invitations in the largest languages here, with an SMS reminder, to these areas.",
  "Partner with local associations of the largest language groups to spread the word.",
  "Offer evening or weekend screening hours in these areas.",
  "Measure attendance per municipality after 6 months, to see whether it moved.",
].map((text) => ({ text, evidenceId: REACH_EVIDENCE_ID }));

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Who to reach, and where: the county's lagging municipalities for `indicator` (or, for a county with one
 * municipality, that municipality) and the five largest foreign languages spoken by residents there.
 * Language data describes residents, not who was invited. Null when there are no areas or no language data.
 */
export function reachPlan(ds: Dataset, countyId: number, indicator: Indicator, equity: EquityFacts): ReachPlan | null {
  if (!ds.languages?.length) return null;
  let areas: { regionId: number; name: string }[];
  if (equity.municipalityCount <= 1) {
    areas = municipalitiesOf(ds, countyId, 0).map((r) => ({ regionId: r.id, name: r.name }));
  } else {
    const rows = equity.lagging.find((l) => l.indicator.id === indicator.id)?.rows ?? [];
    areas = rows.filter((r) => r.gapToCounty < 0).map((r) => ({ regionId: r.region.id, name: r.region.name }));
  }
  const data = areas.flatMap((a) => ds.languages!.filter((l) => l.regionId === a.regionId));
  if (data.length === 0) return null;

  const counts = new Map<string, number>();
  for (const d of data) {
    for (const l of d.top) {
      if (EXCLUDED.has(l.language.toLowerCase())) continue;
      counts.set(l.language, (counts.get(l.language) ?? 0) + l.count);
    }
  }
  const total = data.reduce((s, d) => s + d.total, 0);
  const languages = [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([language, count]) => ({ language, count, sharePct: total > 0 ? round1((count / total) * 100) : 0 }));
  if (languages.length === 0) return null;

  return {
    indicatorId: indicator.id,
    areas: data.map((d) => areas.find((a) => a.regionId === d.regionId)!),
    languages,
    year: Math.max(...data.map((d) => d.year)),
    actions: REACH_ACTIONS,
  };
}
