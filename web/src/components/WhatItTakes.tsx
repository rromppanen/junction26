import type { GapFacts, Indicator } from "@/lib/types";
import { peoplePer1000ToReach } from "@/lib/impact";
import { Users } from "lucide-react";
import { fmt } from "./format";
import { IconHeading, More } from "./ui";

/** "Breast cancer screening attendance (mammography)" -> "Breast". */
const programme = (ind: Indicator) => ind.nameEn.match(/^(\w+) cancer screening/i)?.[1] ?? ind.nameEn;

/** Sizes each screening gap in people per 1,000 invited, in full and halfway. */
export function WhatItTakes({ facts, indicators }: { facts: GapFacts[]; indicators: Indicator[] }) {
  const rows = indicators
    .filter((i) => i.target)
    .map((ind) => ({ ind, f: facts.find((x) => x.indicatorId === ind.id) }));
  if (rows.length === 0) return null;
  const target = rows[0].ind.target?.value;
  return (
    <div>
      <IconHeading icon={Users} as="h3">Extra people needed, per 1,000 invited</IconHeading>
      <More label="How this is counted" className="mt-1">
        The national strategy asks every county to get {target}% of invited people to each screening. Each row shows
        how many more of every 1,000 people invited here would need to attend to reach {target}%, and to get halfway.
      </More>
      <ul className="mt-3 border-t border-rule">
        {rows.map(({ ind, f }) => {
          const goal = ind.target?.value ?? f?.target ?? null;
          const value = f?.value ?? null;
          const full = peoplePer1000ToReach(value, goal);
          const half = value === null || goal === null ? null : peoplePer1000ToReach(value, value + (goal - value) / 2);
          return (
            <li
              key={ind.id}
              className="grid gap-x-4 border-b border-rule py-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]"
              title={`Sotkanet ${ind.id}; target from ${ind.target?.evidenceId}`}
            >
              <span className="font-semibold">{programme(ind)}</span>
              {full === null || half === null ? (
                <span className="text-muted">Sotkanet has no attendance figure for this year.</span>
              ) : full === 0 ? (
                <span className="text-ahead">At {fmt(value, "%")}: target met.</span>
              ) : (
                <span>
                  <strong className="font-narrow text-xl font-bold tabular-nums">+{full}</strong> to reach {goal}%
                  <span className="text-muted">
                    {" "}(+{half} halfway, now {fmt(value, "%")})
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
