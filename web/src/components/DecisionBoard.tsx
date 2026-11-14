"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { accessOption, serviceOption, type BreakKind, type Costs, type CountyPathway, type OptionResult } from "@/lib/pathway";
import type { Cited } from "@/data/scenarioDefaults";
import { OPTION_EVIDENCE } from "@/data/pathwayCosts";

export type BoardDefaults = { perColonoscopy: Cited; perContact: Cited; perTest: Cited | null };

const ASK = "enter your figure";
const num = (s: string): number | null => (s.trim() === "" ? null : Number(s));
const eur = (v: number) => `€${v.toLocaleString("en-GB")}`;

const OPTIONS: Record<BreakKind, { title: string; what: string; rate: string; evidence: (keyof typeof OPTION_EVIDENCE)[] }> = {
  service: {
    title: "Follow up every positive",
    what: "A screening nurse calls every person with a positive test who has no colonoscopy booked, and books it during the call.",
    rate: "share of positives examined",
    evidence: ["navigation", "delay", "standard"],
  },
  access: {
    title: "Bring more people to the test",
    what: "Reminders to everyone who hasn't returned the test, with invitations in the area's largest languages.",
    rate: "share returning the test",
    evidence: ["reminders"],
  },
};

/**
 * The decision board: options for the county's two breaks, each with people, findings and cost per year.
 * Targets and unit costs are the county lead's to change. Nothing is predicted; the board does not choose.
 */
export function DecisionBoard({ p, order, defaults, regionId, name }: {
  p: CountyPathway; order: BreakKind[]; defaults: BoardDefaults; regionId: number; name: string;
}) {
  const [col, setCol] = useState(String(defaults.perColonoscopy.value));
  const [contact, setContact] = useState(String(defaults.perContact.value));
  const [test, setTest] = useState(defaults.perTest ? String(defaults.perTest.value) : "");
  const [reminder, setReminder] = useState("");
  const costs = (kind: BreakKind): Costs => ({
    perColonoscopy: num(col),
    perContact: kind === "service" ? num(contact) : num(reminder),
    perTest: num(test),
  });

  return (
    <div>
      <p className="max-w-2xl text-sm text-muted">
        Each row is one option at one target, for a year of colorectal screening in {name} ({p.year} counts). Change the targets and costs to your own.
        The board compares; it does not recommend.
      </p>

      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="c-col" label="Cost per colonoscopy (€)" value={col} onChange={setCol} source={defaults.perColonoscopy} />
        <Field id="c-contact" label="Cost per nurse call (€)" value={contact} onChange={setContact} source={defaults.perContact} />
        <Field id="c-test" label="Cost per test kit analysed (€)" value={test} onChange={setTest} source={defaults.perTest} placeholder="no public price found" />
        <Field id="c-rem" label="Outreach cost per extra participant (€)" value={reminder} onChange={setReminder} source={null} placeholder="your cost" />
      </div>

      <div className="mt-8 space-y-10">
        {order.map((kind) => (
          <Option key={kind} kind={kind} p={p} costs={costs(kind)} regionId={regionId} rawCosts={{ col, contact, test, reminder }} />
        ))}
      </div>

      <ul className="mt-8 space-y-1 border-t border-rule pt-3 text-xs text-muted">
        <li>Extra colonoscopies use the same endoscopy capacity that sets the waiting time: check capacity before choosing more colonoscopies.</li>
        <li>Findings use Finland&rsquo;s yield per colonoscopy ({(p.yield.cancerPerColonoscopy * 100).toFixed(1)}% cancer, {(p.yield.advancedPerColonoscopy * 100).toFixed(1)}% advanced precursor), the county&rsquo;s own positivity and follow-up rates.</li>
        <li>Pre-filled prices are a county&rsquo;s prices to other payers, not production costs.</li>
      </ul>
    </div>
  );
}

