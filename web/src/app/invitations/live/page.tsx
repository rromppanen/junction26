import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Invitation demo" };

/** The woman's phone and the screening unit's board side by side; both read the same round. */
export default function InviteLivePage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-10 sm:px-6">
      <div className="mx-auto w-full max-w-[96rem] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Wordmark />
          <nav className="flex gap-4 text-sm">
            <Link href="/invitations" className="link">Invitation designer</Link>
            <Link href="/invitations/phone" className="link">Phone only</Link>
            <Link href="/invitations/board" className="link">Board only</Link>
          </nav>
        </div>
        <h1 className="mt-4 text-[length:var(--step-1)] font-semibold">Act on the phone or the board; the other updates live.</h1>
        <div className="mt-4 rounded-3xl bg-brand-soft p-4 sm:p-8">
          <div className="flex flex-wrap items-start justify-center gap-8 min-[1100px]:flex-nowrap">
            <figure className="flex shrink-0 flex-col items-center gap-3">
              <div className="rounded-[2.75rem] bg-ink p-2.5 shadow-[0_24px_60px_-20px_rgba(18,39,46,0.35)]">
                <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
                  <div aria-hidden className="absolute left-1/2 top-2 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-ink" />
                  <iframe src="/invitations/phone" title="The woman's phone" className="block h-[760px] w-[375px] max-w-full border-0 bg-white" />
                </div>
              </div>
              <figcaption className="text-xs text-muted">The invited woman (phone)</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-1 basis-[28rem] flex-col gap-3">
              <iframe src="/invitations/board?embed=1" title="Screening unit board" className="block h-[800px] w-full rounded-xl border border-rule bg-white" />
              <figcaption className="text-xs text-muted">The screening unit</figcaption>
            </figure>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Demo: invented women and appointments; texts and Kanta checks are simulated.</p>
      </div>
    </main>
  );
}
