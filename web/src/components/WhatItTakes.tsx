import type { GapFacts, Indicator } from "@/lib/types";
import { peoplePer1000ToReach } from "@/lib/impact";

/** Sizes each screening gap in people per 1,000 invited, in full and halfway. */
export function WhatItTakes({ facts, indicators }: { facts: GapFacts[]; indicators: Indicator[] }) {
  const rows = indicators
    .filter((i) => i.target)
    .map((ind) => ({ ind, f: facts.find((x) => x.indicatorId === ind.id) }));
  if (rows.length === 0) return null;
  return (
    <section className="mb-14 print-break" aria-labelledby="wit-h">
      <h2 id="wit-h" className="mb-2 text-2xl font-semibold tracking-tight">What would it take?</h2>
      <p className="mb-6 text-sm text-muted">The screening gap in people: how many more of every 1,000 invited need to attend.</p>
      <div className="border-t border-ink">
        {rows.map(({ ind, f }) => {
          const target = ind.target?.value ?? f?.target ?? null;
          const value = f?.value ?? null;
          const full = peoplePer1000ToReach(value, target);
          const half = value === null || target === null ? null : peoplePer1000ToReach(value, value + (target - value) / 2);
          return (
            <article key={ind.id} className="print-break border-b border-rule py-5">
              <h3 className="font-semibold leading-snug">{ind.nameEn}</h3>
              {full === null || half === null ? (
                <p className="mt-2 text-sm text-muted">No data for this year.</p>
              ) : full === 0 ? (
                <p className="mt-2 text-ahead">Already at or above the {target}% target.</p>
              ) : (
                <ul className="mt-2 space-y-1 font-serif text-lg leading-snug">
                  <li>To reach {target}%: about <strong className="tabular-nums">{full}</strong> more of every 1,000 invited people need to attend.</li>
                  <li>Halfway there: about <strong className="tabular-nums">{half}</strong> more of every 1,000.</li>
                </ul>
              )}
              <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">
                <span>Sotkanet {ind.id}</span>
                <span>{ind.target?.evidenceId}</span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
