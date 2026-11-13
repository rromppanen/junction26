// Server-only module: imports pg. Do not import from client components.
import type { Dataset, IndicatorValue, Region } from "./types";
import snapshot from "@/data/snapshot.json";

let cached: Promise<Dataset> | null = null;

function fromSnapshot(): Dataset {
  return { ...(snapshot as Omit<Dataset, "source">), source: "snapshot" };
}

async function fromDatabase(url: string): Promise<Dataset> {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
  });
  await client.connect();
  try {
    const res = await client.query<{
      indicator_id: number;
      region_id: number;
      region_name: string;
      year: number;
      value: number;
      fetched_at: Date;
    }>("select indicator_id, region_id, region_name, year, value, fetched_at from indicator_values");
    if (res.rows.length === 0) throw new Error("indicator_values is empty");
    const snapRegions = new Map((snapshot.regions as Region[]).map((r) => [r.id, r]));
    const regions = new Map<number, Region>();
    const values: IndicatorValue[] = [];
    let fetchedAt = 0;
    for (const r of res.rows) {
      if (!regions.has(r.region_id)) {
        const known = snapRegions.get(r.region_id);
        regions.set(r.region_id, {
          id: r.region_id,
          name: r.region_name,
          isNational: known ? known.isNational : r.region_name === "Koko maa",
        });
      }
      values.push({ indicatorId: r.indicator_id, regionId: r.region_id, year: r.year, value: Number(r.value) });
      fetchedAt = Math.max(fetchedAt, new Date(r.fetched_at).getTime());
    }
    return { regions: [...regions.values()], values, fetchedAt: new Date(fetchedAt).toISOString(), source: "database" };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getDataset(): Promise<Dataset> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    cached = url
      ? fromDatabase(url).catch((e) => {
          console.warn("[data] database unavailable, using snapshot:", e instanceof Error ? e.message : e);
          return fromSnapshot();
        })
      : Promise.resolve(fromSnapshot());
  }
  return cached;
}
