import type { Table } from "./intake/csv";
import { GROUP_KINDS, groupKindLabel, parseCount, type Field, type GroupKind, type Mapping } from "./intake/fields";

/**
 * Finds gaps between population groups in an uploaded aggregate file. Pure and deterministic: the AI only
 * decided what each column means; every number here is computed from the file.
 *
 * Every population-group column (language, sex, age, nationality, ...) and the area column is a "dimension".
 * For each dimension, each group is compared with everyone else in the same dimension, for each pathway
 * step the file has figures for.
 */

export type MetricId = "participation" | "followUp" | "wait";
type RateMetric = { id: Exclude<MetricId, "wait">; labelEn: string; verb: string; num: Field; den: Field };
export const RATE_METRICS: RateMetric[] = [
  { id: "participation", labelEn: "Took part in screening", verb: "took part in screening", num: "attended", den: "invited" },
  { id: "followUp", labelEn: "Follow-up after a positive result", verb: "completed follow-up after a positive result", num: "examined", den: "positive" },
];
export const METRIC_LABEL: Record<MetricId, string> = {
  participation: "Took part in screening",
  followUp: "Follow-up after a positive result",
  wait: "Days waited",
};

/** Fewer people than this in a group and its rate is not shown: too noisy, and too close to identifying people. */
export const MIN_GROUP = 20;
/** A difference smaller than this (percentage points, or days for waits) counts as level. */
export const LEVEL_PP = 2;
const LEVEL_DAYS = 2;
/** |z| at least this for a rate gap to count as clear rather than possibly chance. */
const CLEAR_Z = 2;

export type GapStatus = "behind" | "ahead" | "level" | "unclear" | "few";
export type GroupStat = {
  value: string;
  /** People in the group for this step (the denominator), or rows for waits. */
  n: number;
  /** Percent for rates, days for waits; null when the group is too small to show. */
  figure: number | null;
  rest: number | null;
  /** Group minus everyone else: percentage points, or days for waits. */
  gap: number | null;
  status: GapStatus;
  /** People who would have completed the step had the group matched everyone else (rates only). */
  missing: number;
  /** The same gap in the first year of the file, when it has several years. */
  firstGap: number | null;
};
export type Dimension = {
  header: string;
  kind: GroupKind;
  label: string;
  byMetric: Partial<Record<MetricId, GroupStat[]>>;
  /** Steps where some group was too small in the latest year, so every year in the file was added together. */
  pooled: Partial<Record<MetricId, boolean>>;
};
export type Finding = { dimension: Dimension; metric: MetricId; group: GroupStat };
export type GapReport = {
  year: number | null;
  firstYear: number | null;
  /** All years in the file, for the "years combined" note. */
  years: number[];
  metrics: MetricId[];
  dimensions: Dimension[];
  /**
   * Clear gaps where a group is behind. The largest gap from each way of grouping comes first (so one big group or one
   * family of overlapping columns cannot crowd out the rest), then the remaining ones; waits after rates.
   */
  findings: Finding[];
  /** Common equity dimensions this file has no column for. */
  absent: GroupKind[];
};

const TOTAL = /^(yhteensä|yht\.?|kaikki|kaikki yhteensä|koko maa|total|totals?|all|sum|overall|-|–)$/i;
const isTotal = (v: string | undefined) => v === undefined || !v.trim() || TOTAL.test(v.trim());
const CHECKED_KINDS: GroupKind[] = ["language", "sex", "age", "birthCountry", "migrantBackground", "nationality", "education", "income"];

function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const whole = parseCount(v);
  if (whole !== undefined) return whole;
  const t = v.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

type Ctx = { table: Table; col: Map<Field | string, number>; dims: { header: string; idx: number }[] };

/**
 * Rows that give dimension `d` broken down once: rows where `d` names a group, and every other dimension is at its
 * total when the file has total rows for it (a long export), or summed over when it has none (a full cross-table).
 */
