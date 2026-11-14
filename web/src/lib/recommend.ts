// Server-only: calls Context.dev (CONTEXT_DEV_API_KEY) and Gemini (GEMINI_API_KEY). Do not import from client code.
import { GoogleGenAI, Type } from "@google/genai";
import { EVIDENCE } from "@/data/evidence";
import type { GroupKind } from "./intake/fields";
import type { MetricId, Steps } from "./gaps";
import { MIN_QUOTE_LENGTH, normalize } from "./review";
import { numbersIn, unsupportedNumbers } from "./validate";

/**
 * Recommendations for one gap. An agent in four visible steps:
 * 1. read the gap (aggregate numbers only; no rows of the file ever leave the browser),
 * 2. search quality sources (systematic reviews, guidelines, peer-reviewed studies, national agencies),
 * 3. draft the most actionable, best-evidenced recommendations with Gemini, citing only what was found and
 *    quoting each source word for word,
 * 4. check every source id, quote and number in code, then 5. have a separate reviewer agent judge each
 *    recommendation strictly against its quotes. Any problem sends the drafter back with the objections; if no
 *    draft is approved within the rounds, safe templates are shown instead (fails closed, like lib/review.ts).
 * Evidence strength is graded by code from where each source comes from, never by the model.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const SEARCH_ENDPOINT = "https://api.context.dev/v1/web/search";
const SEARCH_TIMEOUT_MS = 10_000;
const DRAFT_TIMEOUT_MS = 40_000;
const PER_QUERY = 6;
const MAX_SOURCES = 10;
const MAX_EXCERPT = 700;
/** The first draft, then up to two corrected drafts that are told exactly what failed. */
const ATTEMPTS = 3;

/* ---------- What the client sends: one gap, as aggregate numbers ---------- */

export type GapBrief = {
  who: string; // "Speakers of other languages"
  kind: GroupKind;
  kindLabel: string; // "Language"
  metric: MetricId;
  metricLabel: string; // "Took part in screening"
  figure: number;
  rest: number;
  gap: number;
  n: number;
  impact: number;
  span: string; // "2024" or "2022–2024"
  trend: string | null; // "Wider by 6 points since 2022."
  group: Steps;
  others: Steps;
  place: string | null; // "Pohjois-Karjala"
  source: string; // file name or the public source
};

/* ---------- Sources and how strong their evidence is ---------- */

export type Strength = "strong" | "moderate" | "supporting" | "policy";
export type Source = { id: string; title: string; url: string; publisher: string; excerpt: string; strength: Strength; kind: string };

/** Systematic reviews and guideline bodies. */
const STRONG = ["cochranelibrary.com", "thecommunityguide.org", "who.int", "nice.org.uk", "uspreventiveservicestaskforce.org", "kaypahoito.fi", "europa.eu"];
/** Peer-reviewed journals and indexes. */
const PEER = [
  "ncbi.nlm.nih.gov", "bmj.com", "thelancet.com", "jamanetwork.com", "nejm.org", "nature.com", "springer.com", "wiley.com",
  "sciencedirect.com", "tandfonline.com", "sagepub.com", "plos.org", "biomedcentral.com", "academic.oup.com", "cambridge.org",
  "aacrjournals.org", "gastrojournal.org", "annals.org", "frontiersin.org",
];
/** National agencies, registries and professional bodies. */
const AGENCY = [
  "thl.fi", "julkari.fi", "stm.fi", "syopajarjestot.fi", "cancerregistry.fi", "duodecimlehti.fi", "terveyskirjasto.fi",
  "valtioneuvosto.fi", "cancer.gov", "cdc.gov", "nhs.uk", "gov.uk", "socialstyrelsen.se", "cancercentrum.se", "kreftregisteret.no",
  "helsedirektoratet.no", "sundhedsstyrelsen.dk",
];
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const within = (h: string, list: string[]) => list.some((d) => h === d || h.endsWith(`.${d}`));

