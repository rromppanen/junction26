import { ROBOT_TRAVEL_MS, ROBOT_WAIT_FLAG_MS, stageOf, type Person, type Sample } from "@/lib/sample/model";

/**
 * The robot fleet, derived from the sample events.
 * The samples hold no robots: a "pickupBooked" event dispatches one, which drives out for
 * ROBOT_TRAVEL_MS, waits at the door until "pickedUp", then drives back for the same time.
 * Replaying every booking in order gives each trip a robot, so the result is the same in every tab.
 */

export type Point = { x: number; y: number };

/** Map coordinates: a 800 × 750 view of Päijät-Häme, plus an inset for Helsinki. */
export const MAP = { width: 800, height: 750 };
export const INSET = { x: 16, y: 560, width: 220, height: 170, label: "Inset, not to scale" };

export type DepotId = "lahti" | "helsinki";
export const DEPOTS: Record<DepotId, { id: DepotId; name: string; at: Point }> = {
  lahti: { id: "lahti", name: "Lahti lab", at: { x: 352, y: 420 } },
  helsinki: { id: "helsinki", name: "Helsinki hub", at: { x: 66, y: 680 } },
};

/**
 * Municipality centres. Päijät-Häme points are projected from real coordinates
 * (x = (lon − 25.2) / 1.1 × 800, y = (61.25 − lat) / 0.5 × 750); Helsinki sits in the inset.
 */
export const PLACES: Record<string, { at: Point; depot: DepotId }> = {
  Lahti: { at: { x: 334, y: 405 }, depot: "lahti" },
  Hollola: { at: { x: 233, y: 300 }, depot: "lahti" },
  Nastola: { at: { x: 531, y: 450 }, depot: "lahti" },
  Orimattila: { at: { x: 386, y: 675 }, depot: "lahti" },
  Heinola: { at: { x: 611, y: 75 }, depot: "lahti" },
  Asikkala: { at: { x: 255, y: 120 }, depot: "lahti" },
  Helsinki: { at: { x: 160, y: 625 }, depot: "helsinki" },
};

export type Robot = { id: string; name: string; depot: DepotId };
export const FLEET: Robot[] = [
  { id: "r1", name: "Robot 1", depot: "lahti" },
  { id: "r2", name: "Robot 2", depot: "lahti" },
  { id: "r3", name: "Robot 3", depot: "lahti" },
  { id: "r4", name: "Robot 4", depot: "lahti" },
  { id: "r5", name: "Robot 5", depot: "helsinki" },
  { id: "r6", name: "Robot 6", depot: "helsinki" },
];

export type Route = { from: Point; ctrl: Point; to: Point };

export type Trip = {
  robotId: string;
  sampleId: string;
  person: Person;
  depot: DepotId;
  home: Point;
  route: Route;
  slot?: string;
  bookedAt: number;
  /** When the robot left the door: the sample was handed over, or the booking was replaced. */
  leftAt?: number;
  handedOver: boolean;
};

export type RobotStatus =
  | { kind: "idle" }
  | { kind: "outbound"; trip: Trip; progress: number; etaMs: number }
  | { kind: "atDoor"; trip: Trip; waitedMs: number; flagged: boolean }
  | { kind: "returning"; trip: Trip; progress: number; etaMs: number };

export type RobotView = { robot: Robot; status: RobotStatus; at: Point };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function placeOf(municipality: string): { at: Point; depot: DepotId } {
  return PLACES[municipality] ?? { at: DEPOTS.lahti.at, depot: "lahti" };
}

/** A stable spot near the municipality centre, so homes in one town do not overlap. */
export function homeOf(person: Person): Point {
  const { at, depot } = placeOf(person.municipality);
  const h = hash(person.id);
  const angle = ((h % 360) * Math.PI) / 180;
  const r = (depot === "helsinki" ? 10 : 22) + ((h >>> 9) % 18);
  return { x: Math.round(at.x + Math.cos(angle) * r), y: Math.round(at.y + Math.sin(angle) * r) };
}

/** A gentle curve from the depot to the home; the bend side comes from the sample id. */
export function routeTo(from: Point, to: Point, key: string): Route {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const side = hash(key) % 2 === 0 ? 1 : -1;
  return { from, to, ctrl: { x: mx - dy * 0.22 * side, y: my + dx * 0.22 * side } };
}

/** The point at t (0..1) along the route. */
export function routePoint(r: Route, t: number): Point {
  const u = Math.min(1, Math.max(0, t));
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return { x: a * r.from.x + b * r.ctrl.x + c * r.to.x, y: a * r.from.y + b * r.ctrl.y + c * r.to.y };
}

