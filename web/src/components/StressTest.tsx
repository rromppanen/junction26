"use client";

import { useState } from "react";
import { capacityDrop } from "@/lib/stress";
import type { CountyPathway } from "@/lib/pathway";
import { EvidenceTag } from "@/components/simulator/EvidenceTag";

const n0 = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const n1 = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "What if colonoscopy capacity fell?": the cost of a disruption, in findings, before it happens. */
export function StressTest({ p, name }: { p: CountyPathway; name: string }) {
  const [drop, setDrop] = useState(20);
  const r = capacityDrop(p, drop);
  return (
    <div className="mt-8 border-t border-rule pt-6">
      <h3 className="flex flex-wrap items-center gap-2 font-semibold">
        Stress test: what if colonoscopy capacity fell? <EvidenceTag kind="simulated" />
      </h3>
      <label htmlFor="stress-drop" className="mt-3 flex max-w-xl flex-wrap items-center gap-3 text-sm">
        <span>Capacity lost</span>
        <input
          id="stress-drop"
          type="range"
          min={0}
          max={50}
          step={5}
          value={drop}
          onChange={(e) => setDrop(Number(e.target.value))}
          className="w-48 accent-ink"
        />
        <strong className="tabular-nums">{drop}%</strong>
      </label>
      <p className="mt-3 max-w-2xl">
        {drop === 0
          ? `Move the slider to see what a disruption would cost ${name}.`
          : `${n0(r.lostColonoscopies)} fewer positives a year would get a colonoscopy in ${name}, leaving ${n1(r.examinedPctAfter)}% examined instead of ${n1(p.rates.examined)}%. About ${n1(r.cancers)} cancers and ${n0(r.advanced)} advanced precursors would go unfound.`}
      </p>
      <p className="mt-2 max-w-2xl text-xs text-muted">
        Based on {name}&rsquo;s {p.year} screening counts and Finland&rsquo;s yield per colonoscopy. No public data shows real
        colonoscopy capacity, so this is a scenario to plan against, not a forecast.
      </p>
    </div>
  );
}
