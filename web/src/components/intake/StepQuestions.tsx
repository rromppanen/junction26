"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Sparkles } from "lucide-react";
import type { Answer, Question, QuestionInput } from "@/lib/intake/clarify";
import { suggestMapping, type Mapping } from "@/lib/intake/fields";
import type { Table } from "@/lib/intake/csv";
import type { Audience, Level, PublicDataset } from "@/lib/intake/setup";
import { IconHeading } from "@/components/ui";

export type QuestionsDone = {
  questions: Question[];
  mapping: Mapping | null;
  audience: Audience;
  level: Level;
  countyId: number | null;
  notes: string[];
};

type Loaded = { status: "ai" | "fallback"; questions: Question[]; suggested: Mapping | null };

type Props = {
  datasets: PublicDataset[];
  table: Table | null;
  onBack: () => void;
  onDone: (result: QuestionsDone) => void;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export function StepQuestions({ datasets, table, onBack, onDone }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { option?: string; text?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const input: QuestionInput = {
    datasets,
    headers: table ? table.headers : null,
    sample: table ? table.rows.slice(0, 5) : null,
  };

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setLoadError(null);
    postJson<Loaded>("/api/intake/questions", {
      datasets,
      headers: table ? table.headers : null,
      sample: table ? table.rows.slice(0, 5) : null,
    })
      .then((r) => { if (!cancelled) setLoaded(r); })
      .catch(() => { if (!cancelled) setLoadError("Could not load the questions."); });
    return () => { cancelled = true; };
  }, [datasets, table, attempt]);

  function setOption(id: string, option: string) {
    setAnswers((a) => ({ ...a, [id]: { option } }));
  }
  function setText(id: string, text: string) {
    setAnswers((a) => ({ ...a, [id]: text ? { text } : {} }));
  }

  async function submit() {
    if (!loaded) return;
    setSubmitting(true);
    const list: Answer[] = [];
    for (const q of loaded.questions) {
      const a = answers[q.id];
      if (a?.option) list.push({ questionId: q.id, option: a.option });
      else if (a?.text?.trim()) list.push({ questionId: q.id, text: a.text.trim() });
    }
    try {
      const r = await postJson<{
        mapping: Mapping | null; audience: Audience; level: Level; countyId: number | null; notes: string[];
      }>("/api/intake/mapping", { input, questions: loaded.questions, answers: list });
      if (alive.current) onDone({ questions: loaded.questions, ...r });
    } catch {
      if (alive.current) onDone({
        questions: loaded.questions,
        mapping: table ? (loaded.suggested ?? suggestMapping(table.headers)) : null,
        audience: "county-board",
        level: "county",
        countyId: null,
        notes: ["Your answers could not be processed, so the standard suggestions are used. Please check each setting."],
      });
    }
  }

  return (
    <section aria-labelledby="step2-h" className="space-y-6">
      <IconHeading icon={MessageCircleQuestion} as="h3" id="step2-h" className="text-lg">
        A few questions about your data
      </IconHeading>

      {!loaded && !loadError && <p className="text-sm text-muted">Loading questions…</p>}
      {loadError && (
        <div role="alert" className="max-w-2xl rounded-[3px] border border-rule bg-par-soft p-3 text-sm">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-2 rounded-[3px] border border-rule px-3 py-1.5 hover:bg-white"
          >
            Retry
          </button>
        </div>
      )}

      {loaded && (
        <>
          <p className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule px-2 py-1 text-xs text-muted">
            <Sparkles aria-hidden size={13} />
            {loaded.status === "ai" ? "Asked by Gemini" : "Standard questions"}
          </p>
          <ol className="space-y-6">
            {loaded.questions.map((q) => {
              const a = answers[q.id] ?? {};
              return (
                <li key={q.id}>
                  <p className="font-medium">{q.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={a.option === o.value}
                        onClick={() => setOption(q.id, o.value)}
                        className={`rounded-[3px] border px-3 py-1.5 text-sm ${
                          a.option === o.value ? "border-ink bg-ink text-white" : "border-rule hover:bg-par-soft"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    aria-label={`Your own answer to: ${q.text}`}
                    placeholder="or answer in your own words"
                    maxLength={300}
                    value={a.text ?? ""}
                    onChange={(e) => setText(q.id, e.target.value)}
                    className="mt-2 block w-full max-w-md rounded-[3px] border border-rule px-2 py-1.5 text-sm"
                  />
                </li>
              );
            })}
          </ol>
          <p className="max-w-2xl text-sm text-muted">You can skip any question; the suggested setting is kept.</p>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={onBack}
          className="rounded-[3px] border border-rule px-3 py-1.5 text-sm hover:bg-par-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {loaded && (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-[3px] bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Working…" : "Continue"}
          </button>
        )}
      </div>
    </section>
  );
}
