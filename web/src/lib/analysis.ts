import { OUTCOME_REVIEW_GAP, type Goal3Outcome } from "./goal3";

export type Observation = {
  year: number; dimension: string; group: string; cohort: string;
  invited: number; attended: number; referred: number | null; completed: number | null;
  locator?: string; originalGroup?: string;
};
export type Metric = "participation" | "followup";
export type Finding = {
  row: Observation; metric: Metric; rate: number; benchmark: number | null;
  gap: number | null; numerator: number; denominator: number;
  interval: [number, number] | null; status: "review" | "within" | "insufficient";
};
export const MIN_COUNT = 30;
export const REVIEW_GAP = 5;
export const metricLabel = (metric: Metric) => metric === "participation" ? "Screening participation" : "Recorded follow-up completion";
export const metricCounts = (row: Observation, metric: Metric): [number | null, number | null] => metric === "participation" ? [row.attended, row.invited] : [row.completed, row.referred];

export function validateRows(rows: Observation[]): Observation[] {
  if (!rows.length || rows.length > 5000) throw new Error("Provide between 1 and 5,000 aggregate rows.");
  const keys = new Set<string>();
  for (const [i, r] of rows.entries()) {
    const prefix = `Row ${i + 2}: `;
    if (!Number.isInteger(r.year) || r.year < 2000 || r.year > 2100) throw new Error(prefix + "year must be a four-digit year between 2000 and 2100.");
    if (![r.dimension, r.group, r.cohort].every(v => typeof v === "string" && v.trim().length > 0 && v.length <= 160)) throw new Error(prefix + "group, dimension and cohort must be non-empty labels (max 160 characters).");
    for (const v of [r.invited, r.attended]) if (!Number.isSafeInteger(v) || v < 0) throw new Error(prefix + "invited and attended must be non-negative whole counts.");
    for (const v of [r.referred, r.completed]) if (v !== null && (!Number.isSafeInteger(v) || v < 0)) throw new Error(prefix + "optional counts must be non-negative whole counts or empty.");
    if ((r.referred === null) !== (r.completed === null)) throw new Error(prefix + "supply both referred and completed, or leave both empty.");
    if (r.attended > r.invited || (r.referred !== null && r.referred > r.attended) || (r.completed !== null && r.referred !== null && r.completed > r.referred)) throw new Error(prefix + "counts must satisfy completed ≤ referred ≤ attended ≤ invited.");
    const key = JSON.stringify([r.year, r.dimension, r.group, r.cohort]);
    if (keys.has(key)) throw new Error(prefix + "duplicate year / dimension / group / cohort.");
    keys.add(key);
  }
  // A supplied overall row is used only if it reconciles with mutually exclusive groups.
  const slices = new Map<string, Observation[]>();
  for (const r of rows) { const key = JSON.stringify([r.year, r.dimension, r.cohort]); slices.set(key, [...(slices.get(key) ?? []), r]); }
  for (const slice of slices.values()) {
    const total = slice.find(r => r.group === "All groups");
    const groups = slice.filter(r => r.group !== "All groups");
    if (total && groups.length) for (const col of ["invited", "attended", "referred", "completed"] as const) {
      if (total[col] === null && groups.every(r => r[col] === null)) continue;
      if (total[col] === null || groups.some(r => r[col] === null) || groups.reduce((sum, r) => sum + (r[col] ?? 0), 0) !== total[col]) throw new Error("An All groups total does not reconcile with its groups. Supply a complete disjoint partition or omit the total.");
    }
  }
  return rows;
}

export function wilson(successes: number, n: number): [number, number] | null {
  if (n <= 0) return null;
  const p = successes / n, z = 1.95996398454, d = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / d;
  const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, center - half) * 100, Math.min(1, center + half) * 100];
}

export function analyse(rows: Observation[], year: number, dimension: string, cohort: string, metric: Metric): Finding[] {
  const slice = rows.filter(r => r.year === year && r.dimension === dimension && r.cohort === cohort && r.group !== "All groups");
  return slice.map(row => {
    const [num, den] = metricCounts(row, metric);
    // Compare with the remaining disjoint groups, not a national total containing this group.
    const others = slice.filter(r => r.group !== row.group).map(r => metricCounts(r, metric));
    const complete = others.length > 0 && others.every(([n, d]) => n !== null && d !== null);
    const otherN = others.reduce((sum, [n]) => sum + (n ?? 0), 0), otherD = others.reduce((sum, [, d]) => sum + (d ?? 0), 0);
    const usable = num !== null && den !== null && den > 0;
    const rate = usable ? num / den * 100 : 0;
    const benchmark = complete && otherD > 0 ? otherN / otherD * 100 : null;
    const gap = usable && benchmark !== null ? rate - benchmark : null;
    const enough = usable && den >= MIN_COUNT && complete && otherD >= MIN_COUNT;
    return { row, metric, rate, benchmark, gap, numerator: num ?? 0, denominator: den ?? 0, interval: usable ? wilson(num, den) : null,
      status: !enough ? "insufficient" as const : gap !== null && gap <= -REVIEW_GAP ? "review" as const : "within" as const };
  }).sort((a, b) => (a.gap ?? Infinity) - (b.gap ?? Infinity));
}

