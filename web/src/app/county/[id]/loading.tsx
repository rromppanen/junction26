// Shown while the analyst drafts the brief, which can take several seconds.
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8" aria-busy="true">
      <p className="mb-10 text-sm text-muted">Back to the map</p>
      <p className="text-sm text-muted">Cancer care brief for</p>
      <div className="mt-2 h-14 w-2/3 max-w-md rounded-[3px] bg-par-soft sm:h-20" />
      <p className="mt-8 max-w-xl font-serif text-xl leading-snug" role="status">
        Reading this county&rsquo;s figures and drafting the brief. It usually takes five to ten seconds.
      </p>
      <div className="mt-6 space-y-2">
        <div className="h-3 w-full max-w-2xl rounded-[2px] bg-par-soft" />
        <div className="h-3 w-5/6 max-w-xl rounded-[2px] bg-par-soft" />
        <div className="h-3 w-2/3 max-w-lg rounded-[2px] bg-par-soft" />
      </div>
    </main>
  );
}
