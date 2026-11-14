import { analyse as compare, Metric } from "../analysis";
import { goal3Outcome } from "../goal3";
import type { Findings, LocatedFinding, PreparedData } from "./types";

export function analyseDataset(dataset: PreparedData): Findings {
  const slices = new Map<string, { dimension: string; cohort: string; year: number }>();
  for (const row of dataset.rows) {
    const key = JSON.stringify([row.dimension, row.cohort]);
    if (!slices.has(key) || slices.get(key)!.year < row.year) slices.set(key, { dimension: row.dimension, cohort: row.cohort, year: row.year });
  }
  const all: LocatedFinding[] = [];
  for (const slice of slices.values()) {
    const paired = dataset.rows.some(row => row.year === slice.year && row.dimension === slice.dimension && row.cohort === slice.cohort && row.referred !== null);
    const metrics: Metric[] = paired ? ["participation", "followup"] : ["participation"];
    for (const metric of metrics) for (const finding of compare(dataset.rows, slice.year, slice.dimension, slice.cohort, metric)) {
      all.push({ ...finding, id: `finding:${all.length + 1}`, stage: metric === "participation" ? "Invitation → screening" : "Referral → recorded examination",
        ...(slice.dimension === "Region" ? { outcome: goal3Outcome(finding.row.group, slice.year) } : {}) });
    }
  }
  all.sort((a, b) => (a.status === "review" ? 0 : a.status === "within" ? 1 : 2) - (b.status === "review" ? 0 : b.status === "within" ? 1 : 2) || (a.gap ?? Infinity) - (b.gap ?? Infinity));
  const focus: LocatedFinding[] = [];
  const candidates = all.some(finding => finding.status === "review") ? all.filter(finding => finding.status === "review") : all;
  for (const finding of candidates) {
    if (focus.some(existing => existing.row.dimension === finding.row.dimension)) continue;
    focus.push(finding);
    if (focus.length === 3) break;
  }
  if (!focus.length && all.length) focus.push(all[0]);
  return { all, focus, periods: [...slices.values()].map(slice => `${slice.dimension} · ${slice.cohort} · ${slice.year}`) };
}
