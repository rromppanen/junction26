export type Table = { headers: string[]; rows: string[][] };

export function parseCSV(text: string): Table {
  if (text.length > 1_000_000) throw new Error("Use a CSV under 1 MB with aggregate data only.");
  const source = text.replace(/^﻿/, "");
  const delimiter = source.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) { quoted = false; closed = true; }
      else if (!cell && !closed) quoted = true;
      else throw new Error("Invalid CSV quotation.");
    } else if (!quoted && (c === delimiter || c === "\n" || c === "\r")) {
      row.push(cell.trim()); cell = ""; closed = false;
      if (c !== delimiter) {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (c === "\r" && source[i + 1] === "\n") i++;
      }
    } else {
      if (closed && c.trim()) throw new Error("Unexpected text after a quoted CSV value.");
      cell += c;
    }
  }
  if (quoted) throw new Error("Unclosed quotation in CSV.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  if (!headers.length || !rows.length) throw new Error("CSV needs a header and at least one data row.");
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error("CSV headers must be non-empty and unique.");
  if (headers.length > 30 || rows.length > 5000 || rows.some(r => r.length !== headers.length))
    throw new Error("Use at most 30 columns and 5,000 rows, with consistent column counts.");
  return { headers, rows };
}
