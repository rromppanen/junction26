import type { EventType, Lang, Sample } from "./model";

const HOUR = 3_600_000;

type Spec = {
  id: string;
  name: string;
  age: number;
  municipality: string;
  lang: Lang;
  interpreter?: string;
  /** [event, hours before now, slot?] */
  events: [EventType, number, string?][];
};

const d = (days: number) => days * 24;

const SPECS: Spec[] = [
  { id: "me", name: "Aino K.", age: 62, municipality: "Lahti", lang: "fi", events: [["invited", 0]] },
  // No sample 20 days after the invitation.
  { id: "p2", name: "Matti H.", age: 66, municipality: "Heinola", lang: "fi",
    events: [["invited", d(20)], ["reminderSent", d(6)]] },
  // Invited recently.
  { id: "p3", name: "Leila S.", age: 58, municipality: "Hollola", lang: "fi", events: [["invited", d(3)]] },
  { id: "p4", name: "Karl L.", age: 71, municipality: "Helsinki", lang: "sv",
    events: [["invited", d(6)], ["kitOpened", d(2)]] },
  // Sample taken, waiting for pickup.
  { id: "p5", name: "Hanna V.", age: 57, municipality: "Orimattila", lang: "fi",
    events: [["invited", d(9)], ["kitOpened", d(2)], ["sampleTaken", 3]] },
  // Picked up, on the way to the lab.
  { id: "p6", name: "Ahmed R.", age: 60, municipality: "Helsinki", lang: "en", interpreter: "Arabic",
    events: [["invited", d(8)], ["sampleTaken", d(1)], ["pickupBooked", 6, "Yesterday 17:00"], ["pickedUp", 5]] },
  // At the lab.
  { id: "p7", name: "Sirpa T.", age: 69, municipality: "Lahti", lang: "fi",
    events: [["invited", d(12)], ["sampleTaken", d(3)], ["pickupBooked", d(2) + 5, "Thu 10:00"], ["pickedUp", d(2)], ["atLab", d(2)]] },
  // Positive, no booking for 9 days.
  { id: "p8", name: "Pekka M.", age: 73, municipality: "Nastola", lang: "fi",
    events: [["invited", d(35)], ["sampleTaken", d(25)], ["pickedUp", d(22)], ["atLab", d(22)], ["resultPositive", d(9)],
      ["reminderSent", d(4)]] },
  // Positive, colonoscopy booked.
  { id: "p9", name: "Eeva N.", age: 64, municipality: "Asikkala", lang: "fi",
    events: [["invited", d(40)], ["sampleTaken", d(30)], ["pickedUp", d(27)], ["atLab", d(27)], ["resultPositive", d(12)],
      ["colonoscopyBooked", d(10), "Mon 24 Nov 09:30"]] },
  // Done: negative result.
  { id: "p10", name: "Juha P.", age: 59, municipality: "Lahti", lang: "fi",
    events: [["invited", d(45)], ["sampleTaken", d(38)], ["pickedUp", d(35)], ["atLab", d(35)], ["resultNegative", d(20)]] },
  // Done: colonoscopy completed.
  { id: "p11", name: "Marjatta O.", age: 72, municipality: "Helsinki", lang: "sv",
    events: [["invited", d(80)], ["sampleTaken", d(70)], ["pickedUp", d(67)], ["atLab", d(67)], ["resultPositive", d(50)],
      ["colonoscopyBooked", d(45), "Tue 09:00"], ["colonoscopyDone", d(30)]] },
];

export function seedSamples(now: number): Sample[] {
  return SPECS.map((p) => ({
    id: p.id,
    person: {
      id: p.id,
      name: p.name,
      age: p.age,
      municipality: p.municipality,
      lang: p.lang,
      ...(p.interpreter ? { interpreter: p.interpreter } : {}),
    },
    events: p.events
      .map(([type, hoursAgo, slot]) => ({ type, at: now - hoursAgo * HOUR, ...(slot ? { slot } : {}) }))
      .sort((a, b) => a.at - b.at),
  }));
}

