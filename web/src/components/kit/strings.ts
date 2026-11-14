import type { Lang } from "@/lib/sample/model";

export type KitStrings = {
  steps: [string, string, string, string, string];
  progress: string;
  greeting: (first: string) => string;
  langLabel: string;
  welcomeTitle: string;
  welcomeBody: string;
  facts: string[];
  ready: string;
  takeTitle: string;
  takeSteps: string[];
  taken: string;
  bookTitle: string;
  bookBody: string;
  today: string;
  tomorrow: string;
  enRouteTitle: string;
  robotLeft: string;
  arrivesIn: (time: string) => string;
  mapTo: string;
  nowDemo: string;
  laterNote: string;
  lab: string;
  home: string;
  pickupAt: (slot: string) => string;
  doorTitle: string;
  doorBody: string;
  codeLabel: string;
  putIn: string;
  labTitle: string;
  labBody: string;
  negTitle: string;
  negBody: string;
  posTitle: string;
  posBody: string;
  posChoose: string;
  interpreter: string;
  bookedTitle: string;
  bookedBody: (slot: string) => string;
  reminder: string;
  remind: string;
  doneTitle: string;
  doneBody: string;
  demoLine: string;
  restart: string;
  ask: { toggle: string; placeholder: string; send: string; badgeAi: string; badgeStandard: string; else: string };
};

const en: KitStrings = {
  steps: ["Kit", "Sample", "Pickup", "Lab", "Result"],
  progress: "Progress",
  greeting: (n) => `Hello ${n}`,
  langLabel: "Language",
  welcomeTitle: "Your bowel screening kit",
  welcomeBody:
    "Screening looks for hidden blood in a stool sample. It is offered every two years to people aged 56–74.",
  facts: ["Free of charge", "No preparation or fasting needed", "Results within about a month"],
  ready: "I'm ready",
  takeTitle: "Take the sample at home",
  takeSteps: [
    "Follow the leaflet in your kit.",
    "Write the date on the tube.",
    "Close the tube and put it in its bag.",
  ],
  taken: "I've taken the sample",
  bookTitle: "Book a pickup",
  bookBody: "A robot collects the sample from your door. Choose a time window.",
  today: "Today",
  tomorrow: "Tomorrow",
  enRouteTitle: "The robot is on its way",
  robotLeft: "The robot left the lab.",
  arrivesIn: (t) => `Arrives in ${t}`,
  mapTo: "to",
  nowDemo: "Now (demo)",
  laterNote: "Demo: the robot comes right away.",
  lab: "Lab",
  home: "Home",
  pickupAt: (s) => `Pickup window: ${s}`,
  doorTitle: "The robot is at your door",
  doorBody: "The robot is at your door. Code 4 8 1 2 opens its box.",
  codeLabel: "Code",
  putIn: "I put the sample in",
  labTitle: "Your sample is at the lab",
  labBody: "Your sample is at the lab. Results within about a month (demo: the nurse records the result).",
  negTitle: "Result: no blood found",
  negBody: "No blood found. Next invitation in two years.",
  posTitle: "Result: blood was found",
  posBody:
    "Blood was found. This is common, about 4 in 100 samples. The usual next step is a colonoscopy.",
  posChoose: "Choose a time for the colonoscopy",
  interpreter: "I need an interpreter",
  bookedTitle: "Colonoscopy booked",
  bookedBody: (s) => `Your colonoscopy: ${s}`,
  reminder: "The unit will contact you with the details of your visit.",
  remind: "Läpi will remind you the day before.",
  doneTitle: "Colonoscopy done",
  doneBody: "Colonoscopy done. The unit will tell you the findings.",
  demoLine: "Demo: invented people; the robot, lab and bookings are simulated.",
  restart: "Restart the demo",
  ask: {
    toggle: "Ask a question in your own language",
    placeholder: "E.g. Can I take the sample during my period?",
    send: "Send",
    badgeAi: "Answered by AI from the screening facts",
    badgeStandard: "Standard answer",
    else: "For anything else, call the screening unit.",
  },
};

