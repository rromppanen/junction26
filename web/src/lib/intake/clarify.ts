import { GoogleGenAI, Type } from "@google/genai";
import { shortName } from "@/components/format";
import { getDataset } from "@/lib/data";
import type { Table } from "./csv";
import { FIELDS, suggestMapping, validateMapping, type Mapping } from "./fields";
import { personalDataHeaders } from "./privacy";
import type { Audience, Level, PublicDataset } from "./setup";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 15_000;
const MAX_QUESTIONS = 5;
const MAX_SAMPLE_ROWS = 5;
const MAX_CELL = 100;
const MAX_TEXT = 300;

export type Question = {
  id: string;
  kind: "column" | "audience" | "level" | "county";
  column?: string;
  text: string;
  options: { value: string; label: string }[];
};
export type QuestionInput = { datasets: PublicDataset[]; headers: string[] | null; sample: string[][] | null };
export type Answer = { questionId: string; option?: string; text?: string };

export type GenTask =
  | { kind: "questions"; headers: string[]; sample: string[][] }
  | { kind: "answers"; headers: string[]; sample: string[][]; items: { questionId: string; question: string; text: string; allowed: string[] }[] };
/** Returns Gemini's parsed JSON (unvalidated); injected in tests. */
export type Generator = (task: GenTask) => Promise<unknown>;

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "county-board", label: "County board / wellbeing services county management" },
  { value: "screening-unit", label: "Screening unit or programme team" },
  { value: "national", label: "National level (e.g. THL, ministry)" },
];
const LEVELS: { value: Level; label: string }[] = [
  { value: "municipality", label: "Municipalities" },
  { value: "county", label: "Wellbeing services counties" },
  { value: "national", label: "Whole country" },
];
const FIELD_OPTIONS = [...FIELDS.map((f) => ({ value: f.id as string, label: f.labelEn })), { value: "ignore", label: "Not needed (ignore this column)" }];

/** Defensive copy: at most 5 rows, cells capped at 100 characters. */
export function trimSample(sample: string[][] | null): string[][] {
  return (sample ?? []).slice(0, MAX_SAMPLE_ROWS).map((r) => r.map((c) => String(c).slice(0, MAX_CELL)));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

function fieldList() {
  return FIELDS.map((f) => `- ${f.id}: ${f.labelEn}. ${f.description}`).join("\n");
}

const geminiGenerator: Generator = async (task) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const data = `Column headers: ${JSON.stringify(task.headers)}\nSample rows (up to 5): ${JSON.stringify(task.sample)}`;
  let prompt: string;
  let schema: object;
  if (task.kind === "questions") {
    prompt = `A Finnish wellbeing services county uploaded an aggregate screening-statistics CSV. We map its columns onto these fields:
${fieldList()}

${data}

Ask about columns whose meaning is unclear (at most 2). Write each question in plain English, one sentence, no jargon, asking what the column means. Use only the exact header names above for "column". Return an empty list if everything is clear. Do not invent data.`;
    schema = {
      type: Type.OBJECT,
      properties: { questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { column: { type: Type.STRING, enum: task.headers }, text: { type: Type.STRING } }, required: ["column", "text"] } } },
      required: ["questions"],
    };
  } else {
    prompt = `A user answered clarifying questions about an uploaded screening-statistics CSV, in free text (English or Finnish). For each answer choose the single allowed value that best matches what the user said. If none clearly matches, choose "unclear".
Fields:
${fieldList()}

${data}

Answers: ${JSON.stringify(task.items)}`;
    const values = [...new Set([...task.items.flatMap((i) => i.allowed), "unclear"])];
    schema = {
      type: Type.OBJECT,
      properties: { answers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionId: { type: Type.STRING, enum: task.items.map((i) => i.questionId) }, value: { type: Type.STRING, enum: values } }, required: ["questionId", "value"] } } },
      required: ["answers"],
    };
  }
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return JSON.parse(res.text ?? "");
};

async function countyOptions(): Promise<{ value: string; label: string }[]> {
  const ds = await getDataset();
  return ds.regions.filter((r) => r.kind === "county").map((r) => ({ value: String(r.id), label: shortName(r.name) }));
}

function assertNoPersonalData(headers: string[] | null) {
  const bad = headers ? personalDataHeaders(headers) : [];
  if (bad.length) throw new Error(`Columns that look like personal data cannot be analysed: ${bad.join(", ")}`);
}

const columnQuestion = (column: string, text: string): Question => ({ id: `col:${column}`, kind: "column", column, text, options: FIELD_OPTIONS });
const fallbackText = (h: string) => `What does the column "${h}" contain?`;

