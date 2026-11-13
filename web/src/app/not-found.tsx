import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-10 text-sm">
        <Link href="/" className="link">Back to the map</Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Nothing lives at this address</h1>
      <p className="mt-4 max-w-xl text-muted">
        Gap Radar has two kinds of page: the map of all counties, and one brief per county. Start from the map.
      </p>
    </main>
  );
}
