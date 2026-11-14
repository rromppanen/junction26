import type { GapStatus } from "./types";

/**
 * Cancer mortality per wellbeing services county, 2020–2024 pooled, from the Finnish Cancer Registry's statistics
 * application: deaths and the age-standardised rate per 100,000 (Finland 2014 standard population), by sex.
 * This is the Goal 3 headline measure of the National Cancer Strategy (cancer deaths −10%, strategy p. 5).
 * Lower is better.
 */
export type MortalityRow = { area: string; sex: "men" | "women"; deaths: number; rate: number };

export const MORTALITY_SOURCE = {
  label: "Finnish Cancer Registry statistics application: cancer mortality 2020–2024, age-standardised (Finland 2014)",
  url: "https://tilastot.syoparekisteri.fi/syovat",
  period: "2020–2024",
};

/** Within this share of Finland's rate, a county counts as level (rates in small counties move by chance). */
export const MORTALITY_LEVEL_SHARE = 0.03;

const SEX: Record<string, MortalityRow["sex"]> = { Miehet: "men", Naiset: "women" };

/** Parses the Registry's CSV export (semicolons, decimal commas). Areas include the national row ("Koko maa"). */
export function parseMortalityCsv(text: string): MortalityRow[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const [area, sex, deaths, rate] = l.split(";");
      const s = SEX[sex?.trim()];
      if (!s) throw new Error(`unknown sex "${sex}" in mortality row: ${l}`);
      return { area: area.trim(), sex: s, deaths: Number(deaths), rate: Number(rate.replace(",", ".")) };
    });
}

export type SexMortality = {
  rate: number;
  deaths: number;
  national: number;
  /** County rate minus Finland's, per 100,000; positive = more deaths than Finland. */
  diff: number;
  status: GapStatus;
  /** 1 = lowest rate among counties. */
  rank: number;
  rankOf: number;
};

export type CountyMortality = { men: SexMortality; women: SexMortality; period: string };

/** Mortality for one county, by its Sotkanet name (e.g. "Itä-Uudenmaan hyvinvointialue"); null if not listed. */
/** County rows: everything except the whole country and the five collaborative areas (yhteistyöalueet). */
export function isCountyArea(area: string): boolean {
  return area !== "Koko maa" && !area.endsWith("yhteistyöalue");
}

export function countyMortality(rows: MortalityRow[], regionName: string): CountyMortality | null {
  const counties = rows.filter((r) => isCountyArea(r.area));
  const one = (sex: MortalityRow["sex"]): SexMortality | null => {
    const mine = counties.find((r) => r.area === regionName && r.sex === sex);
    const nat = rows.find((r) => r.area === "Koko maa" && r.sex === sex);
    if (!mine || !nat) return null;
    const peers = counties.filter((r) => r.sex === sex).map((r) => r.rate).sort((a, b) => a - b);
    const diff = Math.round((mine.rate - nat.rate) * 10) / 10;
    const rel = (mine.rate - nat.rate) / nat.rate;
    const status: GapStatus = Math.abs(rel) <= MORTALITY_LEVEL_SHARE ? "on-par" : rel > 0 ? "behind" : "ahead";
    return { rate: mine.rate, deaths: mine.deaths, national: nat.rate, diff, status, rank: peers.indexOf(mine.rate) + 1, rankOf: peers.length };
  };
  const men = one("men"), women = one("women");
  return men && women ? { men, women, period: MORTALITY_SOURCE.period } : null;
}
