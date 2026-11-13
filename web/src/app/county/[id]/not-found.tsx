import Link from "next/link";

export default function CountyNotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-10 text-sm">
        <Link href="/" className="link">Back to the map</Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">There&rsquo;s no county at this address</h1>
      <p className="mt-4 max-w-xl text-muted">
        County pages use Sotkanet region numbers, and this one doesn&rsquo;t match any of Finland&rsquo;s wellbeing
        services counties. Pick a county from the map instead.
      </p>
    </main>
  );
}
