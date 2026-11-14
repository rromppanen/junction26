import { describe, expect, it } from "vitest";
import { ROBOT_TRAVEL_MS, type Sample } from "@/lib/sample/model";
import { seedSamples } from "@/lib/sample/seed";
import { DEPOTS, FLEET, finishedTrips, fleetAt, homeOf, readyForPickup, routePoint, routeTo, tripsOf } from "./fleet";

const T0 = 1_800_000_000_000;

function sample(id: string, municipality: string, events: [Sample["events"][number]["type"], number][]): Sample {
  return {
    id,
    person: { id, name: id, age: 60, municipality, lang: "fi" },
    events: events.map(([type, at]) => ({ type, at })),
  };
}

function statusOf(samples: Sample[], now: number, robotId: string) {
  return fleetAt(tripsOf(samples), now).find((v) => v.robot.id === robotId)!;
}

describe("robot fleet", () => {
  it("has every robot parked at its depot when no pickup is under way", () => {
    const now = Date.now();
    const views = fleetAt(tripsOf(seedSamples(now)), now);
    expect(views).toHaveLength(FLEET.length);
    expect(views.every((v) => v.status.kind === "idle")).toBe(true);
  });

  it("keeps the seeded completed pickups as finished trips, newest first", () => {
    const now = Date.now();
    const trips = tripsOf(seedSamples(now));
    expect(finishedTrips(trips, now).map((t) => t.sampleId)).toEqual(["p6", "p7"]);
  });

  it("follows a robot out, at the door, flagged and back", () => {
    const booked = sample("a", "Lahti", [["sampleTaken", T0 - 1000], ["pickupBooked", T0]]);

    const out = statusOf([booked], T0 + ROBOT_TRAVEL_MS / 2, "r1");
    expect(out.status.kind).toBe("outbound");
    if (out.status.kind === "outbound") expect(out.status.progress).toBeCloseTo(0.5);

    const door = statusOf([booked], T0 + ROBOT_TRAVEL_MS + 5_000, "r1");
    expect(door.status).toMatchObject({ kind: "atDoor", flagged: false });
    expect(door.at).toEqual(homeOf(booked.person));

    const late = statusOf([booked], T0 + ROBOT_TRAVEL_MS + 61_000, "r1");
    expect(late.status).toMatchObject({ kind: "atDoor", flagged: true });

    const handed = { ...booked, events: [...booked.events, { type: "pickedUp" as const, at: T0 + 30_000 }] };
    const back = statusOf([handed], T0 + 30_000 + ROBOT_TRAVEL_MS / 4, "r1");
    expect(back.status.kind).toBe("returning");

    const home = statusOf([handed], T0 + 30_000 + ROBOT_TRAVEL_MS, "r1");
    expect(home.status.kind).toBe("idle");
  });

  it("sends a different robot when the first is busy", () => {
    const a = sample("a", "Lahti", [["pickupBooked", T0]]);
    const b = sample("b", "Nastola", [["pickupBooked", T0 + 1000]]);
    const ids = tripsOf([a, b]).map((t) => t.robotId);
    expect(ids).toEqual(["r1", "r2"]);
  });

  it("reuses a robot once it is back at the depot", () => {
    const a = sample("a", "Lahti", [["pickupBooked", T0], ["pickedUp", T0 + ROBOT_TRAVEL_MS]]);
    const b = sample("b", "Lahti", [["pickupBooked", T0 + 3 * ROBOT_TRAVEL_MS]]);
    expect(tripsOf([a, b]).map((t) => t.robotId)).toEqual(["r1", "r1"]);
  });

  it("serves Helsinki from the Helsinki hub", () => {
    const h = sample("h", "Helsinki", [["pickupBooked", T0]]);
    const [trip] = tripsOf([h]);
    expect(trip.depot).toBe("helsinki");
    expect(FLEET.find((r) => r.id === trip.robotId)?.depot).toBe("helsinki");
  });

  it("draws routes from the depot to the home", () => {
    const home = { x: 500, y: 100 };
    const r = routeTo(DEPOTS.lahti.at, home, "x");
    expect(routePoint(r, 0)).toEqual(DEPOTS.lahti.at);
    expect(routePoint(r, 1)).toEqual(home);
  });

  it("lists samples taken with no robot booked", () => {
    const now = Date.now();
    expect(readyForPickup(seedSamples(now), now).map((s) => s.id)).toEqual(["p5"]);
  });
});
