import type { Table } from "./csv";

export type Field = "year" | "region" | "group" | "programme" | "invited" | "attended" | "positive" | "examined" | "waitDays" | "ignore";
/** Source header -> field. */
export type Mapping = Record<string, Field>;

export const FIELDS: { id: Field; labelEn: string; description: string; required: boolean }[] = [
  { id: "year", labelEn: "Year", description: "Calendar year of the figures (2000-2100).", required: true },
  { id: "region", labelEn: "Region", description: "County, wellbeing area or municipality.", required: false },
  { id: "group", labelEn: "Group", description: "Population group such as language or gender.", required: false },
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
  group: ["group", "ryhmä", "kieli", "language", "sukupuoli", "gender"],
  programme: ["programme", "program", "ohjelma", "seulonta"],
  invited: ["invited", "kutsutut", "kutsuttu"],
  attended: ["attended", "screened", "osallistuneet", "osallistunut"],
  positive: ["positive", "positiiviset", "referred"],
  examined: ["examined", "colonoscopy", "tutkitut", "completed"],
  waitDays: ["wait", "viive", "odotus", "days", "vrk"],
};

export function suggestMapping(headers: string[]): Mapping {
  const used = new Set<Field>();
  const m: Mapping = {};
  for (const h of headers) {
    const key = h.trim().toLowerCase();
    const hit = (Object.keys(ALIASES) as Exclude<Field, "ignore">[]).find(f => !used.has(f) && ALIASES[f].includes(key));
    if (hit) { used.add(hit); m[h] = hit; } else m[h] = "ignore";
  }
  return m;
}

const COUNTS: Field[] = ["invited", "attended", "positive", "examined"];

export function validateMapping(table: Table, m: Mapping): string[] {
  const errors: string[] = [];
  const colOf = new Map<Field, number>();
  for (const f of FIELDS) {
    const heads = table.headers.filter(h => m[h] === f.id);
    if (heads.length > 1) errors.push(`${f.labelEn} is mapped to more than one column (${heads.join(", ")}).`);
    else if (!heads.length && f.required) errors.push(`Map a column to ${f.labelEn}.`);
    if (heads.length === 1) colOf.set(f.id, table.headers.indexOf(heads[0]));
  }
  if (errors.length) return errors;
  const val = (r: string[], f: Field) => { const c = colOf.get(f); return c === undefined ? undefined : r[c]; };
  const bad = new Set<string>();
  const num = (r: string[], f: Field) => {
    const v = val(r, f);
    return v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined;
  };
  table.rows.forEach((r, i) => {
    const line = i + 2;
    for (const f of COUNTS) {
      const v = val(r, f);
      if (v !== undefined && !/^\d+$/.test(v)) bad.add(`Row ${line}: ${f} must be a whole non-negative number.`);
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
