// Women aged 50–69 per wellbeing services county (the breast screening age group), from Statistics Finland
// table 11re (population by age and sex per municipality), summed into counties with Sotkanet's municipality
// → county mapping from the snapshot. Writes src/data/women5069.json (committed; changes once a year).
// Run: npx tsx scripts/ingest-women.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11re.px";
const YEAR = "2024";
const root = join(__dirname, "..");

type Meta = { variables: { code: string; values: string[]; valueTexts: string[] }[] };
type JsonStat = { value: number[]; dimension: Record<string, { category: { index: Record<string, number> } }>; id: string[]; size: number[] };

async function main() {
  const meta = (await (await fetch(URL)).json()) as Meta;
  const area = meta.variables.find((v) => v.code.startsWith("alue"))!;
  const age = meta.variables.find((v) => v.code.startsWith("ikaryhma"))!;
  const sex = meta.variables.find((v) => v.code.startsWith("sukupuoli"))!;
  const ages = age.values.filter((a) => /^\d{3}$/.test(a) && Number(a) >= 50 && Number(a) <= 69);
  if (ages.length !== 20) throw new Error(`expected 20 single-year ages, got ${ages.length}`);
  const municipalities = area.values.filter((v) => v.startsWith("KU"));

  const body = {
    query: [
      { code: area.code, selection: { filter: "item", values: municipalities } },
      { code: age.code, selection: { filter: "item", values: ages } },
      { code: sex.code, selection: { filter: "item", values: ["2"] } },
      { code: "timeperiod_y", selection: { filter: "item", values: [YEAR] } },
    ],
    response: { format: "json-stat2" },
  };
  const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status} from Statistics Finland`);
  const js = (await res.json()) as JsonStat;

  // Sum the 20 ages per municipality code (the value array is row-major over js.id).
  const areaIdx = js.dimension[area.code].category.index;
  const stride = js.size.slice(js.id.indexOf(area.code) + 1).reduce((a, b) => a * b, 1);
  const byCode = new Map<string, number>();
  for (const [code, i] of Object.entries(areaIdx)) {
    let sum = 0;
    for (let k = 0; k < stride; k++) sum += js.value[i * stride + k] ?? 0;
    byCode.set(code, sum);
  }

  const snapshot = JSON.parse(readFileSync(join(root, "src/data/snapshot.json"), "utf8")) as {
    regions: { id: number; name: string; kind: string; parentId: number | null }[];
  };
  const muniByName = new Map(snapshot.regions.filter((r) => r.kind === "municipality").map((r) => [r.name.toLowerCase(), r]));
  const counties: Record<number, number> = {};
  const unmatched: string[] = [];
  municipalities.forEach((code) => {
    const name = area.valueTexts[area.values.indexOf(code)];
    const m = muniByName.get(name.toLowerCase());
    if (!m || m.parentId === null) return void unmatched.push(name);
    counties[m.parentId] = (counties[m.parentId] ?? 0) + (byCode.get(code) ?? 0);
  });
  const n = Object.keys(counties).length;
  if (unmatched.length) console.warn(`unmatched municipalities: ${unmatched.join(", ")}`);
  if (n !== 23) throw new Error(`expected 23 counties, got ${n}`);

  const total = Object.values(counties).reduce((a, b) => a + b, 0);
  writeFileSync(
    join(root, "src/data/women5069.json"),
    JSON.stringify({ year: Number(YEAR), table: "Statistics Finland 11re", url: URL, total, counties }, null, 1) + "\n",
  );
  console.log(`women 50–69, ${YEAR}: ${total} in ${n} counties; ${unmatched.length} municipalities unmatched`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
