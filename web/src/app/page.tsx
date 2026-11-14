import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { FollowUpBoard } from "@/components/followup/FollowUpBoard";

/**
 * The start page: the follow-up workspace for positive bowel screening tests.
 * The earlier gap explorer (map, county pages, analysis) stays reachable as supporting evidence.
 */
export default function StartPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 pt-5">
        <Wordmark />
        <Link href="/map" className="inline-flex min-h-11 items-center rounded-md border border-rule px-3 py-2 text-sm font-medium hover:bg-surface">County data explorer</Link>
      </div>
      <div className="mx-auto w-full max-w-6xl pt-6">
        <h1 className="text-[length:var(--step-3)] font-semibold leading-tight">Screening follow-up workspace</h1>
        <p className="mt-1 max-w-3xl text-muted">
          For the screening nurse: every positive bowel screening test gets an owner, a next action and a history until the colonoscopy is done. Demo with invented patients; messages and bookings are simulated.
        </p>
        <div className="mt-6">
          <FollowUpBoard />
        </div>
      </div>
    </main>
  );
}
