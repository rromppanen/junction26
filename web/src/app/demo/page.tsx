import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { DemoStage } from "@/components/demo/DemoStage";

export const metadata: Metadata = { title: "Demo · Läpi" };

export default function DemoPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-10 sm:px-6">
      <div className="mx-auto w-full max-w-[96rem] pt-5">
        <Wordmark />
        <h1 className="mt-4 text-[length:var(--step-1)] font-semibold">Act on the phone; the board updates live.</h1>
        <DemoStage />
        <p className="mt-3 text-xs text-muted">Demo: invented people; the robot, lab and bookings are simulated.</p>
      </div>
    </main>
  );
}
