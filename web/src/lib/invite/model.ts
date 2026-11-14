/**
 * Breast screening invitations as a list of events per woman. Her stage is read from the events, so the
 * phone (the woman) and the board (the screening unit) only ever add events and always agree.
 *
 * The events map onto the invitation layers of the designer (lib/invitation.ts):
 *   booked time in the letter → "invited" · rebook online → "rebooked" · text reminder → "smsSent"
 *   letter in her language → person.lang · second booked time → "secondBooked"
 *   personal call → "callQueued" / "called" · already screened → "elsewhereReported" / "elsewhereVerified"
 */

export type Lang = "fi" | "sv" | "en" | "ru" | "ar";

export const LANG_NAME: Record<Lang, string> = { fi: "Finnish", sv: "Swedish", en: "English", ru: "Russian", ar: "Arabic" };

/** Finnish, Swedish (and Sami) speakers are the Registry's "native" group; everyone else is "other". */
export const isOtherLanguage = (l: Lang) => l !== "fi" && l !== "sv";

export type EventType =
  | "invited"
  | "smsSent"
  | "confirmed"
  | "rebooked"
  | "attended"
  | "missed"
  | "secondBooked"
  | "callbackRequested"
  | "callQueued"
  | "called"
  | "elsewhereReported"
  | "elsewhereVerified"
  | "elsewhereNotFound"
  | "optedOut";

export type CallOutcome = "booked" | "noAnswer" | "declined";

export type InviteEvent = {
  type: EventType;
  /** epoch ms */
  at: number;
  /** Appointment start, epoch ms: invited, rebooked, secondBooked, called with outcome "booked". */
  slot?: number;
  outcome?: CallOutcome;
  note?: string;
};

export type Person = { id: string; name: string; age: number; district: string; lang: Lang };

export type Invitee = { id: string; person: Person; events: InviteEvent[] };

export type Stage = "booked" | "missed" | "call" | "elsewherePending" | "attended" | "elsewhere" | "optedOut";

export const STAGE_LABEL: Record<Stage, string> = {
  booked: "Booked",
  missed: "Missed, needs a new time",
  call: "Call queue",
  elsewherePending: "Screened elsewhere? Check Kanta",
  attended: "Screened",
  elsewhere: "Screened elsewhere",
  optedOut: "Declined",
};

export const EVENT_LABEL: Record<EventType, string> = {
  invited: "Invitation sent with a booked time",
  smsSent: "Text reminder sent",
  confirmed: "Confirmed the time",
  rebooked: "Changed the time online",
  attended: "Screened",
  missed: "Did not come",
  secondBooked: "Second booked time sent",
  callbackRequested: "Asked for a call",
  callQueued: "Added to the call queue",
  called: "Called",
  elsewhereReported: "Reported a mammogram elsewhere",
  elsewhereVerified: "Found in Kanta",
  elsewhereNotFound: "Not found in Kanta",
  optedOut: "Declined this round",
};

const byTime = (a: InviteEvent, b: InviteEvent) => a.at - b.at;

export type Status = {
  stage: Stage;
  /** Current appointment, epoch ms, while booked. */
  appointment: number | null;
  /** Number of the booked time: 1 = from the letter, 2+ = after a miss or a call. */
  attempt: number;
  confirmed: boolean;
  /** Calls that did not reach her. */
  noAnswer: number;
};

export function statusOf(inv: Invitee): Status {
  let s: Status = { stage: "booked", appointment: null, attempt: 0, confirmed: false, noAnswer: 0 };
  for (const e of [...inv.events].sort(byTime)) {
    switch (e.type) {
      case "invited":
        s = { ...s, stage: "booked", appointment: e.slot ?? null, attempt: 1 };
        break;
      case "rebooked":
        s = { ...s, stage: "booked", appointment: e.slot ?? s.appointment, confirmed: true };
        break;
      case "confirmed":
        s = { ...s, confirmed: true };
        break;
      case "attended":
        s = { ...s, stage: "attended", appointment: null };
        break;
      case "missed":
        s = { ...s, stage: "missed", appointment: null, confirmed: false };
        break;
      case "secondBooked":
        s = { ...s, stage: "booked", appointment: e.slot ?? null, attempt: s.attempt + 1, confirmed: false };
        break;
      case "callbackRequested":
      case "callQueued":
        if (s.stage !== "attended" && s.stage !== "elsewhere") s = { ...s, stage: "call" };
        break;
      case "called":
        if (e.outcome === "booked") s = { ...s, stage: "booked", appointment: e.slot ?? null, attempt: s.attempt + 1, confirmed: true };
        else if (e.outcome === "declined") s = { ...s, stage: "optedOut", appointment: null };
        else s = { ...s, stage: "call", noAnswer: s.noAnswer + 1 };
        break;
      case "elsewhereReported":
        s = { ...s, stage: "elsewherePending", appointment: null };
        break;
      case "elsewhereVerified":
        s = { ...s, stage: "elsewhere" };
        break;
      case "elsewhereNotFound":
        s = { ...s, stage: "missed" };
        break;
      case "optedOut":
        s = { ...s, stage: "optedOut", appointment: null };
        break;
      case "smsSent":
        break;
    }
  }
  return s;
}

