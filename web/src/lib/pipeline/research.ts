import { evidence } from "@/data/evidence";
import { getLiveEvidence } from "../context";
import type { Findings, Source } from "./types";

export const reviewedSources: Source[] = evidence.map(source => ({ id: source.id, title: source.title, url: source.url,
  text: source.summary, locator: source.locator, kind: source.id === "report" || source.id === "survival" ? "data" : source.id === "strategy" ? "policy" : "guideline", limitation: source.limitation }));

export function evidenceQuery(findings: Findings): string {
  const followup = findings.focus.some(finding => finding.metric === "followup" && finding.status === "review");
  // Search topics only, never upload filenames, sensitive group labels, or raw rows.
  return followup
    ? "Finland cervical cancer screening colposcopy referral follow-up completeness quality guidance syöpärekisteri kolposkopia"
    : "Finland cervical cancer screening participation invitation reminders language accessibility guideline syöpärekisteri seulonta";
}

export async function research(findings: Findings, signal?: AbortSignal) {
  const context = await getLiveEvidence(evidenceQuery(findings), signal);
  return { context, sources: [...reviewedSources, ...context.snippets] };
}
