import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataset } from "@/lib/data";
import { INDICATORS, indicatorById } from "@/data/indicators";
import { EVIDENCE } from "@/data/evidence";
import { computeGap, latestYear } from "@/lib/gap";
import { generateBrief } from "@/lib/analyst";
import { getCountyContext, liveContextEnabled, type LiveSnippet } from "@/lib/context";
import { TrendChart } from "@/components/TrendChart";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { STATUS_CLASSES, STATUS_LABEL, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";

export const dynamic = "force-dynamic";

type Source = { id: string; label: string; url: string; detail?: string };

function resolveSource(id: string, live: LiveSnippet[] = []): Source {
  if (id.startsWith("live:")) {
    const s = live.find((l) => l.id === id);
    return s
      ? { id, label: `Live web (Context.dev): ${s.title}`, url: s.url, detail: s.text }
      : { id, label: id, url: "#" };
  }
  if (id.startsWith("sotkanet:")) {
    const ind = indicatorById(Number(id.slice(9)));
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
  const region = ds.regions.find((r) => r.id === regionId && !r.isNational);
  if (!region) notFound();
  const nationalRegion = ds.regions.find((r) => r.isNational);
  const name = shortName(region.name);

  const facts = INDICATORS.map((ind) => computeGap(ds, ind, regionId, latestYear(ds, ind)));
  const live = await getCountyContext(region.name);
  const brief = await generateBrief({ regionName: name, facts, indicators: INDICATORS, live });

  const sourceIds = [...new Set(brief.recommendations.flatMap((r) => r.sources))];
  const sources = sourceIds.map((s) => resolveSource(s, live));
  const sourceIndex = new Map(sources.map((s, i) => [s.id, i + 1]));

  const series = (indId: number, rId: number | undefined) =>
    ds.values.filter((v) => v.indicatorId === indId && v.regionId === rId).map((v) => ({ year: v.year, value: v.value }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="no-print mb-6 flex items-center justify-between text-sm">
        <Link href="/" className="text-nordic underline-offset-2 hover:underline">Back to all counties</Link>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            brief.generatedBy === "gemini" ? "bg-nordic text-white" : "border border-rule bg-surface text-muted"
          }`}
        >
          {brief.generatedBy === "gemini" ? "AI analyst (Gemini)" : "Rule-based fallback"}
        </span>
      </nav>

      <header className="mb-8 border-b border-rule pb-6">
        <p className="text-sm text-muted">Cancer care brief · {region.name}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
        <p className="mt-4 max-w-3xl font-serif text-xl leading-snug">{brief.headline}</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted">{brief.finding}</p>
      </header>

      <section className="mb-10 print-break" aria-labelledby="stage-h">
        <h2 id="stage-h" className="mb-2 text-sm font-semibold text-muted">
          Where the pathway breaks: {STAGE_LABEL[brief.pathwayStage].toLowerCase()}
        </h2>
        <PathwayStrip active={brief.pathwayStage} />
      </section>

      <section className="mb-10" aria-labelledby="rec-h">
        <h2 id="rec-h" className="mb-4 font-serif text-2xl font-semibold">Three actions</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {brief.recommendations.map((r, i) => (
            <li key={i} className="print-break flex flex-col rounded-lg border border-rule bg-surface p-4">
              <span className="font-serif text-2xl text-nordic">{i + 1}</span>
              <p className="mt-1 font-medium leading-snug">{r.action}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Owner</dt><dd>{r.owner}</dd>
                <dt className="text-muted">When</dt><dd>{r.timeframe}</dd>
                <dt className="text-muted">Strategy goal</dt><dd>{r.goal3Indicator}</dd>
              </dl>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                {r.sources.map((s) => (
                  <a
                    key={s}
                    href={`#src-${sourceIndex.get(s)}`}
                    className="rounded border border-rule bg-paper px-1.5 py-0.5 text-[11px] text-muted hover:border-nordic hover:text-nordic"
                    title={resolveSource(s, live).label}
                  >
                    [{sourceIndex.get(s)}] {s.startsWith("sotkanet:") ? "Sotkanet" : s.startsWith("live:") ? "Live web" : resolveSource(s, live).label.split(":")[0]}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10" aria-labelledby="ind-h">
        <h2 id="ind-h" className="mb-4 font-serif text-2xl font-semibold">Indicators against the whole country</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {INDICATORS.map((ind, i) => {
            const f = facts[i];
            return (
              <article key={ind.id} className="print-break rounded-lg border border-rule bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-snug">{ind.nameEn}</h3>
                    <p className="text-xs text-muted">{STAGE_LABEL[ind.stage]} · {f.year} · {ind.higherIsBetter ? "higher is better" : "lower is better"}</p>
                  </div>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${STATUS_CLASSES[f.status]}`}>{STATUS_LABEL[f.status]}</span>
                </div>
                <p className="mt-2 text-sm">
                  <strong className="tabular-nums">{fmt(f.value, ind.unit)}</strong>
                  <span className="text-muted"> vs {fmt(f.national, ind.unit)} nationally · gap </span>
                  <span className={`font-semibold tabular-nums ${f.status === "behind" ? "text-behind" : f.status === "ahead" ? "text-ahead" : ""}`}>{fmtGap(f.gapToNational)}</span>
                  {f.rank !== null && <span className="text-muted"> · rank {f.rank}/{f.rankOf}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {ind.strategyGoal}
                  {f.target !== null && f.gapToTarget !== null && (
                    <>
                      {" · "}
                      <span className={f.gapToTarget >= 0 ? "text-ahead font-semibold" : "text-behind font-semibold"}>
                        {f.gapToTarget >= 0 ? "meets" : "below"} the {f.target}% target ({fmtGap(f.gapToTarget)})
                      </span>
                    </>
                  )}
                </p>
                <div className="mt-3">
                  <TrendChart county={series(ind.id, regionId)} national={series(ind.id, nationalRegion?.id)} unit={ind.unit} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="src-h" className="print-break">
          <h2 id="src-h" className="mb-3 font-serif text-xl font-semibold">Sources</h2>
          <ol className="space-y-2 text-sm">
            {sources.map((s, i) => (
              <li key={s.id} id={`src-${i + 1}`} className="flex gap-2">
                <span className="tabular-nums text-muted">[{i + 1}]</span>
                <span>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-nordic underline-offset-2 hover:underline">{s.label}</a>
                  {s.detail && <span className="block text-xs text-muted">{s.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="lim-h" className="print-break">
          <h2 id="lim-h" className="mb-3 font-serif text-xl font-semibold">Limitations</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            {brief.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      </div>

      <section aria-labelledby="live-h" className="print-break mt-8 rounded-lg border border-rule bg-surface p-4">
        <h2 id="live-h" className="font-serif text-xl font-semibold">What {name} already publishes</h2>
        <p className="mb-3 mt-1 text-xs text-muted">
          Live from the open web via Context.dev: the county&apos;s own pages on cancer care and access times. The analyst can build its actions on these.
        </p>
        {!liveContextEnabled() ? (
          <p className="text-sm text-muted">Live web search is off (no Context.dev key configured).</p>
        ) : live.length === 0 ? (
          <p className="text-sm text-muted">No relevant public pages found right now.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {live.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-nordic underline-offset-2 hover:underline">{s.title}</a>
                {s.text && <span className="block text-xs text-muted">{s.text}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <span>{brief.generatedBy === "gemini" ? "Brief drafted by AI analyst (Gemini) from the figures above" : "Brief generated by rule-based fallback from the figures above"}</span>
      </footer>
    </main>
  );
}
