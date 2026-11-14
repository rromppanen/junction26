export type Lang = "fi" | "sv" | "en";

export type EventType =
  | "invited"
  | "kitOpened"
  | "sampleTaken"
  | "pickupBooked"
  // Written by the phone app (web/) when it books a pickup; shown in history, not used for the stage here.
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
  /** for pickupBooked: how long the robot drives one way, in ms. Absent means ROBOT_TRAVEL_MS (the phone demo). */
  travelMs?: number;
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

export const ROBOT_TRAVEL_MS = 20_000;

/** One-way driving time of the sample's latest robot booking. */
export function travelOf(s: Sample): number {
  return s.events.findLast((e) => e.type === "pickupBooked")?.travelMs ?? ROBOT_TRAVEL_MS;
}
const DAY_MS = 86_400_000;
export const ROBOT_WAIT_FLAG_MS = 60_000;

/** Milestone events, in order; later wins. Reminders and nurse calls are not milestones. */
const MILESTONE_RANK: Partial<Record<EventType, number>> = {
  invited: 0,
  kitOpened: 0,
  sampleTaken: 1,
  pickupBooked: 2,
  pickedUp: 3,
  atLab: 4,
  resultNegative: 5,
  resultPositive: 5,
  colonoscopyBooked: 6,
  colonoscopyDone: 7,
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
      return now < m.at + travelOf(s) ? "robotEnRoute" : "robotAtDoor";
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

/** 0..1 while the robot is en route, 1 at the door, null with no pickup booked or after pickup. */
export function robotProgress(s: Sample, now: number): number | null {
  const m = latestMilestone(s);
  if (!m || m.type !== "pickupBooked") return null;
  const p = (now - m.at) / travelOf(s);
  return Math.min(1, Math.max(0, p));
}

export type Flag = {
  kind: "noSample" | "positiveNoBooking" | "robotWaiting" | "awaitingIntake";
  label: string;
  days?: number;
  /** noSample only: days since the latest reminder, or null when none has been sent. */
  remindedDaysAgo?: number | null;
};

/** "Reminder sent 6 d ago" or "No reminder yet", for a noSample flag. */
export function reminderNote(f: Flag): string | null {
  if (f.kind !== "noSample") return null;
  if (f.remindedDaysAgo === null || f.remindedDaysAgo === undefined) return "No reminder yet";
  return f.remindedDaysAgo === 0 ? "Reminder sent today" : `Reminder sent ${f.remindedDaysAgo} d ago`;
}

export function flagsOf(s: Sample, now: number): Flag[] {
  const flags: Flag[] = [];

  const invited = firstOf(s, "invited");
  if (invited && !has(s, "sampleTaken")) {
    const days = Math.floor((now - invited.at) / DAY_MS);
    if (days >= 14) {
      const reminded = s.events.filter((e) => e.type === "reminderSent").reduce((a, e) => Math.max(a, e.at), -Infinity);
      flags.push({
        kind: "noSample", label: `No sample ${days} days after invitation`, days,
        remindedDaysAgo: Number.isFinite(reminded) ? Math.floor((now - reminded) / DAY_MS) : null,
      });
    }
  }

  const positive = firstOf(s, "resultPositive");
  if (positive && !has(s, "colonoscopyBooked")) {
    const days = Math.floor((now - positive.at) / DAY_MS);
    if (days >= 7) {
      flags.push({ kind: "positiveNoBooking", label: `Positive result, no colonoscopy booked for ${days} days`, days });
    }
  }

  const m = latestMilestone(s);
  if (m && m.type === "pickupBooked") {
    const waited = now - (m.at + travelOf(s));
    if (waited > ROBOT_WAIT_FLAG_MS) {
      flags.push({ kind: "robotWaiting", label: `Robot has waited ${Math.floor(waited / 1000)} s at the door` });
    }
  }

  // The robot is back with the sample: a nurse has to take it out and register it at the lab.
  if (m && m.type === "pickedUp" && now >= m.at + travelOf(s)) {
    flags.push({ kind: "awaitingIntake", label: "Sample has arrived: collect it from the robot and register it at the lab" });
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