export function routePath(r: Route): string {
  return `M${r.from.x} ${r.from.y} Q${r.ctrl.x} ${r.ctrl.y} ${r.to.x} ${r.to.y}`;
}

/** Every pickup booking as a trip, oldest first, each given a robot from the person's depot. */
export function tripsOf(samples: Sample[]): Trip[] {
  type Draft = Omit<Trip, "robotId">;
  const drafts: Draft[] = [];
  for (const s of samples) {
    const events = [...s.events].sort((a, b) => a.at - b.at);
    events.forEach((e, i) => {
      if (e.type !== "pickupBooked") return;
      const rest = events.slice(i + 1);
      const end = rest.find((x) => x.type === "pickedUp" || x.type === "pickupBooked");
      const { depot } = placeOf(s.person.municipality);
      const home = homeOf(s.person);
      drafts.push({
        sampleId: s.id,
        person: s.person,
        depot,
        home,
        route: routeTo(DEPOTS[depot].at, home, s.id),
        ...(e.slot ? { slot: e.slot } : {}),
        bookedAt: e.at,
        ...(end ? { leftAt: Math.max(end.at, e.at + ROBOT_TRAVEL_MS) } : {}),
        handedOver: end?.type === "pickedUp",
      });
    });
  }
  drafts.sort((a, b) => a.bookedAt - b.bookedAt || a.sampleId.localeCompare(b.sampleId));

  const busyUntil = new Map<string, number>(FLEET.map((r) => [r.id, -Infinity]));
  return drafts.map((d) => {
    const pool = FLEET.filter((r) => r.depot === d.depot);
    const robot =
      pool.find((r) => (busyUntil.get(r.id) ?? -Infinity) <= d.bookedAt) ??
      pool.reduce((best, r) => ((busyUntil.get(r.id) ?? 0) < (busyUntil.get(best.id) ?? 0) ? r : best));
    busyUntil.set(robot.id, d.leftAt === undefined ? Infinity : d.leftAt + ROBOT_TRAVEL_MS);
    return { ...d, robotId: robot.id };
  });
}

function statusFor(trip: Trip, now: number): RobotStatus | null {
  const arrive = trip.bookedAt + ROBOT_TRAVEL_MS;
  if (now < trip.bookedAt) return null;
  if (now < arrive) {
    return { kind: "outbound", trip, progress: (now - trip.bookedAt) / ROBOT_TRAVEL_MS, etaMs: arrive - now };
  }
  if (trip.leftAt === undefined || now < trip.leftAt) {
    const waitedMs = now - arrive;
    return { kind: "atDoor", trip, waitedMs, flagged: waitedMs > ROBOT_WAIT_FLAG_MS };
  }
  const back = trip.leftAt + ROBOT_TRAVEL_MS;
  if (now < back) {
    return { kind: "returning", trip, progress: (now - trip.leftAt) / ROBOT_TRAVEL_MS, etaMs: back - now };
  }
  return null;
}

/** Where every robot is now and what it is doing. Parked robots line up beside their depot. */
export function fleetAt(trips: Trip[], now: number): RobotView[] {
  const parked: Record<DepotId, number> = { lahti: 0, helsinki: 0 };
  return FLEET.map((robot) => {
    let status: RobotStatus = { kind: "idle" };
    for (const t of trips) {
      if (t.robotId !== robot.id) continue;
      const s = statusFor(t, now);
      if (s) status = s;
    }
    let at: Point;
    switch (status.kind) {
      case "outbound":
        at = routePoint(status.trip.route, status.progress);
        break;
      case "atDoor":
        at = status.trip.home;
        break;
      case "returning":
        at = routePoint(status.trip.route, 1 - status.progress);
        break;
      default: {
        const d = DEPOTS[robot.depot].at;
        const n = parked[robot.depot]++;
        at = { x: d.x + 24 + n * 18, y: d.y };
      }
    }
    return { robot, status, at };
  });
}

/** Trips whose robot is back at the depot, newest first. */
export function finishedTrips(trips: Trip[], now: number): Trip[] {
  return trips
    .filter((t) => t.leftAt !== undefined && now >= t.leftAt + ROBOT_TRAVEL_MS)
    .sort((a, b) => (b.leftAt ?? 0) - (a.leftAt ?? 0));
}

/** Samples taken at home with no robot booked yet. */
export function readyForPickup(samples: Sample[], now: number): Sample[] {
  return samples.filter((s) => stageOf(s, now) === "sampleTaken");
}
