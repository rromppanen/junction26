import type { EventType, Lang, Sample } from "./model";

/**
 * Invented demo people (about 100) in the Helsinki capital region (Helsinki, Espoo, Vantaa).
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

/**
 * More households, written compactly: [name, age, municipality, area, mother tongue, interpreter?, state].
 * An empty mother tongue means Finnish. Ids are x1, x2, … in this order; do not reorder.
 */
type Kind = "ready" | "invited" | "late" | "lab" | "positive" | "positiveLate" | "booked" | "negative";
type Muni = "H" | "E" | "V";
const MUNI = { H: "Helsinki", E: "Espoo", V: "Vantaa" } as const;

const MORE: [string, number, Muni, string, string, boolean, Kind][] = [
  // East Helsinki
  ["Khadra M.", 61, "H", "Kontula", "Somali", true, "ready"],
  ["Sergei N.", 68, "H", "Kontula", "Russian", false, "ready"],
  ["Zahra H.", 57, "H", "Mellunmäki", "Dari", true, "ready"],
  ["Ilir K.", 64, "H", "Mellunmäki", "Albanian", false, "ready"],
  ["Mohamed I.", 70, "H", "Vuosaari", "Somali", true, "ready"],
  ["Tatiana L.", 59, "H", "Meri-Rastila", "Russian", false, "ready"],
  ["Nasrin F.", 62, "H", "Meri-Rastila", "Persian", false, "ready"],
  ["Jamal S.", 66, "H", "Puotila", "Arabic", true, "ready"],
  ["Sirje T.", 60, "H", "Herttoniemi", "Estonian", false, "ready"],
  ["Tesfay G.", 58, "H", "Roihuvuori", "Tigrinya", true, "ready"],
  ["Maria S.", 63, "H", "Laajasalo", "Tagalog", false, "ready"],
  ["Ayaan W.", 65, "H", "Itäkeskus", "Somali", true, "late"],
  ["Farid N.", 72, "H", "Myllypuro", "Dari", true, "positiveLate"],
  ["Galina R.", 69, "H", "Vuosaari", "Russian", false, "lab"],
  ["Abdi Y.", 60, "V", "Länsimäki", "Somali", false, "invited"],
  // Central and west Helsinki
  ["Chen L.", 62, "H", "Pasila", "Chinese", false, "ready"],
  ["Ivan D.", 67, "H", "Kallio", "Russian", false, "ready"],
  ["Sunita R.", 58, "H", "Sörnäinen", "Nepali", false, "ready"],
  ["Paulo C.", 61, "H", "Lauttasaari", "Portuguese", false, "ready"],
  ["Anh T.", 66, "H", "Munkkiniemi", "Vietnamese", true, "ready"],
  ["Rashid K.", 59, "H", "Pitäjänmäki", "Bengali", false, "ready"],
  ["Malee S.", 63, "H", "Pasila", "Thai", true, "ready"],
  ["Seppo V.", 70, "H", "Munkkiniemi", "", false, "negative"],
  ["Halima D.", 64, "H", "Kallio", "Somali", true, "booked"],
  // North-east Helsinki
  ["Omar B.", 68, "H", "Malmi", "Arabic", true, "ready"],
  ["Lyudmila P.", 71, "H", "Malmi", "Russian", false, "ready"],
  ["Dilnoza A.", 57, "H", "Pihlajamäki", "Uzbek", false, "ready"],
  ["Hussein J.", 62, "H", "Jakomäki", "Arabic", true, "ready"],
  ["Sahra G.", 60, "H", "Jakomäki", "Somali", true, "ready"],
  ["Priit M.", 65, "H", "Tapanila", "Estonian", false, "ready"],
  ["Rajesh P.", 59, "H", "Oulunkylä", "Hindi", false, "ready"],
  ["Mulugeta T.", 66, "H", "Puistola", "Amharic", true, "ready"],
  ["Azad R.", 63, "H", "Puistola", "Kurdish", false, "late"],
  ["Ritva H.", 68, "H", "Oulunkylä", "", false, "invited"],
  // Vantaa
  ["Natalia V.", 61, "V", "Hakunila", "Russian", false, "ready"],
  ["Shukri A.", 58, "V", "Hakunila", "Somali", true, "ready"],
  ["Besnik H.", 67, "V", "Koivukylä", "Albanian", true, "ready"],
  ["Kristiina O.", 64, "V", "Koivukylä", "Estonian", false, "ready"],
  ["Tran V. M.", 70, "V", "Tikkurila", "Vietnamese", true, "ready"],
  ["Imran S.", 60, "V", "Tikkurila", "Urdu", false, "ready"],
  ["Grace N.", 59, "V", "Korso", "Swahili", false, "ready"],
  ["Andrei C.", 66, "V", "Korso", "Romanian", false, "ready"],
  ["Maryam K.", 62, "V", "Hakunila", "Persian", true, "positive"],
  ["Ibrahim E.", 71, "V", "Tikkurila", "Arabic", true, "late"],
  ["Oksana H.", 57, "V", "Myyrmäki", "Ukrainian", false, "ready"],
  ["Deniz A.", 63, "V", "Myyrmäki", "Turkish", false, "ready"],
  ["Wei Z.", 68, "V", "Martinlaakso", "Chinese", true, "ready"],
  ["Samuel O.", 60, "V", "Martinlaakso", "Yoruba", false, "ready"],
  ["Jelena M.", 65, "V", "Kivistö", "Serbian", false, "ready"],
  ["Mustafa C.", 69, "V", "Myyrmäki", "Kurdish", true, "booked"],
  // North-west Helsinki and Leppävaara
  ["Hawa B.", 61, "H", "Malminkartano", "Somali", true, "ready"],
  ["Pavel K.", 64, "H", "Kannelmäki", "Russian", false, "ready"],
  ["Lakshmi N.", 58, "E", "Leppävaara", "Tamil", false, "ready"],
  ["Amir T.", 67, "H", "Kannelmäki", "Persian", false, "lab"],
  // Espoo
  ["Zhang M.", 60, "E", "Matinkylä", "Chinese", false, "ready"],
  ["Fatima E.", 63, "E", "Matinkylä", "Arabic", true, "ready"],
  ["Svetlana G.", 66, "E", "Espoonlahti", "Russian", false, "ready"],
  ["Bashir A.", 59, "E", "Kivenlahti", "Dari", true, "ready"],
  ["Jaan P.", 70, "E", "Kivenlahti", "Estonian", false, "ready"],
  ["Anil K.", 62, "E", "Olari", "Hindi", false, "ready"],
  ["Sofia R.", 57, "E", "Tapiola", "Spanish", false, "ready"],
  ["Nimo H.", 64, "E", "Espoon keskus", "Somali", true, "ready"],
  ["Petrit D.", 68, "E", "Espoon keskus", "Albanian", true, "positiveLate"],
  ["Yuki T.", 61, "E", "Tapiola", "Japanese", false, "negative"],
  ["Björn S.", 69, "E", "Olari", "Swedish", false, "invited"],
];

