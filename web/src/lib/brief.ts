import { Draft } from "./analysis";
import { evidenceIds } from "../data/evidence";

export function validateDraft(value: unknown): Draft {
  if (!value || typeof value !== "object") throw new Error("Invalid draft.");
  const r = value as Record<string, unknown>;
  for (const key of ["headline", "interpretation", "nextQuestion"] as const) {
    if (typeof r[key] !== "string" || !r[key].trim() || r[key].length > 900) throw new Error("Invalid draft field.");
    // Display all quantities from deterministic findings, not model prose.
    if (/\d|\b(proves?|root cause is|caused by|will eliminate|will fix|guarantee|significant|lives saved)\b/i.test(r[key] as string)) throw new Error("Unsupported numerical or causal claim.");
  }
  if (!Array.isArray(r.evidenceIds) || r.evidenceIds.length < 2 || !r.evidenceIds.every(id => typeof id === "string" && evidenceIds.includes(id)) || !r.evidenceIds.includes("report") || !r.evidenceIds.includes("quality")) throw new Error("Missing or unknown evidence.");
  return { headline: r.headline as string, interpretation: r.interpretation as string, nextQuestion: r.nextQuestion as string, evidenceIds: r.evidenceIds as string[] };
}
