import type { Table } from "./csv";

export type Field = "year" | "region" | "group" | "programme" | "invited" | "attended" | "positive" | "examined" | "waitDays" | "ignore";
/** Source header -> field. */
export type Mapping = Record<string, Field>;

export const FIELDS: { id: Field; labelEn: string; description: string; required: boolean }[] = [
  { id: "year", labelEn: "Year", description: "Calendar year of the figures (2000-2100).", required: true },
  { id: "region", labelEn: "Region", description: "County, wellbeing area or municipality.", required: false },
  { id: "group", labelEn: "Population group", description: "Who the row is about: language, sex, age group, nationality, country of birth, migrant background, education, income or similar. Several columns may be groups.", required: false },
  { id: "programme", labelEn: "Programme", description: "Screening programme the row belongs to.", required: false },
  { id: "invited", labelEn: "Invited", description: "Number of people invited (whole count).", required: true },
  { id: "attended", labelEn: "Attended", description: "Number who took part (whole count).", required: true },
  { id: "positive", labelEn: "Positive", description: "Positive or referred results (whole count).", required: false },
  { id: "examined", labelEn: "Examined", description: "Follow-up examinations completed (whole count).", required: false },
  { id: "waitDays", labelEn: "Wait (days)", description: "Days waited between steps.", required: false },
];

const ALIASES: Record<Exclude<Field, "ignore">, string[]> = {
  year: ["year", "vuosi"],
  region: ["region", "alue", "hyvinvointialue", "county", "kunta"],
  group: [
    "group", "ryhmä", "kieli", "kieliryhmä", "äidinkieli", "language", "mother tongue", "sukupuoli", "sex", "gender",
    "ikä", "ikäryhmä", "age", "age group", "age_group", "kansalaisuus", "nationality", "citizenship", "syntymämaa",
    "country of birth", "maahanmuuttotausta", "syntyperä", "tausta", "background", "origin", "koulutus", "education",
    "tulotaso", "income",
  ],
  programme: ["programme", "program", "ohjelma", "seulonta"],
  invited: ["invited", "kutsutut", "kutsuttu"],
  attended: ["attended", "screened", "osallistuneet", "osallistunut"],
  positive: ["positive", "positiiviset", "referred"],
  examined: ["examined", "colonoscopy", "tutkitut", "completed"],
  waitDays: ["wait", "viive", "odotus", "days", "vrk"],
};

/** Fields that several columns may share: a file can break its figures down by many population groups. */
export const MULTI_FIELDS: Field[] = ["group"];

export function suggestMapping(headers: string[]): Mapping {
  const used = new Set<Field>();
  const entries: [string, Field][] = [];
  for (const h of headers) {
    const key = h.normalize("NFC").trim().toLowerCase();
    const hit = (Object.keys(ALIASES) as Exclude<Field, "ignore">[]).find(f => !used.has(f) && ALIASES[f].includes(key));
    if (hit && !MULTI_FIELDS.includes(hit)) used.add(hit);
    entries.push([h, hit ?? "ignore"]);
  }
  return Object.fromEntries(entries) as Mapping; // fromEntries defines own props, safe for "__proto__"
}

/** Whole count; Finnish exports may group thousands with a space, NBSP or narrow NBSP (groups of exactly 3). */
export function parseCount(v: string): number | undefined {
  const t = v.trim();
  if (/^\d+$/.test(t)) return Number(t);
  if (/^\d{1,3}([ \u00a0\u202f]\d{3})+$/.test(t)) return Number(t.replace(/[ \u00a0\u202f]/g, ""));
  return undefined;
}

const COUNTS: Field[] = ["invited", "attended", "positive", "examined"];

