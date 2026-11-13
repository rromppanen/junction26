import { peoplePer1000ToReach } from "./impact";

export type ScenarioInputs = {
  today: number; // current attendance, %
  target: number; // scenario attendance, %
  invitedPerYear: number | null;
  costPerScreen: number | null; // euros
  cancersPer1000Screened: number | null;
};

export type ScenarioResult = {
  extraPer1000: number;
  extraPerYear: number | null;
  extraCostPerYear: number | null;
  extraCancersPerYear: number | null;
  costPerExtraCancer: number | null;
};

/** Negative, NaN and infinite figures count as "not entered". */
const clean = (n: number | null): number | null => (n === null || !Number.isFinite(n) || n < 0 ? null : n);

/** Works out what raising attendance would take. Every output needing a missing input is null; nothing is guessed. */
export function computeScenario(i: ScenarioInputs): ScenarioResult {
  const extraPer1000 = peoplePer1000ToReach(i.today, i.target) ?? 0;
  const invited = clean(i.invitedPerYear);
  const cost = clean(i.costPerScreen);
  const rate = clean(i.cancersPer1000Screened);

  const extraPerYear = invited === null ? null : Math.round((extraPer1000 / 1000) * invited);
  const extraCostPerYear = extraPerYear === null || cost === null ? null : extraPerYear * cost;
  const extraCancersPerYear =
    extraPerYear === null || rate === null ? null : Math.round((extraPerYear * rate) / 1000 * 10 + 1e-9) / 10;
  const costPerExtraCancer =
    extraCostPerYear === null || extraCancersPerYear === null || extraCancersPerYear === 0
      ? null
      : Math.round(extraCostPerYear / extraCancersPerYear);
  return { extraPer1000, extraPerYear, extraCostPerYear, extraCancersPerYear, costPerExtraCancer };
}
