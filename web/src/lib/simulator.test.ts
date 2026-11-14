import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "@/data/simulatorAssumptions";
import {
  PARAM_KEYS,
  invalidStageMix,
  monteCarlo,
  paramsFrom,
  scenarioParams,
  parseAssumptionsCsv,
  quantile,
  seededRandom,
  sensitivity,
  simulate,
  stageMix,
  spearman,
  totals,
  triangular,
  type Assumption,
} from "./simulator";

// The values the notebook was run with. They pin the engine to the notebook; the app's defaults are sourced.
const NOTEBOOK: Assumption[] = [
  { key: "women_50_69_share", base: 0.124, low: 0.11, high: 0.135, status: "from-data", note: "" },
  { key: "incidence_50_69", base: 0.0033, low: 0.0028, high: 0.0038, status: "placeholder", note: "" },
  { key: "target_attendance", base: 85, low: 83, high: 86, status: "from-data", note: "" },
  { key: "att_regional", base: 0.27, low: 0.22, high: 0.32, status: "placeholder", note: "" },
  { key: "att_distant", base: 0.03, low: 0.02, high: 0.05, status: "placeholder", note: "" },
  { key: "non_regional", base: 0.38, low: 0.32, high: 0.44, status: "placeholder", note: "" },
  { key: "non_distant", base: 0.1, low: 0.07, high: 0.14, status: "placeholder", note: "" },
  { key: "ly_lost_local", base: 1, low: 0.5, high: 2, status: "placeholder", note: "" },
  { key: "ly_lost_regional", base: 5, low: 3, high: 7, status: "placeholder", note: "" },
  { key: "ly_lost_distant", base: 17, low: 12, high: 20, status: "placeholder", note: "" },
  { key: "death_local", base: 0.04, low: 0.02, high: 0.06, status: "placeholder", note: "" },
  { key: "death_regional", base: 0.2, low: 0.15, high: 0.3, status: "placeholder", note: "" },
  { key: "death_distant", base: 0.8, low: 0.7, high: 0.9, status: "placeholder", note: "" },
  { key: "cost_local", base: 25000, low: 15000, high: 35000, status: "placeholder", note: "" },
  { key: "cost_regional", base: 45000, low: 30000, high: 60000, status: "placeholder", note: "" },
  { key: "cost_distant", base: 95000, low: 60000, high: 130000, status: "placeholder", note: "" },
  { key: "cost_screen", base: 60, low: 40, high: 90, status: "placeholder", note: "" },
  { key: "cost_outreach", base: 40, low: 10, high: 100, status: "placeholder", note: "" },
  { key: "overdiagnosis", base: 0.05, low: 0, high: 0.15, status: "placeholder", note: "" },
  { key: "screening_interval", base: 2, low: 2, high: 2, status: "fixed", note: "" },
];
// 2024 breast screening attendance (Sotkanet 3621) and population (127) for the 22 counties with attendance data.
const COUNTIES: [string, number, number][] = [
  ["Etelä-Karjala", 83.2, 125083], ["Etelä-Pohjanmaa", 85.0, 189929], ["Etelä-Savo", 82.2, 129376],
  ["Helsinki", 74.3, 684018], ["Itä-Uusimaa", 79.8, 99415], ["Kainuu", 84.1, 69639], ["Kanta-Häme", 83.4, 169455],
  ["Keski-Pohjanmaa", 85.4, 67723], ["Keski-Suomi", 85.1, 274112], ["Keski-Uusimaa", 80.5, 207070],
  ["Kymenlaakso", 82.0, 157442], ["Lappi", 83.8, 176151], ["Länsi-Uusimaa", 76.1, 502067], ["Pirkanmaa", 83.5, 545406],
  ["Pohjanmaa", 84.9, 178749], ["Pohjois-Karjala", 84.2, 162091], ["Pohjois-Pohjanmaa", 85.6, 418331],
  ["Pohjois-Savo", 85.1, 248815], ["Päijät-Häme", 81.8, 204635], ["Satakunta", 84.9, 211261],
  ["Vantaa and Kerava", 76.7, 289730], ["Varsinais-Suomi", 82.7, 494819],
];
const inputs = COUNTIES.map(([, attendance, population]) => ({ attendance, population }));
const P = paramsFrom(NOTEBOOK);

