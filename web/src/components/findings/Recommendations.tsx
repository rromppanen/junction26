"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Check, CircleSlash, ExternalLink, FileSearch, PenLine, RefreshCw, Scale, ScanText, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { IconHeading, More } from "@/components/ui";
import { FadeIn, Thinking } from "@/components/intake/fade";
import type { AgentEvent, GapBrief, RecommendResult, Source, StepId, Strength } from "@/lib/recommend";

/**
 * The recommendation agent on a gap's dashboard: a button starts it, its steps appear as they happen, then the
 * recommendations fade in, strongest evidence first. Only the gap's aggregate numbers are sent.
 */

const STEPS: { id: StepId; label: string; icon: LucideIcon }[] = [
  { id: "read", label: "Reading the gap", icon: ScanText },
  { id: "search", label: "Searching reviews, guidelines and studies", icon: FileSearch },
  { id: "draft", label: "Drafting the most actionable recommendations", icon: PenLine },
  { id: "check", label: "Checking every source, quote and number", icon: ShieldCheck },
  { id: "review", label: "An independent reviewer judges each recommendation", icon: Scale },
];

const STRENGTH: Record<Strength, { label: string; detail: string; tone: string; dots: number }> = {
  strong: { label: "Strong evidence", detail: "a systematic review or guideline", tone: "border-ahead text-ahead", dots: 3 },
  moderate: { label: "Moderate evidence", detail: "a peer-reviewed study", tone: "border-ahead/60 text-ahead", dots: 2 },
  supporting: { label: "Supporting evidence", detail: "a national agency or report", tone: "border-par text-muted", dots: 1 },
  policy: { label: "National strategy", detail: "fits Finland's cancer strategy; not proof that it works", tone: "border-rule text-muted", dots: 0 },
};

type StepState = { state: "waiting" | "running" | "done" | "skipped"; detail?: string };
type Run = { steps: Record<StepId, StepState>; result: RecommendResult | null; error: string | null };
const fresh = (): Run => ({ steps: { read: { state: "waiting" }, search: { state: "waiting" }, draft: { state: "waiting" }, check: { state: "waiting" }, review: { state: "waiting" } }, result: null, error: null });

