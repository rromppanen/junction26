import { describe, expect, it, vi } from "vitest";
import { groundingErrors, municipalityErrors, quotableTexts, readCritique, reviewLoop, toBrief, type Critique, type DraftBrief, type DraftRecommendation, type ReviewDeps } from "./review";

const texts = quotableTexts([{ id: "live:1", title: "Seulonnat", url: "https://x.fi", text: "Hyvinvointialue lähettää seulontakutsut kirjeitse." }]);

// Verbatim from roadmap-p10-socioeconomic.summaryEn.
const goodQuote = "Immigrants participate less in cancer screening";

const rec = (over: Partial<DraftRecommendation> = {}): DraftRecommendation => ({
  action: "Send screening invitations in the most common foreign languages to residents of Siuntio and track attendance yearly.",
  owner: "Wellbeing services county screening services",
  timeframe: "Q1–Q2 2027",
  goal3Indicator: "Goal 2: 80% screening participation",
  sources: ["roadmap-p10-socioeconomic", "sotkanet:1"],
  basis: [{ sourceId: "roadmap-p10-socioeconomic", quote: goodQuote }],
  ...over,
});

const draft = (recs: DraftRecommendation[] = [rec(), rec(), rec()]): DraftBrief => ({
  headline: "h", finding: "f", pathwayStage: "detection", limitations: [], recommendations: recs,
});

const ok = { claim: "Immigrants participate less in screening", checkedAgainst: "roadmap-p10-socioeconomic", holds: true };

const approveAll = (d: DraftBrief): Critique => ({
  verdicts: d.recommendations.map((r, i) => ({ index: i + 1, claims: [ok], verdict: "approve", supportingSourceIds: [r.sources[0]], issues: [] })),
});

describe("groundingErrors", () => {
  it("accepts a verbatim quote, ignoring case, spacing and dash style", () => {
    expect(groundingErrors([rec()], texts)).toEqual([]);
    expect(groundingErrors([rec({ basis: [{ sourceId: "roadmap-p10-socioeconomic", quote: "  IMMIGRANTS participate   less in cancer screening " }] })], texts)).toEqual([]);
  });

  it("rejects a paraphrased or invented quote", () => {
    const e = groundingErrors([rec({ basis: [{ sourceId: "roadmap-p10-socioeconomic", quote: "Immigrants attend screening much less often" }] })], texts);
    expect(e.join()).toMatch(/does not appear word for word/);
  });

  it("rejects a quote from a source the recommendation does not cite", () => {
    const e = groundingErrors([rec({ basis: [{ sourceId: "strategy-p33-3.1", quote: "national treatment recommendations and care pathways" }] })], texts);
    expect(e.join()).toMatch(/does not list it in sources/);
  });

  it("does not let web text alone carry a recommendation", () => {
    const e = groundingErrors([rec({ sources: ["live:1"], basis: [{ sourceId: "live:1", quote: "lähettää seulontakutsut kirjeitse" }] })], texts);
    expect(e.join()).toMatch(/at least one verified quote from the national strategy/);
  });

  it("rejects quotes of data ids, short quotes and missing basis", () => {
    expect(groundingErrors([rec({ basis: [{ sourceId: "sotkanet:1", quote: "breast screening participation" }] })], texts).join()).toMatch(/no text to quote/);
    expect(groundingErrors([rec({ basis: [{ sourceId: "roadmap-p10-socioeconomic", quote: "Immigrants" }] })], texts).join()).toMatch(/shorter than/);
    expect(groundingErrors([rec({ basis: [] })], texts).join()).toMatch(/no basis quotes/);
  });

  it("requires a timeframe year inside 2027–2035", () => {
    expect(groundingErrors([rec({ timeframe: "within 6 months" })], texts).join()).toMatch(/names no year/);
    expect(groundingErrors([rec({ timeframe: "Q4 2026" })], texts).join()).toMatch(/within 2027–2035/);
  });
});

describe("municipalityErrors", () => {
  const names = ["Vaala", "Muhos", "Oulu", "Ii"];
  const lagging = [{ indicatorId: 1, names: ["Vaala", "Muhos"] }];

  it("allows a municipality listed behind on a measure the recommendation cites", () => {
    expect(municipalityErrors([rec({ action: "Remind residents of Vaala and Muhos", sources: ["sotkanet:1"] })], names, lagging)).toEqual([]);
  });

  it("matches Finnish inflected forms", () => {
    expect(municipalityErrors([rec({ action: "Muistutukset Vaalassa", sources: ["sotkanet:1"] })], names, lagging)).toEqual([]);
    expect(municipalityErrors([rec({ action: "Muistutukset Oulussa", sources: ["sotkanet:1"] })], names, lagging).join()).toMatch(/names Oulu/);
  });

  it("rejects a place not shown behind, or behind only on a measure the recommendation does not cite", () => {
    expect(municipalityErrors([rec({ action: "Campaign in Oulu", sources: ["sotkanet:1"] })], names, lagging).join()).toMatch(/names Oulu/);
    expect(municipalityErrors([rec({ action: "Campaign in Vaala", sources: ["sotkanet:2"] })], names, lagging).join()).toMatch(/names Vaala/);
  });

  it("does not match a short name inside another word", () => {
    expect(municipalityErrors([rec({ action: "Iitti-style reminders", sources: ["sotkanet:1"] })], ["Ii"], lagging)).toEqual([]);
  });
});

