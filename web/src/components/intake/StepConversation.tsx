"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionInput } from "@/lib/intake/clarify";
import type { ConvQuestion, Interpretation } from "@/lib/intake/understand";
import { FadeIn, Thinking, postJson, useLeave } from "./fade";

/** What the conversation settled for each question: an allowed value, or null to keep the AI's default. */
export type Resolved = { question: ConvQuestion; value: string | null };

const ACK_MS = 1300;

type Props = {
  input: QuestionInput;
  questions: ConvQuestion[];
  onDone: (resolved: Resolved[]) => void;
};

function followUp(q: ConvQuestion): string {
  if (q.kind === "county") {
    return "Sorry, I didn't recognise that place. Try a county such as Pirkanmaa, a municipality such as Tampere, or say the whole country.";
  }
  return `Sorry, I didn't quite follow. Could you put it another way? For example: is "${q.column}" a year, a place, a number of people invited or screened, or something else?`;
}

/**
 * One question on screen at a time. The question fades in, the user answers in their own words,
 * the AI acknowledges what it understood, and the next question fades in.
 */
export function StepConversation({ input, questions, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState<string | null>(null);
  const resolved = useRef<Resolved[]>([]);
  const box = useRef<HTMLTextAreaElement>(null);
  const { leaving, leave } = useLeave();
  const q = questions[index];

  useEffect(() => {
    // Focus once the question has faded in, so the caret does not jump ahead of the text.
    const t = setTimeout(() => box.current?.focus({ preventScroll: true }), 650);
    return () => clearTimeout(t);
  }, [index, retry]);

  function settle(value: string | null, message: string) {
    resolved.current = [...resolved.current, { question: q, value }];
    setAck(message);
    leave(() => {
      setAck(null);
      setText("");
      setRetry(false);
      setBusy(false);
      if (index + 1 < questions.length) setIndex(index + 1);
      else onDone(resolved.current);
    }, ACK_MS);
  }

  const keepGuess = () =>
    settle(null, q.guess ? `No problem. I'll go with my best guess: ${q.guess.label.toLowerCase()}.` : "No problem, I'll leave that out for now.");

  async function answer() {
    const said = text.trim();
    if (!said || busy) return;
    setBusy(true);
    let r: Interpretation;
    try {
      r = await postJson<Interpretation>("/api/intake/answer", {
        input,
        question: { id: q.id, kind: q.kind, column: q.column, text: q.text },
        text: said,
        guess: q.guess?.value ?? null,
      });
    } catch {
      r = { result: "unclear" };
    }
    if (r.result === "matched") settle(r.value, `Got it: ${r.label.toLowerCase()}.`);
    else if (r.result === "skip") keepGuess();
    else if (!retry) {
      leave(() => {
        setRetry(true);
        setText("");
        setBusy(false);
      });
    } else keepGuess();
  }

  if (!q) return null;
  return (
    <div className={leaving ? "fade-out" : ""}>
      <div key={`${index}-${retry}`} className="space-y-8">
        <FadeIn>
          <p className="text-small text-muted">
            Question {index + 1} of {questions.length}
          </p>
        </FadeIn>
        <FadeIn delay={120}>
          <h2 className="text-title font-semibold leading-snug sm:text-heading">{retry ? followUp(q) : q.text}</h2>
        </FadeIn>

        {ack ? (
          <FadeIn>
            <p aria-live="polite" className="text-lede">{ack}</p>
          </FadeIn>
        ) : (
          <FadeIn delay={420} className="space-y-4">
            {q.guess && !retry && !q.confirm && (
              <p className="text-small text-muted">
                My best guess: <span className="font-medium text-ink">{q.guess.label}</span>
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void answer();
              }}
              className="space-y-3"
            >
              <textarea
                ref={box}
                rows={2}
                maxLength={300}
                value={text}
                disabled={busy}
                aria-label={retry ? followUp(q) : q.text}
                placeholder={q.confirm && !retry ? "Yes, or tell me what it really is" : "Type your answer"}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void answer();
                  }
                }}
                className="block w-full resize-none rounded-[6px] border border-rule bg-surface px-4 py-3 text-lede outline-none focus:border-ink disabled:opacity-60"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  className="rounded-[6px] bg-ink px-5 py-2.5 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {busy ? <Thinking label="Understanding your answer" /> : "Answer"}
                </button>
                {q.guess && !retry && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => settle(q.guess!.value, `Great: ${q.guess!.label.toLowerCase()}.`)}
                    className="rounded-[6px] border border-rule px-4 py-2.5 hover:bg-par-soft disabled:opacity-40"
                  >
                    Yes, that&apos;s it
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={keepGuess}
                  className="px-2 py-2.5 text-small text-muted hover:text-ink disabled:opacity-40"
                >
                  Skip
                </button>
              </div>
            </form>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
