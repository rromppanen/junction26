import { Observation, validateRows } from "./analysis";

export type Field = "year" | "dimension" | "group" | "cohort" | "invited" | "attended" | "referred" | "completed";
export const fields: Field[] = ["year", "dimension", "group", "cohort", "invited", "attended", "referred", "completed"];
export const requiredFields: Field[] = ["year", "group", "invited", "attended"];
export type Mapping = Record<Field, string>;
export type Table = { headers: string[]; rows: string[][] };
export function parseCSV(text: string): Table {
  if (text.length > 1_000_000) throw new Error("Use a CSV under 1 MB with public aggregate data only.");
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = source.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) { quoted = false; closed = true; }
      else if (!cell && !closed) quoted = true;
      else throw new Error("Invalid CSV quotation.");
    } else if (!quoted && (c === delimiter || c === "\n" || c === "\r")) {
      row.push(cell.trim()); cell = ""; closed = false;
      if (c !== delimiter) { if (row.some(Boolean)) rows.push(row); row = []; if (c === "\r" && source[i + 1] === "\n") i++; }
    } else { if (closed && c.trim()) throw new Error("Unexpected text after a quoted CSV value."); cell += c; }
  }
  if (quoted) throw new Error("Unclosed quotation in CSV.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  if (!headers.length || !rows.length) throw new Error("CSV needs a header and at least one data row.");
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error("CSV headers must be non-empty and unique.");
  if (headers.length > 30 || rows.length > 5000 || rows.some(r => r.length !== headers.length)) throw new Error("Use at most 30 columns and 5,000 rows, with consistent column counts.");
  return { headers, rows };
}
const aliases: Record<Field, string[]> = {
  year: ["year", "vuosi", "period", "screening_year"], dimension: ["dimension", "group_type", "stratum"],
  group: ["group", "population", "region", "language", "nationality", "gender", "education", "age", "birthplace"],
  cohort: ["cohort", "programme", "program"], invited: ["invited", "eligible", "kutsuttu", "denominator"],
  attended: ["attended", "screened", "osallistunut", "participants"], referred: ["referred", "referrals"], completed: ["completed", "examined", "followup_completed"],
};
export function suggestMapping(headers: string[]): Mapping {
  return Object.fromEntries(fields.map(field => [field, headers.find(h => aliases[field].includes(h.toLowerCase())) ?? ""])) as Mapping;
}
export function normalise(table: Table, mapping: Mapping): Observation[] {
  for (const field of requiredFields) if (!mapping[field] || !table.headers.includes(mapping[field])) throw new Error(`Map the ${field} field before continuing.`);
  const mapped = Object.values(mapping).filter(Boolean);
  if (new Set(mapped).size !== mapped.length) throw new Error("Each source column can map to only one field.");
  const get = (row: string[], field: Field) => mapping[field] ? row[table.headers.indexOf(mapping[field])] ?? "" : "";
  const integer = (value: string, label: string, optional = false): number | null => {
    if (optional && ["", "NA", "N/A", "–", "-"].includes(value)) return null;
    if (!/^\d+$/.test(value)) throw new Error(`${label} must be a whole count (no percentages or separators).`);
    return Number(value);
  };
  return validateRows(table.rows.map((r, i) => ({
    year: integer(get(r, "year"), `Row ${i + 2} year`)! , group: get(r, "group"),
    dimension: get(r, "dimension") || (mapping.group ? mapping.group[0].toUpperCase() + mapping.group.slice(1) : "Group"),
    cohort: get(r, "cohort") || "User-confirmed screening cohort",
    invited: integer(get(r, "invited"), `Row ${i + 2} invited`)!, attended: integer(get(r, "attended"), `Row ${i + 2} attended`)!,
    referred: integer(get(r, "referred"), `Row ${i + 2} referred`, true), completed: integer(get(r, "completed"), `Row ${i + 2} completed`, true),
    locator: `Uploaded CSV row ${i + 2}`,
  })));
}