describe("readCritique", () => {
  it("approves only when every recommendation is approved with its own sources and no issues", () => {
    const d = draft();
    expect(readCritique(approveAll(d), d.recommendations)).toEqual({ approved: true, feedback: [] });
  });

  it("treats a missing verdict, an approval with issues, or unsupported approval as rejection", () => {
    const d = draft();
    const c: Critique = {
      verdicts: [
        { index: 1, claims: [ok], verdict: "approve", supportingSourceIds: ["roadmap-p10-socioeconomic"], issues: [{ rule: "OVERREACH", excerpt: "x", problem: "p" }] },
        { index: 2, claims: [ok], verdict: "approve", supportingSourceIds: ["strategy-p33-3.1"], issues: [] }, // not among its sources
      ],
    };
    const r = readCritique(c, d.recommendations);
    expect(r.approved).toBe(false);
    expect(r.feedback.join("\n")).toMatch(/Recommendation 1 \[OVERREACH\]/);
    expect(r.feedback.join("\n")).toMatch(/Recommendation 2: the approval did not name supporting sources/);
    expect(r.feedback.join("\n")).toMatch(/Recommendation 3: the reviewer gave no verdict/);
  });

  it("rejects an approval whose claims do not all hold, or that checked no claim", () => {
    const d = draft([rec(), rec()]);
    const c: Critique = { verdicts: [
      { index: 1, claims: [ok, { claim: "Vaala is above the 80% target", checkedAgainst: "EQUITY breast-screening", holds: false }], verdict: "approve", supportingSourceIds: ["roadmap-p10-socioeconomic"], issues: [] },
      { index: 2, claims: [], verdict: "approve", supportingSourceIds: ["roadmap-p10-socioeconomic"], issues: [] },
    ] };
    const r = readCritique(c, d.recommendations);
    expect(r.approved).toBe(false);
    expect(r.feedback.join("\n")).toMatch(/Recommendation 1: the claim "Vaala is above the 80% target" does not hold/);
    expect(r.feedback.join("\n")).toMatch(/Recommendation 2: the reviewer approved without checking any claim/);
  });

  it("repeats only excerpts that are really in the recommendation", () => {
    const d = draft([rec()]);
    const c: Critique = { verdicts: [{ index: 1, claims: [], verdict: "reject", supportingSourceIds: [], issues: [
      { rule: "SUPPORT", excerpt: "residents of Siuntio", problem: "real" },
      { rule: "SUPPORT", excerpt: "made-up phrase", problem: "invented" },
    ] }] };
    const fb = readCritique(c, d.recommendations).feedback;
    expect(fb[0]).toMatch(/about: "residents of Siuntio"/);
    expect(fb[1]).not.toMatch(/about:/);
  });
});

describe("reviewLoop", () => {
  const check = (d: DraftBrief) => groundingErrors(d.recommendations, texts);

  it("returns the first draft the reviewer fully approves", async () => {
    const critique = vi.fn(async (d: DraftBrief) => approveAll(d));
    const out = await reviewLoop({ draft: async () => draft(), check, critique });
    expect(out.draft).not.toBeNull();
    expect(out.rounds).toHaveLength(1);
    expect(critique).toHaveBeenCalledTimes(1);
  });

  it("never sends a draft that fails the code checks to the reviewer, and passes the errors back", async () => {
    const bad = draft([rec({ basis: [{ sourceId: "roadmap-p10-socioeconomic", quote: "an invented sentence of evidence" }] })]);
    const drafts = [bad, draft()];
    const draftFn = vi.fn<ReviewDeps["draft"]>(async () => drafts.shift() as DraftBrief);
    const critique = vi.fn(async (d: DraftBrief) => approveAll(d));
    const out = await reviewLoop({ draft: draftFn, check, critique });
    expect(critique).toHaveBeenCalledTimes(1);
    expect(draftFn.mock.calls[1][0].join()).toMatch(/does not appear word for word/);
    expect(draftFn.mock.calls[1][1]).toBe(bad);
    expect(out.draft).not.toBeNull();
  });

  it("revises with the reviewer's objections and fails closed when approval never comes", async () => {
    const reject: Critique = { verdicts: [1, 2, 3].map((index) => ({ index, claims: [], verdict: "reject" as const, supportingSourceIds: [], issues: [{ rule: "SUPPORT", excerpt: "", problem: "not supported" }] })) };
    const draftFn = vi.fn<ReviewDeps["draft"]>(async () => draft());
    const out = await reviewLoop({ draft: draftFn, check, critique: async () => reject, maxRounds: 3 });
    expect(out.draft).toBeNull();
    expect(out.rounds).toHaveLength(3);
    expect(draftFn.mock.calls[1][0].join()).toMatch(/\[SUPPORT\]: not supported/);
  });

  it("propagates reviewer errors so the caller falls back", async () => {
    await expect(reviewLoop({ draft: async () => draft(), check, critique: async () => { throw new Error("timeout"); } })).rejects.toThrow("timeout");
  });
});

describe("toBrief", () => {
  it("strips the basis so the result matches the Brief contract", () => {
    const b = toBrief(draft());
    expect(b.generatedBy).toBe("gemini");
    expect(Object.keys(b.recommendations[0]).sort()).toEqual(["action", "goal3Indicator", "owner", "sources", "timeframe"]);
  });
});
