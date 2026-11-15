export type LngLat = [number, number];

/** At most this many points of a robot route go into the shared demo log. */
export const SHARED_ROUTE_POINTS = 80;

/**
 * The route as shared with the nurse map: at most SHARED_ROUTE_POINTS points, keeping both ends,
 * rounded to 4 decimals (about 10 m), so the shared log does not hold the phone's exact position.
 */
export function shareableRoute(route: LngLat[]): LngLat[] {
  const round = ([lng, lat]: LngLat): LngLat => [Math.round(lng * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4];
  if (route.length <= SHARED_ROUTE_POINTS) return route.map(round);
  const step = (route.length - 1) / (SHARED_ROUTE_POINTS - 1);
  return Array.from({ length: SHARED_ROUTE_POINTS }, (_, i) => round(route[Math.round(i * step)]));
}

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

/**
 * The nurse map's robot hubs as [lng, lat]. Keep in step with HUBS in nurse/src/lib/robots/fleet.ts:
 * the nurse map recognises a phone route that starts at one and takes that hub's robot.
 */
export const ROBOT_HUBS: readonly LngLat[] = [
  [24.906, 60.19], // Meilahti lab
  [25.085, 60.2115], // Itäkeskus
  [24.993, 60.259], // Malmi
  [25.04, 60.2935], // Tikkurila
  [24.85, 60.26], // Myyrmäki
  [24.74, 60.161], // Matinkylä
];
/** Farther than this from every hub (outside the capital region), the robot comes from hubNear instead. */
export const HUB_REACH_M = 8_000;

/**
 * Where the phone's robot sets off: the nearest hub on the nurse map, so the board shows it leave that
 * hub; outside the capital region, a stand-in hub nearby (hubNear).
 */
export function robotStart(pin: LngLat): LngLat {
  let best: LngLat | null = null;
  let bestM = HUB_REACH_M;
  for (const hub of ROBOT_HUBS) {
    const m = metresBetween(pin, hub);
    if (m <= bestM) {
      best = hub;
      bestM = m;
    }
  }
  return best ?? hubNear(pin);
}

/** Decodes a Google-style encoded polyline with 6-digit precision (Valhalla's format) into [lng, lat] points. */
export function decodePolyline6(encoded: string): LngLat[] {
  const out: LngLat[] = [];
  let i = 0, lat = 0, lng = 0;
  const next = () => {
    let shift = 0, result = 0, byte: number;
    do {
      if (i >= encoded.length) throw new Error("truncated polyline");
      byte = encoded.charCodeAt(i++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lng += next();
    out.push([lng / 1e6, lat / 1e6]);
  }
  return out;
}

/** Two free routers on OpenStreetMap data, both run by FOSSGIS; the second is used when the first is down. */
const OSRM_FOOT = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const VALHALLA = "https://valhalla1.openstreetmap.de/route";

function usable(coords: unknown): coords is LngLat[] {
  return Array.isArray(coords) && coords.length >= 2 && coords.every((c) => Array.isArray(c) && c.length >= 2 && c.every(Number.isFinite));
}

async function osrm(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<LngLat[]> {
  const pts = [from, to].map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(";");
  const res = await fetch(`${OSRM_FOOT}/${pts}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error(`OSRM answered ${res.status}`);
  const coords = ((await res.json()) as { routes?: { geometry?: { coordinates?: unknown } }[] }).routes?.[0]?.geometry?.coordinates;
  if (!usable(coords)) throw new Error("OSRM returned no usable route");
  return coords.map((c) => [c[0], c[1]]);
}

async function valhalla(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<LngLat[]> {
  const res = await fetch(VALHALLA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locations: [from, to].map(([lon, lat]) => ({ lat, lon })), costing: "pedestrian", directions_type: "none" }),
    signal,
  });
  if (!res.ok) throw new Error(`Valhalla answered ${res.status}`);
  const shape = ((await res.json()) as { trip?: { legs?: { shape?: unknown }[] } }).trip?.legs?.[0]?.shape;
  if (typeof shape !== "string") throw new Error("Valhalla returned no shape");
  const coords = decodePolyline6(shape);
  if (!usable(coords)) throw new Error("Valhalla returned no usable route");
  return coords;
}

/** How long the first router may take, so a slow or silent OSRM still leaves Valhalla time to answer. */
export const OSRM_TIMEOUT_MS = 4_000;

/**
 * A walking route between two points along real streets and paths: the OSRM foot router first,
 * Valhalla if that fails. Throws only when both fail. Runs on the server (see /api/walk).
 * OSRM gets at most OSRM_TIMEOUT_MS of its own; `signal` bounds the whole call.
 */
export async function walkingRoute(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<LngLat[]> {
  const first = AbortSignal.timeout(OSRM_TIMEOUT_MS);
  try {
    return await osrm(from, to, signal ? AbortSignal.any([signal, first]) : first);
  } catch (first) {
    try {
      return await valhalla(from, to, signal);
    } catch (second) {
      throw new Error(`no router answered: ${(first as Error).message}; ${(second as Error).message}`);
    }
  }
}
