import { ROBOT_TRAVEL_MS, ROBOT_WAIT_FLAG_MS, departureOf, flagsOf, stageOf, type Person, type Sample } from "@/lib/sample/model";

/**
 * The robot fleet, derived from the sample events.
 * The samples hold no robots: a "pickupBooked" event dispatches one, which drives out for
 * the booking's travel time, waits at the door until "pickedUp", then drives back to its hub.
 * A robot has COMPARTMENTS compartments, each opened on its own, so one run can collect from
 * several homes close to each other: bookings that share a `run` are its stops, in compartment
 * order, and each later stop starts when the robot leaves the previous door.
 * Replaying every booking in order gives each run a robot, so every tab shows the same result.
 */

/** Compartments per robot. Each opens on its own, so a robot can collect from this many homes in one run. */
export const COMPARTMENTS = 4;
/** A run only adds a home within this distance (km, straight line) of its previous stop. */
export const NEARBY_KM = 2;

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

/** Where the map opens: the capital region. */
export const MAP_CENTER: LatLng = [60.225, 24.92];

export type Robot = { id: string; name: string; hub: HubId };
const PER_HUB: [HubId, number][] = [["meilahti", 4], ["itakeskus", 6], ["malmi", 5], ["tikkurila", 5], ["myyrmaki", 5], ["matinkyla", 5]];
export const FLEET: Robot[] = PER_HUB.flatMap(([hub, n]) => Array.from({ length: n }, () => hub)).map((hub, i) => ({
  id: `r${i + 1}`,
  name: `Robot ${i + 1}`,
  hub,
}));

/** One stop of a run: a robot's leg to a home, its wait at the door and, after the last stop, its way back. */
export type Trip = {
  robotId: string;
  sampleId: string;
  person: Person;
  hub: HubId;
  home: LatLng;
  slot?: string;
  /** The run this stop belongs to, and the compartment the person uses (1 is the first stop). */
  run: string;
  compartment: number;
  /** Number of stops in the run. */
  stops: number;
  /** Where this leg starts: the hub (or the phone's start point) for the first stop, else the previous home. */
  from: LatLng;
  /**
   * When the robot sets off on this leg: the booking, the start of a later booked window or when the phone
   * sent it for the first stop; when the robot left the previous door for later stops (Infinity until then).
   */
  bookedAt: number;
  /** Driving time of this leg, in ms. */
  travelMs: number;
  /** The street route from the phone's booking, hub first and home last; absent for simulated households. */
  route?: LatLng[];
  /** When the robot left the door: the sample was handed over, or the booking was replaced. */
  leftAt?: number;
  handedOver: boolean;
  /** Where the run ends (its start point) and how long the last stop's drive back takes. */
  backTo: LatLng;
  returnMs: number;
  last: boolean;
  /** When the robot is back with the whole run, once the last stop is done. */
  backAt?: number;
};

export type RobotStatus =
  | { kind: "idle" }
  | { kind: "outbound"; trip: Trip; progress: number; etaMs: number }
  | { kind: "atDoor"; trip: Trip; waitedMs: number; flagged: boolean }
  | { kind: "returning"; trip: Trip; progress: number; etaMs: number };

/** What a robot is doing, and every stop of its current run in compartment order (empty when idle). */
export type RobotView = { robot: Robot; status: RobotStatus; run: Trip[] };

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

/**
 * A route shared by the phone ([lng, lat] points) as map points ([lat, lng]), or undefined when it is
 * missing or malformed: anyone can write to the shared demo log, so only finite coordinate pairs pass.
 */
export function sharedRoute(raw: unknown): LatLng[] | undefined {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 500) return undefined;
  const out: LatLng[] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length !== 2) return undefined;
    const [lng, lat] = p as unknown[];
    if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return undefined;
    out.push([lat, lng]);
  }
  return out;
}

export function routeKey(t: Pick<Trip, "hub" | "sampleId">): string {
  return `${t.hub}:${t.sampleId}`;
}

