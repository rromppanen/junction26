import registry from "@/data/registry.json";
import { COLONOSCOPY_WAIT_MONTHS } from "@/data/registryWaits";
import { countyPathway, rankBreaks, type Break, type CountyPathway } from "./pathway";
import type { GroupRow, RegistryData } from "./registryTypes";

export const REGISTRY = registry as unknown as RegistryData;
export const COLORECTAL_SOURCE = REGISTRY.sources.find((s) => s.programme === "colorectal")!;

export type Wait = { year: number; county: number; national: number };

export type PathwayView = {
  pathway: CountyPathway;
  breaks: Break[];
  /** The latest year's chart reading (approximate), and the settled year's for comparison. */
  waits: Wait[];
  /** National colorectal participation by group, lowest first (the Registry publishes these nationally only). */
  groups: (GroupRow & { rate: number })[];
  groupsYear: number;
  intervalCancers: RegistryData["colorectal"]["intervalCancers"];
};

/** The colorectal pathway for a county, or null where the national programme does not run (Åland). */
export function loadPathway(regionId: number): PathwayView | null {
  const pathway = countyPathway(REGISTRY.colorectal, regionId);
  if (!pathway) return null;
  const waits = Object.entries(COLONOSCOPY_WAIT_MONTHS)
    .map(([y, w]) => ({ year: Number(y), county: w.counties[regionId], national: w.national }))
    .filter((w) => w.county !== undefined)
    .sort((a, b) => b.year - a.year);
  const g = REGISTRY.groups.colorectal;
  const groups = g.rows
    .map((r) => ({ ...r, rate: Math.round((r.participated / r.invited) * 1000) / 10 }))
    .filter((r) => r.invited >= 500)
    .sort((a, b) => a.rate - b.rate);
  return { pathway, breaks: rankBreaks(pathway), waits, groups, groupsYear: g.year, intervalCancers: REGISTRY.colorectal.intervalCancers };
}
