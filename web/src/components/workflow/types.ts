import type { Finding, Metric, Observation } from "@/lib/analysis";
import type { Mapping, Table } from "@/lib/csv";

// Change these contracts deliberately: each workflow step has a separate owner.
export type InputDataset =
  | { kind: "official"; name: string; rows: Observation[]; sha256: string; sourceUrl: string }
  | { kind: "csv"; name: string; table: Table; sha256: string };

export type PreparedDataset = {
  name: string;
  rows: Observation[];
  sha256: string;
  official: boolean;
  sourceUrl?: string;
  mapping?: Mapping;
};

export type AnalysisSelection = {
  year: number;
  dimension: string;
  cohort: string;
  metric: Metric;
};

export type AnalysisResult = {
  selection: AnalysisSelection;
  findings: Finding[];
  selectedGroup: string;
  generatedAt: string;
};

export function findingStatus(status: Finding["status"]) {
  return status === "review" ? "Review signal" : status === "within" ? "Within threshold" : "Insufficient data";
}
