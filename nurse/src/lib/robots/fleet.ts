import { ROBOT_TRAVEL_MS, ROBOT_WAIT_FLAG_MS, flagsOf, stageOf, type Person, type Sample } from "@/lib/sample/model";

/**
 * The robot fleet, derived from the sample events.
 * The samples hold no robots: a "pickupBooked" event dispatches one, which drives out for
 * the booking's travel time, waits at the door until "pickedUp", then drives back for the same time.
 * Replaying every booking in order gives each trip a robot, so every tab shows the same result.
 */

/** [latitude, longitude] */
export type LatLng = [number, number];

export type HubId = "meilahti" | "itakeskus" | "malmi" | "tikkurila" | "myyrmaki" | "matinkyla";

/** Robot hubs around the capital region. Robots start and end each trip at their hub. */
export const HUBS: Record<HubId, { id: HubId; name: string; at: LatLng }> = {
  meilahti: { id: "meilahti", name: "Meilahti lab", at: [60.1900, 24.9060] },
  itakeskus: { id: "itakeskus", name: "Itäkeskus hub", at: [60.2115, 25.0850] },
  malmi: { id: "malmi", name: "Malmi hub", at: [60.2590, 24.9930] },
  tikkurila: { id: "tikkurila", name: "Tikkurila hub", at: [60.2935, 25.0400] },
  myyrmaki: { id: "myyrmaki", name: "Myyrmäki hub", at: [60.2600, 24.8500] },
  matinkyla: { id: "matinkyla", name: "Matinkylä hub", at: [60.1610, 24.7400] },
};

/** Neighbourhood centres and the hub that serves each. */
export const AREAS: Record<string, { at: LatLng; hub: HubId }> = {
  Kallio: { at: [60.1841, 24.9497], hub: "meilahti" },
  "Sörnäinen": { at: [60.1872, 24.9620], hub: "meilahti" },
  Kontula: { at: [60.2360, 25.0830], hub: "itakeskus" },
  "Mellunmäki": { at: [60.2380, 25.1080], hub: "itakeskus" },
  Vuosaari: { at: [60.2096, 25.1410], hub: "itakeskus" },
  Myllypuro: { at: [60.2238, 25.0770], hub: "itakeskus" },
  "Itäkeskus": { at: [60.2107, 25.0820], hub: "itakeskus" },
  "Länsimäki": { at: [60.2518, 25.1020], hub: "itakeskus" },
  Malmi: { at: [60.2509, 25.0110], hub: "malmi" },
  "Pihlajamäki": { at: [60.2393, 25.0140], hub: "malmi" },
  Hakunila: { at: [60.2778, 25.1080], hub: "tikkurila" },
  "Koivukylä": { at: [60.3217, 25.0600], hub: "tikkurila" },
  Tikkurila: { at: [60.2925, 25.0440], hub: "tikkurila" },
  "Myyrmäki": { at: [60.2614, 24.8540], hub: "myyrmaki" },
  "Kannelmäki": { at: [60.2398, 24.8780], hub: "myyrmaki" },
  "Leppävaara": { at: [60.2190, 24.8130], hub: "myyrmaki" },
  "Matinkylä": { at: [60.1596, 24.7380], hub: "matinkyla" },
  Espoonlahti: { at: [60.1480, 24.6580], hub: "matinkyla" },
  "Espoon keskus": { at: [60.2050, 24.6560], hub: "matinkyla" },
  Pasila: { at: [60.1990, 24.9330], hub: "meilahti" },
  Munkkiniemi: { at: [60.1990, 24.8760], hub: "meilahti" },
  Lauttasaari: { at: [60.1600, 24.8800], hub: "meilahti" },
  "Pitäjänmäki": { at: [60.2230, 24.8600], hub: "meilahti" },
  Puotila: { at: [60.2150, 25.0950], hub: "itakeskus" },
  Herttoniemi: { at: [60.1950, 25.0300], hub: "itakeskus" },
  Roihuvuori: { at: [60.1980, 25.0530], hub: "itakeskus" },
  Laajasalo: { at: [60.1720, 25.0450], hub: "itakeskus" },
  "Meri-Rastila": { at: [60.2040, 25.1200], hub: "itakeskus" },
  "Jakomäki": { at: [60.2610, 25.0760], hub: "malmi" },
  Tapanila: { at: [60.2640, 25.0300], hub: "malmi" },
  "Oulunkylä": { at: [60.2290, 24.9640], hub: "malmi" },
  Puistola: { at: [60.2740, 25.0400], hub: "malmi" },
  Korso: { at: [60.3510, 25.0770], hub: "tikkurila" },
  Martinlaakso: { at: [60.2780, 24.8500], hub: "myyrmaki" },
  Malminkartano: { at: [60.2480, 24.8610], hub: "myyrmaki" },
  "Kivistö": { at: [60.3150, 24.8440], hub: "myyrmaki" },
  Tapiola: { at: [60.1760, 24.8050], hub: "matinkyla" },
  Olari: { at: [60.1770, 24.7370], hub: "matinkyla" },
  Kivenlahti: { at: [60.1530, 24.6360], hub: "matinkyla" },
};

