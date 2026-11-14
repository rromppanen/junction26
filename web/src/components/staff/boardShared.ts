import { flagsOf, STAGES_FOR_BOARD, type EventType, type Programme, type Sample, type Stage } from "@/lib/sample/model";

export const DEMO_NOTE = "Demo: invented people; the robot, lab and bookings are simulated.";
export const ME = "me";

export const LIVE_IDS = ["me", "me-cx"] as const;

export const EVENT_LABEL: Record<EventType, string> = {
  invited: "Invitation sent",
  letterOpened: "Letter opened",
  sampleTaken: "Sample taken",
  pickupBooked: "Robot pickup booked",
  clinicBooked: "Clinic visit booked",
  bookingCancelled: "Booking cancelled",
  pickedUp: "Picked up by robot",
  clinicVisited: "Clinic visit recorded",
  atLab: "Arrived at the lab",
  resultNegative: "Result: no findings",
  resultPositive: "Result: positive",
  reminderSent: "Reminder sent",
  nurseCalled: "Nurse called",
  colonoscopyBooked: "Follow-up booked",
  colonoscopyDone: "Follow-up done",
};

const MILESTONES: Partial<Record<EventType, true>> = {
  invited: true, letterOpened: true, sampleTaken: true, pickupBooked: true, clinicBooked: true, pickedUp: true,
  clinicVisited: true, atLab: true, resultNegative: true, resultPositive: true, colonoscopyBooked: true,
  colonoscopyDone: true,
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

export function followUpSlots(now: number): string[] {
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

export function stageLabel(stage: Stage, programme: Programme, letterOpened = false): string {
  switch (stage) {
    case "invited": return letterOpened ? "Invited, letter opened" : "Invited";
    case "booked": return "Booked";
    case "robotEnRoute": return "Robot on its way";
    case "robotAtDoor": return "Robot at the door";
    case "pickedUp": return programme === "bowel" ? "Sample collected" : "Sample taken at clinic";
    case "atLab": return "At lab";
    case "positive": return "Positive result";
    case "colonoscopyBooked": return programme === "bowel" ? "Colonoscopy booked" : "Follow-up visit booked";
    case "done": return "Done";
    case "negative": return "No findings";
  }
}

export function rowStageLabel(row: Row): string {
  return stageLabel(row.stage, row.s.programme, row.s.events.some((e) => e.type === "letterOpened"));
}

export function programmeBadge(p: Programme): string {
  return p === "bowel" ? "Bowel · home" : "Cervical · clinic";
}

export const clockFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function mmss(ms: number): string {
  const t = Math.ceil(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export const BTN = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-white px-3 py-2 text-sm font-medium hover:bg-brand-soft disabled:opacity-50";
