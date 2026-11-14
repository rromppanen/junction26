// Extracts screening-pathway counts from the Finnish Cancer Registry's annual screening reports into
// src/data/registry.json. Run deliberately when the Registry publishes a new report (once a year):
//
//   npm run ingest:registry                      # downloads the three reports
//   npm run ingest:registry -- --dir /tmp/reports  # uses suolisto.html, rinta.html, kohtu.html already saved there
//
// The output is committed: the reports are ~8 MB each and change once a year, so the build does not fetch them.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Funnel, Findings, GroupRow, Programme, RegistryData } from "../src/lib/registryTypes";

const BASE = "https://stats.cancerregistry.fi/joukkistilastot";
const FILES: Record<Programme, string> = { colorectal: "suolisto.html", breast: "rinta.html", cervical: "kohtu.html" };

/** Registry county name → Sotkanet region id. Åland is not in the national colorectal or breast programmes. */
export const COUNTY_IDS: Record<string, number> = {
  "Etelä-Karjala": 957, "Etelä-Pohjanmaa": 958, "Etelä-Savo": 959, "Helsingin kaupunki": 960, "Itä-Uusimaa": 961,
  Kainuu: 962, "Kanta-Häme": 963, "Keski-Pohjanmaa": 964, "Keski-Suomi": 965, "Keski-Uusimaa": 966, Kymenlaakso: 967,
  Lappi: 968, "Länsi-Uusimaa": 969, Pirkanmaa: 970, Pohjanmaa: 971, "Pohjois-Karjala": 972, "Pohjois-Pohjanmaa": 973,
  "Pohjois-Savo": 974, "Päijät-Häme": 975, Satakunta: 976, "Vantaa ja Kerava": 977, "Varsinais-Suomi": 978,
};

const GROUP_EN: Record<string, string> = {
  Kotimainen: "Finnish, Swedish or Sami", "Muu/puuttuva": "Other or missing",
  "Perusaste/tuntematon": "Basic or unknown", Keskiaste: "Upper secondary", "Korkea-aste": "Tertiary",
  Suomi: "Finland", "Muu Eurooppa": "Other Europe", Aasia: "Asia", Afrikka: "Africa", Amerikka: "Americas",
  Oseania: "Oceania", Tuntematon: "Unknown",
};
const DIMENSION: Record<string, GroupRow["dimension"]> = { Äidinkieli: "language", Koulutus: "education", Syntymäalue: "birthplace" };

type Table = { h2: string; h3: string; h4: string; rows: string[][] };

const text = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Every <table> with the h2/h3/h4 headings above it. Images (base64, megabytes) are skipped by the tag pattern. */
export function parseTables(html: string): Table[] {
  const ctx = { h2: "", h3: "", h4: "" };
  const tables: Table[] = [];
  const re = /<(h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>|<table\b[^>]*>([\s\S]*?)<\/table>/g;
  for (let m; (m = re.exec(html)); ) {
    if (m[1]) {
      const level = m[1] as "h2" | "h3" | "h4";
      ctx[level] = text(m[2]);
      if (level === "h2") ctx.h3 = ctx.h4 = "";
      if (level === "h3") ctx.h4 = "";
      continue;
    }
    const rows = [...m[3].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])),
    );
    tables.push({ ...ctx, rows });
  }
  return tables;
}

const int = (s: string): number => {
  const n = Number(s.replace(/\s/g, ""));
  if (!Number.isInteger(n) || n < 0) throw new Error(`not a count: "${s}"`);
  return n;
};

function find(tables: Table[], h2: string, h3: string, h4: string): string[][] {
  const t = tables.find((x) => x.h2 === h2 && x.h3 === h3 && x.h4 === h4);
  if (!t) throw new Error(`table not found: ${h2} / ${h3} / ${h4}`);
  return t.rows.slice(2); // header row + unit row
}

const funnel = (r: string[], at: number): Funnel => ({
  selected: int(r[at]), participated: int(r[at + 1]), positive: int(r[at + 3]), colonoscopy: int(r[at + 5]), treated: int(r[at + 7]),
});
const findings = (r: string[], at: number): Findings => ({
  positive: int(r[at]), noColonoscopy: int(r[at + 1]), noFinding: int(r[at + 3]), precursor: int(r[at + 5]),
  advancedPrecursor: int(r[at + 7]), cancer: int(r[at + 9]), other: int(r[at + 11]),
});
const add = <T extends Record<string, number>>(a: T, b: T): T =>
  Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + b[k]])) as T;

