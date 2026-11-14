import { describe, expect, it } from "vitest";
import {
  ROBOT_TRAVEL_MS,
  STAGES_FOR_BOARD,
  activeBooking,
  addEvent,
  bookingCount,
  flagsOf,
  programmeLabel,
  robotEta,
  robotProgress,
  stageOf,
  type EventType,
  type Programme,
  type Sample,
} from "./model";
import { seedSamples } from "./seed";

const DAY = 86_400_000;
const T0 = 1_000_000_000_000;
const person = { id: "p", name: "Test T.", age: 60, municipality: "Lahti", lang: "fi" as const };
type Ev = [EventType, number, number?]; // [type, at, startsAt?]
const mk = (programme: Programme, ...events: Ev[]): Sample => ({
  id: "p",
  person,
  programme,
  events: events.map(([type, at, startsAt]) => ({ type, at, ...(startsAt !== undefined ? { startsAt } : {}) })),
});
const bowel = (...e: Ev[]) => mk("bowel", ...e);
const cervical = (...e: Ev[]) => mk("cervical", ...e);

describe("stageOf", () => {
  it("follows the latest milestone", () => {
    const now = T0 + 100 * DAY;
    expect(stageOf(bowel(["invited", T0]), now)).toBe("invited");
    expect(stageOf(bowel(["invited", T0], ["letterOpened", T0 + 1]), now)).toBe("invited");
    expect(stageOf(bowel(["invited", T0], ["sampleTaken", T0 + 2]), now)).toBe("invited");
    expect(stageOf(bowel(["sampleTaken", T0], ["pickedUp", T0 + 1]), now)).toBe("pickedUp");
    expect(stageOf(bowel(["pickedUp", T0], ["atLab", T0 + 1]), now)).toBe("atLab");
    expect(stageOf(bowel(["atLab", T0], ["resultNegative", T0 + 1]), now)).toBe("negative");
    expect(stageOf(bowel(["atLab", T0], ["resultPositive", T0 + 1]), now)).toBe("positive");
    expect(stageOf(bowel(["resultPositive", T0], ["colonoscopyBooked", T0 + 1]), now)).toBe("colonoscopyBooked");
    expect(stageOf(bowel(["colonoscopyBooked", T0], ["colonoscopyDone", T0 + 1]), now)).toBe("done");
  });
  it("ignores reminders and nurse calls", () => {
    expect(stageOf(bowel(["invited", T0], ["reminderSent", T0 + 1], ["nurseCalled", T0 + 2]), T0 + 5)).toBe("invited");
  });
  it("is booked for a bowel pickup in the future", () => {
    const s = bowel(["invited", T0], ["pickupBooked", T0 + 1, T0 + 3_600_000]);
    expect(stageOf(s, T0 + 10)).toBe("booked");
  });
  it("is time-based from the booked start", () => {
    const start = T0 + 10_000;
    const s = bowel(["sampleTaken", T0], ["pickupBooked", T0 + 1, start]);
    expect(stageOf(s, start - 1)).toBe("booked");
    expect(stageOf(s, start + 5_000)).toBe("robotEnRoute");
    expect(stageOf(s, start + 21_000)).toBe("robotAtDoor");
    expect(ROBOT_TRAVEL_MS).toBe(20_000);
  });
  it("is pickedUp once collected, even after the robot arrived", () => {
    const s = bowel(["pickupBooked", T0, T0], ["pickedUp", T0 + 30_000]);
    expect(stageOf(s, T0 + 40_000)).toBe("pickedUp");
  });
  it("lets a result win regardless of bookings", () => {
    const s = bowel(["pickupBooked", T0, T0], ["resultPositive", T0 + 50_000], ["pickupBooked", T0 + 60_000, T0 + DAY]);
    expect(stageOf(s, T0 + 70_000)).toBe("positive");
  });
  it("books a cervical visit, then pickedUp once visited", () => {
    const booked: Ev[] = [["invited", T0], ["clinicBooked", T0 + 1, T0 + 2 * DAY]];
    expect(stageOf(cervical(...booked), T0 + 3 * DAY)).toBe("booked");
    expect(stageOf(cervical(...booked, ["clinicVisited", T0 + 2 * DAY]), T0 + 3 * DAY)).toBe("pickedUp");
  });
});

