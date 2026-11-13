import type { GapFacts, Indicator } from "@/lib/types";
import { describeFingerprint, diagnosePathway } from "@/lib/fingerprint";

/** One-line diagnosis of where along the pathway this county falls behind. */
export function PathwayFingerprint({ facts, indicators }: { facts: GapFacts[]; indicators: Indicator[] }) {
  const fp = diagnosePathway(facts, indicators);
  return (
    <section className="mb-10" aria-labelledby="fp-h">
      <h2 id="fp-h" className="mb-1 text-sm text-muted">Where the gap starts</h2>
      <p className="max-w-3xl font-serif text-xl leading-snug">{describeFingerprint(fp)}</p>
    </section>
  );
}
