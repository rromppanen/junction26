import { trimSample, type Answer, type Question, type QuestionInput } from "./clarify";
import { personalDataHeaders } from "./privacy";
import { PUBLIC_DATASETS } from "./setup";

export const MAX_BODY_BYTES = 64 * 1024;
const MAX_HEADERS = 30;
const MAX_HEADER_CHARS = 100;
const MAX_ITEMS = 5;
const MAX_ID = 64;
const MAX_TEXT = 500;
const KINDS = ["column", "audience", "level", "county"];

/** Reads a request body as JSON with a hard size bound. Returns the value or an error message. */
export async function readJsonBody(req: Request): Promise<{ value: unknown } | { error: string }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { error: "Request body is too large." };
  const text = await req.text().catch(() => null);
  if (text === null) return { error: "Could not read the request body." };
  if (text.length > MAX_BODY_BYTES) return { error: "Request body is too large." };
  try { return { value: JSON.parse(text) }; } catch { return { error: "Body must be valid JSON." }; }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates and sanitises a question-input body; returns the clean input or an error message. */
export function parseIntakeInput(body: unknown): QuestionInput | string {
  if (!isObj(body)) return "Body must be a JSON object.";
  const ids = PUBLIC_DATASETS.map((d) => d.id as string);
  if (!Array.isArray(body.datasets) || body.datasets.length > ids.length || !body.datasets.every((d) => typeof d === "string" && ids.includes(d)))
    return "datasets must be a list of known dataset ids.";
  let headers: string[] | null = null;
  let sample: string[][] | null = null;
  if (body.headers !== null && body.headers !== undefined) {
    if (!Array.isArray(body.headers) || !body.headers.every((h) => typeof h === "string")) return "headers must be a list of strings.";
    if (body.headers.length > MAX_HEADERS) return `At most ${MAX_HEADERS} columns are allowed.`;
    if (body.headers.some((h: string) => h.length > MAX_HEADER_CHARS)) return `Column names must be at most ${MAX_HEADER_CHARS} characters.`;
    headers = body.headers as string[];
    const bad = personalDataHeaders(headers);
    if (bad.length) return `Columns that look like personal data cannot be analysed: ${bad.join(", ")}`;
    if (!Array.isArray(body.sample) || !body.sample.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string"))) return "sample must be a list of rows of strings.";
    sample = trimSample(body.sample as string[][]); // at most 5 rows x 30 cells x 100 characters
  }
  return { datasets: body.datasets as QuestionInput["datasets"], headers, sample };
}

/** Validates the mapping body. Questions are reduced to id/kind/column/text: client options are never used. */
export function parseMappingBody(body: unknown): { input: QuestionInput; questions: Question[]; answers: Answer[] } | string {
  if (!isObj(body)) return "Body must be a JSON object.";
  const input = parseIntakeInput(body.input);
  if (typeof input === "string") return input;
  if (!Array.isArray(body.questions) || body.questions.length > MAX_ITEMS) return `questions must be a list of at most ${MAX_ITEMS}.`;
  if (!Array.isArray(body.answers) || body.answers.length > MAX_ITEMS) return `answers must be a list of at most ${MAX_ITEMS}.`;
  const questions: Question[] = [];
  for (const q of body.questions) {
    if (!isObj(q) || typeof q.id !== "string" || !q.id || q.id.length > MAX_ID) return "Each question needs an id of 1-64 characters.";
    if (typeof q.kind !== "string" || !KINDS.includes(q.kind)) return "Each question needs a valid kind.";
    if (typeof q.text !== "string" || q.text.length > MAX_TEXT) return "Each question needs text of at most 500 characters.";
    let column: string | undefined;
    if (q.kind === "column") {
      if (typeof q.column !== "string" || !input.headers?.includes(q.column)) return "A column question must name one of the uploaded columns.";
      column = q.column;
    }
    questions.push({ id: q.id, kind: q.kind as Question["kind"], column, text: q.text, options: [] });
  }
  const answers: Answer[] = [];
  for (const a of body.answers) {
    if (!isObj(a) || typeof a.questionId !== "string" || !a.questionId || a.questionId.length > MAX_ID) return "Each answer needs a questionId of 1-64 characters.";
    if (a.option !== undefined && (typeof a.option !== "string" || a.option.length > MAX_ID)) return "An answer option must be a short string.";
    if (a.text !== undefined && (typeof a.text !== "string" || a.text.length > MAX_TEXT)) return "Free-text answers must be at most 500 characters.";
    answers.push({ questionId: a.questionId, option: a.option as string | undefined, text: a.text as string | undefined });
  }
  return { input, questions, answers };
}
