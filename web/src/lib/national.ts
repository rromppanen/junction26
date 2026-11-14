import { countyPathway, rankBreaks, settledYear } from "./pathway";
import type { GapFacts } from "./types";
import type { Programme, RegistryData } from "./registryTypes";

/**
 * The national layer of the learning loop: where Finland as a whole loses people on the screening pathway,
 * what matching the best quarter of counties everywhere would add, and which counties are getting worse.
 * Every figure is summed from Cancer Registry or Sotkanet counts; nothing is predicted.
 */

export type NationalPathway = {
  year: number;
  selected: number;
  notReturned: number;
  positive: number;
  unexamined: number;
  unexaminedPct: number;
  /** Bowel cancers among one eligible cohort, by where they were found (Registry-linked). */
  missed: { cohortYear: number; total: number; nonParticipant: number; positiveNoColonoscopy: number; sharePct: number } | null;
  /** Summed over counties: closing each county's breaks to the best quarter of counties. */
  bestQuarter: { counties: number; participants: number; colonoscopies: number; cancers: number; advanced: number };
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function nationalPathway(data: RegistryData["colorectal"]): NationalPathway {
  const year = settledYear(data);
  const nat = data.national[year];
  const ic = data.intervalCancers;
  const bq = { counties: 0, participants: 0, colonoscopies: 0, cancers: 0, advanced: 0 };
  for (const id of Object.keys(data.counties[year] ?? {}).map(Number)) {
    const p = countyPathway(data, id, year);
    if (!p) continue;
    bq.counties++;
    for (const b of rankBreaks(p)) {
      if (b.kind === "access") bq.participants += b.people;
      else bq.colonoscopies += b.people;
      bq.cancers += b.cancers;
      bq.advanced += b.advanced;
    }
  }
  bq.cancers = round1(bq.cancers);
  let missed: NationalPathway["missed"] = null;
  if (ic) {
    const total = ic.screenDetected + ic.nonParticipant + ic.afterNegativeTest + ic.positiveNoColonoscopy;
    missed = {
      cohortYear: ic.cohortYear,
      total,
      nonParticipant: ic.nonParticipant,
      positiveNoColonoscopy: ic.positiveNoColonoscopy,
      sharePct: round1(((ic.nonParticipant + ic.positiveNoColonoscopy) / total) * 100),
    };
  }
  return {
    year,
    selected: nat.all.selected,
    notReturned: nat.all.selected - nat.all.participated,
    positive: nat.findings.positive,
    unexamined: nat.findings.noColonoscopy,
    unexaminedPct: round1((nat.findings.noColonoscopy / nat.findings.positive) * 100),
    missed,
    bestQuarter: bq,
  };
}

export type LanguageGap = { programme: Programme; year: number; other: number; native: number };

/** National participation of people whose mother tongue is not Finnish, Swedish or Sami, against everyone else. */
export function languageGaps(groups: RegistryData["groups"]): LanguageGap[] {
  return (["breast", "colorectal", "cervical"] as Programme[]).flatMap((programme) => {
    const g = groups[programme];
    const rate = (label: string) => {
      const r = g?.rows.find((x) => x.dimension === "language" && x.group === label);
      return r && r.invited > 0 ? round1((r.participated / r.invited) * 100) : null;
    };
    const native = rate("Finnish, Swedish or Sami"), other = rate("Other or missing");
    return native !== null && other !== null ? [{ programme, year: g.year, other, native }] : [];
  });
}

/** Attendance falling by at least this many points over three years counts as an early warning. */
export const WARNING_DROP = 1;

export type Warning = { regionId: number; indicatorId: number; value: number; drop: number; year: number; belowTarget: boolean };

/**
 * Early warning: counties whose screening attendance fell by WARNING_DROP points or more over three years,
 * largest fall first. A fall shows before it becomes a gap, so a county can act while it is still small.
 */
export function earlyWarnings(facts: GapFacts[]): Warning[] {
  return facts
    .filter((f) => f.target !== null && f.value !== null && f.trend3y !== null && f.trend3y <= -WARNING_DROP)
    .map((f) => ({
      regionId: f.regionId,
      indicatorId: f.indicatorId,
      value: f.value as number,
      drop: round1(-(f.trend3y as number)),
      year: f.year,
      belowTarget: (f.gapToTarget ?? 0) < 0,
    }))
    .sort((a, b) => b.drop - a.drop);
}