/** Throws if headers look like personal data. Never throws for Gemini problems (falls back). */
export async function getQuestions(
  input: QuestionInput,
  generate: Generator = geminiGenerator,
): Promise<{ status: "ai" | "fallback"; questions: Question[]; suggested: Mapping | null }> {
  assertNoPersonalData(input.headers);
  const headers = input.headers;
  const suggested = headers ? suggestMapping(headers) : null;
  const fixed: Question[] = [
    { id: "audience", kind: "audience", text: "Who is this analysis for?", options: AUDIENCES },
    { id: "level", kind: "level", text: "At which level should we compare areas?", options: LEVELS },
    { id: "county", kind: "county", text: "Which county are you working for?", options: await countyOptions() },
  ];
  const room = MAX_QUESTIONS - fixed.length;
  let status: "ai" | "fallback" = "fallback";
  let columnQs: Question[] = [];
  if (headers && headers.length) {
    const unmapped = headers.filter((h) => suggested![h] === "ignore");
    const sample = trimSample(input.sample);
    try {
      const raw = (await withTimeout(generate({ kind: "questions", headers, sample }), TIMEOUT_MS)) as { questions?: unknown };
      if (!raw || !Array.isArray(raw.questions)) throw new Error("unusable answer");
      const seen = new Set<string>();
      for (const q of raw.questions as { column?: unknown; text?: unknown }[]) {
        if (typeof q?.column !== "string" || typeof q.text !== "string" || !q.text.trim()) continue;
        if (!headers.includes(q.column) || seen.has(q.column)) continue;
        seen.add(q.column);
        columnQs.push(columnQuestion(q.column, q.text.trim().slice(0, MAX_TEXT)));
      }
      status = "ai";
    } catch (err) {
      console.warn("[intake] questions fallback:", err instanceof Error ? err.message : err);
      columnQs = unmapped.map((h) => columnQuestion(h, fallbackText(h)));
    }
  }
  return { status, questions: [...fixed, ...columnQs.slice(0, room)], suggested };
}

/**
 * Applies picked options directly; free-text answers go to Gemini, which may only choose among the
 * question's own option values. Anything unresolved is listed in notes.
 */
export async function answersToSetup(
  input: QuestionInput,
  questions: Question[],
  answers: Answer[],
  generate: Generator = geminiGenerator,
): Promise<{ status: "ai" | "fallback"; mapping: Mapping | null; audience: Audience; level: Level; countyId: number | null; notes: string[] }> {
  assertNoPersonalData(input.headers);
  const notes: string[] = [];
  const headers = input.headers;
  const sample = trimSample(input.sample);
  const mapping: Mapping | null = headers ? suggestMapping(headers) : null;
  let audience: Audience = "county-board";
  let level: Level = "county";
  let countyId: number | null = null;
  let status: "ai" | "fallback" = "ai";

  const byId = new Map(questions.map((q) => [q.id, q]));
  const apply = (q: Question, value: string) => {
    if (q.kind === "audience") audience = value as Audience;
    else if (q.kind === "level") level = value as Level;
    else if (q.kind === "county") countyId = Number(value);
    else if (q.kind === "column" && q.column && mapping && Object.hasOwn(mapping, q.column)) mapping[q.column] = value as Mapping[string];
  };
  const label = (q: Question) => (q.kind === "column" ? `column "${q.column}"` : q.kind);

  const pending: { q: Question; text: string }[] = [];
  const done = new Set<string>();
  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q || done.has(q.id)) continue;
    done.add(q.id);
    if (a.option !== undefined) {
      if (q.options.some((o) => o.value === a.option)) apply(q, a.option);
      else notes.push(`The chosen ${label(q)} answer was not one of the offered options; the default was kept.`);
    } else if (typeof a.text === "string" && a.text.trim()) {
      pending.push({ q, text: a.text.trim().slice(0, MAX_TEXT) });
    }
  }

  if (pending.length) {
    try {
      const raw = (await withTimeout(generate({
        kind: "answers", headers: headers ?? [], sample,
        items: pending.map(({ q, text }) => ({ questionId: q.id, question: q.text, text, allowed: q.options.map((o) => o.value) })),
      }), TIMEOUT_MS)) as { answers?: unknown };
      if (!raw || !Array.isArray(raw.answers)) throw new Error("unusable answer");
      const resolved = new Set<string>();
      for (const r of raw.answers as { questionId?: unknown; value?: unknown }[]) {
        const p = pending.find((x) => x.q.id === r?.questionId);
        if (p && typeof r.value === "string" && p.q.options.some((o) => o.value === r.value) && !resolved.has(p.q.id)) {
          apply(p.q, r.value);
          resolved.add(p.q.id);
        }
      }
      for (const p of pending) if (!resolved.has(p.q.id)) notes.push(`Could not match the answer for ${label(p.q)}; the suggested value was kept.`);
    } catch (err) {
      console.warn("[intake] mapping fallback:", err instanceof Error ? err.message : err);
      status = "fallback";
      for (const p of pending) notes.push(`Could not interpret the answer for ${label(p.q)}; the suggested value was kept.`);
    }
  }

  if (headers && mapping) {
    const table: Table = { headers, rows: sample };
    notes.push(...validateMapping(table, mapping));
  }
  return { status, mapping, audience, level, countyId, notes };
}
