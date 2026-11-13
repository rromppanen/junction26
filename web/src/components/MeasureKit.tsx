import { MEASURES } from "@/data/measureKit";
import { EVIDENCE } from "@/data/evidence";

/** Turns the missing referral and diagnosis data into a monthly recording kit with a CSV template. */
export function MeasureKit({ regionId, name }: { regionId: number; name: string }) {
  const ev = EVIDENCE.find((e) => e.id === MEASURES[0].evidenceId);
  return (
    <section className="mb-14 print-break" aria-labelledby="mk-h">
      <h2 id="mk-h" className="mb-2 text-2xl font-semibold tracking-tight">Start measuring</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        No public data exists for these stages. Start recording these three numbers monthly, so {name} can see its own delays.
      </p>
      <ol className="border-t border-ink">
        {MEASURES.map((m, i) => (
          <li key={m.id} className="print-break grid gap-x-6 border-b border-rule py-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
            <span className="font-narrow text-4xl font-bold leading-none tabular-nums" aria-hidden>{i + 1}</span>
            <div>
              <h3 className="font-semibold leading-snug">{m.nameEn}</h3>
              <p className="text-xs text-muted">{m.nameFi}</p>
              <p className="mt-1 font-serif text-lg leading-snug">{m.definition}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">
        Target times: THL guidance 21/2016, Goal 3 of the National Cancer Strategy
        {ev && <> (<a href={ev.url} target="_blank" rel="noreferrer" className="link">{ev.titleEn}</a>)</>}.
      </p>
      <a href={`/county/${regionId}/measure`} download className="no-print link mt-4 inline-block text-sm font-semibold">
        Download the CSV template
      </a>
    </section>
  );
}
