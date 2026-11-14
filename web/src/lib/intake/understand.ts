import { GoogleGenAI, Type } from "@google/genai";
import { shortName } from "@/components/format";
import { getDataset } from "@/lib/data";
import { trimSample, type Question, type QuestionInput } from "./clarify";
import { FIELDS, suggestMapping, type Field, type Mapping } from "./fields";
import { personalDataHeaders } from "./privacy";
import type { Level } from "./setup";

/**
 * The conversational intake: the AI first tries to understand the data on its own, and only asks the user
 * about things it is not confident about, one question at a time. The AI may only choose among fixed
 * fields and places; code validates every mapping before any findings are shown.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 15_000;
/** At or above this the AI's own guess is used without asking. */
export const CONFIDENT = 0.75;
const MAX_QUESTIONS = 6;
const MAX_TEXT = 300;
export const NATIONAL = "national";

export type Guess = { value: string; label: string };
/** A question the AI asks because its own confidence is below {@link CONFIDENT}. */
export type ConvQuestion = Question & { kind: "column" | "county"; guess: Guess | null; confidence: number };
export type ColumnGuess = {
  header: string;
  field: Field;
  meaning: string;
  confidence: number;
  source: "name" | "ai" | "none";
};
export type PlaceGuess = { countyId: number | null; level: Level; confidence: number; reason: string };
export type Understanding = {
  status: "ai" | "fallback";
  columns: ColumnGuess[];
  mapping: Mapping | null;
  place: PlaceGuess;
  questions: ConvQuestion[];
  /** County options (and "the whole country"), so the client can name the place it ends up with. */
  places: Guess[];
};
export type Interpretation =
  | { result: "matched"; value: string; label: string }
  | { result: "skip" }
  | { result: "unclear" };

export type UnderstandTask =
  | { kind: "columns"; headers: string[]; sample: string[][] }
  | { kind: "interpret"; question: string; text: string; headers: string[]; sample: string[][]; options: Guess[] };
/** Returns Gemini's parsed JSON (unvalidated); injected in tests. */
export type UnderstandGenerator = (task: UnderstandTask) => Promise<unknown>;

const FIELD_OPTIONS: Guess[] = [
  ...FIELDS.map((f) => ({ value: f.id as string, label: f.labelEn })),
  { value: "ignore", label: "Not needed (ignore this column)" },
];
const fieldLabel = (f: Field) => FIELD_OPTIONS.find((o) => o.value === f)!.label;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

const fieldList = () => FIELDS.map((f) => `- ${f.id}: ${f.labelEn}. ${f.description}`).join("\n") + "\n- ignore: not needed for the analysis.";

const geminiGenerator: UnderstandGenerator = async (task) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const data = `Column headers: ${JSON.stringify(task.headers)}\nSample rows (up to 5): ${JSON.stringify(task.sample)}`;
  let prompt: string;
  let schema: object;
  if (task.kind === "columns") {
    prompt = `A Finnish wellbeing services county uploaded an aggregate cancer-screening statistics CSV (headers may be Finnish or English). For every column, decide which of these fields it holds:
${fieldList()}

${data}

For each column return: the field, a short plain-English meaning (max 12 words), your confidence from 0 to 1 that the field is right, and one short friendly question you would ask the user if you were unsure (plain English, no jargon, mention an example value from the sample). Be honest: use a confidence below 0.75 when the header is abbreviated, ambiguous or could fit more than one field. Use each field other than "ignore" for at most one column. Do not invent data.`;
    schema = {
      type: Type.OBJECT,
      properties: {
        columns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING, enum: task.headers },
              field: { type: Type.STRING, enum: FIELD_OPTIONS.map((o) => o.value) },
              meaning: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              question: { type: Type.STRING },
            },
            required: ["column", "field", "meaning", "confidence", "question"],
          },
        },
      },
      required: ["columns"],
    };
  } else {
    prompt = `We asked a user a clarifying question about their uploaded screening-statistics data. They answered in their own words (English or Finnish). Choose the single allowed value that matches what they said. Finnish municipality names may be given; map a municipality to the wellbeing services county that contains it. If they say they don't know or want to skip, choose "skip". If the answer is not clear enough, choose "unclear".
${data}

Question: ${JSON.stringify(task.question)}
Answer: ${JSON.stringify(task.text)}

Allowed values (value: label):
${task.options.map((o) => `- ${o.value}: ${o.label}`).join("\n")}`;
    schema = {
      type: Type.OBJECT,
      properties: { value: { type: Type.STRING, enum: [...task.options.map((o) => o.value), "skip", "unclear"] } },
      required: ["value"],
    };
  }
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return JSON.parse(res.text ?? "");
};

