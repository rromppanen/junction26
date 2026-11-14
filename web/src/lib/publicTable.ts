import registry from "@/data/registry.json";
import { shortName } from "@/components/format";
import type { GroupKind, Mapping } from "./intake/fields";
import type { RegistryData } from "./registryTypes";
import type { Region } from "./types";

/**
 * The public datasets as one table the gap engine can read, so choosing only public data leads to the same gap
 * grid as an uploaded file. Counts, never percentages, all from the Finnish Cancer Registry's bowel (colorectal)
 * screening reports:
 * - every wellbeing services county, each year: invited, took part, positive, colonoscopy done;
 * - the whole country by sex, each year;
 * - the whole country by language, education and country of birth (the latest year the Registry reports them).
 * Shaped like a long statistics export: each row breaks down one thing, the rest read "yhteensä" (total).
 */

export type PublicTable = {
  fileName: string;
  headers: string[];
  rows: string[][];
  mapping: Mapping;
  groupKinds: Record<string, GroupKind>;
};

const T = "yhteensä";
const WHOLE = "koko maa";
export const PUBLIC_SOURCE = "Finnish Cancer Registry, bowel cancer screening (public data)";

const HEADERS = ["vuosi", "alue", "sukupuoli", "kieli", "koulutus", "syntymämaa", "kutsutut", "osallistuneet", "positiiviset", "kolonoskopia"];
const MAPPING: Mapping = {
  vuosi: "year", alue: "region", sukupuoli: "group", kieli: "group", koulutus: "group", syntymämaa: "group",
  kutsutut: "invited", osallistuneet: "attended", positiiviset: "positive", kolonoskopia: "examined",
};
const KINDS: Record<string, GroupKind> = { sukupuoli: "sex", kieli: "language", koulutus: "education", syntymämaa: "birthCountry" };
const DIM_COL: Record<"language" | "education" | "birthplace", number> = { language: 3, education: 4, birthplace: 5 };

export function publicTable(regions: Pick<Region, "id" | "name">[]): PublicTable {
  const data = registry as unknown as RegistryData;
  const c = data.colorectal;
  const name = new Map(regions.map((r) => [r.id, shortName(r.name)]));
  const rows: string[][] = [];
  const row = (year: number, area: string, groups: [number, string][], counts: (number | null)[]) => {
    const g = [T, T, T, T];
    for (const [i, v] of groups) g[i - 2] = v;
    rows.push([String(year), area, ...g, ...counts.map((n) => (n === null ? "" : String(n)))]);
  };
  for (const year of c.years) {
    for (const [id, county] of Object.entries(c.counties[year] ?? {})) {
      const f = county.funnel;
      row(year, name.get(Number(id)) ?? id, [], [f.selected, f.participated, f.positive, f.colonoscopy]);
    }
    const nat = c.national[year];
    if (!nat) continue;
    for (const [sex, f] of [["mies", nat.men], ["nainen", nat.women]] as const) {
      row(year, WHOLE, [[2, sex]], [f.selected, f.participated, f.positive, f.colonoscopy]);
    }
  }
  const groups = data.groups.colorectal;
  for (const g of groups.rows) {
    // The Registry reports these groups for taking part only; the later steps stay empty.
    row(groups.year, WHOLE, [[DIM_COL[g.dimension], g.group]], [g.invited, g.participated, null, null]);
  }
  return { fileName: PUBLIC_SOURCE, headers: HEADERS, rows, mapping: MAPPING, groupKinds: KINDS };
}
