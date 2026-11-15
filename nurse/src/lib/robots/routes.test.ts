import { describe, expect, it } from "vitest";
import { curvedRoute, routeKey, type LatLng, type Trip } from "./fleet";
import { backKey, legLine } from "./routes";

const stop = (over: Partial<Trip>): Trip => ({
  robotId: "r1", sampleId: "s1", person: { id: "s1", name: "s1", age: 60, municipality: "Helsinki", area: "Kallio", lang: "fi" },
  hub: "meilahti", home: [60.18, 24.95], run: "run", compartment: 1, stops: 2, from: [60.19, 24.9], bookedAt: 0, travelMs: 1000,
  handedOver: false, backTo: [60.19, 24.9], returnMs: 1000, last: false, ...over,
});

describe("legLine", () => {
  const street: LatLng[] = [[60.19, 24.9], [60.185, 24.92], [60.18, 24.95]];

  it("uses the fetched street route for a later stop, not a curve", () => {
    const t = stop({ compartment: 2, sampleId: "s2" });
    expect(legLine(t, new Map([[routeKey(t), street]]))).toBe(street);
  });

  it("uses its own route for the drive back after a run", () => {
    const t = stop({ last: true, compartment: 2, sampleId: "s3" });
    expect(legLine(t, new Map([[backKey(t), street]]), true)).toBe(street);
  });

  it("prefers the phone's own route on the first leg, and draws a curve only while nothing has loaded", () => {
    const t = stop({ route: street });
    expect(legLine(t, new Map())).toBe(street);
    const u = stop({ sampleId: "s4" });
    expect(legLine(u, new Map())).toEqual(curvedRoute(u.from, u.home, routeKey(u)));
  });
});