type Places = { options: Guess[]; lookup: { key: string; countyId: number; isCounty: boolean }[] };
let placesCache: Promise<Places> | null = null;

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

async function places(): Promise<Places> {
  placesCache ??= getDataset().then((ds) => {
    const counties = ds.regions.filter((r) => r.kind === "county");
    const options = [
      ...counties.map((r) => ({ value: String(r.id), label: shortName(r.name) })),
      { value: NATIONAL, label: "The whole country" },
    ];
    const lookup: Places["lookup"] = [];
    for (const c of counties) {
      lookup.push({ key: norm(shortName(c.name)), countyId: c.id, isCounty: true });
      lookup.push({ key: norm(c.name), countyId: c.id, isCounty: true });
    }
    for (const m of ds.regions) {
      if (m.kind === "municipality" && m.parentId !== null) lookup.push({ key: norm(m.name), countyId: m.parentId, isCounty: false });
    }
    return { options, lookup };
  });
  return placesCache;
}

/** Finds the place a piece of text names. Tolerates Finnish case endings (Tampereella, Pirkanmaalla). */
function findPlace(text: string, p: Places): { countyId: number; isCounty: boolean } | null {
  const t = norm(text);
  const tokens = t.split(/[^a-zäöå0-9-]+/).filter(Boolean);
  let best: { countyId: number; isCounty: boolean; len: number } | null = null;
  for (const e of p.lookup) {
    const exact = t === e.key || tokens.includes(e.key) || (e.key.includes(" ") && t.includes(e.key));
    const stem = e.key.length >= 5 ? e.key.slice(0, -1) : null;
    const inflected = stem !== null && tokens.some((tok) => tok.startsWith(stem));
    if ((exact || inflected) && (!best || e.key.length > best.len)) best = { countyId: e.countyId, isCounty: e.isCounty, len: e.key.length };
  }
  return best && { countyId: best.countyId, isCounty: best.isCounty };
}

/** Infers the county from the region column's sample values, when they all point to one county. */
function guessPlace(headers: string[] | null, sample: string[][], mapping: Mapping | null, p: Places): PlaceGuess {
  const unknown: PlaceGuess = { countyId: null, level: "county", confidence: 0, reason: "No place in the data." };
  if (!headers || !mapping) return unknown;
  const col = headers.findIndex((h) => mapping[h] === "region");
  if (col < 0) return unknown;
  const values = sample.map((r) => r[col]).filter((v) => v && v.trim());
  if (!values.length) return unknown;
  const hits = values.map((v) => findPlace(v, p));
  if (hits.some((h) => h === null)) return { ...unknown, reason: "Some region names were not recognised." };
  const ids = new Set(hits.map((h) => h!.countyId));
  if (ids.size !== 1) return { ...unknown, level: "county", confidence: 0.3, reason: "The data covers several counties." };
  const countyId = [...ids][0];
  const label = p.options.find((o) => o.value === String(countyId))?.label ?? "one county";
  const municipal = hits.some((h) => !h!.isCounty);
  return { countyId, level: municipal ? "municipality" : "county", confidence: 0.9, reason: `Every region in the sample is in ${label}.` };
}

function assertNoPersonalData(headers: string[] | null) {
  const bad = headers ? personalDataHeaders(headers) : [];
  if (bad.length) throw new Error(`Columns that look like personal data cannot be analysed: ${bad.join(", ")}`);
}

const clamp01 = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

