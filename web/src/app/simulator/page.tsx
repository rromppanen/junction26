import type { Metadata } from "next";
import { ArrowLeft, BookOpen, ExternalLink, Info } from "lucide-react";
import { getDataset } from "@/lib/data";
import { CONTEXT_INDICATORS, indicatorBySlug } from "@/data/indicators";
import { latestYear } from "@/lib/gap";
import { spearman } from "@/lib/simulator";
import { SIMULATOR_EVIDENCE } from "@/data/simulatorEvidence";
import { AppHeader, HeaderLink, IconHeading, More } from "@/components/ui";
import { DataBadge } from "@/components/DataBadge";
import { Colophon } from "@/components/Colophon";
import { shortName } from "@/components/format";
import { EvidenceTag } from "@/components/simulator/EvidenceTag";
import { ScreeningSimulator } from "@/components/simulator/ScreeningSimulator";
import type { SimCounty } from "@/components/simulator/types";
import WOMEN from "@/data/women5069.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Breast screening simulator" };

function slope(points: { year: number; value: number }[]): number | null {
  if (points.length < 2) return null;
  const mx = points.reduce((s, p) => s + p.year, 0) / points.length;
  const my = points.reduce((s, p) => s + p.value, 0) / points.length;
  const den = points.reduce((s, p) => s + (p.year - mx) ** 2, 0);
  return den > 0 ? points.reduce((s, p) => s + (p.year - mx) * (p.value - my), 0) / den : null;
}

