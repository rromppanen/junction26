import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataset } from "@/lib/data";
import { CONTEXT_INDICATORS, INDICATORS, indicatorById } from "@/data/indicators";
import { EVIDENCE } from "@/data/evidence";
import { computeGap, latestYear } from "@/lib/gap";
import { generateBrief } from "@/lib/analyst";
import { getLiveContext, type LiveSnippet } from "@/lib/context";
import { TrendChart } from "@/components/TrendChart";
import { PathwayFingerprint } from "@/components/PathwayFingerprint";
import { WhatItTakes } from "@/components/WhatItTakes";
import { LeftBehind } from "@/components/LeftBehind";
import { equityFacts } from "@/lib/equity";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { STATUS_LABEL, STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";

export const dynamic = "force-dynamic";

type Source = { id: string; label: string; url: string; detail?: string };

function resolveSource(id: string, live: LiveSnippet[] = []): Source {
  if (id.startsWith("live:")) {
    const s = live.find((l) => l.id === id);
    return s
      ? { id, label: `Web page: ${s.title}`, url: s.url, detail: s.text }
      : { id, label: id, url: "#" };
  }
  if (id.startsWith("sotkanet:")) {
    const n = Number(id.slice(9));
    const ind = indicatorById(n) ?? CONTEXT_INDICATORS.find((c) => c.id === n);
    return ind
      ? { id, label: `Sotkanet: ${ind.nameEn}`, url: ind.sourceUrl, detail: ind.nameFi }
      : { id, label: id, url: "https://sotkanet.fi" };
  }
  const ev = EVIDENCE.find((e) => e.id === id);
  if (!ev) return { id, label: id, url: "#" };
  const docName = ev.doc === "strategy" ? "National Cancer Strategy" : ev.doc === "roadmap" ? "Cancer roadmap" : "Challenge brief";
  return {
    id,
    label: `${docName}${ev.page ? `, p. ${ev.page}` : ""}: ${ev.titleEn}`,
    url: ev.url,
    detail: ev.summaryEn,
  };
}

export default async function CountyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regionId = Number(id);
  const ds = await getDataset();
  const region = ds.regions.find((r) => r.id === regionId && r.kind === "county"); // municipalities 404
  if (!region) notFound();
  const nationalRegion = ds.regions.find((r) => r.isNational);
  const name = shortName(region.name);

  const facts = INDICATORS.map((ind) => computeGap(ds, ind, regionId, latestYear(ds, ind)));
  const live = await getLiveContext(region.name);
  const equity = equityFacts(ds, regionId, INDICATORS, CONTEXT_INDICATORS);
  const brief = await generateBrief({ regionName: name, facts, indicators: INDICATORS, live: live.snippets, equity });

  const sourceIds = [...new Set(brief.recommendations.flatMap((r) => r.sources))];
  const sources = sourceIds.map((s) => resolveSource(s, live.snippets));
  const sourceIndex = new Map(sources.map((s, i) => [s.id, i + 1]));

  // Best-quartile boundary for every year the indicator has county figures (independent of the county).
  const bestSeries = (ind: (typeof INDICATORS)[number]) =>
    [...new Set(ds.values.filter((v) => v.indicatorId === ind.id).map((v) => v.year))]
      .map((y) => ({ year: y, value: computeGap(ds, ind, regionId, y).bestQuartile }))
      .filter((p): p is { year: number; value: number } => p.value !== null);

  const series = (indId: number, rId: number | undefined) =>
    ds.values.filter((v) => v.indicatorId === indId && v.regionId === rId).map((v) => ({ year: v.year, value: v.value }));

  const byGemini = brief.generatedBy === "gemini";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <nav className="no-print mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm">
        <Link href="/" className="link">Back to the map</Link>
        <span className="text-xs text-muted">
          {byGemini
            ? "Written by Gemini from the figures on this page"
            : "Written from a fixed template; the AI analyst didn\u2019t answer"}
        </span>
      </nav>

      <header className="mb-12">
        <p className="text-sm text-muted">Cancer care brief for</p>
        <h1 className="font-narrow mt-1 text-5xl font-bold leading-[0.95] tracking-[-0.01em] break-words sm:text-7xl">{name}</h1>
        <p className="mt-6 max-w-3xl font-serif text-2xl leading-snug sm:text-[1.75rem]">{brief.headline}</p>
        <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">{brief.finding}</p>
      </header>

      <PathwayFingerprint facts={facts} indicators={INDICATORS} />

      <WhatItTakes facts={facts} indicators={INDICATORS} />

      <LeftBehind equity={equity} name={name} />

      <section className="mb-14 print-break" aria-labelledby="stage-h">
        <h2 id="stage-h" className="mb-3 text-sm text-muted">
          The pathway breaks at <span className="font-semibold text-ink">{STAGE_LABEL[brief.pathwayStage].toLowerCase()}</span>
        </h2>
        <PathwayStrip active={brief.pathwayStage} />
      </section>

      <section className="mb-14" aria-labelledby="rec-h">
        <h2 id="rec-h" className="mb-2 text-2xl font-semibold tracking-tight">What {name} could do next</h2>
        <p className="mb-6 text-sm text-muted">Each one says who would do it, by when, and which sources it rests on.</p>
        <ol className="border-t border-ink">
          {brief.recommendations.map((r, i) => (
            <li key={i} className="print-break grid gap-x-6 border-b border-rule py-5 sm:grid-cols-[3rem_minmax(0,1fr)_16rem]">
              <span className="font-narrow text-4xl font-bold leading-none text-ink tabular-nums" aria-hidden>{i + 1}</span>
              <div>
                <p className="font-serif text-lg leading-snug">{r.action}</p>
                <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
                  <span>Based on</span>
                  {r.sources.map((s) => (
                    <a key={s} href={`#src-${sourceIndex.get(s)}`} className="link" title={resolveSource(s, live.snippets).label}>
                      [{sourceIndex.get(s)}]{" "}
                      {s.startsWith("sotkanet:") ? "Sotkanet" : resolveSource(s, live.snippets).label.split(":")[0]}
                    </a>
                  ))}
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 text-sm sm:mt-0">
                <dt className="text-muted">Who</dt><dd>{r.owner}</dd>
                <dt className="text-muted">By when</dt><dd>{r.timeframe}</dd>
                <dt className="text-muted">Strategy goal</dt><dd>{r.goal3Indicator}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-14" aria-labelledby="ind-h">
        <h2 id="ind-h" className="mb-2 text-2xl font-semibold tracking-tight">{name} against the whole country</h2>
        <p className="mb-6 text-sm text-muted">Latest year for each measure. The dark line is {name}, the dashed one is Finland, and the thin blue one is the level the best quarter of counties reach.</p>
        <div className="border-t border-ink">
          {INDICATORS.map((ind, i) => {
            const f = facts[i];
            return (
              <article key={ind.id} className="print-break grid gap-x-8 gap-y-3 border-b border-rule py-5 md:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                  <h3 className="font-semibold leading-snug">{ind.nameEn}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {STAGE_LABEL[ind.stage]}, {f.year}. {ind.higherIsBetter ? "Higher is better." : "Lower is better."}
                  </p>
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                    <strong className="font-narrow text-4xl font-bold tabular-nums">{fmt(f.value, ind.unit)}</strong>
                    <span className={`font-semibold tabular-nums ${STATUS_TEXT[f.status]}`}>
                      {fmtGap(f.gapToNational)}{" "}
                      {f.status === "no-data" ? "" : f.status === "on-par" ? "(about level)" : STATUS_LABEL[f.status].toLowerCase()}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Finland: {fmt(f.national, ind.unit)}
                    {f.rank !== null && <>. Ranked {f.rank} of {f.rankOf} counties.</>}
                  </p>
                  {f.target !== null && f.gapToTarget !== null && (
                    <p className="mt-1 text-sm">
                      {f.gapToTarget >= 0 ? (
                        <span className="text-ahead">Meets the {f.target}% national target</span>
                      ) : (
                        <span className="text-behind">
                          {fmtGap(f.gapToTarget).slice(1)} points short of the {f.target}% national target
                        </span>
                      )}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">{ind.strategyGoal}</p>
                </div>
                <TrendChart
                  county={series(ind.id, regionId)}
                  national={series(ind.id, nationalRegion?.id)}
                  best={bestSeries(ind)}
                  unit={ind.unit}
                />
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="src-h" className="print-break">
          <h2 id="src-h" className="mb-3 text-lg font-semibold tracking-tight">Where this comes from</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted">This brief cites no sources beyond the figures above.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {sources.map((s, i) => (
                <li key={s.id} id={`src-${i + 1}`} className="grid grid-cols-[2rem_1fr] scroll-mt-6 target:bg-behind-soft">
                  <span className="tabular-nums text-muted">[{i + 1}]</span>
                  <span>
                    <a href={s.url} target="_blank" rel="noreferrer" className="link">{s.label}</a>
                    {s.detail && <span className="mt-0.5 block text-xs text-muted">{s.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="lim-h" className="print-break">
          <h2 id="lim-h" className="mb-3 text-lg font-semibold tracking-tight">What this can&rsquo;t tell you</h2>
          <ul className="list-[square] space-y-2 pl-5 text-sm text-muted marker:text-par">
            {brief.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      </div>

      <section aria-labelledby="live-h" className="print-break mt-14 border-t border-rule pt-6">
        <h2 id="live-h" className="text-lg font-semibold tracking-tight">What the web says now</h2>
        <p className="mb-4 mt-1 max-w-2xl text-sm text-muted">
          Public pages about {name}&rsquo;s cancer care and waiting times, found through Context.dev
          {live.fetchedAt
            ? ` on ${new Date(live.fetchedAt).toLocaleString("en-GB", { timeZone: "Europe/Helsinki", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`
            : ""}
          . The analyst may cite them for context, never for figures.
        </p>
        {live.snippets.length > 0 ? (
          <ul className="grid gap-x-10 gap-y-5 text-sm md:grid-cols-2">
            {live.snippets.map((l) => (
              <li key={l.id} className="print-break">
                <a href={l.url} target="_blank" rel="noreferrer" className="link font-medium">{l.title}</a>
                <span className="mt-0.5 block truncate text-xs text-muted">{new URL(l.url).hostname}</span>
                <span className="mt-1.5 block leading-relaxed">{l.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            {live.status === "not-configured"
              ? "The web search is switched off here, because no Context.dev key is set."
              : live.status === "empty"
                ? "The search found no public pages about this county\u2019s cancer care."
                : "The web search didn\u2019t answer just now, so this brief rests on the figures and strategy documents only."}
          </p>
        )}
      </section>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <span>{region.name}</span>
      </footer>
    </main>
  );
}