function examples(sample: string[][], col: number): string {
  const vals = [...new Set(sample.map((r) => r[col]).filter((v) => v && v.trim()))].slice(0, 3);
  return vals.length ? ` For example: ${vals.map((v) => `"${v}"`).join(", ")}.` : "";
}

/** Throws if headers look like personal data. Never throws for Gemini problems (falls back to name matching). */
export async function understandData(input: QuestionInput, generate: UnderstandGenerator = geminiGenerator): Promise<Understanding> {
  assertNoPersonalData(input.headers);
  const p = await places();
  const headers = input.headers;
  const sample = trimSample(input.sample);
  let status: Understanding["status"] = "fallback";
  const columns: ColumnGuess[] = [];
  const askText = new Map<string, string>();

  if (headers && headers.length) {
    const byName = suggestMapping(headers);
    const ai = new Map<string, { field: Field; meaning: string; confidence: number }>();
    try {
      const raw = (await withTimeout(generate({ kind: "columns", headers, sample }), TIMEOUT_MS)) as { columns?: unknown };
      if (!raw || !Array.isArray(raw.columns)) throw new Error("unusable answer");
      for (const c of raw.columns as Record<string, unknown>[]) {
        if (typeof c?.column !== "string" || !headers.includes(c.column) || ai.has(c.column)) continue;
        if (typeof c.field !== "string" || !FIELD_OPTIONS.some((o) => o.value === c.field)) continue;
        ai.set(c.column, {
          field: c.field as Field,
          meaning: typeof c.meaning === "string" ? c.meaning.trim().slice(0, MAX_TEXT) : "",
          confidence: clamp01(c.confidence),
        });
        if (typeof c.question === "string" && c.question.trim()) askText.set(c.column, c.question.trim().slice(0, MAX_TEXT));
      }
      status = "ai";
    } catch (err) {
      console.warn("[intake] understand fallback:", err instanceof Error ? err.message : err);
    }
    headers.forEach((h) => {
      const named = byName[h];
      const a = ai.get(h);
      if (named !== "ignore") {
        const desc = FIELDS.find((f) => f.id === named)!.description;
        columns.push({ header: h, field: named, meaning: a && a.field === named && a.meaning ? a.meaning : desc, confidence: 0.95, source: "name" });
      } else if (a) {
        columns.push({ header: h, field: a.field, meaning: a.meaning || fieldLabel(a.field), confidence: a.confidence, source: "ai" });
      } else {
        columns.push({ header: h, field: "ignore", meaning: "Not sure yet.", confidence: 0.2, source: "none" });
      }
    });
    // Each field may hold only one column: the most confident one keeps it; the others become questions.
    const owner = new Map<Field, ColumnGuess>();
    for (const c of [...columns].sort((x, y) => y.confidence - x.confidence)) {
      if (c.field === "ignore") continue;
      if (owner.has(c.field)) c.confidence = Math.min(c.confidence, 0.5);
      else owner.set(c.field, c);
    }
  }

  // Only confident guesses go into the mapping; the rest stay "ignore" until the user answers.
  const mapping: Mapping | null = headers
    ? (Object.fromEntries(columns.map((c) => [c.header, c.confidence >= CONFIDENT ? c.field : "ignore"])) as Mapping)
    : null;
  const place = guessPlace(headers, sample, mapping, p);

  const questions: ConvQuestion[] = [];
  for (const c of columns) {
    if (c.confidence >= CONFIDENT) continue;
    const col = headers!.indexOf(c.header);
    questions.push({
      id: `col:${c.header}`,
      kind: "column",
      column: c.header,
      text: askText.get(c.header) ?? `What does the column "${c.header}" contain?${examples(sample, col)}`,
      options: FIELD_OPTIONS,
      guess: c.field === "ignore" && c.source === "none" ? null : { value: c.field, label: fieldLabel(c.field) },
      confidence: c.confidence,
    });
  }
  if (place.confidence < CONFIDENT) {
    questions.push({
      id: "county",
      kind: "county",
      text: "Which wellbeing services county are you working for? If you look at all of Finland, just say the whole country.",
      options: p.options,
      guess: null,
      confidence: place.confidence,
    });
  }
  // The place question always survives the cap: findings cannot open without it.
  const capped = questions.length > MAX_QUESTIONS ? [...questions.slice(0, MAX_QUESTIONS - 1), questions.at(-1)!] : questions;
  return { status, columns, mapping, place, questions: capped, places: p.options };
}

