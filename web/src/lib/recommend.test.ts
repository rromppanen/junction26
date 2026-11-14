import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDraft, grade, policySources, programmeOf, queriesFor, runAgent, type AgentEvent, type GapBrief, type Source } from "./recommend";
import { parseGapBrief } from "./recommendInput";

const brief: GapBrief = {
  who: "Speakers of other languages", kind: "language", kindLabel: "Language", metric: "participation", metricLabel: "Took part in screening",
  figure: 43.1, rest: 70.2, gap: -27.1, n: 540, impact: 145, span: "2024", trend: "Wider by 6 points since 2022.",
  group: { invited: 540, attended: 233, positive: 10, examined: 9, waitDays: 31 },
  others: { invited: 17000, attended: 11934, positive: 600, examined: 530, waitDays: 25 },
  place: "Pohjois-Karjala", source: "suolistoseulonta_pkarjala_2022-2024.csv",
};
const src = (id: string, strength: Source["strength"], excerpt = "Reminders increased participation."): Source =>
  ({ id, title: "t", url: "https://pubmed.ncbi.nlm.nih.gov/1", publisher: "x", excerpt, strength, kind: "k" });
const good = (sources: string[], action = "Send translated invitations and a reminder.") => ({
  title: "Translate the invitation", action, why: "43.1% took part against 70.2%.", firstStep: "Pick the three most common languages.",
  owner: "Screening programme lead", measure: "Participation among speakers of other languages each quarter.",
  sources: sources.map((id) => ({ id, says: "Reminders increased participation." })),
});

afterEach(() => vi.restoreAllMocks());

describe("grading sources", () => {
  it("grades by publisher and study type, and drops sources outside the quality lists", () => {
    expect(grade("https://www.cochranelibrary.com/cdsr/x", "Interventions", "")?.strength).toBe("strong");
    expect(grade("https://pubmed.ncbi.nlm.nih.gov/123", "A systematic review of reminders", "")).toEqual({ strength: "strong", kind: "Systematic review" });
    expect(grade("https://pubmed.ncbi.nlm.nih.gov/123", "Mailed outreach: a randomized trial", "")).toEqual({ strength: "moderate", kind: "Randomised trial" });
    expect(grade("https://thl.fi/fi/x", "Seulonnat", "")?.strength).toBe("supporting");
    expect(grade("https://someblog.example.com/post", "Systematic review", "")).toBeNull();
  });
  it("searches for the programme and the group", () => {
    expect(programmeOf("suolistoseulonta.csv").en).toBe("colorectal cancer screening");
    const q = queriesFor(brief);
    expect(q[0].query).toContain("immigrants and language minorities");
    expect(q[0].domains).toContain("cochranelibrary.com");
    expect(q.at(-1)!.domains).toContain("thl.fi");
  });
});

describe("checking a draft", () => {
  const sources = [src("src:1", "strong"), src("src:2", "moderate", "Participation rose from 40% to 52%."), ...policySources()];
  it("accepts a draft that cites known sources and uses only the gap's numbers", () => {
    const r = checkDraft({ recommendations: [good(["src:1"]), good(["src:2"]), good(["src:1", "roadmap-p10-socioeconomic"])] }, brief, sources);
    expect("ok" in r).toBe(true);
  });
  it("rejects unknown sources, invented numbers, and actions resting only on policy", () => {
    const r = checkDraft({ recommendations: [good(["src:9"]), good(["src:1"], "This raises participation by 15 points."), good(["roadmap-p10-socioeconomic"])] }, brief, sources);
    expect("errors" in r && r.errors.join(" ")).toMatch(/unknown source "src:9"/);
    expect("errors" in r && r.errors.join(" ")).toMatch(/number 15 in action/);
    expect("errors" in r && r.errors.join(" ")).toMatch(/only on policy/);
  });
  it("lets a recommendation quote a number from a source it cites, but not from one it doesn't", () => {
    const quoting = good(["src:2"], "A trial saw participation rise from 40% to 52%.");
    expect("ok" in checkDraft({ recommendations: [quoting, good(["src:1"]), good(["src:1"])] }, brief, sources)).toBe(true);
    const borrowing = good(["src:1"], "A trial saw participation rise from 40% to 52%.");
    expect("errors" in checkDraft({ recommendations: [borrowing, good(["src:1"]), good(["src:1"])] }, brief, sources)).toBe(true);
  });
});

describe("the agent", () => {
  const run = async (draft: Parameters<typeof runAgent>[2]) => {
    const events: AgentEvent[] = [];
    await runAgent(brief, (e) => events.push(e), draft, undefined);
    const result = events.find((e) => e.type === "result");
    return { events, result: result?.type === "result" ? result.result : null };
  };

  it("without a search key or a working AI, still returns three safe recommendations from the strategy", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { events, result } = await run(async () => { throw new Error("no key"); });
    expect(events.filter((e) => e.type === "step").map((e) => e.type === "step" && `${e.step}:${e.state}`)).toEqual(
      ["read:done", "search:running", "search:skipped", "draft:running", "draft:done", "check:running", "check:done"],
    );
    expect(result!.status).toBe("fallback");
    expect(result!.recommendations).toHaveLength(3);
    expect(result!.recommendations.every((r) => r.strength === "policy")).toBe(true);
    expect(result!.notes.join(" ")).toMatch(/Context\.dev/);
  });

  it("asks once more with the problems when the first draft fails the checks", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const prompts: string[] = [];
    const draft = async (prompt: string) => {
      prompts.push(prompt);
      return prompts.length === 1
        ? { recommendations: [good(["nope"]), good(["strategy-goal2-screening-80"]), good(["roadmap-p10-socioeconomic"])] }
        : { recommendations: [good(["strategy-goal2-screening-80"]), good(["roadmap-p10-socioeconomic"]), good(["strategy-p35-3.2"])] };
    };
    const { result } = await run(draft);
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain('unknown source "nope"');
    expect(result!.status).toBe("ai");
  });
});

describe("request body", () => {
  it("accepts a gap brief and rejects anything else", () => {
    expect(parseGapBrief(brief)).toEqual(brief);
    expect(parseGapBrief({ ...brief, figure: "43" })).toMatch(/figure/);
    expect(parseGapBrief({ ...brief, kind: "zzz" })).toMatch(/kind/);
    expect(parseGapBrief({ ...brief, who: "x".repeat(500) })).toMatch(/who/);
  });
});