export function Recommendations({ brief, cacheKey }: { brief: GapBrief; cacheKey: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    try {
      const saved = sessionStorage.getItem(cacheKey);
      if (saved) setRun({ ...fresh(), result: JSON.parse(saved) as RecommendResult });
    } catch {
      // nothing saved
    }
    return () => { alive.current = false; };
  }, [cacheKey]);

  async function start() {
    setBusy(true);
    setRun(fresh());
    const update = (f: (r: Run) => Run) => alive.current && setRun((r) => f(r ?? fresh()));
    try {
      const res = await fetch("/api/recommend", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(brief) });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const e = JSON.parse(line) as AgentEvent | { type: "error"; message: string };
          if (e.type === "step") update((r) => ({ ...r, steps: { ...r.steps, [e.step]: { state: e.state, detail: e.detail ?? r.steps[e.step].detail } } }));
          else if (e.type === "result") {
            update((r) => ({ ...r, result: e.result }));
            try { sessionStorage.setItem(cacheKey, JSON.stringify(e.result)); } catch { /* storage full or blocked */ }
          } else update((r) => ({ ...r, error: e.message }));
        }
      }
    } catch (e) {
      update((r) => ({ ...r, error: e instanceof Error ? e.message : "The agent could not be reached." }));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const result = run?.result ?? null;
  return (
    <section aria-labelledby="recs-h" className="mt-14 scroll-mt-6">
      <IconHeading icon={Sparkles} id="recs-h" className="text-title">Recommendations</IconHeading>

      {!run && (
        <FadeIn className="mt-4 max-w-3xl rounded-xl border border-rule bg-surface p-5">
          <p>
            An agent searches systematic reviews, guidelines and studies for what has closed gaps like this one, reads them against this
            gap&apos;s numbers, and drafts the most actionable steps, strongest evidence first.
          </p>
          <p className="mt-2 text-small text-muted">
            Only the gap&apos;s totals are sent, never the rows of your file. Every source, quote and number is checked, and a second agent reviews each
            recommendation against its evidence before you see it.
          </p>
          <button type="button" onClick={() => void start()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-medium text-white">
            <Sparkles aria-hidden size={16} /> Find recommendations
          </button>
        </FadeIn>
      )}

      {run && !result && (
        <ol className="mt-5 max-w-3xl space-y-3" aria-live="polite">
          {STEPS.filter((s) => run.steps[s.id].state !== "waiting").map((s) => {
            const st = run.steps[s.id];
            const Icon = st.state === "done" ? Check : st.state === "skipped" ? CircleSlash : s.icon;
            return (
              <FadeIn key={s.id}>
                <li className="flex items-start gap-3">
                  <Icon aria-hidden size={18} className={`mt-0.5 shrink-0 ${st.state === "done" ? "text-ahead" : "text-muted"}`} />
                  <div>
                    <p className={st.state === "running" ? "font-medium" : ""}>
                      {s.label} {st.state === "running" && <Thinking label={s.label} />}
                    </p>
                    {st.detail && <p className="text-small text-muted">{st.detail}</p>}
                  </div>
                </li>
              </FadeIn>
            );
          })}
          {run.error && <p role="alert" className="text-behind">{run.error}</p>}
        </ol>
      )}

      {result && (
        <div className="mt-5">
          {result.notes.length > 0 && <FadeIn><p className="mb-4 max-w-3xl text-small text-muted">{result.notes.join(" ")}</p></FadeIn>}
          <ol className="grid gap-4 lg:grid-cols-3">
            {result.recommendations.map((r, i) => (
              <li key={r.title}>
                <FadeIn delay={i * 180} className="h-full">
                  <RecCard rec={r} rank={i + 1} sources={result.sources} />
                </FadeIn>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <More label={`Sources the agent kept (${result.sources.filter((s) => s.strength !== "policy").length} from search)`} icon={BookOpenCheck}>
              <SourceList sources={result.sources} searched={result.searched} />
            </More>
            <button type="button" disabled={busy} onClick={() => void start()} className="inline-flex items-center gap-1.5 text-small text-muted hover:text-ink disabled:opacity-40">
              <RefreshCw aria-hidden size={14} /> Run again
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StrengthBadge({ strength }: { strength: Strength }) {
  const s = STRENGTH[strength];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium ${s.tone}`} title={`Best source: ${s.detail}`}>
      <span aria-hidden className="inline-flex gap-0.5">
        {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < s.dots ? "bg-current" : "border border-current opacity-40"}`} />)}
      </span>
      {s.label}
    </span>
  );
}

function RecCard({ rec, rank, sources }: { rec: RecommendResult["recommendations"][number]; rank: number; sources: Source[] }) {
  const field = (label: string, text: string) => (
    <div>
      <dt className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-small">{text}</dd>
    </div>
  );
  return (
    <article className="flex h-full flex-col rounded-xl border border-rule bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption tabular-nums text-muted">#{rank}</span>
        <StrengthBadge strength={rec.strength} />
      </div>
      <h3 className="mt-3 text-lede font-semibold leading-snug">{rec.title}</h3>
      <p className="mt-2">{rec.action}</p>
      <dl className="mt-4 space-y-3">
        {field("Why here", rec.why)}
        {field("First step this month", rec.firstStep)}
        {field("Who", rec.owner)}
        {field("How you'll see it work", rec.measure)}
      </dl>
      <div className="mt-4 border-t border-rule pt-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Evidence</p>
        <ul className="mt-1.5 space-y-2">
          {rec.sources.map((c) => {
            const s = sources.find((x) => x.id === c.id);
            return (
              <li key={c.id} className="text-small">
                <p>{c.says}</p>
                {c.quote && c.quote !== c.says && <blockquote className="mt-1 border-l-2 border-rule pl-2 text-caption italic text-muted">&ldquo;{c.quote}&rdquo;</blockquote>}
                {s && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-caption text-muted hover:text-ink">
                    {s.kind} · {s.publisher} <ExternalLink aria-hidden size={11} />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function SourceList({ sources, searched }: { sources: Source[]; searched: RecommendResult["searched"] }) {
  return (
    <div className="space-y-4 text-ink">
      <ol className="space-y-2">
        {sources.map((s) => (
          <li key={s.id} className="text-small">
            <a href={s.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{s.title}</a>
            <span className="text-muted"> · {s.kind} · {s.publisher} · {STRENGTH[s.strength].label.toLowerCase()}</span>
          </li>
        ))}
      </ol>
      {searched.length > 0 && (
        <p className="text-caption text-muted">
          Searched: {searched.map((q) => `"${q.query}" (${q.found} found)`).join("; ")}. Only sources from systematic-review and guideline bodies,
          peer-reviewed journals and national health agencies are kept.
        </p>
      )}
    </div>
  );
}
