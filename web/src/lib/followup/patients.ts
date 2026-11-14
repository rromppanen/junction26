/**
 * Follow-up assistant for positive bowel screening tests.
 *
 * Every patient here is invented for the demo. No real patient data is used or stored.
 */

export type Language = "fi" | "sv" | "en" | "ar" | "so" | "ru";

export const LANGUAGE_NAMES: Record<Language, string> = {
  fi: "Finnish",
  sv: "Swedish",
  en: "English",
  ar: "Arabic",
  so: "Somali",
  ru: "Russian",
};

/**
 * Case status. Booking is not completion: only a recorded examination, or a verified examination
 * elsewhere, closes a case. Code owns these transitions; AI only suggests.
 */
export type Status =
  | "not_contacted"
  | "contacted"
  | "barrier"
  | "booked"
  | "verify_elsewhere"
  | "examined"
  | "examined_elsewhere";

export const STATUS_LABELS: Record<Status, string> = {
  not_contacted: "Not contacted",
  contacted: "Awaiting reply",
  barrier: "Barrier open",
  booked: "Booked, not yet examined",
  verify_elsewhere: "Outside exam to verify",
  examined: "Examination recorded",
  examined_elsewhere: "Verified elsewhere",
};

export type Owner = "Screening nurse" | "Endoscopy booking" | "Nurse with interpreter";

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F";
  language: Language;
  municipality: string;
  /** Days since the positive test result was sent. */
  daysSincePositive: number;
  status: Status;
  owner: Owner;
  nextAction: string;
  /** Facts a nurse would know from the record that make follow-up harder. */
  flags: string[];
};

/** Demo assumption, not an official deadline: no verified bowel-screening target time was found. Configurable. */
export const OVERDUE_DAYS = 14;

export const DEMO_PATIENTS: Patient[] = [
  { id: "p1", name: "Ahmed H.", age: 62, sex: "M", language: "ar", municipality: "Helsinki", daysSincePositive: 23, status: "not_contacted", owner: "Screening nurse", nextAction: "Send first message", flags: ["Needs interpreter", "Shift work"] },
  { id: "p2", name: "Pertti K.", age: 71, sex: "M", language: "fi", municipality: "Helsinki", daysSincePositive: 31, status: "contacted", owner: "Screening nurse", nextAction: "Wait for reply, call if none in 3 days", flags: ["Lives alone", "No reply to first letter"] },
  { id: "p3", name: "Fadumo A.", age: 58, sex: "F", language: "so", municipality: "Helsinki", daysSincePositive: 17, status: "not_contacted", owner: "Screening nurse", nextAction: "Send first message", flags: ["Needs interpreter"] },
  { id: "p4", name: "Jari L.", age: 65, sex: "M", language: "fi", municipality: "Helsinki", daysSincePositive: 9, status: "not_contacted", owner: "Screening nurse", nextAction: "Send first message", flags: ["First screening round"] },
  { id: "p5", name: "Marianne S.", age: 69, sex: "F", language: "sv", municipality: "Helsinki", daysSincePositive: 12, status: "contacted", owner: "Screening nurse", nextAction: "Wait for reply, call if none in 3 days", flags: [] },
  { id: "p6", name: "Olga V.", age: 74, sex: "F", language: "ru", municipality: "Helsinki", daysSincePositive: 26, status: "not_contacted", owner: "Screening nurse", nextAction: "Send first message", flags: ["Needs interpreter", "Reduced mobility"] },
  { id: "p7", name: "Mikko R.", age: 56, sex: "M", language: "fi", municipality: "Helsinki", daysSincePositive: 6, status: "booked", owner: "Endoscopy booking", nextAction: "Record the examination when done", flags: [] },
  { id: "p8", name: "Liisa M.", age: 66, sex: "F", language: "fi", municipality: "Helsinki", daysSincePositive: 40, status: "examined_elsewhere", owner: "Screening nurse", nextAction: "None", flags: ["Occupational health colonoscopy"] },
];

/** Higher means call sooner: overdue and unresolved first, then the longest wait. */
export function priority(p: Patient): number {
  if (isResolved(p)) return -1;
  if (p.status === "booked") return 0;
  const overdue = p.daysSincePositive >= OVERDUE_DAYS ? 1000 : 0;
  return overdue + p.daysSincePositive + p.flags.length * 2;
}

export function isResolved(p: Patient): boolean {
  return p.status === "examined" || p.status === "examined_elsewhere";
}

export function sortWorklist(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => priority(b) - priority(a));
}

/** Fictional case IDs shown in the queue; the names are invented too. */
export const caseId = (p: Patient) => `DEMO-${p.id.slice(1).padStart(3, "0")}`;

/** National baseline, Finnish Cancer Registry colorectal screening report (2023, the latest settled year). */
export const REGISTRY_BASELINE = {
  year: 2023,
  positiveTests: 16_501,
  noColonoscopy: 3_536,
  noColonoscopyShare: 0.214,
  helsinkiShare: 0.315,
  cancersInLostGroup2022: 87,
  source: "https://stats.cancerregistry.fi/joukkistilastot/suolisto.html",
} as const;