export type Action = { id: string; title: string; owner: string; timeframe: string; steps: string[]; measure: string; evidenceIds: string[] };
/** Process actions for the finding, plus a Goal 3 outcome review when the county's survival is well below the national level. */
export function recommend(finding: Finding, outcome: Goal3Outcome | null = null): Action[] {
  const review = outcomeAction(outcome);
  return review ? [...processActions(finding), review] : processActions(finding);
}

/** The Goal 3 outcome review, or null when the county is near or above the national level or has no data. */
export function outcomeAction(outcome: Goal3Outcome | null | undefined): Action | null {
  if (!outcome || outcome.gap > -OUTCOME_REVIEW_GAP) return null;
  return { id: "outcome", title: "Review why cervical cancer survival is below the national level", owner: "County cancer-care lead + gynaecological oncology unit", timeframe: "Proposed: initial review within three months", steps: ["From the county's own records, check stage at diagnosis and time from diagnosis to treatment start; neither is published per county.", "Check whether the screening or follow-up gaps found here concern the same areas or groups as the late-stage diagnoses.", "Take the findings to the county's cancer-care steering group for comparison with better-performing counties."], measure: "Cervical cancer 5-year relative survival (Goal 3), plus stage at diagnosis and diagnosis-to-treatment time from local records", evidenceIds: ["survival", "strategy"] };
}

function processActions(finding: Finding): Action[] {
  if (finding.status !== "review") return [{ id: "monitor", title: "Maintain monitoring before changing services", owner: "Screening programme lead", timeframe: "Next comparable reporting period", steps: ["Review source completeness and preserve comparable group definitions.", "Reassess the same measure when the next complete reporting period is available."], measure: metricLabel(finding.metric), evidenceIds: ["quality"] }];
  if (finding.metric === "followup") return [{ id: "reconcile", title: "Reconcile referrals with recorded examinations", owner: "Screening coordinator + diagnostic service lead", timeframe: "Proposed: initial review within four weeks", steps: ["Verify whether unrecorded examinations reflect missing reports, ongoing follow-up, or non-attendance.", "Agree responsibility for referral reconciliation and review aggregate unresolved counts.", "Only if access problems are confirmed, design and evaluate a local service pilot."], measure: "Recorded completion among referred participants, plus reporting completeness", evidenceIds: ["quality", "report"] }];
  const actions: Action[] = [{ id: "invitation", title: "Audit invitation and reminder delivery", owner: "County screening programme lead", timeframe: "Proposed: initial review within four weeks", steps: ["Check whether invitation delivery, booking instructions and reminders reach the affected group.", "Review reminder practice against the screening handbook.", "Evaluate changes using the same participation definition; preserve the choice to decline screening."], measure: "Participation among invited participants; reminder delivery and patient feedback", evidenceIds: ["reminders", "quality"] }];
  if (finding.row.dimension === "Language") actions.unshift({ id: "language", title: "Review language accessibility of invitations", owner: "Screening programme + communications lead", timeframe: "Proposed: review with community representatives", steps: ["Verify which languages are actually needed; the source combines other and missing language.", "Assess translated invitations and accessible booking support against the handbook.", "Co-design a small evaluated pilot without assuming language caused the observed difference."], measure: "Participation, invitation comprehension and informed choice", evidenceIds: ["language", "quality"] });
  return actions;
}

export type Draft = { headline: string; interpretation: string; nextQuestion: string; evidenceIds: string[] };
export function fallbackDraft(finding: Finding): Draft {
  if (finding.status === "insufficient") return {
    headline: "More comparable data are needed",
    interpretation: "This selection has insufficient comparable counts. No pathway gap or cause can be established from this comparison.",
    nextQuestion: "Can complete paired counts and adequate group denominators be supplied?", evidenceIds: ["report", "quality"],
  };
  if (finding.status === "within") return {
    headline: "No difference crosses the review threshold",
    interpretation: "This group does not fall below the remaining groups by the descriptive review threshold. This does not establish equivalence or rule out other disparities.",
    nextQuestion: "Are group definitions and reporting completeness comparable in the next period?", evidenceIds: ["report", "quality"],
  };
  return { headline: finding.status === "review" ? "A measured pathway difference warrants review" : "Keep the conclusion proportionate to the evidence",
    interpretation: finding.metric === "participation" ? "The counts locate an observed difference between invitation and screening. They do not establish why participation differs or measure cancer survival." : "The counts locate a difference between referral and recorded examination. Incomplete reporting or follow-up can resemble an access problem; waiting times are not measured.",
    nextQuestion: finding.metric === "participation" ? "Do invitation delivery, booking access or source completeness differ between the groups?" : "Have examinations occurred but not been reported, or are referrals still unresolved?", evidenceIds: ["report", "quality"] };
}

export const pct = (n: number) => `${n.toFixed(1)}%`;
export const pp = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)} pp`;
export const count = (n: number) => n.toLocaleString("en-GB");
