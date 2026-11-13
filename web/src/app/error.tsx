"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-16 sm:mb-24">
        <Wordmark />
      </p>
      <h1 className="text-heading font-semibold tracking-[-0.015em] sm:text-display">This page didn&rsquo;t load</h1>
      <p className="mt-4 max-w-xl text-muted">
        Gap Radar couldn&rsquo;t reach the figures or the written brief. Load the page again. If it fails a second time,
        the database or the AI analyst is probably down; the map still works from the saved copy of the figures.
      </p>
      <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded-[3px] bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink/85"
        >
          Load the page again
        </button>
        <Link href="/" className="link">
          Open the map
        </Link>
      </p>
      {error.digest && (
        <p className="mt-10 text-xs text-muted">
          If you report this, quote the reference <span className="font-mono">{error.digest}</span>.
        </p>
      )}
    </main>
  );
}
