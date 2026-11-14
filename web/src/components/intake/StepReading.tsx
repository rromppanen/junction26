"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionInput } from "@/lib/intake/clarify";
import type { Understanding } from "@/lib/intake/understand";
import { FadeIn, Thinking, postJson } from "./fade";

/** Keep the "reading" lines on screen long enough to be read, even when the answer is instant. */
const MIN_READING_MS = 2400;
/** How long the AI's summary stays before the first question fades in. */
const SUMMARY_MS = 2600;

type Props = {
  input: QuestionInput;
  fileName: string;
  onUnderstood: (u: Understanding) => void;
  onBack: () => void;
};

function summary(u: Understanding, fileName: string): string[] {
  const lines: string[] = [];
  if (u.columns.length) {
    const sure = u.columns.filter((c) => !u.questions.some((q) => q.column === c.header)).length;
    lines.push(
      sure === u.columns.length
        ? `I understood every column in ${fileName} on my own.`
        : `I understood ${sure} of ${u.columns.length} columns in ${fileName} on my own.`,
    );
  } else {
    lines.push("I know the public datasets already.");
  }
  if (u.place.countyId !== null && !u.questions.some((q) => q.kind === "county")) {
    const name = u.places.find((p) => p.value === String(u.place.countyId))?.label;
    if (name) lines.push(`Your figures look like they are from ${name}.`);
  }
  const n = u.questions.length;
  lines.push(n === 0 ? "I don't need to ask you anything." : n === 1 ? "I have one question for you." : `I have ${n} short questions for you.`);
  return lines;
}

/** The AI reads the data on its own first; only then does it decide what it needs to ask. */
export function StepReading({ input, fileName, onUnderstood, onBack }: Props) {
  const [result, setResult] = useState<Understanding | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const done = useRef(onUnderstood);
  done.current = onUnderstood;
  const inputRef = useRef(input);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setResult(null);
    const started = Date.now();
    postJson<Understanding>("/api/intake/understand", inputRef.current)
      .then((u) => {
        const wait = Math.max(0, MIN_READING_MS - (Date.now() - started));
        setTimeout(() => { if (!cancelled) setResult(u); }, wait);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [attempt]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => done.current(result), SUMMARY_MS);
    return () => clearTimeout(t);
  }, [result]);

  const hasFile = input.headers !== null;
  const steps = hasFile
    ? ["Reading your column names", "Looking at a few sample rows", "Matching them to screening figures"]
    : ["Opening the public datasets", "Checking what they cover"];

  if (failed) {
    return (
      <FadeIn className="space-y-6">
        <p className="text-title font-semibold">I couldn&apos;t read the data just now.</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-[6px] bg-ink px-5 py-2.5 font-medium text-white">
            Try again
          </button>
          <button type="button" onClick={onBack} className="rounded-[6px] border border-rule px-5 py-2.5 hover:bg-par-soft">
            Back
          </button>
        </div>
      </FadeIn>
    );
  }

  if (result) {
    return (
      <div className="space-y-3" aria-live="polite">
        {summary(result, fileName).map((line, i) => (
          <FadeIn key={line} delay={i * 520}>
            <p className={i === 0 ? "text-title font-semibold" : "text-lede text-muted"}>{line}</p>
          </FadeIn>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {steps.map((s, i) => (
        <FadeIn key={s} delay={i * 700}>
          <p className="text-lede text-muted">
            {s} {i === steps.length - 1 && <Thinking label="Reading your data" />}
          </p>
        </FadeIn>
      ))}
    </div>
  );
}
