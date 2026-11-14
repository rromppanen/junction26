import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTEXT_INDICATORS, INDICATORS } from "../src/data/indicators";
import type { Dataset, IndicatorValue, MunicipalityLanguages, Region, RegionKind } from "../src/lib/types";

const BASE = "https://sotkanet.fi/rest/1.1";
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

/** Municipality rows before this year are dropped if the snapshot would exceed MAX_BYTES (county rows are kept). */
const MAX_BYTES = 3_000_000;
const MUNI_MIN_YEAR_IF_TOO_BIG = 2022;

const KIND: Record<string, RegionKind> = { MAA: "national", HYVINVOINTIALUE: "county", KUNTA: "municipality" };

type SotkaRegion = { id: number; category: string; title: { fi: string }; memberOf?: number[] };
type SotkaRow = { indicator: number; region: number; year: number; gender: string; value?: number };

/** Sotkanet is occasionally slow; retry a few times so one hiccup doesn't fail a build. */
async function getJson<T>(url: string, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      if (i >= attempts) throw e;
      console.warn(`retry ${i}/${attempts - 1} after: ${e instanceof Error ? e.message : e}`);
      await new Promise((r) => setTimeout(r, 2_000 * i));
    }
  }
}

const PX_URL = "https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/11rm.px";
/** Language codes that are totals, national languages or non-languages (98 = other, X = unknown). */
const NOT_FOREIGN = new Set(["SSS", "01", "02", "fi", "sv", "se", "98", "X"]);

/** Statistics Finland lists these bilingual municipalities by their Swedish name; Sotkanet uses the Finnish one. */
const SWEDISH_NAMES: Record<string, string> = {
  Ingå: "Inkoo", Kimitoön: "Kemiönsaari", Kristinestad: "Kristiinankaupunki", Kronoby: "Kruunupyy", Larsmo: "Luoto",
  Malax: "Maalahti", Mariehamn: "Maarianhamina - Mariehamn", Korsholm: "Mustasaari", Närpes: "Närpiö", Pargas: "Parainen",
  Pedersöre: "Pedersören kunta", Jakobstad: "Pietarsaari", Raseborg: "Raasepori", Nykarleby: "Uusikaarlepyy", Vörå: "Vöyri",
};

type JsonStat = {
  id: string[];
  size: number[];
  value: (number | null)[];
  dimension: Record<string, { category: { index: Record<string, number> | string[]; label: Record<string, string> } }>;
};

