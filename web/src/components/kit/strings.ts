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
  arrivesIn: string;
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
  interpreterNote: string;
  bookedTitle: string;
  bookedBody: (slot: string) => string;
  reminder: string;
  remind: string;
  doneTitle: string;
  doneBody: string;
  demoLine: string;
  restart: string;
};

const en: KitStrings = {
  steps: ["Kit", "Sample", "Pickup", "Lab", "Result"],
  progress: "Progress",
  greeting: (n) => `Hello ${n}`,
  langLabel: "Language",
  welcomeTitle: "Your bowel screening kit",
  welcomeBody:
    "Bowel cancer screening finds blood in a stool sample before there are any symptoms. It is the best way to catch problems early.",
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
  arrivesIn: "Arrives in",
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
    "Blood was found. This is common, about 4 in 100 samples, and usually not cancer, but it needs a colonoscopy.",
  posChoose: "Choose a time for the colonoscopy",
  interpreter: "I need an interpreter",
  interpreterNote: "Interpreter needed",
  bookedTitle: "Colonoscopy booked",
  bookedBody: (s) => `Your colonoscopy: ${s}`,
  reminder: "Bring a list of your medicines and someone to go home with if you can. The unit will send preparation instructions.",
  remind: "Läpi will remind you the day before.",
  doneTitle: "Colonoscopy done",
  doneBody: "Colonoscopy done. The unit will tell you the findings.",
  demoLine: "Demo: invented people; the robot, lab and bookings are simulated.",
  restart: "Restart the demo (staff view)",
};

const fi: KitStrings = {
  steps: ["Pakkaus", "Näyte", "Nouto", "Laboratorio", "Tulos"],
  progress: "Eteneminen",
  greeting: (n) => `Hei ${n}`,
  langLabel: "Kieli",
  welcomeTitle: "Suoliston seulontapakkauksesi",
  welcomeBody:
    "Suolistosyövän seulonta etsii ulostenäytteestä verta ennen kuin oireita on. Se on paras tapa löytää ongelmat ajoissa.",
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
  arrivesIn: "Perillä",
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
    "Verta löytyi. Se on tavallista, noin 4 näytteessä sadasta, eikä yleensä tarkoita syöpää, mutta tarvitset paksunsuolen tähystyksen.",
  posChoose: "Valitse aika tähystykseen",
  interpreter: "Tarvitsen tulkin",
  interpreterNote: "Tulkin tarve",
  bookedTitle: "Tähystys varattu",
  bookedBody: (s) => `Tähystyksesi: ${s}`,
  reminder: "Ota mukaan lista lääkkeistäsi ja mahdollisuuksien mukaan joku kotiin mukaan. Yksikkö lähettää valmisteluohjeet.",
  remind: "Läpi muistuttaa sinua edellisenä päivänä.",
  doneTitle: "Tähystys tehty",
  doneBody: "Tähystys on tehty. Yksikkö kertoo löydökset.",
  demoLine: "Demo: kuvitellut henkilöt; robotti, laboratorio ja varaukset ovat simuloituja.",
  restart: "Aloita demo alusta (henkilökunnan näkymä)",
};

const sv: KitStrings = {
  steps: ["Kit", "Prov", "Hämtning", "Labb", "Svar"],
  progress: "Framsteg",
  greeting: (n) => `Hej ${n}`,
  langLabel: "Språk",
  welcomeTitle: "Ditt kit för tarmscreening",
  welcomeBody:
    "Screening för tarmcancer letar efter blod i ett avföringsprov innan symtom uppstår. Det är bästa sättet att hitta problem i tid.",
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
  arrivesIn: "Framme om",
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
    "Blod hittades. Det är vanligt, i ungefär 4 prov av 100, och betyder oftast inte cancer, men du behöver en koloskopi.",
  posChoose: "Välj tid för koloskopin",
  interpreter: "Jag behöver tolk",
  interpreterNote: "Tolk behövs",
  bookedTitle: "Koloskopi bokad",
  bookedBody: (s) => `Din koloskopi: ${s}`,
  reminder: "Ta med en lista på dina läkemedel och om möjligt någon som följer dig hem. Enheten skickar anvisningar för förberedelse.",
  remind: "Läpi påminner dig dagen före.",
  doneTitle: "Koloskopin är gjord",
  doneBody: "Koloskopin är gjord. Enheten berättar vad som hittades.",
  demoLine: "Demo: påhittade personer; roboten, labbet och bokningarna är simulerade.",
  restart: "Starta om demon (personalvy)",
};

export const STRINGS: Record<Lang, KitStrings> = { fi, sv, en };
export const LOCALES: Record<Lang, string> = { fi: "fi-FI", sv: "sv-FI", en: "en-GB" };
