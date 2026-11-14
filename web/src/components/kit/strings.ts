import type { Lang } from "@/lib/sample/model";

export type KitStrings = {
  steps: [string, string, string, string, string];
  progress: string;
  greeting: (first: string) => string;
  langLabel: string;
  letter: {
    sender: string;
    to: string;
    programmeBowel: string;
    programmeCervical: string;
    inviteBowel: string;
    inviteCervical: string;
    scan: string;
    demoCode: string;
    open: string;
    date: string;
  };
  welcomeTitleBowel: string;
  welcomeBodyBowel: string;
  factsBowel: string[];
  welcomeTitleCervical: string;
  welcomeBodyCervical: string;
  sourceLink: string;
  nextTitle: string;
  nextBowel: string[];
  nextCervical: string[];
  bookCta: string;
  bookTitleBowel: string;
  bookTitleCervical: string;
  bookTitleChange: string;
  bookBodyBowel: string;
  bookBodyCervical: string;
  clinicName: string;
  today: string;
  tomorrow: string;
  nowDemo: string;
  yourPickup: (slot: string) => string;
  robotLeavesAt: (hhmm: string) => string;
  sendNow: string;
  takeTitle: string;
  takeSteps: string[];
  taken: string;
  takenDone: string;
  notTakenYet: string;
  rebook: string;
  cancel: string;
  cancelAsk: string;
  yes: string;
  no: string;
  back: string;
  apptTitle: string;
  apptBring: string;
  clinicVisit: string;
  enRouteTitle: string;
  robotLeft: string;
  arrivesIn: (time: string) => string;
  mapTo: string;
  lab: string;
  home: string;
  doorTitle: string;
  doorBody: string;
  codeLabel: string;
  putIn: string;
  labTitle: string;
  labBodyBowel: string;
  labBodyCervical: string;
  negTitle: string;
  negBodyBowel: string;
  negBodyCervical: string;
  posTitleBowel: string;
  posBodyBowel: string;
  posChooseBowel: string;
  posTitleCervical: string;
  posBodyCervical: string;
  posChooseCervical: string;
  interpreter: string;
  bookedTitleBowel: string;
  bookedBodyBowel: (slot: string) => string;
  bookedTitleCervical: string;
  bookedBodyCervical: (slot: string) => string;
  reminder: string;
  remind: string;
  doneTitleBowel: string;
  doneBodyBowel: string;
  doneTitleCervical: string;
  doneBodyCervical: string;
  demoLine: string;
  restart: string;
  ask: { toggle: string; placeholder: string; send: string; badgeAi: string; badgeStandard: string; else: string };
};

