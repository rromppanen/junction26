/**
 * Evidence shown beside the screening simulator, each with an evidence label so readers can tell
 * what was measured from what was modelled:
 *   observed  – a measured figure from a named, published source
 *   inferred  – a plausible reading of observed figures that still needs checking
 *   simulated – a model output that depends on stated assumptions
 *   expert    – a qualitative point from a named expert, with date and context
 *
 * Kept apart from evidence.ts on purpose: that file's shape is a shared contract read by the AI analyst,
 * and these sources are not part of the strategy, the roadmap or the challenge brief.
 */

export type EvidenceKind = "observed" | "inferred" | "simulated" | "expert";

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  observed: "Observed",
  inferred: "Inferred",
  simulated: "Simulated",
  expert: "Expert insight",
};

export const EVIDENCE_KIND_HELP: Record<EvidenceKind, string> = {
  observed: "A measured figure from a named, published source.",
  inferred: "A reading of measured figures that still needs checking.",
  simulated: "A model result that depends on the assumptions shown.",
  expert: "A point made by a named expert, with date and context.",
};

export type SimulatorEvidence = {
  id: string;
  kind: EvidenceKind;
  claim: string;
  citation: string;
  /** Only for sources with a stable public address; studies cited from slides have none here. */
  url?: string;
};

const TALK =
  "Hanne Kuitunen (oncologist, service area director, Pohde – North Ostrobothnia wellbeing services county), “Equitable Cancer Care – How Can We Ensure It in Finland”, talk at Junction 2026, Espoo, 13 November 2026";

export const SIMULATOR_EVIDENCE: SimulatorEvidence[] = [
  {
    id: "kuitunen-2026-dlbcl-route",
    kind: "observed",
    claim:
      "In diffuse large B-cell lymphoma, patients who first went to public primary care started treatment a median of 207 days after their first symptom, against 123 days for those who went to private or occupational health care.",
    citation: `Kuitunen et al., Cancer Medicine 2026;15:e71920, as shown in ${TALK}.`,
  },
  {
    id: "tokola-2025-seven-weeks",
    kind: "observed",
    claim:
      "In the same disease, more than 7 weeks from first symptom to diagnosis was associated with worse progression-free survival.",
    citation: `Tokola et al., Cancer Medicine 2025;14(22), as shown in ${TALK}.`,
  },
  {
    id: "zai-2025-education",
    kind: "observed",
    claim:
      "Among 469,522 Finnish cancer patients diagnosed in 2000–2019, cancer mortality during follow-up was 27% in the highest education group and 47% in the lowest. 51% of the most educated had surgery, against 36% of the least educated.",
    citation: "Zai et al., BMJ Public Health 2025;3:e002829 (Finnish Cancer Registry, Population Register, HILMO and Kela data).",
  },
  {
    id: "acta-2022-nordic-review",
    kind: "observed",
    claim:
      "A review of 98 Nordic studies found that lower socioeconomic status went with more advanced stage at diagnosis, less active cancer treatment and poorer survival.",
    citation: "Systematic review and meta-analysis, Acta Oncologica 2022;61(11):1317–1331.",
  },
  {
    id: "kuitunen-screening-barriers",
    kind: "expert",
    claim:
      "Screening participation is high overall but lower among people with lower socioeconomic status. Some migrant, Roma, and sexual and gender minority groups face extra barriers, and participation varies by language group.",
    citation: TALK,
  },
  {
    id: "kuitunen-consistent-criteria",
    kind: "expert",
    claim:
      "With cancer care costs projected to rise from €1.5 billion (2023) to €2.6 billion (2035), not every treatment can be offered to everyone. Equity needs consistent, evidence-based criteria for what is offered across Finland.",
    citation: `${TALK}; cost figures from the National Cancer Strategy 2026–2035.`,
  },
];
