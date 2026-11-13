import type { Action, Draft, Finding, Observation } from "../analysis";
import type { Field, Mapping } from "../csv";

export type Stage = "prepare" | "analyse" | "research" | "recommend";
export const stages: { id: Stage; label: string }[] = [
  { id: "prepare", label: "Standardise & clean" },
  { id: "analyse", label: "Find disparities" },
  { id: "research", label: "Find evidence" },
  { id: "recommend", label: "Generate recommendations" },
];
export type PipelineInput = { kind: "demo" } | { kind: "csv"; name: string; csv: string; mapping?: Mapping };
export type Source = {
  id: string; title: string; url: string; text: string; locator: string;
  kind: "guideline" | "data" | "policy" | "web"; limitation: string;
  retrievedAt?: string;
};
export type PreparedData = {
  name: string; sha256: string; rows: Observation[]; mapping: Mapping;
  official: boolean; mappingMode: "known-schema" | "gemini" | "user-corrected";
  cleaning: string[]; warnings: string[];
};
export type LocatedFinding = Finding & { id: string; stage: string };
export type Findings = { all: LocatedFinding[]; focus: LocatedFinding[]; periods: string[] };
export type ProposedAction = Action & { findingId: string };
export type PipelineReport = {
  dataset: Omit<PreparedData, "rows"> & { rowCount: number };
  findings: Findings; interpretation: Draft; recommendations: ProposedAction[];
  sources: Source[];
  integrations: {
    gemini: "ok" | "not-configured" | "error";
    context: "ok" | "empty" | "not-configured" | "error";
    recommendationMode: "gemini" | "templates";
  };
  generatedAt: string;
};
export type Attention = { message: string; fields: Field[]; headers: string[]; mapping: Mapping };
export type PipelineEvent =
  | { type: "progress"; stage: Stage; status: "running" | "complete"; message: string }
  | { type: "attention"; attention: Attention }
  | { type: "error"; message: string }
  | { type: "result"; report: PipelineReport };

export class NeedsAttention extends Error {
  constructor(public attention: Attention) { super(attention.message); }
}
