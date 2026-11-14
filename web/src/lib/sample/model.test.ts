import { describe, expect, it } from "vitest";
import {
  ROBOT_TRAVEL_MS,
  STAGES_FOR_BOARD,
  addEvent,
  flagsOf,
  robotProgress,
  stageOf,
  type EventType,
  type Sample,
} from "./model";
import { seedSamples } from "./seed";

const DAY = 86_400_000;
const T0 = 1_000_000_000_000;
const person = { id: "p", name: "Test T.", age: 60, municipality: "Helsinki", lang: "fi" as const };
const mk = (...events: [EventType, number, string?][]): Sample => ({
  id: "p",
  person,
  events: events.map(([type, at, slot]) => ({ type, at, ...(slot ? { slot } : {}) })),
});

describe("stageOf", () => {
  it("follows the latest milestone", () => {
    const now = T0 + 100 * DAY;
    expect(stageOf(mk(["invited", T0]), now)).toBe("invited");
    expect(stageOf(mk(["invited", T0], ["kitOpened", T0 + 1]), now)).toBe("invited");
    expect(stageOf(mk(["invited", T0], ["sampleTaken", T0 + 2]), now)).toBe("sampleTaken");
    expect(stageOf(mk(["sampleTaken", T0], ["pickedUp", T0 + 1]), now)).toBe("pickedUp");
    expect(stageOf(mk(["pickedUp", T0], ["atLab", T0 + 1]), now)).toBe("atLab");
    expect(stageOf(mk(["atLab", T0], ["resultNegative", T0 + 1]), now)).toBe("negative");
    expect(stageOf(mk(["atLab", T0], ["resultPositive", T0 + 1]), now)).toBe("positive");
    expect(stageOf(mk(["resultPositive", T0], ["colonoscopyBooked", T0 + 1]), now)).toBe("colonoscopyBooked");
    expect(stageOf(mk(["colonoscopyBooked", T0], ["colonoscopyDone", T0 + 1]), now)).toBe("done");
  });
  it("ignores reminders and nurse calls", () => {
    expect(stageOf(mk(["invited", T0], ["reminderSent", T0 + 1], ["nurseCalled", T0 + 2]), T0 + 5)).toBe("invited");
  });
  it("waits at pickupBooked until the robot is dispatched", () => {
    const s = mk(["sampleTaken", T0], ["pickupBooked", T0 + 10, "Today 15:00"]);
    expect(stageOf(s, T0 + DAY)).toBe("pickupBooked");
  });
  it("is time-based once the robot is dispatched", () => {
    const s = mk(["pickupBooked", T0], ["robotDispatched", T0 + 10]);
    expect(stageOf(s, T0 + 10 + 5_000)).toBe("robotEnRoute");
    expect(stageOf(s, T0 + 10 + ROBOT_TRAVEL_MS)).toBe("robotAtDoor");
  });
  it("is at the door straight away when the wait is skipped", () => {
    const s = mk(["robotDispatched", T0], ["robotArrived", T0 + 5_000]);
    expect(stageOf(s, T0 + 6_000)).toBe("robotAtDoor");
  });
  it("is pickedUp once collected, even after the robot arrived", () => {
    const s = mk(["robotDispatched", T0], ["robotArrived", T0 + 1], ["pickedUp", T0 + 30_000]);
    expect(stageOf(s, T0 + 40_000)).toBe("pickedUp");
  });
});

describe("robotProgress", () => {
  const s = mk(["pickupBooked", T0], ["robotDispatched", T0]);
  it("is a quarter of the way at a quarter of the travel time and 1 at the door", () => {
    expect(robotProgress(s, T0 + ROBOT_TRAVEL_MS / 4)).toBeCloseTo(0.25, 5);
    expect(robotProgress(s, T0 + ROBOT_TRAVEL_MS + 1_000)).toBe(1);
  });
  it("is 1 when the wait is skipped", () => {
    expect(robotProgress(mk(["robotDispatched", T0], ["robotArrived", T0 + 1]), T0 + 2)).toBe(1);
  });
  it("is null before the robot leaves or after pickup", () => {
    expect(robotProgress(mk(["pickupBooked", T0]), T0 + 5_000)).toBeNull();
    expect(robotProgress(mk(["robotDispatched", T0], ["pickedUp", T0 + 25_000]), T0 + 30_000)).toBeNull();
  });
});

