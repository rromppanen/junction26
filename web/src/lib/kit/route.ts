export type LngLat = [number, number];

/** Metres between two [lng, lat] points (equirectangular: exact enough for a few kilometres). */
export function metresBetween(a: LngLat, b: LngLat): number {
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const x = (b[0] - a[0]) * rad * Math.cos(((a[1] + b[1]) / 2) * rad);
  const y = (b[1] - a[1]) * rad;
  return Math.sqrt(x * x + y * y) * R;
}

/**
 * Splits a route at a share of its length (0..1, clamped): the point there, plus the part already
 * travelled and the part still ahead, both including that point.
 */
export function splitRoute(route: LngLat[], progress: number): { at: LngLat; done: LngLat[]; ahead: LngLat[] } {
  if (route.length === 0) throw new Error("splitRoute needs at least one point");
  const p = Math.min(1, Math.max(0, progress));
  const legs = route.slice(1).map((pt, i) => metresBetween(route[i], pt));
  const total = legs.reduce((a, b) => a + b, 0);
  let left = p * total;
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i] && legs[i] > 0) {
      const f = left / legs[i];
      const [a, b] = [route[i], route[i + 1]];
      const at: LngLat = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      return { at, done: [...route.slice(0, i + 1), at], ahead: [at, ...route.slice(i + 1)] };
    }
    left -= legs[i];
  }
  const end = route[route.length - 1];
  return { at: end, done: route, ahead: [end] };
}

/**
 * Where the demo robot sets off from: a point roughly 800 m north-east of the person, standing in
 * for the nearest sample hub (the demo has no real hubs).
 */
export function hubNear(home: LngLat): LngLat {
  return [home[0] + 0.008, home[1] + 0.005];
}

/** The public OSRM walking router run by FOSSGIS on OpenStreetMap data. */
const FOOT_ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

/** A walking route between two points along real streets and paths. Throws if the router fails or answers oddly. */
export async function fetchWalkingRoute(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<LngLat[]> {
  const pts = [from, to].map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(";");
  const res = await fetch(`${FOOT_ROUTER}/${pts}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error(`router answered ${res.status}`);
  const body = (await res.json()) as { routes?: { geometry?: { coordinates?: unknown } }[] };
  const coords = body.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2 || !coords.every((c) => Array.isArray(c) && c.length >= 2 && c.every(Number.isFinite))) {
    throw new Error("router returned no usable route");
  }
  return (coords as number[][]).map((c) => [c[0], c[1]]);
}
