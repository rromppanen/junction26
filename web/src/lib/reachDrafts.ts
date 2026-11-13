import { GoogleGenAI, Type } from "@google/genai";
import type { ReachPlan } from "./reach";
import type { Indicator } from "./types";

// Same model setting as the analyst (see analyst.ts).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 30_000;
const CACHE_MS = 24 * 60 * 60 * 1000;

export type Draft = { language: string; invitation: string; sms: string; backTranslation: string };
export type ReachDrafts = { status: "ok" | "fallback"; drafts: Draft[] };
/** Produces one draft per language; injected in tests. */
export type DraftGenerator = (plan: ReachPlan, indicator: Indicator) => Promise<Draft[]>;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    drafts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING },
          invitation: { type: Type.STRING },
          sms: { type: Type.STRING },
          backTranslation: { type: Type.STRING },
        },
        required: ["language", "invitation", "sms", "backTranslation"],
      },
    },
  },
  required: ["drafts"],
};

function programmeName(indicator: Indicator): string {
  return indicator.nameEn.match(/^(\w+) cancer screening/i)?.[1]?.toLowerCase() ?? "cancer";
}

function buildPrompt(plan: ReachPlan, indicator: Indicator): string {
  const langs = plan.languages.map((l) => l.language).join(", ");
  return `Write draft messages for a Finnish wellbeing services county that invites people to ${programmeName(indicator)} cancer screening.
Write one draft for each of these languages: ${langs}.

For each language give:
- invitation: a short invitation letter in that language, at most 80 words.
- sms: a short reminder text message in that language, at most 160 characters.
- backTranslation: an English translation of the invitation, so a Finnish-speaking officer can check it.

Rules:
- Plain, simple language. Say what the screening is, that it is free, and how to book or change the time, using exactly the placeholders [phone] and [link]. Say that people may bring an interpreter.
- No other medical claims, no advice, and no numbers except inside the placeholders.
- Set "language" to the English name of the language exactly as listed above.`;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

const geminiGenerator: DraftGenerator = async (plan, indicator) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(plan, indicator),
    config: { responseMimeType: "application/json", responseSchema: SCHEMA },
  });
  const parsed = JSON.parse(res.text ?? "") as { drafts?: Draft[] };
  return parsed.drafts ?? [];
};

/** English-only template used when Gemini is unavailable. */
export function fallbackDrafts(indicator: Indicator): Draft[] {
  const p = programmeName(indicator);
  return [{
    language: "English",
    invitation:
      `You are invited to free ${p} cancer screening. The screening is free of charge. ` +
      `To book or change your time, call [phone] or go to [link]. You may bring an interpreter with you.`,
    sms: `Free ${p} cancer screening: book or change your time at [link] or call [phone]. You may bring an interpreter.`,
    backTranslation: "Same text (English template; no translation was made).",
  }];
}

const cache = new Map<string, { at: number; drafts: Draft[] }>();
export const resetReachDraftsCache = () => cache.clear();

const valid = (d: Draft[]) =>
  d.length > 0 && d.every((x) => x && [x.language, x.invitation, x.sms, x.backTranslation].every((s) => typeof s === "string" && s.trim()));

/**
 * One Gemini call for all languages in the plan, cached 24 h per (indicator, sorted languages).
 * Any error, timeout, missing key or unusable answer gives an English template and is not cached.
 */
export async function getReachDrafts(
  plan: ReachPlan,
  indicator: Indicator,
  generate: DraftGenerator = geminiGenerator,
  timeoutMs = TIMEOUT_MS,
): Promise<ReachDrafts> {
  const key = `${indicator.id}|${plan.languages.map((l) => l.language).sort().join(",")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { status: "ok", drafts: hit.drafts };
  try {
    const drafts = await withTimeout(generate(plan, indicator), timeoutMs);
    if (!valid(drafts)) throw new Error("unusable answer");
    cache.set(key, { at: Date.now(), drafts });
    return { status: "ok", drafts };
  } catch (err) {
    console.warn("[reachDrafts] using fallback:", err instanceof Error ? err.message : err);
    return { status: "fallback", drafts: fallbackDrafts(indicator) };
  }
}
