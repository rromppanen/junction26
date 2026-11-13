import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTEXT_INDICATORS, INDICATORS } from "../src/data/indicators";
import type { Dataset, IndicatorValue, Region, RegionKind } from "../src/lib/types";

const BASE = "https://sotkanet.fi/rest/1.1";
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

/** Municipality rows before this year are dropped if the snapshot would exceed MAX_BYTES (county rows are kept). */
const MAX_BYTES = 3_000_000;
const MUNI_MIN_YEAR_IF_TOO_BIG = 2022;

const KIND: Record<string, RegionKind> = { MAA: "national", HYVINVOINTIALUE: "county", KUNTA: "municipality" };

type SotkaRegion = { id: number; category: string; title: { fi: string }; memberOf?: number[] };
type SotkaRow = { indicator: number; region: number; year: number; gender: string; value?: number };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
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

  const fetchedAt = new Date().toISOString();
  const write = () => {
    const snapshot: Omit<Dataset, "source"> = { regions, values, fetchedAt };
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