function colorectal(tables: Table[]): RegistryData["colorectal"] {
  const years = [...new Set(tables.filter((t) => t.h2 === "Hyvinvointialueet" && t.h3 === "Seulontaketju").map((t) => Number(t.h4)))].sort();
  if (years.length < 3) throw new Error(`expected at least three colorectal years, got ${years}`);
  const out: RegistryData["colorectal"] = { years, national: {}, counties: {}, intervalCancers: null };
  for (const y of years) {
    const nat = find(tables, "Koko maa", "Seulontaketju", String(y));
    const bySex = Object.fromEntries(nat.map((r) => [r[0], funnel(r, 1)]));
    const natFind = find(tables, "Koko maa", "Löydökset", String(y)).map((r) => findings(r, 1));
    out.national[y] = { all: bySex["Yhteensä"], men: bySex["Miehet"], women: bySex["Naiset"], findings: natFind.reduce(add) };

    const chain = new Map(find(tables, "Hyvinvointialueet", "Seulontaketju", String(y)).map((r) => [r[0], r]));
    const found = new Map(find(tables, "Hyvinvointialueet", "Löydökset", String(y)).map((r) => [r[0], r]));
    out.counties[y] = {};
    for (const [name, id] of Object.entries(COUNTY_IDS)) {
      const c = chain.get(name), f = found.get(name);
      if (!c || !f) throw new Error(`${y}: county "${name}" missing from the colorectal report`);
      out.counties[y][id] = { funnel: funnel(c, 1), findings: findings(f, 1) };
    }
    const extra = [...chain.keys()].filter((k) => k !== "Yhteensä" && !(k in COUNTY_IDS));
    if (extra.length) throw new Error(`${y}: unknown counties ${extra}`);
    // The county rows must add up to the national total; a mismatch means the table layout changed.
    const sum = Object.values(out.counties[y]).map((c) => c.funnel).reduce(add);
    for (const k of Object.keys(sum) as (keyof Funnel)[])
      if (sum[k] !== out.national[y].all[k]) throw new Error(`${y}: counties ${k} ${sum[k]} ≠ national ${out.national[y].all[k]}`);
    const fsum = Object.values(out.counties[y]).map((c) => c.findings).reduce(add);
    if (fsum.positive !== out.national[y].findings.positive) throw new Error(`${y}: county findings do not add up`);
  }
  const interval = tables.find((t) => t.h2 === "Erikoistilastot" && t.h3 === "Välisyövät");
  if (interval) {
    const n = (type: string) => interval.rows.slice(2).filter((r) => r[1] === type).reduce((s, r) => s + int(r[2]), 0);
    out.intervalCancers = {
      cohortYear: years[0],
      screenDetected: n("Seulontasyöpä"),
      nonParticipant: n("Osallistumaton"),
      afterNegativeTest: n("Välisyöpä, negatiivinen"),
      positiveNoColonoscopy: n("Välisyöpä, positiivinen"),
    };
  }
  return out;
}

/** National participation by mother tongue, education and birthplace, both sexes, for the latest year. */
function groups(tables: Table[], programme: Programme): RegistryData["groups"][Programme] {
  const year = Math.max(...tables.filter((t) => t.h2 === "Väestöryhmät" && /^\d{4}$/.test(t.h4)).map((t) => Number(t.h4)));
  const rows: GroupRow[] = [];
  for (const [fi, dimension] of Object.entries(DIMENSION)) {
    const t = tables.find((x) => x.h2 === "Väestöryhmät" && x.h3 === fi && x.h4 === String(year));
    if (!t) throw new Error(`${programme}: no ${fi} table for ${year}`);
    const header = t.rows[0];
    const bySex = header[1] === "Sukupuoli";
    const at = bySex ? 2 : 1;
    for (const r of t.rows.slice(2)) {
      if (bySex && r[1] !== "Yhteensä") continue;
      if (r[0] === "Yhteensä") continue;
      const group = GROUP_EN[r[0]];
      if (!group) throw new Error(`${programme}: unknown group "${r[0]}"`);
      rows.push({ dimension, group, invited: int(r[at]), participated: int(r[at + 1]) });
    }
  }
  return { year, rows };
}

async function load(dir: string | null, file: string): Promise<{ html: string; retrievedAt: string }> {
  if (dir) return { html: readFileSync(join(dir, file), "utf8"), retrievedAt: new Date().toISOString() };
  const res = await fetch(`${BASE}/${file}`, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`${res.status} ${BASE}/${file}`);
  return { html: await res.text(), retrievedAt: new Date().toISOString() };
}

async function main() {
  const i = process.argv.indexOf("--dir");
  const dir = i > 0 ? process.argv[i + 1] : null;
  const data: RegistryData = { sources: [], colorectal: null as never, groups: {} as RegistryData["groups"] };
  for (const programme of Object.keys(FILES) as Programme[]) {
    const { html, retrievedAt } = await load(dir, FILES[programme]);
    const tables = parseTables(html);
    data.sources.push({
      programme, url: `${BASE}/${FILES[programme]}`, retrievedAt,
      sha256: createHash("sha256").update(html).digest("hex"),
    });
    if (programme === "colorectal") data.colorectal = colorectal(tables);
    data.groups[programme] = groups(tables, programme);
  }
  const out = join(__dirname, "../src/data/registry.json");
  writeFileSync(out, JSON.stringify(data, null, 1) + "\n");
  const c = data.colorectal;
  console.log(`colorectal ${c.years.join(", ")}: ${Object.keys(c.counties[c.years.at(-1)!]).length} counties, totals reconcile`);
  for (const p of Object.keys(data.groups) as Programme[]) console.log(`${p}: ${data.groups[p].rows.length} group rows (${data.groups[p].year})`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
