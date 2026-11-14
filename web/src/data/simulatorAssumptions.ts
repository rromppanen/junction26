import type { Assumption, ParamKey } from "@/lib/simulator";

const FCR_SCREENING = "https://cancerregistry.fi/screening/breast-cancer-screening/";
const FCR_REPORT_2023 = "https://syoparekisteri.fi/assets/themes/ssy3/factsheets/syopa_2023_tilastoraportti.html";
const SHAFIK = "https://arxiv.org/abs/2209.01216";
const LEHTINEN = "Lehtinen et al., Duodecim 2019;135:953–960, as tabulated in Shafik et al. 2022 (tables 8–10)";

/**
 * Default assumptions for the breast screening simulator. Each value is published, or calculated from
 * published figures in the way its note describes. Only the outreach cost has no source: it is the county's
 * own choice. Figures marked "summary" were read from a published summary, not checked against the full text.
 *
 * The stage mix by attendance is not published for Finland, so it is calibrated to two figures that are:
 *   - 67% of Finnish invasive breast cancers with a known stage are localized (Finnish Cancer Registry
 *     2000–2018: 52.2% localized, 25.4% regional, 0.85% distant, the rest unknown or in situ);
 *   - breast cancer mortality was 28% lower among screened women than expected without screening, after
 *     correcting for self-selection (Finnish Cancer Registry, 1992–2003).
 * simulator.test.ts checks both.
 */
export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "women_50_69_share", base: 0.124, low: 0.11, high: 0.135, status: "from-data", note: "Fallback only. Each county uses its own count of women aged 50–69: 11.0% of the population in Vantaa–Kerava up to 14.7% in Etelä-Savo.", source: "Statistics Finland table 11re, 2024", url: "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11re.px" },
  { key: "incidence_50_69", base: 0.0034, low: 0.003, high: 0.0038, status: "derived", note: "5,173 new female breast cancers in 2023, about 45% of them at ages 50–69 (summary of a NORDCAN-based study), over 692,744 women of that age: 3.4 per 1,000 a year. The high end adds in situ cases, about 12% on top.", source: "Finnish Cancer Registry, Cancer 2023; Statistics Finland 11re", url: FCR_REPORT_2023 },
  { key: "target_attendance", base: 85, low: 83, high: 86, status: "from-data", note: "What the best-performing counties already reach: Pohjois-Pohjanmaa 85.6% in 2024.", source: "Sotkanet indicator 3621", url: "https://sotkanet.fi/sotkanet/en/taulukko?indicator=3621" },
  { key: "att_regional", base: 0.27, low: 0.25, high: 0.29, status: "derived", note: "Share of cancers found at regional (node-positive) stage in women who attend. Calibrated: with 82% attending, the whole population comes out at 68% localized, against 67% recorded.", source: "Finnish Cancer Registry 2000–2018, in Shafik et al. 2022", url: SHAFIK },
  { key: "att_distant", base: 0.03, low: 0.02, high: 0.04, status: "derived", note: "Share found with distant metastases in women who attend. Calibrated together with the regional share.", source: "Finnish Cancer Registry 2000–2018, in Shafik et al. 2022", url: SHAFIK },
  { key: "non_regional", base: 0.33, low: 0.315, high: 0.38, status: "derived", note: "Regional share in women who do not attend. Calibrated so that attenders have about 28% lower breast cancer mortality, the Finnish estimate after correcting for self-selection. The low end matches the 22% measured for all invited women.", source: "Finnish Cancer Registry, breast cancer screening", url: FCR_SCREENING },
  { key: "non_distant", base: 0.07, low: 0.06, high: 0.1, status: "derived", note: "Distant share in women who do not attend. Calibrated together with the regional share.", source: "Finnish Cancer Registry, breast cancer screening", url: FCR_SCREENING },
  { key: "ly_lost_local", base: 1, low: 0.5, high: 2, status: "derived", note: "Life-years lost per case against the general population. With the two stages below, the average comes to 2.7 years a case, a little under the 3.3 years the Finnish Cancer Registry reports for breast cancer at all ages (summary of Cancer 2022).", source: "Finnish Cancer Registry, Cancer 2022" },
  { key: "ly_lost_regional", base: 5, low: 3, high: 7, status: "derived", note: "The same for regional stage.", source: "Finnish Cancer Registry, Cancer 2022" },
  { key: "ly_lost_distant", base: 17, low: 12, high: 20, status: "derived", note: "The same for distant stage.", source: "Finnish Cancer Registry, Cancer 2022" },
  { key: "death_local", base: 0.04, low: 0.02, high: 0.06, status: "derived", note: "Lifetime probability of dying of breast cancer. Five-year relative survival is 99% for localized disease; deaths continue after five years, so the lifetime figure is higher. US data: Finland publishes no survival by stage.", source: "US National Cancer Institute, SEER 2013–2019", url: "https://www.cancer.gov/types/breast/survival" },
  { key: "death_regional", base: 0.2, low: 0.15, high: 0.3, status: "derived", note: "The same for regional stage: five-year relative survival 86%.", source: "US National Cancer Institute, SEER 2013–2019", url: "https://www.cancer.gov/types/breast/survival" },
  { key: "death_distant", base: 0.8, low: 0.7, high: 0.9, status: "derived", note: "The same for distant stage: five-year relative survival 31%.", source: "US National Cancer Institute, SEER 2013–2019", url: "https://www.cancer.gov/types/breast/survival" },
  { key: "cost_local", base: 25400, low: 17500, high: 33000, status: "derived", note: "Specialised care for a localized case at ages 50–69: €17,450 in the first year, €1,750 a year for the next four, and €22,575 in the last year of life for the 4% who die of it. Low is the first year alone, high is ten years of follow-up. 2019 prices.", source: LEHTINEN, url: SHAFIK },
  { key: "cost_regional", base: 41700, low: 25500, high: 55000, status: "derived", note: "The same for regional stage: €25,550 in the first year, €2,625 a year after, €28,325 in the last year of life for the 20% who die of it.", source: LEHTINEN, url: SHAFIK },
  { key: "cost_distant", base: 83000, low: 66000, high: 100000, status: "derived", note: "The same for distant stage: €30,425 in the first year, €5,725 a year for three more, €44,825 in the last year of life for the 80% who die of it. Newer drugs cost more than these 2019 figures.", source: LEHTINEN, url: SHAFIK },
  { key: "cost_screen", base: 45, low: 37, high: 55, status: "derived", note: "Between two published figures: €30 per invited woman (Lehtinen et al. 2019), which is €37 per woman screened at 82% attendance, and a programme cost of about €15 million a year (summary), which is €53 per screen including further tests.", source: "Shafik et al. 2022; Finnish expert group on screening, 2025", url: "https://www.sttinfo.fi/tiedote/70982494/uusi-suositus-rintasyovan-seulonta-laajennettava-46-74-vuotiaisiin" },
  { key: "cost_outreach", base: 40, low: 10, high: 100, status: "choice", note: "What the county spends to bring in one more woman: reminders, invitations in her language, a navigator or a mobile unit. No public Finnish figure exists, so this is yours to set." },
  { key: "overdiagnosis", base: 0.06, low: 0, high: 0.13, status: "sourced", note: "Extra cancers found among new attenders that would never have caused harm: they cost money and gain no life-years. The Helsinki study estimated 5–7% (confidence interval −1% to 13%).", source: "Heinävaara, Sarkeala and Anttila, British Journal of Cancer 2014", url: "https://www.nature.com/articles/bjc2014413" },
  { key: "screening_interval", base: 2, low: 2, high: 2, status: "fixed", note: "The Finnish programme invites women aged 50–69 every two years.", source: "Finnish Cancer Registry, breast cancer screening", url: FCR_SCREENING },
];

