import { afterEach, describe, expect, it, vi } from "vitest";
import { OSRM_TIMEOUT_MS, walkingRoute, type LngLat } from "./route";

/** Google-style polyline encoding at 6 digits, the shape Valhalla returns. */
function encode6(points: LngLat[]): string {
  let out = "";
  let prev = [0, 0];
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    out += String.fromCharCode(n + 63);
  };
  for (const [lng, lat] of points) {
    const cur = [Math.round(lat * 1e6), Math.round(lng * 1e6)];
    enc(cur[0] - prev[0]);
    enc(cur[1] - prev[1]);
    prev = cur;
  }
  return out;
}

afterEach(() => vi.unstubAllGlobals());

describe("walkingRoute", () => {
  it("falls back to Valhalla when OSRM never answers, within the overall time", async () => {
    const line: LngLat[] = [[24.906, 60.19], [24.93, 60.19], [24.9645, 60.1907]];
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      if (String(url).includes("routed-foot")) {
        // A silent OSRM: only the abort ends it.
        return new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
      }
      return Promise.resolve(new Response(JSON.stringify({ trip: { legs: [{ shape: encode6(line) }] } })));
    });
    const started = Date.now();
    const route = await walkingRoute(line[0], line[2], AbortSignal.timeout(10_000));
    expect(Date.now() - started).toBeLessThan(OSRM_TIMEOUT_MS + 2_000);
    expect(route.map(([lng, lat]) => [Number(lng.toFixed(4)), Number(lat.toFixed(4))])).toEqual(line);
  }, 10_000);
});
