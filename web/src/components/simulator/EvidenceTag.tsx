import { EVIDENCE_KIND_HELP, EVIDENCE_KIND_LABEL, type EvidenceKind } from "@/data/simulatorEvidence";

/**
 * A small label that says how a figure is known: observed, inferred, simulated or expert insight.
 * Ink and grey only, so it never reads as an ahead/behind status.
 */
export function EvidenceTag({ kind, className = "" }: { kind: EvidenceKind; className?: string }) {
  const filled = kind === "simulated";
  return (
    <span
      title={EVIDENCE_KIND_HELP[kind]}
      className={`inline-flex shrink-0 items-center rounded-[3px] px-1.5 py-px text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] ${
        filled ? "bg-ink text-paper" : kind === "observed" ? "border border-ink text-ink" : "border border-dashed border-par text-muted"
      } ${className}`}
    >
      {EVIDENCE_KIND_LABEL[kind]}
    </span>
  );
}

/** Marks an assumption that is still illustrative. */
export function PlaceholderTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Illustrative value. Replace it with a sourced figure before quoting a result."
      className={`inline-flex shrink-0 items-center rounded-[3px] bg-par-soft px-1.5 py-px text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] text-muted ${className}`}
    >
      Placeholder
    </span>
  );
}
