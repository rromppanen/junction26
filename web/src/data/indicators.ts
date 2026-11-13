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

export function indicatorBySlug(slug: string): Indicator | undefined {
  return INDICATORS.find((i) => i.slug === slug);
}

export function indicatorById(id: number): Indicator | undefined {
  return INDICATORS.find((i) => i.id === id);
}
