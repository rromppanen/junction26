import { describe, expect, it } from "vitest";
import { pickupWindows } from "./slots";

const at = (h: number, m = 0) => new Date(2026, 10, 14, h, m).getTime();

describe("pickupWindows", () => {
  it("starts today with the hour now under way", () => {
    expect(pickupWindows(at(18, 28), 0).map((x) => x.start)).toEqual([18, 19]);
  });
  it("drops an hour once it has ended", () => {
    expect(pickupWindows(at(19, 0), 0).map((x) => x.start)).toEqual([19]);
  });
  it("has none left late in the evening", () => {
    expect(pickupWindows(at(20), 0)).toEqual([]);
  });
  it("offers the whole of tomorrow, 8 to 20", () => {
    const w = pickupWindows(at(21), 1);
    expect(w).toHaveLength(12);
    expect(w[0].start).toBe(8);
    expect(w[11].end).toBe(20);
    expect(new Date(w[0].at).getDate()).toBe(15);
  });
});
