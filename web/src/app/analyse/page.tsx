import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata: Metadata = { title: "Analyse your data" };

/** Deliberately bare: only the wordmark and the current step, so the user is never overloaded. */
export default function AnalysePage() {
  return (
    <main className="flex min-h-dvh flex-col px-4 sm:px-6">
      <div className="mx-auto w-full max-w-2xl pt-5">
        <Wordmark className="opacity-70 transition-opacity hover:opacity-100" />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-[12vh] pt-10">
        <IntakeFlow />
      </div>
    </main>
  );
}
