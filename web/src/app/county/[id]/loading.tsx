import Link from "next/link";

// Shown while the analyst drafts the brief, which can take several seconds. Mirrors the brief's layout so
// the page doesn't jump when it arrives.
export default function Loading() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8" aria-busy="true">
      <p className="mb-10 text-sm"><Link href="/" className="link">Back to national view</Link></p>
      <p className="text-sm text-muted">Cancer care brief</p>
      <div className="mt-2 h-12 w-2/3 max-w-md rounded-[2px] bg-par-soft sm:h-[5.5rem]" />
      <p className="mt-7 max-w-xl font-serif text-[1.35rem] leading-snug sm:text-[1.7rem]" role="status">
        Loading the county&rsquo;s figures and preparing its brief. You can return to the national view while this loads.
      </p>
      <div className="mt-5 max-w-2xl space-y-2.5">
        <div className="h-3 w-full rounded-[2px] bg-par-soft" />
        <div className="h-3 w-11/12 rounded-[2px] bg-par-soft" />
        <div className="h-3 w-3/4 rounded-[2px] bg-par-soft" />
      </div>
      <div className="mt-10 grid gap-x-10 gap-y-4 border-t border-ink py-8 md:grid-cols-[10.5rem_minmax(0,1fr)]">
        <p className="font-semibold text-muted">County evidence and options</p>
        <div className="h-3 w-4/5 max-w-xl rounded-[2px] bg-par-soft" />
      </div>
    </main>
  );
}