/** Every pickup booking as a stop of a run, runs in departure order, each run given a robot from its hub. */
export function tripsOf(samples: Sample[]): Trip[] {
  type Draft = Omit<Trip, "robotId" | "stops" | "from" | "backTo" | "returnMs" | "last" | "backAt" | "leftAt" | "handedOver"> & {
    endAt?: number;
    picked: boolean;
  };
  const runs = new Map<string, Draft[]>();
  for (const s of samples) {
    const events = [...s.events].sort((a, b) => a.at - b.at);
    events.forEach((e, i) => {
      if (e.type !== "pickupBooked") return;
      const end = events.slice(i + 1).find((x) => x.type === "pickedUp" || x.type === "pickupBooked");
      // A booked window that has not started keeps the robot at its hub; one replaced before it set off never ran.
      const leaves = departureOf(s, e);
      if (end && end.at < leaves) return;
      // The phone sends its route as [lng, lat]; the map works in [lat, lng].
      const route = sharedRoute(e.route);
      const run = typeof e.run === "string" ? e.run : `${s.id}@${e.at}`;
      const list = runs.get(run) ?? [];
      runs.set(run, list);
      list.push({
        sampleId: s.id,
        person: s.person,
        hub: hubOf(s.person),
        home: route ? route[route.length - 1] : homeOf(s.person),
        ...(route ? { route } : {}),
        ...(e.slot ? { slot: e.slot } : {}),
        run,
        compartment: typeof e.compartment === "number" ? e.compartment : 1,
        bookedAt: leaves,
        travelMs: e.travelMs ?? ROBOT_TRAVEL_MS,
        ...(end ? { endAt: end.at } : {}),
        picked: end?.type === "pickedUp",
      });
    });
  }

  // Each stop's leg starts when the robot left the previous door; the last stop drives back to the start.
  const built: Omit<Trip, "robotId">[][] = [];
  for (const drafts of runs.values()) {
    drafts.sort((a, b) => a.compartment - b.compartment || a.bookedAt - b.bookedAt);
    const first = drafts[0];
    const start: LatLng = first.route ? first.route[0] : HUBS[first.hub].at;
    let from = start;
    let prevLeft: number | undefined;
    const stops = drafts.map((d, k) => {
      const legStart = k === 0 ? d.bookedAt : Math.min(d.bookedAt, prevLeft ?? Infinity);
      const leftAt = d.endAt === undefined ? undefined : Math.max(d.endAt, legStart + d.travelMs);
      const { endAt: _end, picked, ...rest } = d;
      void _end;
      const stop = { ...rest, from, bookedAt: legStart, ...(leftAt === undefined ? {} : { leftAt }), handedOver: picked };
      from = d.home;
      prevLeft = leftAt;
      return stop;
    });
    const last = stops[stops.length - 1];
    // A single stop drives back the way it came; a longer run drives back from its last home at the same pace.
    const msPerDeg = first.travelMs / Math.max(1e-4, dist(start, first.home));
    const returnMs = stops.length === 1 ? first.travelMs : Math.max(3_000, Math.round(dist(last.home, start) * msPerDeg));
    const backAt = last.leftAt === undefined ? undefined : last.leftAt + returnMs;
    built.push(stops.map((t, i) => ({
      ...t, stops: stops.length, backTo: start, returnMs, last: i === stops.length - 1, ...(backAt === undefined ? {} : { backAt }),
    })));
  }
  built.sort((a, b) => a[0].bookedAt - b[0].bookedAt || a[0].sampleId.localeCompare(b[0].sampleId));

  const busyUntil = new Map<string, number>(FLEET.map((r) => [r.id, -Infinity]));
  return built.flatMap((run) => {
    const d = run[0];
    const pool = FLEET.filter((r) => r.hub === d.hub);
    const robot =
      pool.find((r) => (busyUntil.get(r.id) ?? -Infinity) <= d.bookedAt) ??
      pool.reduce((best, r) => ((busyUntil.get(r.id) ?? 0) < (busyUntil.get(best.id) ?? 0) ? r : best));
    busyUntil.set(robot.id, run[run.length - 1].backAt ?? Infinity);
    return run.map((t) => ({ ...t, robotId: robot.id }));
  });
}

function statusFor(trip: Trip, now: number): RobotStatus | null {
  if (now < trip.bookedAt) return null;
  const arrive = trip.bookedAt + trip.travelMs;
  if (now < arrive) {
    return { kind: "outbound", trip, progress: (now - trip.bookedAt) / trip.travelMs, etaMs: arrive - now };
  }
  if (trip.leftAt === undefined || now < trip.leftAt) {
    const waitedMs = now - arrive;
    return { kind: "atDoor", trip, waitedMs, flagged: waitedMs > ROBOT_WAIT_FLAG_MS };
  }
  // After a stop that is not the last, the next stop's leg takes over.
  if (!trip.last) return null;
  const back = trip.leftAt + trip.returnMs;
  if (now < back) {
    return { kind: "returning", trip, progress: (now - trip.leftAt) / trip.returnMs, etaMs: back - now };
  }
  return null;
}