export default async function SimulatorPage({ searchParams }: { searchParams: Promise<{ county?: string }> }) {
  const sp = await searchParams;
  const ds = await getDataset();
  const ind = indicatorBySlug("breast-screening")!;
  const popInd = CONTEXT_INDICATORS.find((c) => c.slug === "population")!;
  const fbInd = CONTEXT_INDICATORS.find((c) => c.slug === "foreign-background")!;
  const year = latestYear(ds, ind);
  const nationalRegion = ds.regions.find((r) => r.kind === "national");
  const years = [...new Set(ds.values.filter((v) => v.indicatorId === ind.id).map((v) => v.year))].sort((a, b) => a - b).slice(-6);

  const valueAt = (indicatorId: number, regionId: number, y: number) =>
    ds.values.find((v) => v.indicatorId === indicatorId && v.regionId === regionId && v.year === y)?.value ?? null;
  const latestUpTo = (indicatorId: number, regionId: number) =>
    ds.values
      .filter((v) => v.indicatorId === indicatorId && v.regionId === regionId && v.year <= year)
      .sort((a, b) => b.year - a.year)[0]?.value ?? null;

  const nationalByYear = new Map(years.map((y) => [y, nationalRegion ? valueAt(ind.id, nationalRegion.id, y) : null]));
  const national = nationalByYear.get(year) ?? null;

  const counties: SimCounty[] = [];
  const fbPairs: [number, number][] = [];
  for (const r of ds.regions.filter((x) => x.kind === "county")) {
    const attendance = valueAt(ind.id, r.id, year);
    const population = latestUpTo(popInd.id, r.id);
    if (attendance === null || population === null) continue;
    const series = years
      .map((y) => ({ year: y, value: valueAt(ind.id, r.id, y) }))
      .filter((p): p is { year: number; value: number } => p.value !== null);
    const compared = series.filter((p) => nationalByYear.get(p.year) != null);
    const persistent = compared.length > 0 && compared.every((p) => p.value < (nationalByYear.get(p.year) as number));
    const women = (WOMEN.counties as Record<string, number>)[String(r.id)];
    counties.push({ id: r.id, name: shortName(r.name), attendance, population, women, persistent, trend: slope(series) });
    const fb = latestUpTo(fbInd.id, r.id);
    if (fb !== null) fbPairs.push([attendance, fb]);
  }
  const rho = spearman(fbPairs.map((p) => p[0]), fbPairs.map((p) => p[1]));
  const best = [...counties].sort((a, b) => b.attendance - a.attendance)[0];

  const reqFocus = Number(sp.county);
  const initialFocus = counties.some((c) => c.id === reqFocus) ? reqFocus : null;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href={initialFocus !== null ? `/county/${initialFocus}` : "/"} icon={ArrowLeft} label={initialFocus !== null ? "County brief" : "Map"} />
        <DataBadge ds={ds} />
      </AppHeader>

      <ScreeningSimulator counties={counties} national={national} year={year} initialFocus={initialFocus} />

      <section className="mt-16 border-t border-rule pt-6" aria-labelledby="why-h">
        <IconHeading icon={BookOpen} id="why-h" className="text-xl">Why the gap matters</IconHeading>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Each point says how it is known. Observed points come from a measured, published source; inferred points are
          readings of those figures that still need checking; expert insights come from a named person.
        </p>
        <ul className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {best && (
            <li className="grid gap-1.5">
              <EvidenceTag kind="observed" />
              <p className="max-w-prose">
                {best.name} has the highest breast screening attendance, {best.attendance.toFixed(1)}% in {year}. The
                simulator&rsquo;s default target of 85% is what the best counties already reach.
              </p>
              <a href={ind.sourceUrl} className="link inline-flex items-center gap-1 text-xs text-muted" target="_blank" rel="noreferrer">
                Sotkanet indicator {ind.id} <ExternalLink aria-hidden size={11} />
              </a>
            </li>
          )}
          {rho !== null && (
            <li className="grid gap-1.5">
              <EvidenceTag kind="inferred" />
              <p className="max-w-prose">
                Across {fbPairs.length} counties, attendance is lower where more residents have a foreign background
                (Spearman {rho < 0 ? "−" : ""}{Math.abs(rho).toFixed(2)}). This is an area-level association, not proof of
                who doesn&rsquo;t attend; outreach in other languages is a hypothesis to test.
              </p>
              <a href={fbInd.sourceUrl} className="link inline-flex items-center gap-1 text-xs text-muted" target="_blank" rel="noreferrer">
                Sotkanet indicators {ind.id} and {fbInd.id} <ExternalLink aria-hidden size={11} />
              </a>
            </li>
          )}
          {SIMULATOR_EVIDENCE.map((e) => (
            <li key={e.id} className="grid gap-1.5">
              <EvidenceTag kind={e.kind} />
              <p className="max-w-prose">{e.claim}</p>
              <p className="text-xs text-muted">
                {e.url ? (
                  <a href={e.url} className="link" target="_blank" rel="noreferrer">{e.citation}</a>
                ) : (
                  e.citation
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-rule pt-6" aria-labelledby="limits-h">
        <IconHeading icon={Info} id="limits-h" className="text-xl">What this model leaves out</IconHeading>
        <ul className="mt-3 grid max-w-3xl list-disc gap-2 pl-5 text-sm">
          <li>
            <strong>Calibrated, not measured.</strong> Finland publishes no stage at diagnosis by screening attendance.
            The model&rsquo;s stage figures are set so that they reproduce two published Finnish results: the share of
            cancers found localized, and 28% lower breast cancer mortality among screened women. Survival by stage is
            from US data, and treatment costs are specialised care at 2019 prices.
          </li>
          <li>
            <strong>Self-selection.</strong> Women who skip screening differ in other ways too. The 28% is corrected for
            that, but women brought in by outreach may gain less than today&rsquo;s attenders. Like Shafik et al., there
            is no natural-history model.
          </li>
          <li>
            <strong>Simplifications.</strong> Survival and costs are fixed per stage; no QALYs, no discounting, no harm from
            false positives; overdiagnosis is a single extra-cases term.
          </li>
          <li>
            <strong>Scope.</strong> Steady state, women aged 50–69, one year of diagnoses, screening every two years.
          </li>
        </ul>
        <More label="Where the model comes from" className="mt-3">
          The model adapts the stage-distribution approach of Shafik et al. (2022), &ldquo;Flexible transition probability
          model for assessing cost-effectiveness of breast cancer screening&rdquo; (arXiv 2209.01216), to one question: what
          would closing a county&rsquo;s attendance gap be worth? The calculations run in your browser and are covered by
          tests that reproduce the team&rsquo;s notebook.
        </More>
      </section>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <More label="About Läpi" className="basis-full">
          <Colophon />
        </More>
      </footer>
    </main>
  );
}
