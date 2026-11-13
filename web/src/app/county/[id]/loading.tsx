// Shown while the analyst drafts the brief, which can take several seconds. Mirrors the brief's layout so
// the page doesn't jump when it arrives.
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8" aria-busy="true">
      <p className="mb-10 text-sm text-muted">Back to the map</p>
      <p className="text-sm text-muted">Cancer care brief</p>
      <div className="mt-2 h-12 w-2/3 max-w-md rounded-[2px] bg-par-soft sm:h-[5.5rem]" />
      <p className="mt-7 max-w-xl font-serif text-[1.35rem] leading-snug sm:text-[1.7rem]" role="status">
        Reading this county&rsquo;s figures and drafting the brief. It usually takes five to ten seconds.
      </p>
      <div className="mt-5 max-w-2xl space-y-2.5">
        <div className="h-3 w-full rounded-[2px] bg-par-soft" />
        <div className="h-3 w-11/12 rounded-[2px] bg-par-soft" />
        <div className="h-3 w-3/4 rounded-[2px] bg-par-soft" />
      </div>
      <div className="mt-10 grid gap-x-10 gap-y-4 border-t border-ink py-8 md:grid-cols-[10.5rem_minmax(0,1fr)]">
        <p className="font-semibold text-muted">Where along the pathway</p>
        <div className="h-3 w-4/5 max-w-xl rounded-[2px] bg-par-soft" />
      </div>
    </main>
  );
}