function moreEvents(kind: Kind, i: number): [EventType, number, string?][] {
  const j = i % 5; // spreads dates a little so rows do not all read the same
  switch (kind) {
    case "ready":
      return [["invited", d(7 + j)], ["sampleTaken", 0.5 + ((i * 37) % 70) / 10]];
    case "invited":
      return [["invited", d(2 + j)]];
    case "late":
      return [["invited", d(17 + j * 3)], ["reminderSent", d(5 + j)]];
    case "lab":
      return [["invited", d(12 + j)], ["sampleTaken", d(3)], ["pickedUp", d(2)], ["atLab", d(2)]];
    case "positive":
      return [["invited", d(28 + j)], ["sampleTaken", d(16)], ["pickedUp", d(15)], ["atLab", d(15)], ["resultPositive", d(2 + (j % 3))]];
    case "positiveLate":
      return [["invited", d(36 + j)], ["sampleTaken", d(26)], ["pickedUp", d(24)], ["atLab", d(24)], ["resultPositive", d(8 + j)]];
    case "booked":
      return [["invited", d(40 + j)], ["sampleTaken", d(30)], ["pickedUp", d(28)], ["atLab", d(28)], ["resultPositive", d(13)],
        ["colonoscopyBooked", d(11), "Wed 25 Nov 10:30"]];
    case "negative":
      return [["invited", d(44 + j)], ["sampleTaken", d(36)], ["pickedUp", d(34)], ["atLab", d(34)], ["resultNegative", d(19)]];
  }
}

const ALL: Spec[] = [
  ...SPECS,
  ...MORE.map(([name, age, muni, area, tongue, interp, kind], i): Spec => ({
    id: `x${i + 1}`,
    name,
    age,
    municipality: MUNI[muni],
    area,
    lang: tongue === "" || tongue === "Estonian" ? "fi" : tongue === "Swedish" ? "sv" : "en",
    ...(tongue && tongue !== "Swedish" ? { homeLanguage: tongue } : {}),
    ...(interp ? { interpreter: tongue } : {}),
    events: moreEvents(kind, i),
  })),
];

export function seedSamples(now: number): Sample[] {
  return ALL.map((p) => ({
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