export type ParamMeta = {
  group: "Target" | "Population" | "Stage at diagnosis" | "Outcomes by stage" | "Costs" | "Fixed";
  label: string;
  /** Display value = model value × scale (shares shown as %). */
  scale: number;
  unit: string;
  decimals: number;
  /** Slider bounds in display units, for the figures the user sets. */
  min?: number;
  max?: number;
};

export const PARAM_META: Record<ParamKey, ParamMeta> = {
  target_attendance: { group: "Target", label: "Target attendance", scale: 1, unit: "%", decimals: 1, min: 75, max: 90 },
  women_50_69_share: { group: "Population", label: "Women aged 50–69 (fallback)", scale: 100, unit: "% of population", decimals: 1 },
  incidence_50_69: { group: "Population", label: "Breast cancer incidence", scale: 1000, unit: "per 1,000 women a year", decimals: 1 },
  att_regional: { group: "Stage at diagnosis", label: "Women who attend: regional", scale: 100, unit: "% of cases", decimals: 1 },
  att_distant: { group: "Stage at diagnosis", label: "Women who attend: distant", scale: 100, unit: "% of cases", decimals: 1 },
  non_regional: { group: "Stage at diagnosis", label: "Women who don't attend: regional", scale: 100, unit: "% of cases", decimals: 1 },
  non_distant: { group: "Stage at diagnosis", label: "Women who don't attend: distant", scale: 100, unit: "% of cases", decimals: 1 },
  ly_lost_local: { group: "Outcomes by stage", label: "Life-years lost, localized", scale: 1, unit: "years a case", decimals: 1 },
  ly_lost_regional: { group: "Outcomes by stage", label: "Life-years lost, regional", scale: 1, unit: "years a case", decimals: 1 },
  ly_lost_distant: { group: "Outcomes by stage", label: "Life-years lost, distant", scale: 1, unit: "years a case", decimals: 1 },
  death_local: { group: "Outcomes by stage", label: "Breast cancer death, localized", scale: 100, unit: "%", decimals: 0 },
  death_regional: { group: "Outcomes by stage", label: "Breast cancer death, regional", scale: 100, unit: "%", decimals: 0 },
  death_distant: { group: "Outcomes by stage", label: "Breast cancer death, distant", scale: 100, unit: "%", decimals: 0 },
  cost_local: { group: "Costs", label: "Treatment cost, localized", scale: 1, unit: "€ a case", decimals: 0 },
  cost_regional: { group: "Costs", label: "Treatment cost, regional", scale: 1, unit: "€ a case", decimals: 0 },
  cost_distant: { group: "Costs", label: "Treatment cost, distant", scale: 1, unit: "€ a case", decimals: 0 },
  cost_screen: { group: "Costs", label: "Cost of an extra screen", scale: 1, unit: "€ a screen", decimals: 0 },
  cost_outreach: { group: "Costs", label: "Outreach per extra woman screened", scale: 1, unit: "€", decimals: 0, min: 0, max: 150 },
  overdiagnosis: { group: "Costs", label: "Overdiagnosis", scale: 100, unit: "% of cases found earlier", decimals: 0 },
  screening_interval: { group: "Fixed", label: "Screening interval", scale: 1, unit: "years", decimals: 0 },
};

export const PARAM_GROUPS: ParamMeta["group"][] = ["Target", "Population", "Stage at diagnosis", "Outcomes by stage", "Costs", "Fixed"];

/** The only figures the user sets. Everything else is evidence, moved together by the scenario switch. */
export const CHOICE_KEYS: ParamKey[] = ["target_attendance", "cost_outreach"];
