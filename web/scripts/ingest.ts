import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { INDICATORS } from "../src/data/indicators";
import type { Dataset, IndicatorValue, Region } from "../src/lib/types";

const BASE = "https://sotkanet.fi/rest/1.1";
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

type SotkaRegion = { id: number; category: string; title: { fi: string } };
type SotkaRow = { indicator: number; region: number; year: number; gender: string; value?: number };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const all = await getJson<SotkaRegion[]>(`${BASE}/regions`);
  const regions: Region[] = all
    .filter((r) => r.category === "HYVINVOINTIALUE" || r.category === "MAA")
    .map((r) => ({ id: r.id, name: r.title.fi, isNational: r.category === "MAA" }));
  const keep = new Set(regions.map((r) => r.id));

  const values: IndicatorValue[] = [];
  for (const ind of INDICATORS) {
    const qs = YEARS.map((y) => `years=${y}`).join("&");
    const rows = await getJson<SotkaRow[]>(`${BASE}/json?indicator=${ind.id}&${qs}&genders=${ind.gender}`);
    const mine = rows
      .filter((r) => keep.has(r.region) && typeof r.value === "number")
      .map((r) => ({ indicatorId: ind.id, regionId: r.region, year: r.year, value: r.value as number }));
    values.push(...mine);
    const latest = Math.max(...mine.map((v) => v.year));
    const counties = mine.filter((v) => v.year === latest && v.regionId !== regions.find((r) => r.isNational)?.id);
    const nat = mine.some((v) => v.year === latest && regions.find((r) => r.id === v.regionId)?.isNational);
    console.log(`${ind.slug} (${ind.id}): ${mine.length} rows, latest ${latest}: ${counties.length} counties, national=${nat}`);
  }

  const fetchedAt = new Date().toISOString();
  const snapshot: Omit<Dataset, "source"> = { regions, values, fetchedAt };
  writeFileSync(join(__dirname, "../src/data/snapshot.json"), JSON.stringify(snapshot, null, 1) + "\n");
  console.log(`snapshot: ${regions.length} regions, ${values.length} values`);

  if (process.env.DATABASE_URL) {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(`create table if not exists indicator_values(
      indicator_id int, region_id int, region_name text, year int, value double precision,
      source_url text, fetched_at timestamptz, primary key(indicator_id, region_id, year))`);
    const names = new Map(regions.map((r) => [r.id, r.name]));
    const urls = new Map(INDICATORS.map((i) => [i.id, i.sourceUrl]));
    await client.query("begin");
    for (const v of values) {
      await client.query(
        `insert into indicator_values values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (indicator_id, region_id, year) do update set region_name=excluded.region_name,
         value=excluded.value, source_url=excluded.source_url, fetched_at=excluded.fetched_at`,
        [v.indicatorId, v.regionId, names.get(v.regionId), v.year, v.value, urls.get(v.indicatorId), fetchedAt],
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