/** What every robot is doing now, with the stops of its current run. */
export function fleetAt(trips: Trip[], now: number): RobotView[] {
  return FLEET.map((robot) => {
    let status: RobotStatus = { kind: "idle" };
    for (const t of trips) {
      if (t.robotId !== robot.id) continue;
      const s = statusFor(t, now);
      if (s) status = s;
    }
    const run = status.kind === "idle" ? [] : trips.filter((t) => t.run === status.trip.run).sort((a, b) => a.compartment - b.compartment);
    return { robot, status, run };
  });
}

/** Where the robot is on the map, given the line its current leg follows (start first, home last). */
export function positionOf(v: RobotView, route: LatLng[] | undefined, parkedIndex: number): LatLng {
  const s = v.status;
  if (s.kind === "idle") {
    const [lat, lng] = HUBS[v.robot.hub].at;
    return [lat - 0.0012, lng - 0.0045 + parkedIndex * 0.003];
  }
  if (s.kind === "atDoor") return s.trip.home;
  const line = route ?? s.trip.route ?? curvedRoute(s.trip.from, s.trip.home, routeKey(s.trip));
  return pointAlong(line, s.kind === "outbound" ? s.progress : 1 - s.progress);
}

/** Stops whose robot is back at the hub with the whole run, newest first. */
export function finishedTrips(trips: Trip[], now: number): Trip[] {
  return trips
    .filter((t) => t.backAt !== undefined && now >= t.backAt)
    .sort((a, b) => (b.backAt ?? 0) - (a.backAt ?? 0));
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
  // A sample on a run reaches the hub when the whole run is back; without a booked run (seeded
  // history), when its own pickup's drive back ends, as the board's flag says.
  const onRun = new Map<string, number | undefined>();
  for (const t of tripsOf(samples)) if (t.handedOver) onRun.set(t.sampleId, t.backAt);
  const arrivedAt = (s: Sample): number | undefined => {
    if (onRun.has(s.id)) return onRun.get(s.id);
    return flagsOf(s, now).some((f) => f.kind === "awaitingIntake") ? (s.events.findLast((e) => e.type === "pickedUp")?.at ?? now) : undefined;
  };
  const waiting = samples
    .filter((s) => {
      const at = arrivedAt(s);
      return at !== undefined && now >= at && stageOf(s, now) === "pickedUp";
    })
    .sort((a, b) => (arrivedAt(a) ?? 0) - (arrivedAt(b) ?? 0));
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
  event:
    | { type: "pickupBooked"; slot: string; travelMs: number; at?: number; run?: string; compartment?: number; after?: string }
    | { type: "pickedUp" }
    | { type: "robotDispatched"; at: number };
};

/** Driving time between two points at ROBOT_SPEED_KMH along streets, sped up by `speed`. */
function legMs(from: LatLng, to: LatLng, speed: SimSpeed): number {
  const km = dist(from, to) * 111.32 * DETOUR;
  return Math.max(3_000, Math.round(((km / ROBOT_SPEED_KMH) * 3_600_000) / speed));
}

/** Up to `n` waiting homes, each the nearest within NEARBY_KM of the previous stop (and, if given, from the same hub). */
export function nearbyChain(from: LatLng, pool: Sample[], n: number, hub?: HubId): Sample[] {
  const left = pool.filter((s) => hub === undefined || hubOf(s.person) === hub);
  const out: Sample[] = [];
  let at = from;
  while (out.length < n) {
    let best = -1;
    let bestKm = Infinity;
    left.forEach((s, i) => {
      const km = dist(at, homeOf(s.person)) * 111.32;
      if (km <= NEARBY_KM && km < bestKm) {
        best = i;
        bestKm = km;
      }
    });
    if (best < 0) break;
    const [s] = left.splice(best, 1);
    out.push(s);
    at = homeOf(s.person);
  }
  return out;
}

/**
 * The next simulated events for everyone except the phone user: hand samples to robots waiting at
 * the door, send a run on to its next stop once the robot has left the previous door, add nearby
 * homes to the phone's run, and book a run (up to COMPARTMENTS nearby homes) for the sample that has
 * waited longest when its hub has a robot free. Pure, so every tab would decide the same.
 */
