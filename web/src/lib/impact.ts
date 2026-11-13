import type { GapFacts } from "./types";

/**
 * Whole people per 1,000 invited who would need to take part to lift a rate from `value` to `goal` (both %).
 * Rounded up; 0 when already reached; null when either figure is missing.
 */
export function peoplePer1000ToReach(value: number | null, goal: number | null): number | null {
  if (value === null || goal === null || !Number.isFinite(value) || !Number.isFinite(goal)) return null;
  const gap = goal - value;
  if (gap <= 0) return 0;
  // Round to 1 decimal first so float noise (e.g. 5.7000000000000002 * 10) cannot tip ceil over.
  return Math.ceil(Math.round(gap * 10) / 10 * 10 - 1e-9);
}

export type ImpactRow = { indicatorId: number; toTarget: number | null; toNational: number | null };

/** One row per indicator with an official target (the screening ones). */
export function impactFacts(facts: GapFacts[]): ImpactRow[] {
  return facts
    .filter((f) => f.target !== null)
    .map((f) => ({
      indicatorId: f.indicatorId,
      toTarget: peoplePer1000ToReach(f.value, f.target),
      toNational: peoplePer1000ToReach(f.value, f.national),
    }));
}
