import { MEASURES } from "@/data/measureKit";
import { EVIDENCE } from "@/data/evidence";

/** Turns the missing referral and diagnosis data into a monthly recording kit with a CSV template. */
export function MeasureKit({ regionId, sourceNo }: { regionId: number; sourceNo?: number }) {
  const ev = EVIDENCE.find((e) => e.id === MEASURES[0].evidenceId);
  return (
    <>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        No county in Finland publishes referral or diagnosis delay data, so these stages can&rsquo;t be compared yet. Start recording these three numbers monthly.
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
        Measures follow THL guidance 21/2016 on monitoring access to cancer care; the national strategy measures Goal 3 by whether patients start treatment within these target times.{" "}
        {ev && (
          <a href={sourceNo ? `#src-${sourceNo}` : ev.url} className="link">
            {sourceNo ? `[${sourceNo}] ` : ""}{ev.titleEn}
          </a>
        )}
      </p>
      <a href={`/county/${regionId}/measure`} download className="no-print link mt-4 inline-block text-sm font-semibold">
        Download the CSV template
      </a>
    </>
  );
}
