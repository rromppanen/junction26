import Link from "next/link";
import { getDataset } from "@/lib/data";
import { INDICATORS, indicatorBySlug } from "@/data/indicators";
import { ON_PAR_THRESHOLD, latestYear, rankCounties } from "@/lib/gap";
import type { GapFacts, GapStatus, Indicator, PathwayStage } from "@/lib/types";
import { CountyMap } from "@/components/CountyMap";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { Wordmark } from "@/components/Wordmark";
import { Colophon } from "@/components/Colophon";
import { STATUS_LABEL, STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";

export const dynamic = "force-dynamic";

// How each measure reads inside a sentence and on a tab. UI wording only; the data keeps nameEn.
// `tab` is short because the tabs sit under a group name ("Screening attendance: Breast, Bowel, Cervical").
const PHRASE: Record<string, { tab: string; inSentence: string }> = {
  "breast-screening": { tab: "Breast", inSentence: "breast cancer screening attendance" },
  "colorectal-screening": { tab: "Bowel", inSentence: "bowel cancer screening attendance" },
  "cervical-screening": { tab: "Cervical", inSentence: "cervical cancer screening attendance" },
  "breast-survival": { tab: "Breast cancer", inSentence: "five-year breast cancer survival" },
  "bowel-survival": { tab: "Bowel cancer", inSentence: "five-year bowel cancer survival" },
};

// Measure tabs are grouped by pathway stage; these are the group names a reader sees.
const GROUP_LABEL: Partial<Record<PathwayStage, string>> = {
  detection: "Screening attendance",
  outcome: "Five-year survival",
};

function measureGroups(): { stage: PathwayStage; items: Indicator[] }[] {
  const out: { stage: PathwayStage; items: Indicator[] }[] = [];
  for (const i of INDICATORS) {
    const g = out.find((x) => x.stage === i.stage);
    if (g) g.items.push(i);
    else out.push({ stage: i.stage, items: [i] });
  }
  return out;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ ind?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const ds = await getDataset();
  const ind = (sp.ind && indicatorBySlug(sp.ind)) || indicatorBySlug("breast-screening") || INDICATORS[0];
  const years = [...new Set(ds.values.filter((v) => v.indicatorId === ind.id).map((v) => v.year))].sort((a, b) => a - b);
  const latest = latestYear(ds, ind);
  const reqYear = sp.year ? Number(sp.year) : NaN;
  const year = years.includes(reqYear) ? reqYear : latest;

  const ranked = rankCounties(ds, ind, year);
  const factsById = new Map<number, GapFacts>(ranked.map((f) => [f.regionId, f]));
  const regionName = new Map(ds.regions.map((r) => [r.id, r.name]));
  const national = ranked.find((f) => f.national !== null)?.national ?? null;
  const behind = ranked.filter((f) => f.status === "behind").length;
  const withData = ranked.filter((f) => f.value !== null).length;
  const recentYears = years.slice(-6);
  const phrase = PHRASE[ind.slug] ?? { tab: ind.nameEn, inSentence: ind.nameEn.toLowerCase() };
  const meetsTarget = ind.target ? ranked.filter((f) => f.value !== null && f.value >= ind.target!.value).length : null;
  const maxGap = Math.max(0.1, ...ranked.map((f) => Math.abs(f.gapToNational ?? 0)));

  const pts = ind.unit === "%" ? "points" : ind.unit;
  const within = `${ON_PAR_THRESHOLD} ${ind.unit === "%" ? "percentage points" : ind.unit}`;
  // Table groups in reading order. Rows arrive best first, so each group keeps its own order.
  const groups: { status: GapStatus; title: string; rows: GapFacts[] }[] = (
    [
      ["ahead", (n: number) => `${count(n, "county", "counties")} more than ${ON_PAR_THRESHOLD} ${pts} ahead`],
      ["on-par", (n: number) => `${count(n, "county", "counties")} within ${ON_PAR_THRESHOLD} ${pts} of Finland`],
      ["behind", (n: number) => `${count(n, "county", "counties")} more than ${ON_PAR_THRESHOLD} ${pts} behind`],
      ["no-data", (n: number) => `No figure for ${n === 1 ? "this county" : "these counties"} in ${year}`],
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

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <header className="mb-8">
        <p className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <Wordmark />
          <DataBadge ds={ds} />
        </p>
        <h1 className="max-w-4xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          {behind === 0 ? "No county" : `${behind} of ${withData} counties`}{" "}
          {behind <= 1 ? "is" : "are"} behind the whole of Finland on {phrase.inSentence} in {year}.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Finland as a whole reaches <strong className="font-semibold text-ink">{fmt(national, ind.unit)}</strong>
          {ind.higherIsBetter ? "." : ", and lower is better here."}{" "}
          {ind.target && meetsTarget !== null ? (
            <>
              The national cancer strategy asks for {ind.target.value}% in every county, and{" "}
              <strong className="font-semibold text-ink">
                {meetsTarget === 0 ? "none" : meetsTarget === withData ? "all" : `${meetsTarget} of ${withData}`}
              </strong>{" "}
              {meetsTarget === 1 ? "gets" : "get"} there.{" "}
            </>
          ) : (
            <>{ind.strategyGoal}. </>
          )}
          Open a county for its brief and three things it could do next.
        </p>
      </header>

      <div className="mb-10 border-y border-rule py-3 text-sm">
        <nav aria-label="Measure" className="flex flex-wrap gap-x-10 gap-y-3">
          {measureGroups().map((g) => (
            <div key={g.stage} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-muted">{GROUP_LABEL[g.stage] ?? STAGE_LABEL[g.stage]}</span>
              {g.items.map((i) => {
                const on = i.id === ind.id;
                return (
                  <Link
                    key={i.slug}
                    href={`/?ind=${i.slug}`}
                    title={i.nameEn}
                    className={`border-b-2 pb-0.5 ${on ? "border-ink font-semibold" : "border-transparent text-muted hover:border-rule hover:text-ink"}`}
                    aria-current={on ? "page" : undefined}
                  >
                    {PHRASE[i.slug]?.tab ?? i.nameEn}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {recentYears.length > 1 && (
          <nav aria-label="Year" className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-muted">Figures for</span>
            {recentYears.map((y) => (
              <Link
                key={y}
                href={`/?ind=${ind.slug}&year=${y}`}
                className={`font-narrow border-b-2 pb-0.5 tabular-nums ${y === year ? "border-ink font-semibold" : "border-transparent text-muted hover:border-rule hover:text-ink"}`}
                aria-current={y === year ? "page" : undefined}
              >
                {y}
              </Link>
            ))}
            {year === latest && <span className="text-xs text-muted">the latest year published</span>}
          </nav>
        )}
      </div>

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-labelledby="map-h">
          <h2 id="map-h" className="sr-only">
            Map: {ind.nameEn}, {year}
          </h2>
          <p className="mb-4 max-w-md text-sm text-muted">
            Each county shows its own figure for {year}. Colour shows how far it is from Finland as a whole.
          </p>
          <CountyMap regions={ds.regions} facts={factsById} unit={ind.unit} />
        </section>

        <section aria-labelledby="rank-h">
          <h2 id="rank-h" className="text-xl font-semibold tracking-tight">Every county, best first</h2>
          <p className="mb-4 mt-1 max-w-lg text-sm text-muted">
            The gap is in {ind.unit === "%" ? "percentage points" : ind.unit} from Finland as a whole. A county
            within {within} counts as level.
          </p>
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
                      {grp.title}
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
                        <td className={`py-1.5 pr-3 text-right font-semibold tabular-nums ${STATUS_TEXT[f.status]}`}>
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
            <p className="mt-3 text-xs text-muted">
              Åland runs its own health services outside the wellbeing services counties, so most national
              figures leave it out.
            </p>
          )}
        </section>
      </div>

      <section className="mt-14 border-t border-rule pt-6" aria-labelledby="pathway-h">
        <h2 id="pathway-h" className="mb-3 text-sm text-muted">
          {phrase.inSentence.charAt(0).toUpperCase() + phrase.inSentence.slice(1)} is a measure of{" "}
          <span className="font-semibold text-ink">{STAGE_LABEL[ind.stage].toLowerCase()}</span> on the care pathway
        </h2>
        <PathwayStrip
          active={ind.stage}
          note="Nobody publishes referral or diagnosis delays by county yet. The national cancer roadmap lists fixing that as action 3.1.2."
        />
      </section>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <a href={ind.sourceUrl} className="link" target="_blank" rel="noreferrer">
          This measure on Sotkanet ({ind.nameFi})
        </a>
        <Colophon className="basis-full" />
      </footer>
    </main>
  );
}
