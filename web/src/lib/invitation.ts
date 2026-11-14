/**
 * Breast screening invitation designer: what a county gains from adding layers to its invitation.
 *
 * The county keeps the pre-booked appointment (layer 0) and adds layers on top. Each layer converts a share of
 * the women who would still not attend in the group it targets. Layers apply in a fixed order, each to whoever is
 * left after the ones before, so two layers never claim the same woman.
 *
 * Invited women are split into two groups, because the Registry publishes attendance by mother tongue:
 *   - "native": Finnish, Swedish or Sami mother tongue;
 *   - "other": other or missing mother tongue (the Registry pools the two).
 * Only national group figures exist, so a county's split is estimated (see `countySegments`).
 */

export type Segment = "native" | "other";

export type Segments = Record<Segment, { invited: number; attendance: number }>;

export type LayerId = "rebook" | "sms" | "language" | "second" | "outreach" | "elsewhere";

export type EvidenceLevel = "finnish" | "international" | "placeholder";

export type Layer = {
  id: LayerId;
  name: string;
  /** What the county would actually do. */
  action: string;
  /** The reason for not attending that it answers. */
  barrier: string;
  /** Who gets it. "all" means both groups. */
  target: "all" | "other";
  /** "invited": everyone in the target is contacted. "missing": only those still not attending. */
  reaches: "invited" | "missing";
  /** Share of the reached women who are still not attending that the layer brings in (0–1). */
  effect: number;
  /** € per woman reached. */
  costPerReached: number;
  /** "reclassify" records outside screening instead of bringing women in: no extra mammograms. */
  kind?: "reclassify";
  evidence: EvidenceLevel;
  evidenceNote: string;
  url?: string;
};

/** National 2024 breast screening by mother tongue (Finnish Cancer Registry, rinta.html). */
export const NATIONAL_SEGMENTS = {
  native: { invited: 320048, participated: 266278 },
  other: { invited: 24803, participated: 15091 },
} as const;

export const NATIONAL_INVITED = NATIONAL_SEGMENTS.native.invited + NATIONAL_SEGMENTS.other.invited;

/** Programme goal 2 of the national cancer strategy 2026–2035: 80% attendance in every county. */
export const TARGET_ATTENDANCE = 0.8;

/** Cost of one extra mammogram incl. further tests, € (same figure as the breast screening simulator). */
export const COST_PER_SCREEN = 45;

const FCR_BREAST = "https://stats.cancerregistry.fi/joukkistilastot/rinta.html";

/** Default layers, in the order they apply. Effects without a checked source are placeholders the county sets. */
export const DEFAULT_LAYERS: Layer[] = [
  {
    id: "rebook",
    name: "Rebook online",
    action: "A short link and QR code in the letter to move the booked time, plus evening and weekend slots.",
    barrier: "The time or place did not suit them",
    target: "all",
    reaches: "invited",
    effect: 0.03,
    costPerReached: 0.2,
    evidence: "finnish",
    evidenceNote:
      "Pohjanmaa and Keski-Pohjanmaa let women choose their own time from 2024 with no fall in cervical screening attendance and fewer no-shows (Yle 2025). The size of the effect here is a placeholder.",
    url: "https://yle.fi/a/74-20198630",
  },
  {
    id: "sms",
    name: "Text reminder",
    action: "A text message 2–3 days before the appointment, with the rebooking link.",
    barrier: "Forgot the appointment",
    target: "all",
    reaches: "invited",
    effect: 0.05,
    costPerReached: 0.1,
    evidence: "placeholder",
    evidenceNote:
      "Forgetting is a common reason in Finnish cervical screening (Lääkärilehti 2014). Reminder trials abroad have not been checked for this app, so the effect is a placeholder.",
    url: "https://www.laakarilehti.fi/tieteessa/alkuperaistutkimukset/miksi-nainen-ei-osallistu-kohdunkaulan-syovan-seulontaan/en",
  },
  {
    id: "language",
    name: "Letter in her language",
    action: "The invitation and results in the woman's registered language, in plain words, with a female examiner promised.",
    barrier: "Cannot read the letter, does not know what screening is for",
    target: "other",
    reaches: "invited",
    effect: 0.1,
    costPerReached: 3,
    evidence: "finnish",
    evidenceNote:
      "Women of African origin in Finland named language, not knowing about screening and misreading results as barriers (Idehen et al. 2020, 30 women). The size of the effect is a placeholder.",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7602139/",
  },
  {
    id: "second",
    name: "Second booked time",
    action: "Every woman who missed gets a new booked time, not a letter asking her to book.",
    barrier: "Missed once and did not rebook",
    target: "all",
    reaches: "missing",
    effect: 0.1,
    costPerReached: 2,
    evidence: "placeholder",
    evidenceNote:
      "Helsinki's attendance fell from about 72% to 62% when it dropped booked times, and recovered when it restored them (cervical screening, Yle 2025). Trials of second booked times abroad have not been checked here.",
    url: "https://yle.fi/a/74-20198630",
  },
  {
    id: "outreach",
    name: "Personal call",
    action: "A health worker who speaks her language calls women who still have not come, and books a time on the call.",
    barrier: "Does not know about the programme or does not trust it",
    target: "other",
    reaches: "missing",
    effect: 0.2,
    costPerReached: 30,
    evidence: "placeholder",
    evidenceNote:
      "Women born in Africa attend least (45.1% in 2024, Finnish Cancer Registry). No Finnish trial of calls exists; the effect and cost are placeholders.",
    url: FCR_BREAST,
  },
  {
    id: "elsewhere",
    name: "“Already screened” reply",
    action: "A one-click reply for women who had a mammogram elsewhere; the result is checked in Kanta and counted.",
    barrier: "Already screened in private or occupational care",
    target: "all",
    reaches: "missing",
    effect: 0.2,
    costPerReached: 0.5,
    kind: "reclassify",
    evidence: "finnish",
    evidenceNote:
      "In a Finnish study, 53% of women who skipped breast screening had had a recent mammogram elsewhere (Aro et al. 2001). That is old, so the share used here is a placeholder.",
    url: "https://pesquisa.bvsalud.org/portal/resource/es/mdl-11768605",
  },
];