/** The hub and the centres of the neighbourhoods it serves, for zooming the map to one hub. */
export function hubArea(hub: HubId): LatLng[] {
  return [HUBS[hub].at, ...Object.values(AREAS).filter((a) => a.hub === hub).map((a) => a.at)];
}

/** Where the map opens: the capital region. */
export const MAP_CENTER: LatLng = [60.225, 24.92];

export type Robot = { id: string; name: string; hub: HubId };
const PER_HUB: [HubId, number][] = [["meilahti", 4], ["itakeskus", 6], ["malmi", 5], ["tikkurila", 5], ["myyrmaki", 5], ["matinkyla", 5]];
export const FLEET: Robot[] = PER_HUB.flatMap(([hub, n]) => Array.from({ length: n }, () => hub)).map((hub, i) => ({
  id: `r${i + 1}`,
  name: `Robot ${i + 1}`,
  hub,
}));

export type Trip = {
  robotId: string;
  sampleId: string;
  person: Person;
  hub: HubId;
  home: LatLng;
  slot?: string;
  bookedAt: number;
  /** One-way driving time, in ms. */
  travelMs: number;
  /** When the robot left the door: the sample was handed over, or the booking was replaced. */
  leftAt?: number;
  handedOver: boolean;
};

export type RobotStatus =
  | { kind: "idle" }
  | { kind: "outbound"; trip: Trip; progress: number; etaMs: number }
  | { kind: "atDoor"; trip: Trip; waitedMs: number; flagged: boolean }
  | { kind: "returning"; trip: Trip; progress: number; etaMs: number };

export type RobotView = { robot: Robot; status: RobotStatus };

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * An anonymous code for a pickup, e.g. "Pickup 4821". The robots page and map show this
 * instead of the person's name: a destination should not say who lives there.
 */
export function pickupCode(sampleId: string): string {
  return `Pickup ${1000 + (Math.imul(hash(sampleId), 2654435761) >>> 0) % 9000}`;
}

/** The hub that serves this person; people with an unknown area go to the central lab. */
export function hubOf(person: Person): HubId {
  return (person.area && AREAS[person.area]?.hub) || "meilahti";
}

/** A stable spot a few hundred metres from the neighbourhood centre, so homes do not overlap. */
export function homeOf(person: Person): LatLng {
  const centre = (person.area && AREAS[person.area]?.at) || HUBS.meilahti.at;
  const h = hash(person.id);
  const angle = ((h % 360) * Math.PI) / 180;
  const r = 0.0015 + ((h >>> 9) % 100) / 100 * 0.0025; // degrees of latitude, about 170–450 m
  return [centre[0] + Math.sin(angle) * r, centre[1] + (Math.cos(angle) * r) / Math.cos((centre[0] * Math.PI) / 180)];
}

