import type { Dataset, Indicator, IndicatorValue, Region } from "./types";

/** Sotkanet "Population at year end"; used to leave out very small municipalities. */
const POPULATION_ID = 127;
/** Fewest municipalities for which a rank correlation is reported. */
export const MIN_ASSOCIATION_N = 6;
/** Correlations at least this strong (either sign) are put into words. */
export const ASSOCIATION_THRESHOLD = 0.4;

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

function valuesAt(ds: Dataset, indicatorId: number, year: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of ds.values) if (v.indicatorId === indicatorId && v.year === year) m.set(v.regionId, v.value);
  return m;
}

/** Each region's latest value at or before `year` (context data such as population may lag a year). */
function latestValuesUpTo(ds: Dataset, indicatorId: number, year: number): Map<number, number> {
  const best = new Map<number, IndicatorValue>();
  for (const v of ds.values) {
    if (v.indicatorId !== indicatorId || v.year > year) continue;
    const cur = best.get(v.regionId);
    if (!cur || v.year > cur.year) best.set(v.regionId, v);
  }
  return new Map([...best].map(([id, v]) => [id, v.value]));
}

/** The county's municipalities with at least `minPopulation` residents (latest population figure), by name. */
export function municipalitiesOf(ds: Dataset, countyId: number, minPopulation = 2000): Region[] {
  const pop = latestValuesUpTo(ds, POPULATION_ID, Infinity);
  return ds.regions
    .filter((r) => r.kind === "municipality" && r.parentId === countyId)
    .filter((r) => minPopulation <= 0 || (pop.get(r.id) ?? 0) >= minPopulation)
    .sort((a, b) => a.name.localeCompare(b.name, "fi"));
}

/**
 * The `n` municipalities furthest behind their own county on `ind` in `year`, worst first.
 * gapToCounty is sign-corrected: negative = worse than the county as a whole.
 */
export function laggingMunicipalities(
  ds: Dataset,
  ind: Indicator,
  countyId: number,
  year: number,
  n = 5,
): { region: Region; value: number; gapToCounty: number }[] {
  const vals = valuesAt(ds, ind.id, year);
  const county = vals.get(countyId);
  if (county === undefined) return [];
  const sign = ind.higherIsBetter ? 1 : -1;
  return municipalitiesOf(ds, countyId)
    .filter((r) => vals.has(r.id))
    .map((region) => {
      const value = vals.get(region.id) as number;
      return { region, value, gapToCounty: round1(sign * (value - county)) };
    })
    .sort((a, b) => a.gapToCounty - b.gapToCounty || a.region.name.localeCompare(b.region.name, "fi"))
    .slice(0, n);
}

/** Ranks 1..n, ties get their average rank. */
function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k][1]] = avg;
    i = j + 1;
  }
  return out;
}

function pearson(a: number[], b: number[]): number | null {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? null : num / Math.sqrt(da * db);
}

/**
 * Spearman rank correlation between `ind` and a context indicator across the county's municipalities
 * (those from municipalitiesOf). rho is rounded to 2 decimals and is not sign-corrected: positive means
 * municipalities with a higher context value tend to have a higher `ind` value. This is an area-level
 * association, never a statement about individuals. Null when fewer than 6 municipalities have both values.
 */
export function association(
  ds: Dataset,
  ind: Indicator,
  contextInd: Indicator,
  countyId: number,
  year: number,
): { rho: number; n: number } | null {
  const y = valuesAt(ds, ind.id, year);
  const x = latestValuesUpTo(ds, contextInd.id, year);
  const pairs = municipalitiesOf(ds, countyId)
    .filter((r) => y.has(r.id) && x.has(r.id))
    .map((r) => [x.get(r.id) as number, y.get(r.id) as number] as const);
  if (pairs.length < MIN_ASSOCIATION_N) return null;
  const rho = pearson(ranks(pairs.map((p) => p[0])), ranks(pairs.map((p) => p[1])));
  return rho === null ? null : { rho: round2(rho) + 0, n: pairs.length }; // + 0 turns -0 into 0
}

