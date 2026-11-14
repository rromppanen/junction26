"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** How long a screen or question takes to fade out; matches `.fade-out` in globals.css. */
export const FADE_OUT_MS = 340;

/** Fades its children in, optionally after a delay, so lines on one screen arrive one after another. */
export function FadeIn({ delay = 0, className = "", children }: { delay?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`fade-in ${className}`} style={{ "--delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

/** `leave(then)` fades the current content out, then runs `then` (which usually swaps in the next content). */
export function useLeave() {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const leave = useCallback((then: () => void, wait = 0) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLeaving(true);
      timer.current = setTimeout(() => {
        then();
        setLeaving(false);
      }, FADE_OUT_MS);
    }, wait);
  }, []);
  return { leaving, leave };
}

/** Three pulsing dots: the AI is working. */
export function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-1 align-middle">
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-ink" />
      ))}
    </span>
  );
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
