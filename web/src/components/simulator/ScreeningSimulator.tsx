"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Dices, Download, FileText, Gauge, Info, ListOrdered, RotateCcw, SlidersHorizontal, TriangleAlert, Upload, Users } from "lucide-react";
import { assumptionsReportHtml, assumptionsToCsv } from "@/lib/assumptionsExport";
import { CHOICE_KEYS, DEFAULT_ASSUMPTIONS, PARAM_META } from "@/data/simulatorAssumptions";
import {
  invalidStageMix,
  monteCarlo,
  parseAssumptionsCsv,
  quantile,
  scenarioParams,
  sensitivity,
  simulate,
  totals,
  type Assumption,
  type ParamKey,
  type Params,
  type Scenario,
} from "@/lib/simulator";
import { IconHeading, More, Stat } from "@/components/ui";
import { EvidenceTag } from "./EvidenceTag";
import { EvidenceTables } from "./EvidenceTables";
import { AttendanceChart, CostHistogram, SensitivityChart } from "./SimulatorCharts";
import { eur, eurShort, num } from "./format";
import type { SimCounty } from "./types";

const DRAWS = 2000;

const gapCounties = (counties: SimCounty[], target: number) => counties.filter((c) => c.attendance < target).map((c) => c.id);

/** One of the two figures the user sets: a slider with an exact-value box and a line of plain guidance. */
function ChoiceControl({
  a,
  label,
  hint,
  step,
  value,
  onChange,
}: {
  a: Assumption;
  label: string;
  hint: React.ReactNode;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const m = PARAM_META[a.key];
  const id = `sim-${a.key}`;
  const lo = m.min ?? a.low;
  const hi = m.max ?? a.high;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-medium">{label}</label>
        <span className="flex items-baseline gap-1">
          <input
            type="number"
            id={`${id}-n`}
            aria-label={`${label}, exact value`}
            min={lo}
            max={hi}
            step={step}
            value={Number(value.toFixed(m.decimals))}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(v)) onChange(Math.min(hi, Math.max(lo, v)));
            }}
            className="w-20 rounded-[3px] border border-rule bg-paper px-1.5 py-0.5 text-right tabular-nums"
          />
          <span className="text-sm text-muted">{m.unit}</span>
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={lo}
        max={hi}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink"
      />
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the report in a new tab and starts printing, where the browser offers "Save as PDF". */
function openPrintable(html: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}

