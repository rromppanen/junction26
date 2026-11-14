import type { Findings, Funnel, RegistryData } from "./registryTypes";

/**
 * The colorectal screening pathway of one county, from the Finnish Cancer Registry's counts:
 * where people drop off, which break costs the most cancers found, and what closing it would take.
 * Pure functions: every figure is computed from counts passed in, nothing is predicted.
 */

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

function percentile(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/** The latest year whose follow-up is complete: the newest report year is still being filled in. */
export function settledYear(data: RegistryData["colorectal"]): number {
  return data.years.length > 1 ? data.years[data.years.length - 2] : data.years[0];
}

export type Rates = {
  participation: number; // % of those selected who returned a test
  positivity: number; // % of participants with a positive test
  examined: number; // % of positives with a colonoscopy in the programme
};

export function rates(f: Funnel, x: Findings): Rates {
  return {
    participation: round1(pct(f.participated, f.selected)),
    positivity: round1(pct(f.positive, f.participated)),
    examined: round1(pct(x.positive - x.noColonoscopy, x.positive)),
  };
}

/** Findings per colonoscopy done, nationally: the yield used to turn extra colonoscopies into expected findings. */
export type Yield = { cancerPerColonoscopy: number; advancedPerColonoscopy: number };

export function nationalYield(x: Findings): Yield {
  const done = x.positive - x.noColonoscopy;
  return { cancerPerColonoscopy: x.cancer / done, advancedPerColonoscopy: x.advancedPrecursor / done };
}

export type CountyPathway = {
  regionId: number;
  year: number;
  funnel: Funnel;
  findings: Findings;
  examinedPeople: number; // positives minus those with no colonoscopy
  rates: Rates;
  national: Rates;
  bestQuarter: Rates; // the best-quartile boundary among counties, per rate
  bestCounty: { participation: number; examined: number };
  yield: Yield;
};

export function countyPathway(data: RegistryData["colorectal"], regionId: number, year = settledYear(data)): CountyPathway | null {
  const counties = data.counties[year];
  const c = counties?.[regionId];
  if (!c) return null;
  const all = Object.values(counties).map((x) => rates(x.funnel, x.findings));
  const nat = data.national[year];
  return {
    regionId,
    year,
    funnel: c.funnel,
    findings: c.findings,
    examinedPeople: c.findings.positive - c.findings.noColonoscopy,
    rates: rates(c.funnel, c.findings),
    national: rates(nat.all, nat.findings),
    bestQuarter: {
      participation: round1(percentile(all.map((r) => r.participation), 0.75)),
      positivity: round1(percentile(all.map((r) => r.positivity), 0.5)),
      examined: round1(percentile(all.map((r) => r.examined), 0.75)),
    },
    bestCounty: { participation: Math.max(...all.map((r) => r.participation)), examined: Math.max(...all.map((r) => r.examined)) },
    yield: nationalYield(nat.findings),
  };
}

export type BreakKind = "access" | "service";

export type Break = {
  kind: BreakKind;
  /** People lost at this step compared with the best quarter of counties, per year. */
  people: number;
  /** Expected cancers and advanced precursors those people would have had found, at the national yield. */
  cancers: number;
  advanced: number;
};

/**
 * Both breaks, largest first, in a common unit: findings missed compared with the best quarter of counties.
 * Access = people who do not return the test. Service = positives without a colonoscopy in the programme.
 * A missed participant carries the national yield per participant; a missed colonoscopy the yield per colonoscopy.
 */
export function rankBreaks(p: CountyPathway): Break[] {
  const perColonoscopy = p.yield;
  // Of the extra participants, the county's own share turns positive and is examined.
  const colonoscopiesPerParticipant = (p.rates.positivity / 100) * (p.rates.examined / 100);
  const lostParticipants = Math.max(0, Math.round((p.funnel.selected * (p.bestQuarter.participation - p.rates.participation)) / 100));
  const lostColonoscopies = Math.max(0, Math.round((p.findings.positive * (p.bestQuarter.examined - p.rates.examined)) / 100));
  const access: Break = {
    kind: "access",
    people: lostParticipants,
    cancers: round1(lostParticipants * colonoscopiesPerParticipant * perColonoscopy.cancerPerColonoscopy),
    advanced: Math.round(lostParticipants * colonoscopiesPerParticipant * perColonoscopy.advancedPerColonoscopy),
  };
  const service: Break = {
    kind: "service",
    people: lostColonoscopies,
    cancers: round1(lostColonoscopies * perColonoscopy.cancerPerColonoscopy),
    advanced: Math.round(lostColonoscopies * perColonoscopy.advancedPerColonoscopy),
  };
  return [access, service].sort((a, b) => b.cancers + b.advanced / 10 - (a.cancers + a.advanced / 10));
}

/** Unit costs the county enters; null = not entered. No default is invented. */
export type Costs = { perTest: number | null; perColonoscopy: number | null; perContact: number | null };

export type OptionResult = {
  extraParticipants: number;
  extraColonoscopies: number;
  cancers: number;
  advanced: number;
  /** null when a cost this option needs has not been entered. */
  cost: number | null;
  costPerFinding: number | null; // per cancer or advanced precursor found
};

const clean = (n: number | null) => (n === null || !Number.isFinite(n) || n < 0 ? null : n);

/**
 * Access option: raise participation to `target` % (e.g. with reminders and invitations in more languages).
 * Cost = extra tests analysed + outreach per extra participant + the extra colonoscopies that follow.
 */
export function accessOption(p: CountyPathway, target: number, costs: Costs): OptionResult {
  const extraParticipants = Math.max(0, Math.ceil((p.funnel.selected * (target - p.rates.participation)) / 100 - 1e-9));
  const extraColonoscopies = Math.round(extraParticipants * (p.rates.positivity / 100) * (p.rates.examined / 100));
  const perTest = clean(costs.perTest), perCol = clean(costs.perColonoscopy), perContact = clean(costs.perContact);
  const cost = perTest === null || perCol === null || perContact === null
    ? null
    : Math.round(extraParticipants * (perTest + perContact) + extraColonoscopies * perCol);
  return finish(extraParticipants, extraColonoscopies, p, cost);
}

/**
 * Service option: raise the share of positives examined to `target` % (e.g. a nurse calls every positive without
 * a booking). Cost = a contact for every positive not yet examined + the extra colonoscopies.
 */
export function serviceOption(p: CountyPathway, target: number, costs: Costs): OptionResult {
  const extraColonoscopies = Math.max(0, Math.round((p.findings.positive * (target - p.rates.examined)) / 100));
  const perCol = clean(costs.perColonoscopy), perContact = clean(costs.perContact);
  const cost = perCol === null || perContact === null
    ? null
    : Math.round(p.findings.noColonoscopy * perContact + extraColonoscopies * perCol);
  return finish(0, extraColonoscopies, p, cost);
}

function finish(extraParticipants: number, extraColonoscopies: number, p: CountyPathway, cost: number | null): OptionResult {
  const cancers = round1(extraColonoscopies * p.yield.cancerPerColonoscopy);
  const advanced = Math.round(extraColonoscopies * p.yield.advancedPerColonoscopy);
  const findings = cancers + advanced;
  return {
    extraParticipants,
    extraColonoscopies,
    cancers,
    advanced,
    cost,
    costPerFinding: cost === null || findings === 0 ? null : Math.round(cost / findings),
  };
}
