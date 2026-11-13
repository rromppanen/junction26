import type { GapFacts, Indicator } from "@/lib/types";
import { describeFingerprint, diagnosePathway } from "@/lib/fingerprint";

/**
 * One-sentence diagnosis of where along the pathway this county falls behind. Calculated by a rule,
 * not written by the AI, so it is set in the plain UI face.
 */
export function PathwayFingerprint({ facts, indicators }: { facts: GapFacts[]; indicators: Indicator[] }) {
  const fp = diagnosePathway(facts, indicators);
  return <p className="max-w-2xl text-lg leading-snug">{describeFingerprint(fp)}</p>;
}
