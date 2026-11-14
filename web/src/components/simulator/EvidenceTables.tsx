import { PARAM_META } from "@/data/simulatorAssumptions";
import { stageMix, type Assumption, type AssumptionStatus, type ParamKey, type Params } from "@/lib/simulator";
import { More } from "@/components/ui";
import { EvidenceTag, PlaceholderTag } from "./EvidenceTag";
import { eur, num } from "./format";

const STAGES = ["Localized", "Regional", "Distant"] as const;

/** Each stage's figures, one column per kind of figure. Localized shares are what regional and distant leave. */
const STAGE_COLUMNS: { label: string; unit: string; keys: [ParamKey | null, ParamKey, ParamKey]; mix?: "att" | "non"; fmt: (v: number) => string }[] = [
  { label: "Women who attend", unit: "share of their cancers", keys: [null, "att_regional", "att_distant"], mix: "att", fmt: (v) => `${num(v * 100)}%` },
  { label: "Women who don't", unit: "share of their cancers", keys: [null, "non_regional", "non_distant"], mix: "non", fmt: (v) => `${num(v * 100)}%` },
  { label: "Die of it", unit: "lifetime chance", keys: ["death_local", "death_regional", "death_distant"], fmt: (v) => `${num(v * 100)}%` },
  { label: "Life-years lost", unit: "per case", keys: ["ly_lost_local", "ly_lost_regional", "ly_lost_distant"], fmt: (v) => num(v, v < 10 ? 1 : 0) },
  { label: "Treatment cost", unit: "per case", keys: ["cost_local", "cost_regional", "cost_distant"], fmt: eur },
];

const OTHER_KEYS: ParamKey[] = ["incidence_50_69", "cost_screen", "overdiagnosis", "screening_interval"];

function StatusTag({ status }: { status: AssumptionStatus }) {
  if (status === "placeholder") return <PlaceholderTag />;
  if (status === "derived") return <EvidenceTag kind="inferred" />;
  return <EvidenceTag kind="observed" />;
}

/**
 * The evidence behind the model, laid out so each fact appears once: a table by stage at diagnosis, four other
 * figures, and the notes and sources behind a single expander.
 */
export function EvidenceTables({ assumptions, P }: { assumptions: readonly Assumption[]; P: Params }) {
  const byKey = new Map(assumptions.map((a) => [a.key, a]));
  const mixes = { att: stageMix(P, "att"), non: stageMix(P, "non") };
  const sourced = [...STAGE_COLUMNS.flatMap((c) => c.keys.filter((k): k is ParamKey => k !== null)), ...OTHER_KEYS]
    .map((k) => byKey.get(k))
    .filter((a): a is Assumption => a !== undefined);

  return (
    <div className="grid gap-8">
      <div>
        <h3 className="font-semibold">By stage at diagnosis</h3>
        <p className="mb-3 mt-0.5 max-w-3xl text-sm text-muted">
          Screening works by moving cancers up this table: the same cancer found localized instead of regional or
          distant is less likely to kill and cheaper to treat.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-ink align-bottom">
                <th scope="col" className="py-2 pr-3 font-normal">Stage</th>
                {STAGE_COLUMNS.map((c) => (
                  <th key={c.label} scope="col" className="py-2 pr-3 text-right font-normal">
                    <span className="block font-semibold text-ink">{c.label}</span>
                    {c.unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((stage, i) => (
                <tr key={stage} className="border-b border-rule">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">{stage}</th>
                  {STAGE_COLUMNS.map((c) => {
                    const key = c.keys[i];
                    const v = key ? P[key] : mixes[c.mix!][i];
                    return (
                      <td key={c.label} className="py-2 pr-3 text-right tabular-nums">{c.fmt(v)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Other figures</h3>
        <dl className="mt-2 grid max-w-3xl gap-x-8 sm:grid-cols-2">
          {OTHER_KEYS.map((k) => {
            const m = PARAM_META[k];
            return (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-rule py-2 text-sm">
                <dt>{m.label}</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {num(P[k] * m.scale, m.decimals)} <span className="text-xs text-muted">{m.unit}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <More label="Where each figure comes from">
        <ul className="mt-2 grid max-w-3xl gap-4">
          {sourced.map((a) => {
            const m = PARAM_META[a.key];
            return (
              <li key={a.key} className="grid gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{m.label}</span>
                  <StatusTag status={a.status} />
                  {a.low < a.high && (
                    <span className="text-xs tabular-nums">
                      range {num(a.low * m.scale, m.decimals)}–{num(a.high * m.scale, m.decimals)} {m.unit}
                    </span>
                  )}
                </span>
                <span>{a.note}</span>
                {a.source && (
                  <span className="text-xs">
                    {a.url ? <a href={a.url} className="link" target="_blank" rel="noreferrer">{a.source}</a> : a.source}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </More>
    </div>
  );
}
