import { generateBrief, type AnalystInput } from "./analyst";
import type { Brief } from "./types";

const TTL_MS = 10 * 60_000;

/** Memoises brief generation per region + language for 10 minutes; concurrent calls share one request; rejections are not cached. */
export function createBriefCache(
  generate: (input: AnalystInput) => Promise<Brief>,
  now: () => number = Date.now,
): (input: AnalystInput) => Promise<Brief> {
  const entries = new Map<string, { at: number; promise: Promise<Brief> }>();
  return (input) => {
    const key = `${input.regionName}|${input.language ?? "en"}`;
    const hit = entries.get(key);
    if (hit && now() - hit.at < TTL_MS) return hit.promise;
    const promise = generate(input);
    const entry = { at: now(), promise };
    entries.set(key, entry);
    // Don't pin failures: a rejection, or a template fallback after a transient Gemini failure, is dropped once settled.
    const drop = () => {
      if (entries.get(key) === entry) entries.delete(key);
    };
    promise.then((b) => { if (b.generatedBy === "fallback") drop(); }, drop);
    return promise;
  };
}

export const getBrief = createBriefCache(generateBrief);
