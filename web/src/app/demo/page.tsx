import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Demo · Läpi" };

export default function DemoPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-10 sm:px-6">
      <div className="mx-auto w-full max-w-[96rem] pt-5">
        <Wordmark />
        <h1 className="mt-4 text-[length:var(--step-1)] font-semibold">Act on the phone; the board updates live.</h1>
        <p className="mt-1 text-xs text-muted">Demo: invented people; the robot, lab and bookings are simulated.</p>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <iframe src="/kit" title="Phone app" className="h-[800px] w-[390px] max-w-full shrink-0 rounded-[1.75rem] border-2 border-rule bg-white" />
          <iframe src="/staff" title="Nurse board" className="h-[800px] min-w-0 flex-1 basis-[28rem] rounded-xl border border-rule bg-white" />
        </div>
      </div>
    </main>
  );
}
