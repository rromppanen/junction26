import Link from "next/link";

export function AnalysisLoading() {
  return <main id="main-content" tabIndex={-1} aria-busy="true" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
    <p role="status" className="text-lg font-semibold">Opening your analysis…</p>
    <p className="mt-2 text-muted">Reading the aggregate data saved in this browser tab.</p>
    <div aria-hidden="true" className="mt-8 grid gap-4 sm:grid-cols-3">{[0,1,2].map((n) => <div key={n} className="h-32 rounded-lg bg-par-soft" />)}</div>
    <Link href="/map" className="link mt-8 inline-flex min-h-11 items-center">Browse public data instead</Link>
  </main>;
}
