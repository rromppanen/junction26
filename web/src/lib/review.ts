import { EVIDENCE } from "@/data/evidence";
import type { Brief, Recommendation } from "./types";
import type { LiveSnippet } from "./context";

/**
 * Two-agent review of AI-written recommendations.
 *
 * A drafter proposes the brief and, for every recommendation, verbatim quotes from the sources it relies on.
 * Code checks the numbers, the source ids and that every quote really appears in its source. Only then does a
 * separate reviewer judge each recommendation strictly against the evidence. Any doubt is a rejection, the
 * drafter revises with the reviewer's objections, and a brief that is still not fully approved after the last
 * round is not shown: the caller falls back to the hand-written templates. Every failure path fails closed.
 */

export type BasisQuote = { sourceId: string; quote: string };
export type DraftRecommendation = Recommendation & { basis: BasisQuote[] };
export type DraftBrief = Omit<Brief, "recommendations" | "generatedBy"> & { recommendations: DraftRecommendation[] };

export type CritiqueIssue = { rule: string; excerpt: string; problem: string };
/** One factual claim the reviewer found in a recommendation, where it checked it, and whether it holds. */
export type CheckedClaim = { claim: string; checkedAgainst: string; holds: boolean };
export type CritiqueVerdict = {
  index: number; // 1-based recommendation number
  claims: CheckedClaim[];
  verdict: "approve" | "reject";
  supportingSourceIds: string[];
  issues: CritiqueIssue[];
};
export type Critique = { verdicts: CritiqueVerdict[] };

/** Shortest quote accepted as a basis, after normalising. Shorter strings match almost anywhere. */
export const MIN_QUOTE_LENGTH = 20;
/** Recommendations are for the strategy period; the county cannot start anything in the past. */
const FIRST_YEAR = 2027;
const LAST_YEAR = 2035;

const EVIDENCE_IDS = new Set(EVIDENCE.map((e) => e.id));

/** Lower-case, unify dashes and quotes, collapse whitespace, so a faithful copy matches despite typography. */
export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Texts a basis quote may come from, per source id. Sotkanet ids are data, not text, so they cannot be quoted. */
export function quotableTexts(live: LiveSnippet[] = [], peer: LiveSnippet[] = []): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of EVIDENCE) m.set(e.id, [e.titleEn, e.summaryEn, e.quoteFi]);
  for (const s of [...live, ...peer]) m.set(s.id, [s.title, s.text]);
  return m;
}

/**
 * Deterministic grounding checks on each recommendation. Empty = grounded.
 * - every basis quote is from a listed source and appears verbatim in that source's text;
 * - at least one verified quote comes from the national strategy or roadmap, so no action rests on web text alone;
 * - the timeframe names a year inside the strategy period, none in the past.
 */
export function groundingErrors(recs: DraftRecommendation[], texts: Map<string, string[]>): string[] {
  const errors: string[] = [];
  recs.forEach((r, i) => {
    const n = i + 1;
    const basis = Array.isArray(r.basis) ? r.basis : [];
    if (basis.length === 0) errors.push(`Recommendation ${n} has no basis quotes`);
    let anchored = false;
    for (const b of basis) {
      if (!r.sources?.includes(b.sourceId)) {
        errors.push(`Recommendation ${n} quotes "${b.sourceId}" but does not list it in sources`);
        continue;
      }
      const candidates = texts.get(b.sourceId);
      if (!candidates) {
        errors.push(`Recommendation ${n} quotes "${b.sourceId}", which has no text to quote (only EVIDENCE, LIVE_CONTEXT and PEER_CONTEXT ids can be quoted)`);
        continue;
      }
      const q = normalize(b.quote ?? "");
      if (q.length < MIN_QUOTE_LENGTH) {
        errors.push(`Recommendation ${n}: the quote from "${b.sourceId}" is shorter than ${MIN_QUOTE_LENGTH} characters`);
        continue;
      }
      if (!candidates.some((t) => normalize(t).includes(q))) {
        errors.push(`Recommendation ${n}: the quote from "${b.sourceId}" does not appear word for word in that source: "${b.quote}"`);
        continue;
      }
      if (EVIDENCE_IDS.has(b.sourceId)) anchored = true;
    }
    if (basis.length > 0 && !anchored) {
      errors.push(`Recommendation ${n} needs at least one verified quote from the national strategy or roadmap (an EVIDENCE id)`);
    }
    const years = (r.timeframe ?? "").match(/\b20\d{2}\b/g)?.map(Number) ?? [];
    if (years.length === 0) errors.push(`Recommendation ${n} timeframe "${r.timeframe}" names no year`);
    else if (years.some((y) => y < FIRST_YEAR || y > LAST_YEAR)) {
      errors.push(`Recommendation ${n} timeframe "${r.timeframe}" must lie within ${FIRST_YEAR}–${LAST_YEAR}`);
    }
  });
  return errors;
}

/**
 * Municipalities a recommendation may name: those listed behind the county on a measure the recommendation cites
 * as `sotkanet:<id>`. Naming any other municipality of the county is an error, so a place is never singled out
 * on data that does not show it behind. Inflected Finnish forms ("Vaalassa") are matched by the name's stem,
 * except for names under 5 letters, which match as a whole word or with a Finnish case ending.
 */
const CASE_ENDINGS = "n|ssa|ssä|sta|stä|lla|llä|lta|ltä|lle|ksi|na|nä|a|ä|hin|on|in|seen";

