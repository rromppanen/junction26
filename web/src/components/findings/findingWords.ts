import { MIN_GROUP, type Finding, type GapStatus } from "@/lib/gaps";
import type { GapStatus as ChartStatus } from "@/lib/types";
import { groupPhrase } from "./groupWords";

export const ICON_STATUS: Record<GapStatus, ChartStatus> = { behind: "behind", ahead: "ahead", level: "on-par", unclear: "on-par", few: "no-data" };
export const STATUS_WORD: Record<GapStatus, string> = { behind: "Behind", ahead: "Ahead", level: "Level", unclear: "Maybe, too few to be sure", few: `Under ${MIN_GROUP} people` };

export const n0 = (v: number) => Math.round(v).toLocaleString("en-GB");
export const pct = (v: number | null) => (v === null ? "–" : `${v.toFixed(0)}%`);
export const plural = (v: number, one: string, many: string) => `${Math.abs(v).toFixed(0)} ${Math.round(Math.abs(v)) === 1 ? one : many}`;
export const pts = (v: number) => plural(v, "point", "points");
export const days = (v: number | null) => (v === null ? "–" : `${v.toFixed(0)} d`);

export function sentence(f: Finding): { lead: string; detail: string | null } {
  const { dimension: d, metric: m, group: g } = f;
  const who = groupPhrase(d.kind, d.label, g.value);
  if (m === "wait") {
    return { lead: `${who} waited ${g.gap!.toFixed(0)} days longer than everyone else (${g.figure!.toFixed(0)} vs ${g.rest!.toFixed(0)} days).`, detail: null };
  }
  const verb = m === "participation" ? "took part in screening" : "completed follow-up after a positive result";
  const more = m === "participation" ? "would have been screened" : "would have had their follow-up";
  return {
    lead: `${who} ${verb} ${pts(g.gap!)} less often than everyone else (${pct(g.figure)} vs ${pct(g.rest)}).`,
    detail: g.missing > 0 ? `About ${n0(g.missing)} more ${g.missing === 1 ? "person" : "people"} ${more} at the same rate.` : null,
  };
}

export function trend(f: Finding, firstYear: number | null, years: number[]): string | null {
  if (f.dimension.pooled[f.metric]) return `${years[0]}–${years.at(-1)} added together.`;
  const { gap, firstGap } = f.group;
  if (firstYear === null || gap === null || firstGap === null) return null;
  // Rates: a more negative gap is wider. Waits: a larger gap is wider.
  const wider = f.metric === "wait" ? gap - firstGap : firstGap - gap;
  // Year-to-year noise in an aggregate file is easily a point or two.
  if (Math.abs(wider) < 2) return `About the same as in ${firstYear}.`;
  return `${wider > 0 ? "Wider" : "Narrower"} by ${f.metric === "wait" ? plural(wider, "day", "days") : pts(wider)} since ${firstYear}.`;
}

