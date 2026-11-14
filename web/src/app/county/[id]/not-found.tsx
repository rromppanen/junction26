import Link from "next/link";

export default function CountyNotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-10 text-sm">
        <Link href="/" className="link">Back to the map</Link>
      </p>
      <p className="text-sm text-muted">Cancer care brief</p>
      <h1 className="font-narrow mt-1 text-4xl font-bold leading-[0.95] sm:text-6xl">No county at this address</h1>
      <p className="mt-6 max-w-xl leading-relaxed">
        County pages are numbered with Sotkanet&rsquo;s region codes, and this number doesn&rsquo;t match any of
        Finland&rsquo;s wellbeing services counties. <Link href="/" className="link">Choose a county on the map</Link> to
        open its brief.
      </p>
    </main>
  );
}
