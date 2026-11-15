import { describe, expect, it } from "vitest";
import { decodePolyline6, hubNear, metresBetween, shareableRoute, SHARED_ROUTE_POINTS, splitRoute, type LngLat } from "./route";
import { MAX_EVENT_CHARS } from "@/lib/sample/sync-core";
import { ROBOT_ROUTE, ROUTE_METRES } from "@/data/robotRoute";

const line: LngLat[] = [[24.8, 60.17], [24.81, 60.17], [24.82, 60.17]];

describe("splitRoute", () => {
  it("starts at the first point and ends at the last", () => {
    expect(splitRoute(line, 0).at).toEqual(line[0]);
    expect(splitRoute(line, 1).at).toEqual(line[2]);
  });
  it("is at the middle point halfway along two equal legs", () => {
    const { at, done, ahead } = splitRoute(line, 0.5);
    expect(at[0]).toBeCloseTo(24.81, 6);
    expect(done[0]).toEqual(line[0]);
    expect(ahead[ahead.length - 1]).toEqual(line[2]);
  });
  it("clamps progress outside 0..1", () => {
    expect(splitRoute(line, -1).at).toEqual(line[0]);
    expect(splitRoute(line, 2).at).toEqual(line[2]);
  });
});

describe("the demo route", () => {
  it("is about as long as the router said", () => {
    const m = ROBOT_ROUTE.slice(1).reduce((sum, p, i) => sum + metresBetween(ROBOT_ROUTE[i], p), 0);
    expect(Math.abs(m - ROUTE_METRES) / ROUTE_METRES).toBeLessThan(0.02);
  });
});

describe("hubNear", () => {
  it("puts the hub under a kilometre and a half away", () => {
    const home: LngLat = [24.94, 60.17];
    const m = metresBetween(home, hubNear(home));
    expect(m).toBeGreaterThan(500);
    expect(m).toBeLessThan(1500);
  });
});

describe("decodePolyline6", () => {
  it("decodes points at six-digit precision", () => {
    // Encoded with precision 6: (60.1749, 24.9464) then (60.1699, 24.9384).
    const enc = (n: number) => { let v = n < 0 ? ~(n << 1) : n << 1; let s = ""; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
    const a = [60174900, 24946400], b = [60169900, 24938400];
    const s = enc(a[0]) + enc(a[1]) + enc(b[0] - a[0]) + enc(b[1] - a[1]);
    const pts = decodePolyline6(s);
    expect(pts).toHaveLength(2);
    expect(pts[0][0]).toBeCloseTo(24.9464, 6);
    expect(pts[1][1]).toBeCloseTo(60.1699, 6);
  });
  it("rejects a truncated string", () => {
    expect(() => decodePolyline6("_")).toThrow();
  });
});

describe("shareableRoute", () => {
  const long: LngLat[] = Array.from({ length: 400 }, (_, i) => [24.9512345 + i * 1e-5, 60.1712345 + i * 1e-5]);

  it("keeps both ends, caps the points and rounds to about 10 m", () => {
    const out = shareableRoute(long);
    expect(out).toHaveLength(SHARED_ROUTE_POINTS);
    expect(out[0]).toEqual([24.9512, 60.1712]);
    expect(out.at(-1)).toEqual([Math.round(long[399][0] * 1e4) / 1e4, Math.round(long[399][1] * 1e4) / 1e4]);
  });

  it("fits a pickup event into the shared log", () => {
    const event = { type: "pickupBooked", at: Date.now(), slot: "As soon as possible", travelMs: 15_000, route: shareableRoute(long) };
    expect(JSON.stringify(event).length).toBeLessThan(MAX_EVENT_CHARS);
  });
});