function rowsFor(ctx: Ctx, rows: string[][], d: { idx: number }): string[][] {
  const others = ctx.dims.filter((o) => o.idx !== d.idx);
  const hasTotals = new Map(others.map((o) => [o.idx, rows.some((r) => isTotal(r[o.idx]))]));
  return rows.filter((r) => !isTotal(r[d.idx]) && others.every((o) => !hasTotals.get(o.idx) || isTotal(r[o.idx])));
}

function rateStats(rows: string[][], idx: number, numCol: number, denCol: number): Map<string, { a: number; b: number }> {
  const out = new Map<string, { a: number; b: number }>();
  for (const r of rows) {
    const a = num(r[numCol]), b = num(r[denCol]);
    if (a === undefined || b === undefined) continue;
    const k = r[idx].trim();
    const s = out.get(k) ?? { a: 0, b: 0 };
    s.a += a;
    s.b += b;
    out.set(k, s);
  }
  return out;
}

function compareRates(groups: Map<string, { a: number; b: number }>): Map<string, Omit<GroupStat, "firstGap">> {
  const total = [...groups.values()].reduce((s, g) => ({ a: s.a + g.a, b: s.b + g.b }), { a: 0, b: 0 });
  const out = new Map<string, Omit<GroupStat, "firstGap">>();
  for (const [value, g] of groups) {
    const restA = total.a - g.a, restB = total.b - g.b;
    if (g.b < MIN_GROUP || restB < MIN_GROUP) {
      out.set(value, { value, n: g.b, figure: null, rest: null, gap: null, status: "few", missing: 0 });
      continue;
    }
    const p1 = g.a / g.b, p2 = restA / restB;
    const pooled = total.a / total.b;
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / g.b + 1 / restB));
    const z = se > 0 ? (p1 - p2) / se : 0;
    const gap = (p1 - p2) * 100;
    const status: GapStatus = Math.abs(gap) < LEVEL_PP ? "level" : Math.abs(z) < CLEAR_Z ? "unclear" : gap < 0 ? "behind" : "ahead";
    out.set(value, {
      value, n: g.b, figure: p1 * 100, rest: p2 * 100, gap, status,
      missing: status === "behind" ? Math.round((p2 - p1) * g.b) : 0,
    });
  }
  return out;
}

function compareWaits(rows: string[][], idx: number, waitCol: number, weightCol: number | undefined): Map<string, Omit<GroupStat, "firstGap">> {
  const groups = new Map<string, { sum: number; w: number; rows: number }>();
  for (const r of rows) {
    const d = num(r[waitCol]);
    if (d === undefined) continue;
    const w = weightCol === undefined ? 1 : (num(r[weightCol]) ?? 0);
    if (w <= 0) continue;
    const k = r[idx].trim();
    const s = groups.get(k) ?? { sum: 0, w: 0, rows: 0 };
    s.sum += d * w;
    s.w += w;
    s.rows += 1;
    groups.set(k, s);
  }
  const all = [...groups.values()].reduce((s, g) => ({ sum: s.sum + g.sum, w: s.w + g.w }), { sum: 0, w: 0 });
  const out = new Map<string, Omit<GroupStat, "firstGap">>();
  for (const [value, g] of groups) {
    const restW = all.w - g.w;
    // Weighted by people when the file has a count to weigh with; otherwise every row counts once.
    const n = weightCol === undefined ? g.rows : g.w;
    if (restW <= 0 || (weightCol !== undefined && g.w < MIN_GROUP)) {
      out.set(value, { value, n, figure: null, rest: null, gap: null, status: "few", missing: 0 });
      continue;
    }
    const mean = g.sum / g.w, rest = (all.sum - g.sum) / restW;
    const gap = mean - rest;
    // Without spread figures there is no test; a wait gap counts as clear only if it is large.
    const status: GapStatus = Math.abs(gap) < LEVEL_DAYS ? "level" : Math.abs(gap) < 2 * LEVEL_DAYS ? "unclear" : gap > 0 ? "behind" : "ahead";
    out.set(value, { value, n, figure: mean, rest, gap, status, missing: 0 });
  }
  return out;
}

