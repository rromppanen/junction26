"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ChevronDown, Dices, Gauge, ListOrdered, RotateCcw, SlidersHorizontal, TriangleAlert, Upload, Users } from "lucide-react";
import { DEFAULT_ASSUMPTIONS, PARAM_GROUPS, PARAM_META } from "@/data/simulatorAssumptions";
import {
  invalidStageMix,
  monteCarlo,
  paramsFrom,
  parseAssumptionsCsv,
  quantile,
  sensitivity,
  simulate,
  totals,
  type Assumption,
  type ParamKey,
  type Params,
} from "@/lib/simulator";
import { IconHeading, More, Stat } from "@/components/ui";
import { EvidenceTag, PlaceholderTag } from "./EvidenceTag";
import { AttendanceChart, CostHistogram, SensitivityChart } from "./SimulatorCharts";
import { eur, eurShort, num } from "./format";
import type { SimCounty } from "./types";

const DRAWS = 2000;

const gapCounties = (counties: SimCounty[], target: number) => counties.filter((c) => c.attendance < target).map((c) => c.id);

function sliderBounds(a: Assumption): [number, number] {
  const m = PARAM_META[a.key];
  if (m.min !== undefined && m.max !== undefined) return [m.min, m.max];
  const span = a.high - a.low || Math.abs(a.base) * 0.5 || 1;
  const lo = Math.max(0, a.low - span);
  const hi = m.scale === 100 ? Math.min(1, a.high + span) : a.high + span;
  return [lo * m.scale, hi * m.scale];
}

function stepFor(lo: number, hi: number, decimals: number): number {
  return Math.max(Math.pow(10, -decimals), Number(((hi - lo) / 400).toPrecision(1)));
}

function AssumptionControl({
  a,
  value,
  onChange,
}: {
  a: Assumption;
  value: number;
  onChange: (v: number) => void;
}) {
  const m = PARAM_META[a.key];
  const id = `sim-${a.key}`;
  if (a.status === "fixed" || !(a.low < a.high)) {
    return (
      <div className="flex items-baseline justify-between gap-3 text-sm" title={a.note}>
        <span>{m.label}</span>
        <span className="tabular-nums">
          {num(value * m.scale, m.decimals)} <span className="text-xs text-muted">{m.unit}</span>
        </span>
      </div>
    );
  }
  const [lo, hi] = sliderBounds(a);
  const step = stepFor(lo, hi, m.decimals);
  const display = value * m.scale;
  const changed = Math.abs(value - a.base) > 1e-12;
  return (
    <div className="grid gap-1" title={a.note}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {m.label}
          {changed && <span className="ml-1 text-muted" aria-label="changed">•</span>}
        </label>
        <span className="flex items-baseline gap-1">
          <input
            type="number"
            id={`${id}-n`}
            aria-label={`${m.label}, exact value`}
            step={step}
            value={Number(display.toFixed(m.decimals + 2))}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(v)) onChange(v / m.scale);
            }}
            className="w-20 rounded-[3px] border border-rule bg-paper px-1.5 py-0.5 text-right text-sm tabular-nums"
          />
          <span className="whitespace-nowrap text-xs text-muted">{m.unit}</span>
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={lo}
        max={hi}
        step={step}
        value={display}
        onChange={(e) => onChange(Number(e.target.value) / m.scale)}
        className="w-full accent-ink"
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="tabular-nums">
          Range {num(a.low * m.scale, m.decimals)}–{num(a.high * m.scale, m.decimals)} · base {num(a.base * m.scale, m.decimals)}
        </span>
        {a.status === "placeholder" ? <PlaceholderTag /> : <EvidenceTag kind="observed" />}
      </div>
    </div>
  );
}