/** Statistics Finland 11rm: population by language per municipality, joined to Sotkanet municipalities by name. */
async function fetchLanguages(regions: Region[]): Promise<MunicipalityLanguages[]> {
  const sel = (code: string, filter: string, values: string[]) => ({ code, selection: { filter, values } });
  const query = {
    query: [
      sel("alue_23_20260101", "all", ["*"]),
      sel("kieli_15_20180102", "all", ["*"]), // must be selected explicitly or the dimension is dropped
      sel("sukupuoli_9_20180101", "item", ["SSS"]),
      sel("timeperiod_y", "item", ["2025"]),
    ],
    response: { format: "json-stat2" },
  };
  const res = await fetch(PX_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${PX_URL}`);
  const js = (await res.json()) as JsonStat;
  const dims = js.id;
  const areaDim = js.dimension["alue_23_20260101"].category;
  const langDim = js.dimension["kieli_15_20180102"].category;
  const idx = (c: JsonStat["dimension"][string]["category"]): Record<string, number> =>
    Array.isArray(c.index) ? Object.fromEntries(c.index.map((k, i) => [k, i])) : c.index;
  const areaIdx = idx(areaDim);
  const langIdx = idx(langDim);
  const stride = (d: string) => js.size.slice(dims.indexOf(d) + 1).reduce((a, b) => a * b, 1);
  const aS = stride("alue_23_20260101");
  const lS = stride("kieli_15_20180102");
  const byName = new Map(regions.filter((r) => r.kind === "municipality").map((r) => [r.name.trim().toLowerCase(), r]));
  const out: MunicipalityLanguages[] = [];
  const unmatched: string[] = [];
  for (const [code, a] of Object.entries(areaIdx)) {
    if (!code.startsWith("KU")) continue;
    const name = SWEDISH_NAMES[areaDim.label[code]] ?? areaDim.label[code];
    const region = byName.get(name.trim().toLowerCase());
    if (!region) {
      unmatched.push(name);
      continue;
    }
    const at = (lang: string) => js.value[a * aS + langIdx[lang] * lS] ?? 0;
    const top = Object.entries(langIdx)
      .filter(([k]) => !NOT_FOREIGN.has(k))
      .map(([k]) => ({ language: langDim.label[k], count: at(k) }))
      .filter((l) => l.count > 0)
      .sort((x, y) => y.count - x.count || x.language.localeCompare(y.language))
      .slice(0, 10);
    out.push({ regionId: region.id, year: 2025, total: at("SSS"), top });
  }
  const matched = new Set(out.map((o) => o.regionId));
  console.log(`languages: ${out.length} municipalities with data; ${unmatched.length} Statistics Finland names unmatched${unmatched.length ? ": " + unmatched.join(", ") : ""}`);
  const ours = regions.filter((r) => r.kind === "municipality" && !matched.has(r.id)).map((r) => r.name);
  console.log(`languages: ${ours.length} Sotkanet municipalities without language data${ours.length ? ": " + ours.join(", ") : ""}`);
  return out;
}

async function main() {
  const all = await getJson<SotkaRegion[]>(`${BASE}/regions`);
  const category = new Map(all.map((r) => [r.id, r.category]));
  const regions: Region[] = [];
  for (const r of all) {
    const kind = KIND[r.category];
    if (!kind) continue;
    // A municipality belongs to the county listed in its memberOf (Helsinki → "Helsingin kaupunki" county).
    const parentId =
      kind === "municipality" ? (r.memberOf ?? []).find((m) => category.get(m) === "HYVINVOINTIALUE") ?? null : null;
    if (kind === "municipality" && parentId === null) continue; // keep only municipalities inside a county
    regions.push({ id: r.id, name: r.title.fi, isNational: kind === "national", kind, parentId });
  }
  const kindOf = new Map(regions.map((r) => [r.id, r.kind]));

  let values: IndicatorValue[] = [];
  for (const ind of [...INDICATORS, ...CONTEXT_INDICATORS]) {
    const qs = YEARS.map((y) => `years=${y}`).join("&");
    const rows = await getJson<SotkaRow[]>(`${BASE}/json?indicator=${ind.id}&${qs}&genders=${ind.gender}`);
    const mine = rows
      .filter((r) => kindOf.has(r.region) && typeof r.value === "number")
      .map((r) => ({ indicatorId: ind.id, regionId: r.region, year: r.year, value: r.value as number }));
    values.push(...mine);
    const latest = Math.max(...mine.map((v) => v.year));
    const at = (k: RegionKind) => mine.filter((v) => v.year === latest && kindOf.get(v.regionId) === k).length;
    console.log(
      `${ind.slug} (${ind.id}): ${mine.length} rows, latest ${latest}: ${at("county")} counties, ` +
        `${at("municipality")} municipalities, national=${at("national") > 0}`,
    );
  }

  let languages: MunicipalityLanguages[] | undefined;
  try {
    languages = await fetchLanguages(regions);
  } catch (e) {
    console.warn(`languages omitted (Statistics Finland request failed): ${e instanceof Error ? e.message : e}`);
  }

  const fetchedAt = new Date().toISOString();
  const write = () => {
    const snapshot: Omit<Dataset, "source"> = { regions, values, fetchedAt, ...(languages ? { languages } : {}) };
    const text = JSON.stringify(snapshot, null, 1) + "\n";
    return text;
  };
  let text = write();
  if (Buffer.byteLength(text) > MAX_BYTES) {
    console.log(`snapshot ${Buffer.byteLength(text)} bytes > ${MAX_BYTES}; dropping municipality rows before ${MUNI_MIN_YEAR_IF_TOO_BIG}`);
    values = values.filter((v) => kindOf.get(v.regionId) !== "municipality" || v.year >= MUNI_MIN_YEAR_IF_TOO_BIG);
    text = write();
  }
  writeFileSync(join(__dirname, "../src/data/snapshot.json"), text);
  const count = (k: RegionKind) => regions.filter((r) => r.kind === k).length;
  console.log(
    `snapshot: ${regions.length} regions (${count("county")} counties, ${count("municipality")} municipalities), ` +
      `${values.length} values, ${Buffer.byteLength(text)} bytes`,
  );

  if (process.env.DATABASE_URL) {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(`create table if not exists indicator_values(
      indicator_id int, region_id int, region_name text, year int, value double precision,
      source_url text, fetched_at timestamptz, primary key(indicator_id, region_id, year))`);
    await client.query(`alter table indicator_values add column if not exists region_kind text`);
    await client.query(`alter table indicator_values add column if not exists parent_id int`);
    const byId = new Map(regions.map((r) => [r.id, r]));
    const urls = new Map([...INDICATORS, ...CONTEXT_INDICATORS].map((i) => [i.id, i.sourceUrl]));
    await client.query("begin");
    for (const v of values) {
      await client.query(
        `insert into indicator_values
           (indicator_id, region_id, region_name, year, value, source_url, fetched_at, region_kind, parent_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (indicator_id, region_id, year) do update set region_name=excluded.region_name,
         value=excluded.value, source_url=excluded.source_url, fetched_at=excluded.fetched_at,
         region_kind=excluded.region_kind, parent_id=excluded.parent_id`,
        [
          v.indicatorId, v.regionId, byId.get(v.regionId)?.name, v.year, v.value, urls.get(v.indicatorId), fetchedAt,
          byId.get(v.regionId)?.kind, byId.get(v.regionId)?.parentId,
        ],
      );
    }
    await client.query("commit");
    await client.end();
    console.log(`upserted ${values.length} rows to Postgres`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
