import type { Dataset, GapFacts, GapStatus, Indicator } from "./types";

/** Gap (in indicator units) within which a county counts as on par with the national value. */
export const ON_PAR_THRESHOLD = 2;

const round1 = (n: number) => Math.round(n * 10) / 10;

function nationalIds(ds: Dataset): Set<number> {
  return new Set(ds.regions.filter((r) => r.isNational).map((r) => r.id));
}

function valueOf(ds: Dataset, indicatorId: number, regionId: number, year: number): number | null {
  const v = ds.values.find((x) => x.indicatorId === indicatorId && x.regionId === regionId && x.year === year);
  return v ? v.value : null;
}

/** Latest year with at least one county (non-national) value for the indicator. */
export function latestYear(ds: Dataset, ind: Indicator): number {
  const nat = nationalIds(ds);
  let max = -Infinity;
  for (const v of ds.values) {
    if (v.indicatorId === ind.id && !nat.has(v.regionId) && v.year > max) max = v.year;
  }
  return Number.isFinite(max) ? max : NaN;
}

/** Linear-interpolated percentile (p in 0..1) of a non-empty array. */
function percentile(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

function countyValues(ds: Dataset, ind: Indicator, year: number): { regionId: number; value: number }[] {
  const nat = nationalIds(ds);
  return ds.values
    .filter((v) => v.indicatorId === ind.id && v.year === year && !nat.has(v.regionId))
    .map((v) => ({ regionId: v.regionId, value: v.value }));
}

export function computeGap(ds: Dataset, ind: Indicator, regionId: number, year: number): GapFacts {
  const sign = ind.higherIsBetter ? 1 : -1;
  const value = valueOf(ds, ind.id, regionId, year);
  const natRegion = ds.regions.find((r) => r.isNational);
  const national = natRegion ? valueOf(ds, ind.id, natRegion.id, year) : null;

  const counties = countyValues(ds, ind, year);
  const bestQuartile = counties.length
    ? round1(percentile(counties.map((c) => c.value), ind.higherIsBetter ? 0.75 : 0.25))
    : null;

  const gapToNational = value !== null && national !== null ? round1(sign * (value - national)) : null;
  const gapToBestQuartile = value !== null && bestQuartile !== null ? round1(sign * (value - bestQuartile)) : null;

  // rank 1 = best; ties share the better rank
  const rank = value !== null ? counties.filter((c) => sign * c.value > sign * value).length + 1 : null;

  const prev = valueOf(ds, ind.id, regionId, year - 3);
  const trend3y = value !== null && prev !== null ? round1(value - prev) : null;

  let status: GapStatus;
  if (value === null) status = "no-data";
  else if (gapToNational !== null && gapToNational < -ON_PAR_THRESHOLD) status = "behind";
  else if (gapToNational !== null && gapToNational > ON_PAR_THRESHOLD) status = "ahead";
  else status = "on-par";

  return {
    indicatorId: ind.id,
    regionId,
    year,
    value,
    national,
    bestQuartile,
    gapToNational,
    gapToBestQuartile,
    rank,
    rankOf: counties.length,
    trend3y,
    status,
  };
}

/** GapFacts for every non-national region, best first, no-data last. */
export function rankCounties(ds: Dataset, ind: Indicator, year: number): GapFacts[] {
  return ds.regions
    .filter((r) => !r.isNational)
    .map((r) => computeGap(ds, ind, r.id, year))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}
