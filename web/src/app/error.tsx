"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-16 sm:mb-24">
        <Wordmark />
      </p>
      <h1 className="text-heading font-semibold tracking-[-0.015em] sm:text-display">This page didn&rsquo;t load</h1>
      <p className="mt-4 max-w-xl text-muted">
        We couldn&rsquo;t finish loading this page. Try again, or return to the national view to choose another county.
        If the problem continues, share the reference below with the team.
      </p>
      <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded-[3px] bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink/85"
        >
          Try again
        </button>
        <Link href="/map" className="link">
          Return to national view
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