/** "municipalities with ___ tend to have …": the high end of each context indicator, in plain words. */
const CONTEXT_PHRASE: Record<number, string> = {
  127: "more residents",
  180: "a higher education level",
  3074: "more foreign nationals",
  5102: "more residents of foreign background",
  181: "higher unemployment",
};

/** How a measure reads inside a sentence. */
const MEASURE_PHRASE: Record<string, string> = {
  "breast-screening": "breast screening attendance",
  "colorectal-screening": "bowel screening attendance",
  "cervical-screening": "cervical screening attendance",
};

export function measurePhrase(ind: Indicator): string {
  return MEASURE_PHRASE[ind.slug] ?? ind.nameEn.toLowerCase();
}

/** Plain-English, area-level sentence for one association. */
export function associationSentence(ind: Indicator, contextInd: Indicator, a: { rho: number; n: number }): string {
  const ctx = CONTEXT_PHRASE[contextInd.id] ?? `a higher value of "${contextInd.nameEn.toLowerCase()}"`;
  const dir = a.rho < 0 ? "lower" : "higher";
  return `In this county, municipalities with ${ctx} tend to have ${dir} ${measurePhrase(ind)} (area-level, n = ${a.n}).`;
}

export const AREA_LEVEL_CAVEAT =
  "These are patterns between municipalities, not facts about individual people. A municipality with many residents of foreign background and low attendance does not show that those residents are the ones not attending. Use them to decide where to look first.";

export type EquityLagging = {
  indicator: Indicator;
  year: number;
  countyValue: number | null;
  rows: { region: Region; value: number; gapToCounty: number }[];
};
export type EquityAssociation = { indicator: Indicator; context: Indicator; year: number; rho: number; n: number; sentence: string };
export type EquityFacts = {
  /** Municipalities with at least 2,000 residents. Fewer than 2 = the lens does not apply (e.g. Helsinki). */
  municipalityCount: number;
  applicable: boolean;
  lagging: EquityLagging[];
  /** Only associations with |rho| >= 0.4. */
  associations: EquityAssociation[];
};

/** Latest year in which any of the county's municipalities has a value for `ind`. */
function latestMunicipalYear(ds: Dataset, ind: Indicator, ids: Set<number>): number | null {
  let max = -Infinity;
  for (const v of ds.values) if (v.indicatorId === ind.id && ids.has(v.regionId) && v.year > max) max = v.year;
  return Number.isFinite(max) ? max : null;
}

/** Everything the equity lens shows (and the analyst gets) for one county. */
export function equityFacts(ds: Dataset, countyId: number, indicators: Indicator[], contexts: Indicator[]): EquityFacts {
  const munis = municipalitiesOf(ds, countyId);
  const ids = new Set(munis.map((r) => r.id));
  const applicable = munis.length >= 2;
  const lagging: EquityLagging[] = [];
  const associations: EquityAssociation[] = [];
  if (!applicable) return { municipalityCount: munis.length, applicable, lagging, associations };
  for (const ind of indicators) {
    const year = latestMunicipalYear(ds, ind, ids);
    if (year === null) continue;
    const rows = laggingMunicipalities(ds, ind, countyId, year);
    if (rows.length === 0) continue;
    lagging.push({ indicator: ind, year, countyValue: valuesAt(ds, ind.id, year).get(countyId) ?? null, rows });
    for (const ctx of contexts) {
      const a = association(ds, ind, ctx, countyId, year);
      if (a && Math.abs(a.rho) >= ASSOCIATION_THRESHOLD) {
        associations.push({ indicator: ind, context: ctx, year, ...a, sentence: associationSentence(ind, ctx, a) });
      }
    }
  }
  return { municipalityCount: munis.length, applicable, lagging, associations };
}

/** Every number from equityFacts that may be quoted (for the brief validator's `extra`). */
export function equityNumbers(e: EquityFacts): number[] {
  return [
    e.municipalityCount,
    ...e.lagging.flatMap((l) => [l.countyValue ?? NaN, ...l.rows.flatMap((r) => [r.value, r.gapToCounty])]),
    ...e.associations.flatMap((a) => [a.rho, a.n]),
  ].filter((x) => Number.isFinite(x));
}
