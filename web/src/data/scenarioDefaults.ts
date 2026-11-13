export type Cited = { value: number; label: string; url: string; note: string };

export type ScenarioDefaults = { costPerScreen: Cited | null; cancersPer1000Screened: Cited | null };

/**
 * Pre-filled assumptions per screening indicator id. Only figures with a public source belong here;
 * everything else stays null so the tool asks for the county's own number.
 */
export const SCENARIO_DEFAULTS: Record<number, ScenarioDefaults> = {
  3621: { costPerScreen: null, cancersPer1000Screened: null }, // breast
  6103: { costPerScreen: null, cancersPer1000Screened: null }, // colorectal
  3620: {
    // cervical
    costPerScreen: {
      value: 20,
      label: "HPV test price in a Finnish Cancer Registry cost study (Virtanen et al. 2015)",
      url: "https://link.springer.com/10.1186/s12905-015-0261-7",
      note: "Test cost only: excludes invitations and sample-taking.",
    },
    cancersPer1000Screened: null,
  },
};
