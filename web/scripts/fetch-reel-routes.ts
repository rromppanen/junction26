/*
  Fetches a street route for every robot in the demo reel's fleet overview and stores them in
  src/data/reelFleetRoutes.json, so the reel draws real paths without asking a router while it plays.
  Run once after changing FLEET_TRIPS in src/data/reelRoute.ts:
    npx tsx scripts/fetch-reel-routes.ts
  Uses the app's own walkingRoute(): the FOSSGIS OSRM foot router, or Valhalla when OSRM is down.
  Map data © OpenStreetMap contributors.
*/
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FLEET_HUBS, FLEET_TRIPS } from "../src/data/reelRoute";
import { metresBetween, walkingRoute, type LngLat } from "../src/lib/kit/route";

const OUT = join(__dirname, "../src/data/reelFleetRoutes.json");
/** Points closer than this to the simplified line are dropped; invisible at the overview's zoom. */
const TOLERANCE_M = 12;

/** Distance from p to the segment a–b, in metres. */
function offLine(p: LngLat, a: LngLat, b: LngLat): number {
  const ab = metresBetween(a, b);
  if (ab === 0) return metresBetween(p, a);
  const ap = metresBetween(a, p);
  const bp = metresBetween(b, p);
  const s = (ab + ap + bp) / 2;
  return (2 * Math.sqrt(Math.max(0, s * (s - ab) * (s - ap) * (s - bp)))) / ab;
}

/** Douglas–Peucker simplification. */
function simplify(pts: LngLat[], tol: number): LngLat[] {
  if (pts.length < 3) return pts;
  let worst = 0;
  let at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = offLine(pts[i], pts[0], pts[pts.length - 1]);
    if (d > worst) [worst, at] = [d, i];
  }
  if (worst <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
}

const round = (c: LngLat): LngLat => [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5];

async function main() {
  const routes: LngLat[][] = [];
  for (const [i, trip] of FLEET_TRIPS.entries()) {
    const from = FLEET_HUBS[trip.hub];
    const raw = await walkingRoute(from, trip.to, AbortSignal.timeout(30_000));
    // Start at the hub's marker and end at the destination, even where the router snapped to a nearby path.
    const route = simplify([from, ...raw, trip.to], TOLERANCE_M).map(round);
    routes.push(route);
    const km = route.slice(1).reduce((sum, p, k) => sum + metresBetween(route[k], p), 0) / 1000;
    console.log(`${i + 1}/${FLEET_TRIPS.length} ${trip.hub}: ${km.toFixed(1)} km, ${route.length} points`);
    await new Promise((r) => setTimeout(r, 1200)); // be gentle with the free routers
  }

  writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), source: "OSRM foot / Valhalla pedestrian on OpenStreetMap data", routes }) + "\n");
  console.log(`wrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
