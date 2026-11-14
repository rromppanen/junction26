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
