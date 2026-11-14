import { GoogleGenAI, Type } from "@google/genai";
import { barrier, classifyReply, isBarrierKind, type Barrier, BARRIERS } from "./barrier";
import { hasRequiredPlaceholders, outreachPrompt, templateOutreach, type Outreach } from "./message";
import type { Patient } from "./patients";

// Same model setting as the analyst (see analyst.ts).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

async function gemini(prompt: string, schema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const res = await withTimeout(
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    }),
    TIMEOUT_MS,
  );
  return JSON.parse(res.text ?? "");
}

/** Draft the first outreach text. Falls back to a checked template if Gemini fails or drops the placeholder. */
export async function draftOutreach(patient: Patient): Promise<Outreach> {
  try {
    const out = (await gemini(outreachPrompt(patient), {
      type: Type.OBJECT,
      properties: { sms: { type: Type.STRING }, backTranslation: { type: Type.STRING } },
      required: ["sms", "backTranslation"],
    })) as { sms?: string; backTranslation?: string };
    if (out.sms && out.backTranslation && hasRequiredPlaceholders(out.sms) && out.sms.length <= 480) {
      return { language: patient.language, sms: out.sms, backTranslation: out.backTranslation, source: "gemini" };
    }
  } catch {
    // Fall through to the template.
  }
  return templateOutreach(patient);
}

export type ReadReply = Barrier & { source: "gemini" | "rules"; translation?: string };

/** Read a patient's reply in any language and name the barrier. */
export async function readReply(text: string): Promise<ReadReply> {
  const kinds = Object.entries(BARRIERS).map(([k, v]) => `- ${k}: ${v.label}`).join("\n");
  try {
    const out = (await gemini(
      `A patient with a positive bowel screening test replied to the nurse's text message about booking a colonoscopy.
Classify the main barrier in the reply as exactly one of these kinds:
${kinds}
Also give an English translation of the reply.

Reply: """${text.slice(0, 600)}"""`,
      {
        type: Type.OBJECT,
        properties: { kind: { type: Type.STRING }, translation: { type: Type.STRING } },
        required: ["kind", "translation"],
      },
    )) as { kind?: string; translation?: string };
    if (isBarrierKind(out.kind)) return { ...barrier(out.kind), source: "gemini", translation: out.translation };
  } catch {
    // Fall through to the rules.
  }
  return { ...classifyReply(text), source: "rules" };
}
