import { describe, expect, it } from "vitest";
import { ROBOT_TRAVEL_MS, stageOf, type Sample } from "@/lib/sample/model";
import { seedSamples } from "@/lib/sample/seed";
import {
  AREAS, DISPATCH_GAP_MS, awaitingIntake, FLEET, HUBS, NO_ANSWER_ID, finishedTrips, fleetAt, homeOf, hubOf, pointAlong, positionOf,
  pickupCode, readyForPickup, sharedRoute, simStep, travelMsFor, tripsOf, COMPARTMENTS, awaitingIntake as intakeOf,
} from "./fleet";

const T0 = 1_800_000_000_000;

function sample(id: string, area: string, events: [Sample["events"][number]["type"], number][]): Sample {
  return {
    id,
    person: { id, name: id, age: 60, municipality: "Helsinki", area, lang: "en" },
    events: events.map(([type, at]) => ({ type, at })),
  };
}

function viewOf(samples: Sample[], now: number, robotId: string) {
  return fleetAt(tripsOf(samples), now).find((v) => v.robot.id === robotId)!;
}

const firstAt = (hub: string) => FLEET.find((r) => r.hub === hub)!.id;

describe("demo data", () => {
  const now = Date.now();
  const seed = seedSamples(now);

  it("places every person in a known capital-region neighbourhood", () => {
    for (const s of seed) expect(AREAS[s.person.area ?? ""], s.person.area).toBeDefined();
  });

  it("is about half Finnish or Swedish speakers and half minority-language speakers", () => {
    const minority = seed.filter((s) => s.person.homeLanguage && !["Finnish", "Swedish"].includes(s.person.homeLanguage));
    expect(minority.length / seed.length).toBeGreaterThan(0.45);
    expect(minority.length / seed.length).toBeLessThan(0.55);
    expect(new Set(minority.map((s) => s.person.homeLanguage)).size).toBeGreaterThanOrEqual(10);
  });

  it("has samples waiting for a pickup across several hubs", () => {
    const ready = readyForPickup(seed, now);
    expect(ready.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ready.map((s) => hubOf(s.person))).size).toBeGreaterThanOrEqual(4);
  });
});

describe("robot fleet", () => {
  it("has every robot parked when no pickup is under way", () => {
    const now = Date.now();
    expect(fleetAt(tripsOf(seedSamples(now)), now).every((v) => v.status.kind === "idle")).toBe(true);
  });

  it("keeps the seeded completed pickups as finished trips, newest first", () => {
    const now = Date.now();
    expect(finishedTrips(tripsOf(seedSamples(now)), now).map((t) => t.sampleId)).toEqual(["p6", "p23", "p7"]);
  });

  it("follows a robot out, at the door, flagged and back", () => {
    const booked = sample("a", "Kontula", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    const r = firstAt("itakeskus");

    const out = viewOf([booked], T0 + ROBOT_TRAVEL_MS / 2, r);
    expect(out.status.kind).toBe("outbound");

    const door = viewOf([booked], T0 + ROBOT_TRAVEL_MS + 5_000, r);
    expect(door.status).toMatchObject({ kind: "atDoor", flagged: false });
    expect(positionOf(door, undefined, 0)).toEqual(homeOf(booked.person));
    expect(viewOf([booked], T0 + ROBOT_TRAVEL_MS + 61_000, r).status).toMatchObject({ kind: "atDoor", flagged: true });

    const handed = { ...booked, events: [...booked.events, { type: "pickedUp" as const, at: T0 + 30_000 }] };
    expect(viewOf([handed], T0 + 30_000 + ROBOT_TRAVEL_MS / 4, r).status.kind).toBe("returning");
    expect(viewOf([handed], T0 + 30_000 + ROBOT_TRAVEL_MS, r).status.kind).toBe("idle");
  });

  it("sends a second robot from the same hub when the first is busy, and reuses it once back", () => {
    const a = sample("a", "Kontula", [["pickupBooked", T0], ["pickedUp", T0 + ROBOT_TRAVEL_MS]]);
    const b = sample("b", "Vuosaari", [["pickupBooked", T0 + 1000]]);
    const c = sample("c", "Myllypuro", [["pickupBooked", T0 + 3 * ROBOT_TRAVEL_MS]]);
    const ids = tripsOf([a, b, c]).map((t) => t.robotId);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[2]).toBe(ids[0]);
  });

  it("serves each neighbourhood from its own hub", () => {
    const [trip] = tripsOf([sample("e", "Espoonlahti", [["pickupBooked", T0]])]);
    expect(trip.hub).toBe("matinkyla");
    expect(FLEET.find((r) => r.id === trip.robotId)?.hub).toBe("matinkyla");
  });

  it("puts homes within half a kilometre of their neighbourhood centre", () => {
    const p = sample("x", "Kontula", []).person;
    const [lat, lng] = homeOf(p);
    const [clat, clng] = AREAS.Kontula.at;
    const km = Math.hypot((lat - clat) * 111, (lng - clng) * 111 * Math.cos((clat * Math.PI) / 180));
    expect(km).toBeLessThan(0.5);
  });

  it("walks a polyline by length", () => {
    const line: [number, number][] = [HUBS.meilahti.at, [HUBS.meilahti.at[0] + 0.01, HUBS.meilahti.at[1]]];
    expect(pointAlong(line, 0)).toEqual(line[0]);
    expect(pointAlong(line, 1)).toEqual(line[1]);
    expect(pointAlong(line, 0.5)[0]).toBeCloseTo(HUBS.meilahti.at[0] + 0.005);
  });
});


