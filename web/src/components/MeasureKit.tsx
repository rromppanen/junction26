import { MEASURES } from "@/data/measureKit";
import { EVIDENCE } from "@/data/evidence";
import { Download } from "lucide-react";
import { More } from "@/components/ui";

/** Turns the missing referral and diagnosis data into a monthly recording kit with a CSV template. */
export function MeasureKit({ regionId, sourceNo }: { regionId: number; sourceNo?: number }) {
  const ev = EVIDENCE.find((e) => e.id === MEASURES[0].evidenceId);
  return (
    <>
      <p className="mb-5 max-w-2xl">No county publishes referral or diagnosis delays yet. Record these three numbers monthly.</p>
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
      <a
        href={`/county/${regionId}/measure`}
        download
        className="no-print mt-4 inline-flex items-center gap-2 rounded-[3px] bg-ink px-3.5 py-2 text-sm font-semibold text-paper hover:bg-ink/85"
      >
        <Download aria-hidden size={16} />
        Download CSV template
      </a>
      <More label="Where these measures come from" className="mt-3">
        Measures follow THL guidance 21/2016 on monitoring access to cancer care; the national strategy measures Goal 3
        by whether patients start treatment within these target times.{" "}
        {ev && (
          <a href={sourceNo ? `#src-${sourceNo}` : ev.url} className="link">
            {sourceNo ? `[${sourceNo}] ` : ""}{ev.titleEn}
          </a>
        )}
      </More>
    </>
  );
}
