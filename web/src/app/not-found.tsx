import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-16 sm:mb-24">
        <Wordmark />
      </p>
      <h1 className="text-heading font-semibold tracking-[-0.015em] sm:text-display">There&rsquo;s no page at this address</h1>
      <p className="mt-4 max-w-xl text-muted">
        Gap Radar has two kinds of page: the map of all counties, and one brief for each county. If you typed the
        address, check the spelling. If a link brought you here, the county may be listed under a different number.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="link font-semibold">
          Find the county on the map
        </Link>
      </p>
    </main>
  );
}
