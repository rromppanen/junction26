import type { EventType, Lang, Programme, Sample } from "./model";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Booked window start: hours from now, or a local day offset and hour of day. */
type Starts = number | { days: number; hour: number };

/** [event, hours before now, startsAt?]; bookings get a slot label generated from startsAt. */
type Ev = [EventType, number, Starts?];

type Spec = {
  id: string;
  name: string;
  age: number;
  municipality: string;
  lang: Lang;
  programme: Programme;
  interpreter?: string;
  events: Ev[];
};

const d = (days: number) => days * 24;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

function startsAtMs(now: number, s: Starts): number {
  if (typeof s === "number") return now + s * HOUR;
  const t = new Date(now);
  t.setDate(t.getDate() + s.days);
  t.setHours(s.hour, 0, 0, 0);
  return t.getTime();
}

/** Label that matches startsAt: "Today 17–18" or "Mon 16 Nov 10:00". */
function slotLabel(startsAt: number, now: number): string {
  const t = new Date(startsAt);
  const n = new Date(now);
  if (t.toDateString() === n.toDateString()) return `Today ${t.getHours()}–${t.getHours() + 1}`;
  return `${WEEKDAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

const SPECS: Spec[] = [
  // The two live samples: invited today.
  { id: "me", name: "Aino K.", age: 62, municipality: "Lahti", lang: "fi", programme: "bowel", events: [["invited", 0]] },
  { id: "me-cx", name: "Sanna L.", age: 34, municipality: "Lahti", lang: "fi", programme: "cervical", events: [["invited", 0]] },
  // No booking 20 days after the invitation.
  { id: "p2", name: "Matti H.", age: 66, municipality: "Heinola", lang: "fi", programme: "bowel",
    events: [["invited", d(20)], ["reminderSent", d(6)]] },
  // Invited recently.
  { id: "p3", name: "Leila S.", age: 58, municipality: "Hollola", lang: "fi", programme: "bowel", events: [["invited", d(3)]] },
  { id: "p4", name: "Karl L.", age: 71, municipality: "Helsinki", lang: "sv", programme: "bowel",
    events: [["invited", d(6)], ["letterOpened", d(2)]] },
  // Bowel booked for later today, sample already taken.
  { id: "p5", name: "Hanna V.", age: 57, municipality: "Orimattila", lang: "fi", programme: "bowel",
    events: [["invited", d(9)], ["letterOpened", d(2)], ["sampleTaken", 3], ["pickupBooked", 2, 3]] },
  // Cervical booked 2 days ahead.
  { id: "p6", name: "Tiina R.", age: 41, municipality: "Hollola", lang: "fi", programme: "cervical",
    events: [["invited", d(8)], ["letterOpened", d(4)], ["clinicBooked", d(1), { days: 2, hour: 10 }]] },
  // Cancelled booking, back at invited.
  { id: "p7", name: "Kaisa J.", age: 38, municipality: "Nastola", lang: "fi", programme: "cervical",
    events: [["invited", d(16)], ["clinicBooked", d(5), { days: -2, hour: 9 }], ["bookingCancelled", d(3)]] },
  // Picked up, on the way to the lab.
  { id: "p8", name: "Ahmed R.", age: 60, municipality: "Helsinki", lang: "en", programme: "bowel", interpreter: "Arabic",
    events: [["invited", d(8)], ["sampleTaken", d(1)], ["pickupBooked", d(1), -6], ["pickedUp", 5]] },
  // At the lab.
  { id: "p9", name: "Sirpa T.", age: 69, municipality: "Lahti", lang: "fi", programme: "bowel",
    events: [["invited", d(12)], ["sampleTaken", d(3)], ["pickupBooked", d(2) + 5, -d(2)], ["pickedUp", d(2)], ["atLab", d(2)]] },
  // Positive, no colonoscopy booked for 9 days.
  { id: "p10", name: "Pekka M.", age: 73, municipality: "Nastola", lang: "fi", programme: "bowel",
    events: [["invited", d(35)], ["sampleTaken", d(25)], ["pickupBooked", d(24), -d(22)], ["pickedUp", d(22)],
      ["atLab", d(22)], ["resultPositive", d(9)], ["reminderSent", d(4)]] },
  // Done: negative result.
  { id: "p11", name: "Juha P.", age: 59, municipality: "Lahti", lang: "fi", programme: "bowel",
    events: [["invited", d(45)], ["sampleTaken", d(38)], ["pickupBooked", d(37), -d(35)], ["pickedUp", d(35)],
      ["atLab", d(35)], ["resultNegative", d(20)]] },
  // Done: follow-up completed after a positive.
  { id: "p12", name: "Marjatta O.", age: 72, municipality: "Helsinki", lang: "sv", programme: "bowel",
    events: [["invited", d(80)], ["sampleTaken", d(70)], ["pickupBooked", d(69), -d(67)], ["pickedUp", d(67)],
      ["atLab", d(67)], ["resultPositive", d(50)], ["colonoscopyBooked", d(45)], ["colonoscopyDone", d(30)]] },
];

export function seedSamples(now: number): Sample[] {
  return SPECS.map((p) => ({
    id: p.id,
    programme: p.programme,
    person: {
      id: p.id,
      name: p.name,
      age: p.age,
      municipality: p.municipality,
      lang: p.lang,
      ...(p.interpreter ? { interpreter: p.interpreter } : {}),
    },
    events: p.events
      .map(([type, hoursAgo, starts]) => {
        const at = now - hoursAgo * HOUR;
        if (type === "pickupBooked" || type === "clinicBooked") {
          const startsAt = startsAtMs(now, starts ?? 0);
          return { type, at, startsAt, slot: slotLabel(startsAt, now) };
        }
        if (type === "colonoscopyBooked") {
          return { type, at, slot: slotLabel(at + 5 * DAY, now) };
        }
        return { type, at };
      })
      .sort((a, b) => a.at - b.at),
  }));
}
