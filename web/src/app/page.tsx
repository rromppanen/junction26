import Link from "next/link";
import { getDataset } from "@/lib/data";
import { INDICATORS, indicatorBySlug } from "@/data/indicators";
import { latestYear, rankCounties } from "@/lib/gap";
import type { GapFacts } from "@/lib/types";
import { CountyMap } from "@/components/CountyMap";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { STATUS_LABEL, STATUS_TEXT, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";

export const dynamic = "force-dynamic";

// How each measure reads inside a sentence and on a tab. UI wording only; the data keeps nameEn.
const PHRASE: Record<string, { tab: string; inSentence: string }> = {
  "breast-screening": { tab: "Breast screening", inSentence: "breast cancer screening attendance" },
  "colorectal-screening": { tab: "Bowel screening", inSentence: "bowel cancer screening attendance" },
  "cervical-screening": { tab: "Cervical screening", inSentence: "cervical cancer screening attendance" },
  "breast-survival": { tab: "Breast cancer survival", inSentence: "five-year breast cancer survival" },
  "bowel-survival": { tab: "Bowel cancer survival", inSentence: "five-year bowel cancer survival" },
};

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
  const national = ranked.find((f) => f.national !== null)?.national ?? null;
  const behind = ranked.filter((f) => f.status === "behind").length;
  const withData = ranked.filter((f) => f.value !== null).length;
  const recentYears = years.slice(-6);
  const phrase = PHRASE[ind.slug] ?? { tab: ind.nameEn, inSentence: ind.nameEn.toLowerCase() };
  const meetsTarget = ind.target ? ranked.filter((f) => f.value !== null && f.value >= ind.target!.value).length : null;
  const maxGap = Math.max(0.1, ...ranked.map((f) => Math.abs(f.gapToNational ?? 0)));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <header className="mb-10">
        <p className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className="text-lg font-semibold tracking-tight">Gap Radar</span>
          <DataBadge ds={ds} />
        </p>
        <h1 className="max-w-4xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          {behind === 0 ? "No county" : `${behind} of ${withData} counties`}{" "}
          {behind <= 1 ? "is" : "are"} behind the whole of Finland on {phrase.inSentence} in {year}.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          The country as a whole is at <strong className="font-semibold text-ink">{fmt(national, ind.unit)}</strong>
          {ind.higherIsBetter ? ", and higher is better." : ", and lower is better."}{" "}
          {ind.target && meetsTarget !== null && (
            <>
              The national cancer strategy asks for {ind.target.value}% in every county;{" "}
              <strong className="font-semibold text-ink">
                {meetsTarget === 0 ? "none" : meetsTarget === withData ? "all" : `${meetsTarget} of ${withData}`}
              </strong>{" "}
              {meetsTarget === 1 ? "gets" : "get"} there.{" "}
            </>
          )}
          Pick a county to read its brief and three things it could do next.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-muted">{ind.strategyGoal}</p>
      </header>

      <nav aria-label="Measure" className="mb-2 flex flex-wrap gap-x-6 gap-y-1 border-b border-rule">
        {INDICATORS.map((i) => {
          const on = i.id === ind.id;
          return (
            <Link
              key={i.slug}
              href={`/?ind=${i.slug}`}
              title={i.nameEn}
              className={`-mb-px border-b-[3px] pb-2 pt-1 ${on ? "border-ink font-semibold" : "border-transparent text-muted hover:text-ink"}`}
              aria-current={on ? "page" : undefined}
            >
              {PHRASE[i.slug]?.tab ?? i.nameEn}
            </Link>
          );
        })}
      </nav>
      {recentYears.length > 1 && (
        <nav aria-label="Year" className="mb-10 flex flex-wrap items-center gap-1 pt-2 text-sm">
          <span className="mr-2 text-muted">Year</span>
          {recentYears.map((y) => (
            <Link
              key={y}
              href={`/?ind=${ind.slug}&year=${y}`}
              className={`rounded-[3px] px-2 py-0.5 tabular-nums ${y === year ? "bg-ink text-paper" : "text-muted hover:bg-par-soft hover:text-ink"}`}
              aria-current={y === year ? "page" : undefined}
            >
              {y}
            </Link>
          ))}
        </nav>
      )}
      {recentYears.length <= 1 && <div className="mb-10" />}

      <section className="mb-12" aria-labelledby="pathway-h">
        <h2 id="pathway-h" className="mb-3 text-sm text-muted">
          This measure sits at <span className="font-semibold text-ink">{STAGE_LABEL[ind.stage].toLowerCase()}</span> on
          the care pathway
        </h2>
        <PathwayStrip
          active={ind.stage}
          note="Nobody publishes referral or diagnosis delays by county yet. The national cancer roadmap lists fixing that as action 3.1.2."
        />
      </section>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-labelledby="map-h">
          <h2 id="map-h" className="text-xl font-semibold tracking-tight">Where the gaps are</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            {ind.nameEn}, {year}. Pick a county to open its brief.
          </p>
          <CountyMap regions={ds.regions} facts={factsById} unit={ind.unit} />
        </section>

        <section aria-labelledby="rank-h">
          <h2 id="rank-h" className="text-xl font-semibold tracking-tight">Best to worst</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            The gap is in {ind.unit === "%" ? "percentage points" : ind.unit} against the whole country (
            {fmt(national, ind.unit)}).<span className="hidden sm:inline"> Right of the line is better.</span>
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
              <tbody>
                {ranked.map((f) => {
                  const g = f.gapToNational ?? 0;
                  const w = `${(Math.abs(g) / maxGap) * 50}%`;
                  return (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <a href={ind.sourceUrl} className="link" target="_blank" rel="noreferrer">
          This measure on Sotkanet ({ind.nameFi})
        </a>
      </footer>
    </main>
  );
}
