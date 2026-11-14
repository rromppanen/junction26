import { trimSample, type QuestionInput } from "./clarify";
import { personalDataHeaders } from "./privacy";
import { PUBLIC_DATASETS } from "./setup";

const MAX_HEADERS = 30;

/** Validates and sanitises a request body; returns the clean input or an error message. */
export function parseIntakeInput(body: unknown): QuestionInput | string {
  const b = body as { datasets?: unknown; headers?: unknown; sample?: unknown } | null;
  if (!b || typeof b !== "object") return "Body must be a JSON object.";
  const ids = PUBLIC_DATASETS.map((d) => d.id as string);
  if (!Array.isArray(b.datasets) || !b.datasets.every((d) => typeof d === "string" && ids.includes(d))) return "datasets must be a list of known dataset ids.";
  let headers: string[] | null = null;
  let sample: string[][] | null = null;
  if (b.headers !== null && b.headers !== undefined) {
    if (!Array.isArray(b.headers) || !b.headers.every((h) => typeof h === "string")) return "headers must be a list of strings.";
    if (b.headers.length > MAX_HEADERS) return `At most ${MAX_HEADERS} columns are allowed.`;
    headers = (b.headers as string[]).map((h) => h.slice(0, 100));
    const bad = personalDataHeaders(headers);
    if (bad.length) return `Columns that look like personal data cannot be analysed: ${bad.join(", ")}`;
    if (!Array.isArray(b.sample) || !b.sample.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string"))) return "sample must be a list of rows of strings.";
    sample = trimSample(b.sample as string[][]);
  }
  return { datasets: b.datasets as QuestionInput["datasets"], headers, sample };
}
