/**
 * Breast screening gap simulator: what raising a county's mammography attendance to a target would be worth.
 *
 * Same model as simulation_test/gap_radar_breast_screening_simulator.ipynb, which adapts the stage-distribution
 * logic of Shafik et al. (2022). Screening helps only by moving diagnoses to earlier stages:
 *   stage mix(county) = attendance × mix(attenders) + (1 − attendance) × mix(non-attenders)
 * Raising attendance moves cancers from the non-attender mix to the attender mix. That change runs through
 * fixed per-stage life-years, deaths and treatment costs. Results are per year at steady state (one year of
 * diagnoses in women aged 50–69), undiscounted. Pure functions only: no I/O, safe on server and client.
 */

export const PARAM_KEYS = [
  "women_50_69_share",
  "incidence_50_69",
  "target_attendance",
  "att_regional",
  "att_distant",
  "non_regional",
  "non_distant",
  "ly_lost_local",
  "ly_lost_regional",
  "ly_lost_distant",
  "death_local",
  "death_regional",
  "death_distant",
  "cost_local",
  "cost_regional",
  "cost_distant",
  "cost_screen",
  "cost_outreach",
  "overdiagnosis",
  "screening_interval",
] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];
export type Params = Record<ParamKey, number>;

/** Where an assumption's value comes from. "placeholder" values are illustrative until replaced with a source. */
export type AssumptionStatus = "placeholder" | "from-data" | "fixed";

export type Assumption = {
  key: ParamKey;
  base: number;
  low: number;
  high: number;
  status: AssumptionStatus;
  note: string;
};

/** One county's observed inputs: attendance in %, population in people, and (when known) women aged 50–69. */
export type CountyInput = { attendance: number; population: number; women?: number };

export type SimResult = {
  /** Extra screens per year needed to reach the target. */
  screens: number;
  /** Cancers per year diagnosed with the attender stage mix instead of the non-attender mix. */
  shifted: number;
  /** Regional or distant-stage diagnoses avoided per year. */
  late: number;
  /** Breast cancer deaths averted (for one year of diagnoses). */
  deaths: number;
  /** Life-years gained (for one year of diagnoses). */
  ly: number;
  /** Cost of the extra screens and the outreach that brings women in, € per year. */
  programme: number;
  /** Change in treatment costs, € per year; negative means savings. */
  treatment: number;
  /** programme + treatment, € per year. */
  net: number;
};

export type Totals = SimResult & {
  /** Net cost per life-year gained in €; NaN when nothing is gained. */
  icer: number;
};

const ZERO: SimResult = { screens: 0, shifted: 0, late: 0, deaths: 0, ly: 0, programme: 0, treatment: 0, net: 0 };

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Share of cases at [localized, regional, distant] for attenders or non-attenders. */
export function stageMix(P: Params, who: "att" | "non"): [number, number, number] {
  const reg = who === "att" ? P.att_regional : P.non_regional;
  const dist = who === "att" ? P.att_distant : P.non_distant;
  return [1 - reg - dist, reg, dist];
}

/**
 * Annual, steady-state effect of raising one county's attendance (in %) to the target. `women` is the county's
 * own count of women aged 50–69; without it, population × women_50_69_share is used.
 */
export function simulate(P: Params, attendance: number, population: number, womenCount?: number): SimResult {
  const dp = Math.max(P.target_attendance - attendance, 0) / 100;
  const women = womenCount ?? population * P.women_50_69_share;
  const shifted = women * P.incidence_50_69 * dp;
  const att = stageMix(P, "att");
  const non = stageMix(P, "non");
  const d = [non[0] - att[0], non[1] - att[1], non[2] - att[2]];
  const ly = shifted * dot(d, [P.ly_lost_local, P.ly_lost_regional, P.ly_lost_distant]);
  const deaths = shifted * dot(d, [P.death_local, P.death_regional, P.death_distant]);
  const late = shifted * (d[1] + d[2]);
  const treatment =
    -shifted * dot(d, [P.cost_local, P.cost_regional, P.cost_distant]) + shifted * P.overdiagnosis * P.cost_local;
  const screens = (women * dp) / P.screening_interval;
  const programme = screens * (P.cost_screen + P.cost_outreach);
  return { screens, shifted, late, deaths, ly, programme, treatment, net: programme + treatment };
}

/** Sum over counties, with the cost per life-year of the whole group. */
export function totals(P: Params, counties: readonly CountyInput[]): Totals {
  const t: SimResult = { ...ZERO };
  for (const c of counties) {
    const r = simulate(P, c.attendance, c.population, c.women);
    for (const k of Object.keys(t) as (keyof SimResult)[]) t[k] += r[k];
  }
  return { ...t, icer: t.ly > 0 ? t.net / t.ly : NaN };
}

export function paramsFrom(assumptions: readonly Assumption[]): Params {
  const P = {} as Params;
  for (const a of assumptions) P[a.key] = a.base;
  return P;
}

