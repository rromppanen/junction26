import type { Dataset, GapFacts, Indicator, Region } from "./types";

/** A twin must beat the county by at least this many indicator units. */
export const MIN_BETTER = 2;

const POPULATION = 127;
const EDUCATION = 180;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Latest value at or before `year`, so a context series that lags the indicator year still counts. */
function contextValue(ds: Dataset, indicatorId: number, regionId: number, year: number): number | null {
  let best: { year: number; value: number } | null = null;
  for (const x of ds.values) {
    if (x.indicatorId === indicatorId && x.regionId === regionId && x.year <= year && (!best || x.year > best.year)) {
      best = x;
    }
  }
  return best ? best.value : null;
}

function exactValue(ds: Dataset, indicatorId: number, regionId: number, year: number): number | null {
  const x = ds.values.find((v) => v.indicatorId === indicatorId && v.regionId === regionId && v.year === year);
  return x ? x.value : null;
}

/** The county's most-behind radar indicator (by gapToNational), or null when none is behind. */
export function worstIndicator(facts: GapFacts[]): GapFacts | null {
  const behind = facts.filter((f) => f.status === "behind" && f.gapToNational !== null);
  if (behind.length === 0) return null;
  return behind.reduce((a, b) => ((b.gapToNational as number) < (a.gapToNational as number) ? b : a));
}

type Profile = { region: Region; value: number; logPop: number; edu: number };

/**
 * The county most like this one (log population and education level, z-scored over all counties with data)
 * among counties at least MIN_BETTER points better on the indicator. Counties only; null if there is none.
 * similarity = 1 / (1 + distance in standard deviations), so 1 means identical profile.
 */
export function findPeerTwin(
  ds: Dataset,
  ind: Indicator,
  countyId: number,
  year: number,
): { twin: Region; twinValue: number; similarity: number } | null {
  const sign = ind.higherIsBetter ? 1 : -1;
  const profiles: Profile[] = [];
  for (const region of ds.regions) {
    if (region.kind !== "county") continue;
    const value = exactValue(ds, ind.id, region.id, year);
    const pop = contextValue(ds, POPULATION, region.id, year);
    const edu = contextValue(ds, EDUCATION, region.id, year);
    if (value === null || pop === null || edu === null || pop <= 0) continue;
    profiles.push({ region, value, logPop: Math.log(pop), edu });
  }
  const self = profiles.find((p) => p.region.id === countyId);
  if (!self) return null;

  const stat = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
    return { m, sd: sd || 1 };
  };
  const pop = stat(profiles.map((p) => p.logPop));
  const edu = stat(profiles.map((p) => p.edu));
  const z = (p: Profile) => [(p.logPop - pop.m) / pop.sd, (p.edu - edu.m) / edu.sd];
  const [sx, sy] = z(self);

  let best: { p: Profile; d: number } | null = null;
  for (const p of profiles) {
    if (p.region.id === countyId) continue;
    if (sign * (p.value - self.value) < MIN_BETTER) continue;
    const [x, y] = z(p);
    const d = Math.hypot(x - sx, y - sy);
    if (!best || d < best.d || (d === best.d && sign * p.value > sign * best.p.value)) best = { p, d };
  }
  if (!best) return null;
  return { twin: best.p.region, twinValue: best.p.value, similarity: round2(1 / (1 + best.d)) };
}