describe("simulate", () => {
  it("reproduces the notebook's base case for all counties", () => {
    const t = totals(P, inputs);
    expect(t.ly).toBeCloseTo(127.833, 2);
    expect(t.net).toBeCloseTo(762207.79, 0);
    expect(t.icer).toBeCloseTo(5962.51, 1);
  });

  it("reproduces the notebook's Helsinki row", () => {
    const r = simulate(P, 74.3, 684018);
    expect(r.screens).toBeCloseTo(4537.78, 1);
    expect(r.shifted).toBeCloseTo(29.95, 2);
    expect(r.late).toBeCloseTo(5.39, 2);
    expect(r.deaths).toBeCloseTo(2.12, 2);
    expect(r.ly).toBeCloseTo(46.72, 2);
    expect(r.net).toBeCloseTo(278574.03, 0);
  });

  it("uses a county's own count of women aged 50–69 when given", () => {
    const own = simulate(P, 74.3, 684018, 75640);
    const share = simulate({ ...P, women_50_69_share: 75640 / 684018 }, 74.3, 684018);
    expect(own.ly).toBeCloseTo(share.ly, 9);
    expect(own.screens).toBeLessThan(simulate(P, 74.3, 684018).screens);
  });

  it("gives nothing to a county already at or above the target", () => {
    const r = simulate(P, 85.6, 418331);
    expect(r.screens).toBe(0);
    expect(r.ly).toBe(0);
    expect(r.net).toBe(0);
  });

  it("returns NaN cost per life-year when nothing is gained", () => {
    expect(Number.isNaN(totals(P, []).icer)).toBe(true);
  });

  it("grows with the target", () => {
    expect(totals({ ...P, target_attendance: 86 }, inputs).ly).toBeGreaterThan(totals(P, inputs).ly);
  });

  it("flags stage mixes that exceed 100%", () => {
    expect(invalidStageMix(P)).toEqual([]);
    expect(invalidStageMix({ ...P, non_regional: 0.95, non_distant: 0.1 })).toEqual(["non-attenders"]);
  });
});

describe("sensitivity", () => {
  it("puts outreach cost and the non-attender distant share at the top, as in the notebook", () => {
    const rows = sensitivity(P, NOTEBOOK, inputs);
    expect(rows.slice(0, 2).map((r) => r.key)).toEqual(["cost_outreach", "non_distant"]);
    expect(rows.find((r) => r.key === "cost_outreach")?.icerLow).toBeCloseTo(3049, -1);
    expect(rows.some((r) => r.key === "screening_interval")).toBe(false);
  });
});

describe("monteCarlo", () => {
  it("is repeatable with the same seed and stays near the notebook's spread", () => {
    const a = monteCarlo(P, NOTEBOOK, inputs, 2000, 42);
    const b = monteCarlo(P, NOTEBOOK, inputs, 2000, 42);
    expect(a.icer).toEqual(b.icer);
    const median = quantile(a.icer, 0.5);
    expect(median).toBeGreaterThan(6000);
    expect(median).toBeLessThan(10000);
  });

  it("draws triangular values inside the range", () => {
    const rnd = seededRandom(1);
    for (let i = 0; i < 500; i++) {
      const v = triangular(rnd(), 10, 40, 100);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(triangular(0.3, 5, 5, 5)).toBe(5);
  });
});

describe("spearman", () => {
  it("ranks with ties and needs at least four pairs", () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 2, 2, 3], [1, 2, 3, 4])).toBeCloseTo(0.9487, 3);
    expect(spearman([1, 2, 3], [1, 2, 3])).toBeNull();
    expect(spearman([1, 1, 1, 1], [1, 2, 3, 4])).toBeNull();
  });
});

