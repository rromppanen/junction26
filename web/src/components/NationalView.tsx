import Link from "next/link";
import { ArrowRight, BellRing, TrendingUp, Microscope, Route, Search, Gauge, Hammer, RefreshCw, type LucideIcon } from "lucide-react";
import type { Improver, LanguageGap, NationalPathway, Warning } from "@/lib/national";
import { EvidenceTag } from "@/components/simulator/EvidenceTag";
import { CountyPicker } from "./CountyPicker";

const n0 = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const n1 = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Step = { icon: LucideIcon; name: string; what: string; href: string };

/**
 * The national layer: where Finland loses people on the cancer pathway, what matching the best quarter of
 * counties would add, which counties are getting worse, and the learning loop the app is built around.
 */
export function NationalView({
  n,
  languages,
  warnings,
  rising = [],
  countyName,
  indicatorName,
  example,
  counties,
  registryUrl,
}: {
  n: NationalPathway;
  languages: LanguageGap[];
  warnings: Warning[];
  rising?: Improver[];
  countyName: (id: number) => string;
  indicatorName: (id: number) => string;
  example: { id: number; name: string };
  counties: { id: number; name: string }[];
  registryUrl: string;
}) {
  const steps: Step[] = [
    { icon: Search, name: "Detect", what: "Where the gaps are, and which are growing", href: "#national" },
    { icon: Microscope, name: "Understand", what: "The pathway step where people fall off", href: `/county/${example.id}#funnel` },
    { icon: Gauge, name: "Simulate", what: "Compare options and what they cost", href: `/county/${example.id}#decide` },
    { icon: Hammer, name: "Implement", what: "Board memo, invitations in other languages", href: `/county/${example.id}/memo` },
    { icon: RefreshCw, name: "Learn", what: "Measure monthly, learn from peer counties", href: `/county/${example.id}#mk` },
  ];
  const shownWarnings = warnings.slice(0, 6);

  return (
    <section id="national" aria-labelledby="national-h" className="mb-12 scroll-mt-4 rounded-lg bg-surface px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="national-h" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Route aria-hidden size={18} className="text-muted" /> Finland&rsquo;s cancer pathway, nationally
        </h2>
        <CountyPicker counties={counties} />
      </div>

      <div className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-3">
        <div>
          <p className="font-narrow text-3xl font-bold tabular-nums">{n1(n.unexaminedPct)}%</p>
          <p className="mt-1 text-sm">
            of positive bowel-screening tests had no colonoscopy in the programme: {n0(n.unexamined)} of {n0(n.positive)} ({n.year}).
          </p>
        </div>
        {n.missed && (
          <div>
            <p className="font-narrow text-3xl font-bold tabular-nums">{n1(n.missed.sharePct)}%</p>
            <p className="mt-1 text-sm">
              of bowel cancers in the {n.missed.cohortYear} screening cohort were in people the programme lost: {n0(n.missed.nonParticipant)} never
              returned the test, {n0(n.missed.positiveNoColonoscopy)} had a positive test and no colonoscopy.
            </p>
          </div>
        )}
        {languages.length > 0 && (
          <div>
            <p className="font-narrow text-3xl font-bold tabular-nums">
              {n0(Math.min(...languages.map((l) => l.other)))}–{n0(Math.max(...languages.map((l) => l.other)))}%
            </p>
            <p className="mt-1 text-sm">
              screening participation for people whose mother tongue isn&rsquo;t Finnish, Swedish or Sami, against{" "}
              {n0(Math.min(...languages.map((l) => l.native)))}–{n0(Math.max(...languages.map((l) => l.native)))}% for everyone else ({languages[0].year}, all three programmes).
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <EvidenceTag kind="observed" />
        <a href={registryUrl} className="link" target="_blank" rel="noreferrer">Finnish Cancer Registry screening statistics</a>
      </p>

      <div className="mt-6 border-t border-rule pt-5">
        <p className="max-w-3xl">
          <strong>If every county matched the best quarter of counties</strong> at both breaks, about {n0(n.bestQuarter.participants)} more
          people a year would return the bowel test and {n0(n.bestQuarter.colonoscopies)} more positives would get a colonoscopy: about{" "}
          {n1(n.bestQuarter.cancers)} cancers and {n0(n.bestQuarter.advanced)} advanced precursors found a year.
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <EvidenceTag kind="simulated" /> Summed over {n.bestQuarter.counties} counties at Finland&rsquo;s yield per colonoscopy ({n.year} counts).
        </p>
      </div>

      <div className="mt-6 grid gap-x-10 gap-y-6 border-t border-rule pt-5 lg:grid-cols-2">
      {shownWarnings.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <BellRing aria-hidden size={16} className="text-muted" /> Early warning: screening falling over three years
          </h3>
          <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {shownWarnings.map((w) => (
              <li key={`${w.regionId}-${w.indicatorId}`} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/county/${w.regionId}`} className="link font-medium">{countyName(w.regionId)}</Link>
                <span className="text-muted">
                  {indicatorName(w.indicatorId)}: <span className="font-semibold text-behind">−{n1(w.drop)} points</span> to {n1(w.value)}% ({w.year})
                  {w.belowTarget ? ", below the 80% target" : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <EvidenceTag kind="observed" /> A fall of a point or more against three years earlier, Sotkanet.{" "}
            {warnings.length > shownWarnings.length ? `${warnings.length - shownWarnings.length} more not shown.` : ""}
          </p>
        </div>
      )}
      {rising.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp aria-hidden size={16} className="text-muted" /> Replicate what works: screening rising over three years
          </h3>
          <ul className="mt-3 grid gap-y-1.5 text-sm">
            {rising.slice(0, 6).map((w) => (
              <li key={`${w.regionId}-${w.indicatorId}`} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/county/${w.regionId}#peer`} className="link font-medium">{countyName(w.regionId)}</Link>
                <span className="text-muted">
                  {indicatorName(w.indicatorId)}: <span className="font-semibold text-ahead">+{n1(w.rise)} points</span> to {n1(w.value)}% ({w.year})
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <EvidenceTag kind="observed" /> A rise of a point or more against three years earlier, Sotkanet. Ask them what changed.
          </p>
        </div>
      )}
      </div>

      <div className="mt-6 border-t border-rule pt-5">
        <h3 className="font-semibold">The learning loop, shown on {example.name}</h3>
        <ol className="mt-3 grid gap-2 sm:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.name}>
              <a href={s.href} className="group flex h-full flex-col gap-1 rounded-md border border-rule bg-paper px-3 py-2.5 hover:border-ink">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <s.icon aria-hidden size={15} className="text-muted" />
                  {i + 1}. {s.name}
                  <ArrowRight aria-hidden size={13} className="ml-auto text-muted opacity-0 group-hover:opacity-100" />
                </span>
                <span className="text-xs leading-snug text-muted">{s.what}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