describe("bookings", () => {
  it("rebooking: the latest booking wins", () => {
    const s = bowel(["pickupBooked", T0, T0 + DAY], ["pickupBooked", T0 + 5, T0 + 2 * DAY]);
    expect(activeBooking(s)?.startsAt).toBe(T0 + 2 * DAY);
    expect(bookingCount(s)).toBe(2);
  });
  it("a cancellation returns the stage to invited, and a later booking restores it", () => {
    const cancelled: Ev[] = [["invited", T0], ["pickupBooked", T0 + 1, T0 + DAY], ["bookingCancelled", T0 + 2]];
    expect(activeBooking(bowel(...cancelled))).toBeNull();
    expect(stageOf(bowel(...cancelled), T0 + 10)).toBe("invited");
    expect(activeBooking(bowel(...cancelled, ["clinicBooked", T0 + 3, T0 + DAY]))?.type).toBe("clinicBooked");
  });
});

describe("robotProgress and robotEta", () => {
  const start = T0 + 1000;
  const s = bowel(["pickupBooked", T0, start]);
  it("is about 0.25 five seconds after the start and 1 at the door", () => {
    expect(robotProgress(s, start + 5_000)).toBeCloseTo(0.25, 5);
    expect(robotProgress(s, start + 21_000)).toBe(1);
  });
  it("is null before departure, with no booking, or after pickup", () => {
    expect(robotProgress(s, start - 1)).toBeNull();
    expect(robotProgress(bowel(["sampleTaken", T0]), T0 + 5_000)).toBeNull();
    expect(robotProgress(bowel(["pickupBooked", T0, T0], ["pickedUp", T0 + 25_000]), T0 + 30_000)).toBeNull();
    expect(robotProgress(cervical(["clinicBooked", T0, T0]), T0 + 5_000)).toBeNull();
  });
  it("eta counts down to arrival before departure and en route", () => {
    expect(robotEta(s, start - 10_000)).toBe(30_000);
    expect(robotEta(s, start + 5_000)).toBe(15_000);
    expect(robotEta(s, start + 25_000)).toBe(0);
    expect(robotEta(bowel(["invited", T0]), T0)).toBeNull();
    expect(robotEta(cervical(["clinicBooked", T0, T0 + DAY]), T0)).toBeNull();
  });
});

