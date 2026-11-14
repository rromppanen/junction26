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
        This address doesn&rsquo;t match a page on the nurse board. Check the address or go back to the board.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="link font-semibold">
          Back to the nurse board
        </Link>
      </p>
    </main>
  );
}
