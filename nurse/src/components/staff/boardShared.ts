import { flagsOf, STAGES_FOR_BOARD, type EventType, type Sample, type Stage } from "@/lib/sample/model";

export const DEMO_NOTE = "Demo: invented people; the robot, lab and bookings are simulated.";
export const ME = "me";

export const EVENT_LABEL: Record<EventType, string> = {
  invited: "Invitation sent",
  kitOpened: "Kit opened",
  sampleTaken: "Sample taken",
  pickupBooked: "Robot pickup booked",
  robotDispatched: "Robot sent out",
  robotArrived: "Robot at the door",
  pickedUp: "Picked up by robot",
  atLab: "Arrived at the lab",
  resultNegative: "Result: no blood found",
  resultPositive: "Result: blood found",
  reminderSent: "Reminder sent",
  nurseCalled: "Nurse called",
  colonoscopyBooked: "Colonoscopy booked",
  colonoscopyDone: "Colonoscopy done",
};

const MILESTONES: Partial<Record<EventType, true>> = {
  invited: true, kitOpened: true, sampleTaken: true, pickupBooked: true, pickedUp: true, atLab: true,
  resultNegative: true, resultPositive: true, colonoscopyBooked: true, colonoscopyDone: true,
};

export type Row = { s: Sample; stage: Stage; flags: ReturnType<typeof flagsOf> };
export type ActFn = (row: Row, type: EventType, extra?: { note?: string; slot?: string }) => void;

export function matches(spec: Stage | Stage[], stage: Stage): boolean {
  return Array.isArray(spec) ? spec.includes(stage) : spec === stage;
}

/** Index (0-6) of the board step the stage belongs to. */
export function stepIndex(stage: Stage): number {
  const i = STAGES_FOR_BOARD.findIndex((c) => matches(c.stage, stage));
  return i < 0 ? 0 : i;
}

export function msInStage(s: Sample, now: number): number {
  let at = 0;
  for (const e of s.events) if (MILESTONES[e.type] && e.at > at) at = e.at;
  return Math.max(0, now - at);
}

export function inStage(s: Sample, now: number): string {
  const ms = msInStage(s, now);
  if (ms < 86_400_000) {
    const min = Math.max(1, Math.floor(ms / 60_000));
    return min >= 60 ? `${Math.floor(min / 60)} h in step` : `${min} min in step`;
  }
  return `${Math.floor(ms / 86_400_000)} d in step`;
}

export function colonoscopySlots(now: number): string[] {
  const times = ["9:00", "10:30", "13:00"];
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    out.push(`${fmt.format(d)} ${times[out.length]}`);
  }
  return out;
}

export const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const STAGE_LABEL: Record<Stage, string> = {
  invited: "Invited",
  sampleTaken: "Sample taken",
  pickupBooked: "Pickup booked",
  robotEnRoute: "Robot on the way",
  robotAtDoor: "Robot at the door",
  pickedUp: "Picked up",
  atLab: "At lab",
  negative: "Negative",
  positive: "Positive",
  colonoscopyBooked: "Colonoscopy booked",
  done: "Done",
};

export const BTN = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-white px-3 py-2 text-sm font-medium hover:bg-brand-soft disabled:opacity-50";
