"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { accessOption, serviceOption, type BreakKind, type Costs, type CountyPathway, type OptionResult } from "@/lib/pathway";
import type { Cited } from "@/data/scenarioDefaults";
import { More } from "@/components/ui";
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
        Compare targets for bowel screening in {name}, using {p.year} counts. Annual costs and additional findings are modelled. Choose an option to carry its target and assumptions into a Finnish board memo.
      </p>

      <div><More label="Adjust unit costs and view sources" className="mt-4 rounded-lg border border-rule p-3">
      <p id="cost-assumptions" className="scroll-mt-6 text-sm">Pre-filled prices are reference assumptions. Replace them with local costs. Blank fields mean a total cannot yet be calculated.</p>
      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="c-col" label="Cost per colonoscopy (€)" value={col} onChange={setCol} source={defaults.perColonoscopy} />
        <Field id="c-contact" label="Cost per nurse call (€)" value={contact} onChange={setContact} source={defaults.perContact} />
        <Field id="c-test" label="Cost per test kit analysed (€)" value={test} onChange={setTest} source={defaults.perTest} placeholder="no public price found" />
        <Field id="c-rem" label="Outreach cost per extra participant (€)" value={reminder} onChange={setReminder} source={null} placeholder="your cost" />
      </div>

      </More></div>
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
  const [ownText, setOwnText] = useState(own.toFixed(1));
  const rows = [...presets, ...(!presets.some((row) => row.target === own) ? [{ label: "Your own target", target: own }] : [])];
  const run = (t: number): OptionResult => (kind === "service" ? serviceOption(p, t, costs) : accessOption(p, t, costs));

  return (
    <article aria-labelledby={`opt-${kind}`}>
      <h3 id={`opt-${kind}`} className="font-semibold">
        {o.title} <span className="font-normal text-muted">({o.rate} now {today.toFixed(1)}%)</span>
      </h3>
      <p className="mt-1 max-w-2xl text-sm">{o.what}</p>
      <More label="Research supporting this intervention" className="mt-2">
        {o.evidence.map((e, i) => (
          <span key={e}>
            {i > 0 && " · "}
            <a href={OPTION_EVIDENCE[e].url} target="_blank" rel="noreferrer" className="link" title={OPTION_EVIDENCE[e].note}>{OPTION_EVIDENCE[e].label}</a>
          </span>
        ))}
      </More>

      <label htmlFor={`own-${kind}`} className="mt-3 block text-sm font-medium">
        Your own target: <strong className="tabular-nums">{own.toFixed(1)}%</strong>
      </label>
      <input aria-label={`${o.title}: target percentage`} type="number" min={Math.floor(today)} max={kind === "service" ? 99 : 90} step={0.1} value={ownText}
        onChange={(e) => {
          setOwnText(e.target.value);
          const next = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(next) && next >= Math.floor(today) && next <= (kind === "service" ? 99 : 90)) setOwn(next);
        }}
        onBlur={() => setOwnText(own.toFixed(1))}
        className="mt-2 w-28 rounded-md border border-rule bg-surface px-3 py-2 tabular-nums" />
      <input
        id={`own-${kind}`} type="range" min={Math.floor(today)} max={kind === "service" ? 99 : 90} step={0.1}
        value={own} onChange={(e) => { setOwn(Number(e.target.value)); setOwnText(Number(e.target.value).toFixed(1)); }} className="mt-1 block w-full max-w-xl accent-current"
      />

      <div className="mt-4 overflow-x-auto">
        <table className="responsive-options w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink align-bottom">
              <th scope="col" className="py-2 pr-3 font-semibold">Target</th>
              {kind === "access" && <th scope="col" className="py-2 pr-3 font-semibold">Extra participants</th>}
              <th scope="col" className="py-2 pr-3 font-semibold">Extra colonoscopies</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Modelled cancers</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Modelled advanced precursors</th>
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
                      {kind === "access" && <Cell label="Extra participants">{r.extraParticipants.toLocaleString("en-GB")}</Cell>}
                      <Cell label="Extra colonoscopies">{r.extraColonoscopies.toLocaleString("en-GB")}</Cell>
                      <Cell label="Modelled cancers">{`about ${r.cancers.toLocaleString("en-GB")}`}</Cell>
                      <Cell label="Modelled advanced precursors">{`about ${r.advanced.toLocaleString("en-GB")}`}</Cell>
                      <Cell label="Annual cost" missing={kind === "service" ? "Add colonoscopy and nurse-call costs above" : "Add test, outreach and colonoscopy costs above"}>{r.cost === null ? null : eur(r.cost)}</Cell>
                      <Cell label="Cost per modelled finding" missing="Complete unit costs above">{r.costPerFinding === null ? null : eur(r.costPerFinding)}</Cell>
                      <td className="py-2">
                        <Link href={memo} className="primary-action mt-2 whitespace-nowrap sm:mt-0" aria-label={`Create Finnish memo: ${o.title}, ${row.label}, ${row.target.toFixed(1)}%`} title="Create a Finnish board memo with this option">
                          <FileText aria-hidden size={14} /> Create memo (FI)
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

function Cell({ children, label, missing = ASK }: { children: React.ReactNode; label: string; missing?: string }) {
  return <td data-label={label} className={`py-2 pr-3 tabular-nums ${children === null ? "text-muted" : ""}`}>{children === null ? <a href="#cost-assumptions" className="link">{missing}</a> : children}</td>;
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
        className="mt-1 w-full rounded-md border border-rule bg-paper px-2.5 py-1.5 text-base tabular-nums"
      />
      {source && value === String(source.value) && (
        <p className="mt-1 text-xs text-muted">
          <a href={source.url} target="_blank" rel="noreferrer" className="link">{source.label}</a>. {source.note}
        </p>
      )}
    </div>
  );
}