/** Strength from where the source is published and what kind of study it says it is. */
export function grade(url: string, title: string, excerpt: string): { strength: Strength; kind: string } | null {
  const h = host(url);
  const text = `${title} ${excerpt}`.toLowerCase();
  const review = /systematic review|meta-analys|umbrella review|cochrane/.test(text);
  const guideline = /guideline|recommendation statement|käypä hoito|suositus/.test(text);
  const trial = /randomi[sz]ed|controlled trial|rct\b/.test(text);
  if (within(h, STRONG)) return { strength: "strong", kind: review ? "Systematic review" : guideline ? "Guideline" : "Guideline body" };
  if (within(h, PEER)) {
    if (review) return { strength: "strong", kind: "Systematic review" };
    return { strength: "moderate", kind: trial ? "Randomised trial" : "Peer-reviewed study" };
  }
  if (within(h, AGENCY)) return { strength: "supporting", kind: "National agency or report" };
  return null; // not a source we cite
}

/* ---------- Step 2: searching ---------- */

const PROGRAMME: { re: RegExp; en: string; fi: string }[] = [
  { re: /suolist|kolono|colorect|bowel|fit\b|colonoscop/i, en: "colorectal cancer screening", fi: "suolistosyövän seulonta" },
  { re: /rinta|mammo|breast/i, en: "breast cancer screening mammography", fi: "rintasyövän seulonta" },
  { re: /kohdunkaula|cervical|papa|hpv/i, en: "cervical cancer screening", fi: "kohdunkaulansyövän seulonta" },
];

export function programmeOf(source: string): { en: string; fi: string } {
  return PROGRAMME.find((p) => p.re.test(source)) ?? { en: "cancer screening", fi: "syöpäseulonta" };
}

const WHO_EN: Partial<Record<GroupKind, string>> = {
  language: "immigrants and language minorities",
  nationality: "immigrants and foreign-born populations",
  birthCountry: "immigrants and foreign-born populations",
  migrantBackground: "immigrants and ethnic minorities",
  sex: "men",
  age: "younger first-time invitees",
  region: "rural and remote areas",
  education: "people with low education and socioeconomic status",
  income: "low-income populations",
};

/** English queries go to reviews and journals; one Finnish query goes to Finnish agencies. */
export function queriesFor(b: GapBrief): { query: string; domains: string[] }[] {
  const prog = programmeOf(b.source);
  const who = b.kind === "sex" ? (/men$|^men/i.test(b.who) ? "men" : "women") : (WHO_EN[b.kind] ?? b.who.toLowerCase());
  const international = [...STRONG, ...PEER];
  if (b.metric === "followUp") {
    return [
      { query: `interventions to increase follow-up after abnormal ${prog.en} result systematic review`, domains: international },
      { query: `patient navigation follow-up after positive ${prog.en} ${who}`, domains: international },
      { query: `${prog.fi} jatkotutkimus positiivinen tulos osallistuminen`, domains: AGENCY },
    ];
  }
  if (b.metric === "wait") {
    return [
      { query: `reducing waiting time to diagnostic follow-up after positive ${prog.en}`, domains: international },
      { query: `${prog.en} quality indicator time to follow-up examination`, domains: international },
      { query: `${prog.fi} jatkotutkimus odotusaika`, domains: AGENCY },
    ];
  }
  return [
    { query: `interventions to increase ${prog.en} participation among ${who} systematic review`, domains: international },
    { query: `${prog.en} participation ${who} randomized trial invitation reminder outreach`, domains: international },
    { query: `${prog.fi} osallistuminen ${b.kind === "region" ? "alueelliset erot" : b.kindLabel.toLowerCase()} keinot`, domains: AGENCY },
  ];
}

type SearchResult = { url?: string; title?: string; description?: string; highlights?: { highlights?: string[] | string | null; code?: string } };

