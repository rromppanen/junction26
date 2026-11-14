"use client";

import { useState } from "react";
import type { Lang } from "@/lib/sample/model";
import { FALLBACK_TEXT, type AskResult } from "@/lib/kitAsk";
import type { KitStrings } from "./strings";

export function AskBox({ t, lang }: { t: KitStrings["ask"]; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/kit/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as AskResult);
    } catch {
      setResult({ status: "fallback", answer: FALLBACK_TEXT[lang], factIds: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-rule pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline"
      >
        {t.toggle}
      </button>
      {open && (
        <div className="space-y-3 pb-1">
          <form onSubmit={send} className="flex gap-2">
            <input
              dir="auto"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              placeholder={t.placeholder}
              aria-label={t.toggle}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-rule bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="min-h-11 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "…" : t.send}
            </button>
          </form>
          <div aria-live="polite">
            {result && (
              <div className="space-y-2 rounded-xl border border-rule bg-brand-soft p-3">
                <span className="inline-block rounded-full border border-rule bg-surface px-2 py-0.5 text-xs text-muted">
                  {result.status === "ai" ? t.badgeAi : t.badgeStandard}
                </span>
                <p dir="auto" className="text-sm leading-relaxed">{result.answer}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted">{t.else}</p>
        </div>
      )}
    </section>
  );
}