export function ScreeningSimulator({
  counties,
  national,
  year,
  initialFocus,
}: {
  counties: SimCounty[];
  national: number | null;
  year: number;
  initialFocus: number | null;
}) {
  const [assumptions, setAssumptions] = useState<Assumption[]>(DEFAULT_ASSUMPTIONS);
  const [P, setP] = useState<Params>(() => paramsFrom(DEFAULT_ASSUMPTIONS));
  const [focus, setFocus] = useState<number | null>(initialFocus);
  // Counties left out of the totals. Kept as exclusions, so a county that falls below a raised target is counted.
  const [excluded, setExcluded] = useState<Set<number>>(() =>
    new Set(initialFocus !== null ? counties.filter((c) => c.id !== initialFocus).map((c) => c.id) : []),
  );
  const [seed, setSeed] = useState(42);
  const [csvNote, setCsvNote] = useState<string | null>(null);
  // Outcomes built on placeholder assumptions stay hidden until the user asks for them.
  const [showIllustrative, setShowIllustrative] = useState(false);

  const byId = useMemo(() => new Map(counties.map((c) => [c.id, c])), [counties]);
  const focusCounty = focus !== null ? byId.get(focus) ?? null : null;

  const included = useMemo(() => new Set(counties.filter((c) => !excluded.has(c.id)).map((c) => c.id)), [counties, excluded]);
  // Counties counted in the totals: not left out and below the target.
  const scope = useMemo(
    () => counties.filter((c) => included.has(c.id) && c.attendance < P.target_attendance),
    [counties, included, P.target_attendance],
  );
  const t = useMemo(() => totals(P, scope), [P, scope]);

  // The heavier analyses follow the sliders a moment later, so dragging stays smooth.
  const dP = useDeferredValue(P);
  const dScope = useDeferredValue(scope);
  const sens = useMemo(() => sensitivity(dP, assumptions, dScope), [dP, assumptions, dScope]);
  const draws = useMemo(() => monteCarlo(dP, assumptions, dScope, DRAWS, seed), [dP, assumptions, dScope, seed]);

  const set = (key: ParamKey, v: number) => setP((prev) => ({ ...prev, [key]: v }));

  const showAll = () => {
    setFocus(null);
    setExcluded(new Set());
  };
  const toggle = (id: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const reset = () => {
    setP(paramsFrom(assumptions));
    setCsvNote(null);
  };
  const loadCsv = (file: File) => {
    file
      .text()
      .then((text) => {
        const res = parseAssumptionsCsv(text);
        if (!res.ok) {
          setCsvNote(`Couldn't use ${file.name}: missing or non-numeric values for ${res.missing.join(", ")}.`);
          return;
        }
        setAssumptions(res.assumptions);
        setP(paramsFrom(res.assumptions));
        setCsvNote(`Using ${file.name}. Reset returns to its values.`);
      })
      .catch(() => setCsvNote(`Couldn't read ${file.name}.`));
  };

  const badMix = invalidStageMix(P);
  const placeholders = assumptions.filter((a) => a.status === "placeholder").length;
  const target = P.target_attendance;
  const showOutcomes = placeholders === 0 || showIllustrative;

  // Headline: one county when focused, otherwise every county counted.
  let headline: string;
  if (focusCounty && focusCounty.attendance >= target) {
    headline = `${focusCounty.name} already reaches ${num(target, 1)}% breast screening attendance.`;
  } else if (focusCounty && scope.length === 1 && scope[0].id === focusCounty.id) {
    headline = `Raising ${focusCounty.name} from ${num(focusCounty.attendance, 1)}% to ${num(target, 1)}% means about ${num(t.screens)} more breast screens a year.`;
  } else if (scope.length === 0) {
    headline = `No county counted is below ${num(target, 1)}%.`;
  } else {
    headline = `Raising ${scope.length === gapCounties(counties, target).length ? "every county" : `${scope.length} ${scope.length === 1 ? "county" : "counties"}`} to ${num(target, 1)}% means about ${num(t.screens)} more breast screens a year.`;
  }

  const p = (pred: (v: number) => boolean) => `${num((draws.icer.filter(pred).length / draws.n) * 100)}%`;
  const saves = `${num((draws.net.filter((v) => v < 0).length / draws.n) * 100)}%`;

  const tableRows = counties
    .map((c) => ({ c, r: simulate(P, c.attendance, c.population, c.women), gap: Math.max(target - c.attendance, 0) }))
    .sort((a, b) => (showOutcomes ? b.r.ly - a.r.ly : b.r.screens - a.r.screens) || a.c.attendance - b.c.attendance);
  const maxLy = Math.max(...tableRows.map((x) => x.r.ly), 1e-9);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="sim-headline">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Gauge aria-hidden size={16} strokeWidth={2} /> Screening simulator · breast cancer · women aged 50–69
        </p>
        <h1
          id="sim-headline"
          className="mt-2 max-w-4xl text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.6rem]"
        >
          {headline}
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-snug">
          Screening helps by finding cancers at an earlier stage. The extra screens come from observed attendance and
          population figures. Life-years, deaths averted and costs need stage, survival and cost figures that are not yet
          sourced, so they are shown only on request, as an illustration.
        </p>
        {!showOutcomes && (
          <div className="mt-6 flex max-w-3xl flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowIllustrative(true)}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-3 py-1.5 text-sm hover:bg-par-soft"
            >
              <TriangleAlert aria-hidden size={14} /> Show illustrative outcomes
            </button>
            <span className="text-sm text-muted">
              Built on {placeholders} placeholder assumptions; not for quoting.
            </span>
          </div>
        )}
        {showOutcomes && (<>
        {placeholders > 0 && (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-behind">
            Illustration: {placeholders} placeholder assumptions, not for quoting
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-6 sm:flex sm:flex-wrap sm:gap-x-12">
          <Stat value={num(t.ly, 1)} label="life-years gained a year" />
          <Stat value={num(t.deaths, 1)} label="breast cancer deaths averted a year" />
          <Stat value={eurShort(t.net)} label="net cost a year" />
          <Stat value={t.ly > 0 ? (t.net < 0 ? "Saves money" : eur(t.icer)) : "–"} label="per life-year gained" />
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <EvidenceTag kind="simulated" />
          <span>
            {num(t.shifted, 1)} cancers a year found earlier, {num(t.late, 1)} of them before they reach a late stage.
            Programme {eurShort(t.programme)}, treatment {eurShort(t.treatment)}.
          </span>
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          Screening attendance is a Goal 2 target (80% in every county). Its payoff counts towards Goal 3, whose headline
          target is 10% fewer cancer deaths: about 1,330 a year from today&rsquo;s 13,300 (strategy p. 5). Closing these
          gaps would avert about {num(t.deaths, 1)} of them each year.
        </p>
        </>)}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="text-muted">
            {focusCounty ? `Showing ${focusCounty.name}.` : `${scope.length} ${scope.length === 1 ? "county" : "counties"} counted.`}{" "}
            Finland as a whole: {num(national ?? NaN, 1)}% in {year}.
          </span>
          {(focusCounty || scope.length < gapCounties(counties, target).length) && (
            <button type="button" onClick={showAll} className="rounded-[3px] px-2 py-1 text-ink underline decoration-rule underline-offset-4 hover:bg-par-soft">
              Show every county
            </button>
          )}
          {focusCounty && (
            <Link href={`/county/${focusCounty.id}`} className="link">
              Back to the {focusCounty.name} brief
            </Link>
          )}
        </div>
        {placeholders > 0 && (
          <p className="mt-5 flex max-w-3xl items-start gap-2 rounded-[4px] bg-par-soft px-3 py-2.5 text-sm">
            <TriangleAlert aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>
              Attendance and population are observed Sotkanet figures. {placeholders} of the {assumptions.length} assumptions
              are still placeholders, so treat every result here as an illustration until they are replaced with sourced values.
            </span>
          </p>
        )}
      </section>

      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside aria-labelledby="assumptions-h" className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <IconHeading icon={SlidersHorizontal} id="assumptions-h" className="text-xl">Assumptions</IconHeading>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 hover:bg-par-soft">
              <RotateCcw aria-hidden size={14} /> Reset
            </button>
            <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 hover:bg-par-soft focus-within:outline focus-within:outline-2 focus-within:outline-ink">
              <Upload aria-hidden size={14} /> Load assumptions.csv
              <input
                type="file"
                accept=".csv,text/csv"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadCsv(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {csvNote && <p className="mt-2 text-xs text-muted" role="status">{csvNote}</p>}
          <More label="How the ranges are used" className="mt-2">
            Each slider shows the low–high range from assumptions.csv. The sensitivity chart moves each assumption to
            those two ends; the uncertainty section draws all of them at once inside that range, peaking at your setting.
          </More>
          <div className="mt-5 grid gap-7">
            {PARAM_GROUPS.map((g) => {
              const items = assumptions.filter((a) => PARAM_META[a.key].group === g);
              if (!items.length) return null;
              return (
                <fieldset key={g} className="grid gap-4">
                  <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{g}</legend>
                  {g === "Stage at diagnosis" && badMix.length > 0 && (
                    <p className="text-xs font-semibold text-behind" role="alert">
                      Regional and distant add up to more than 100% for {badMix.join(" and ")}. Lower one of them.
                    </p>
                  )}
                  {items.map((a) => (
                    <AssumptionControl key={a.key} a={a} value={P[a.key]} onChange={(v) => set(a.key, v)} />
                  ))}
                </fieldset>
              );
            })}
          </div>
        </aside>

        <div className="grid min-w-0 gap-14">
          <section aria-labelledby="gap-h">
            <IconHeading icon={Users} id="gap-h" className="text-xl">Where the gap is</IconHeading>
            <p className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <EvidenceTag kind="observed" />
              Breast screening attendance in {year}, Sotkanet indicator 3621.
            </p>
            <AttendanceChart
              counties={counties}
              national={national}
              target={target}
              included={included}
              focus={focus}
              year={year}
              onToggle={toggle}
            />
          </section>

          <section aria-labelledby="county-h">
            <IconHeading icon={ListOrdered} id="county-h" className="text-xl">What closing each gap is worth</IconHeading>
            <p className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <EvidenceTag kind={showOutcomes ? "simulated" : "observed"} />
              {showOutcomes ? "Per year, for one year of diagnoses." : "Extra screens a year from observed attendance and population."} Untick a county to leave it out of the totals.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b border-ink">
                    <th scope="col" className="w-7 py-2 font-normal"><span className="sr-only">Counted</span></th>
                    <th scope="col" className="py-2 pr-3 font-normal">County</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">{year}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal" title="Change a year, least-squares over the years shown">Trend</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Gap</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Extra screens</th>
                    {showOutcomes && (<>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Life-years</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Deaths averted</th>
                    <th scope="col" className="py-2 text-right font-normal">Net cost</th>
                    </>)}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(({ c, r, gap }) => {
                    const has = gap > 0;
                    const on = has && included.has(c.id);
                    return (
                      <tr key={c.id} className={`border-b border-rule hover:bg-surface ${on ? "" : "text-muted"}`}>
                        <td className="py-1.5">
                          <input
                            type="checkbox"
                            id={`sim-inc-${c.id}`}
                            checked={on}
                            disabled={!has}
                            onChange={() => toggle(c.id)}
                            aria-label={`Count ${c.name}`}
                            className="accent-ink"
                          />
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-3">
                          <Link href={`/county/${c.id}`} className={`link ${focus === c.id ? "font-semibold" : ""}`}>{c.name}</Link>
                          {c.persistent && has && (
                            <span className="ml-1.5 text-xs font-semibold text-behind" title={`Below Finland every year 2019–${year}`}>
                              every year below
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{num(c.attendance, 1)}%</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {c.trend === null ? "–" : `${c.trend > 0 ? "+" : c.trend < 0 ? "−" : "±"}${num(Math.abs(c.trend), 2)}`}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{has ? num(gap, 1) : "at target"}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{has ? num(r.screens) : "–"}</td>
                        {showOutcomes && (<>
                        <td className="whitespace-nowrap py-1.5 pr-3 text-right tabular-nums">
                          {has && (
                            <span
                              aria-hidden
                              className={`mr-2 inline-block h-2 align-middle ${on ? "bg-ink" : "bg-par"}`}
                              style={{ width: `${(r.ly / maxLy) * 56}px` }}
                            />
                          )}
                          {has ? num(r.ly, 1) : "–"}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{has ? num(r.deaths, 2) : "–"}</td>
                        <td className="py-1.5 text-right tabular-nums">{has ? eur(r.net) : "–"}</td>
                        </>)}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink font-semibold">
                    <td />
                    <th scope="row" className="py-2 pr-3 text-left">Counted</th>
                    <td colSpan={3} />
                    <td className="py-2 pr-3 text-right tabular-nums">{num(t.screens)}</td>
                    {showOutcomes && (<>
                    <td className="py-2 pr-3 text-right tabular-nums">{num(t.ly, 1)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{num(t.deaths, 2)}</td>
                    <td className="py-2 text-right tabular-nums">{eur(t.net)}</td>
                    </>)}
                  </tr>
                </tfoot>
              </table>
            </div>
            <More label="How to read the table" className="mt-3">
              Net cost is the extra screens plus outreach plus the change in treatment costs; a negative figure means
              fewer late-stage cancers save more than the programme costs. Life-years and deaths are for the cancers
              diagnosed in one year; the gains come over the following years. The cost per life-year is the same in every
              county because they share one set of assumptions and the model is linear. Counties differ in how much there
              is to gain.
            </More>
          </section>

          {showOutcomes && (
          <details className="group" open={false}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-[3px] border border-rule px-3 py-2 font-semibold hover:bg-par-soft [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal aria-hidden size={16} className="text-muted" />
              Show the analysis: what drives the result and how sure we can be
              <ChevronDown aria-hidden size={15} className="transition-transform group-open:rotate-180" />
            </summary>
          <div className="mt-8 grid gap-x-10 gap-y-14 xl:grid-cols-2">
            <section aria-labelledby="sens-h" className="min-w-0">
              <IconHeading icon={SlidersHorizontal} id="sens-h" className="text-xl">What drives the result</IconHeading>
              <p className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <EvidenceTag kind="simulated" />
                Cost per life-year with each assumption at its low and high value, the rest as set.
              </p>
              <SensitivityChart rows={sens} current={totals(dP, dScope).icer} />
            </section>

            <section aria-labelledby="mc-h" className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <IconHeading icon={Dices} id="mc-h" className="text-xl">How sure we can be</IconHeading>
                <button
                  type="button"
                  onClick={() => setSeed((s) => (s * 48271) % 2147483647)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 text-sm hover:bg-par-soft"
                >
                  <Dices aria-hidden size={14} /> Draw again
                </button>
              </div>
              <p className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <EvidenceTag kind="simulated" />
                {num(DRAWS)} draws with every assumption varied at once.
              </p>
              {draws.icer.length === 0 ? (
                <p className="text-sm text-muted">Include at least one county below the target to see the spread.</p>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted">
                      <tr className="border-b border-ink">
                        <th scope="col" className="py-1.5 text-left font-normal">A year</th>
                        <th scope="col" className="py-1.5 text-right font-normal">Low (5%)</th>
                        <th scope="col" className="py-1.5 text-right font-normal">Median</th>
                        <th scope="col" className="py-1.5 text-right font-normal">High (95%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Life-years gained", draws.ly, (v: number) => num(v)],
                        ["Net cost", draws.net, eurShort],
                        ["Cost per life-year", draws.icer, eurShort],
                      ].map(([label, vals, f]) => (
                        <tr key={label as string} className="border-b border-rule">
                          <th scope="row" className="py-1.5 text-left font-normal">{label as string}</th>
                          {[0.05, 0.5, 0.95].map((q) => (
                            <td key={q} className="py-1.5 text-right tabular-nums">
                              {(f as (v: number) => string)(quantile(vals as number[], q))}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    <Stat value={p((v) => v < 20000)} label="chance under €20k per life-year" />
                    <Stat value={p((v) => v < 30000)} label="under €30k" />
                    <Stat value={p((v) => v < 50000)} label="under €50k" />
                    <Stat value={saves} label="chance it saves money outright" />
                  </div>
                  <div className="mt-5">
                    <CostHistogram values={draws.icer} />
                  </div>
                </>
              )}
            </section>
          </div>
          </details>
          )}
        </div>
      </div>
    </div>
  );
}