export function municipalityErrors(
  recs: Recommendation[],
  municipalityNames: string[],
  lagging: { indicatorId: number; names: string[] }[],
): string[] {
  const errors: string[] = [];
  const mentions = (text: string, name: string) => {
    // Long names: match the stem, so inflected forms count. Short names ("Ii", "Oulu"): the whole word or the word
    // plus a Finnish case ending ("Oulussa", "Iin"), so "Iitti" does not count as "Ii".
    const long = name.length >= 5;
    const esc = (long ? name.slice(0, -1) : name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tail = long ? "" : `(?:${CASE_ENDINGS})?(?!\\p{L})`;
    return new RegExp(`(?<!\\p{L})${esc}${tail}`, "u").test(text);
  };
  recs.forEach((r, i) => {
    const text = [r.action, r.owner, r.goal3Indicator].join(" ");
    const cited = new Set(r.sources ?? []);
    const allowed = new Set(lagging.filter((l) => cited.has(`sotkanet:${l.indicatorId}`)).flatMap((l) => l.names));
    for (const name of municipalityNames) {
      if (mentions(text, name) && !allowed.has(name)) {
        errors.push(`Recommendation ${i + 1} names ${name}, which EQUITY does not list as behind the county on a measure this recommendation cites (cite the sotkanet id of that measure, or do not name ${name})`);
      }
    }
  });
  return errors;
}

/**
 * Reads the reviewer's verdicts strictly. A recommendation counts as approved only when the reviewer approved it,
 * checked at least one claim and found every claim to hold, raised no issue about it, and named supporting sources
 * that the recommendation itself cites. Anything else is a rejection.
 */
export function readCritique(c: Critique, recs: DraftRecommendation[]): { approved: boolean; feedback: string[] } {
  const feedback: string[] = [];
  recs.forEach((r, i) => {
    const n = i + 1;
    const v = c.verdicts?.find((x) => x.index === n);
    if (!v) {
      feedback.push(`Recommendation ${n}: the reviewer gave no verdict`);
      return;
    }
    const text = normalize([r.action, r.owner, r.timeframe, r.goal3Indicator].join(" "));
    const claims = Array.isArray(v.claims) ? v.claims : [];
    for (const c of claims) {
      if (c.holds !== true) feedback.push(`Recommendation ${n}: the claim "${c.claim}" does not hold against ${c.checkedAgainst}`);
    }
    const issues = Array.isArray(v.issues) ? v.issues : [];
    for (const is of issues) {
      // Only repeat an excerpt that really is in the recommendation, so revisions are not steered by invented text.
      const ex = is.excerpt && text.includes(normalize(is.excerpt)) ? ` (about: "${is.excerpt}")` : "";
      feedback.push(`Recommendation ${n} [${is.rule}]: ${is.problem}${ex}`);
    }
    if (v.verdict !== "approve") {
      if (issues.length === 0) feedback.push(`Recommendation ${n}: rejected by the reviewer without a stated reason`);
      return;
    }
    if (claims.length === 0) feedback.push(`Recommendation ${n}: the reviewer approved without checking any claim`);
    const support = Array.isArray(v.supportingSourceIds) ? v.supportingSourceIds : [];
    if (support.length === 0 || support.some((s) => !r.sources?.includes(s))) {
      feedback.push(`Recommendation ${n}: the approval did not name supporting sources from the recommendation's own sources`);
    }
  });
  return { approved: feedback.length === 0, feedback };
}

export type ReviewRound = { round: number; checkErrors: string[]; critique?: Critique; feedback: string[] };

export type ReviewDeps = {
  /** Writes a draft. `feedback` is empty on the first round, then holds the objections to `previous`. */
  draft: (feedback: string[], previous?: DraftBrief) => Promise<DraftBrief>;
  /** Code checks (numbers, source ids, grounding). Empty = passed. */
  check: (draft: DraftBrief) => string[];
  /** The independent reviewer. */
  critique: (draft: DraftBrief) => Promise<Critique>;
  maxRounds?: number;
  /** Called after each round, so callers keep the trail even when a later call throws. */
  onRound?: (r: ReviewRound) => void;
};

export const MAX_ROUNDS = 3;

/**
 * Draft → code checks → reviewer, repeated until the reviewer approves every recommendation or the rounds run out.
 * Returns the approved draft, or null when none was approved. Errors from either agent propagate to the caller.
 */
export async function reviewLoop(deps: ReviewDeps): Promise<{ draft: DraftBrief | null; rounds: ReviewRound[] }> {
  const rounds: ReviewRound[] = [];
  let feedback: string[] = [];
  let previous: DraftBrief | undefined;
  for (let round = 1; round <= (deps.maxRounds ?? MAX_ROUNDS); round++) {
    const d = await deps.draft(feedback, previous);
    previous = d;
    const checkErrors = deps.check(d);
    if (checkErrors.length) {
      // The reviewer never sees a draft that fails the code checks.
      const r: ReviewRound = { round, checkErrors, feedback: checkErrors };
      rounds.push(r);
      deps.onRound?.(r);
      feedback = checkErrors;
      continue;
    }
    const critique = await deps.critique(d);
    const verdict = readCritique(critique, d.recommendations);
    const r: ReviewRound = { round, checkErrors, critique, feedback: verdict.feedback };
    rounds.push(r);
    deps.onRound?.(r);
    if (verdict.approved) return { draft: d, rounds };
    feedback = verdict.feedback;
  }
  return { draft: null, rounds };
}

/** Drops the review-only fields so the result matches the shared Brief contract. */
export function toBrief(d: DraftBrief): Brief {
  return {
    ...d,
    recommendations: d.recommendations.map((r) => ({
      action: r.action,
      owner: r.owner,
      timeframe: r.timeframe,
      goal3Indicator: r.goal3Indicator,
      sources: r.sources,
    })),
    generatedBy: "gemini",
  };
}
