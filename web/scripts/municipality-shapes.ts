// Builds src/data/municipality-shapes.json from Statistics Finland's open geoservice.
// Run: npm run shapes:municipalities
//
// Source: municipality boundaries 2026, generalised for 1:4 500 000 (CC BY 4.0, Statistics Finland).
// Same treatment as scripts/shapes.ts: EPSG:3067 metres -> whole km, y flipped, small islands dropped,
// one SVG path per municipality. Used by the area map on a gap's dashboard, zoomed to the municipalities in a file.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const URL =
  "https://geo.stat.fi/geoserver/tilastointialueet/wfs?service=WFS&version=2.0.0&request=GetFeature" +
  "&typeNames=tilastointialueet:kunta4500k_2026&outputFormat=application/json&srsName=EPSG:3067";
const MIN_AREA_KM2 = 4;

type Ring = number[][];
type Feature = {
  properties: { nimi: string; namn: string };
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
};

const area = (r: Ring) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
};
const centroid = (r: Ring): [number, number] => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f;
  }
  return [cx / (3 * a), cy / (3 * a)];
};

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${res.status} ${URL}`);
  const { features } = (await res.json()) as { features: Feature[] };
  const polys = features.map((f) => {
    const list = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    return { name: f.properties.nimi, sv: f.properties.namn, polys: list.map((p) => p.map((ring) => ring.map(([x, y]) => [x / 1000, y / 1000]))) };
  });
  const xs = polys.flatMap((c) => c.polys.flatMap((p) => p[0].map((pt) => pt[0])));
  const ys = polys.flatMap((c) => c.polys.flatMap((p) => p[0].map((pt) => pt[1])));
  const minX = Math.min(...xs), maxY = Math.max(...ys);
  const tx = ([x, y]: number[]) => [Math.round(x - minX), Math.round(maxY - y)];

  const municipalities = polys.map(({ name, sv, polys }) => {
    const kept = polys.filter((p) => area(p[0]) >= MIN_AREA_KM2);
    const outer = (kept.length ? kept : polys).map((p) => p[0]);
    const largest = outer.reduce((a, b) => (area(b) > area(a) ? b : a));
    const d = outer
      .map((ring) => {
        const pts = ring.map(tx).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
        return "M" + pts.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z";
      })
      .join("");
    const [lx, ly] = tx(centroid(largest));
    const bxs = outer.flatMap((r) => r.map((p) => tx(p)[0]));
    const bys = outer.flatMap((r) => r.map((p) => tx(p)[1]));
    return { name, ...(sv !== name ? { sv } : {}), d, label: [lx, ly], bbox: [Math.min(...bxs), Math.min(...bys), Math.max(...bxs), Math.max(...bys)] };
  });

  const out = { source: "Statistics Finland, municipalities 2026, 1:4 500 000 (CC BY 4.0)", municipalities };
  const file = join(__dirname, "..", "src", "data", "municipality-shapes.json");
  writeFileSync(file, JSON.stringify(out));
  console.log(`wrote ${municipalities.length} municipalities to ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
