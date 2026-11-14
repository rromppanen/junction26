export type Cited = { value: number; label: string; url: string; note: string };

export type ScenarioDefaults = { costPerScreen: Cited | null; cancersPer1000Screened: Cited | null };

/**
 * Pre-filled assumptions per screening indicator id. Only figures with a public source belong here;
 * everything else stays null so the tool asks for the county's own number.
 */
export const SCENARIO_DEFAULTS: Record<number, ScenarioDefaults> = {
  3621: {
    // breast
    costPerScreen: null,
    cancersPer1000Screened: {
      value: 4.7,
      label: "Cancers found per 1,000 screens, Finnish Mass Screening Registry (Acta Oncologica)",
      url: "https://medicaljournalssweden.se/actaoncologica/article/view/28618",
      note: "Asymptomatic women in the Finnish programme; your county's rate may differ.",
    },
  },
  6103: {
    // colorectal
    costPerScreen: null,
    cancersPer1000Screened: {
      value: 2.7,
      label: "Cancers found per 1,000 FIT returners, Southwest Finland 2022–23 (Scand J Gastroenterol 2025)",
      url: "https://utupub.fi/handle/10024/179904",
      note: "One county's first programme rounds: 64% took part, 6% tested positive.",
    },
  },
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