const SCENARIOS: { id: Scenario; label: string; help: string }[] = [
  { id: "cautious", label: "Cautious", help: "Every evidence figure moved halfway to the end of its range that makes screening look worse." },
  { id: "central", label: "Central", help: "Every evidence figure at its best estimate." },
  { id: "optimistic", label: "Optimistic", help: "Every evidence figure moved halfway to the end of its range that makes screening look better." },
];


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
  // Three inputs in all: the target, the outreach cost, and one switch that moves the evidence figures together.
  const [choices, setChoices] = useState<Partial<Record<ParamKey, number>>>({});
  const [scenario, setScenario] = useState<Scenario>("central");
  const P = useMemo<Params>(() => ({ ...scenarioParams(assumptions, scenario), ...choices }), [assumptions, scenario, choices]);
  const [focus, setFocus] = useState<number | null>(initialFocus);
  // Counties left out of the totals. Kept as exclusions, so a county that falls below a raised target is counted.
  const [excluded, setExcluded] = useState<Set<number>>(() =>
    new Set(initialFocus !== null ? counties.filter((c) => c.id !== initialFocus).map((c) => c.id) : []),
  );
  const [seed, setSeed] = useState(42);
  const [csvNote, setCsvNote] = useState<string | null>(null);

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
  // Only the evidence is uncertain: the user's choices stay as set, and every county has its own count of women.
  const evidence = useMemo(
    () => assumptions.filter((a) => !CHOICE_KEYS.includes(a.key) && a.key !== "women_50_69_share"),
    [assumptions],
  );
  const sens = useMemo(() => sensitivity(dP, evidence, dScope), [dP, evidence, dScope]);
  const draws = useMemo(() => monteCarlo(dP, evidence, dScope, DRAWS, seed), [dP, evidence, dScope, seed]);

  const set = (key: ParamKey, v: number) => setChoices((prev) => ({ ...prev, [key]: v }));
  const assumption = (key: ParamKey) => assumptions.find((a) => a.key === key)!;
  const changed = scenario !== "central" || CHOICE_KEYS.some((k) => choices[k] !== undefined && choices[k] !== assumption(k).base);

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
    setChoices({});
    setScenario("central");
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
        setChoices({});
        setScenario("central");
        setCsvNote(`Using the figures in ${file.name}.`);
      })
      .catch(() => setCsvNote(`Couldn't read ${file.name}.`));
  };

  const badMix = invalidStageMix(P);
  const placeholders = assumptions.filter((a) => a.status === "placeholder").length;
  const target = P.target_attendance;
  const best = counties.reduce<SimCounty | null>((b, c) => (b === null || c.attendance > b.attendance ? c : b), null);

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
    .sort((a, b) => b.r.ly - a.r.ly || a.c.attendance - b.c.attendance);
  const maxLy = Math.max(...tableRows.map((x) => x.r.ly), 1e-9);

  return (
    <div className="grid gap-14">
      <section aria-labelledby="sim-headline">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Gauge aria-hidden size={16} strokeWidth={2} /> Breast screening simulator · women aged 50–69
        </p>
        <h1
          id="sim-headline"
          className="mt-2 max-w-4xl text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.6rem]"
        >
          {headline}
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-snug">
          Screening helps by finding cancers at an earlier stage. Choose a target and what you would spend to reach it.
        </p>

        <div role="group" aria-labelledby="assumptions-h" className="mt-7 rounded-[4px] border border-rule bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="assumptions-h" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Your choices</h2>
            {changed && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-sm text-muted hover:bg-par-soft hover:text-ink">
                <RotateCcw aria-hidden size={13} /> Reset
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-x-8 gap-y-6 md:grid-cols-3">
            <ChoiceControl
              a={assumption("target_attendance")}
              label="Target attendance"
              step={0.5}
              value={P.target_attendance}
              onChange={(v) => set("target_attendance", v)}
              hint={
                <>
                  National goal: 80% in every county.
                  {best && ` Best today: ${best.name}, ${num(best.attendance, 1)}%.`}
                </>
              }
            />
            <ChoiceControl
              a={assumption("cost_outreach")}
              label="Outreach cost"
              step={5}
              value={P.cost_outreach}
              onChange={(v) => set("cost_outreach", v)}
              hint="Per extra woman screened: reminders, letters in her language, a navigator or a mobile unit. No published figure; use your own."
            />
            <fieldset className="grid content-start gap-1.5">
              <legend className="mb-1.5 font-medium">Evidence</legend>
              <div className="grid grid-cols-3 overflow-hidden rounded-[3px] border border-ink">
                {SCENARIOS.map((s) => (
                  <label
                    key={s.id}
                    className={`cursor-pointer px-1 py-1 text-center text-sm focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink ${
                      scenario === s.id ? "bg-ink font-semibold text-paper" : "bg-paper hover:bg-par-soft"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sim-scenario"
                      value={s.id}
                      checked={scenario === s.id}
                      onChange={() => setScenario(s.id)}
                      className="sr-only"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted">{SCENARIOS.find((s) => s.id === scenario)!.help}</p>
            </fieldset>
          </div>
        </div>

        <div aria-live="polite" className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 sm:flex sm:flex-wrap sm:gap-x-12">
          <Stat value={num(t.ly, 1)} label="life-years gained a year" />
          <Stat value={num(t.deaths, 1)} label="breast cancer deaths averted a year" />
          <Stat value={eurShort(t.net)} label="net cost a year" />
          <Stat value={t.ly > 0 ? (t.net < 0 ? "Saves money" : eur(t.icer)) : "–"} label="per life-year gained" />
        </div>
        <p className="mt-4 flex max-w-3xl flex-wrap items-center gap-2 text-sm text-muted">
          <EvidenceTag kind="simulated" />
          <span>
            {num(t.shifted, 1)} cancers a year found earlier, {num(t.late, 1)} of them before they spread. The cancer
            strategy aims for about 1,330 fewer cancer deaths a year; this would be {num(t.deaths, 1)} of them.
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
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
          <p className="mt-5 flex max-w-3xl items-start gap-2 rounded-[4px] bg-par-soft px-3 py-2.5 text-sm" role="status">
            <TriangleAlert aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>{placeholders} of the figures in the loaded file are placeholders. Treat the results as an illustration.</span>
          </p>
        )}
      </section>

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
            <IconHeading icon={ListOrdered} id="county-h" className="text-xl">Compare the county scenarios</IconHeading>
            <p className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <EvidenceTag kind="simulated" />
              Per year, for one year of diagnoses. Untick a county to leave it out of the totals.
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
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Life-years</th>
                    <th scope="col" className="py-2 pr-3 text-right font-normal">Deaths averted</th>
                    <th scope="col" className="py-2 text-right font-normal">Net cost</th>
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
                    <td className="py-2 pr-3 text-right tabular-nums">{num(t.ly, 1)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{num(t.deaths, 2)}</td>
                    <td className="py-2 text-right tabular-nums">{eur(t.net)}</td>
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

          <section aria-labelledby="evidence-h" className="scroll-mt-4">
            <IconHeading icon={BookOpen} id="evidence-h" className="text-xl">What the model assumes</IconHeading>
            <p className="mb-5 mt-1 flex max-w-3xl items-start gap-2 text-sm text-muted">
              <Info aria-hidden size={15} className="mt-0.5 shrink-0" />
              <span>
                Published figures, or figures calculated from them. None is measured in a single county, so read the
                results as an order of magnitude. The Evidence switch above moves them all together.
              </span>
            </p>
            {badMix.length > 0 && (
              <p className="mb-3 text-sm font-semibold text-behind" role="alert">
                Regional and distant shares add up to more than 100% for {badMix.join(" and ")}. Check the loaded file.
              </p>
            )}
            <EvidenceTables assumptions={assumptions} P={P} />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 text-muted hover:bg-par-soft hover:text-ink focus-within:outline focus-within:outline-2 focus-within:outline-ink">
                <Upload aria-hidden size={14} /> Use your own figures (CSV)
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
              <button
                type="button"
                onClick={() => downloadFile("screening-simulator-assumptions.csv", assumptionsToCsv(assumptions, choices), "text/csv;charset=utf-8")}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 text-muted hover:bg-par-soft hover:text-ink"
              >
                <Download aria-hidden size={14} /> Download assumptions (CSV)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!openPrintable(assumptionsReportHtml(assumptions, P, scenario))) {
                    setCsvNote("Your browser blocked the new tab. Allow pop-ups for this site to save the PDF.");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-2.5 py-1 text-muted hover:bg-par-soft hover:text-ink"
              >
                <FileText aria-hidden size={14} /> Save as PDF
              </button>
              {csvNote && <span className="text-xs text-muted" role="status">{csvNote}</span>}
            </div>
          </section>

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
        </div>
    </div>
  );
}
