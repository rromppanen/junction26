import { COLORECTAL_SOURCE, REGISTRY, loadPathway } from "@/lib/pathwayData";

/** National figures from the Finnish Cancer Registry for the latest settled year. */
export function ImpactStrip() {
  const view = loadPathway(960); // any mainland county carries the same national figures
  if (!view) return null;
  const { year, national } = view.pathway;
  const f = REGISTRY.colorectal.national[year].findings;
  const missing = f.noColonoscopy;
  const pct = Math.round((missing / f.positive) * 1000) / 10;
  const fmt = (n: number) => n.toLocaleString("en-GB");
  return (
    <section aria-label="National figures" className="rounded-xl border border-rule bg-white p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-3xl font-semibold text-brand">{national.participation}%</p>
          <p className="text-sm text-muted">of invited people returned the test in {year}</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-behind">{fmt(missing)} of {fmt(f.positive)}</p>
          <p className="text-sm text-muted">positive tests ({pct}%) had no programme colonoscopy in {year}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        Source: <a className="underline" href={COLORECTAL_SOURCE.url}>Finnish Cancer Registry</a>, national figures for {year}.
      </p>
    </section>
  );
}