function prepare(table: Table, mapping: Mapping) {
  const col = new Map<Field | string, number>();
  table.headers.forEach((h, i) => {
    const f = mapping[h];
    if (f && f !== "ignore" && f !== "group" && !col.has(f)) col.set(f, i);
  });
  const dims = table.headers.filter((h) => mapping[h] === "group" || mapping[h] === "region").map((h) => ({ header: h, idx: table.headers.indexOf(h) }));
  const ctx: Ctx = { table, col, dims };
  const yearCol = col.get("year");
  const years = yearCol === undefined ? [] : [...new Set(table.rows.map((r) => num(r[yearCol])).filter((y): y is number => y !== undefined))].sort();
  const inYear = (y: number | null) => (y === null || yearCol === undefined ? table.rows : table.rows.filter((r) => num(r[yearCol]) === y));
  const metrics: MetricId[] = [
    ...RATE_METRICS.filter((m) => col.has(m.num) && col.has(m.den)).map((m) => m.id),
    ...(col.has("waitDays") ? (["wait"] as MetricId[]) : []),
  ];
  const weightCol = col.get("positive") ?? col.get("attended");
  const compare = (rows: string[][], d: { idx: number }, m: MetricId) => {
    const use = rowsFor(ctx, rows, d);
    if (m === "wait") return compareWaits(use, d.idx, col.get("waitDays")!, weightCol);
    const rm = RATE_METRICS.find((x) => x.id === m)!;
    return compareRates(rateStats(use, d.idx, col.get(rm.num)!, col.get(rm.den)!));
  };
  return { ctx, col, dims, years, inYear, metrics, compare, weightCol };
}

/** A stable id for one gap, for links: step, column and group. */
export const gapId = (f: { metric: MetricId; dimension: { header: string }; group: { value: string } }) =>
  [f.metric, f.dimension.header, f.group.value].join("|");

/**
 * What closing a gap would be worth. Rates: people who would have completed the step at everyone else's rate.
 * Waits: the extra days the group waited, summed over its people.
 */
export const impactOf = (f: Finding) => (f.metric === "wait" ? Math.max(0, (f.group.gap ?? 0) * f.group.n) : f.group.missing);

/** Builds the gap report. `kinds` gives each group column's kind (from the intake). */
export function findGaps(table: Table, mapping: Mapping, kinds: Record<string, GroupKind> = {}): GapReport {
  const { dims, years, inYear, metrics, compare } = prepare(table, mapping);
  const year = years.at(-1) ?? null;
  const firstYear = years.length > 1 ? years[0] : null;
  const latest = inYear(year), first = firstYear === null ? null : inYear(firstYear);

  const dimensions: Dimension[] = dims.map((d) => {
    const kind: GroupKind = mapping[d.header] === "region" ? "region" : (kinds[d.header] ?? "other");
    const byMetric: Dimension["byMetric"] = {};
    const pooled: Dimension["pooled"] = {};
    for (const m of metrics) {
      let now = compare(latest, d, m);
      let then = first ? compare(first, d, m) : null;
      // Small groups (often exactly the ones an equity analysis is about) get every year added together.
      if (years.length > 1 && [...now.values()].some((s) => s.status === "few")) {
        now = compare(table.rows, d, m);
        then = null;
        pooled[m] = true;
      }
      const stats = [...now.values()].map((s) => ({ ...s, firstGap: then?.get(s.value)?.gap ?? null }));
      if (stats.length >= 2) byMetric[m] = stats.sort((a, b) => (a.figure === null ? 1 : 0) - (b.figure === null ? 1 : 0) || (m === "wait" ? (b.figure ?? 0) - (a.figure ?? 0) : (a.figure ?? 0) - (b.figure ?? 0)));
    }
    return { header: d.header, kind, label: groupKindLabel(kind, d.header), byMetric, pooled };
  }).filter((d) => Object.keys(d.byMetric).length > 0);

  // Ranked by what closing the gap would be worth: people missed first, then extra waiting.
  const findings: Finding[] = dimensions
    .flatMap((dimension) =>
      (Object.entries(dimension.byMetric) as [MetricId, GroupStat[]][]).flatMap(([metric, groups]) =>
        groups.filter((g) => g.status === "behind").map((group) => ({ dimension, metric, group })),
      ),
    )
    .sort((a, b) => (a.metric === "wait" ? 1 : 0) - (b.metric === "wait" ? 1 : 0) || impactOf(b) - impactOf(a) || Math.abs(b.group.gap ?? 0) - Math.abs(a.group.gap ?? 0));

  const present = new Set(dimensions.map((d) => d.kind));
  const absent = CHECKED_KINDS.filter((k) => !present.has(k) && !(k === "nationality" && (present.has("birthCountry") || present.has("migrantBackground"))) && !(k === "birthCountry" && present.has("nationality")));
  return { year, firstYear, years, metrics, dimensions, findings, absent };
}

