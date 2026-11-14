// Shapes of src/data/registry.json, written by scripts/ingest-registry.ts from the Finnish Cancer Registry's
// annual screening reports. Counts, never percentages: rates are computed where they are used.

export type Programme = "colorectal" | "breast" | "cervical";

/** One colorectal screening round, step by step. Each step is a subset of the one before. */
export type Funnel = {
  selected: number; // picked from the population register for an invitation
  participated: number; // returned a test that could be analysed
  positive: number; // test above the 25 µg/g threshold
  colonoscopy: number; // positives with a colonoscopy reported to the screening register
  treated: number; // colonoscopied people who received surgery or neoadjuvant treatment
};

/** Most serious finding per person among positives. noColonoscopy + the finding classes = positive. */
export type Findings = {
  positive: number;
  noColonoscopy: number;
  noFinding: number;
  precursor: number; // polyp not needing follow-up
  advancedPrecursor: number; // advanced precursor or one needing follow-up
  cancer: number;
  other: number;
};

export type GroupRow = {
  dimension: "language" | "education" | "birthplace";
  group: string; // English label; "Other or missing" and "Basic or unknown" pool missing data, as the Registry does
  invited: number;
  participated: number;
};

export type RegistryData = {
  sources: { programme: Programme; url: string; retrievedAt: string; sha256: string }[];
  colorectal: {
    years: number[];
    national: Record<number, { all: Funnel; men: Funnel; women: Funnel; findings: Findings }>;
    /** year → Sotkanet county id → counts. Åland is not in the national programme. */
    counties: Record<number, Record<number, { funnel: Funnel; findings: Findings }>>;
    /** Where the bowel cancers of one eligible cohort were found (screening and Cancer Registry linked). */
    intervalCancers: {
      cohortYear: number;
      screenDetected: number;
      nonParticipant: number;
      afterNegativeTest: number;
      positiveNoColonoscopy: number;
    } | null;
  };
  groups: Record<Programme, { year: number; rows: GroupRow[] }>;
};
