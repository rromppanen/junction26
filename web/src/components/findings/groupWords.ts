import { Earth, Flag, GraduationCap, Hourglass, Languages, MapPin, Plane, Tag, Users, Wallet, type LucideIcon } from "lucide-react";
import type { GroupKind } from "@/lib/intake/fields";

/**
 * English wording for group values in uploaded files, which are often Finnish ("venäjä", "mies").
 * Unknown values are shown as they are.
 */
const LANGUAGE: Record<string, string> = {
  suomi: "Finnish", ruotsi: "Swedish", venäjä: "Russian", viro: "Estonian", englanti: "English", arabia: "Arabic",
  somali: "Somali", saame: "Sámi", ukraina: "Ukrainian", persia: "Persian", kurdi: "Kurdish", kiina: "Chinese",
  vietnam: "Vietnamese", thai: "Thai", albania: "Albanian", espanja: "Spanish", saksa: "German", ranska: "French",
};
const COUNTRY: Record<string, { country: string; people: string }> = {
  suomi: { country: "Finland", people: "Finnish" }, venäjä: { country: "Russia", people: "Russian" },
  viro: { country: "Estonia", people: "Estonian" }, ruotsi: { country: "Sweden", people: "Swedish" },
  ukraina: { country: "Ukraine", people: "Ukrainian" }, irak: { country: "Iraq", people: "Iraqi" },
  somalia: { country: "Somalia", people: "Somali" }, kiina: { country: "China", people: "Chinese" },
  thaimaa: { country: "Thailand", people: "Thai" }, vietnam: { country: "Vietnam", people: "Vietnamese" },
};
const OTHER = /^(muu|muut|muu maa|other|others|muu kieli|other or missing)$/i;
/** The Cancer Registry's own group labels (public data). */
const OFFICIAL_LANGUAGES = /^finnish, swedish or s[aá]mi$/i;
const OTHER_EUROPE = /^other europe$/i;
const MEN = /^(mies|miehet|m|male|men|man)$/i;
const WOMEN = /^(nainen|naiset|n|f|female|women|woman)$/i;
const FOREIGN = /^(ulkomaalaistaustainen|ulkomaalaistaustaiset|ulkomaal|foreign background|migrant|maahanmuuttaja)/i;
const FINNISH_BG = /^(suomalaistaustainen|suomalaistaustaiset|suomal|finnish background)/i;

const key = (v: string) => v.trim().toLowerCase();

/** Short label for a group in a list or chart: "Russian", "Men", "56–59". */
export function groupLabel(kind: GroupKind, raw: string): string {
  const k = key(raw);
  if (OTHER.test(k)) return kind === "language" ? "Other languages" : kind === "nationality" || kind === "birthCountry" ? "Other countries" : "Other";
  if (kind === "language") return OFFICIAL_LANGUAGES.test(k) ? "Finnish, Swedish or Sámi" : (LANGUAGE[k] ?? raw);
  if (kind === "birthCountry" && OTHER_EUROPE.test(k)) return "Elsewhere in Europe";
  if (kind === "sex") return MEN.test(k) ? "Men" : WOMEN.test(k) ? "Women" : raw;
  if (kind === "nationality") return COUNTRY[k]?.people ?? raw;
  if (kind === "birthCountry") return COUNTRY[k]?.country ?? raw;
  if (kind === "migrantBackground") return FOREIGN.test(k) ? "Foreign background" : FINNISH_BG.test(k) ? "Finnish background" : raw;
  return raw;
}

/** The group as the subject of a sentence: "Russian speakers", "People aged 56–59". */
export function groupPhrase(kind: GroupKind, label: string, raw: string): string {
  const k = key(raw);
  const other = OTHER.test(k);
  switch (kind) {
    case "language":
      if (OFFICIAL_LANGUAGES.test(k)) return "Finnish, Swedish or Sámi speakers";
      return other ? "Speakers of other languages" : LANGUAGE[k] ? `${LANGUAGE[k]} speakers` : `Speakers of ${raw}`;
    case "sex":
      return MEN.test(k) ? "Men" : WOMEN.test(k) ? "Women" : `People recorded as ${raw}`;
    case "age":
      return `People aged ${raw}`;
    case "nationality":
      return other ? "Citizens of other countries" : COUNTRY[k] ? `${COUNTRY[k].people} citizens` : `Citizens of ${raw}`;
    case "birthCountry":
      if (OTHER_EUROPE.test(k)) return "People born elsewhere in Europe";
      if (/^unknown$/i.test(k)) return "People whose country of birth is unknown";
      return other ? "People born in other countries" : `People born in ${COUNTRY[k]?.country ?? raw}`;
    case "migrantBackground":
      return FOREIGN.test(k) ? "People with a foreign background" : FINNISH_BG.test(k) ? "People with a Finnish background" : `People with background "${raw}"`;
    case "region":
      return `People in ${raw}`;
    case "education":
      return `People with ${raw.toLowerCase()} education`;
    default:
      return `${label} "${raw}"`;
  }
}

/** An icon per kind of group, always shown next to its text label. */
export const KIND_ICON: Record<GroupKind, LucideIcon> = {
  language: Languages, sex: Users, age: Hourglass, nationality: Flag, birthCountry: Earth, migrantBackground: Plane,
  education: GraduationCap, income: Wallet, region: MapPin, other: Tag,
};

const n0 = (v: number) => Math.round(v).toLocaleString("en-GB");
/** What closing a gap would be worth, in words: "145 people missed" or "1,200 extra days of waiting". */
export function impactText(metric: "participation" | "followUp" | "wait", impact: number): string {
  if (metric === "wait") return `${n0(impact)} extra days of waiting`;
  return `${n0(impact)} ${Math.round(impact) === 1 ? "person" : "people"} missed`;
}
