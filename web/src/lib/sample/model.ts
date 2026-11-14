export type Lang = "fi" | "sv" | "en";

export type Programme = "bowel" | "cervical";

export type EventType =
  | "invited"
  | "letterOpened"
  | "sampleTaken"
  | "pickupBooked"
  | "clinicBooked"
  | "bookingCancelled"
  | "pickedUp"
  | "clinicVisited"
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
  /** human label for pickupBooked, clinicBooked and colonoscopyBooked */
  slot?: string;
  /** epoch ms the booked window starts; for pickupBooked and clinicBooked */
  startsAt?: number;
};

export type Person = {
  id: string;
  name: string;
  age: number;
  municipality: string;
  lang: Lang;
  interpreter?: string;
};

export type Sample = { id: string; person: Person; programme: Programme; events: SampleEvent[] };

export type Stage =
  | "invited"
  | "booked"
  | "robotEnRoute"
  | "robotAtDoor"
  | "pickedUp"
  | "atLab"
  | "negative"
  | "positive"
  | "colonoscopyBooked"
  | "done";

export function programmeLabel(p: Programme): string {
  return p === "bowel" ? "Bowel screening (home test)" : "Cervical screening (clinic visit)";
}

export const ROBOT_TRAVEL_MS = 20_000;
const DAY_MS = 86_400_000;
const ROBOT_WAIT_FLAG_MS = 60_000;

/**
 * Milestone events, in order; later wins. Reminders, nurse calls and bookings are not milestones:
 * booking state comes from activeBooking.
 */
const MILESTONE_RANK: Partial<Record<EventType, number>> = {
  invited: 0,
  letterOpened: 0,
  sampleTaken: 1,
  pickedUp: 3,
  clinicVisited: 3,
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

/** The latest booking, unless a later cancellation exists. Booking again is rebooking: the latest wins. */
export function activeBooking(s: Sample): SampleEvent | null {
  let booking: SampleEvent | null = null;
  let cancelledAt = -Infinity;
  for (const e of s.events) {
    if (e.type === "pickupBooked" || e.type === "clinicBooked") {
      if (!booking || e.at >= booking.at) booking = e;
    } else if (e.type === "bookingCancelled" && e.at >= cancelledAt) {
      cancelledAt = e.at;
    }
  }
  return booking && cancelledAt >= booking.at ? null : booking;
}

export function bookingCount(s: Sample): number {
  return s.events.filter((e) => e.type === "pickupBooked" || e.type === "clinicBooked").length;
}

export function stageOf(s: Sample, now: number): Stage {
  const m = latestMilestone(s);
  switch (m?.type) {
    case "pickedUp":
    case "clinicVisited":
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
  }
  const b = activeBooking(s);
  if (!b) return "invited";
  if (s.programme === "cervical" || b.type === "clinicBooked") return "booked";
  const startsAt = b.startsAt ?? b.at;
  if (now < startsAt) return "booked";
  return now < startsAt + ROBOT_TRAVEL_MS ? "robotEnRoute" : "robotAtDoor";
}

/** Start of the active pickup window, when the stage is a pickup stage. */
function pickupStart(s: Sample, now: number): { startsAt: number; stage: Stage } | null {
  const stage = stageOf(s, now);
  const b = activeBooking(s);
  if (!b || b.type !== "pickupBooked") return null;
  return { startsAt: b.startsAt ?? b.at, stage };
}

/** 0..1 while the robot is en route, 1 at the door, null otherwise. */
export function robotProgress(s: Sample, now: number): number | null {
  const p = pickupStart(s, now);
  if (!p || (p.stage !== "robotEnRoute" && p.stage !== "robotAtDoor")) return null;
  return Math.min(1, Math.max(0, (now - p.startsAt) / ROBOT_TRAVEL_MS));
}

/** Milliseconds until the robot arrives: from booking, before and during the trip; 0 at the door; null otherwise. */
export function robotEta(s: Sample, now: number): number | null {
  const p = pickupStart(s, now);
  if (!p || (p.stage !== "booked" && p.stage !== "robotEnRoute" && p.stage !== "robotAtDoor")) return null;
  return Math.max(0, p.startsAt + ROBOT_TRAVEL_MS - now);
}

export type Flag = {
  kind: "noBooking" | "positiveNoBooking" | "robotWaiting" | "rebooked";
  label: string;
  days?: number;
};

export function flagsOf(s: Sample, now: number): Flag[] {
  const flags: Flag[] = [];

  const invited = firstOf(s, "invited");
  if (invited && bookingCount(s) === 0) {
    const days = Math.floor((now - invited.at) / DAY_MS);
    if (days >= 14) {
      flags.push({ kind: "noBooking", label: `No booking ${days} days after invitation`, days });
    }
  }

  const positive = firstOf(s, "resultPositive");
  if (positive && !has(s, "colonoscopyBooked")) {
    const days = Math.floor((now - positive.at) / DAY_MS);
    if (days >= 7) {
      const what = s.programme === "bowel" ? "colonoscopy" : "follow-up visit";
      flags.push({ kind: "positiveNoBooking", label: `Positive result, no ${what} booked for ${days} days`, days });
    }
  }

  if (stageOf(s, now) === "robotAtDoor") {
    const b = activeBooking(s);
    const waited = now - ((b?.startsAt ?? 0) + ROBOT_TRAVEL_MS);
    if (waited > ROBOT_WAIT_FLAG_MS) {
      flags.push({ kind: "robotWaiting", label: `Robot has waited ${Math.floor(waited / 1000)} s at the door` });
    }
  }

  const count = bookingCount(s);
  if (count >= 3) {
    flags.push({ kind: "rebooked", label: `Rebooked ${count - 1} times` });
  } else if (has(s, "bookingCancelled")) {
    flags.push({ kind: "rebooked", label: "Booking cancelled" });
  }

  return flags;
}

export const STAGES_FOR_BOARD: { stage: Stage | Stage[]; label: string }[] = [
  { stage: "invited", label: "Invited" },
  { stage: "booked", label: "Booked" },
  { stage: ["robotEnRoute", "robotAtDoor", "pickedUp"], label: "Sample" },
  { stage: "atLab", label: "At lab" },
  { stage: "positive", label: "Result" },
  { stage: "colonoscopyBooked", label: "Follow-up" },
  { stage: ["negative", "done"], label: "Done" },
];

export function addEvent(samples: Sample[], id: string, e: SampleEvent): Sample[] {
  if (!samples.some((s) => s.id === id)) return samples;
  return samples.map((s) => (s.id === id ? { ...s, events: [...s.events, e] } : s));
}