/**
 * Split a county's invited women into the two language groups.
 *   - Invited a year: women aged 50–69 × the national ratio of invited to women of that age (about one in two).
 *   - Share with another mother tongue: the national share, scaled by the county's foreign-background rate
 *     against Finland's, capped at 50%.
 *   - Attendance: the national ratio between the groups is kept, and the native rate is set so the weighted
 *     mean equals the county's measured attendance.
 */
export function countySegments(input: {
  women: number;
  attendancePct: number;
  nationalWomen: number;
  foreignPer1000?: number | null;
  nationalForeignPer1000?: number | null;
}): Segments {
  const invited = (input.women * NATIONAL_INVITED) / input.nationalWomen;
  const nationalShare = NATIONAL_SEGMENTS.other.invited / NATIONAL_INVITED;
  const scale =
    input.foreignPer1000 != null && input.nationalForeignPer1000 ? input.foreignPer1000 / input.nationalForeignPer1000 : 1;
  const share = Math.min(0.5, nationalShare * scale);
  const ratio =
    NATIONAL_SEGMENTS.other.participated / NATIONAL_SEGMENTS.other.invited /
    (NATIONAL_SEGMENTS.native.participated / NATIONAL_SEGMENTS.native.invited);
  const a = input.attendancePct / 100;
  const native = Math.min(1, a / (share * ratio + (1 - share)));
  return {
    native: { invited: invited * (1 - share), attendance: native },
    other: { invited: invited * share, attendance: Math.min(1, native * ratio) },
  };
}

export type LayerResult = {
  id: LayerId;
  /** Women contacted by this layer. */
  reached: number;
  /** Extra women screened (0 for "reclassify"). */
  extraScreened: number;
  /** Women newly recorded as screened elsewhere ("reclassify" only). */
  recordedElsewhere: number;
  layerCost: number;
};

export type DesignResult = {
  invited: number;
  before: { attendance: number; bySegment: Record<Segment, number> };
  after: { attendance: number; bySegment: Record<Segment, number> };
  /** Attendance counting women recorded as screened elsewhere. */
  recordedAttendance: number;
  extraScreened: number;
  recordedElsewhere: number;
  layers: LayerResult[];
  layerCost: number;
  screenCost: number;
  totalCost: number;
  /** € per extra woman screened; null when nobody extra is screened. */
  costPerExtra: number | null;
  /** Women still needed to reach 80% after the design, counting only real screens. */
  stillToTarget: number;
};

export function runDesign(seg: Segments, layers: Layer[], costPerScreen = COST_PER_SCREEN): DesignResult {
  const groups: Segment[] = ["native", "other"];
  const missing: Record<Segment, number> = {
    native: seg.native.invited * (1 - seg.native.attendance),
    other: seg.other.invited * (1 - seg.other.attendance),
  };
  const invited = seg.native.invited + seg.other.invited;
  const attendedBefore = seg.native.invited * seg.native.attendance + seg.other.invited * seg.other.attendance;
  let elsewhere = 0;
  const elsewhereBy: Record<Segment, number> = { native: 0, other: 0 };

  // Reclassification must come last: it only counts women nothing else brought in.
  const ordered = [...layers.filter((l) => l.kind !== "reclassify"), ...layers.filter((l) => l.kind === "reclassify")];
  const results: LayerResult[] = ordered.map((l) => {
    const effect = Math.min(1, Math.max(0, l.effect));
    let reached = 0;
    let converted = 0;
    for (const g of groups) {
      if (l.target === "other" && g === "native") continue;
      reached += l.reaches === "invited" ? seg[g].invited : missing[g];
      const c = missing[g] * effect;
      missing[g] -= c;
      converted += c;
      if (l.kind === "reclassify") elsewhereBy[g] += c;
    }
    const layerCost = reached * Math.max(0, l.costPerReached);
    if (l.kind === "reclassify") {
      elsewhere += converted;
      return { id: l.id, reached, extraScreened: 0, recordedElsewhere: converted, layerCost };
    }
    return { id: l.id, reached, extraScreened: converted, recordedElsewhere: 0, layerCost };
  });

  const extraScreened = results.reduce((s, r) => s + r.extraScreened, 0);
  const layerCost = results.reduce((s, r) => s + r.layerCost, 0);
  const screenCost = extraScreened * costPerScreen;
  const attendedAfter = attendedBefore + extraScreened;
  // Real screens only: women recorded as screened elsewhere still count as not attending the programme.
  const segAfter = (g: Segment) => (seg[g].invited > 0 ? 1 - (missing[g] + elsewhereBy[g]) / seg[g].invited : 0);

  return {
    invited,
    before: {
      attendance: attendedBefore / invited,
      bySegment: { native: seg.native.attendance, other: seg.other.attendance },
    },
    after: { attendance: attendedAfter / invited, bySegment: { native: segAfter("native"), other: segAfter("other") } },
    recordedAttendance: (attendedAfter + elsewhere) / invited,
    extraScreened,
    recordedElsewhere: elsewhere,
    layers: results,
    layerCost,
    screenCost,
    totalCost: layerCost + screenCost,
    costPerExtra: extraScreened > 0 ? (layerCost + screenCost) / extraScreened : null,
    stillToTarget: Math.max(0, TARGET_ATTENDANCE * invited - attendedAfter),
  };
}
