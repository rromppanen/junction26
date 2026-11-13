"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-10 text-sm">
        <Link href="/" className="link">Back to the map</Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">This page didn&rsquo;t load</h1>
      <p className="mt-4 max-w-xl text-muted">
        The figures or the brief couldn&rsquo;t be fetched. Try again; if it keeps failing, the database or the analyst
        is probably down, and the map will still work from the saved copy of the figures.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-[3px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85"
      >
        Try again
      </button>
      {error.digest && <p className="mt-6 text-xs text-muted">Error reference {error.digest}</p>}
    </main>
  );
}
