import type { Brief, GapFacts } from "./types";

/** Allowed absolute difference between a number in the text and a fact. */
const TOLERANCE = 0.15;

/** Matches numbers like 12, 12.5 and Finnish-style 12,5. */
const NUMBER_RE = /\d+(?:[.,]\d+)?/g;

/** Document references that contain digits but are not figures: "THL guidance 21/2016", roadmap action "3.1.2". */
const REFERENCE_RE = /\b\d{1,3}\/(?:19|20)\d{2}\b|\b\d\.\d\.\d\b|\b1[ \u00a0]000\b/g; // also Finnish "1 000"

/**
 * Numbers that may appear without being backed by facts:
 * - years 2019–2035
 * - Goal 3 sub-goal labels 3.1–3.5
 * - small integers 1–5 (list counts, "three actions" written as 3, etc.)
 */
function isExempt(raw: string, n: number): boolean {
  const isInt = /^\d+$/.test(raw);
  if (isInt && n >= 2019 && n <= 2035) return true;
  if (isInt && n >= 1 && n <= 5) return true;
  if (/^3[.,][1-5]$/.test(raw)) return true;
  if (raw === "1,000" || raw === "1000" || raw === "1 000") return true; // "per 1,000 invited"
  return false;
}

export function factNumbers(facts: GapFacts[], extra: number[] = []): number[] {
  const out: number[] = extra.filter((x) => Number.isFinite(x)).map(Math.abs);
  for (const f of facts) {
    for (const x of [f.value, f.national, f.bestQuartile, f.gapToNational, f.gapToBestQuartile, f.rank, f.rankOf, f.trend3y, f.year, f.target, f.gapToTarget]) {
      if (x !== null && Number.isFinite(x)) out.push(Math.abs(x));
    }
  }
  return out;
}

/**
 * Checks an AI-generated brief against the computed facts. Returns error messages; empty = valid.
 * Numbers are checked in headline, finding, limitations and each recommendation's action, owner, timeframe and goal.
 */
export function validateBrief(brief: Brief, facts: GapFacts[], knownSourceIds: string[], extra: number[] = []): string[] {
  const errors: string[] = [];
  const known = new Set(knownSourceIds);

  if (brief.recommendations.length !== 3) {
    errors.push(`Expected exactly 3 recommendations, got ${brief.recommendations.length}`);
  }
  brief.recommendations.forEach((r, i) => {
    if (!r.sources || r.sources.length === 0) errors.push(`Recommendation ${i + 1} has no sources`);
    for (const s of r.sources ?? []) {
      if (!known.has(s)) errors.push(`Recommendation ${i + 1} cites unknown source "${s}"`);
    }
  });

  const allowed = factNumbers(facts, extra);
  const texts: [string, string][] = [
    ["headline", brief.headline],
    ["finding", brief.finding],
    ...brief.limitations.map((l, i): [string, string] => [`limitation ${i + 1}`, l]),
    ...brief.recommendations.flatMap((r, i): [string, string][] => [
      [`recommendation ${i + 1}`, r.action],
      [`recommendation ${i + 1} owner`, r.owner],
      [`recommendation ${i + 1} timeframe`, r.timeframe],
      [`recommendation ${i + 1} goal3Indicator`, r.goal3Indicator],
    ]),
  ];
  for (const [field, text] of texts) {
    for (const raw of text.replace(REFERENCE_RE, " ").match(NUMBER_RE) ?? []) {
      const n = parseFloat(raw.replace(",", "."));
      if (isExempt(raw, n)) continue;
      if (!allowed.some((a) => Math.abs(a - n) <= TOLERANCE)) {
        errors.push(`Number ${raw} in ${field} is not supported by the facts`);
      }
    }
  }
  return errors;
}
