// Turns the Cancer Registry mortality export into src/data/mortality.json (committed; the export changes once a year).
// Run: npx tsx scripts/ingest-mortality.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isCountyArea, parseMortalityCsv } from "../src/lib/mortality";

const root = join(__dirname, "..");
const rows = parseMortalityCsv(readFileSync(join(root, "data/cancer-registry/mortality-2020-2024.csv"), "utf8"));
const counties = new Set(rows.filter((r) => isCountyArea(r.area)).map((r) => r.area));
if (counties.size !== 23) throw new Error(`expected 23 counties, got ${counties.size}`);
if (!rows.some((r) => r.area === "Koko maa")) throw new Error("no national row");
writeFileSync(join(root, "src/data/mortality.json"), JSON.stringify(rows, null, 1) + "\n");
console.log(`mortality: ${rows.length} rows, ${counties.size} counties`);
