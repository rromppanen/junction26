import type { Owner, Status } from "./patients";

export type BarrierKind =
  | "agreed"
  | "time_off"
  | "fear"
  | "not_understood"
  | "transport"
  | "preparation"
  | "already_examined"
  | "wants_call"
  | "unknown";

export type Barrier = {
  kind: BarrierKind;
  label: string;
  /** What the nurse should do next. Concrete, and something a health centre can do today. */
  action: string;
  /** Status the case moves to once the nurse records the action. Never "examined": that needs its own confirmation. */
  nextStatus: Status;
  owner: Owner;
};

export const BARRIERS: Record<BarrierKind, Omit<Barrier, "kind">> = {
  agreed: { label: "Ready to book", action: "Book the first free colonoscopy slot and send the confirmation and bowel preparation instructions.", nextStatus: "booked", owner: "Endoscopy booking" },
  time_off: { label: "Cannot get time off work", action: "Offer an evening or Saturday slot and send a certificate for the employer.", nextStatus: "booked", owner: "Endoscopy booking" },
  fear: { label: "Afraid of the examination or the result", action: "Nurse calls today, explains the examination and sedation, then books if the patient agrees.", nextStatus: "barrier", owner: "Screening nurse" },
  not_understood: { label: "Did not understand the result", action: "Nurse calls with an interpreter and explains what a positive test means.", nextStatus: "barrier", owner: "Nurse with interpreter" },
  transport: { label: "No way to get to the hospital", action: "Book a Kela taxi with the appointment and send the travel reimbursement form.", nextStatus: "booked", owner: "Endoscopy booking" },
  preparation: { label: "Worried about bowel preparation", action: "Send preparation instructions in the patient's language and offer a nurse call the day before.", nextStatus: "booked", owner: "Endoscopy booking" },
  already_examined: { label: "Says they had a colonoscopy elsewhere", action: "Ask for the date and place, fetch the report via Kanta, and then confirm before closing the case.", nextStatus: "verify_elsewhere", owner: "Screening nurse" },
  wants_call: { label: "Wants someone to call", action: "Add to today's nurse call list.", nextStatus: "barrier", owner: "Screening nurse" },
  unknown: { label: "Unclear reply", action: "Nurse reads the reply and calls the patient.", nextStatus: "barrier", owner: "Screening nurse" },
};

export function barrier(kind: BarrierKind): Barrier {
  return { kind, ...BARRIERS[kind] };
}

// Order matters: the first match wins, so specific barriers come before plain agreement.
const RULES: [BarrierKind, RegExp][] = [
  // No trailing \b: JavaScript treats ä and ö as non-word characters, and Finnish words inflect.
  ["already_examined", /\b(already|private|occupational|työterv|yksityi|jo käyny|jo tehty|redan)/i],
  // Arabic "عمل" (work) sits outside \b, which only knows ASCII word characters.
  ["time_off", /\b(work|job|shift|time off|töi|työ|vuoro|vapaa|arbete|jobb)|عمل/i],
  ["transport", /\b(car|bus|drive|ride|taxi|transport|far|kyyti|auto|bussi|matka|kaukana|taksi|bil|långt)/i],
  ["preparation", /\b(prep|laxative|drink|diet|tyhjennys|valmist|juoma|laksat|förbered)/i],
  ["fear", /\b(scared|afraid|fear|worried|anxious|hurt|pain|pelk|pelott|jännit|satt|kipu|rädd)/i],
  ["not_understood", /\b(understand|mean|what is|confus|en ymmär|mitä tarkoit|förstår)/i],
  ["wants_call", /\b(call|phone|soit|puhel|ring)/i],
  ["agreed", /(^|[\s,.!])(yes|ok|okay|sure|kyllä|joo|sopii|ja|gärna)([\s,.!]|$)|\bbook|\bvaraa/i],
];

/** Rule-based reading of a patient's reply. Used when Gemini is unavailable, and as the tested baseline. */
export function classifyReply(text: string): Barrier {
  const t = text.trim();
  if (!t) return barrier("unknown");
  for (const [kind, re] of RULES) if (re.test(t)) return barrier(kind);
  return barrier("unknown");
}

export function isBarrierKind(v: unknown): v is BarrierKind {
  return typeof v === "string" && v in BARRIERS;
}