export function simStep(samples: Sample[], now: number, me: string, slotLabel: string, speed: SimSpeed = 1): SimAction[] {
  const trips = tripsOf(samples);
  const actions: SimAction[] = [];
  const byId = new Map(samples.map((s) => [s.id, s]));

  // People come to the door 15–50 s after the robot arrives, whatever the driving speed.
  for (const t of trips) {
    if (t.sampleId === me || t.leftAt !== undefined || !Number.isFinite(t.bookedAt)) continue;
    const delay = NO_ANSWER_IDS.includes(t.sampleId) ? NO_ANSWER_MS : 15_000 + (hash(t.sampleId) % 8) * 5_000;
    if (now >= t.bookedAt + t.travelMs + delay) actions.push({ sampleId: t.sampleId, event: { type: "pickedUp" } });
  }

  // A later stop is sent on its way, dated to when the robot left the previous door.
  for (const t of trips) {
    if (t.compartment === 1) continue;
    const prev = trips.find((x) => x.run === t.run && x.compartment === t.compartment - 1);
    const s = byId.get(t.sampleId);
    const booking = s?.events.findLast((e) => e.type === "pickupBooked");
    if (!prev || prev.leftAt === undefined || now < prev.leftAt || !s || !booking) continue;
    if (!Number.isFinite(departureOf(s, booking))) actions.push({ sampleId: t.sampleId, event: { type: "robotDispatched", at: prev.leftAt } });
  }

  const waitingAll = readyForPickup(samples, now).filter((s) => s.id !== me);
  const taken = new Set<string>();
  const runOf = (first: Sample, rest: Sample[], at?: number): SimAction[] => {
    const run = `${first.id}@${at ?? now}`;
    taken.add(first.id);
    const out: SimAction[] = [{
      sampleId: first.id,
      event: { type: "pickupBooked", slot: slotLabel, travelMs: travelMsFor(first.person, speed), run, compartment: 1, ...(at === undefined ? {} : { at }) },
    }];
    let prev = first;
    rest.forEach((s, i) => {
      taken.add(s.id);
      out.push({
        sampleId: s.id,
        event: { type: "pickupBooked", slot: slotLabel, travelMs: legMs(homeOf(prev.person), homeOf(s.person), speed), run, compartment: i + 2, after: prev.id },
      });
      prev = s;
    });
    return out;
  };

  // The phone's robot comes to the phone first, then takes nearby homes in its other compartments.
  for (const t of trips) {
    if (t.sampleId !== me || t.stops !== 1 || t.leftAt !== undefined || now < t.bookedAt) continue;
    const near = nearbyChain(t.home, waitingAll.filter((s) => !taken.has(s.id)), COMPARTMENTS - 1);
    let prevId = me;
    let prevHome = t.home;
    near.forEach((s, i) => {
      taken.add(s.id);
      actions.push({
        sampleId: s.id,
        event: { type: "pickupBooked", slot: slotLabel, travelMs: legMs(prevHome, homeOf(s.person), speed), run: t.run, compartment: i + 2, after: prevId },
      });
      prevId = s.id;
      prevHome = homeOf(s.person);
    });
  }

  const gap = DISPATCH_GAP_MS * (60 / speed);
  const firstStops = trips.filter((t) => t.sampleId !== me && t.compartment === 1);
  const lastBooking = Math.max(-Infinity, ...firstStops.map((t) => t.bookedAt).filter(Number.isFinite));
  const fleet = fleetAt(trips, now);
  const idlePerHub = new Map<HubId, number>();
  for (const v of fleet) if (v.status.kind === "idle") idlePerHub.set(v.robot.hub, (idlePerHub.get(v.robot.hub) ?? 0) + 1);
  const waiting = () => waitingAll.filter((s) => !taken.has(s.id) && idlePerHub.has(hubOf(s.person)));
  const chainFor = (s: Sample) => nearbyChain(homeOf(s.person), waitingAll.filter((x) => x.id !== s.id && !taken.has(x.id)), COMPARTMENTS - 1, hubOf(s.person));

  if (fleet.every((v) => v.status.kind === "idle" || v.run.some((t) => t.sampleId === me))) {
    // Quiet map (page just opened or demo reset): show a fleet already at work.
    // A few runs per hub are booked as if they had left earlier, each part-way to its first home.
    const sent = new Map<HubId, number>();
    for (const s of waiting()) {
      if (taken.has(s.id)) continue;
      const hub = hubOf(s.person);
      const n = sent.get(hub) ?? 0;
      if (n >= Math.min(BURST_PER_HUB, idlePerHub.get(hub) ?? 0)) continue;
      sent.set(hub, n + 1);
      const travelled = ((hash(s.id) % 80) + 5) / 100; // 5–84 % of the way there
      actions.push(...runOf(s, chainFor(s), Math.round(now - travelMsFor(s.person, speed) * travelled)));
    }
  } else if (now - lastBooking >= gap) {
    const first = waiting()[0];
    if (first) actions.push(...runOf(first, chainFor(first)));
  }
  return actions;
}
