import goal3 from "@/data/goal3.json" with { type: "json" };

/** Goal 3 of the national cancer strategy 2026–2035 ("equal and effective cancer care"), measured as a regional outcome. */
export const GOAL3_LABEL = "Goal 3 · Cervical cancer 5-year relative survival";
/** A county this many percentage points or more below the national value gets an outcome-review action. Descriptive triage, like REVIEW_GAP. */
export const OUTCOME_REVIEW_GAP = 5;

export type Goal3Outcome = {
  region: string;
  /** Statistical year actually used: the latest one at or before the requested year. */
  year: number;
  value: number;
  national: number;
  /** value − national, in percentage points. Negative = lower survival than Finland as a whole. */
  gap: number;
  sourceUrl: string;
};

type Data = { manifest: { sourceUrl: string }; national: Record<string, number>; rows: { region: string; year: number; value: number }[] };

/** Survival for a wellbeing services county named as in the screening data, or null when the group is not a county with data. */
export function goal3Outcome(region: string, year: number, data: Data = goal3): Goal3Outcome | null {
  const row = data.rows.filter(r => r.region === region && r.year <= year).sort((a, b) => b.year - a.year)[0];
  const national = row ? data.national[String(row.year)] : undefined;
  if (!row || national === undefined) return null;
  return { region, year: row.year, value: row.value, national, gap: row.value - national, sourceUrl: data.manifest.sourceUrl };
}

export const goal3Note = "Age-standardised; each year follows patients diagnosed over the preceding 15 years. Whole percentages without intervals, so small counties vary by chance.";
