import Link from "next/link";
import { getDataset } from "@/lib/data";
import { INDICATORS, indicatorBySlug } from "@/data/indicators";
import { latestYear, rankCounties } from "@/lib/gap";
import type { GapFacts } from "@/lib/types";
import { TileMap } from "@/components/TileMap";
import { PathwayStrip } from "@/components/PathwayStrip";
import { DataBadge } from "@/components/DataBadge";
import { STATUS_CLASSES, STATUS_LABEL, STAGE_LABEL, fmt, fmtGap, shortName } from "@/components/format";

export const dynamic = "force-dynamic";

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
  const recentYears = years.slice(-6);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Gap Radar</h1>
          <p className="mt-1 max-w-2xl text-muted">
            See where each wellbeing services county falls behind the national level in cancer care, and at which
            stage of the care pathway.
          </p>
        </div>
        <DataBadge ds={ds} />
      </header>

      <nav aria-label="Indicator" className="mb-3 flex flex-wrap gap-2">
        {INDICATORS.map((i) => (
          <Link
            key={i.slug}
            href={`/?ind=${i.slug}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              i.id === ind.id ? "border-nordic bg-nordic text-white" : "border-rule bg-surface hover:border-nordic"
            }`}
            aria-current={i.id === ind.id ? "page" : undefined}
          >
            {i.nameEn}
          </Link>
        ))}
      </nav>
      {recentYears.length > 1 && (
        <nav aria-label="Year" className="mb-6 flex flex-wrap items-center gap-1 text-sm">
          <span className="mr-1 text-muted">Year</span>
          {recentYears.map((y) => (
            <Link
              key={y}
              href={`/?ind=${ind.slug}&year=${y}`}
              className={`rounded px-2 py-0.5 tabular-nums ${y === year ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              aria-current={y === year ? "page" : undefined}
            >
              {y}
            </Link>
          ))}
        </nav>
      )}

      <section className="mb-8" aria-labelledby="pathway-h">
        <h2 id="pathway-h" className="mb-2 text-sm font-semibold text-muted">
          Care pathway — this indicator measures {STAGE_LABEL[ind.stage].toLowerCase()}
        </h2>
        <PathwayStrip active={ind.stage} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-labelledby="map-h" className="rounded-lg border border-rule bg-surface p-4">
          <h2 id="map-h" className="font-serif text-xl font-semibold">{ind.nameEn}, {year}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Whole country: <strong className="text-ink">{fmt(national, ind.unit)}</strong> ·{" "}
            {ind.higherIsBetter ? "higher is better" : "lower is better"} ·{" "}
            <span className="text-behind font-semibold">{behind}</span> of {ranked.length} counties behind
          </p>
          <p className="-mt-2 mb-4 text-xs text-muted">
            {ind.strategyGoal}
            {ind.target && (
              <>
                {" · "}
                <strong className="text-ink">
                  {ranked.filter((f) => f.value !== null && f.value >= ind.target!.value).length} of {ranked.filter((f) => f.value !== null).length}
                </strong>{" "}
                counties meet the {ind.target.value}% target
              </>
            )}
          </p>
          <TileMap regions={ds.regions} facts={factsById} unit={ind.unit} />
        </section>

        <section aria-labelledby="rank-h">
          <h2 id="rank-h" className="mb-3 font-serif text-xl font-semibold">Counties ranked, best first</h2>
          <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-rule text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">County</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">National</th>
                  <th className="px-3 py-2 text-right font-medium" title="Positive = better than national">Gap</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((f) => (
                  <tr key={f.regionId} className="border-b border-rule/60 last:border-0 hover:bg-paper">
                    <td className="px-3 py-1.5 tabular-nums text-muted">{f.rank ?? "–"}</td>
                    <td className="px-3 py-1.5">
                      <Link href={`/county/${f.regionId}`} className="text-nordic underline-offset-2 hover:underline">
                        {shortName(regionName.get(f.regionId) ?? String(f.regionId))}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt(f.value, ind.unit)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted">{fmt(f.national, ind.unit)}</td>
                    <td className={`px-3 py-1.5 text-right font-semibold tabular-nums ${f.status === "behind" ? "text-behind" : f.status === "ahead" ? "text-ahead" : ""}`}>
                      {fmtGap(f.gapToNational)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATUS_CLASSES[f.status]}`}>{STATUS_LABEL[f.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            Gap is sign-corrected: positive means better than the whole country. Select a county for its brief and
            recommended actions.
          </p>
        </section>
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
        <DataBadge ds={ds} />
        <a href={ind.sourceUrl} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
          Indicator source on Sotkanet
        </a>
      </footer>
    </main>
  );
}