const SKIP = /^(skip|pass|no idea|not sure|i don'?t know|dunno|en tiedä|ei aavistusta|ohita)\b/;
const YES = /^(yes|yep|yeah|yup|correct|right|exactly|that'?s (it|right|correct)|kyllä|joo|juu|kyl|oikein|just niin)\b/;
const NATIONAL_WORDS = /\b(whole country|all of finland|national|nationwide|finland|koko maa|koko suomi|suomi|valtakunnallinen)\b/;
const FIELD_WORDS: Record<Field, RegExp> = {
  year: /\b(year|vuosi|vuoden)\b/,
  region: /\b(region|area|municipalit|county|place|alue|kunta|kunnat|hyvinvointialue)/,
  group: /\b(group|language|gender|sex|age group|ryhmä|kieli|sukupuoli|ikäryhmä)/,
  programme: /\b(programme|program|screening type|which screening|ohjelma|seulonta)/,
  invited: /\b(invit|kutsu)/,
  attended: /\b(attend|took part|participat|screened|came|showed up|osallistu)/,
  positive: /\b(positive|referr|abnormal|positiivi|lähete|lähetetty)/,
  examined: /\b(examin|follow-?up|colonoscop|completed|tutkit|jatkotutki)/,
  waitDays: /\b(wait|delay|days|odotus|viive|päiv)/,
  ignore: /\b(ignore|not needed|irrelevant|nothing|unused|comment|note|ei tarvita|turha|huomautus)/,
};

const MATCH_ORDER: Field[] = ["ignore", "waitDays", "examined", "positive", "attended", "invited", "group", "programme", "region", "year"];

/** Name-matching fallback for a free-text answer. Returns null when it cannot tell. */
function localMatch(q: { kind: "column" | "county" }, text: string, p: Places): string | null {
  const t = norm(text);
  if (q.kind === "county") {
    if (NATIONAL_WORDS.test(t)) return NATIONAL;
    const hit = findPlace(t, p);
    return hit ? String(hit.countyId) : null;
  }
  // Natural answers often name two steps ("follow-ups after a positive result", "days from referral"):
  // the more specific field wins.
  return MATCH_ORDER.find((f) => FIELD_WORDS[f].test(t)) ?? null;
}

/**
 * Turns one free-text answer into one allowed value. Allowed values are rebuilt here from the question kind;
 * nothing supplied by the client is trusted except a guess that is itself an allowed value.
 */
export async function interpretAnswer(
  input: QuestionInput,
  question: { kind: "column" | "county"; text: string },
  text: string,
  guess: string | null,
  generate: UnderstandGenerator = geminiGenerator,
): Promise<Interpretation> {
  assertNoPersonalData(input.headers);
  const p = await places();
  const options = question.kind === "county" ? p.options : FIELD_OPTIONS;
  const label = (v: string) => options.find((o) => o.value === v)?.label;
  const answer = text.trim().slice(0, MAX_TEXT);
  const t = norm(answer);
  if (!t || SKIP.test(t)) return { result: "skip" };
  if (guess && label(guess) && YES.test(t) && t.split(/\s+/).length <= 4) return { result: "matched", value: guess, label: label(guess)! };

  try {
    const raw = (await withTimeout(generate({
      kind: "interpret", question: question.text, text: answer, headers: input.headers ?? [], sample: trimSample(input.sample), options,
    }), TIMEOUT_MS)) as { value?: unknown };
    const v = raw?.value;
    if (v === "skip") return { result: "skip" };
    if (typeof v === "string" && label(v)) return { result: "matched", value: v, label: label(v)! };
  } catch (err) {
    console.warn("[intake] interpret fallback:", err instanceof Error ? err.message : err);
  }
  const v = localMatch(question, answer, p);
  return v && label(v) ? { result: "matched", value: v, label: label(v)! } : { result: "unclear" };
}
