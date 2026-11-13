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
  const screening = `${fp.detectionBehind} of ${fp.detectionTotal} screening programmes below the national level`;
  const survival = `${fp.outcomeBehind} of ${fp.outcomeTotal} survival measures below the national level`;
  switch (fp.pattern) {
    case "detection":
      return `Detection is the weak point: ${screening}; survival is on par.`;
    case "after-detection":
      return `The gap appears after detection: ${survival}, while screening is on par.`;
    case "both":
      return `The gap runs through the whole pathway: ${screening} and ${survival}.`;
    case "none":
      return "No gap found: screening and survival are both on par with or ahead of the national level.";
    default:
      return "Not enough data to say where the gap starts.";
  }
}
