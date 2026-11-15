"use client";

import { Wordmark } from "./Wordmark";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule bg-surface px-4 py-2 sm:px-6">
      <Wordmark />
      {children}
    </header>
  );
}

/** Demo-only controls, kept apart from the nurse's work at the foot of the page. */
export function DemoBar({
  onReset,
  children,
}: {
  onReset: () => void;
  children?: React.ReactNode;
}) {
  return (
    <footer className="mx-auto mt-10 flex w-full max-w-[96rem] flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-4 text-sm text-muted">
      <span className="font-semibold text-ink">Demo</span>
      <span>Invented people. Robots, lab and bookings are simulated.</span>
      <button
        type="button"
        onClick={onReset}
        className="min-h-11 rounded-lg border border-rule bg-white px-3 font-semibold text-brand hover:bg-brand-soft"
      >
        Reset demo
      </button>
      {children}
    </footer>
  );
}