describe("flagsOf", () => {
  it("flags noSample at 14 days but not at 13", () => {
    const s = mk(["invited", T0]);
    expect(flagsOf(s, T0 + 13 * DAY).map((f) => f.kind)).not.toContain("noSample");
    const f = flagsOf(s, T0 + 14 * DAY).find((x) => x.kind === "noSample");
    expect(f?.days).toBe(14);
  });
  it("does not flag noSample once sampled", () => {
    const s = mk(["invited", T0], ["sampleTaken", T0 + DAY]);
    expect(flagsOf(s, T0 + 30 * DAY).map((f) => f.kind)).not.toContain("noSample");
  });
  it("flags positiveNoBooking at 7 days and clears on booking", () => {
    const s = mk(["resultPositive", T0]);
    expect(flagsOf(s, T0 + 6 * DAY).map((f) => f.kind)).not.toContain("positiveNoBooking");
    expect(flagsOf(s, T0 + 7 * DAY).map((f) => f.kind)).toContain("positiveNoBooking");
    const b = mk(["resultPositive", T0], ["colonoscopyBooked", T0 + DAY, "Mon"]);
    expect(flagsOf(b, T0 + 9 * DAY).map((f) => f.kind)).not.toContain("positiveNoBooking");
  });
  it("flags robotWaiting after 61 s at the door", () => {
    const s = mk(["robotDispatched", T0]);
    const door = T0 + ROBOT_TRAVEL_MS;
    expect(flagsOf(s, door + 30_000).map((f) => f.kind)).not.toContain("robotWaiting");
    expect(flagsOf(s, door + 61_000).map((f) => f.kind)).toContain("robotWaiting");
  });
});

describe("board columns", () => {
  it("has the seven columns in order", () => {
    expect(STAGES_FOR_BOARD.map((c) => c.label)).toEqual([
      "Invited", "Sample taken", "Pickup", "At lab", "Result", "Colonoscopy", "Done",
    ]);
  });
});

describe("addEvent", () => {
  it("is immutable and ignores unknown ids", () => {
    const list = [mk(["invited", T0])];
    const frozen = JSON.stringify(list);
    const next = addEvent(list, "p", { type: "sampleTaken", at: T0 + 1 });
    expect(JSON.stringify(list)).toBe(frozen);
    expect(next[0].events).toHaveLength(2);
    expect(next).not.toBe(list);
    expect(addEvent(list, "nope", { type: "sampleTaken", at: T0 + 1 })).toEqual(list);
  });
});

describe("seedSamples", () => {
  const now = T0 + 200 * DAY;
  const seed = seedSamples(now);
  it("has me at invited", () => {
    const me = seed.find((s) => s.id === "me");
    expect(me && stageOf(me, now)).toBe("invited");
    expect(me?.person.lang).toBe("fi");
  });
  it("has each flag kind except robotWaiting, a done sample and an interpreter", () => {
    const kinds = seed.flatMap((s) => flagsOf(s, now).map((f) => f.kind));
    expect(kinds).toContain("noSample");
    expect(kinds).toContain("positiveNoBooking");
    expect(seed.some((s) => stageOf(s, now) === "done")).toBe(true);
    expect(seed.some((s) => s.person.interpreter === "Arabic")).toBe(true);
    expect(seed.length).toBeGreaterThanOrEqual(9);
  });
});

describe("demo robot speed", () => {
  it("is shown as the ratio of a real trip to the demo trip", async () => {
    const { REAL_TRIP_MS, ROBOT_SPEEDUP } = await import("./model");
    expect(ROBOT_SPEEDUP).toBe(Math.round(REAL_TRIP_MS / ROBOT_TRAVEL_MS));
    expect(ROBOT_SPEEDUP).toBe(40);
  });
});
