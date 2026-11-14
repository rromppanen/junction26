import { metresBetween, walkingRoute, type LngLat } from "@/lib/kit/route";

/** The demo robot only ever walks a short way; anything longer is not a pickup. */
const MAX_METRES = 5_000;
const TIMEOUT_MS = 8_000;

function point(v: string | null): LngLat | null {
  const parts = v?.split(",").map(Number);
  if (!parts || parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  const [lng, lat] = parts;
  return Math.abs(lng) <= 180 && Math.abs(lat) <= 90 ? [lng, lat] : null;
}

/**
 * GET /api/walk?from=lng,lat&to=lng,lat → { route: [[lng, lat], …] }
 * A walking route for the demo robot, asked from public OpenStreetMap routers on the server so the
 * browser needs no cross-origin access and one router being down does not break the demo.
 * 400 for bad input, 502 when no router answers (the app then draws a straight line).
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const from = point(q.get("from"));
  const to = point(q.get("to"));
  if (!from || !to || metresBetween(from, to) > MAX_METRES) {
    return Response.json({ error: "from and to must be lng,lat pairs within 5 km of each other" }, { status: 400 });
  }
  try {
    const route = await walkingRoute(from, to, AbortSignal.timeout(TIMEOUT_MS));
    return Response.json({ route }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.warn("walk route", (e as Error).message);
    return Response.json({ error: "no router answered" }, { status: 502 });
  }
}
