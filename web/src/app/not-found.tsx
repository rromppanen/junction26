import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <p className="mb-16 sm:mb-24">
        <Wordmark />
      </p>
      <h1 className="text-heading font-semibold tracking-[-0.015em] sm:text-display">There&rsquo;s no page at this address</h1>
      <p className="mt-4 max-w-xl text-muted">
        This address doesn&rsquo;t match a page in Gap Radar. Check the address or return to the national view
        to choose a county, compare screening figures or open the simulator.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="link font-semibold">
          Return to national view
        </Link>
      </p>
    </main>
  );
}
