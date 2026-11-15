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
