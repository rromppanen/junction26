import type { CountyPathway } from "./pathway";

/**
 * Capacity stress test: if colonoscopy capacity fell by `dropPct` %, the county's examined positives fall by the
 * same share. Lost colonoscopies carry Finland's yield per colonoscopy. A scenario on real counts, not a forecast:
 * there is no public data on hospital capacity.
 */
export type StressResult = { lostColonoscopies: number; examinedAfter: number; examinedPctAfter: number; cancers: number; advanced: number };

export function capacityDrop(p: CountyPathway, dropPct: number): StressResult {
  const drop = Math.min(Math.max(dropPct, 0), 100) / 100;
  const lost = Math.round(p.examinedPeople * drop);
  const after = p.examinedPeople - lost;
  return {
    lostColonoscopies: lost,
    examinedAfter: after,
    examinedPctAfter: p.findings.positive > 0 ? Math.round((after / p.findings.positive) * 1000) / 10 : 0,
    cancers: Math.round(lost * p.yield.cancerPerColonoscopy * 10) / 10,
    advanced: Math.round(lost * p.yield.advancedPerColonoscopy),
  };
}
