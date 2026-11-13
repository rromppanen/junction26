import type { Indicator } from "@/lib/types";

const src = (id: number) => `https://sotkanet.fi/sotkanet/en/taulukko?indicator=${id}`;
const GOAL_32 = "3.2 Reliable information on regional differences in diagnostics and care";
const GOAL_31 = "3.1 Equal, delay-free and effective care";

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
    goal3: GOAL_32,
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
    goal3: GOAL_32,
    gender: "total",
    sourceUrl: src(6103),
  },
  {
    id: 3625,
    slug: "breast-survival",
    nameEn: "5-year relative survival of breast cancer patients",
    nameFi: "Rintasyöpäpotilaiden 5 vuoden suhteellinen elossaololuku",
    unit: "%",
    higherIsBetter: true,
    stage: "outcome",
    goal3: GOAL_31,
    gender: "total",
    sourceUrl: src(3625),
  },
];

export function indicatorBySlug(slug: string): Indicator | undefined {
  return INDICATORS.find((i) => i.slug === slug);
}

export function indicatorById(id: number): Indicator | undefined {
  return INDICATORS.find((i) => i.id === id);
}
