import type { GapStatus, PathwayStage } from "@/lib/types";

export function shortName(name: string): string {
  return name.replace(/\s+hyvinvointialue$/i, "").replace(/^Helsingin kaupunki$/i, "Helsinki");
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
  behind: "Behind national",
  "on-par": "On par",
  ahead: "Ahead of national",
  "no-data": "No data",
};

export const STATUS_CLASSES: Record<GapStatus, string> = {
  behind: "bg-behind text-white",
  "on-par": "bg-par-soft text-ink",
  ahead: "bg-ahead text-white",
  "no-data": "bg-white text-muted border border-dashed border-rule",
};

export const STAGE_LABEL: Record<PathwayStage, string> = {
  detection: "Detection",
  referral: "Referral",
  diagnosis: "Diagnosis",
  treatment: "Treatment",
  outcome: "Outcome",
};
