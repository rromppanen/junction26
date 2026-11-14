import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "@/data/simulatorAssumptions";
import {
  PARAM_KEYS,
  invalidStageMix,
  monteCarlo,
  paramsFrom,
  parseAssumptionsCsv,
  quantile,
  seededRandom,
  sensitivity,
  simulate,
  spearman,
  totals,
  triangular,
} from "./simulator";

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
const P = paramsFrom(DEFAULT_ASSUMPTIONS);

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
    const rows = sensitivity(P, DEFAULT_ASSUMPTIONS, inputs);
    expect(rows.slice(0, 2).map((r) => r.key)).toEqual(["cost_outreach", "non_distant"]);
    expect(rows.find((r) => r.key === "cost_outreach")?.icerLow).toBeCloseTo(3049, -1);
    expect(rows.some((r) => r.key === "screening_interval")).toBe(false);
  });
});

describe("monteCarlo", () => {
  it("is repeatable with the same seed and stays near the notebook's spread", () => {
    const a = monteCarlo(P, DEFAULT_ASSUMPTIONS, inputs, 2000, 42);
    const b = monteCarlo(P, DEFAULT_ASSUMPTIONS, inputs, 2000, 42);
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
    ...DEFAULT_ASSUMPTIONS.map(
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