/** A gentle curve from the hub to the home, used until (or instead of) a street route. */
export function curvedRoute(from: LatLng, to: LatLng, key: string): LatLng[] {
  const side = hash(key) % 2 === 0 ? 1 : -1;
  const ctrl: LatLng = [
    (from[0] + to[0]) / 2 - (to[1] - from[1]) * 0.12 * side,
    (from[1] + to[1]) / 2 + (to[0] - from[0]) * 0.35 * side,
  ];
  const pts: LatLng[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    pts.push([a * from[0] + b * ctrl[0] + c * to[0], a * from[1] + b * ctrl[1] + c * to[1]]);
  }
  return pts;
}

function dist(a: LatLng, b: LatLng): number {
  const k = Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(a[0] - b[0], (a[1] - b[1]) * k);
}

/** The point at fraction t (0..1) of the line's length. */
export function pointAlong(line: LatLng[], t: number): LatLng {
  if (line.length === 0) return HUBS.meilahti.at;
  if (line.length === 1) return line[0];
  const u = Math.min(1, Math.max(0, t));
  const seg = line.slice(1).map((p, i) => dist(line[i], p));
  const total = seg.reduce((s, x) => s + x, 0);
  let left = total * u;
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const f = seg[i] === 0 ? 0 : Math.min(1, left / seg[i]);
      const [a, b] = [line[i], line[i + 1]];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    left -= seg[i];
  }
  return line[line.length - 1];
}

/** The line cut at fraction t (0..1) of its length: the part behind and the part still ahead. */
export function splitLine(line: LatLng[], t: number): { done: LatLng[]; ahead: LatLng[] } {
  if (line.length < 2) return { done: line, ahead: line };
  const u = Math.min(1, Math.max(0, t));
  const seg = line.slice(1).map((p, i) => dist(line[i], p));
  let left = seg.reduce((s, x) => s + x, 0) * u;
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const f = seg[i] === 0 ? 0 : Math.min(1, left / seg[i]);
      const [a, b] = [line[i], line[i + 1]];
      const at: LatLng = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      return { done: [...line.slice(0, i + 1), at], ahead: [at, ...line.slice(i + 1)] };
    }
    left -= seg[i];
  }
  return { done: line, ahead: [line[line.length - 1]] };
}

export function routeKey(t: Pick<Trip, "hub" | "sampleId">): string {
  return `${t.hub}:${t.sampleId}`;
}

/** Every pickup booking as a trip, oldest first, each given a robot from the person's hub. */
export function tripsOf(samples: Sample[]): Trip[] {
  type Draft = Omit<Trip, "robotId">;
  const drafts: Draft[] = [];
  for (const s of samples) {
    const events = [...s.events].sort((a, b) => a.at - b.at);
    events.forEach((e, i) => {
      if (e.type !== "pickupBooked") return;
      const travelMs = e.travelMs ?? ROBOT_TRAVEL_MS;
      const end = events.slice(i + 1).find((x) => x.type === "pickedUp" || x.type === "pickupBooked");
      drafts.push({
        sampleId: s.id,
        person: s.person,
        hub: hubOf(s.person),
        home: homeOf(s.person),
        ...(e.slot ? { slot: e.slot } : {}),
        bookedAt: e.at,
        travelMs,
        ...(end ? { leftAt: Math.max(end.at, e.at + travelMs) } : {}),
        handedOver: end?.type === "pickedUp",
      });
    });
  }
  drafts.sort((a, b) => a.bookedAt - b.bookedAt || a.sampleId.localeCompare(b.sampleId));

  const busyUntil = new Map<string, number>(FLEET.map((r) => [r.id, -Infinity]));
  return drafts.map((d) => {
    const pool = FLEET.filter((r) => r.hub === d.hub);
    const robot =
      pool.find((r) => (busyUntil.get(r.id) ?? -Infinity) <= d.bookedAt) ??
      pool.reduce((best, r) => ((busyUntil.get(r.id) ?? 0) < (busyUntil.get(best.id) ?? 0) ? r : best));
    busyUntil.set(robot.id, d.leftAt === undefined ? Infinity : d.leftAt + d.travelMs);
    return { ...d, robotId: robot.id };
  });
}

