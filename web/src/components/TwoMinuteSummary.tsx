import { ArrowDown, Clock } from "lucide-react";
import type { SummaryLine } from "@/lib/summary";

/**
 * The county page's opening box: five sentences a board member can read in two minutes,
 * each linking down to the section that shows the working.
 */
export function TwoMinuteSummary({ lines }: { lines: SummaryLine[] }) {
  if (lines.length === 0) return null;
  return (
    <section aria-labelledby="summary-h" className="mt-8 rounded-[4px] bg-surface px-4 py-5 sm:px-6">
      <h2 id="summary-h" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-muted">
        <Clock aria-hidden size={15} strokeWidth={2} />
        One decision to explore
      </h2>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
        {lines.map((l) => (
          <div key={l.key} className="contents">
            <dt className="text-sm font-semibold sm:pt-0.5">{l.label}</dt>
            <dd className="max-w-3xl leading-snug">
              {l.text}{" "}
              <a href={l.href} className="link inline-flex items-center gap-0.5 whitespace-nowrap text-sm text-muted">
                View evidence
                <ArrowDown aria-hidden size={13} />
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
