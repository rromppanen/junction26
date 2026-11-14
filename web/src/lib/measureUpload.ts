import { MEASURES, MEASURE_CSV_HEADER } from "@/data/measureKit";

/**
 * Reads a county's filled-in measuring CSV (kuukausi,syopa,mittari,mediaani_vrk,potilaita) and turns it into one
 * monthly series per measure, so the county can see whether a change it made moved its delays. Pure: the file
 * never leaves the browser.
 */
export type MeasurePoint = { month: string; days: number; patients: number | null };
export type MeasureSeries = { id: string; name: string; points: MeasurePoint[]; first: MeasurePoint; last: MeasurePoint; change: number };
export type ParsedMeasures = { series: MeasureSeries[]; skipped: number; error: string | null };

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseMeasureCsv(text: string, cancer?: string): ParsedMeasures {
  const lines = text.replace(/^﻿/, "").replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length || lines[0].replace(/;/g, ",").trim() !== MEASURE_CSV_HEADER) {
    return { series: [], skipped: 0, error: `The first line must be: ${MEASURE_CSV_HEADER}` };
  }
  const byMeasure = new Map<string, Map<string, { days: number; patients: number | null }>>();
  let skipped = 0;
  for (const line of lines.slice(1)) {
    // Finnish Excel saves with semicolons and decimal commas; otherwise the file is comma-separated.
    const [month, syopa, mittari, median, patients] = line.split(line.includes(";") ? ";" : ",").map((s) => s.trim());
    const days = Number((median ?? "").replace(",", "."));
    const known = MEASURES.some((m) => m.id === mittari);
    if (!MONTH.test(month ?? "") || !known || median === "" || !Number.isFinite(days) || days < 0) {
      skipped++;
      continue;
    }
    if (cancer && syopa && syopa !== cancer) continue;
    const p = patients === undefined || patients === "" ? null : Number(patients);
    const series = byMeasure.get(mittari) ?? new Map();
    series.set(month, { days, patients: p !== null && Number.isFinite(p) ? p : null }); // a later row for the same month wins
    byMeasure.set(mittari, series);
  }
  const series: MeasureSeries[] = MEASURES.flatMap((m) => {
    const rows = byMeasure.get(m.id);
    if (!rows || rows.size === 0) return [];
    const points = [...rows].map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month));
    const first = points[0], last = points[points.length - 1];
    return [{ id: m.id, name: m.nameEn, points, first, last, change: Math.round((last.days - first.days) * 10) / 10 }];
  });
  return { series, skipped, error: series.length ? null : "No rows with a month, a known measure and a median in days." };
}

/** Illustrative rows for trying the view; clearly not any county's figures. */
export function exampleMeasureCsv(): string {
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
  const rows = months.flatMap((m, i) => [
    `${m},,referral-to-specialist,${[21, 20, 19, 16, 14, 13][i]},${40 + i}`,
    `${m},,suspicion-to-diagnosis,${[34, 35, 31, 30, 27, 26][i]},${38 + i}`,
    `${m},,diagnosis-to-treatment,${[24, 25, 25, 23, 22, 21][i]},${35 + i}`,
  ]);
  return [MEASURE_CSV_HEADER, ...rows].join("\n");
}
