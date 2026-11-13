import type { Indicator } from "@/lib/types";

const src = (id: number) => `https://sotkanet.fi/sotkanet/en/taulukko?indicator=${id}`;

// National cancer strategy 2026–2035, headline indicators (strategy p. 7 overview):
// Goal 2 = prevention and early detection, Goal 3 = equal and effective care.
const GOAL_2_SCREENING = "Goal 2: 80% participation in every screening programme in every county";
const GOAL_3_SURVIVAL = "Goal 3: equal and effective care (5-year survival)";

const SCREENING_TARGET = { value: 80, label: "National target 80% in every county", evidenceId: "strategy-goal2-screening-80" };

// Note: Sotkanet publishes these indicators under gender "total" (no "female" rows exist).
export const INDICATORS: Indicator[] = [
  {
    id: 3621,
    slug: "breast-screening",
    nameEn: "Breast cancer screening attendance (mammography)",
    nameFi: "Rintasyövän seulontoihin osallistuminen (mammografia)",
    unit: "%",
    higherIsBetter: true,
    stage: "detection",
    strategyGoal: GOAL_2_SCREENING,
    target: SCREENING_TARGET,
    gender: "total",
    sourceUrl: src(3621),
  },
  {
    id: 6103,
    slug: "colorectal-screening",
    nameEn: "Colorectal cancer screening attendance",
    nameFi: "Suolistosyövän seulontoihin osallistuminen",
    unit: "%",
    higherIsBetter: true,
    stage: "detection",
    strategyGoal: GOAL_2_SCREENING,
    target: SCREENING_TARGET,
    gender: "total",
    sourceUrl: src(6103),
  },
  {
    id: 3620,
    slug: "cervical-screening",
    nameEn: "Cervical cancer screening attendance",
    nameFi: "Kohdunkaulasyövän seulontoihin osallistuminen",
    unit: "%",
    higherIsBetter: true,
    stage: "detection",
    strategyGoal: GOAL_2_SCREENING,
    target: SCREENING_TARGET,
    gender: "total",
    sourceUrl: src(3620),
  },
  {
    id: 3625,
    slug: "breast-survival",
    nameEn: "5-year relative survival of breast cancer patients",
    nameFi: "Rintasyöpäpotilaiden 5 vuoden suhteellinen elossaololuku",
    unit: "%",
    higherIsBetter: true,
    stage: "outcome",
    strategyGoal: GOAL_3_SURVIVAL,
    gender: "total",
    sourceUrl: src(3625),
  },
  {
    id: 3627,
    slug: "bowel-survival",
    nameEn: "5-year relative survival of bowel cancer patients",
    nameFi: "Suolistosyöpäpotilaiden 5 vuoden suhteellinen elossaololuku",
    unit: "%",
    higherIsBetter: true,
    stage: "outcome",
    strategyGoal: GOAL_3_SURVIVAL,
    gender: "total",
    sourceUrl: src(3627),
  },
];

// Context indicators for the equity lens (municipality level). Never shown on the radar.
// higherIsBetter is only a reading convention here: these are descriptions of the population, not targets.
const CONTEXT_GOAL = "Context only: describes the population, not a strategy indicator";
const context = (id: number, slug: string, nameEn: string, nameFi: string, unit: string): Indicator => ({
  id, slug, nameEn, nameFi, unit, higherIsBetter: true, stage: "detection",
  strategyGoal: CONTEXT_GOAL, gender: "total", sourceUrl: src(id),
});

export const CONTEXT_INDICATORS: Indicator[] = [
  context(127, "population", "Population at year end", "Väestö 31.12.", "people"),
  // Average theoretical years of education after basic education, x100 (e.g. 246 = 2.5 years). Higher = more educated.
  context(180, "education-level", "Measure of educational level", "Koulutustasomittain", "score"),
  context(3074, "foreign-nationals", "Foreign nationals as % of total population", "Ulkomaan kansalaiset, % väestöstä", "%"),
  context(5102, "foreign-background", "Persons with foreign background per 1,000 inhabitants", "Ulkomaalaistaustaiset / 1 000 asukasta", "per 1,000"),
  context(181, "unemployment", "Unemployed people, as % of labour force", "Työttömät, % työvoimasta", "%"),
];

export function contextIndicatorBySlug(slug: string): Indicator | undefined {
  return CONTEXT_INDICATORS.find((i) => i.slug === slug);
}

export function indicatorBySlug(slug: string): Indicator | undefined {
  return INDICATORS.find((i) => i.slug === slug);
}

export function indicatorById(id: number): Indicator | undefined {
  return INDICATORS.find((i) => i.id === id);
}
