/**
 * The home-sample app's structure: which tests exist, which animation each step shows, the sources,
 * and the languages. The words themselves live in ./text/<lang>.ts, one file per language, so a
 * translator can own and review one file. The QR code on the envelope opens /kit.
 *
 * Sources:
 * - Stool test steps: HUS, "Ohje näytteen ottamiseen, esitietojen täyttämiseen ja palautukseen"
 *   (10.12.2025), https://www.hus.fi/sites/default/files/2025-12/ohje-suolistosyovan-seulonnan-naytteen-ottamiseen-ja-esitietojen-tayttamiseen-ja-palautukseen.pdf
 *   Every step follows the leaflet's instructions in order, in our own words. Storage at room
 *   temperature and return by the next working day: HUS's bowel screening page (READ_MORE.fi).
 *   The robot replaces the HUS laboratory return box or the post.
 * - "Why this matters": the sources listed below.
 */
import { ar } from "./text/ar";
import { en } from "./text/en";
import { et } from "./text/et";
import { fa } from "./text/fa";
import { fi } from "./text/fi";
import { ru } from "./text/ru";
import { so } from "./text/so";
import { sv } from "./text/sv";
import { uk } from "./text/uk";

export type Anim =
  | "unbag" | "base" | "twist" | "scrape" | "click" | "shake" | "label" | "rebag" | "form" | "envelope"
  | "robotArrive" | "robotUnlock" | "robotPlace" | "robotClose" | "robotLeave";

/** One animation per sampling step, in order. Every language's step texts follow this order. */
export const STEP_ANIMS: Anim[] = ["unbag", "base", "twist", "scrape", "click", "shake", "label", "rebag", "form", "envelope"];

/** The robot hand-over, after the S-kaupat delivery robots (Starship): notified, walk out, unlock in the app, use the compartment, close the lid. */
export const ROBOT_ANIMS: Anim[] = ["robotArrive", "robotUnlock", "robotPlace", "robotClose"];

export type Source = { label: string; url: string };

export const SOURCES: Source[] = [
  { label: "Cochrane review of stool-test screening trials (Hewitson et al., 2007)", url: "https://doi.org/10.1002/14651858.CD001216.pub2" },
  { label: "American Cancer Society: colorectal cancer survival by stage", url: "https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/survival-rates.html" },
  { label: "HUS: colorectal cancer screening", url: "https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february" },
  { label: "HUS: sampling, background information and return instructions (PDF)", url: "https://www.hus.fi/sites/default/files/2025-12/ohje-suolistosyovan-seulonnan-naytteen-ottamiseen-ja-esitietojen-tayttamiseen-ja-palautukseen.pdf" },
];

/** HUS's own page on bowel cancer screening and what happens after the sample, in the languages HUS publishes it in. */
export const READ_MORE: Partial<Record<KitLang, string>> & { en: string } = {
  fi: "https://www.hus.fi/potilaalle/hoidot-ja-tutkimukset/suolistosyovan-seulonta",
  sv: "https://www.hus.fi/sv/patienten/behandlingar-och-undersokningar/screening-tarmcancer",
  en: "https://www.hus.fi/en/patient/treatments-and-examinations/colorectal-cancer-screening",
};

export type StepText = { title: string; body?: string };

export type TestText = {
  /** The service, e.g. "Bowel cancer screening". */
  name: string;
  /** The first thing the person reads. */
  invited: string;
  intro: string;
  facts: [string, string, string];
  why: { lead: string; points: [string, string, string]; close: string };
  steps: StepText[];
  resultWait: string;
  negative: StepText;
  positive: StepText;
};

export type Ui = {
  chooseLang: string;
  langLabel: string;
  invitedSub: string;
  aboutTitle: string;
  why: string;
  whyTitle: string;
  sources: string;
  close: string;
  howTitle: string;
  howSample: string;
  howRobot: string;
  startSampling: string;
  stepOf: (i: number, n: number) => string;
  next: string;
  back: string;
  sampleDone: string;
  bookTitle: string;
  bookBody: string;
  asap: string;
  asapNote: string;
  today: string;
  tomorrow: string;
  noTimesToday: string;
  confirm: (slot: string) => string;
  /** Why the app asks for location before it sends the robot. */
  locationWhy: string;
  locating: string;
  locationDenied: string;
  tryAgain: string;
  pickTime: string;
  onTheWay: string;
  /** Seconds until the robot reaches the door. */
  arrivesIn: (seconds: number) => string;
  almostThere: string;
  from: string;
  /** A short label: how many times faster than real the demo robot drives. */
  spedUp: (times: number) => string;
  mapError: string;
  arrived: string;
  arrivedBody: string;
  openLid: string;
  lidClosed: string;
  thanksTitle: string;
  /** Link text to the official page on what happens next. */
  readMore: string;
  /** The demo's way back to the start, offered once the flow is over. */
  restartDemo: string;
  thanksBody: string;
  hub: string;
  home: string;
  /** A pickup booked for a later window. */
  scheduledTitle: string;
  scheduledBody: string;
  sendNow: string;
};

export type KitText = { ui: Ui; test: TestText; robot: StepText[] };

export type KitLang = "fi" | "sv" | "en" | "ru" | "et" | "ar" | "uk" | "so" | "fa";

/**
 * The national languages and English, then the largest foreign-language groups in Finland
 * (Statistics Finland). HUS publishes its sampling leaflet in Finnish, Swedish and English; the other
 * translations have not been checked by a professional translator yet (see each text file's note).
 */
export const KIT_LANGS: { code: KitLang; native: string; dir: "ltr" | "rtl"; locale: string }[] = [
  { code: "fi", native: "Suomi", dir: "ltr", locale: "fi-FI" },
  { code: "sv", native: "Svenska", dir: "ltr", locale: "sv-FI" },
  { code: "en", native: "English", dir: "ltr", locale: "en-GB" },
  { code: "ru", native: "Русский", dir: "ltr", locale: "ru-RU" },
  { code: "et", native: "Eesti", dir: "ltr", locale: "et-EE" },
  { code: "ar", native: "العربية", dir: "rtl", locale: "ar" },
  { code: "uk", native: "Українська", dir: "ltr", locale: "uk-UA" },
  { code: "so", native: "Soomaali", dir: "ltr", locale: "so-SO" },
  { code: "fa", native: "فارسی", dir: "rtl", locale: "fa-IR" },
];

export const TEXT: Record<KitLang, KitText> = { fi, sv, en, ru, et, ar, uk, so, fa };

export function isKitLang(v: string | null): v is KitLang {
  return KIT_LANGS.some((l) => l.code === v);
}

export function langInfo(code: KitLang) {
  return KIT_LANGS.find((l) => l.code === code)!;
}
