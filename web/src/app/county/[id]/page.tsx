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
import { ScenarioTool, type ScenarioProgramme } from "@/components/ScenarioTool";
import { SCENARIO_DEFAULTS } from "@/data/scenarioDefaults";
import { LeftBehind } from "@/components/LeftBehind";
import { ReachThem } from "@/components/ReachThem";
import { reachPlan } from "@/lib/reach";
import { getReachDrafts } from "@/lib/reachDrafts";
import { peoplePer1000ToReach } from "@/lib/impact";
import { MEASURES } from "@/data/measureKit";
import { MeasureKit } from "@/components/MeasureKit";
import { MeasureUpload } from "@/components/MeasureUpload";
import { PathwayFunnel } from "@/components/PathwayFunnel";
import { DecisionBoard } from "@/components/DecisionBoard";
import { StressTest } from "@/components/StressTest";
import { EvidenceTag } from "@/components/simulator/EvidenceTag";
import { EVIDENCE_KIND_HELP, EVIDENCE_KIND_LABEL, type EvidenceKind } from "@/data/simulatorEvidence";
import { loadPathway } from "@/lib/pathwayData";
import { PATHWAY_COSTS } from "@/data/pathwayCosts";
import { PathwayStrip } from "@/components/PathwayStrip";
import { TwoMinuteSummary } from "@/components/TwoMinuteSummary";
import { countySummary } from "@/lib/summary";
import { MortalityPanel } from "@/components/MortalityPanel";
import { countyMortality, type MortalityRow } from "@/lib/mortality";
import MORTALITY_ROWS from "@/data/mortality.json";
import { DataBadge } from "@/components/DataBadge";
import { Colophon } from "@/components/Colophon";
import { AppHeader, HeaderLink, More, Stat, StatusIcon } from "@/components/ui";
import { OpenOnHash } from "@/components/OpenOnHash";
import { STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, host } from "@/components/format";
import type { GapFacts, PathwayStage } from "@/lib/types";
import {
  ArrowLeft, BookOpen, Filter, Megaphone, Scale, CalendarClock, FileText, FileUp, Gauge, Globe, Handshake, LineChart, Link2, ListChecks, Route, Ruler,
  SlidersHorizontal, Sparkles, Target, TriangleAlert, UserRound, Users, type LucideIcon,
} from "lucide-react";

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
      : `The highlighted stop is ${stageLabel}, an interpretation from ${author}; it does not establish a measured bottleneck.`;

  const behindCount = facts.filter((f) => f.status === "behind").length;
  const screening = facts.filter((f) => f.target !== null && f.value !== null);
  const meets = screening.filter((f) => (f.gapToTarget ?? -1) >= 0).length;

  const scenarioProgrammes: ScenarioProgramme[] = INDICATORS.flatMap((ind) => {
    const f = facts.find((x) => x.indicatorId === ind.id);
    if (!ind.target || !f || f.value === null) return [];
    const d = SCENARIO_DEFAULTS[ind.id];
    return [{
      indicatorId: ind.id,
      name: ind.nameEn.match(/^(\w+) cancer screening/i)?.[1] ?? ind.nameEn,
      today: f.value,
      national: f.national,
      target: ind.target.value,
      bestQuartile: f.bestQuartile,
      costPerScreen: d?.costPerScreen ?? null,
      cancersPer1000Screened: d?.cancersPer1000Screened ?? null,
    }];
  });

  // The screening furthest below its target is where the reach kit starts.
  const reachFact = screening
    .filter((f) => (f.gapToTarget ?? 0) < 0)
    .sort((a, b) => (a.gapToTarget as number) - (b.gapToTarget as number))[0];
  const reachInd = reachFact ? INDICATORS.find((i) => i.id === reachFact.indicatorId) : undefined;
  const reach = reachInd ? reachPlan(ds, regionId, reachInd, equity) : null;
  const reachDrafts = reach && reachInd ? await getReachDrafts(reach, reachInd) : null;

  const pathwayView = loadPathway(regionId);
  const mortality = countyMortality(MORTALITY_ROWS as MortalityRow[], region.name);

  const summary = countySummary({
    name,
    facts,
    indicators: INDICATORS,
    pathway: pathwayView,
    reach: reach && reachInd ? { plan: reach, indicator: reachInd } : null,
    firstAction: brief.recommendations[0],
    costs: { perColonoscopy: PATHWAY_COSTS.perColonoscopy.value, perContact: PATHWAY_COSTS.perContact.value, perTest: PATHWAY_COSTS.perTest?.value ?? null },
    mortality,
  });

  const leadBowel = pathwayView !== null && summary.some((line) => line.key === "gap" && line.href === "#funnel");

  // Sections in the order of the learning loop; the jump menu groups them by step.
  const parts: { id: string; icon: LucideIcon; label: string; step: string }[] = [
    { id: "path", icon: Route, label: "Pathway", step: "Understand" },
    ...(pathwayView ? [{ id: "funnel", icon: Filter, label: "Where people fall off", step: "Understand" }] : []),
    { id: "lb", icon: Users, label: "Left behind", step: "Understand" },
    ...(pathwayView ? [{ id: "decide", icon: Scale, label: "Compare bowel options", step: "Simulate" }] : []),
    { id: "what-if", icon: SlidersHorizontal, label: "Screening targets", step: "Simulate" },
    { id: "rec", icon: ListChecks, label: "Next steps", step: "Implement" },
    { id: "reach", icon: Megaphone, label: "Reach them", step: "Implement" },
    { id: "mk", icon: Ruler, label: "Measure", step: "Learn" },
    ...(peer && practices ? [{ id: "peer", icon: Handshake, label: "Learn from", step: "Learn" }] : []),
    { id: "ind", icon: LineChart, label: "Figures", step: "Reference" },
    { id: "ev", icon: BookOpen, label: "Evidence", step: "Reference" },
  ];
  const part = (pid: string) => parts.find((x) => x.id === pid)!;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
      <OpenOnHash />
      <AppHeader>
        <HeaderLink href="/map" icon={ArrowLeft} label="Map" />
        <HeaderLink href={`/county/${regionId}/memo`} icon={FileText} label="Memo (FI)" title="One-page board memo in Finnish" />
        <HeaderLink href="/" icon={FileUp} label="Analyse your data" title="Bring your own aggregate data" />
        <HeaderLink href={`/simulator?county=${regionId}`} icon={Gauge} label="Breast screening simulator" title="What raising breast screening attendance here would be worth" />
      </AppHeader>

      <header className="mb-8">
        <p className="text-sm text-muted">Cancer care brief</p>
        <h1 className="font-narrow mt-1 text-5xl font-bold leading-[0.92] tracking-[-0.01em] break-words sm:text-[5rem]">{name}</h1>
        <p className="mt-6 max-w-3xl font-serif text-[1.3rem] leading-snug sm:text-[1.6rem]">{summary.find((line) => line.key === "gap")?.text ?? brief.headline}</p>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:gap-x-12">
          {leadBowel && pathwayView ? <>
            <Stat value={`${pathwayView.pathway.rates.examined.toFixed(1)}%`} label="positive bowel tests examined" />
            <Stat value={`${pathwayView.pathway.bestQuarter.examined.toFixed(1)}%`} label="best-quarter comparison target" />
          </> : <>
          <Stat value={`${behindCount}/${facts.length}`} label="measures behind Finland" tone={behindCount ? "text-behind" : ""} />
          {screening.length > 0 && (
            <Stat value={`${meets}/${screening.length}`} label={`screenings at the ${screening[0].target}% target`} />
          )}
          </>}

        </div>
        <More label="Read the full finding" icon={Sparkles} className="mt-5">
          <p className="font-serif text-base leading-relaxed text-ink">{brief.finding}</p>
          <p className="mt-3">
            {byGemini
              ? "Gemini wrote the serif text, working only from the figures and strategy pages cited here. Plain text is calculated straight from Sotkanet."
              : `The AI analyst didn\u2019t respond, so the serif text comes from a fixed template filled in with ${name}\u2019s figures. Plain text is calculated straight from Sotkanet.`}
          </p>
        </More>
        <TwoMinuteSummary lines={summary.filter((line) => line.key !== "gap")} />
      </header>

      <nav aria-label="Sections" className="no-print mb-2 rounded-lg border-y border-rule bg-paper/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex flex-wrap gap-1 text-sm">
          {parts.map((p, i) => (
            <li key={p.id} className="flex items-center">
              {(i === 0 || parts[i - 1].step !== p.step) && (
                <span className={`mr-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted ${i ? "ml-3 border-l border-rule pl-3" : ""}`}>{p.step}</span>
              )}
              <a href={`#${p.id}`} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] px-2.5 py-1.5 hover:bg-par-soft">
                <p.icon aria-hidden size={15} strokeWidth={2} className="text-muted" />
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Part {...part("path")} title="Where along the pathway">
        <PathwayFingerprint facts={facts} indicators={INDICATORS} />
        <div className="mt-6 max-w-2xl">
          <PathwayStrip active={brief.pathwayStage} />
        </div>
        <More label="What the pathway shows" className="mt-3">
          {stageNote} Referral and diagnosis have no public county figures, so nobody can see a gap there yet.
        </More>
      </Part>

      {pathwayView && (
      <Part {...part("funnel")} title="Bowel screening: measured counts and comparison scenario">
        <PathwayFunnel view={pathwayView} name={name} />
      </Part>
      )}

      <Part {...part("lb")} title={`Screening participation within ${name}`}>
        <LeftBehind equity={equity} name={name} />
      </Part>

      {pathwayView && (
      <Part {...part("decide")} title={`Compare bowel interventions in ${name}`}>
        <DecisionBoard
          p={pathwayView.pathway}
          order={pathwayView.breaks.map((b) => b.kind)}
          defaults={PATHWAY_COSTS}
          regionId={regionId}
          name={name}
        />
        <StressTest p={pathwayView.pathway} name={name} />
      </Part>
      )}

      <details className="more rounded-lg border border-rule px-4 sm:px-6"><summary className="cursor-pointer py-4 font-semibold">Other programmes · screening targets</summary>
      <Part id="what-if" icon={SlidersHorizontal} title="Explore other screening targets">
        <ScenarioTool programmes={scenarioProgrammes} />
        <p className="mt-5 flex max-w-2xl items-start gap-2 text-sm">
          <Gauge aria-hidden size={16} className="mt-0.5 shrink-0 text-muted" />
          <span>
            For breast screening, the{" "}
            <a href={`/simulator?county=${regionId}`} className="link font-medium">screening simulator</a> lets you adjust attendance targets. Illustrative clinical and cost outcomes are available separately, with their assumptions labelled.
          </span>
        </p>
      </Part>

      </details>

      <Part {...part("rec")} title="Other actions to consider across programmes">
        <ol>
          {brief.recommendations.map((r, i) => (
            <li key={i} className={`print-break grid gap-x-4 py-5 sm:grid-cols-[1.75rem_minmax(0,1fr)] ${i ? "border-t border-rule" : "pt-0"}`}>
              <span className="font-narrow text-xl font-bold leading-snug tabular-nums text-muted" aria-hidden>{i + 1}</span>
              <div>
                <p className="max-w-2xl font-serif text-lg leading-snug">{r.action}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                  <Meta icon={UserRound} label="Who">{r.owner}</Meta>
                  <Meta icon={CalendarClock} label="By when">{r.timeframe}</Meta>
                  <Meta icon={Target} label="Counts towards">{r.goal3Indicator}</Meta>
                  {r.sources.length > 0 && (
                    <Meta icon={Link2} label="Sources">
                      {r.sources.map((src, k) => (
                        <span key={src}>
                          {k > 0 && ", "}
                          <a href={`#src-${sourceIndex.get(src)}`} className="link" title={resolveSource(src, citable).label}>
                            {src.startsWith("sotkanet:") ? "Sotkanet" : resolveSource(src, citable).label.split(":")[0]}
                          </a>
                        </span>
                      ))}
                    </Meta>
                  )}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Part>

      <Part {...part("reach")} title={`Reach them: ${name}`}>
        {reachInd && reachFact ? (
          <ReachThem
            plan={reach}
            drafts={reachDrafts}
            programme={reachInd.nameEn.match(/^(\w+) cancer screening/i)?.[1] ?? reachInd.nameEn}
            target={reachFact.target}
            toTarget={peoplePer1000ToReach(reachFact.value, reachFact.target)}
            name={name}
          />
        ) : (
          <p className="max-w-2xl text-sm text-muted">Every screening with a published figure is at its target, so there is no group to reach first.</p>
        )}
      </Part>

      <Part {...part("mk")} title="Start measuring">
        <MeasureKit regionId={regionId} sourceNo={sourceIndex.get(MEASURES[0].evidenceId)} />
        <MeasureUpload />
      </Part>

      {peer && practices && (
        <Part {...part("peer")} title="A county to learn from">
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

      <Part {...part("ind")} title={`The ${INDICATORS.length + (mortality ? 1 : 0)} measures`}>
        {mortality && <MortalityPanel m={mortality} name={name} />}
        {INDICATORS.map((ind, i) => {
          const f = facts[i];
          return (
            <article key={ind.id} className="print-break grid gap-x-8 gap-y-4 border-b border-rule py-5 first:pt-0 last:border-b-0 md:grid-cols-[minmax(0,1fr)_21rem]">
              <div>
                <h3 className="font-semibold leading-snug" title={ind.strategyGoal}>{ind.nameEn}</h3>
                <p className="mt-0.5 text-sm text-muted">{STAGE_WORD[ind.stage]}, {f.year}</p>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                  <strong className="font-narrow text-3xl font-bold tabular-nums">{fmt(f.value, ind.unit)}</strong>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${STATUS_TEXT[f.status]}`}>
                    {f.status !== "no-data" && <StatusIcon status={f.status} />}
                    {compareToFinland(f, ind.unit)}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  Finland {fmt(f.national, ind.unit)}
                  {f.rank !== null && <>. {ordinal(f.rank)} of {f.rankOf}</>}.
                </p>
                {f.target !== null && f.gapToTarget !== null && (
                  <p className={`mt-1 inline-flex items-center gap-1 text-sm ${f.gapToTarget >= 0 ? "text-ahead" : "text-behind"}`}>
                    <Target aria-hidden size={14} />
                    {f.gapToTarget >= 0
                      ? `Meets the ${f.target}% target`
                      : `${Math.abs(f.gapToTarget).toFixed(1)} points short of ${f.target}%`}
                  </p>
                )}
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

      <Part {...part("ev")} title="Evidence">
        <dl className="mb-4 grid max-w-3xl gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          {(["observed", "inferred", "simulated", "expert"] as EvidenceKind[]).map((k) => (
            <div key={k} className="contents">
              <dt><EvidenceTag kind={k} /></dt>
              <dd className="text-muted">{EVIDENCE_KIND_HELP[k]}<span className="sr-only"> ({EVIDENCE_KIND_LABEL[k]})</span></dd>
            </div>
          ))}
        </dl>
        <div className="space-y-3">
          <More label={`Sources (${sources.length})`} icon={BookOpen}>
            {sources.length === 0 ? (
              <p>The actions cite nothing beyond the Sotkanet figures above.</p>
            ) : (
              <ol className="space-y-3 text-ink">
                {sources.map((src, i) => (
                  <li key={src.id} id={`src-${i + 1}`} className="grid scroll-mt-16 grid-cols-[2rem_minmax(0,1fr)] target:bg-behind-soft">
                    <span className="tabular-nums text-muted">[{i + 1}]</span>
                    <span>
                      <a href={src.url} target="_blank" rel="noreferrer" className="link">{src.label}</a>
                      {src.detail && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{src.detail}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </More>
          <More label={`What this can\u2019t tell you (${brief.limitations.length})`} icon={TriangleAlert}>
            <ul className="list-[square] space-y-2 pl-5 font-serif leading-relaxed text-ink marker:text-par">
              {brief.limitations.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </More>
          <More label={`Web pages found today (${live.snippets.length})`} icon={Globe}>
            <p className="mb-3">
              Public pages about {name}&rsquo;s cancer care, found through Context.dev
              {live.fetchedAt
                ? ` on ${new Date(live.fetchedAt).toLocaleString("en-GB", { timeZone: "Europe/Helsinki", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`
                : ""}
              . Cited for context, never for figures.
            </p>
            {live.snippets.length > 0 ? (
              <ul className="space-y-4 text-ink">
                {live.snippets.map((l) => (
                  <li key={l.id} className="print-break">
                    <a href={l.url} target="_blank" rel="noreferrer" className="link font-medium">{l.title}</a>
                    <span className="mt-0.5 block truncate text-xs text-muted">{host(l.url)}</span>
                    <span className="mt-1 block leading-relaxed">{l.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink">
                {live.status === "not-configured"
                  ? "The web search is switched off here, because no Context.dev key is set."
                  : live.status === "empty"
                    ? "The search found no public pages about this county\u2019s cancer care."
                    : "The web search didn\u2019t answer just now, so this brief rests on the figures and strategy documents only."}
              </p>
            )}
          </More>
        </div>
      </Part>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <span>{region.name}</span>
        <More label="About Gap Radar" className="basis-full">
          <Colophon />
        </More>
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

/** A section of the brief: its icon and name on top, then the content. `id` is the jump-menu anchor. */
const PART_KIND: Record<string, EvidenceKind> = {
  decide: "simulated", path: "inferred", "what-if": "simulated", lb: "inferred", peer: "observed", ind: "observed",
};

function Part({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; label?: string; title: string; children: React.ReactNode }) {
  const kind = PART_KIND[id];
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="print-break scroll-mt-14 border-t border-ink py-8 first-of-type:border-t-0">
      <h2 id={`${id}-h`} className="mb-5 flex flex-wrap items-center gap-2 text-xl font-semibold leading-tight tracking-tight">
        <Icon aria-hidden size={20} strokeWidth={2} className="shrink-0 text-muted" />
        {title}
        {kind && <EvidenceTag kind={kind} className="ml-1" />}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** One fact about an action: icon, a label for screen readers, the value. */
function Meta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-start gap-1.5" title={label}>
      <Icon aria-hidden size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>
        <span className="sr-only">{label}: </span>
        <span className="text-ink">{children}</span>
      </span>
    </li>
  );
}