function statusFor(trip: Trip, now: number): RobotStatus | null {
  const arrive = trip.bookedAt + trip.travelMs;
  if (now < trip.bookedAt) return null;
  if (now < arrive) {
    return { kind: "outbound", trip, progress: (now - trip.bookedAt) / trip.travelMs, etaMs: arrive - now };
  }
  if (trip.leftAt === undefined || now < trip.leftAt) {
    const waitedMs = now - arrive;
    return { kind: "atDoor", trip, waitedMs, flagged: waitedMs > ROBOT_WAIT_FLAG_MS };
  }
  const back = trip.leftAt + trip.travelMs;
  if (now < back) {
    return { kind: "returning", trip, progress: (now - trip.leftAt) / trip.travelMs, etaMs: back - now };
  }
  return null;
}

/** What every robot is doing now. */
export function fleetAt(trips: Trip[], now: number): RobotView[] {
  return FLEET.map((robot) => {
    let status: RobotStatus = { kind: "idle" };
    for (const t of trips) {
      if (t.robotId !== robot.id) continue;
      const s = statusFor(t, now);
      if (s) status = s;
    }
    return { robot, status };
  });
}

/** Where the robot is on the map, given the route its trip follows (hub first, home last). */
export function positionOf(v: RobotView, route: LatLng[] | undefined, parkedIndex: number): LatLng {
  const s = v.status;
  if (s.kind === "idle") {
    const [lat, lng] = HUBS[v.robot.hub].at;
    return [lat - 0.0012, lng - 0.0045 + parkedIndex * 0.003];
  }
  if (s.kind === "atDoor") return s.trip.home;
  const line = route ?? curvedRoute(HUBS[s.trip.hub].at, s.trip.home, routeKey(s.trip));
  return pointAlong(line, s.kind === "outbound" ? s.progress : 1 - s.progress);
}

/** Trips whose robot is back at the hub, newest first. */
export function finishedTrips(trips: Trip[], now: number): Trip[] {
  return trips
    .filter((t) => t.leftAt !== undefined && now >= t.leftAt + t.travelMs)
    .sort((a, b) => (b.leftAt ?? 0) - (a.leftAt ?? 0));
}

/** Samples taken at home with no robot booked yet, longest waiting first. */
export function readyForPickup(samples: Sample[], now: number): Sample[] {
  const takenAt = (s: Sample) => s.events.find((e) => e.type === "sampleTaken")?.at ?? now;
  return samples.filter((s) => stageOf(s, now) === "sampleTaken").sort((a, b) => takenAt(a) - takenAt(b));
}

/**
 * Samples a robot has brought back that no nurse has registered at the lab yet,
 * grouped by the hub they wait at; longest waiting first within a hub.
 */
export function awaitingIntake(samples: Sample[], now: number): { hub: HubId; samples: Sample[] }[] {
  const arrivedAt = (s: Sample) => s.events.findLast((e) => e.type === "pickedUp")?.at ?? now;
  const waiting = samples
    .filter((s) => flagsOf(s, now).some((f) => f.kind === "awaitingIntake"))
    .sort((a, b) => arrivedAt(a) - arrivedAt(b));
  return (Object.keys(HUBS) as HubId[])
    .map((hub) => ({ hub, samples: waiting.filter((s) => hubOf(s.person) === hub) }))
    .filter((g) => g.samples.length > 0);
}

// ---- Simulated other households -------------------------------------------------------------

/** Sidewalk delivery robots drive at about walking pace. */
export const ROBOT_SPEED_KMH = 6;
/** Streets are longer than the straight line; a typical detour factor for walking routes. */
const DETOUR = 1.35;
/** How much faster than real time the simulated robots run. 1 is real time. */
export type SimSpeed = 1 | 20 | 60;

