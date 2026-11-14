export type Lang = "fi" | "sv" | "en";

export type EventType =
  | "invited"
  | "kitOpened"
  | "sampleTaken"
  | "pickupBooked"
  | "robotDispatched"
  | "robotArrived"
  | "pickedUp"
  | "atLab"
  | "resultNegative"
  | "resultPositive"
  | "reminderSent"
  | "nurseCalled"
  | "colonoscopyBooked"
  | "colonoscopyDone";

export type SampleEvent = {
  type: EventType;
  /** epoch ms */
  at: number;
  note?: string;
  /** for pickupBooked and colonoscopyBooked */
  slot?: string;
  /** for pickupBooked: when the pickup window starts (epoch ms) */
  slotAt?: number;
};

export type Person = {
  id: string;
  name: string;
  age: number;
  municipality: string;
  /** Neighbourhood, used to place the home on the map. */
  area?: string;
  lang: Lang;
  interpreter?: string;
  /** Mother tongue when it is not the app language, e.g. "Somali". */
  homeLanguage?: string;
};

export type Sample = { id: string; person: Person; events: SampleEvent[] };

export type Stage =
  | "invited"
  | "sampleTaken"
  | "pickupBooked"
  | "robotEnRoute"
  | "robotAtDoor"
  | "pickedUp"
  | "atLab"
  | "negative"
  | "positive"
  | "colonoscopyBooked"
  | "done";

/** How long the robot takes from the hub to the door. Sped up for the demo (a real trip is 10–15 minutes); the app says so. */
export const ROBOT_TRAVEL_MS = 10_000;
const DAY_MS = 86_400_000;
const ROBOT_WAIT_FLAG_MS = 60_000;

/** Milestone events, in order; later wins. Reminders and nurse calls are not milestones. */
const MILESTONE_RANK: Partial<Record<EventType, number>> = {
  invited: 0,
  kitOpened: 0,
  sampleTaken: 1,
  pickupBooked: 2,
  robotDispatched: 3,
  robotArrived: 4,
  pickedUp: 5,
  atLab: 6,
  resultNegative: 7,
  resultPositive: 7,
  colonoscopyBooked: 8,
  colonoscopyDone: 9,
};

function latestMilestone(s: Sample): SampleEvent | undefined {
  let best: SampleEvent | undefined;
  let bestRank = -1;
  for (const e of s.events) {
    const r = MILESTONE_RANK[e.type];
    if (r === undefined) continue;
    if (r > bestRank || (r === bestRank && best && e.at >= best.at)) {
      best = e;
      bestRank = r;
    }
  }
  return best;
}

function firstOf(s: Sample, type: EventType): SampleEvent | undefined {
  return s.events.find((e) => e.type === type);
}

function has(s: Sample, type: EventType): boolean {
  return s.events.some((e) => e.type === type);
}

export function stageOf(s: Sample, now: number): Stage {
  const m = latestMilestone(s);
  if (!m) return "invited";
  switch (m.type) {
    case "sampleTaken":
      return "sampleTaken";
    case "pickupBooked":
      return "pickupBooked";
    case "robotDispatched":
      return now < m.at + ROBOT_TRAVEL_MS ? "robotEnRoute" : "robotAtDoor";
    case "robotArrived":
      return "robotAtDoor";
    case "pickedUp":
      return "pickedUp";
    case "atLab":
      return "atLab";
    case "resultNegative":
      return "negative";
    case "resultPositive":
      return "positive";
    case "colonoscopyBooked":
      return "colonoscopyBooked";
    case "colonoscopyDone":
      return "done";
    default:
      return "invited";
  }
}

/** 0..1 while the robot is en route, 1 at the door, null before it leaves or after pickup. */
export function robotProgress(s: Sample, now: number): number | null {
  const m = latestMilestone(s);
  if (!m) return null;
  if (m.type === "robotArrived") return 1;
  if (m.type !== "robotDispatched") return null;
  const p = (now - m.at) / ROBOT_TRAVEL_MS;
  return Math.min(1, Math.max(0, p));
}

/** When the robot reached the door, or null if it is not there. */
export function robotArrivedAt(s: Sample): number | null {
  const m = latestMilestone(s);
  if (!m) return null;
  if (m.type === "robotArrived") return m.at;
  if (m.type === "robotDispatched") return m.at + ROBOT_TRAVEL_MS;
  return null;
}

export type Flag = {
  kind: "noSample" | "positiveNoBooking" | "robotWaiting";
  label: string;
  days?: number;
};

export function flagsOf(s: Sample, now: number): Flag[] {
  const flags: Flag[] = [];

  const invited = firstOf(s, "invited");
  if (invited && !has(s, "sampleTaken")) {
    const days = Math.floor((now - invited.at) / DAY_MS);
    if (days >= 14) {
      flags.push({ kind: "noSample", label: `No sample ${days} days after invitation`, days });
    }
  }

  const positive = firstOf(s, "resultPositive");
  if (positive && !has(s, "colonoscopyBooked")) {
    const days = Math.floor((now - positive.at) / DAY_MS);
    if (days >= 7) {
      flags.push({ kind: "positiveNoBooking", label: `Positive result, no colonoscopy booked for ${days} days`, days });
    }
  }

  const arrived = robotArrivedAt(s);
  if (arrived !== null) {
    const waited = now - arrived;
    if (waited > ROBOT_WAIT_FLAG_MS) {
      flags.push({ kind: "robotWaiting", label: `Robot has waited ${Math.floor(waited / 1000)} s at the door` });
    }
  }

  return flags;
}

export const STAGES_FOR_BOARD: { stage: Stage | Stage[]; label: string }[] = [
  { stage: "invited", label: "Invited" },
  { stage: "sampleTaken", label: "Sample taken" },
  { stage: ["pickupBooked", "robotEnRoute", "robotAtDoor", "pickedUp"], label: "Pickup" },
  { stage: "atLab", label: "At lab" },
  { stage: "positive", label: "Result" },
  { stage: "colonoscopyBooked", label: "Colonoscopy" },
  { stage: ["negative", "done"], label: "Done" },
];

export function addEvent(samples: Sample[], id: string, e: SampleEvent): Sample[] {
  if (!samples.some((s) => s.id === id)) return samples;
  return samples.map((s) => (s.id === id ? { ...s, events: [...s.events, e] } : s));
}