/** One Context.dev search; never throws. */
async function search(query: string, domains: string[], apiKey: string): Promise<{ title: string; url: string; excerpt: string }[]> {
  try {
    const res = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        numResults: PER_QUERY,
        includeDomains: domains,
        highlightsOptions: { enabled: true, maxCharacters: MAX_EXCERPT },
        timeoutOpts: { milliseconds: SEARCH_TIMEOUT_MS, behavior: "return-partial" },
        tags: ["gap-radar", "recommendations"],
      }),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS + 3_000),
    });
    if (!res.ok) throw new Error(`Context.dev ${res.status}`);
    const body = (await res.json()) as { results?: SearchResult[] };
    return (body.results ?? []).flatMap((r) => {
      if (!r?.url || !/^https?:\/\//.test(r.url)) return [];
      const h = r.highlights;
      const hl = h?.code === "SUCCESS" ? (Array.isArray(h.highlights) ? h.highlights.join(" … ") : h.highlights) : null;
      const excerpt = (hl || r.description || "").replace(/\s+/g, " ").trim().slice(0, MAX_EXCERPT);
      return excerpt ? [{ title: (r.title || r.url).replace(/\s+/g, " ").trim().slice(0, 200), url: r.url, excerpt }] : [];
    });
  } catch (e) {
    console.warn("[recommend] search failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Searches, keeps only graded sources, removes duplicates, strongest first. */
export async function findSources(b: GapBrief, apiKey: string | undefined): Promise<{ sources: Source[]; searched: { query: string; found: number }[]; configured: boolean }> {
  if (!apiKey) return { sources: [], searched: [], configured: false };
  const qs = queriesFor(b);
  const results = await Promise.all(qs.map((q) => search(q.query, q.domains, apiKey)));
  const seen = new Set<string>();
  const graded: Omit<Source, "id">[] = [];
  results.forEach((rs) => {
    for (const r of rs) {
      const key = r.url.replace(/[#?].*$/, "");
      if (seen.has(key)) continue;
      const g = grade(r.url, r.title, r.excerpt);
      if (!g) continue;
      seen.add(key);
      graded.push({ ...r, publisher: host(r.url), ...g });
    }
  });
  const order: Strength[] = ["strong", "moderate", "supporting", "policy"];
  const sources = graded
    .sort((a, c) => order.indexOf(a.strength) - order.indexOf(c.strength))
    .slice(0, MAX_SOURCES)
    .map((s, i) => ({ ...s, id: `src:${i + 1}` }));
  return { sources, searched: qs.map((q, i) => ({ query: q.query, found: results[i].length })), configured: true };
}

/** The national cancer strategy and roadmap, always available: they say what Finland aims for, not what works. */
const POLICY_IDS = ["strategy-goal2-screening-80", "roadmap-p10-socioeconomic", "roadmap-p13-distance", "strategy-p35-3.2", "roadmap-p56-3.1.2", "strategy-goal3-headline"];
export function policySources(): Source[] {
  return EVIDENCE.filter((e) => POLICY_IDS.includes(e.id)).map((e) => ({
    id: e.id,
    title: `${e.doc === "strategy" ? "National Cancer Strategy 2026–2035" : "Cancer Strategy Roadmap 2026–2031"}${e.page ? `, p. ${e.page}` : ""}: ${e.titleEn}`,
    url: e.url,
    publisher: "Finnish Government",
    excerpt: e.summaryEn,
    strength: "policy",
    kind: "National strategy",
  }));
}

/* ---------- Step 3: drafting ---------- */

export type Recommendation = {
  title: string;
  action: string;
  why: string;
  firstStep: string;
  owner: string;
  measure: string;
  /** says: what the source shows, in one sentence; quote: copied word for word from the source, checked by code. */
  sources: { id: string; says: string; quote: string }[];
  /** Strongest evidence among its sources, graded by code. */
  strength: Strength;
};
export type RecommendResult = {
  status: "ai" | "fallback";
  recommendations: Recommendation[];
  sources: Source[];
  searched: { query: string; found: number }[];
  notes: string[];
};

type Draft = Omit<Recommendation, "strength">;
export type Drafter = (prompt: string, sourceIds: string[]) => Promise<unknown>;

const geminiDrafter: Drafter = async (prompt, sourceIds) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const str = { type: Type.STRING };
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: str, action: str, why: str, firstStep: str, owner: str, measure: str,
                sources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING, enum: sourceIds }, says: str, quote: str }, required: ["id", "says", "quote"] } },
              },
              required: ["title", "action", "why", "firstStep", "owner", "measure", "sources"],
            },
          },
        },
        required: ["recommendations"],
      },
    },
  });
  return JSON.parse(res.text ?? "");
};

/* ---------- Step 5: the independent reviewer ---------- */

export type Reviewer = (prompt: string) => Promise<unknown>;

const geminiReviewer: Reviewer = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdicts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                verdict: { type: Type.STRING, enum: ["approve", "reject"] },
                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["index", "verdict", "issues"],
            },
          },
        },
        required: ["verdicts"],
      },
    },
  });
  return JSON.parse(res.text ?? "");
};

