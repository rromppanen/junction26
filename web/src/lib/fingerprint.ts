import type { GapFacts, Indicator } from "./types";

export type GapPattern = "detection" | "after-detection" | "both" | "none" | "unknown";

export type Fingerprint = {
  pattern: GapPattern;
  detectionBehind: number;
  detectionTotal: number;
  outcomeBehind: number;
  outcomeTotal: number;
};

/** Compares detection indicators (screening) with outcome indicators (survival) to locate where the gap starts. */
export function diagnosePathway(facts: GapFacts[], indicators: Indicator[]): Fingerprint {
  const c = { detectionBehind: 0, detectionTotal: 0, outcomeBehind: 0, outcomeTotal: 0 };
  for (const f of facts) {
    if (f.status === "no-data") continue;
    const stage = indicators.find((i) => i.id === f.indicatorId)?.stage;
    if (stage === "detection") {
      c.detectionTotal++;
      if (f.status === "behind") c.detectionBehind++;
    } else if (stage === "outcome") {
      c.outcomeTotal++;
      if (f.status === "behind") c.outcomeBehind++;
    }
  }
  const d = c.detectionBehind > 0;
  const o = c.outcomeBehind > 0;
  let pattern: GapPattern;
  if (c.detectionTotal + c.outcomeTotal === 0) pattern = "unknown";
  else if (d && o) pattern = "both";
  else if (d) pattern = "detection";
  else if (o) pattern = "after-detection";
  else pattern = "none";
  return { pattern, ...c };
}

/** One-line plain-English diagnosis, rendered by the UI (not by Gemini). */
export function describeFingerprint(fp: Fingerprint): string {
  const noScreening = fp.detectionTotal === 0;
  const noSurvival = fp.outcomeTotal === 0;
  const screening = `${fp.detectionBehind} of ${fp.detectionTotal} screening programmes below the national level`;
  const survival = `${fp.outcomeBehind} of ${fp.outcomeTotal} survival measures below the national level`;
  switch (fp.pattern) {
    case "detection":
      return noSurvival
        ? `Detection is the weak point: ${screening}; there is no survival data to compare.`
        : `Detection is the weak point: ${screening}; survival is at or above the national level.`;
    case "after-detection":
      return noScreening
        ? `The gap is in outcomes: ${survival}; there is no screening data to compare.`
        : `The gap appears after detection: ${survival}, while screening is at or above the national level.`;
    case "both":
      return `The gap runs through the whole pathway: ${screening} and ${survival}.`;
    case "none":
      if (noScreening) return "No gap found in survival, which is at or above the national level; there is no screening data.";
      if (noSurvival) return "No gap found in screening, which is at or above the national level; there is no survival data.";
      return "No gap found: screening and survival are both at or above the national level.";
    default:
      return "Not enough data to say where the gap starts.";
  }
}
