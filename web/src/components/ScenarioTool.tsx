"use client";

import { useState } from "react";
import { computeScenario, type ScenarioResult } from "@/lib/scenario";
import type { Cited } from "@/data/scenarioDefaults";

export type ScenarioProgramme = {
  indicatorId: number;
  name: string; // e.g. "Breast"
  today: number;
  national: number | null;
  target: number | null;
  bestQuartile: number | null;
  costPerScreen: Cited | null;
  cancersPer1000Screened: Cited | null;
};

const MAX = 95;
const ASK = "enter your figure";
const num = (s: string): number | null => (s.trim() === "" ? null : Number(s));
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

/** "What if we raise screening?": the lead's own numbers in, a side-by-side of options out. Nothing is predicted. */
export function ScenarioTool({ programmes }: { programmes: ScenarioProgramme[] }) {
  if (programmes.length === 0) {
    return <p className="text-muted">No screening attendance figures are published for this county, so there is nothing to compare yet.</p>;
  }
  return (
    <div>
      <p className="max-w-2xl text-sm text-muted">
        Pick how far attendance should rise and add your own cost figures. The table shows each option side by side;
        it does not recommend one.
      </p>
      <div className="mt-5 space-y-10">
        {programmes.map((p) => <Programme key={p.indicatorId} p={p} />)}
      </div>
      <ul className="mt-8 space-y-1 border-t border-rule pt-3 text-xs text-muted">
        <li>Cost-effectiveness also depends on who is reached: small groups with low attendance can matter even when the cost per cancer found is high.</li>
        <li>Assumptions are yours to change; nothing here is predicted by AI.</li>
      </ul>
    </div>
  );
}

function Programme({ p }: { p: ScenarioProgramme }) {
  const [invited, setInvited] = useState("");
  const [cost, setCost] = useState(p.costPerScreen ? String(p.costPerScreen.value) : "");
  const [rate, setRate] = useState("");
  const min = Math.min(MAX, Math.ceil(p.today * 10) / 10);
  const [custom, setCustom] = useState(Math.min(MAX, Math.max(p.target ?? 0, p.today)));

  const run = (target: number): ScenarioResult =>
    computeScenario({ today: p.today, target, invitedPerYear: num(invited), costPerScreen: num(cost), cancersPer1000Screened: num(rate) });

  const presets: { label: string; target: number | null }[] = [
    { label: "Finland level", target: p.national },
    { label: `${p.target ?? 80}% target`, target: p.target },
    { label: "Best quarter of counties", target: p.bestQuartile },
  ];
  const rows = [...presets, { label: "Your own goal", target: custom as number | null }];
  const id = `sc-${p.indicatorId}`;

  return (
    <article aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="font-semibold">
        {p.name} cancer screening <span className="font-normal text-muted">(attending now: {p.today.toFixed(1)}%)</span>
      </h3>

      <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-3">
        <Field id={`${id}-inv`} label="People invited per year" value={invited} onChange={setInvited} placeholder="e.g. your county's invitation count" />
        <Field id={`${id}-cost`} label="Cost per screen (€)" value={cost} onChange={setCost} source={p.costPerScreen} placeholder="your cost per screen" emptyHint="No public Finnish cost per screen exists for this programme. Enter your own figure." />
        <Field id={`${id}-rate`} label="Cancers found per 1,000 screened" value={rate} onChange={setRate} source={p.cancersPer1000Screened} placeholder="your detection rate" />
      </div>

      {min < MAX && (
        <div className="mt-4">
          <label htmlFor={`${id}-goal`} className="text-sm font-medium">
            Your own goal: <strong className="tabular-nums">{custom.toFixed(1)}%</strong>
          </label>
          <input
            id={`${id}-goal`}
            type="range"
            min={min}
            max={MAX}
            step={0.1}
            value={Math.min(MAX, Math.max(min, custom))}
            onChange={(e) => setCustom(Number(e.target.value))}
            className="mt-1 block w-full max-w-xl accent-current"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((x) =>
              x.target !== null && x.target > p.today && x.target <= MAX ? (
                <button
                  key={x.label}
                  type="button"
                  onClick={() => setCustom(Math.round(x.target! * 10) / 10)}
                  className="rounded-[3px] border border-rule px-2.5 py-1 text-sm hover:bg-par-soft"
                >
                  {x.label} ({x.target.toFixed(1)}%)
                </button>
              ) : null,
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink align-bottom">
              <th scope="col" className="py-2 pr-3 font-semibold">Option</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Extra per 1,000 invited</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Extra people per year</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Extra cost per year</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Extra cancers found per year</th>
              <th scope="col" className="py-2 font-semibold">Cost per extra cancer found</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.target === null) {
                return (
                  <tr key={row.label} className="border-b border-rule">
                    <th scope="row" className="py-2 pr-3 font-medium">{row.label}</th>
                    <td colSpan={5} className="py-2 text-muted">no figure published</td>
                  </tr>
                );
              }
              const reached = row.target <= p.today;
              const r = run(row.target);
              return (
                <tr key={row.label} className="border-b border-rule align-top">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {row.label}
                    <span className="block font-normal tabular-nums text-muted">{row.target.toFixed(1)}%</span>
                  </th>
                  {reached ? (
                    <td colSpan={5} className="py-2 text-ahead">already reached</td>
                  ) : (
                    <>
                      <Cell>+{r.extraPer1000}</Cell>
                      <Cell>{r.extraPerYear === null ? null : r.extraPerYear.toLocaleString("en-GB")}</Cell>
                      <Cell>{r.extraCostPerYear === null ? null : eur(r.extraCostPerYear)}</Cell>
                      <Cell>{r.extraCancersPerYear === null ? null : r.extraCancersPerYear.toLocaleString("en-GB")}</Cell>
                      <Cell last none={r.extraCancersPerYear === 0 && r.extraCostPerYear !== null}>
                        {r.costPerExtraCancer === null ? null : eur(r.costPerExtraCancer)}
                      </Cell>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

/** null children = the lead has not entered the figure this needs. */
function Cell({ children, last, none }: { children: React.ReactNode; last?: boolean; none?: boolean }) {
  const empty = children === null;
  return (
    <td className={`py-2 tabular-nums ${last ? "" : "pr-3"} ${empty ? "text-muted" : ""}`}>
      {empty ? (none ? "no cancers expected" : ASK) : children}
    </td>
  );
}

function Field({
  id, label, value, onChange, source, placeholder, emptyHint,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; source?: Cited | null; placeholder: string; emptyHint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[3px] border border-rule bg-paper px-2.5 py-1.5 text-base tabular-nums"
      />
      {source && value === String(source.value) && (
        <p className="mt-1 text-xs text-muted">
          <a href={source.url} target="_blank" rel="noreferrer" className="link">{source.label}</a>. {source.note} Change it to use your own.
        </p>
      )}
      {!source && emptyHint && value === "" && <p className="mt-1 text-xs text-muted">{emptyHint}</p>}
    </div>
  );
}