export function reviewPrompt(b: GapBrief, recs: Omit<Recommendation, "strength">[], sources: Source[]): string {
  const byId = new Map(sources.map((s) => [s.id, s]));
  return `You are a strict reviewer for a public-health team. Another agent drafted recommendations to close the gap below. Judge each one ONLY against the gap's facts and the quoted evidence. When in doubt, reject.

THE GAP: ${JSON.stringify(factsBlock(b))}

RECOMMENDATIONS:
${JSON.stringify(recs.map((r, i) => ({
  index: i + 1, title: r.title, action: r.action, why: r.why, firstStep: r.firstStep, owner: r.owner, measure: r.measure,
  evidence: r.sources.map((c) => ({ source: byId.get(c.id)?.title, strength: byId.get(c.id)?.strength, claims: c.says, quote: c.quote })),
})), null, 1)}

Reject a recommendation if any of these is true, and say exactly what to fix in "issues":
- its "claims" say more than its "quote" supports, or the quote does not support the action at all;
- the action is vague (e.g. "raise awareness", "improve cooperation") rather than something a team can start;
- it does not fit this group and this step of the pathway;
- it describes national figures as one county's own, or misstates a number from THE GAP;
- the measure would not show this gap closing.
Approve only when none apply. Return one verdict per recommendation.`;
}