export function addEvent(list: Invitee[], id: string, e: InviteEvent): Invitee[] {
  return list.map((i) => (i.id === id ? { ...i, events: [...i.events, e] } : i));
}

/** True when a booked appointment has passed and nobody has marked it yet. */
export function isOverdue(inv: Invitee, now: number): boolean {
  const s = statusOf(inv);
  return s.stage === "booked" && s.appointment !== null && s.appointment < now;
}

export type RoundSummary = {
  invited: number;
  /** Women whose first booked time has passed, or who have already acted. */
  due: number;
  screened: number;
  elsewhere: number;
  upcoming: number;
  /** screened / due */
  attendance: number | null;
  /** (screened + elsewhere) / due */
  recorded: number | null;
  byLanguage: Record<"native" | "other", { due: number; screened: number }>;
  layers: {
    sms: number;
    rebooked: number;
    ownLanguage: number;
    secondBooked: number;
    calls: number;
    callBooked: number;
    elsewhereReported: number;
    elsewhereVerified: number;
  };
  /** Screened after a second booked time or a call: women the layers brought back. */
  broughtBack: number;
  needsAction: { missed: number; call: number; elsewherePending: number; overdue: number };
};

export function summarize(list: Invitee[], now: number): RoundSummary {
  const byLanguage = { native: { due: 0, screened: 0 }, other: { due: 0, screened: 0 } };
  const layers = { sms: 0, rebooked: 0, ownLanguage: 0, secondBooked: 0, calls: 0, callBooked: 0, elsewhereReported: 0, elsewhereVerified: 0 };
  const needsAction = { missed: 0, call: 0, elsewherePending: 0, overdue: 0 };
  let due = 0;
  let screened = 0;
  let elsewhere = 0;
  let upcoming = 0;
  let broughtBack = 0;

  for (const inv of list) {
    const s = statusOf(inv);
    const ev = inv.events;
    const first = ev.find((e) => e.type === "invited")?.slot ?? Infinity;
    const acted = s.stage !== "booked" || ev.some((e) => e.type !== "invited" && e.type !== "smsSent" && e.type !== "confirmed" && e.type !== "rebooked");
    const isDue = first <= now || acted;
    const g = isOtherLanguage(inv.person.lang) ? "other" : "native";
    if (isDue) {
      due++;
      byLanguage[g].due++;
    }
    if (s.stage === "attended") {
      screened++;
      byLanguage[g].screened++;
      if (ev.some((e) => e.type === "secondBooked" || (e.type === "called" && e.outcome === "booked"))) broughtBack++;
    }
    if (s.stage === "elsewhere") elsewhere++;
    if (s.stage === "booked" && s.appointment !== null && s.appointment >= now) upcoming++;
    if (s.stage === "missed") needsAction.missed++;
    if (s.stage === "call") needsAction.call++;
    if (s.stage === "elsewherePending") needsAction.elsewherePending++;
    if (isOverdue(inv, now)) needsAction.overdue++;

    if (isOtherLanguage(inv.person.lang)) layers.ownLanguage++;
    for (const e of ev) {
      if (e.type === "smsSent") layers.sms++;
      if (e.type === "rebooked") layers.rebooked++;
      if (e.type === "secondBooked") layers.secondBooked++;
      if (e.type === "called") {
        layers.calls++;
        if (e.outcome === "booked") layers.callBooked++;
      }
      if (e.type === "elsewhereReported") layers.elsewhereReported++;
      if (e.type === "elsewhereVerified") layers.elsewhereVerified++;
    }
  }

  return {
    invited: list.length,
    due,
    screened,
    elsewhere,
    upcoming,
    attendance: due > 0 ? screened / due : null,
    recorded: due > 0 ? (screened + elsewhere) / due : null,
    byLanguage,
    layers,
    broughtBack,
    needsAction,
  };
}

/** Weekday appointment times from `from`, skipping weekends, at fixed clock times. */
export function slotsAfter(from: number, count: number, startDays = 2): number[] {
  const times: [number, number][] = [[8, 40], [10, 20], [13, 0], [15, 40], [17, 20]];
  const out: number[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + startDays - 1);
  let k = 0;
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const [h, m] = times[k++ % times.length];
    const s = new Date(d);
    s.setHours(h, m, 0, 0);
    out.push(s.getTime());
  }
  return out;
}