/** Counts along the pathway for a group, or for everyone else, in the rows the gap was measured on. */
export type Steps = { invited: number | null; attended: number | null; positive: number | null; examined: number | null; waitDays: number | null };
export type GapDetail = {
  finding: Finding;
  /** Years the figures cover: one year, or several added together. */
  span: string;
  group: Steps;
  rest: Steps;
  /** The gap's step, group vs everyone else, in each year of the file (null when too small that year). */
  series: { year: number; group: number | null; rest: number | null }[];
  /** Participation gaps: positive results the missed people would likely have had, at everyone else's positive rate. */
  extraPositives: number | null;
};

/** Everything a gap's own page needs. Null when the id no longer matches a gap in the file. */
export function gapDetail(table: Table, mapping: Mapping, kinds: Record<string, GroupKind>, id: string): GapDetail | null {
  const report = findGaps(table, mapping, kinds);
  const finding = report.findings.find((f) => gapId(f) === id);
  if (!finding) return null;
  const { ctx, col, dims, years, inYear, compare, weightCol } = prepare(table, mapping);
  const d = dims.find((x) => x.header === finding.dimension.header)!;
  const pooled = !!finding.dimension.pooled[finding.metric];
  const rows = rowsFor(ctx, pooled ? table.rows : inYear(years.at(-1) ?? null), d);
  const value = finding.group.value;

  const steps = (rs: string[][]): Steps => {
    // null, not 0, when the file has no figure for a step in these rows (e.g. a breakdown reported for one step only).
    const sum = (f: Field) => {
      const c = col.get(f);
      if (c === undefined) return null;
      const vals = rs.map((r) => num(r[c])).filter((v): v is number => v !== undefined);
      return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
    };
    let waitDays: number | null = null;
    const wc = col.get("waitDays");
    if (wc !== undefined) {
      let total = 0, w = 0;
      for (const r of rs) {
        const v = num(r[wc]);
        const weight = weightCol === undefined ? 1 : (num(r[weightCol]) ?? 0);
        if (v !== undefined && weight > 0) { total += v * weight; w += weight; }
      }
      waitDays = w > 0 ? total / w : null;
    }
    return { invited: sum("invited"), attended: sum("attended"), positive: sum("positive"), examined: sum("examined"), waitDays };
  };
  const mine = rows.filter((r) => r[d.idx].trim() === value);
  const others = rows.filter((r) => r[d.idx].trim() !== value);
  const group = steps(mine), rest = steps(others);

  const series = years.length > 1
    ? years.map((y) => {
        const s = compare(inYear(y), d, finding.metric).get(value);
        return { year: y, group: s?.figure ?? null, rest: s?.rest ?? null };
      })
    : [];

  const extraPositives =
    finding.metric === "participation" && rest.positive !== null && rest.attended
      ? Math.round(finding.group.missing * (rest.positive / rest.attended))
      : null;
  const span = pooled ? `${years[0]}–${years.at(-1)}` : String(years.at(-1) ?? "");
  return { finding, span, group, rest, series, extraPositives };
}

export const kindLabel = (k: GroupKind) => GROUP_KINDS.find((g) => g.id === k)?.labelEn ?? "Other";
