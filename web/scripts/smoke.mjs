// Smoke test and warm-up: loads every page once and fails if any page errors.
// Usage: npm run smoke -- [base url]   (default http://localhost:3000)
// Run it against the deployed site shortly before the demo, so the county briefs are cached and fast.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(readFileSync(join(root, "src/data/snapshot.json"), "utf8"));
const counties = snapshot.regions.filter((r) => r.kind === "county").map((r) => r.id);

const pages = [
  { path: "/", expect: "Gap Radar" },
  { path: "/simulator", expect: "Screening simulator" },
  ...counties.flatMap((id) => [
    { path: `/county/${id}`, expect: "Cancer care brief" },
    { path: `/county/${id}/memo`, expect: "Hallitusmuistio" },
    { path: `/county/${id}/measure`, expect: null },
  ]),
];

const failures = [];
const started = Date.now();
async function check({ path, expect }) {
  const t = Date.now();
  try {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(90_000) });
    const body = await res.text();
    const ok = res.ok && (expect === null || body.includes(expect));
    if (!ok) failures.push(`${path}: ${res.status}${res.ok ? ` (missing "${expect}")` : ""}`);
    console.log(`${ok ? "ok  " : "FAIL"} ${String(Date.now() - t).padStart(6)} ms  ${path}`);
  } catch (e) {
    failures.push(`${path}: ${e instanceof Error ? e.message : e}`);
    console.log(`FAIL ${path}: ${e instanceof Error ? e.message : e}`);
  }
}

// Four at a time: enough to be quick, few enough not to trip the AI analyst's rate limits.
for (let i = 0; i < pages.length; i += 4) await Promise.all(pages.slice(i, i + 4).map(check));

console.log(`\n${pages.length - failures.length}/${pages.length} pages ok in ${Math.round((Date.now() - started) / 1000)} s against ${base}`);
if (failures.length) {
  console.log(failures.map((f) => `  ${f}`).join("\n"));
  process.exit(1);
}