/** One-way driving time from the hub to the home at ROBOT_SPEED_KMH, sped up by `speed`. */
export function travelMsFor(person: Person, speed: SimSpeed): number {
  const km = dist(HUBS[hubOf(person)].at, homeOf(person)) * 111.32 * DETOUR;
  return Math.max(5_000, Math.round(((km / ROBOT_SPEED_KMH) * 3_600_000) / speed));
}

/** Households that are slow to come to the door, so the "waiting too long" flag shows. */
export const NO_ANSWER_IDS = ["p24", "x5", "x36", "x56"];
export const NO_ANSWER_ID = NO_ANSWER_IDS[0];
const NO_ANSWER_MS = 75_000;
/** Gap between simulated bookings at 60× speed; proportionally longer at slower speeds. */
export const DISPATCH_GAP_MS = 3_000;
/** Robots per hub sent out at once when the map is quiet. */
const BURST_PER_HUB = 3;

export type SimAction = {
  sampleId: string;
  event: { type: "pickupBooked"; slot: string; travelMs: number; at?: number } | { type: "pickedUp" };
};

/**
 * The next simulated events for everyone except the phone user: hand samples to robots
 * waiting at the door, and book a robot for the sample that has waited longest
 * when its hub has a robot free. Pure, so every tab would decide the same.
 */
export function simStep(samples: Sample[], now: number, me: string, slotLabel: string, speed: SimSpeed = 1): SimAction[] {
  const trips = tripsOf(samples);
  const actions: SimAction[] = [];

  // People come to the door 15–50 s after the robot arrives, whatever the driving speed.
  for (const t of trips) {
    if (t.sampleId === me || t.leftAt !== undefined) continue;
    const delay = NO_ANSWER_IDS.includes(t.sampleId) ? NO_ANSWER_MS : 15_000 + (hash(t.sampleId) % 8) * 5_000;
    if (now >= t.bookedAt + t.travelMs + delay) actions.push({ sampleId: t.sampleId, event: { type: "pickedUp" } });
  }

  const gap = DISPATCH_GAP_MS * (60 / speed);
  const lastBooking = Math.max(-Infinity, ...trips.filter((t) => t.sampleId !== me).map((t) => t.bookedAt));
  const fleet = fleetAt(trips, now);
  const idlePerHub = new Map<HubId, number>();
  for (const v of fleet) if (v.status.kind === "idle") idlePerHub.set(v.robot.hub, (idlePerHub.get(v.robot.hub) ?? 0) + 1);
  const waiting = readyForPickup(samples, now).filter((s) => s.id !== me && idlePerHub.has(hubOf(s.person)));
  const book = (s: Sample, at?: number): SimAction => ({
    sampleId: s.id,
    event: { type: "pickupBooked", slot: slotLabel, travelMs: travelMsFor(s.person, speed), ...(at === undefined ? {} : { at }) },
  });

  if (fleet.every((v) => v.status.kind === "idle" || v.status.trip.sampleId === me)) {
    // Quiet map (page just opened or demo reset): show a fleet already at work.
    // A few robots per hub are booked as if they had left earlier, each part-way to its home.
    const sent = new Map<HubId, number>();
    for (const s of waiting) {
      const hub = hubOf(s.person);
      const n = sent.get(hub) ?? 0;
      if (n >= Math.min(BURST_PER_HUB, idlePerHub.get(hub) ?? 0)) continue;
      sent.set(hub, n + 1);
      const travelled = ((hash(s.id) % 80) + 5) / 100; // 5–84 % of the way there
      actions.push(book(s, Math.round(now - travelMsFor(s.person, speed) * travelled)));
    }
  } else if (now - lastBooking >= gap && waiting[0]) {
    actions.push(book(waiting[0]));
  }
  return actions;
}
