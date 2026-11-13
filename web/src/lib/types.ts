// Shared contracts for Gap Radar. Owned by the integrator; agents must not change these shapes.

export type PathwayStage = "detection" | "referral" | "diagnosis" | "treatment" | "outcome";

export const PATHWAY_STAGES: PathwayStage[] = ["detection", "referral", "diagnosis", "treatment", "outcome"];

export type Indicator = {
  id: number; // Sotkanet indicator id
  slug: string; // e.g. "breast-screening"
  nameEn: string;
  nameFi: string;
  unit: string; // e.g. "%"
  higherIsBetter: boolean;
  stage: PathwayStage;
  goal3: string; // e.g. "3.2 Reliable information on regional differences"
  gender: "total" | "female";
  sourceUrl: string; // public Sotkanet page for the indicator
};

export type Region = {
  id: number; // Sotkanet region id
  name: string; // Finnish name, e.g. "Pohjois-Karjalan hyvinvointialue"
  isNational: boolean; // true for "Koko maa"
};

export type IndicatorValue = {
  indicatorId: number;
  regionId: number;
  year: number;
  value: number;
};

export type Dataset = {
  regions: Region[];
  values: IndicatorValue[];
  fetchedAt: string; // ISO timestamp
  source: "database" | "snapshot";
};

export type GapStatus = "behind" | "on-par" | "ahead" | "no-data";

export type GapFacts = {
  indicatorId: number;
  regionId: number;
  year: number;
  value: number | null;
  national: number | null;
  bestQuartile: number | null; // value at the best-performing quartile boundary among counties
  gapToNational: number | null; // positive = better than national (sign-corrected by higherIsBetter)
  gapToBestQuartile: number | null; // positive = better than best quartile
  rank: number | null; // 1 = best among counties with data
  rankOf: number; // number of counties with data
  trend3y: number | null; // value(year) - value(year-3), raw (not sign-corrected)
  status: GapStatus;
};

export type Recommendation = {
  action: string;
  owner: string;
  timeframe: string;
  goal3Indicator: string;
  sources: string[]; // ids from evidence.ts or "sotkanet:<indicatorId>"
};

export type Brief = {
  headline: string;
  finding: string;
  pathwayStage: PathwayStage;
  recommendations: Recommendation[]; // exactly 3
  limitations: string[];
  generatedBy: "gemini" | "fallback";
};

export type EvidenceItem = {
  id: string; // e.g. "strategy-p33-3.1"
  doc: "strategy" | "roadmap" | "brief";
  page: number | null;
  titleEn: string;
  summaryEn: string;
  quoteFi: string;
  url: string;
};