/** Reads the reviewer's answer: approved only if every recommendation is approved. */
export function readReview(raw: unknown, count: number): { approved: boolean; feedback: string[] } {
  const verdicts = (raw as { verdicts?: unknown })?.verdicts;
  if (!Array.isArray(verdicts)) return { approved: false, feedback: ["The reviewer gave no verdicts."] };
  const feedback: string[] = [];
  for (let i = 1; i <= count; i++) {
    const v = verdicts.find((x: { index?: unknown }) => x?.index === i) as { verdict?: unknown; issues?: unknown } | undefined;
    if (!v) feedback.push(`Recommendation ${i}: the reviewer gave no verdict.`);
    else if (v.verdict !== "approve") {
      const issues = Array.isArray(v.issues) ? v.issues.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
      feedback.push(...(issues.length ? issues.map((x) => `Recommendation ${i}: ${x}`) : [`Recommendation ${i} was rejected by the reviewer.`]));
    }
  }
  return { approved: feedback.length === 0, feedback };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const rate = (a: number | null, b: number | null) => (a !== null && b ? r1((a / b) * 100) : null);

/** Every number the recommendations may state about the data. */
export function factNumbers(b: GapBrief): number[] {
  const steps = (s: Steps) => [s.invited, s.attended, s.positive, s.examined, s.waitDays, rate(s.attended, s.invited), rate(s.positive, s.attended), rate(s.examined, s.positive)];
  return [b.figure, b.rest, Math.abs(b.gap), b.n, b.impact, ...steps(b.group), ...steps(b.others), ...numbersIn(b.trend ?? ""), ...numbersIn(b.span)]
    .filter((x): x is number => x !== null && Number.isFinite(x))
    .flatMap((x) => [x, Math.round(x), Math.floor(x), Math.ceil(x)]); // "74%" for 74.53 is fair rounding
}

function factsBlock(b: GapBrief) {
  const unit = b.metric === "wait" ? "days" : "%";
  return {
    group: b.who,
    groupedBy: b.kindLabel,
    step: b.metricLabel,
    years: b.span,
    place: b.place ?? "not stated",
    data: b.source,
    group_value: `${r1(b.figure)} ${unit}`,
    everyone_else: `${r1(b.rest)} ${unit}`,
    gap: `${r1(Math.abs(b.gap))} ${b.metric === "wait" ? "days longer" : "percentage points lower"}`,
    people_in_group: b.n,
    impact: b.metric === "wait" ? `${Math.round(b.impact)} extra days of waiting in total` : `${Math.round(b.impact)} people who would have completed the step at everyone else's rate`,
    trend: b.trend ?? "only one year",
    pathway_group: b.group,
    pathway_everyone_else: b.others,
  };
}

export function buildPrompt(b: GapBrief, sources: Source[], errors?: string[]): string {
  return `You advise a Finnish wellbeing services county's cancer screening team. Draft exactly 3 recommendations that would close the gap below.

THE GAP (computed from aggregate data; these are the only numbers about the county you may use):
${JSON.stringify(factsBlock(b), null, 1)}

SOURCES (the only evidence you may cite; "strength" was graded by us from where each is published):
${JSON.stringify(sources.map((s) => ({ id: s.id, strength: s.strength, kind: s.kind, title: s.title, publisher: s.publisher, excerpt: s.excerpt })), null, 1)}

RULES
- Most actionable first: something the county can start within weeks, with a named owner, not "raise awareness".
- Prefer actions backed by "strong" or "moderate" sources. "policy" sources say what Finland aims for, not what works: use them only to show fit with national goals, never as the only proof that an action works.
- Every recommendation cites 1-3 source ids. For each, "says" states in one sentence what that source actually says, and "quote" copies ${MIN_QUOTE_LENGTH}-200 characters WORD FOR WORD from that source's excerpt that support it. Never claim more than the quote says.
- Numbers: use only numbers from THE GAP or from the excerpt of a source the recommendation cites. Do not invent effect sizes.
- Tailor it to this group and this step of the pathway (${b.metricLabel}); say why it fits in "why", using the gap's numbers.
- "firstStep": one concrete thing to do this month. "measure": how the team will see the gap close, using the same measure as the gap.
- "place" says where the figures come from. If they are national figures, never describe them as one county's.
- Write percentages as whole numbers (53%) and thousands with a comma (19,720).
- Plain English, short sentences, no jargon. title: at most 10 words.
${errors?.length ? `\nYOUR PREVIOUS DRAFT WAS REJECTED. Fix these problems:\n- ${errors.join("\n- ")}\n` : ""}`;
}

/** Checks a draft. Returns the clean recommendations or the problems found. */
export function checkDraft(raw: unknown, b: GapBrief, sources: Source[]): { ok: Draft[] } | { errors: string[] } {
  const recs = (raw as { recommendations?: unknown })?.recommendations;
  if (!Array.isArray(recs)) return { errors: ["The answer had no recommendations list."] };
  const errors: string[] = [];
  if (recs.length !== 3) errors.push(`Expected exactly 3 recommendations, got ${recs.length}.`);
  const byId = new Map(sources.map((s) => [s.id, s]));
  const facts = factNumbers(b);
  const out: Draft[] = [];
  recs.slice(0, 3).forEach((r: Record<string, unknown>, i) => {
    const n = i + 1;
    const text = (k: string) => (typeof r?.[k] === "string" ? (r[k] as string).trim() : "");
    const d: Draft = {
      title: text("title"), action: text("action"), why: text("why"), firstStep: text("firstStep"), owner: text("owner"), measure: text("measure"),
      sources: Array.isArray(r?.sources)
        ? (r.sources as { id?: unknown; says?: unknown; quote?: unknown }[])
            .filter((s) => typeof s?.id === "string" && typeof s?.says === "string")
            .map((s) => ({ id: s.id as string, says: (s.says as string).trim(), quote: typeof s.quote === "string" ? s.quote.trim() : "" }))
        : [],
    };
    for (const k of ["title", "action", "why", "firstStep", "owner", "measure"] as const) if (!d[k]) errors.push(`Recommendation ${n} has no ${k}.`);
    if (!d.sources.length) errors.push(`Recommendation ${n} cites no source.`);
    const unknown = d.sources.filter((s) => !byId.has(s.id));
    for (const s of unknown) errors.push(`Recommendation ${n} cites unknown source "${s.id}".`);
    const cited = d.sources.filter((s) => byId.has(s.id));
    if (cited.length && cited.every((s) => byId.get(s.id)!.strength === "policy") && sources.some((s) => s.strength !== "policy")) {
      errors.push(`Recommendation ${n} rests only on policy documents; cite a source that shows the action works.`);
    }
    for (const c of cited) {
      const q = normalize(c.quote);
      const src = byId.get(c.id)!;
      if (q.length < MIN_QUOTE_LENGTH) errors.push(`Recommendation ${n}: the quote from ${c.id} is missing or shorter than ${MIN_QUOTE_LENGTH} characters.`);
      else if (![src.excerpt, src.title].some((t) => normalize(t).includes(q))) errors.push(`Recommendation ${n}: the quote from ${c.id} does not appear word for word in that source: "${c.quote}"`);
    }
    const allowed = [...facts, ...cited.flatMap((s) => numbersIn(byId.get(s.id)!.excerpt))];
    for (const [field, value] of [["title", d.title], ["action", d.action], ["why", d.why], ["firstStep", d.firstStep], ["measure", d.measure], ...cited.map((s): [string, string] => [`source ${s.id} summary`, s.says])] as [string, string][]) {
      for (const num of unsupportedNumbers(value, allowed)) errors.push(`Recommendation ${n}: the number ${num} in ${field} is not in the gap's facts or its cited sources.`);
    }
    out.push({ ...d, sources: cited });
  });
  return errors.length ? { errors } : { ok: out };
}

const ORDER: Strength[] = ["strong", "moderate", "supporting", "policy"];
function withStrength(d: Draft, sources: Source[]): Recommendation {
  const strengths = d.sources.map((s) => sources.find((x) => x.id === s.id)!.strength);
  return { ...d, strength: ORDER.find((o) => strengths.includes(o)) ?? "policy" };
}

/** Safe, generic recommendations from the national strategy, used when no draft passes the checks. */
export function fallbackRecommendations(b: GapBrief): Recommendation[] {
  const equity = "roadmap-p10-socioeconomic", goal2 = "strategy-goal2-screening-80", register = "strategy-p35-3.2";
  const plural = b.who.charAt(0).toLowerCase() + b.who.slice(1);
  const measure = `${b.metricLabel} among ${plural}, compared with everyone else, every quarter.`;
  const says = (id: string) => EVIDENCE.find((e) => e.id === id)?.summaryEn ?? "";
  const base: (Omit<Recommendation, "strength" | "sources"> & { sources: { id: string; says: string }[] })[] =
    b.metric === "wait"
      ? [
          { title: "Find where the waiting time goes", action: `Map each step from a positive result to the follow-up for ${plural}: referral, booking and capacity.`, why: `${b.who} waited longer than everyone else in ${b.span}.`, firstStep: "Pull the dates of the last 20 follow-ups for this group and mark the longest step.", owner: "Screening programme lead", measure, sources: [{ id: "roadmap-p56-3.1.2", says: says("roadmap-p56-3.1.2") }] },
          { title: "Set a target time and watch it", action: "Agree a target time from a positive result to follow-up and report cases that miss it every month.", why: "A target that is watched shows the gap closing or not.", firstStep: "Write the target into the programme's monthly report.", owner: "Quality unit", measure, sources: [{ id: register, says: says(register) }] },
          { title: "Book interpreters and travel with the referral", action: `When the referral is made, book any interpreter or travel help ${plural} need at the same time.`, why: "Extra arrangements made late add days.", firstStep: "Add an interpreter and travel question to the referral form.", owner: "Referral and booking team", measure, sources: [{ id: equity, says: says(equity) }] },
        ]
      : [
          { title: "Reach this group in its own channels", action: `Send invitations and reminders to ${plural} in a form and channel they use, and test it against the current letter.`, why: `${b.who}: ${r1(b.figure)}% against ${r1(b.rest)}% for everyone else.`, firstStep: "Choose one channel and one message to test in the next invitation round.", owner: "Screening programme lead", measure, sources: [{ id: equity, says: says(equity) }] },
          { title: "Send a reminder to everyone who has not responded", action: `Send a reminder to ${plural} who have not ${b.metric === "followUp" ? "booked their follow-up" : "taken part"} within a set time.`, why: "A reminder costs little and reaches those who meant to take part.", firstStep: "Set the reminder date and wording for the next round.", owner: "Screening programme office", measure, sources: [{ id: goal2, says: says(goal2) }] },
          { title: "Follow this gap every quarter", action: "Report this measure for this group every quarter and compare with other counties.", why: "A gap that is measured can be acted on.", firstStep: "Add this group to the programme's quarterly report.", owner: "Quality unit", measure, sources: [{ id: register, says: says(register) }] },
        ];
  return base.map((r) => ({ ...r, sources: r.sources.map((c) => ({ ...c, quote: c.says })), strength: "policy" }));
}

/* ---------- The agent: steps reported as they happen ---------- */

export type StepId = "read" | "search" | "draft" | "check" | "review";
export type AgentEvent =
  | { type: "step"; step: StepId; state: "running" | "done" | "skipped"; detail?: string }
  | { type: "result"; result: RecommendResult };

export async function runAgent(
  b: GapBrief,
  emit: (e: AgentEvent) => void,
  draft: Drafter = geminiDrafter,
  apiKey = process.env.CONTEXT_DEV_API_KEY,
  review: Reviewer = geminiReviewer,
): Promise<void> {
  const notes: string[] = [];
  emit({ type: "step", step: "read", state: "done", detail: `${b.who}: ${b.metricLabel.toLowerCase()}, ${b.span}.` });

  emit({ type: "step", step: "search", state: "running" });
  const found = await findSources(b, apiKey);
  if (!found.configured) notes.push("Searching published research is not set up (no Context.dev key), so only the national cancer strategy was used.");
  const counts = (["strong", "moderate", "supporting"] as Strength[]).map((s) => [s, found.sources.filter((x) => x.strength === s).length] as const).filter(([, n]) => n > 0);
  emit({
    type: "step", step: "search", state: found.configured ? "done" : "skipped",
    detail: found.configured
      ? `${found.sources.length} quality ${found.sources.length === 1 ? "source" : "sources"} kept${counts.length ? ` (${counts.map(([s, n]) => `${n} ${s}`).join(", ")})` : ""}.`
      : "No search key: using the national cancer strategy only.",
  });
  const sources = [...found.sources, ...policySources()];

  let feedback: string[] | undefined;
  let result: Recommendation[] | null = null;
  const timed = <T,>(p: Promise<T>) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), DRAFT_TIMEOUT_MS))]);
  for (let round = 1; round <= ATTEMPTS && !result; round++) {
    const again = round > 1 ? ` (round ${round}, fixing ${feedback!.length} ${feedback!.length === 1 ? "objection" : "objections"})` : "";
    try {
      emit({ type: "step", step: "draft", state: "running", detail: again ? `Redrafting${again}.` : undefined });
      const raw = await timed(draft(buildPrompt(b, sources, feedback), sources.map((s) => s.id)));
      emit({ type: "step", step: "draft", state: "done", detail: again ? `Redrafted${again}.` : undefined });

      emit({ type: "step", step: "check", state: "running" });
      const checked = checkDraft(raw, b, sources);
      if ("errors" in checked) {
        feedback = checked.errors;
        console.warn("[recommend] draft failed the checks:", feedback.join(" | "));
        emit({ type: "step", step: "check", state: "running", detail: `${feedback.length} ${feedback.length === 1 ? "problem" : "problems"} with sources, quotes or numbers; sent back.` });
        continue;
      }
      emit({ type: "step", step: "check", state: "done", detail: "Every source, quote and number checked." });

      emit({ type: "step", step: "review", state: "running" });
      const verdict = readReview(await timed(review(reviewPrompt(b, checked.ok, sources))), checked.ok.length);
      if (verdict.approved) {
        result = checked.ok.map((d) => withStrength(d, sources));
        emit({ type: "step", step: "review", state: "done", detail: "The reviewer approved every recommendation." });
      } else {
        feedback = verdict.feedback;
        console.warn("[recommend] reviewer rejected:", feedback.join(" | "));
        emit({ type: "step", step: "review", state: "running", detail: `The reviewer raised ${feedback.length} ${feedback.length === 1 ? "objection" : "objections"}; sent back.` });
      }
    } catch (e) {
      // Fails closed: an agent that cannot answer means nothing unreviewed is shown.
      console.warn("[recommend] agent call failed:", e instanceof Error ? e.message : e);
      emit({ type: "step", step: "draft", state: "done", detail: "An AI step did not answer, so nothing unreviewed is shown." });
      break;
    }
  }
  const status: RecommendResult["status"] = result ? "ai" : "fallback";
  if (!result) {
    notes.push("No AI draft passed both the checks and the reviewer, so these are general recommendations from the national cancer strategy.");
    result = fallbackRecommendations(b);
    emit({ type: "step", step: "review", state: "skipped", detail: "Nothing approved: showing safe templates instead." });
  }
  result.sort((x, y) => ORDER.indexOf(x.strength) - ORDER.indexOf(y.strength));
  const used = new Set(result.flatMap((r) => r.sources.map((s) => s.id)));
  emit({ type: "result", result: { status, recommendations: result, sources: sources.filter((s) => used.has(s.id) || s.strength !== "policy"), searched: found.searched, notes } });
}
