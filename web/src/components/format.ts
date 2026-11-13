import type { GapStatus, PathwayStage } from "@/lib/types";

// Sotkanet names counties in the genitive ("Länsi-Uudenmaan hyvinvointialue"); in English text we want the
// region's own name ("Länsi-Uusimaa").
const NOMINATIVE: Record<string, string> = {
  "Itä-Uudenmaan": "Itä-Uusimaa",
  "Keski-Uudenmaan": "Keski-Uusimaa",
  "Länsi-Uudenmaan": "Länsi-Uusimaa",
  "Vantaan ja Keravan": "Vantaa and Kerava",
  "Varsinais-Suomen": "Varsinais-Suomi",
  Satakunnan: "Satakunta",
  "Kanta-Hämeen": "Kanta-Häme",
  Pirkanmaan: "Pirkanmaa",
  "Päijät-Hämeen": "Päijät-Häme",
  Kymenlaakson: "Kymenlaakso",
  "Etelä-Karjalan": "Etelä-Karjala",
  "Etelä-Savon": "Etelä-Savo",
  "Pohjois-Savon": "Pohjois-Savo",
  "Pohjois-Karjalan": "Pohjois-Karjala",
  "Keski-Suomen": "Keski-Suomi",
  "Etelä-Pohjanmaan": "Etelä-Pohjanmaa",
  Pohjanmaan: "Pohjanmaa",
  "Keski-Pohjanmaan": "Keski-Pohjanmaa",
  "Pohjois-Pohjanmaan": "Pohjois-Pohjanmaa",
  Kainuun: "Kainuu",
  Lapin: "Lappi",
  "Helsingin kaupunki": "Helsinki",
};

export function shortName(name: string): string {
  const stem = name.replace(/\s+hyvinvointialue$/i, "");
  return NOMINATIVE[stem] ?? stem;
}

export function fmt(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  const s = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
  return unit ? `${s}${unit === "%" ? "%" : " " + unit}` : s;
}

export function fmtGap(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(1)}`;
}

export const STATUS_LABEL: Record<GapStatus, string> = {
  behind: "Behind",
  "on-par": "Level",
  ahead: "Ahead",
  "no-data": "No figure",
};

export const STATUS_CLASSES: Record<GapStatus, string> = {
  behind: "bg-behind text-white",
  "on-par": "bg-par-soft text-ink",
  ahead: "bg-ahead text-white",
  "no-data": "bg-transparent text-muted border border-dashed border-par",
};

export const STAGE_LABEL: Record<PathwayStage, string> = {
  detection: "Detection",
  referral: "Referral",
  diagnosis: "Diagnosis",
  treatment: "Treatment",
  outcome: "Outcome",
};

/** Text colour for a status figure (gap numbers, inline mentions). */
export const STATUS_TEXT: Record<GapStatus, string> = {
  behind: "text-behind",
  "on-par": "text-muted",
  ahead: "text-ahead",
  "no-data": "text-muted",
};
