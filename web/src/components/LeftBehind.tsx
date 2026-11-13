import { AREA_LEVEL_CAVEAT, MIN_ASSOCIATION_N, measurePhrase, type EquityFacts } from "@/lib/equity";
import { fmt, fmtGap } from "@/components/format";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Equity lens: the municipalities furthest behind their own county, and area-level patterns behind them. */
export function LeftBehind({ equity, name }: { equity: EquityFacts; name: string }) {
  return (
    <>
      {!equity.applicable ? (
        <p className="max-w-2xl text-sm text-muted">
          Not applicable here.{" "}
          {equity.municipalityCount === 1
            ? `${name} is a single municipality, so there are no municipalities inside it to compare.`
            : `${name} has fewer than two municipalities with 2,000 or more residents, so there is nothing to compare.`}
        </p>
      ) : (
        <>
          <p className="mb-6 max-w-2xl text-sm text-muted">
            The five municipalities with the lowest attendance compared with {name} as a whole, for each screening
            programme (a plus sign means still above the county). Only municipalities with at least 2,000 residents
            ({equity.municipalityCount} here), because figures for tiny ones swing from year to year.
          </p>
          {equity.lagging.length === 0 ? (
            <p className="text-sm text-muted">Sotkanet has no municipality figures for these measures here.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-6 border-t border-ink pt-5 md:grid-cols-3">
              {equity.lagging.map((l) => (
                <article key={l.indicator.id} className="print-break">
                  <h3 className="font-semibold leading-snug">{cap(measurePhrase(l.indicator))}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {l.year}. {name} as a whole: {fmt(l.countyValue, l.indicator.unit)}
                  </p>
                  <ol className="mt-3 text-sm">
                    {l.rows.map((r) => (
                      <li key={r.region.id} className="grid grid-cols-[1fr_auto_4.5rem] gap-x-3 border-b border-rule py-1.5">
                        <span className="break-words">{r.region.name}</span>
                        <span className="font-semibold tabular-nums">{fmt(r.value, l.indicator.unit)}</span>
                        <span className={`text-right tabular-nums ${r.gapToCounty < 0 ? "text-behind" : "text-muted"}`}>
                          {fmtGap(r.gapToCounty)}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-1.5 text-xs text-muted">Last column: points against {name} as a whole. Sotkanet {l.indicator.id}.</p>
                </article>
              ))}
            </div>
          )}

          <h3 className="mb-2 mt-8 font-semibold">Patterns between municipalities</h3>
          {equity.associations.length > 0 ? (
            <ul className="max-w-3xl list-[square] space-y-2 pl-5 font-serif text-lg leading-snug marker:text-par">
              {equity.associations.map((a) => (
                <li key={`${a.indicator.id}-${a.context.id}`}>{a.sentence}</li>
              ))}
            </ul>
          ) : (
            <p className="max-w-2xl text-sm text-muted">
              {equity.municipalityCount < MIN_ASSOCIATION_N
                ? `Too few municipalities to look for patterns (at least ${MIN_ASSOCIATION_N} are needed).`
                : "No clear pattern between screening attendance and population size, education level, foreign background or unemployment across these municipalities."}
            </p>
          )}
          {equity.municipalityCount >= MIN_ASSOCIATION_N && (
            <p className="mt-3 max-w-2xl text-xs text-muted">
              Patterns shown are rank correlations of 0.4 or stronger (either direction), using Sotkanet 127, 180, 3074, 5102
              and 181. Education level is Sotkanet&rsquo;s measure of average years of study after basic education.
            </p>
          )}
        </>
      )}
      <p className="mt-4 max-w-2xl border-l-2 border-par pl-3 text-sm">{AREA_LEVEL_CAVEAT}</p>
    </>
  );
}
