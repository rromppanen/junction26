// Makes sure the Sotkanet data snapshot exists before dev, test and build.
// The snapshot is generated (scripts/ingest.ts), not committed: on a fresh clone,
// in CI and on Vercel this fetches it from the Sotkanet API once.
// Pass --force (npm run data -- --force) to refresh an existing snapshot.
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = join(root, "src/data/snapshot.json");

if (existsSync(snapshot) && !process.argv.includes("--force")) {
  process.exit(0);
}

console.log("Fetching the data snapshot from Sotkanet (scripts/ingest.ts)…");
// On Windows npx is npx.cmd, which Node can only start through a shell.
execFileSync("npx", ["tsx", "scripts/ingest.ts"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