export function validateMapping(table: Table, m: Mapping): string[] {
  const errors: string[] = [];
  const validIds = new Set<string>([...FIELDS.map(f => f.id), "ignore"]);
  for (const key of Object.keys(m)) {
    if (!table.headers.includes(key)) errors.push(`Mapping refers to unknown column "${key}".`);
    if (!validIds.has(m[key])) errors.push(`Column "${key}" is mapped to an invalid field.`);
  }
  if (errors.length) return errors;
  const fieldOf = (h: string): Field => (Object.hasOwn(m, h) ? m[h] : "ignore");
  const colOf = new Map<Field, number>();
  for (const f of FIELDS) {
    const heads = table.headers.filter(h => fieldOf(h) === f.id);
    if (heads.length > 1 && !MULTI_FIELDS.includes(f.id)) errors.push(`${f.labelEn} is mapped to more than one column (${heads.join(", ")}).`);
    else if (!heads.length && f.required) errors.push(`Map a column to ${f.labelEn}.`);
    if (heads.length === 1) colOf.set(f.id, table.headers.indexOf(heads[0]));
  }
  if (errors.length) return errors;
  const val = (r: string[], f: Field) => { const c = colOf.get(f); return c === undefined ? undefined : r[c]; };
  const bad = new Set<string>();
  const num = (r: string[], f: Field) => {
    const v = val(r, f);
    return v === undefined ? undefined : parseCount(v);
  };
  table.rows.forEach((r, i) => {
    const line = i + 2;
    for (const f of COUNTS) {
      const v = val(r, f);
      if (v !== undefined && parseCount(v) === undefined) bad.add(`Row ${line}: ${f} must be a whole non-negative number.`);
    }
    const y = val(r, "year");
    if (y !== undefined && (!/^\d+$/.test(y) || Number(y) < 2000 || Number(y) > 2100)) bad.add(`Row ${line}: year must be between 2000 and 2100.`);
    const inv = num(r, "invited"), att = num(r, "attended"), pos = num(r, "positive"), exa = num(r, "examined");
    if (inv !== undefined && att !== undefined && att > inv) bad.add(`Row ${line}: attended exceeds invited.`);
    if (att !== undefined && pos !== undefined && pos > att) bad.add(`Row ${line}: positive exceeds attended.`);
    if (pos !== undefined && exa !== undefined && exa > pos) bad.add(`Row ${line}: examined exceeds positive.`);
  });
  return [...bad];
}

/** What a population-group column describes. Drives wording and icons only; the gap maths is the same for all. */
export type GroupKind = "language" | "sex" | "age" | "nationality" | "birthCountry" | "migrantBackground" | "education" | "income" | "region" | "other";

export const GROUP_KINDS: { id: GroupKind; labelEn: string; words: RegExp }[] = [
  { id: "language", labelEn: "Language", words: /kiel|language|tongue/ },
  { id: "sex", labelEn: "Sex", words: /sukupuol|^sex$|gender|^sp$/ },
  { id: "age", labelEn: "Age group", words: /^ikä|ikäryhm|^age|age[ _-]?group/ },
  { id: "nationality", labelEn: "Nationality", words: /kansalaisuu|nationalit|citizenship/ },
  { id: "birthCountry", labelEn: "Country of birth", words: /syntymämaa|country of birth|birth[ _-]?country|synt[ _-]?maa/ },
  { id: "migrantBackground", labelEn: "Migrant background", words: /maahanmuut|syntyperä|tausta|background|origin|migrant|immigra/ },
  { id: "education", labelEn: "Education", words: /koulutu|education/ },
  { id: "income", labelEn: "Income", words: /tulo|income/ },
  { id: "region", labelEn: "Area", words: /kunta|alue|region|municipal|area/ },
];

/** Guesses a group column's kind from its name; "other" when nothing fits. */
export function groupKindOf(header: string): GroupKind {
  const k = header.normalize("NFC").trim().toLowerCase();
  return GROUP_KINDS.find((g) => g.words.test(k))?.id ?? "other";
}

export const groupKindLabel = (kind: GroupKind, header: string) =>
  kind === "other" ? header : (GROUP_KINDS.find((g) => g.id === kind)?.labelEn ?? header);
