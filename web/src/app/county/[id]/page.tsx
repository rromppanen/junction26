import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTEXT_INDICATORS, INDICATORS, indicatorById } from "@/data/indicators";
import { EVIDENCE } from "@/data/evidence";
import { computeGap } from "@/lib/gap";
import { loadCountyBrief } from "@/lib/countyBrief";
import type { LiveSnippet } from "@/lib/context";
import { PeerTwin } from "@/components/PeerTwin";
import { TrendChart } from "@/components/TrendChart";
import { diagnosePathway } from "@/lib/fingerprint";
import { PathwayFingerprint } from "@/components/PathwayFingerprint";
import { WhatItTakes } from "@/components/WhatItTakes";
import { LeftBehind } from "@/components/LeftBehind";
import { MEASURES } from "@/data/measureKit";
import { MeasureKit } from "@/components/MeasureKit";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { Wordmark } from "@/components/Wordmark";
import { Colophon } from "@/components/Colophon";
import { STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, host } from "@/components/format";
import type { GapFacts, PathwayStage } from "@/lib/types";

export const dynamic = "force-dynamic";

type Source = { id: string; label: string; url: string; detail?: string };

function resolveSource(id: string, live: LiveSnippet[] = []): Source {
  if (id.startsWith("live:") || id.startsWith("peer:")) {
    const s = live.find((l) => l.id === id);
    return s
      ? { id, label: `${id.startsWith("peer:") ? "Peer county web page" : "Web page"}: ${s.title}`, url: s.url, detail: s.text }
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
  const loaded = await loadCountyBrief(regionId, "en");
  if (!loaded) notFound(); // municipalities 404
  const { ds, region, nationalRegion, name, facts, live, practices, peer, equity, brief } = loaded;

  const citable = [...live.snippets, ...(peer?.snippets ?? [])];
  const sourceIds = [...new Set([...brief.recommendations.flatMap((r) => r.sources), MEASURES[0].evidenceId])];
  const sources = sourceIds.map((s) => resolveSource(s, citable));
  const sourceIndex = new Map(sources.map((s, i) => [s.id, i + 1]));

  // Best-quartile boundary for every year the indicator has county figures (independent of the county).
  const bestSeries = (ind: (typeof INDICATORS)[number]) =>
    [...new Set(ds.values.filter((v) => v.indicatorId === ind.id).map((v) => v.year))]
      .map((y) => ({ year: y, value: computeGap(ds, ind, regionId, y).bestQuartile }))
      .filter((p): p is { year: number; value: number } => p.value !== null);

  const series = (indId: number, rId: number | undefined) =>
    ds.values.filter((v) => v.indicatorId === indId && v.regionId === rId).map((v) => ({ year: v.year, value: v.value }));


  const byGemini = brief.generatedBy === "gemini";
  const author = byGemini ? "Gemini" : "the fixed template";
  const stageLabel = STAGE_LABEL[brief.pathwayStage].toLowerCase();
  const stageNote =
    diagnosePathway(facts, INDICATORS).pattern === "none"
      ? `No stage is behind Finland; the weakest relative stage is ${stageLabel}.`
      : `The filled stop is ${stageLabel}, where ${author} puts the main break.`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <nav className="no-print mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm">
        <Wordmark />
        <span className="flex gap-x-6">
          <Link href="/" className="link">Back to the map</Link>
          <Link href={`/county/${regionId}/memo`} className="link">Hallitusmuistio (FI)</Link>
        </span>
      </nav>

      <header className="mb-10">
        <p className="text-sm text-muted">Cancer care brief</p>
        <h1 className="font-narrow mt-1 text-5xl font-bold leading-[0.92] tracking-[-0.01em] break-words sm:text-[5.5rem]">{name}</h1>
        <div className="mt-7 max-w-3xl">
          <p className="font-serif text-[1.35rem] leading-snug sm:text-[1.7rem]">{brief.headline}</p>
          <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink/85">{brief.finding}</p>
        </div>
        <p className="mt-6 max-w-2xl border-l-2 border-ink pl-3 text-sm leading-snug text-muted">
          {byGemini ? (
            <>Gemini wrote the passages set in <span className="font-serif text-ink">this serif type</span>, working only from the figures and strategy pages cited here. Everything in plain type is calculated straight from Sotkanet.</>
          ) : (
            <>The AI analyst didn&rsquo;t respond, so the passages in <span className="font-serif text-ink">this serif type</span> come from a fixed template filled in with {name}&rsquo;s figures. Everything in plain type is calculated straight from Sotkanet.</>
          )}
        </p>
      </header>

      <Part id="path" title="Where along the pathway">
        <PathwayFingerprint facts={facts} indicators={INDICATORS} />
        <div className="mt-6 max-w-2xl">
          <PathwayStrip
            active={brief.pathwayStage}
            note={`${stageNote} Referral and diagnosis have no public county figures, so nobody can see a gap there yet.`}
          />
        </div>
        <div className="mt-8">
          <WhatItTakes facts={facts} indicators={INDICATORS} />
        </div>
      </Part>

      <Part id="rec" title={`What ${name} could do next`}>
        <ol>
          {brief.recommendations.map((r, i) => (
            <li key={i} className={`print-break grid gap-x-4 py-5 sm:grid-cols-[1.75rem_minmax(0,1fr)] ${i ? "border-t border-rule" : "pt-0"}`}>
              <span className="font-narrow text-xl font-bold leading-snug tabular-nums text-muted" aria-hidden>{i + 1}</span>
              <div>
                <p className="max-w-2xl font-serif text-lg leading-snug">{r.action}</p>
                <dl className="mt-3 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">Who</dt><dd>{r.owner}</dd>
                  <dt className="text-muted">By when</dt><dd>{r.timeframe}</dd>
                  <dt className="text-muted">Counts towards</dt><dd>{r.goal3Indicator}</dd>
                  {r.sources.length > 0 && (
                    <>
                      <dt className="text-muted">Rests on</dt>
                      <dd className="flex flex-wrap gap-x-3 gap-y-1">
                        {r.sources.map((s) => (
                          <a key={s} href={`#src-${sourceIndex.get(s)}`} className="link" title={resolveSource(s, citable).label}>
                            [{sourceIndex.get(s)}]{" "}
                            {s.startsWith("sotkanet:") ? "Sotkanet" : resolveSource(s, citable).label.split(":")[0]}
                          </a>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </Part>

      <Part id="lb" title={`Who is left behind inside ${name}`}>
        <LeftBehind equity={equity} name={name} />
      </Part>

      {peer && practices && (
        <Part id="peer" title="A county to learn from">
          <PeerTwin
            name={name}
            twinName={peer.twinName}
            indicator={peer.indicator}
            countyValue={peer.countyValue}
            twinValue={peer.twinValue}
            practices={practices}
          />
        </Part>
      )}

      <Part id="mk" title="Start measuring">
        <MeasureKit regionId={regionId} sourceNo={sourceIndex.get(MEASURES[0].evidenceId)} />
      </Part>

      <Part id="ind" title="The five measures behind this">
        <p className="mb-2 max-w-2xl text-sm text-muted">
          Latest year Sotkanet publishes for each. For all five, a higher share is better.
        </p>
        {INDICATORS.map((ind, i) => {
          const f = facts[i];
          return (
            <article key={ind.id} className="print-break grid gap-x-8 gap-y-4 border-b border-rule py-6 last:border-b-0 md:grid-cols-[minmax(0,1fr)_21rem]">
              <div>
                <h3 className="font-semibold leading-snug">{ind.nameEn}</h3>
                <p className="mt-0.5 text-sm text-muted">{STAGE_WORD[ind.stage]}, {f.year}</p>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                  <strong className="font-narrow text-3xl font-bold tabular-nums">{fmt(f.value, ind.unit)}</strong>
                  <span className={`text-sm font-semibold ${STATUS_TEXT[f.status]}`}>{compareToFinland(f, ind.unit)}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  Finland {fmt(f.national, ind.unit)}
                  {f.rank !== null && <>. {ordinal(f.rank)} of {f.rankOf} counties</>}.
                </p>
                {f.target !== null && f.gapToTarget !== null && (
                  <p className={`mt-1 text-sm ${f.gapToTarget >= 0 ? "text-ahead" : "text-behind"}`}>
                    {f.gapToTarget >= 0
                      ? `Meets the ${f.target}% target.`
                      : `${Math.abs(f.gapToTarget).toFixed(1)} points short of the ${f.target}% target.`}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted">{ind.strategyGoal}</p>
              </div>
              <TrendChart
                county={series(ind.id, regionId)}
                national={series(ind.id, nationalRegion?.id)}
                best={bestSeries(ind)}
                unit={ind.unit}
                target={ind.target?.value ?? null}
                countyName={name}
              />
            </article>
          );
        })}
      </Part>

      <Part id="src" title="Sources">
        {sources.length === 0 ? (
          <p className="text-sm text-muted">The actions cite nothing beyond the Sotkanet figures above.</p>
        ) : (
          <ol className="max-w-2xl space-y-3 text-sm">
            {sources.map((s, i) => (
              <li key={s.id} id={`src-${i + 1}`} className="grid scroll-mt-6 grid-cols-[2rem_minmax(0,1fr)] target:bg-behind-soft">
                <span className="tabular-nums text-muted">[{i + 1}]</span>
                <span>
                  <a href={s.url} target="_blank" rel="noreferrer" className="link">{s.label}</a>
                  {s.detail && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{s.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Part>

      <Part id="lim" title={"What this can\u2019t tell you"}>
        <ul className="max-w-2xl list-[square] space-y-2 pl-5 font-serif leading-relaxed marker:text-par">
          {brief.limitations.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </Part>

      <Part id="live" title="What the web says now">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          Public pages about {name}&rsquo;s cancer care and waiting times, found through Context.dev
          {live.fetchedAt
            ? ` on ${new Date(live.fetchedAt).toLocaleString("en-GB", { timeZone: "Europe/Helsinki", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`
            : ""}
          . {byGemini ? "Gemini" : "The analyst"} may cite them for context, never for figures.
        </p>
        {live.snippets.length > 0 ? (
          <ul className="grid gap-x-10 gap-y-6 text-sm md:grid-cols-2">
            {live.snippets.map((l) => (
              <li key={l.id} className="print-break">
                <a href={l.url} target="_blank" rel="noreferrer" className="link font-medium">{l.title}</a>
                <span className="mt-0.5 block truncate text-xs text-muted">{host(l.url)}</span>
                <span className="mt-1.5 block leading-relaxed">{l.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-2xl text-sm">
            {live.status === "not-configured"
              ? "The web search is switched off here, because no Context.dev key is set."
              : live.status === "empty"
                ? "The search found no public pages about this county’s cancer care."
                : "The web search didn’t answer just now, so this brief rests on the figures and strategy documents only."}
          </p>
        )}
      </Part>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <span>{region.name}</span>
        <Colophon className="basis-full" />
      </footer>
    </main>
  );
}

const STAGE_WORD: Record<PathwayStage, string> = { ...STAGE_LABEL, detection: "Screening", outcome: "Survival" };

function ordinal(n: number): string {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

/** "2.3 points behind Finland", in the sign-corrected sense of gapToNational. */
function compareToFinland(f: GapFacts, unit: string): string {
  if (f.status === "no-data" || f.gapToNational === null) return "no national figure to compare";
  const size = `${Math.abs(f.gapToNational).toFixed(1)} ${unit === "%" ? "points" : unit}`;
  if (f.status === "on-par") return `about level with Finland (${fmtGap(f.gapToNational)})`;
  return f.status === "behind" ? `${size} behind Finland` : `${size} ahead of Finland`;
}

/** A section of the brief: its name in the left margin, its content to the right. */
function Part({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="print-break grid gap-x-10 gap-y-4 border-t border-ink py-8 md:grid-cols-[10.5rem_minmax(0,1fr)]">
      <h2 id={`${id}-h`} className="text-lg font-semibold leading-tight tracking-tight md:text-base">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
