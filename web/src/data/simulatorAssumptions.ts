import type { Assumption, ParamKey } from "@/lib/simulator";

/**
 * Default assumptions for the breast screening simulator, copied from simulation_test/assumptions.csv.
 * Every "placeholder" row is illustrative and must be replaced with a sourced value before a result is quoted.
 */
export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "women_50_69_share", base: 0.124, low: 0.11, high: 0.135, status: "placeholder", note: "Replace with Statistics Finland women aged 50–69 per wellbeing services county (the capital region is younger, so likely lower)." },
  { key: "incidence_50_69", base: 0.0033, low: 0.0028, high: 0.0038, status: "placeholder", note: "Replace with Finnish Cancer Registry / NORDCAN age-specific incidence for ages 50–69 (invasive + in situ)." },
  { key: "target_attendance", base: 85, low: 83, high: 86, status: "from-data", note: "What the best-performing counties already reach: Pohjois-Pohjanmaa 85.6% in 2024 (Sotkanet 3621)." },
  { key: "att_regional", base: 0.27, low: 0.22, high: 0.32, status: "placeholder", note: "Stage mix of cancers in women who attend: regional / node-positive." },
  { key: "att_distant", base: 0.03, low: 0.02, high: 0.05, status: "placeholder", note: "Stage mix of cancers in women who attend: distant metastases." },
  { key: "non_regional", base: 0.38, low: 0.32, high: 0.44, status: "placeholder", note: "Stage mix of cancers in women who do not attend: regional." },
  { key: "non_distant", base: 0.1, low: 0.07, high: 0.14, status: "placeholder", note: "Stage mix of cancers in women who do not attend: distant." },
  { key: "ly_lost_local", base: 1, low: 0.5, high: 2, status: "placeholder", note: "Remaining life expectancy lost against the general population after a localized or in situ diagnosis (from stage-specific survival and life tables)." },
  { key: "ly_lost_regional", base: 5, low: 3, high: 7, status: "placeholder", note: "The same for regional stage." },
  { key: "ly_lost_distant", base: 17, low: 12, high: 20, status: "placeholder", note: "The same for distant stage." },
  { key: "death_local", base: 0.04, low: 0.02, high: 0.06, status: "placeholder", note: "Lifetime probability of dying of breast cancer after a localized diagnosis." },
  { key: "death_regional", base: 0.2, low: 0.15, high: 0.3, status: "placeholder", note: "The same for regional stage." },
  { key: "death_distant", base: 0.8, low: 0.7, high: 0.9, status: "placeholder", note: "The same for distant stage." },
  { key: "cost_local", base: 25000, low: 15000, high: 35000, status: "placeholder", note: "Treatment cost per case. Source idea: Lehtinen et al. 2019 (Duodecim) stage-specific costs, as used in Shafik et al." },
  { key: "cost_regional", base: 45000, low: 30000, high: 60000, status: "placeholder", note: "The same for regional stage." },
  { key: "cost_distant", base: 95000, low: 60000, high: 130000, status: "placeholder", note: "The same for distant stage, including last-year-of-life costs." },
  { key: "cost_screen", base: 60, low: 40, high: 90, status: "placeholder", note: "Mammography plus recall work-up per extra attendee (Shafik et al. used €30 per invitee)." },
  { key: "cost_outreach", base: 40, low: 10, high: 100, status: "placeholder", note: "Cost of whatever closes the gap (translated invitations, navigators, a mobile unit) per extra woman reached." },
  { key: "overdiagnosis", base: 0.05, low: 0, high: 0.15, status: "placeholder", note: "Extra localized cases found among new attenders that would never have caused harm: they cost money and gain no life-years." },
  { key: "screening_interval", base: 2, low: 2, high: 2, status: "fixed", note: "The Finnish programme invites women aged 50–69 every two years." },
];

export type ParamMeta = {
  group: "Target" | "Population" | "Stage at diagnosis" | "Outcomes by stage" | "Costs" | "Fixed";
  label: string;
  /** Display value = model value × scale (shares shown as %). */
  scale: number;
  unit: string;
  decimals: number;
  /** Slider bounds in display units; default is the CSV range widened by its own width on both sides. */
  min?: number;
  max?: number;
};

export const PARAM_META: Record<ParamKey, ParamMeta> = {
  target_attendance: { group: "Target", label: "Target attendance", scale: 1, unit: "%", decimals: 1, min: 75, max: 90 },
  women_50_69_share: { group: "Population", label: "Women aged 50–69", scale: 100, unit: "% of population", decimals: 1 },
  incidence_50_69: { group: "Population", label: "Breast cancer incidence", scale: 1000, unit: "per 1,000 women a year", decimals: 2 },
  att_regional: { group: "Stage at diagnosis", label: "Women who attend: regional", scale: 100, unit: "% of cases", decimals: 1 },
  att_distant: { group: "Stage at diagnosis", label: "Women who attend: distant", scale: 100, unit: "% of cases", decimals: 1 },
  non_regional: { group: "Stage at diagnosis", label: "Women who don't attend: regional", scale: 100, unit: "% of cases", decimals: 1 },
  non_distant: { group: "Stage at diagnosis", label: "Women who don't attend: distant", scale: 100, unit: "% of cases", decimals: 1 },
  ly_lost_local: { group: "Outcomes by stage", label: "Life-years lost, localized", scale: 1, unit: "years a case", decimals: 1 },
  ly_lost_regional: { group: "Outcomes by stage", label: "Life-years lost, regional", scale: 1, unit: "years a case", decimals: 1 },
  ly_lost_distant: { group: "Outcomes by stage", label: "Life-years lost, distant", scale: 1, unit: "years a case", decimals: 1 },
  death_local: { group: "Outcomes by stage", label: "Breast cancer death, localized", scale: 100, unit: "%", decimals: 1 },
  death_regional: { group: "Outcomes by stage", label: "Breast cancer death, regional", scale: 100, unit: "%", decimals: 1 },
  death_distant: { group: "Outcomes by stage", label: "Breast cancer death, distant", scale: 100, unit: "%", decimals: 1 },
  cost_local: { group: "Costs", label: "Treatment cost, localized", scale: 1, unit: "€ a case", decimals: 0 },
  cost_regional: { group: "Costs", label: "Treatment cost, regional", scale: 1, unit: "€ a case", decimals: 0 },
  cost_distant: { group: "Costs", label: "Treatment cost, distant", scale: 1, unit: "€ a case", decimals: 0 },
  cost_screen: { group: "Costs", label: "Cost of an extra screen", scale: 1, unit: "€", decimals: 0 },
  cost_outreach: { group: "Costs", label: "Outreach per extra attendee", scale: 1, unit: "€", decimals: 0 },
  overdiagnosis: { group: "Costs", label: "Overdiagnosis", scale: 100, unit: "% of cases found earlier", decimals: 1 },
  screening_interval: { group: "Fixed", label: "Screening interval", scale: 1, unit: "years", decimals: 0 },
};

export const PARAM_GROUPS: ParamMeta["group"][] = ["Target", "Population", "Stage at diagnosis", "Outcomes by stage", "Costs", "Fixed"];
