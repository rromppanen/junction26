// Server-only module: imports pg. Do not import from client components.
import type { Dataset, IndicatorValue, Region, RegionKind } from "./types";
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
      region_kind: string | null;
      parent_id: number | null;
    }>(
      // Fails (→ snapshot fallback) on an old table without region_kind/parent_id; re-run the ingest to add them.
      "select indicator_id, region_id, region_name, year, value, fetched_at, region_kind, parent_id from indicator_values",
    );
    if (res.rows.length === 0) throw new Error("indicator_values is empty");
    const snapRegions = new Map((snapshot.regions as Region[]).map((r) => [r.id, r]));
    const regions = new Map<number, Region>();
    const values: IndicatorValue[] = [];
    let fetchedAt = 0;
    for (const r of res.rows) {
      if (!regions.has(r.region_id)) {
        const known = snapRegions.get(r.region_id);
        const kind: RegionKind | undefined =
          r.region_kind === "national" || r.region_kind === "county" || r.region_kind === "municipality"
            ? r.region_kind
            : known?.kind;
        if (!kind) throw new Error(`region ${r.region_id} has no kind`);
        regions.set(r.region_id, {
          id: r.region_id,
          name: r.region_name,
          isNational: kind === "national",
          kind,
          parentId: r.parent_id ?? known?.parentId ?? null,
        });
      }
      values.push({ indicatorId: r.indicator_id, regionId: r.region_id, year: r.year, value: Number(r.value) });
      fetchedAt = Math.max(fetchedAt, new Date(r.fetched_at).getTime());
    }
    return { regions: [...regions.values()], values, fetchedAt: new Date(fetchedAt).toISOString(), languages: (snapshot as { languages?: Dataset["languages"] }).languages, source: "database" };
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
