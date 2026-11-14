import { describe, expect, it } from "vitest";
import { ROBOT_TRAVEL_MS, type Sample } from "@/lib/sample/model";
import { seedSamples } from "@/lib/sample/seed";
import {
  AREAS, DISPATCH_GAP_MS, awaitingIntake, FLEET, HUBS, NO_ANSWER_ID, finishedTrips, fleetAt, homeOf, hubOf, pointAlong, positionOf,
  readyForPickup, simStep, tripsOf,
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

  it("is mostly people whose mother tongue is neither Finnish nor Swedish", () => {
    const minority = seed.filter((s) => s.person.homeLanguage && !["Finnish", "Swedish"].includes(s.person.homeLanguage));
    expect(minority.length / seed.length).toBeGreaterThan(0.6);
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

describe("simulated households", () => {
  const slot = "Now";

  it("sends one robot from every hub when the map is quiet, longest wait first, never for the phone user", () => {
    const me = sample("me", "Kallio", [["sampleTaken", T0 - 10 * 3_600_000]]);
    const older = sample("old", "Kontula", [["sampleTaken", T0 - 5 * 3_600_000]]);
    const newer = sample("new", "Malmi", [["sampleTaken", T0 - 3_600_000]]);
    const sameHub = sample("later", "Vuosaari", [["sampleTaken", T0 - 60_000]]);
    expect(simStep([me, older, newer, sameHub], T0, "me", slot).map((a) => a.sampleId)).toEqual(["old", "new"]);
  });

  it("waits between bookings", () => {
    const booked = sample("a", "Kontula", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    const waiting = sample("b", "Malmi", [["sampleTaken", T0 - 1000]]);
    expect(simStep([booked, waiting], T0 + 1000, "me", slot)).toEqual([]);
    expect(simStep([booked, waiting], T0 + DISPATCH_GAP_MS, "me", slot).map((a) => a.sampleId)).toEqual(["b"]);
  });

  it("hands the sample over a few seconds after the robot arrives", () => {
    const booked = sample("a", "Kontula", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);
    expect(simStep([booked], T0 + ROBOT_TRAVEL_MS, "me", slot)).toEqual([]);
    expect(simStep([booked], T0 + ROBOT_TRAVEL_MS + 11_000, "me", slot)).toEqual([{ sampleId: "a", event: { type: "pickedUp" } }]);
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
    expect(simStep([...busy, waiting], T0 + DISPATCH_GAP_MS + 10, "me", slot).filter((a) => a.event.type === "pickupBooked")).toEqual([]);
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
