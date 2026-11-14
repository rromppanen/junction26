import { PARAM_GROUPS, PARAM_META } from "@/data/simulatorAssumptions";
import type { Assumption, AssumptionStatus, ParamKey, Params, Scenario } from "./simulator";

/** Inverse of the status names parseAssumptionsCsv reads, so an exported file can be uploaded again. */
const STATUS_TO_CSV: Record<AssumptionStatus, string> = {
  placeholder: "PLACEHOLDER",
  "from-data": "FROM DATASET",
  sourced: "SOURCED",
  derived: "DERIVED",
  choice: "CHOICE",
  fixed: "FIXED",
};

const STATUS_LABEL: Record<AssumptionStatus, string> = {
  placeholder: "Placeholder",
  "from-data": "From data",
  sourced: "Published",
  derived: "Calculated from published figures",
  choice: "Your choice",
  fixed: "Fixed",
};

/** The unit of the raw model value, which is what the CSV holds. */
function modelUnit(key: ParamKey): string {
  const m = PARAM_META[key];
  if (m.scale === 100) return "share (0–1)";
  if (m.scale === 1000) return "per woman a year";
  return m.unit;
}

/** CSV fields: the reader splits on commas and has no quoting, so commas and line breaks are removed. */
const field = (s: string) => s.replace(/[\r\n]+/g, " ").replace(/,/g, "");
/** The note is the last column, so it may keep its commas. */
const lastField = (s: string) => s.replace(/[\r\n]+/g, " ");

/**
 * The assumptions as a CSV in the format "Use your own figures" reads (parameter,base,low,high,unit,status,note).
 * The figures the user set (target, outreach cost) are written as the base value. The source goes into the note.
 */
export function assumptionsToCsv(assumptions: readonly Assumption[], choices: Partial<Record<ParamKey, number>> = {}): string {
  const lines = ["parameter,base,low,high,unit,status,note"];
  for (const a of assumptions) {
    const base = choices[a.key] ?? a.base;
    const note = [a.note, a.source && `Source: ${a.source}${a.url ? ` (${a.url})` : ""}`].filter(Boolean).join(" ");
    lines.push(
      [a.key, String(base), String(a.low), String(a.high), field(modelUnit(a.key)), STATUS_TO_CSV[a.status], lastField(note)].join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmt = (v: number, decimals: number) =>
  v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: decimals });

const SCENARIO_LABEL: Record<Scenario, string> = { cautious: "Cautious", central: "Central", optimistic: "Optimistic" };

/**
 * A standalone, print-ready HTML page of every assumption: the value the simulator is using now, its range,
 * status, note and source. Opened in a new window and printed, it saves as a PDF.
 */
export function assumptionsReportHtml(
  assumptions: readonly Assumption[],
  P: Params,
  scenario: Scenario,
  date: Date = new Date(),
): string {
  const byKey = new Map(assumptions.map((a) => [a.key, a]));
  const sections = PARAM_GROUPS.map((group) => {
    const rows = (Object.keys(PARAM_META) as ParamKey[])
      .filter((k) => PARAM_META[k].group === group && byKey.has(k))
      .map((k) => {
        const a = byKey.get(k)!;
        const m = PARAM_META[k];
        const range = a.low < a.high ? `${fmt(a.low * m.scale, m.decimals)}–${fmt(a.high * m.scale, m.decimals)}` : "–";
        const source = a.source
          ? a.url
            ? `<a href="${escapeHtml(a.url)}">${escapeHtml(a.source)}</a>`
            : escapeHtml(a.source)
          : "";
        return `<tr>
  <th scope="row">${escapeHtml(m.label)}</th>
  <td class="n">${fmt(P[k] * m.scale, m.decimals)}</td>
  <td class="n">${range}</td>
  <td>${escapeHtml(m.unit)}</td>
  <td>${escapeHtml(STATUS_LABEL[a.status])}</td>
  <td>${escapeHtml(a.note)}${source ? `<div class="src">${source}</div>` : ""}</td>
</tr>`;
      });
    if (!rows.length) return "";
    return `<h2>${escapeHtml(group)}</h2>
<table>
<thead><tr><th>Figure</th><th class="n">Used</th><th class="n">Range</th><th>Unit</th><th>Status</th><th>Note and source</th></tr></thead>
<tbody>${rows.join("\n")}</tbody>
</table>`;
  }).join("\n");

  const placeholders = assumptions.filter((a) => a.status === "placeholder").length;
  const dateText = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Screening simulator assumptions, ${escapeHtml(dateText)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  body { font: 10pt/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 16pt; margin: 0 0 4px; }
  h2 { font-size: 11pt; margin: 18px 0 6px; break-after: avoid; }
  p.meta { margin: 0 0 4px; color: #555; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 4px 6px; border-bottom: 1px solid #ddd; }
  thead th { font-size: 8.5pt; color: #555; font-weight: 600; border-bottom: 1.5px solid #111; }
  tbody th { font-weight: 600; width: 20%; }
  td.n, th.n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr { break-inside: avoid; }
  .src { color: #555; font-size: 8.5pt; margin-top: 2px; }
  a { color: inherit; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>Breast screening simulator: assumptions</h1>
<p class="meta">${escapeHtml(dateText)} · Evidence reading: ${SCENARIO_LABEL[scenario]} · "Used" is the value in the model now; ranges are the published or calculated bounds.</p>
${placeholders > 0 ? `<p class="meta"><strong>${placeholders} figure${placeholders === 1 ? " is a placeholder" : "s are placeholders"}.</strong> Treat results as an illustration.</p>` : ""}
${sections}
</body>
</html>`;
}
