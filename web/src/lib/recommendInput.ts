import { GROUP_KINDS } from "./intake/fields";
import type { GapBrief } from "./recommend";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e9 ? v : null);
const KINDS = [...GROUP_KINDS.map((g) => g.id as string), "other"];

function steps(v: unknown): GapBrief["group"] | null {
  if (!isObj(v)) return null;
  const out: Record<string, number | null> = {};
  for (const k of ["invited", "attended", "positive", "examined", "waitDays"]) {
    if (v[k] !== null && num(v[k]) === null) return null;
    out[k] = v[k] === null ? null : (v[k] as number);
  }
  return out as GapBrief["group"];
}

/** Only aggregate figures and short labels are accepted: no rows of any file reach the server. */
export function parseGapBrief(body: unknown): GapBrief | string {
  if (!isObj(body)) return "Body must be a JSON object.";
  const b = {
    who: str(body.who, 120), kind: str(body.kind, 30), kindLabel: str(body.kindLabel, 60), metric: str(body.metric, 20),
    metricLabel: str(body.metricLabel, 80), figure: num(body.figure), rest: num(body.rest), gap: num(body.gap), n: num(body.n),
    impact: num(body.impact), span: str(body.span, 20), trend: body.trend === null ? null : str(body.trend, 120),
    group: steps(body.group), others: steps(body.others), place: body.place === null ? null : str(body.place, 160), source: str(body.source, 200),
  };
  for (const [k, v] of Object.entries(b)) if (v === null && k !== "trend" && k !== "place") return `Missing or invalid ${k}.`;
  if (!KINDS.includes(b.kind!)) return "Unknown kind of group.";
  if (!["participation", "followUp", "wait"].includes(b.metric!)) return "Unknown pathway step.";
  return b as GapBrief;
}