describe("flagsOf", () => {
  it("flags noBooking at 14 days but not at 13", () => {
    const s = bowel(["invited", T0]);
    expect(flagsOf(s, T0 + 13 * DAY).map((f) => f.kind)).not.toContain("noBooking");
    const f = flagsOf(s, T0 + 14 * DAY).find((x) => x.kind === "noBooking");
    expect(f?.days).toBe(14);
    expect(f?.label).toBe("No booking 14 days after invitation");
  });
  it("does not flag noBooking once any booking exists", () => {
    const s = bowel(["invited", T0], ["pickupBooked", T0 + DAY, T0 + 2 * DAY], ["bookingCancelled", T0 + 3 * DAY]);
    expect(flagsOf(s, T0 + 30 * DAY).map((f) => f.kind)).not.toContain("noBooking");
  });
  it("flags positiveNoBooking at 7 days, labelled by programme, and clears on booking", () => {
    const s = bowel(["resultPositive", T0]);
    expect(flagsOf(s, T0 + 6 * DAY).map((f) => f.kind)).not.toContain("positiveNoBooking");
    expect(flagsOf(s, T0 + 7 * DAY).find((f) => f.kind === "positiveNoBooking")?.label).toContain("colonoscopy");
    const c = cervical(["resultPositive", T0]);
    expect(flagsOf(c, T0 + 7 * DAY).find((f) => f.kind === "positiveNoBooking")?.label).toContain("follow-up visit");
    const b = bowel(["resultPositive", T0], ["colonoscopyBooked", T0 + DAY]);
    expect(flagsOf(b, T0 + 9 * DAY).map((f) => f.kind)).not.toContain("positiveNoBooking");
  });
  it("flags robotWaiting after 61 s at the door", () => {
    const s = bowel(["pickupBooked", T0, T0]);
    const door = T0 + ROBOT_TRAVEL_MS;
    expect(flagsOf(s, door + 30_000).map((f) => f.kind)).not.toContain("robotWaiting");
    expect(flagsOf(s, door + 61_000).map((f) => f.kind)).toContain("robotWaiting");
  });
  it("flags rebooked at 3 bookings and after a cancellation", () => {
    const two = bowel(["pickupBooked", T0, T0 + DAY], ["pickupBooked", T0 + 1, T0 + DAY]);
    expect(flagsOf(two, T0 + 10).map((f) => f.kind)).not.toContain("rebooked");
    const three = bowel(["pickupBooked", T0, T0 + DAY], ["pickupBooked", T0 + 1, T0 + DAY], ["pickupBooked", T0 + 2, T0 + DAY]);
    expect(flagsOf(three, T0 + 10).find((f) => f.kind === "rebooked")?.label).toBe("Rebooked 2 times");
    const cancelled = bowel(["pickupBooked", T0, T0 + DAY], ["bookingCancelled", T0 + 1]);
    expect(flagsOf(cancelled, T0 + 10).find((f) => f.kind === "rebooked")?.label).toBe("Booking cancelled");
  });
});

describe("board columns", () => {
  it("has the seven columns in order", () => {
    expect(STAGES_FOR_BOARD.map((c) => c.label)).toEqual([
      "Invited", "Booked", "Sample", "At lab", "Result", "Follow-up", "Done",
    ]);
  });
});

describe("programmeLabel", () => {
  it("names both screenings", () => {
    expect(programmeLabel("bowel")).toBe("Bowel screening (home test)");
    expect(programmeLabel("cervical")).toBe("Cervical screening (clinic visit)");
  });
});

describe("addEvent", () => {
  it("is immutable and ignores unknown ids", () => {
    const list = [bowel(["invited", T0])];
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
  const stage = (id: string) => stageOf(seed.find((s) => s.id === id)!, now);
  it("has me and me-cx at invited, one per programme", () => {
    expect(stage("me")).toBe("invited");
    expect(stage("me-cx")).toBe("invited");
    expect(seed.find((s) => s.id === "me")?.programme).toBe("bowel");
    expect(seed.find((s) => s.id === "me-cx")?.programme).toBe("cervical");
    expect(seed.find((s) => s.id === "me")?.person.lang).toBe("fi");
  });
  it("has the flag kinds, booked cases, done samples and an interpreter", () => {
    const kinds = seed.flatMap((s) => flagsOf(s, now).map((f) => f.kind));
    expect(kinds).toContain("noBooking");
    expect(kinds).toContain("positiveNoBooking");
    expect(kinds).toContain("rebooked");
    expect(seed.some((s) => s.programme === "cervical" && stageOf(s, now) === "booked")).toBe(true);
    expect(seed.some((s) => s.programme === "bowel" && stageOf(s, now) === "booked")).toBe(true);
    expect(seed.some((s) => stageOf(s, now) === "negative")).toBe(true);
    expect(seed.some((s) => stageOf(s, now) === "done")).toBe(true);
    expect(seed.some((s) => s.person.interpreter === "Arabic")).toBe(true);
    expect(seed.length).toBeGreaterThanOrEqual(12);
  });
  it("puts future bookings ahead of now with a label", () => {
    for (const id of ["p5", "p6"]) {
      const b = activeBooking(seed.find((s) => s.id === id)!);
      expect(b?.startsAt).toBeGreaterThan(now);
      expect(b?.slot).toBeTruthy();
    }
  });
});
