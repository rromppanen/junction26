"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Layers, RotateCcw, Users } from "lucide-react";
import {
  COST_PER_SCREEN,
  DEFAULT_LAYERS,
  TARGET_ATTENDANCE,
  countySegments,
  runDesign,
  type EvidenceLevel,
  type Layer,
  type LayerId,
} from "@/lib/invitation";
import { IconHeading, More, Stat } from "@/components/ui";
import { eur, eurShort, num } from "@/components/simulator/format";

export type InviteCounty = {
  id: number;
  name: string;
  attendance: number;
  women: number;
  foreignPer1000: number | null;
};

const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  finnish: "Finnish evidence",
  international: "International evidence",
  placeholder: "Placeholder effect",
};

function EvidenceChip({ level }: { level: EvidenceLevel }) {
  const cls =
    level === "finnish"
      ? "border border-ink text-ink"
      : level === "international"
        ? "border border-dashed border-ink text-ink"
        : "bg-par-soft text-muted";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-[3px] px-1.5 py-px text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] ${cls}`}>
      {EVIDENCE_LABEL[level]}
    </span>
  );
}

const pct = (v: number) => `${num(v * 100, 1)}%`;

export function InvitationDesigner({
  counties,
  nationalWomen,
  nationalForeignPer1000,
  year,
  initialCounty,
}: {
  counties: InviteCounty[];
  nationalWomen: number;
  nationalForeignPer1000: number | null;
  year: number;
  initialCounty: number;
}) {
  const [countyId, setCountyId] = useState(initialCounty);
  const [on, setOn] = useState<Record<LayerId, boolean>>(
    () => Object.fromEntries(DEFAULT_LAYERS.map((l) => [l.id, true])) as Record<LayerId, boolean>,
  );
  const [edits, setEdits] = useState<Partial<Record<LayerId, { effect: number; costPerReached: number }>>>({});

  const county = counties.find((c) => c.id === countyId) ?? counties[0];
  const layers: Layer[] = DEFAULT_LAYERS.map((l) => ({ ...l, ...edits[l.id] }));
  const segments = useMemo(
    () =>
      countySegments({
        women: county.women,
        attendancePct: county.attendance,
        nationalWomen,
        foreignPer1000: county.foreignPer1000,
        nationalForeignPer1000,
      }),
    [county, nationalWomen, nationalForeignPer1000],
  );
  const result = runDesign(segments, layers.filter((l) => on[l.id]));
  const byId = new Map(result.layers.map((r) => [r.id, r]));
  const reachesTarget = result.after.attendance >= TARGET_ATTENDANCE;

  const setEdit = (id: LayerId, key: "effect" | "costPerReached", v: number) => {
    const base = layers.find((l) => l.id === id)!;
    setEdits((e) => ({ ...e, [id]: { effect: base.effect, costPerReached: base.costPerReached, [key]: v } }));
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Breast screening invitation designer</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Keep the booked appointment that works for most women, and add cheap fixes for everyone and extra help only for
        the groups who are not coming. Switch layers on and off to see who comes, what it costs and how close the
        county gets to the 80% goal.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Wellbeing services county</span>
          <select
            value={county.id}
            onChange={(e) => setCountyId(Number(e.target.value))}
            className="min-h-11 rounded-md border border-rule bg-surface px-3 text-base"
          >
            {counties.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({num(c.attendance, 1)}%)
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setEdits({})}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted hover:bg-par-soft hover:text-ink"
        >
          <RotateCcw aria-hidden size={15} /> Reset effects and costs
        </button>
      </div>

      <section aria-labelledby="result-h" className="mt-8 border-t border-rule pt-6">
        <h2 id="result-h" className="sr-only">Result</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat
            value={`${pct(result.before.attendance)} → ${pct(result.after.attendance)}`}
            label={`Attendance, ${county.name} (${year} baseline)`}
            tone={reachesTarget ? "text-ahead" : ""}
          />
          <Stat value={`+${num(result.extraScreened)}`} label="More women screened a year" />
          <Stat value={eurShort(result.totalCost)} label="Cost a year, incl. the extra mammograms" />
          <Stat
            value={result.costPerExtra === null ? "–" : eur(result.costPerExtra)}
            label="Cost per extra woman screened"
          />
        </div>
        <p className="mt-4 max-w-3xl text-sm">
          {reachesTarget
            ? `This design reaches the 80% goal.`
            : `${num(result.stillToTarget)} more women a year would still be needed to reach 80%.`}{" "}
          {result.recordedElsewhere > 0 &&
            `Another ${num(result.recordedElsewhere)} would be recorded as screened elsewhere, so the recorded figure becomes ${pct(result.recordedAttendance)}.`}
        </p>

        <div className="mt-6 max-w-xl">
          <IconHeading icon={Users} as="h3" className="text-base">Who comes, by mother tongue</IconHeading>
          <table className="mt-2 w-full text-sm tabular-nums">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1 font-normal">Group</th>
                <th className="py-1 text-right font-normal">Invited a year</th>
                <th className="py-1 text-right font-normal">Now</th>
                <th className="py-1 text-right font-normal">With design</th>
              </tr>
            </thead>
            <tbody>
              {(["native", "other"] as const).map((g) => (
                <tr key={g} className="border-t border-rule">
                  <td className="py-1.5">{g === "native" ? "Finnish, Swedish or Sami" : "Other or missing"}</td>
                  <td className="py-1.5 text-right">{num(segments[g].invited)}</td>
                  <td className="py-1.5 text-right">{pct(result.before.bySegment[g])}</td>
                  <td className="py-1.5 text-right font-semibold">{pct(result.after.bySegment[g])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            Estimated: the Registry publishes the language split only for Finland as a whole. See &ldquo;How the numbers
            are made&rdquo; below.
          </p>
        </div>
      </section>

      <section aria-labelledby="layers-h" className="mt-10 border-t border-rule pt-6">
        <IconHeading icon={Layers} id="layers-h" className="text-xl">The layers</IconHeading>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Layer 0, the booked time and place in the letter, stays as it is. Each layer below brings in a share of the
          women who would still not come, in the order shown, so no woman is counted twice. Placeholder effects are
          illustrative: set them to what your county measures.
        </p>
        <ol className="mt-4 grid gap-4">
          {layers.map((l, i) => {
            const r = byId.get(l.id);
            const active = on[l.id];
            return (
              <li key={l.id} className={`rounded-md border border-rule p-4 ${active ? "bg-surface" : "opacity-60"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={active}
                      aria-label={`Use layer ${i + 1}: ${l.name}`}
                      onChange={(e) => setOn((o) => ({ ...o, [l.id]: e.target.checked }))}
                      className="mt-1 size-5"
                    />
                    <span>
                      <span className="font-semibold">
                        {i + 1}. {l.name}
                      </span>
                      <span className="block text-sm">{l.action}</span>
                      <span className="block text-sm text-muted">
                        Answers: {l.barrier}. Reaches:{" "}
                        {l.target === "other" ? "women with another mother tongue" : "all women"}
                        {l.reaches === "missing" ? " who have not come" : ""}.
                      </span>
                    </span>
                  </label>
                  <div className="text-right text-sm tabular-nums">
                    {active && r ? (
                      l.kind === "reclassify" ? (
                        <>
                          <div className="font-semibold">{num(r.recordedElsewhere)} recorded</div>
                          <div className="text-muted">{eurShort(r.layerCost)} a year</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">+{num(r.extraScreened)} screened</div>
                          <div className="text-muted">{eurShort(r.layerCost)} + {eurShort(r.extraScreened * COST_PER_SCREEN)} mammograms</div>
                        </>
                      )
                    ) : (
                      <div className="text-muted">Off</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-muted">{l.kind === "reclassify" ? "Share screened elsewhere" : "Share who then come"}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(l.effect * 100)}
                      onChange={(e) => setEdit(l.id, "effect", Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100)}
                      className="w-16 rounded border border-rule bg-paper px-2 py-1 text-right tabular-nums"
                    />
                    <span>%</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-muted">Cost per woman reached</span>
                    <span>€</span>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={l.costPerReached}
                      onChange={(e) => setEdit(l.id, "costPerReached", Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 rounded border border-rule bg-paper px-2 py-1 text-right tabular-nums"
                    />
                  </label>
                  <EvidenceChip level={l.evidence} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {l.evidenceNote}{" "}
                  {l.url && (
                    <a href={l.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-0.5">
                      Source <ExternalLink aria-hidden size={10} />
                    </a>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <More label="How the numbers are made" className="mt-8">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Invited a year: the county&rsquo;s women aged 50–69 (Statistics Finland 11re) times Finland&rsquo;s ratio of
            invited women to women of that age in 2024 (Finnish Cancer Registry), about one in two.
          </li>
          <li>
            Language split: Finland&rsquo;s share of invited women with another or missing mother tongue (7.2%), scaled
            by the county&rsquo;s foreign-background rate (Sotkanet 5102) against Finland&rsquo;s. This is an estimate.
          </li>
          <li>
            Attendance by group: the national ratio between the groups (60.8% against 83.2%) is kept, and the levels are
            set so the county&rsquo;s overall figure matches Sotkanet indicator 3621.
          </li>
          <li>
            Each extra mammogram costs {eur(COST_PER_SCREEN)} including further tests, the same figure the breast
            screening simulator uses. Layer costs are placeholders: no public Finnish price exists for a text, a
            translated letter or an outreach call.
          </li>
          <li>Women recorded as screened elsewhere are not counted as extra screens and add no mammogram cost.</li>
        </ul>
      </More>
    </div>
  );
}
