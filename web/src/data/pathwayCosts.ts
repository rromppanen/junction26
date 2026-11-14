import type { Cited } from "./scenarioDefaults";

/**
 * Unit costs pre-filled on the decision board. Only figures with a public source belong here; the county
 * replaces them with its own. These are a wellbeing services county's prices to other payers
 * (palveluhinnasto), not production costs: treat them as an order of magnitude.
 */
const POHDE_PRICE_LIST = "https://pohde.fi/wp-content/uploads/2023/10/Palveluhinnasto-2024.pdf";

export const PATHWAY_COSTS: { perColonoscopy: Cited; perContact: Cited; perTest: Cited | null } = {
  perColonoscopy: {
    value: 614,
    label: "Pohjois-Pohjanmaa wellbeing services county, service price list 2025, code 213: colonoscopy incl. pathology",
    url: POHDE_PRICE_LIST,
    note: "With polyp removal the same list charges €1,151 (code 214); many screening colonoscopies remove polyps.",
  },
  perContact: {
    value: 100,
    label: "Pohjois-Pohjanmaa service price list 2025: a nurse's care phone contact (hoitajan hoidollinen puhelinkontakti)",
    url: POHDE_PRICE_LIST,
    note: "A price for a contact replacing a specialist-care visit; a short follow-up call likely costs less.",
  },
  // No public Finnish price found for a FIT kit and its analysis, or for a reminder letter or SMS.
  perTest: null,
};

/** Evidence for the options on the board, shown next to each row. Checked from published summaries, not full texts. */
export const OPTION_EVIDENCE = {
  navigation: {
    label: "Selby et al., Annals of Internal Medicine 2017: systematic review of 23 studies",
    url: "https://pubmed.ncbi.nlm.nih.gov/29049756/",
    note: "Patient navigation and provider reminders raise colonoscopy completion after a positive test (moderate evidence; mostly US studies, many at high risk of bias).",
  },
  delay: {
    label: "Corley et al., JAMA 2017: 70,124 people with a positive FIT",
    url: "https://pubmed.ncbi.nlm.nih.gov/28444278/",
    note: "Colonoscopy 10–12 months after the positive test was associated with more cancers (odds ratio 1.48) than at 8–30 days. Observational.",
  },
  standard: {
    label: "European guidelines for quality assurance in colorectal cancer screening, rec. 3.16 (2012)",
    url: "https://pubmed.ncbi.nlm.nih.gov/23012113/",
    note: "Colonoscopy should be scheduled within 31 days of referral for more than 90% of people (acceptable) or 95% (desirable). That is a share, not a median.",
  },
  reminders: {
    label: "Cancer roadmap p. 10: lower screening participation among immigrants and people with low socioeconomic status",
    url: "https://files.hackjunction.app/resources/Kansallinen_syopastrategia_toimeenpanon_tiekartta_2026_2031.pdf",
    note: "The Registry's own tables show the same groups behind in every programme (national figures).",
  },
} satisfies Record<string, { label: string; url: string; note: string }>;
