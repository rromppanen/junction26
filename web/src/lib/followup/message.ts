import { LANGUAGE_NAMES, type Language, type Patient } from "./patients";

export type Outreach = {
  language: Language;
  sms: string;
  /** English version so a Finnish-speaking nurse can check what is being sent. */
  backTranslation: string;
  source: "gemini" | "template";
};

const EN =
  "Your bowel screening test showed blood in the stool. This is common and usually not cancer, but a colonoscopy is needed to check. It is free. Reply to this message or call [phone] to book a time that suits you.";

/** Hand-checked templates. Other languages fall back to English plus an interpreter offer. */
const TEMPLATES: Partial<Record<Language, string>> = {
  fi: "Suolistosyövän seulontatestissäsi havaittiin verta. Tämä on yleistä eikä yleensä tarkoita syöpää, mutta tarvitset tähystyksen (kolonoskopian). Se on maksuton. Vastaa tähän viestiin tai soita [phone] ja varaa sinulle sopiva aika.",
  sv: "Ditt screeningtest för tarmcancer visade blod i avföringen. Det är vanligt och betyder oftast inte cancer, men en koloskopi behövs. Den är avgiftsfri. Svara på detta meddelande eller ring [phone] för att boka en tid som passar dig.",
  en: EN,
};

export function templateOutreach(patient: Patient): Outreach {
  const text = TEMPLATES[patient.language];
  if (text) return { language: patient.language, sms: text, backTranslation: EN, source: "template" };
  return {
    language: "en",
    sms: `${EN} We can arrange an interpreter in ${LANGUAGE_NAMES[patient.language]}.`,
    backTranslation: `${EN} We can arrange an interpreter in ${LANGUAGE_NAMES[patient.language]}.`,
    source: "template",
  };
}

export function outreachPrompt(patient: Patient): string {
  return `You write text messages for a Finnish wellbeing services county's bowel screening nurse.
The patient got a positive faecal immunochemical test ${patient.daysSincePositive} days ago and has not booked the follow-up colonoscopy.
Write one text message in ${LANGUAGE_NAMES[patient.language]}, at most 320 characters, plain and warm, for a reader with basic literacy.
Say: the test found blood in the stool; this is common and usually not cancer; a colonoscopy is needed to check; it is free; reply to this message or call [phone] to book; an interpreter is available.
Do not give medical advice, do not mention the patient's name, and use no numbers except inside [phone].
Also give backTranslation: an exact English translation of your message.`;
}

/** Placeholders the nurse system fills in. A draft that drops them cannot be sent. */
export function hasRequiredPlaceholders(sms: string): boolean {
  return sms.includes("[phone]");
}
