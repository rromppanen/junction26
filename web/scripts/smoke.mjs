// Smoke test and warm-up: loads every page once and fails if any page errors.
// Usage: npm run smoke -- [base url]   (default http://localhost:3000)
// Run it against the deployed site shortly before the demo.
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const pages = ["/", "/demo", "/kit", "/staff"];

const failures = [];
for (const path of pages) {
  const t = Date.now();
  try {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(90_000) });
    await res.text();
    if (!res.ok) failures.push(`${path}: ${res.status}`);
    console.log(`${res.ok ? "ok  " : "FAIL"} ${String(Date.now() - t).padStart(6)} ms  ${path}`);
  } catch (e) {
    failures.push(`${path}: ${e instanceof Error ? e.message : e}`);
    console.log(`FAIL ${path}: ${e instanceof Error ? e.message : e}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} page(s) failed:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`\nAll ${pages.length} pages ok.`);
