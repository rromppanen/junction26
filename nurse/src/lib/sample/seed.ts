import type { EventType, Lang, Sample } from "./model";

/**
 * Invented demo people in the Helsinki capital region (Helsinki, Espoo, Vantaa).
 * Most speak neither Finnish nor Swedish as their mother tongue: screening reaches
 * minority-language speakers least, so the demo shows how the nurse follows them.
 * The languages are among the largest foreign-language groups in the region.
 * This file is shared: web/ and nurse/ keep identical copies because both seed the same storage.
 */

const HOUR = 3_600_000;

type Spec = {
  id: string;
  name: string;
  age: number;
  municipality: "Helsinki" | "Espoo" | "Vantaa";
  area: string;
  lang: Lang;
  homeLanguage?: string;
  interpreter?: string;
  /** [event, hours before now, slot?] */
  events: [EventType, number, string?][];
};

const d = (days: number) => days * 24;

const SPECS: Spec[] = [
  // The live person on the phone.
  { id: "me", name: "Aino K.", age: 62, municipality: "Helsinki", area: "Kallio", lang: "fi", events: [["invited", 0]] },

  // No sample long after the invitation: the nurse should reach out, ideally in their language.
  { id: "p2", name: "Abdirahman H.", age: 66, municipality: "Helsinki", area: "Kontula", lang: "en", homeLanguage: "Somali", interpreter: "Somali",
    events: [["invited", d(20)], ["reminderSent", d(6)]] },
  { id: "p12", name: "Fadumo A.", age: 58, municipality: "Vantaa", area: "Länsimäki", lang: "en", homeLanguage: "Somali", interpreter: "Somali",
    events: [["invited", d(25)]] },
  { id: "p21", name: "Samira O.", age: 62, municipality: "Helsinki", area: "Itäkeskus", lang: "en", homeLanguage: "Somali", interpreter: "Somali",
    events: [["invited", d(30)], ["reminderSent", d(10)], ["nurseCalled", d(5)]] },
  { id: "p32", name: "Bilal K.", age: 63, municipality: "Vantaa", area: "Hakunila", lang: "en", homeLanguage: "Urdu",
    events: [["invited", d(16)]] },

  // Invited recently.
  { id: "p3", name: "Leila M.", age: 58, municipality: "Vantaa", area: "Hakunila", lang: "en", homeLanguage: "Persian", events: [["invited", d(3)]] },
  { id: "p4", name: "Karl L.", age: 71, municipality: "Espoo", area: "Matinkylä", lang: "sv", events: [["invited", d(6)], ["kitOpened", d(2)]] },
  { id: "p14", name: "Daria K.", age: 61, municipality: "Helsinki", area: "Kannelmäki", lang: "en", homeLanguage: "Ukrainian", events: [["invited", d(4)]] },
  { id: "p29", name: "Pirjo L.", age: 65, municipality: "Espoo", area: "Leppävaara", lang: "fi", events: [["invited", d(5)]] },

  // Sample taken at home, waiting for a robot pickup.
  { id: "p5", name: "Olga P.", age: 57, municipality: "Helsinki", area: "Vuosaari", lang: "en", homeLanguage: "Russian",
    events: [["invited", d(9)], ["kitOpened", d(2)], ["sampleTaken", 3]] },
  { id: "p13", name: "Viktor S.", age: 67, municipality: "Vantaa", area: "Myyrmäki", lang: "en", homeLanguage: "Ukrainian",
    events: [["invited", d(10)], ["sampleTaken", 5]] },
  { id: "p15", name: "Mehmet Y.", age: 63, municipality: "Espoo", area: "Leppävaara", lang: "en", homeLanguage: "Turkish",
    events: [["invited", d(8)], ["sampleTaken", 2]] },
  { id: "p16", name: "Arta B.", age: 59, municipality: "Helsinki", area: "Myllypuro", lang: "en", homeLanguage: "Albanian", interpreter: "Albanian",
    events: [["invited", d(12)], ["kitOpened", d(1)], ["sampleTaken", 4]] },
  { id: "p17", name: "Li W.", age: 65, municipality: "Espoo", area: "Matinkylä", lang: "en", homeLanguage: "Chinese",
    events: [["invited", d(7)], ["sampleTaken", 1]] },
  { id: "p19", name: "Amina J.", age: 56, municipality: "Vantaa", area: "Hakunila", lang: "en", homeLanguage: "Arabic",
    events: [["invited", d(11)], ["sampleTaken", 6]] },
  { id: "p20", name: "Mart K.", age: 70, municipality: "Helsinki", area: "Vuosaari", lang: "fi", homeLanguage: "Estonian",
    events: [["invited", d(9)], ["sampleTaken", 2.5]] },
  { id: "p22", name: "Rahim U.", age: 60, municipality: "Espoo", area: "Espoonlahti", lang: "en", homeLanguage: "Bengali",
    events: [["invited", d(13)], ["sampleTaken", 3.5]] },
  { id: "p24", name: "Kamal T.", age: 66, municipality: "Helsinki", area: "Malmi", lang: "en", homeLanguage: "Nepali",
    events: [["invited", d(10)], ["sampleTaken", 7]] },
  { id: "p26", name: "Yusuf D.", age: 71, municipality: "Vantaa", area: "Koivukylä", lang: "en", homeLanguage: "Kurdish", interpreter: "Kurdish",
    events: [["invited", d(14)], ["nurseCalled", d(4)], ["sampleTaken", 0.5]] },
  { id: "p28", name: "Ali H.", age: 69, municipality: "Helsinki", area: "Pihlajamäki", lang: "en", homeLanguage: "Arabic",
    events: [["invited", d(9)], ["sampleTaken", 4.5]] },
  { id: "p30", name: "Thi Lan P.", age: 61, municipality: "Helsinki", area: "Myllypuro", lang: "en", homeLanguage: "Vietnamese", interpreter: "Vietnamese",
    events: [["invited", d(15)], ["reminderSent", d(3)], ["sampleTaken", 1.5]] },

  // Picked up, on the way to the lab.
  { id: "p6", name: "Ahmed R.", age: 60, municipality: "Helsinki", area: "Itäkeskus", lang: "en", homeLanguage: "Arabic", interpreter: "Arabic",
    events: [["invited", d(8)], ["sampleTaken", d(1)], ["pickupBooked", 6, "Yesterday 17:00"], ["pickedUp", 5]] },

  // At the lab.
  { id: "p7", name: "Tiiu R.", age: 69, municipality: "Vantaa", area: "Koivukylä", lang: "fi", homeLanguage: "Estonian",
    events: [["invited", d(12)], ["sampleTaken", d(3)], ["pickupBooked", d(2) + 5, "Thu 10:00"], ["pickedUp", d(2)], ["atLab", d(2)]] },
  { id: "p23", name: "Elena V.", age: 57, municipality: "Vantaa", area: "Tikkurila", lang: "en", homeLanguage: "Russian",
    events: [["invited", d(10)], ["sampleTaken", d(2)], ["pickupBooked", d(1) + 3, "Fri 9:00"], ["pickedUp", d(1)], ["atLab", d(1)]] },

  // Positive, waiting for a colonoscopy booking.
  { id: "p8", name: "Hassan A.", age: 73, municipality: "Helsinki", area: "Mellunmäki", lang: "en", homeLanguage: "Kurdish", interpreter: "Kurdish",
    events: [["invited", d(35)], ["sampleTaken", d(25)], ["pickedUp", d(22)], ["atLab", d(22)], ["resultPositive", d(9)],
      ["reminderSent", d(4)]] },
  { id: "p27", name: "Irina B.", age: 64, municipality: "Helsinki", area: "Mellunmäki", lang: "en", homeLanguage: "Russian",
    events: [["invited", d(30)], ["sampleTaken", d(21)], ["pickedUp", d(20)], ["atLab", d(20)], ["resultPositive", d(10)],
      ["nurseCalled", d(2)]] },
  { id: "p18", name: "Reza M.", age: 68, municipality: "Helsinki", area: "Kontula", lang: "en", homeLanguage: "Dari", interpreter: "Dari",
    events: [["invited", d(28)], ["sampleTaken", d(15)], ["pickedUp", d(14)], ["atLab", d(14)], ["resultPositive", d(3)]] },

  // Positive, colonoscopy booked.
  { id: "p9", name: "Nguyen T. H.", age: 64, municipality: "Espoo", area: "Espoonlahti", lang: "en", homeLanguage: "Vietnamese", interpreter: "Vietnamese",
    events: [["invited", d(40)], ["sampleTaken", d(30)], ["pickedUp", d(27)], ["atLab", d(27)], ["resultPositive", d(12)],
      ["colonoscopyBooked", d(10), "Tue 24 Nov 09:30"]] },
  { id: "p31", name: "Hodan F.", age: 58, municipality: "Helsinki", area: "Vuosaari", lang: "en", homeLanguage: "Somali", interpreter: "Somali",
    events: [["invited", d(38)], ["sampleTaken", d(28)], ["pickedUp", d(26)], ["atLab", d(26)], ["resultPositive", d(14)],
      ["nurseCalled", d(13)], ["colonoscopyBooked", d(12), "Thu 26 Nov 13:00"]] },

  // Done: negative result.
  { id: "p10", name: "Juha P.", age: 59, municipality: "Helsinki", area: "Malmi", lang: "fi",
    events: [["invited", d(45)], ["sampleTaken", d(38)], ["pickedUp", d(35)], ["atLab", d(35)], ["resultNegative", d(20)]] },
  { id: "p25", name: "Ana G.", age: 59, municipality: "Espoo", area: "Espoon keskus", lang: "en", homeLanguage: "Spanish",
    events: [["invited", d(42)], ["sampleTaken", d(33)], ["pickedUp", d(32)], ["atLab", d(32)], ["resultNegative", d(18)]] },

  // Done: colonoscopy completed.
  { id: "p11", name: "Marjatta O.", age: 72, municipality: "Helsinki", area: "Sörnäinen", lang: "sv",
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
      area: p.area,
      lang: p.lang,
      ...(p.homeLanguage ? { homeLanguage: p.homeLanguage } : {}),
      ...(p.interpreter ? { interpreter: p.interpreter } : {}),
    },
    events: p.events
      .map(([type, hoursAgo, slot]) => ({ type, at: now - hoursAgo * HOUR, ...(slot ? { slot } : {}) }))
      .sort((a, b) => a.at - b.at),
  }));
}
