import { describe, expect, it } from "vitest";
import { metresBetween, splitRoute, type LngLat } from "./route";
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
