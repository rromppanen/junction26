import { ExternalLink } from "lucide-react";
import { MORTALITY_SOURCE, type CountyMortality, type SexMortality } from "@/lib/mortality";
import { EvidenceTag } from "@/components/simulator/EvidenceTag";
import { StatusIcon } from "@/components/ui";
import { STATUS_TEXT } from "@/components/format";

const n1 = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Figure({ label, m }: { label: string; m: SexMortality }) {
  const pct = (Math.abs(m.rate - m.national) / m.national) * 100;
  const text =
    m.status === "on-par"
      ? `about level with Finland (${m.diff > 0 ? "+" : m.diff < 0 ? "−" : "±"}${n1(Math.abs(m.diff))})`
      : `${n1(Math.abs(m.diff))} ${m.diff > 0 ? "more" : "fewer"} than Finland (${pct.toFixed(0)}% ${m.diff > 0 ? "higher" : "lower"})`;
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <strong className="font-narrow text-3xl font-bold tabular-nums">{n1(m.rate)}</strong>
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${STATUS_TEXT[m.status]}`}>
          {m.status !== "no-data" && <StatusIcon status={m.status} />}
          {text}
        </span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Finland {n1(m.national)}. {m.rank === 1 ? "Lowest" : `${m.rank} of ${m.rankOf}`}, lowest first. {m.deaths.toLocaleString("en-GB")} deaths.
      </p>
    </div>
  );
}

/**
 * Goal 3's headline measure for one county: cancer deaths per 100,000, age-standardised, 2020–2024.
 * Lower is better, so "behind" here means more deaths than Finland.
 */
export function MortalityPanel({ m, name }: { m: CountyMortality; name: string }) {
  return (
    <article className="print-break border-b border-rule pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold leading-snug">Cancer deaths per 100,000, {m.period}</h3>
        <EvidenceTag kind="observed" />
      </div>
      <p className="mt-0.5 max-w-2xl text-sm text-muted">
        The headline measure of Goal 3: the National Cancer Strategy aims for 10% fewer cancer deaths (strategy p. 5).
        Age-standardised, so {name} compares fairly with older and younger counties.
      </p>
      <div className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <Figure label="Women" m={m.women} />
        <Figure label="Men" m={m.men} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Within 3% of Finland counts as level; in small counties the rate moves by chance from year to year.{" "}
        <a href={MORTALITY_SOURCE.url} className="link inline-flex items-center gap-0.5" target="_blank" rel="noreferrer">
          {MORTALITY_SOURCE.label}
          <ExternalLink aria-hidden size={11} />
        </a>
      </p>
    </article>
  );
}