describe("parseAssumptionsCsv", () => {
  const csv = [
    "parameter,base,low,high,unit,status,note",
    ...NOTEBOOK.map(
      (a) => `${a.key},${a.base},${a.low},${a.high},unit,${a.status === "from-data" ? "FROM DATASET" : a.status.toUpperCase()},a note, with a comma`,
    ),
  ].join("\r\n");

  it("reads every parameter, keeping commas inside notes", () => {
    const res = parseAssumptionsCsv(csv);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assumptions.map((a) => a.key)).toEqual([...PARAM_KEYS]);
    expect(res.assumptions[0].note).toBe("a note, with a comma");
    expect(res.assumptions.find((a) => a.key === "target_attendance")?.status).toBe("from-data");
  });

  it("names the parameters that are missing or not numeric", () => {
    const broken = csv.replace(/^cost_outreach,40/m, "cost_outreach,abc").replace(/^overdiagnosis.*$/m, "");
    const res = parseAssumptionsCsv(broken);
    expect(res).toEqual({ ok: false, missing: ["cost_outreach", "overdiagnosis"] });
  });
});

describe("default assumptions", () => {
  const D = paramsFrom(DEFAULT_ASSUMPTIONS);
  const deathShare = (who: "att" | "non") => {
    const m = stageMix(D, who);
    return m[0] * D.death_local + m[1] * D.death_regional + m[2] * D.death_distant;
  };

  it("keeps every base inside its range, with a source for everything but the user's choice", () => {
    for (const a of DEFAULT_ASSUMPTIONS) {
      expect(a.low).toBeLessThanOrEqual(a.base);
      expect(a.base).toBeLessThanOrEqual(a.high);
      expect(a.status).not.toBe("placeholder");
      if (a.status !== "choice") expect(a.source, a.key).toBeTruthy();
    }
  });

  it("gives attenders about 28% lower breast cancer mortality, the published Finnish estimate", () => {
    expect(1 - deathShare("att") / deathShare("non")).toBeCloseTo(0.28, 1);
    const low = { ...D, non_regional: 0.315, non_distant: 0.06 };
    const m = stageMix(low, "non");
    const lowNon = m[0] * D.death_local + m[1] * D.death_regional + m[2] * D.death_distant;
    expect(1 - deathShare("att") / lowNon).toBeCloseTo(0.22, 2);
  });

  it("reproduces the recorded share of localized cancers at 82% attendance", () => {
    const localized = 0.82 * stageMix(D, "att")[0] + 0.18 * stageMix(D, "non")[0];
    expect(localized).toBeGreaterThan(0.65);
    expect(localized).toBeLessThan(0.7);
  });

  it("builds stage costs from the Lehtinen et al. tables for ages 50–69", () => {
    expect(17450 + 4 * 1750 + D.death_local * 22575).toBeCloseTo(D.cost_local, -3);
    expect(25550 + 4 * 2625 + D.death_regional * 28325).toBeCloseTo(D.cost_regional, -3);
    expect(30425 + 3 * 5725 + D.death_distant * 44825).toBeCloseTo(D.cost_distant, -3);
  });
});

describe("scenarioParams", () => {
  it("returns the base values for the central reading", () => {
    expect(scenarioParams(DEFAULT_ASSUMPTIONS, "central")).toEqual(paramsFrom(DEFAULT_ASSUMPTIONS));
  });

  it("orders the three readings and leaves the user's choices alone", () => {
    const [c, m, o] = (["cautious", "central", "optimistic"] as const).map((s) => scenarioParams(DEFAULT_ASSUMPTIONS, s));
    const [tc, tm, to] = [c, m, o].map((Q) => totals(Q, inputs));
    expect(tc.ly).toBeGreaterThan(0);
    expect(tc.ly).toBeLessThan(tm.ly);
    expect(tm.ly).toBeLessThan(to.ly);
    expect(tc.deaths).toBeLessThan(tm.deaths);
    expect(tc.net).toBeGreaterThan(tm.net);
    expect(tm.net).toBeGreaterThan(to.net);
    for (const Q of [c, o]) {
      expect(Q.target_attendance).toBe(m.target_attendance);
      expect(Q.cost_outreach).toBe(m.cost_outreach);
      expect(invalidStageMix(Q)).toEqual([]);
    }
    expect(c.non_distant).toBeCloseTo((0.07 + 0.06) / 2, 9);
  });
});