function Option({ kind, p, costs, regionId, rawCosts }: {
  kind: BreakKind; p: CountyPathway; costs: Costs; regionId: number; rawCosts: Record<string, string>;
}) {
  const o = OPTIONS[kind];
  const today = kind === "service" ? p.rates.examined : p.rates.participation;
  const presets: { label: string; target: number }[] = kind === "service"
    ? [{ label: "Finland", target: p.national.examined }, { label: "Best quarter of counties", target: p.bestQuarter.examined }, { label: "Best county", target: p.bestCounty.examined }]
    : [{ label: "Finland", target: p.national.participation }, { label: "Best quarter of counties", target: p.bestQuarter.participation }, { label: "National 80% target", target: 80 }];
  const [own, setOwn] = useState(Math.max(today, presets[1].target));
  const rows = [...presets, { label: "Your own target", target: own }];
  const run = (t: number): OptionResult => (kind === "service" ? serviceOption(p, t, costs) : accessOption(p, t, costs));

  return (
    <article aria-labelledby={`opt-${kind}`}>
      <h3 id={`opt-${kind}`} className="font-semibold">
        {o.title} <span className="font-normal text-muted">({o.rate} now {today.toFixed(1)}%)</span>
      </h3>
      <p className="mt-1 max-w-2xl text-sm">{o.what}</p>
      <p className="mt-1 text-xs text-muted">
        {o.evidence.map((e, i) => (
          <span key={e}>
            {i > 0 && " · "}
            <a href={OPTION_EVIDENCE[e].url} target="_blank" rel="noreferrer" className="link" title={OPTION_EVIDENCE[e].note}>{OPTION_EVIDENCE[e].label}</a>
          </span>
        ))}
      </p>

      <label htmlFor={`own-${kind}`} className="mt-3 block text-sm font-medium">
        Your own target: <strong className="tabular-nums">{own.toFixed(1)}%</strong>
      </label>
      <input
        id={`own-${kind}`} type="range" min={Math.floor(today)} max={kind === "service" ? 99 : 90} step={0.5}
        value={own} onChange={(e) => setOwn(Number(e.target.value))} className="mt-1 block w-full max-w-xl accent-current"
      />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink align-bottom">
              <th scope="col" className="py-2 pr-3 font-semibold">Target</th>
              {kind === "access" && <th scope="col" className="py-2 pr-3 font-semibold">Extra participants</th>}
              <th scope="col" className="py-2 pr-3 font-semibold">Extra colonoscopies</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Cancers found</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Advanced precursors found</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Cost per year</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Cost per finding</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Memo</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const reached = row.target <= today;
              const r = run(row.target);
              const memo = `/county/${regionId}/memo?${new URLSearchParams({ option: kind, target: row.target.toFixed(1), ...rawCosts })}`;
              return (
                <tr key={row.label} className="border-b border-rule align-top">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {row.label}
                    <span className="block font-normal tabular-nums text-muted">{row.target.toFixed(1)}%</span>
                  </th>
                  {reached ? (
                    <td colSpan={kind === "access" ? 7 : 6} className="py-2 text-ahead">already reached</td>
                  ) : (
                    <>
                      {kind === "access" && <Cell>{r.extraParticipants.toLocaleString("en-GB")}</Cell>}
                      <Cell>{r.extraColonoscopies.toLocaleString("en-GB")}</Cell>
                      <Cell>{`about ${r.cancers.toLocaleString("en-GB")}`}</Cell>
                      <Cell>{`about ${r.advanced.toLocaleString("en-GB")}`}</Cell>
                      <Cell>{r.cost === null ? null : eur(r.cost)}</Cell>
                      <Cell>{r.costPerFinding === null ? null : eur(r.costPerFinding)}</Cell>
                      <td className="py-2">
                        <Link href={memo} className="inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-2 py-1 hover:bg-par-soft" title="Open the board memo with this option">
                          <FileText aria-hidden size={14} /> Memo
                        </Link>
                      </td>
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

function Cell({ children }: { children: React.ReactNode }) {
  return <td className={`py-2 pr-3 tabular-nums ${children === null ? "text-muted" : ""}`}>{children === null ? ASK : children}</td>;
}

function Field({ id, label, value, onChange, source, placeholder = "" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; source: Cited | null; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id} type="number" inputMode="decimal" min={0} step="any" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[3px] border border-rule bg-paper px-2.5 py-1.5 text-base tabular-nums"
      />
      {source && value === String(source.value) && (
        <p className="mt-1 text-xs text-muted">
          <a href={source.url} target="_blank" rel="noreferrer" className="link">{source.label}</a>. {source.note}
        </p>
      )}
    </div>
  );
}
