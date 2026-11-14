import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { Autopilot } from "@/components/demo/Autopilot";

export const metadata: Metadata = { title: "Demo · Läpi" };

export default function DemoPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-10 sm:px-6">
      <div className="mx-auto w-full max-w-[96rem] pt-5">
        <Wordmark />
        <h1 className="mt-4 text-[length:var(--step-1)] font-semibold">Act on the phone; the board updates live.</h1>
        <Autopilot />
        <div className="mt-4 rounded-3xl bg-brand-soft p-4 sm:p-8">
          <div className="flex flex-wrap items-start justify-center gap-8 min-[1100px]:flex-nowrap">
            <figure className="flex shrink-0 flex-col items-center gap-3">
              <div className="rounded-[2.75rem] bg-ink p-2.5 shadow-[0_24px_60px_-20px_rgba(18,39,46,0.35)]">
                <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
                  <div aria-hidden className="absolute left-1/2 top-2 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-ink" />
                  <iframe src="/kit?embed=1" title="Phone app" className="block h-[760px] w-[375px] max-w-full border-0 bg-white" />
                </div>
              </div>
              <figcaption className="text-xs text-muted">The person (phone)</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-1 basis-[28rem] flex-col gap-3">
              <iframe src="/staff?embed=1" title="Nurse board" className="block h-[800px] w-full rounded-xl border border-rule bg-white" />
              <figcaption className="text-xs text-muted">The screening nurse</figcaption>
            </figure>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Demo: invented people; the robot, lab and bookings are simulated.</p>
      </div>
    </main>
  );
}
