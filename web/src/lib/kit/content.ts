/**
 * The home-sample app's structure: which tests exist, which animation each step shows, the sources,
 * and the languages. The words themselves live in ./text/<lang>.ts, one file per language, so a
 * translator can own and review one file. The QR code on the envelope opens /kit?test=<kind>.
 *
 * Sources:
 * - Stool test steps: Fimlab, "Ulostenäytteen otto-ohje, suolistosyövän seulonta" (2026),
 *   https://fimlab.fi/suolistoseulonta. The robot replaces the post; the 24-hour rule is Fimlab's.
 * - HPV self-sample steps: the usual vaginal swab procedure (Hologic Aptima Multitest swab patient
 *   instructions), with timing from Fimlab's 2026 self-sampling leaflet. The app tells people to follow
 *   their own kit's leaflet where it differs.
 * - "Why this matters": the sources listed per test below.
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

export type TestKind = "fit" | "hpv";
export const TEST_KINDS: TestKind[] = ["fit", "hpv"];

export type Anim =
  | "unbag" | "base" | "twist" | "scrape" | "click" | "shake" | "label" | "rebag" | "form" | "envelope"
  | "wash" | "unwrap" | "insert" | "rotate" | "intube"
  | "robotArrive" | "robotUnlock" | "robotPlace" | "robotClose" | "robotLeave";

/** One animation per step, in order. Every language's step texts follow this order. */
export const STEP_ANIMS: Record<TestKind, Anim[]> = {
  fit: ["unbag", "base", "twist", "scrape", "click", "shake", "label", "rebag", "form", "envelope"],
  hpv: ["wash", "unwrap", "insert", "rotate", "intube", "label", "envelope"],
};

/** The robot hand-over, after the S-kaupat delivery robots (Starship): notified, walk out, unlock in the app, use the compartment, close the lid. */
export const ROBOT_ANIMS: Anim[] = ["robotArrive", "robotUnlock", "robotPlace", "robotClose"];

export type Source = { label: string; url: string };

export const SOURCES: Record<TestKind, Source[]> = {
  fit: [
    { label: "Cochrane review of stool-test screening trials (Hewitson et al., 2007)", url: "https://doi.org/10.1002/14651858.CD001216.pub2" },
    { label: "American Cancer Society: colorectal cancer survival by stage", url: "https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/survival-rates.html" },
    { label: "HUS: colorectal cancer screening", url: "https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february" },
    { label: "Fimlab: sampling instructions", url: "https://fimlab.fi/suolistoseulonta" },
  ],
  hpv: [
    { label: "Ronco et al., Lancet 2014: HPV vs cytology screening, four randomised trials", url: "https://doi.org/10.1016/S0140-6736(13)62218-7" },
    { label: "Arbyn et al., BMJ 2018: HPV testing on self-samples, meta-analysis", url: "https://doi.org/10.1136/bmj.k4823" },
    { label: "WHO: cervical cancer fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/cervical-cancer" },
    { label: "Fimlab: HPV self-sampling", url: "https://fimlab.fi/wp-content/uploads/2026/01/HPV-omanaytteenotto_2026_EN.pdf" },
  ],
};

export type StepText = { title: string; body?: string };

export type TestText = {
  /** The service, e.g. "Bowel cancer screening". */
  name: string;
  /** Short name for the demo kit switch. */
  short: string;
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
  /** Shown for languages a professional translator has not yet checked. */
  machineNote: string;
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
  pickTime: string;
  onTheWay: string;
  arrivesIn: (min: number) => string;
  almostThere: string;
  from: string;
  skip: string;
  mapError: string;
  arrived: string;
  arrivedBody: string;
  openLid: string;
  lidClosed: string;
  thanksTitle: string;
  thanksBody: string;
  demoLine: string;
  restart: string;
  otherKit: (name: string) => string;
  unknownTitle: string;
  unknownBody: string;
  hub: string;
  home: string;
};

export type KitText = { ui: Ui; tests: Record<TestKind, TestText>; robot: StepText[] };

export type KitLang = "fi" | "sv" | "en" | "ru" | "et" | "ar" | "uk" | "so" | "fa";

/**
 * The national languages and English, then the largest foreign-language groups in Finland
 * (Statistics Finland). `reviewed` is false until a professional translator has checked the file;
 * the app then shows that language's own `machineNote`.
 */
export const KIT_LANGS: { code: KitLang; native: string; dir: "ltr" | "rtl"; locale: string; reviewed: boolean }[] = [
  { code: "fi", native: "Suomi", dir: "ltr", locale: "fi-FI", reviewed: true },
  { code: "sv", native: "Svenska", dir: "ltr", locale: "sv-FI", reviewed: false },
  { code: "en", native: "English", dir: "ltr", locale: "en-GB", reviewed: true },
  { code: "ru", native: "Русский", dir: "ltr", locale: "ru-RU", reviewed: false },
  { code: "et", native: "Eesti", dir: "ltr", locale: "et-EE", reviewed: false },
  { code: "ar", native: "العربية", dir: "rtl", locale: "ar", reviewed: false },
  { code: "uk", native: "Українська", dir: "ltr", locale: "uk-UA", reviewed: false },
  { code: "so", native: "Soomaali", dir: "ltr", locale: "so-SO", reviewed: false },
  { code: "fa", native: "فارسی", dir: "rtl", locale: "fa-IR", reviewed: false },
];

export const TEXT: Record<KitLang, KitText> = { fi, sv, en, ru, et, ar, uk, so, fa };

export function isKitLang(v: string | null): v is KitLang {
  return KIT_LANGS.some((l) => l.code === v);
}

export function langInfo(code: KitLang) {
  return KIT_LANGS.find((l) => l.code === code)!;
}
