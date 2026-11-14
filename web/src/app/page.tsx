import Link from "next/link";
import { getDataset } from "@/lib/data";
import { INDICATORS, indicatorBySlug } from "@/data/indicators";
import { ON_PAR_THRESHOLD, latestYear, rankCounties } from "@/lib/gap";
import type { GapFacts, GapStatus, Indicator, PathwayStage } from "@/lib/types";
import { CountyMap } from "@/components/CountyMap";
import { NationalView } from "@/components/NationalView";
import { earlyWarnings, improvers, languageGaps, nationalPathway } from "@/lib/national";
import { COLORECTAL_SOURCE, REGISTRY, loadPathway } from "@/lib/pathwayData";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { Colophon } from "@/components/Colophon";
import { AppHeader, HeaderLink, IconHeading, More, Stat, StatusIcon } from "@/components/ui";
import { STATUS_LABEL, STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";
import { CalendarDays, ExternalLink, Gauge, HeartPulse, ListOrdered, Map as MapIcon, Route, ScanSearch, type LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

// How each measure reads inside a sentence and on a tab. UI wording only; the data keeps nameEn.
// `tab` is short because the tabs sit under a group name ("Screening attendance: Breast, Bowel, Cervical").
const PHRASE: Record<string, { tab: string; inSentence: string }> = {
  "breast-screening": { tab: "Breast", inSentence: "breast cancer screening attendance" },
  "colorectal-screening": { tab: "Bowel", inSentence: "bowel cancer screening attendance" },
  "cervical-screening": { tab: "Cervical", inSentence: "cervical cancer screening attendance" },
  "breast-survival": { tab: "Breast cancer", inSentence: "five-year breast cancer survival" },
  "bowel-survival": { tab: "Bowel cancer", inSentence: "five-year bowel cancer survival" },
  "cervical-survival": { tab: "Cervical cancer", inSentence: "five-year cervical cancer survival" },
};

// Measure tabs are grouped by pathway stage; these are the group names a reader sees.
const GROUP_LABEL: Partial<Record<PathwayStage, string>> = {
  detection: "Screening",
  outcome: "5-year survival",
};
const GROUP_ICON: Partial<Record<PathwayStage, LucideIcon>> = { detection: ScanSearch, outcome: HeartPulse };

function measureGroups(): { stage: PathwayStage; items: Indicator[] }[] {
  const out: { stage: PathwayStage; items: Indicator[] }[] = [];
  for (const i of INDICATORS) {
    const g = out.find((x) => x.stage === i.stage);
    if (g) g.items.push(i);
    else out.push({ stage: i.stage, items: [i] });
  }
  return out;
}

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ ind?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const ds = await getDataset();
  const ind = (sp.ind && indicatorBySlug(sp.ind)) || indicatorBySlug("breast-screening") || INDICATORS[0];
  // Years come from county and national rows only; municipality rows never change the radar.
  const nonMunicipal = new Set(ds.regions.filter((r) => r.kind !== "municipality").map((r) => r.id));
  const years = [
    ...new Set(ds.values.filter((v) => v.indicatorId === ind.id && nonMunicipal.has(v.regionId)).map((v) => v.year)),
  ].sort((a, b) => a - b);
  const latest = latestYear(ds, ind);
  const reqYear = sp.year ? Number(sp.year) : NaN;
  const year = years.includes(reqYear) ? reqYear : latest;

  const ranked = rankCounties(ds, ind, year);
  const factsById = new Map<number, GapFacts>(ranked.map((f) => [f.regionId, f]));
  const regionName = new Map(ds.regions.map((r) => [r.id, r.name]));

  // National layer: Registry counts, plus early warnings across every screening programme at its latest year.
  const nationalPath = nationalPathway(REGISTRY.colorectal);
  const screeningFacts = INDICATORS.filter((i) => i.target).flatMap((i) => rankCounties(ds, i, latestYear(ds, i)));
  const warnings = earlyWarnings(screeningFacts);
  const rising = improvers(screeningFacts);
  const countyList = ds.regions
    .filter((r) => r.kind === "county")
    .map((r) => ({ id: r.id, name: shortName(r.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fi"));
  // The loop is shown on the county with the most findings to gain at its breaks.
  const example = countyList
    .map((c) => ({ ...c, gain: loadPathway(c.id)?.breaks.reduce((s, b) => s + b.cancers, 0) ?? -1 }))
    .sort((a, b) => b.gain - a.gain)[0];
  const indName = (id: number) => (INDICATORS.find((i) => i.id === id)?.nameEn.match(/^(\w+) cancer screening/i)?.[1] ?? "Screening");
  const national = ranked.find((f) => f.national !== null)?.national ?? null;
  const behind = ranked.filter((f) => f.status === "behind").length;
  const withData = ranked.filter((f) => f.value !== null).length;
  const recentYears = years.slice(-6);
  const phrase = PHRASE[ind.slug] ?? { tab: ind.nameEn, inSentence: ind.nameEn.toLowerCase() };
  const meetsTarget = ind.target ? ranked.filter((f) => f.value !== null && f.value >= ind.target!.value).length : null;
  const maxGap = Math.max(0.1, ...ranked.map((f) => Math.abs(f.gapToNational ?? 0)));

  const within = `${ON_PAR_THRESHOLD} ${ind.unit === "%" ? "percentage points" : ind.unit}`;
  // Table groups in reading order. Rows arrive best first, so each group keeps its own order.
  const groups: { status: GapStatus; title: string; rows: GapFacts[] }[] = (
    [
      ["ahead", (n: number) => `Ahead of Finland (${n})`],
      ["on-par", (n: number) => `About level (${n})`],
      ["behind", (n: number) => `Behind (${n})`],
      ["no-data", (n: number) => `No figure (${n})`],
    ] as const
  )
    .map(([status, title]) => {
      const rows = ranked.filter((f) => f.status === status);
      return { status, title: title(rows.length), rows };
    })
    .filter((g) => g.rows.length > 0);
  // The whole-country row goes where Finland itself would rank: before the first county below it.
  const nationalAt = ranked.findIndex((f) => f.gapToNational !== null && f.gapToNational < 0);

  const groupTitleClass: Record<GapStatus, string> = {
    ahead: "text-ahead",
    behind: "text-behind",
    "on-par": "text-ink",
    "no-data": "text-muted",
  };

  const GroupIcon = (st: PathwayStage) => GROUP_ICON[st] ?? Route;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/simulator" icon={Gauge} label="Simulator" title="What closing the breast screening gap would be worth" />
        <DataBadge ds={ds} />
      </AppHeader>

      <section className="mb-8" aria-labelledby="headline">
        <h1 id="headline" className="max-w-4xl text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem]">
          {behind === 0 ? "No county" : `${behind} of ${withData} counties`}{" "}
          {behind <= 1 ? "is" : "are"} behind Finland on {phrase.inSentence} in {year}.
        </h1>
        <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-5 sm:flex sm:gap-x-12">
          <Stat value={fmt(national, ind.unit)} label="Finland as a whole" />
          <Stat value={behind} label={behind === 1 ? "county behind" : "counties behind"} tone={behind ? "text-behind" : ""} />
          {ind.target && meetsTarget !== null && (
            <Stat value={`${meetsTarget}/${withData}`} label={`reach the ${ind.target.value}% target`} />
          )}
        </div>
      </section>

      <NationalView
        n={nationalPath}
        languages={languageGaps(REGISTRY.groups)}
        warnings={warnings}
        rising={rising}
        countyName={(id) => shortName(regionName.get(id) ?? String(id))}
        indicatorName={indName}
        example={example}
        counties={countyList}
        registryUrl={COLORECTAL_SOURCE.url}
      />

      <div className="mb-10 flex flex-col gap-3 rounded-[4px] bg-surface px-3 py-3 text-sm sm:px-4">
        <nav aria-label="Measure" className="flex flex-wrap gap-x-8 gap-y-2">
          {measureGroups().map((g) => {
            const Icon = GroupIcon(g.stage);
            return (
              <div key={g.stage} role="group" aria-label={GROUP_LABEL[g.stage] ?? STAGE_LABEL[g.stage]} className="flex flex-wrap items-center gap-1">
                <span className="mr-1 inline-flex items-center gap-1.5 text-muted">
                  <Icon aria-hidden size={16} strokeWidth={2} />
                  {GROUP_LABEL[g.stage] ?? STAGE_LABEL[g.stage]}
                </span>
                {g.items.map((i) => {
                  const on = i.id === ind.id;
                  return (
                    <Link
                      key={i.slug}
                      href={`/?ind=${i.slug}`}
                      title={i.nameEn}
                      className={`rounded-[3px] px-2.5 py-1 ${on ? "bg-ink font-semibold text-paper" : "text-ink hover:bg-par-soft"}`}
                      aria-current={on ? "page" : undefined}
                    >
                      {PHRASE[i.slug]?.tab ?? i.nameEn}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {recentYears.length > 1 && (
          <nav aria-label="Year" className="flex flex-wrap items-center gap-1">
            <span className="mr-1 inline-flex items-center gap-1.5 text-muted">
              <CalendarDays aria-hidden size={16} strokeWidth={2} />
              Year
            </span>
            {recentYears.map((y) => (
              <Link
                key={y}
                href={`/?ind=${ind.slug}&year=${y}`}
                className={`font-narrow rounded-[3px] px-2 py-1 tabular-nums ${y === year ? "bg-ink font-semibold text-paper" : "text-ink hover:bg-par-soft"}`}
                aria-current={y === year ? "page" : undefined}
              >
                {y}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-labelledby="map-h">
          <IconHeading icon={MapIcon} id="map-h" className="text-xl">Map</IconHeading>
          <More label="How to read the map" className="mb-4 mt-1">
            Each county shows its {year} figure for {ind.nameEn.toLowerCase()}. Colour shows how far it is from
            Finland as a whole. Click a county to open its brief.
          </More>
          <CountyMap regions={ds.regions} facts={factsById} unit={ind.unit} />
        </section>

        <section aria-labelledby="rank-h">
          <IconHeading icon={ListOrdered} id="rank-h" className="text-xl">Ranking</IconHeading>
          <More label="How the gap works" className="mb-4 mt-1">
            The gap is in {ind.unit === "%" ? "percentage points" : ind.unit} from Finland as a whole
            ({fmt(national, ind.unit)}). A county within {within} counts as level. Click a county to open its brief.
          </More>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-ink">
                  <th scope="col" className="w-8 py-2 pr-2 font-normal">
                    <span className="sr-only">Rank</span>
                  </th>
                  <th scope="col" className="py-2 pr-3 font-normal">County</th>
                  <th scope="col" className="py-2 pr-3 text-right font-normal">{year}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-normal">Gap</th>
                  <th scope="col" className="hidden w-[34%] py-2 font-normal sm:table-cell">
                    <span className="sr-only">Gap drawn as a bar</span>
                  </th>
                </tr>
              </thead>
              {groups.map((grp) => (
                <tbody key={grp.status}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={5}
                      className={`pb-1 pt-5 text-left text-xs font-semibold ${groupTitleClass[grp.status]}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {grp.status !== "no-data" && <StatusIcon status={grp.status} />}
                        {grp.title}
                      </span>
                    </th>
                  </tr>
                  {grp.rows.map((f) => {
                    const g = f.gapToNational ?? 0;
                    const w = `${(Math.abs(g) / maxGap) * 50}%`;
                    const showNational = nationalAt >= 0 && ranked[nationalAt] === f && national !== null;
                    return [
                      showNational && (
                        <tr key="national" className="border-y-2 border-ink">
                          <td className="py-1.5 pr-2" />
                          <th scope="row" className="py-1.5 pr-3 text-left font-semibold">
                            Finland as a whole
                          </th>
                          <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{fmt(national, ind.unit)}</td>
                          <td className="py-1.5 pr-3 text-right text-muted">
                            <span aria-hidden>0</span>
                            <span className="sr-only">reference</span>
                          </td>
                          <td className="hidden py-1.5 sm:table-cell" aria-hidden>
                            <div className="relative h-3">
                              <span className="absolute inset-y-[-6px] left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
                            </div>
                          </td>
                        </tr>
                      ),
                      <tr key={f.regionId} className="border-b border-rule last:border-0 hover:bg-surface">
                        <td className="py-1.5 pr-2 tabular-nums text-muted">{f.rank ?? ""}</td>
                        <td className="py-1.5 pr-3">
                          <Link href={`/county/${f.regionId}`} className="link">
                            {shortName(regionName.get(f.regionId) ?? String(f.regionId))}
                          </Link>
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(f.value, ind.unit)}</td>
                        <td className={`whitespace-nowrap py-1.5 pr-3 text-right font-semibold tabular-nums ${STATUS_TEXT[f.status]}`}>
                          {(f.status === "ahead" || f.status === "behind") && <StatusIcon status={f.status} className="mr-0.5 -translate-y-px" />}
                          {fmtGap(f.gapToNational)}
                          <span className="sr-only"> ({STATUS_LABEL[f.status]})</span>
                        </td>
                        <td className="hidden py-1.5 sm:table-cell" aria-hidden>
                          <div className="relative h-3">
                            <span className="absolute inset-y-[-4px] left-1/2 w-px bg-ink/40" />
                            {f.gapToNational !== null && (
                              <span
                                className={`absolute top-0.5 h-2 ${g < 0 ? "right-1/2 bg-behind" : "left-1/2 bg-ahead"} ${
                                  f.status === "on-par" ? "opacity-35" : ""
                                }`}
                                style={{ width: w }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>,
                    ];
                  })}
                </tbody>
              ))}
            </table>
          </div>
          {ranked.some((f) => f.status === "no-data" && regionName.get(f.regionId) === "Ahvenanmaa") && (
            <More label="Why Åland has no figure" className="mt-3">
              Åland runs its own health services outside the wellbeing services counties, so most national figures
              leave it out.
            </More>
          )}
        </section>
      </div>

      <section className="mt-14 border-t border-rule pt-6" aria-labelledby="pathway-h">
        <IconHeading icon={Route} id="pathway-h" className="mb-4 text-lg">
          Where this sits on the care pathway
        </IconHeading>
        <div className="max-w-3xl">
          <PathwayStrip active={ind.stage} />
        </div>
        <More label="Why two stops have no figures" className="mt-3">
          Nobody publishes referral or diagnosis delays by county yet. The national cancer roadmap lists fixing that
          as action 3.1.2.
        </More>
      </section>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <a href={ind.sourceUrl} className="link inline-flex items-center gap-1" target="_blank" rel="noreferrer">
          This measure on Sotkanet
          <ExternalLink aria-hidden size={12} />
        </a>
        <More label="About Gap Radar" className="basis-full">
          <Colophon />
        </More>
      </footer>
    </main>
  );
}