/** True when regional + distant shares leave a negative localized share. */
export function invalidStageMix(P: Params): ("attenders" | "non-attenders")[] {
  const bad: ("attenders" | "non-attenders")[] = [];
  if (P.att_regional + P.att_distant > 1) bad.push("attenders");
  if (P.non_regional + P.non_distant > 1) bad.push("non-attenders");
  return bad;
}

export type SensitivityRow = { key: ParamKey; icerLow: number; icerHigh: number; lyLow: number; lyHigh: number; swing: number };

/** One-way sensitivity: each assumption at its low and high value, everything else at P. Biggest swing first. */
export function sensitivity(P: Params, assumptions: readonly Assumption[], counties: readonly CountyInput[]): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  for (const a of assumptions) {
    if (!(a.low < a.high)) continue;
    const lo = totals({ ...P, [a.key]: a.low }, counties);
    const hi = totals({ ...P, [a.key]: a.high }, counties);
    const swing = Number.isFinite(lo.icer) && Number.isFinite(hi.icer) ? Math.abs(hi.icer - lo.icer) : 0;
    rows.push({ key: a.key, icerLow: lo.icer, icerHigh: hi.icer, lyLow: lo.ly, lyHigh: hi.ly, swing });
  }
  return rows.sort((x, y) => y.swing - x.swing);
}

/** Small seeded generator (mulberry32), so a draw can be repeated exactly. */
export function seededRandom(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inverse-CDF draw from a triangular distribution on [lo, hi] peaking at mode. */
export function triangular(u: number, lo: number, mode: number, hi: number): number {
  if (!(hi > lo)) return mode;
  const f = (mode - lo) / (hi - lo);
  return u < f ? lo + Math.sqrt(u * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
}

export type Draws = { ly: number[]; net: number[]; icer: number[]; n: number };

/**
 * Monte Carlo over every uncertain assumption at once: each is drawn from a triangular distribution between
 * its low and high value, peaking at the current setting (the range widens if the setting is outside it).
 */
export function monteCarlo(
  P: Params,
  assumptions: readonly Assumption[],
  counties: readonly CountyInput[],
  n: number,
  seed: number,
): Draws {
  const rnd = seededRandom(seed);
  const out: Draws = { ly: [], net: [], icer: [], n };
  for (let i = 0; i < n; i++) {
    const Q = { ...P };
    for (const a of assumptions) {
      if (!(a.low < a.high)) continue;
      const cur = P[a.key];
      Q[a.key] = triangular(rnd(), Math.min(a.low, cur), cur, Math.max(a.high, cur));
    }
    const t = totals(Q, counties);
    out.ly.push(t.ly);
    out.net.push(t.net);
    if (Number.isFinite(t.icer)) out.icer.push(t.icer);
  }
  return out;
}

/** Linear-interpolated quantile; NaN for an empty list. */
export function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

function ranks(xs: readonly number[]): number[] {
  const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1; // ties share the average rank
    for (let k = i; k <= j; k++) r[order[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

/** Spearman rank correlation of paired values; null with fewer than 4 pairs or no variation. */
export function spearman(a: readonly number[], b: readonly number[]): number | null {
  if (a.length !== b.length || a.length < 4) return null;
  const ra = ranks(a), rb = ranks(b);
  const n = ra.length;
  const ma = ra.reduce((s, v) => s + v, 0) / n, mb = rb.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : null;
}

const STATUS_FROM_CSV: Record<string, AssumptionStatus> = {
  PLACEHOLDER: "placeholder",
  "FROM DATASET": "from-data",
  FIXED: "fixed",
};

/**
 * Reads an assumptions.csv (parameter,base,low,high,unit,status,note). Notes may contain commas.
 * Returns the parsed rows, or the names of the parameters that are missing or not numeric.
 */
export function parseAssumptionsCsv(text: string): { ok: true; assumptions: Assumption[] } | { ok: false; missing: ParamKey[] } {
  const rows = new Map<string, Assumption>();
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  for (const line of lines.slice(1)) {
    const parts = line.split(",");
    const key = parts[0]?.trim();
    if (!key || !(PARAM_KEYS as readonly string[]).includes(key)) continue;
    const [base, low, high] = [parts[1], parts[2], parts[3]].map((s) => Number(s));
    const status = STATUS_FROM_CSV[(parts[5] ?? "").trim().toUpperCase()] ?? "placeholder";
    rows.set(key, { key: key as ParamKey, base, low, high, status, note: parts.slice(6).join(",").trim() });
  }
  const missing = PARAM_KEYS.filter((k) => {
    const r = rows.get(k);
    return !r || ![r.base, r.low, r.high].every(Number.isFinite);
  });
  if (missing.length) return { ok: false, missing };
  return { ok: true, assumptions: PARAM_KEYS.map((k) => rows.get(k)!) };
}