describe("samples waiting for a nurse", () => {
  it("flags a sample once the robot is back, until a nurse registers it at the lab", () => {
    const s = sample("a", "Kontula", [["pickupBooked", T0], ["pickedUp", T0 + 30_000]]);
    expect(awaitingIntake([s], T0 + 30_000 + ROBOT_TRAVEL_MS - 1)).toEqual([]);
    expect(awaitingIntake([s], T0 + 30_000 + ROBOT_TRAVEL_MS)).toEqual([{ hub: "itakeskus", samples: [s] }]);
    const registered = { ...s, events: [...s.events, { type: "atLab" as const, at: T0 + 90_000 }] };
    expect(awaitingIntake([registered], T0 + 100_000)).toEqual([]);
  });

  it("groups by hub, longest waiting first, and includes the seeded sample", () => {
    const a = sample("a", "Kontula", [["pickedUp", T0 + 5_000]]);
    const b = sample("b", "Vuosaari", [["pickedUp", T0]]);
    const c = sample("c", "Malmi", [["pickedUp", T0]]);
    const groups = awaitingIntake([a, b, c], T0 + 60_000);
    expect(groups.map((g) => [g.hub, g.samples.map((s) => s.id)])).toEqual([["itakeskus", ["b", "a"]], ["malmi", ["c"]]]);

    const now = Date.now();
    expect(awaitingIntake(seedSamples(now), now).flatMap((g) => g.samples.map((s) => s.id))).toEqual(["p6"]);
  });
});