const fi: KitStrings = {
  steps: ["Pakkaus", "Näyte", "Nouto", "Labra", "Tulos"],
  progress: "Eteneminen",
  greeting: (n) => `Hei ${n}`,
  langLabel: "Kieli",
  welcomeTitle: "Suolistosyövän seulontapakkauksesi",
  welcomeBody:
    "Seulonnassa etsitään ulostenäytteestä piilevää verta. Seulontaan kutsutaan joka toinen vuosi 56–74-vuotiaat.",
  facts: ["Maksuton", "Ei valmisteluja eikä paastoa", "Tulos noin kuukaudessa"],
  ready: "Olen valmis",
  takeTitle: "Ota näyte kotona",
  takeSteps: [
    "Noudata pakkauksen ohjetta.",
    "Kirjoita päivämäärä putkeen.",
    "Sulje putki ja laita se pussiinsa.",
  ],
  taken: "Olen ottanut näytteen",
  bookTitle: "Varaa nouto",
  bookBody: "Robotti hakee näytteen ovelta. Valitse aika.",
  today: "Tänään",
  tomorrow: "Huomenna",
  enRouteTitle: "Robotti on matkalla",
  robotLeft: "Robotti lähti laboratoriosta.",
  arrivesIn: (t) => `Saapuu ${t} kuluttua`,
  mapTo: "–",
  nowDemo: "Nyt (demo)",
  laterNote: "Demo: robotti tulee heti.",
  lab: "Laboratorio",
  home: "Koti",
  pickupAt: (s) => `Noutoaika: ${s}`,
  doorTitle: "Robotti on ovellasi",
  doorBody: "Robotti on ovellasi. Koodi 4 8 1 2 avaa sen laatikon.",
  codeLabel: "Koodi",
  putIn: "Laitoin näytteen sisään",
  labTitle: "Näytteesi on laboratoriossa",
  labBody: "Näytteesi on laboratoriossa. Tulos tulee noin kuukaudessa (demo: hoitaja kirjaa tuloksen).",
  negTitle: "Tulos: verta ei löytynyt",
  negBody: "Verta ei löytynyt. Seuraava kutsu tulee kahden vuoden päästä.",
  posTitle: "Tulos: verta löytyi",
  posBody:
    "Verta löytyi. Se on tavallista, noin 4 näytteessä sadasta. Tavallinen jatkotutkimus on paksunsuolen tähystys.",
  posChoose: "Valitse aika tähystykseen",
  interpreter: "Tarvitsen tulkin",
  bookedTitle: "Tähystys varattu",
  bookedBody: (s) => `Tähystyksesi: ${s}`,
  reminder: "Yksikkö ottaa sinuun yhteyttä käyntisi tiedoilla.",
  remind: "Läpi muistuttaa sinua edellisenä päivänä.",
  doneTitle: "Tähystys tehty",
  doneBody: "Tähystys on tehty. Yksikkö kertoo löydökset.",
  demoLine: "Demo: kuvitellut henkilöt; robotti, laboratorio ja varaukset ovat simuloituja.",
  restart: "Aloita demo alusta",
  ask: {
    toggle: "Kysy omalla kielellä",
    placeholder: "Esim. Saako näytteen ottaa kuukautisten aikana?",
    send: "Lähetä",
    badgeAi: "Tekoälyn vastaus seulonnan tietojen pohjalta",
    badgeStandard: "Vakiovastaus",
    else: "Muissa asioissa soita seulontayksikköön.",
  },
};

const sv: KitStrings = {
  steps: ["Kit", "Prov", "Hämtning", "Labb", "Svar"],
  progress: "Framsteg",
  greeting: (n) => `Hej ${n}`,
  langLabel: "Språk",
  welcomeTitle: "Ditt kit för tarmscreening",
  welcomeBody:
    "Screeningen letar efter dolt blod i ett avföringsprov. Den erbjuds vartannat år till personer i åldern 56–74.",
  facts: ["Kostnadsfritt", "Ingen förberedelse eller fasta", "Svar inom ungefär en månad"],
  ready: "Jag är redo",
  takeTitle: "Ta provet hemma",
  takeSteps: [
    "Följ anvisningen i ditt kit.",
    "Skriv datumet på röret.",
    "Stäng röret och lägg det i påsen.",
  ],
  taken: "Jag har tagit provet",
  bookTitle: "Boka hämtning",
  bookBody: "En robot hämtar provet vid din dörr. Välj en tid.",
  today: "I dag",
  tomorrow: "I morgon",
  enRouteTitle: "Roboten är på väg",
  robotLeft: "Roboten lämnade labbet.",
  arrivesIn: (t) => `Framme om ${t}`,
  mapTo: "till",
  nowDemo: "Nu (demo)",
  laterNote: "Demo: roboten kommer direkt.",
  lab: "Labb",
  home: "Hem",
  pickupAt: (s) => `Hämtningstid: ${s}`,
  doorTitle: "Roboten är vid din dörr",
  doorBody: "Roboten är vid din dörr. Kod 4 8 1 2 öppnar lådan.",
  codeLabel: "Kod",
  putIn: "Jag har lagt i provet",
  labTitle: "Ditt prov är på labbet",
  labBody: "Ditt prov är på labbet. Svar inom ungefär en månad (demo: sjuksköterskan registrerar svaret).",
  negTitle: "Svar: inget blod hittades",
  negBody: "Inget blod hittades. Nästa kallelse kommer om två år.",
  posTitle: "Svar: blod hittades",
  posBody:
    "Blod hittades. Det är vanligt, i ungefär 4 prov av 100. Nästa steg är vanligen en koloskopi.",
  posChoose: "Välj tid för koloskopin",
  interpreter: "Jag behöver tolk",
  bookedTitle: "Koloskopi bokad",
  bookedBody: (s) => `Din koloskopi: ${s}`,
  reminder: "Enheten kontaktar dig med uppgifter om ditt besök.",
  remind: "Läpi påminner dig dagen före.",
  doneTitle: "Koloskopin är gjord",
  doneBody: "Koloskopin är gjord. Enheten berättar vad som hittades.",
  demoLine: "Demo: påhittade personer; roboten, labbet och bokningarna är simulerade.",
  restart: "Starta om demon",
  ask: {
    toggle: "Ställ en fråga på ditt eget språk",
    placeholder: "T.ex. Får jag ta provet under mensen?",
    send: "Skicka",
    badgeAi: "Svar från AI utifrån screeningfakta",
    badgeStandard: "Standardsvar",
    else: "För allt annat, ring screeningenheten.",
  },
};

export const STRINGS: Record<Lang, KitStrings> = { fi, sv, en };
export const LOCALES: Record<Lang, string> = { fi: "fi-FI", sv: "sv-FI", en: "en-GB" };
