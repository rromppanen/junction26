/**
 * Median wait from a positive colorectal screening test to colonoscopy, in months, per county.
 *
 * The Finnish Cancer Registry publishes these only as a chart (section "Viipeet kolonoskopiaan pääsyssä" of
 * https://stats.cancerregistry.fi/joukkistilastot/suolisto.html, report of 20.5.2026). The values below were
 * read from that chart by hand, to about ±0.1 months, and must always be shown as approximate.
 * Replace them with the Registry's own figures when obtained. Keys are Sotkanet county ids.
 */
export const WAIT_SOURCE = {
  label: "Finnish Cancer Registry, colorectal screening report: wait from positive test to colonoscopy (chart)",
  url: "https://stats.cancerregistry.fi/joukkistilastot/suolisto.html",
  note: "Read from the Registry's chart to about ±0.1 months; the Registry publishes no table of these values.",
};

export const COLONOSCOPY_WAIT_MONTHS: Record<number, { national: number; counties: Record<number, number> }> = {
  2023: {
    national: 2.1,
    counties: {
      957: 1.9, 958: 1.5, 959: 1.2, 960: 5.3, 961: 3.8, 962: 2.1, 963: 1.9, 964: 1.5, 965: 1.5, 966: 1.6, 967: 1.4,
      968: 2.4, 969: 4.0, 970: 1.8, 971: 3.0, 972: 1.2, 973: 2.0, 974: 3.6, 975: 4.5, 976: 2.1, 977: 5.3, 978: 1.7,
    },
  },
  2024: {
    national: 1.9,
    counties: {
      957: 1.7, 958: 1.5, 959: 1.0, 960: 3.4, 961: 2.7, 962: 2.7, 963: 1.8, 964: 1.6, 965: 1.7, 966: 0.8, 967: 1.9,
      968: 2.4, 969: 2.8, 970: 1.9, 971: 2.5, 972: 1.7, 973: 1.8, 974: 3.7, 975: 3.7, 976: 1.8, 977: 3.6, 978: 1.0,
    },
  },
};

/** European QA guideline rec. 3.16: colonoscopy within 31 days of referral. The Registry counts from the positive test. */
export const STANDARD_WAIT_MONTHS = 1;