describe("simulated households", () => {
  const slot = "Now";

  it("starts a quiet map with robots already part-way, never for the phone user", () => {
    const me = sample("me", "Kallio", [["sampleTaken", T0 - 10 * 3_600_000]]);
    const older = sample("old", "Kontula", [["sampleTaken", T0 - 5 * 3_600_000]]);
    const newer = sample("new", "Malmi", [["sampleTaken", T0 - 3_600_000]]);
    const sameHub = sample("later", "Vuosaari", [["sampleTaken", T0 - 60_000]]);
    const actions = simStep([me, older, newer, sameHub], T0, "me", slot);
    expect(actions.map((a) => a.sampleId)).toEqual(["old", "new", "later"]);
    for (const a of actions) {
      if (a.event.type !== "pickupBooked") throw new Error("expected a booking");
      const elapsed = T0 - (a.event.at ?? T0);
      expect(elapsed).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(a.event.travelMs); // still on the way
    }
  });

  it("sends at most three robots per hub at the start, each with up to four compartments", () => {
    const many = ["Kontula", "Vuosaari", "Myllypuro", "Puotila", "Itäkeskus"].map((area, i) => sample(`s${i}`, area, [["sampleTaken", T0 - (i + 1) * 60_000]]));
    const booked = simStep(many, T0, "me", slot).flatMap((a) => (a.event.type === "pickupBooked" ? [a.event] : []));
    const robots = new Set(booked.map((e) => e.run));
    expect(robots.size).toBeLessThanOrEqual(3);
    expect(booked.filter((e) => e.compartment === 1)).toHaveLength(robots.size);
    expect(booked.every((e) => (e.compartment ?? 1) <= COMPARTMENTS)).toBe(true);
  });

  it("drives at about 6 km/h in real time and faster when sped up", () => {
    const p = sample("x", "Vuosaari", []).person; // about 3 km from the Itäkeskus hub
    const real = travelMsFor(p, 1);
    expect(real).toBeGreaterThan(20 * 60_000);
    expect(real).toBeLessThan(60 * 60_000);
    expect(travelMsFor(p, 60)).toBeCloseTo(real / 60, -2);
  });

  it("waits between bookings, longer at slower speeds", () => {
    const booked = sample("a", "Kontula", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    const waiting = sample("b", "Malmi", [["sampleTaken", T0 - 1000]]);
    expect(simStep([booked, waiting], T0 + 1000, "me", slot, 60)).toEqual([]);
    expect(simStep([booked, waiting], T0 + DISPATCH_GAP_MS, "me", slot, 60).map((a) => a.sampleId)).toEqual(["b"]);
    expect(simStep([booked, waiting], T0 + DISPATCH_GAP_MS, "me", slot, 1)).toEqual([]);
  });

  it("hands the sample over within a minute of the robot arriving", () => {
    const booked = sample("a", "Kontula", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    expect(simStep([booked], T0 + ROBOT_TRAVEL_MS + 14_000, "me", slot)).toEqual([]);
    expect(simStep([booked], T0 + ROBOT_TRAVEL_MS + 51_000, "me", slot)).toEqual([{ sampleId: "a", event: { type: "pickedUp" } }]);
  });

  it("leaves one household unanswered long enough to raise the flag", () => {
    const booked = sample(NO_ANSWER_ID, "Malmi", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    const flaggedAt = T0 + ROBOT_TRAVEL_MS + 61_000;
    expect(simStep([booked], flaggedAt, "me", slot)).toEqual([]);
    expect(viewOf([booked], flaggedAt, firstAt("malmi")).status).toMatchObject({ kind: "atDoor", flagged: true });
    expect(simStep([booked], T0 + ROBOT_TRAVEL_MS + 76_000, "me", slot)).toEqual([{ sampleId: NO_ANSWER_ID, event: { type: "pickedUp" } }]);
  });

  it("only books when the hub has a robot free", () => {
    const busy = FLEET.filter((r) => r.hub === "malmi").map((r, i) => sample(`busy${i}`, "Malmi", [["pickupBooked", T0 + i]]));
    const waiting = sample("w", "Pihlajamäki", [["sampleTaken", T0 - 1000]]);
    expect(simStep([...busy, waiting], T0 + DISPATCH_GAP_MS + 10, "me", slot, 60).filter((a) => a.event.type === "pickupBooked")).toEqual([]);
  });

  it("uses the booking's own travel time for the trip and the board stage", () => {
    const slow = { ...sample("a", "Kontula", []), events: [{ type: "pickupBooked" as const, at: T0, travelMs: 600_000 }] };
    expect(viewOf([slow], T0 + 300_000, firstAt("itakeskus")).status).toMatchObject({ kind: "outbound" });
    expect(stageOf(slow, T0 + 300_000)).toBe("robotEnRoute");
    expect(stageOf(slow, T0 + 600_000)).toBe("robotAtDoor");
  });
});

describe("anonymous destinations", () => {
  it("gives every sample its own pickup code with no name in it", () => {
    const seed = seedSamples(Date.now());
    const codes = seed.map((s) => pickupCode(s.id));
    expect(new Set(codes).size).toBe(seed.length);
    for (const c of codes) expect(c).toMatch(/^Pickup \d{4}$/);
  });
});

describe("a pickup booked on the phone", () => {
  const route: [number, number][] = [[24.83, 60.19], [24.832, 60.188], [24.8301, 60.1866]];
  const booked: Sample = {
    id: "me",
    person: { id: "me", name: "Aino K.", age: 62, municipality: "Helsinki", area: "Kallio", lang: "fi" },
    events: [{ type: "invited", at: T0 }, { type: "pickupBooked", at: T0 + 1000, travelMs: 15_000, route }],
  };

  it("drives the phone's route to the phone's door, not the made-up home", () => {
    const [trip] = tripsOf([booked]);
    expect(trip.route).toEqual(route.map(([lng, lat]) => [lat, lng]));
    expect(trip.home).toEqual([60.1866, 24.8301]);
    expect(trip.home).not.toEqual(homeOf(booked.person));
    const v = viewOf([booked], T0 + 1000 + 15_000 / 2, trip.robotId);
    const at = positionOf(v, undefined, 0);
    expect(at[0]).toBeGreaterThan(60.18);
    expect(at[1]).toBeLessThan(24.84);
  });

  it("ignores a malformed route", () => {
    expect(sharedRoute([[24.8, "x"], [24.9, 60.2]])).toBeUndefined();
    expect(sharedRoute([[24.8, 60.2]])).toBeUndefined();
    expect(sharedRoute("nope")).toBeUndefined();
    const bad = { ...booked, events: [booked.events[0], { type: "pickupBooked" as const, at: T0 + 1000, route: [[1, 2, 3]] as unknown as [number, number][] }] };
    expect(tripsOf([bad])[0].home).toEqual(homeOf(booked.person));
  });
});

describe("a pickup booked for a later window", () => {
  const slotAt = T0 + 3_600_000;
  const booked = (extra: Sample["events"] = []): Sample => ({
    id: "me",
    person: { id: "me", name: "Aino K.", age: 62, municipality: "Helsinki", area: "Kallio", lang: "fi" },
    events: [{ type: "invited", at: T0 - 1000 }, { type: "sampleTaken", at: T0 - 500 }, { type: "pickupBooked", at: T0, travelMs: 15_000, slotAt }, ...extra],
  });

  it("waits at the hub until the window starts", () => {
    const s = booked();
    expect(stageOf(s, T0 + 60_000)).toBe("pickupBooked");
    const [trip] = tripsOf([s]);
    expect(trip.bookedAt).toBe(slotAt);
    expect(viewOf([s], T0 + 60_000, trip.robotId).status.kind).toBe("idle");
    expect(stageOf(s, slotAt + 1000)).toBe("robotEnRoute");
    expect(viewOf([s], slotAt + 1000, trip.robotId).status.kind).toBe("outbound");
  });

  it("leaves early when the phone sends the robot now", () => {
    const s = booked([{ type: "robotDispatched", at: T0 + 120_000 }]);
    const [trip] = tripsOf([s]);
    expect(trip.bookedAt).toBe(T0 + 120_000);
    expect(stageOf(s, T0 + 125_000)).toBe("robotEnRoute");
  });
});

describe("runs: one robot, several compartments", () => {
  const leg = 20_000;
  const stopA: Sample = { ...sample("a1", "Kallio", [["sampleTaken", T0 - 5000]]) };
  stopA.events.push({ type: "pickupBooked", at: T0, travelMs: leg, run: "run1", compartment: 1 });
  const stopB: Sample = { ...sample("b1", "Kallio", [["sampleTaken", T0 - 4000]]) };
  stopB.events.push({ type: "pickupBooked", at: T0, travelMs: 8_000, run: "run1", compartment: 2, after: "a1" });

  it("visits the stops in order, each leg starting when the robot leaves the previous door", () => {
    const [a, b] = tripsOf([stopA, stopB]);
    expect([a.compartment, b.compartment]).toEqual([1, 2]);
    expect(a.robotId).toBe(b.robotId);
    expect(b.bookedAt).toBe(Infinity);
    expect(stageOf(stopB, T0 + 30_000)).toBe("pickupBooked");

    const handedA = { ...stopA, events: [...stopA.events, { type: "pickedUp" as const, at: T0 + 30_000 }] };
    const [a2, b2] = tripsOf([handedA, stopB]);
    expect(a2.leftAt).toBe(T0 + 30_000);
    expect(b2.bookedAt).toBe(T0 + 30_000);
    expect(b2.from).toEqual(a2.home);
    const v = viewOf([handedA, stopB], T0 + 34_000, a2.robotId);
    expect(v.status.kind).toBe("outbound");
    expect(v.status.kind !== "idle" && v.status.trip.sampleId).toBe("b1");
    expect(v.run.map((t) => t.sampleId)).toEqual(["a1", "b1"]);
  });

  it("drives back once, after the last stop, and only then are the samples at the hub", () => {
    const handedA = { ...stopA, events: [...stopA.events, { type: "pickedUp" as const, at: T0 + 30_000 }] };
    const sentB = { ...stopB, events: [...stopB.events, { type: "robotDispatched" as const, at: T0 + 30_000 }, { type: "pickedUp" as const, at: T0 + 50_000 }] };
    const trips = tripsOf([handedA, sentB]);
    const last = trips.find((t) => t.sampleId === "b1")!;
    expect(last.last).toBe(true);
    expect(last.backAt).toBe(T0 + 50_000 + last.returnMs);
    expect(viewOf([handedA, sentB], T0 + 51_000, last.robotId).status.kind).toBe("returning");
    expect(intakeOf([handedA, sentB], T0 + 51_000)).toEqual([]);
    expect(intakeOf([handedA, sentB], last.backAt! + 1).flatMap((g) => g.samples.map((s) => s.id)).sort()).toEqual(["a1", "b1"]);
  });
});

describe("simulation fills compartments with nearby homes", () => {
  const waiting = (id: string, area: string, at: number) => sample(id, area, [["sampleTaken", at]]);

  it("books one run for up to COMPARTMENTS waiting homes close to each other", () => {
    const near = ["k1", "k2", "k3", "k4", "k5"].map((id, i) => waiting(id, "Kallio", T0 - 100_000 + i));
    const busy = FLEET.map((r, i) => sample(`busy${i}`, "Kallio", [["pickupBooked", T0 - 1000]])).slice(0, 0);
    const acts = simStep([...near, ...busy], T0, "me", "Now", 60);
    const booked = acts.filter((a) => a.event.type === "pickupBooked");
    const runs = new Set(booked.map((a) => a.event.type === "pickupBooked" && a.event.run));
    expect(booked.length).toBeGreaterThanOrEqual(COMPARTMENTS);
    const first = booked.filter((a) => a.event.type === "pickupBooked" && a.event.run === [...runs][0]);
    expect(first.map((a) => a.event.type === "pickupBooked" && a.event.compartment)).toEqual([1, 2, 3, 4]);
    expect(first.slice(1).map((a) => a.event.type === "pickupBooked" && a.event.after)).toEqual(first.slice(0, 3).map((a) => a.sampleId));
  });

  it("adds nearby homes to the phone's run, after the phone", () => {
    const phone: Sample = {
      id: "me",
      person: { id: "me", name: "Aino K.", age: 62, municipality: "Helsinki", area: "Kallio", lang: "fi" },
      events: [{ type: "sampleTaken", at: T0 - 9000 }, { type: "pickupBooked", at: T0 - 1000, travelMs: 15_000 }],
    };
    const neighbours = ["n1", "n2"].map((id, i) => waiting(id, "Kallio", T0 - 50_000 + i));
    const acts = simStep([phone, ...neighbours], T0, "me", "Now", 60);
    const joined = acts.filter((a) => a.event.type === "pickupBooked" && a.event.run === `me@${T0 - 1000}`);
    expect(joined.map((a) => a.sampleId).sort()).toEqual(["n1", "n2"]);
    expect(joined.find((a) => a.event.type === "pickupBooked" && a.event.compartment === 2)?.event).toMatchObject({ after: "me" });
  });

  it("sends the next stop once the robot leaves the previous door", () => {
    const a: Sample = sample("a1", "Kallio", [["sampleTaken", T0 - 5000]]);
    a.events.push({ type: "pickupBooked", at: T0, travelMs: 10_000, run: "r", compartment: 1 }, { type: "pickedUp", at: T0 + 20_000 });
    const b: Sample = sample("b1", "Kallio", [["sampleTaken", T0 - 4000]]);
    b.events.push({ type: "pickupBooked", at: T0, travelMs: 5_000, run: "r", compartment: 2, after: "a1" });
    const acts = simStep([a, b], T0 + 21_000, "me", "Now", 60);
    expect(acts).toContainEqual({ sampleId: "b1", event: { type: "robotDispatched", at: T0 + 20_000 } });
  });
});