const en: KitStrings = {
  steps: ["Letter", "Booking", "Sample", "Lab", "Result"],
  progress: "Progress",
  greeting: (n) => `Hello ${n}`,
  langLabel: "Language",
  letter: {
    sender: "Screening unit (demo)",
    to: "To",
    programmeBowel: "bowel cancer",
    programmeCervical: "cervical cancer",
    inviteBowel: "You are invited to bowel cancer screening.",
    inviteCervical: "You are invited to cervical cancer screening.",
    scan: "Scan the code to book.",
    demoCode: "Demo code",
    open: "Open",
    date: "Date",
  },
  welcomeTitleBowel: "Your bowel screening",
  welcomeBodyBowel:
    "Screening looks for hidden blood in a stool sample. It is offered every two years to people aged 56–74.",
  factsBowel: ["Free of charge", "No preparation or fasting needed", "Results within about a month"],
  welcomeTitleCervical: "Your cervical screening",
  welcomeBodyCervical:
    "Cervical screening is offered every five years to women aged 30–60 (Government Decree 339/2011, as amended).",
  sourceLink: "Source: Finlex",
  nextTitle: "Next steps",
  nextBowel: ["Book a pickup time", "Take the sample at home", "The robot collects it", "Result in about a month"],
  nextCervical: ["Book a clinic time", "Visit the clinic", "Result"],
  bookCta: "Book a time",
  bookTitleBowel: "Book a pickup",
  bookTitleCervical: "Book a clinic time",
  bookTitleChange: "Change your booking",
  bookBodyBowel: "A robot collects the sample from your door. Choose a time window.",
  bookBodyCervical: "Choose a time at the clinic.",
  clinicName: "Lahti health centre (demo)",
  today: "Today",
  tomorrow: "Tomorrow",
  nowDemo: "Now (demo)",
  yourPickup: (s) => `Your pickup: ${s}`,
  robotLeavesAt: (t) => `Robot leaves at ${t}`,
  sendNow: "Send the robot now (demo)",
  takeTitle: "Take the sample at home",
  takeSteps: [
    "Follow the leaflet in your kit.",
    "Write the date on the tube.",
    "Close the tube and put it in its bag.",
  ],
  taken: "I've taken the sample",
  takenDone: "Sample taken",
  notTakenYet: "You have not marked the sample as taken. Take it before the robot arrives.",
  rebook: "Change booking",
  cancel: "Cancel booking",
  cancelAsk: "Cancel booking?",
  yes: "Yes",
  no: "No",
  back: "Back",
  apptTitle: "Your clinic visit",
  apptBring: "Bring this phone; the nurse takes the sample.",
  clinicVisit: "The clinic records your visit (demo)",
  enRouteTitle: "The robot is on its way",
  robotLeft: "The robot left the lab.",
  arrivesIn: (t) => `Arrives in ${t}`,
  mapTo: "to",
  lab: "Lab",
  home: "Home",
  doorTitle: "The robot is at your door",
  doorBody: "The robot is at your door. Code 4 8 1 2 opens its box.",
  codeLabel: "Code",
  putIn: "I put the sample in",
  labTitle: "Your sample is at the lab",
  labBodyBowel: "Your sample is at the lab. Results within about a month (demo: the nurse records the result).",
  labBodyCervical: "Your sample is at the lab. (Demo: the nurse records the result.)",
  negTitle: "Result: no changes found",
  negBodyBowel: "No blood found. Next invitation in two years.",
  negBodyCervical: "No changes found. Next invitation in five years.",
  posTitleBowel: "Result: blood was found",
  posBodyBowel:
    "Blood was found. This is common, about 4 in 100 samples. The usual next step is a colonoscopy.",
  posChooseBowel: "Choose a time for the colonoscopy",
  posTitleCervical: "Result: follow-up needed",
  posBodyCervical: "The sample needs a follow-up visit.",
  posChooseCervical: "Choose a time for the follow-up visit",
  interpreter: "I need an interpreter",
  bookedTitleBowel: "Colonoscopy booked",
  bookedBodyBowel: (s) => `Your colonoscopy: ${s}`,
  bookedTitleCervical: "Follow-up visit booked",
  bookedBodyCervical: (s) => `Your follow-up visit: ${s}`,
  reminder: "The unit will contact you with the details of your visit.",
  remind: "Läpi will remind you the day before.",
  doneTitleBowel: "Colonoscopy done",
  doneBodyBowel: "Colonoscopy done. The unit will tell you the findings.",
  doneTitleCervical: "Follow-up visit done",
  doneBodyCervical: "Follow-up visit done. The unit will tell you the next steps.",
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
  steps: ["Kirje", "Varaus", "Näyte", "Labra", "Tulos"],
  progress: "Eteneminen",
  greeting: (n) => `Hei ${n}`,
  langLabel: "Kieli",
  letter: {
    sender: "Seulontayksikkö (demo)",
    to: "Vastaanottaja",
    programmeBowel: "suolistosyövän",
    programmeCervical: "kohdunkaulansyövän",
    inviteBowel: "Sinut on kutsuttu suolistosyövän seulontaan.",
    inviteCervical: "Sinut on kutsuttu kohdunkaulansyövän seulontaan.",
    scan: "Varaa aika skannaamalla koodi.",
    demoCode: "Demokoodi",
    open: "Avaa",
    date: "Päivämäärä",
  },
  welcomeTitleBowel: "Suolistosyövän seulontasi",
  welcomeBodyBowel:
    "Seulonnassa etsitään ulostenäytteestä piilevää verta. Seulontaan kutsutaan joka toinen vuosi 56–74-vuotiaat.",
  factsBowel: ["Maksuton", "Ei valmisteluja eikä paastoa", "Tulos noin kuukaudessa"],
  welcomeTitleCervical: "Kohdunkaulansyövän seulontasi",
  welcomeBodyCervical:
    "Kohdunkaulansyövän seulontaa tarjotaan viiden vuoden välein 30–60-vuotiaille naisille (valtioneuvoston asetus 339/2011, muutoksineen).",
  sourceLink: "Lähde: Finlex",
  nextTitle: "Seuraavat vaiheet",
  nextBowel: ["Varaa noutoaika", "Ota näyte kotona", "Robotti hakee sen", "Tulos noin kuukaudessa"],
  nextCervical: ["Varaa aika klinikalle", "Käy klinikalla", "Tulos"],
  bookCta: "Varaa aika",
  bookTitleBowel: "Varaa nouto",
  bookTitleCervical: "Varaa aika klinikalle",
  bookTitleChange: "Muuta varaustasi",
  bookBodyBowel: "Robotti hakee näytteen ovelta. Valitse aika.",
  bookBodyCervical: "Valitse aika klinikalta.",
  clinicName: "Lahden terveysasema (demo)",
  today: "Tänään",
  tomorrow: "Huomenna",
  nowDemo: "Nyt (demo)",
  yourPickup: (s) => `Noutosi: ${s}`,
  robotLeavesAt: (t) => `Robotti lähtee klo ${t}`,
  sendNow: "Lähetä robotti nyt (demo)",
  takeTitle: "Ota näyte kotona",
  takeSteps: [
    "Noudata pakkauksen ohjetta.",
    "Kirjoita päivämäärä putkeen.",
    "Sulje putki ja laita se pussiinsa.",
  ],
  taken: "Olen ottanut näytteen",
  takenDone: "Näyte otettu",
  notTakenYet: "Et ole merkinnyt näytettä otetuksi. Ota se ennen kuin robotti saapuu.",
  rebook: "Muuta varausta",
  cancel: "Peru varaus",
  cancelAsk: "Perutaanko varaus?",
  yes: "Kyllä",
  no: "Ei",
  back: "Takaisin",
  apptTitle: "Käyntisi klinikalla",
  apptBring: "Ota tämä puhelin mukaan; hoitaja ottaa näytteen.",
  clinicVisit: "Klinikka kirjaa käyntisi (demo)",
  enRouteTitle: "Robotti on matkalla",
  robotLeft: "Robotti lähti laboratoriosta.",
  arrivesIn: (t) => `Saapuu ${t} kuluttua`,
  mapTo: "–",
  lab: "Laboratorio",
  home: "Koti",
  doorTitle: "Robotti on ovellasi",
  doorBody: "Robotti on ovellasi. Koodi 4 8 1 2 avaa sen laatikon.",
  codeLabel: "Koodi",
  putIn: "Laitoin näytteen sisään",
  labTitle: "Näytteesi on laboratoriossa",
  labBodyBowel: "Näytteesi on laboratoriossa. Tulos tulee noin kuukaudessa (demo: hoitaja kirjaa tuloksen).",
  labBodyCervical: "Näytteesi on laboratoriossa. (Demo: hoitaja kirjaa tuloksen.)",
  negTitle: "Tulos: muutoksia ei löytynyt",
  negBodyBowel: "Verta ei löytynyt. Seuraava kutsu tulee kahden vuoden päästä.",
  negBodyCervical: "Muutoksia ei löytynyt. Seuraava kutsu tulee viiden vuoden päästä.",
  posTitleBowel: "Tulos: verta löytyi",
  posBodyBowel:
    "Verta löytyi. Se on tavallista, noin 4 näytteessä sadasta. Tavallinen jatkotutkimus on paksunsuolen tähystys.",
  posChooseBowel: "Valitse aika tähystykseen",
  posTitleCervical: "Tulos: jatkokäynti tarvitaan",
  posBodyCervical: "Näyte vaatii jatkokäynnin.",
  posChooseCervical: "Valitse aika jatkokäynnille",
  interpreter: "Tarvitsen tulkin",
  bookedTitleBowel: "Tähystys varattu",
  bookedBodyBowel: (s) => `Tähystyksesi: ${s}`,
  bookedTitleCervical: "Jatkokäynti varattu",
  bookedBodyCervical: (s) => `Jatkokäyntisi: ${s}`,
  reminder: "Yksikkö ottaa sinuun yhteyttä käyntisi tiedoilla.",
  remind: "Läpi muistuttaa sinua edellisenä päivänä.",
  doneTitleBowel: "Tähystys tehty",
  doneBodyBowel: "Tähystys on tehty. Yksikkö kertoo löydökset.",
  doneTitleCervical: "Jatkokäynti tehty",
  doneBodyCervical: "Jatkokäynti on tehty. Yksikkö kertoo jatkosta.",
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
  steps: ["Brev", "Bokning", "Prov", "Labb", "Svar"],
  progress: "Framsteg",
  greeting: (n) => `Hej ${n}`,
  langLabel: "Språk",
  letter: {
    sender: "Screeningenheten (demo)",
    to: "Till",
    programmeBowel: "tarmcancer",
    programmeCervical: "livmoderhalscancer",
    inviteBowel: "Du är kallad till screening för tarmcancer.",
    inviteCervical: "Du är kallad till screening för livmoderhalscancer.",
    scan: "Skanna koden för att boka.",
    demoCode: "Demokod",
    open: "Öppna",
    date: "Datum",
  },
  welcomeTitleBowel: "Din tarmscreening",
  welcomeBodyBowel:
    "Screeningen letar efter dolt blod i ett avföringsprov. Den erbjuds vartannat år till personer i åldern 56–74.",
  factsBowel: ["Kostnadsfritt", "Ingen förberedelse eller fasta", "Svar inom ungefär en månad"],
  welcomeTitleCervical: "Din screening för livmoderhalscancer",
  welcomeBodyCervical:
    "Screening för livmoderhalscancer erbjuds vart femte år till kvinnor i åldern 30–60 (statsrådets förordning 339/2011, med ändringar).",
  sourceLink: "Källa: Finlex",
  nextTitle: "Nästa steg",
  nextBowel: ["Boka hämtningstid", "Ta provet hemma", "Roboten hämtar det", "Svar inom ungefär en månad"],
  nextCervical: ["Boka tid på kliniken", "Besök kliniken", "Svar"],
  bookCta: "Boka tid",
  bookTitleBowel: "Boka hämtning",
  bookTitleCervical: "Boka tid på kliniken",
  bookTitleChange: "Ändra din bokning",
  bookBodyBowel: "En robot hämtar provet vid din dörr. Välj en tid.",
  bookBodyCervical: "Välj en tid på kliniken.",
  clinicName: "Lahtis hälsostation (demo)",
  today: "I dag",
  tomorrow: "I morgon",
  nowDemo: "Nu (demo)",
  yourPickup: (s) => `Din hämtning: ${s}`,
  robotLeavesAt: (t) => `Roboten åker kl. ${t}`,
  sendNow: "Skicka roboten nu (demo)",
  takeTitle: "Ta provet hemma",
  takeSteps: [
    "Följ anvisningen i ditt kit.",
    "Skriv datumet på röret.",
    "Stäng röret och lägg det i påsen.",
  ],
  taken: "Jag har tagit provet",
  takenDone: "Provet taget",
  notTakenYet: "Du har inte markerat provet som taget. Ta det innan roboten kommer.",
  rebook: "Ändra bokning",
  cancel: "Avboka",
  cancelAsk: "Avboka tiden?",
  yes: "Ja",
  no: "Nej",
  back: "Tillbaka",
  apptTitle: "Ditt besök på kliniken",
  apptBring: "Ta med den här telefonen; sjuksköterskan tar provet.",
  clinicVisit: "Kliniken registrerar ditt besök (demo)",
  enRouteTitle: "Roboten är på väg",
  robotLeft: "Roboten lämnade labbet.",
  arrivesIn: (t) => `Framme om ${t}`,
  mapTo: "till",
  lab: "Labb",
  home: "Hem",
  doorTitle: "Roboten är vid din dörr",
  doorBody: "Roboten är vid din dörr. Kod 4 8 1 2 öppnar lådan.",
  codeLabel: "Kod",
  putIn: "Jag har lagt i provet",
  labTitle: "Ditt prov är på labbet",
  labBodyBowel: "Ditt prov är på labbet. Svar inom ungefär en månad (demo: sjuksköterskan registrerar svaret).",
  labBodyCervical: "Ditt prov är på labbet. (Demo: sjuksköterskan registrerar svaret.)",
  negTitle: "Svar: inga förändringar hittades",
  negBodyBowel: "Inget blod hittades. Nästa kallelse kommer om två år.",
  negBodyCervical: "Inga förändringar hittades. Nästa kallelse kommer om fem år.",
  posTitleBowel: "Svar: blod hittades",
  posBodyBowel:
    "Blod hittades. Det är vanligt, i ungefär 4 prov av 100. Nästa steg är vanligen en koloskopi.",
  posChooseBowel: "Välj tid för koloskopin",
  posTitleCervical: "Svar: uppföljning behövs",
  posBodyCervical: "Provet kräver ett uppföljningsbesök.",
  posChooseCervical: "Välj tid för uppföljningsbesöket",
  interpreter: "Jag behöver tolk",
  bookedTitleBowel: "Koloskopi bokad",
  bookedBodyBowel: (s) => `Din koloskopi: ${s}`,
  bookedTitleCervical: "Uppföljningsbesök bokat",
  bookedBodyCervical: (s) => `Ditt uppföljningsbesök: ${s}`,
  reminder: "Enheten kontaktar dig med uppgifter om ditt besök.",
  remind: "Läpi påminner dig dagen före.",
  doneTitleBowel: "Koloskopin är gjord",
  doneBodyBowel: "Koloskopin är gjord. Enheten berättar vad som hittades.",
  doneTitleCervical: "Uppföljningsbesöket är gjort",
  doneBodyCervical: "Uppföljningsbesöket är gjort. Enheten berättar om fortsättningen.",
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
