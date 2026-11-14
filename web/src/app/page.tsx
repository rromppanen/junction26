import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { IntakeFlow } from "@/components/intake/IntakeFlow";

/** The start page. Deliberately bare: the wordmark, a way to the map, and the current step, so the user is never overloaded. */
export default function StartPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between pt-5">
        <Wordmark className="opacity-70 transition-opacity hover:opacity-100" />
        <Link href="/map" className="text-small text-muted hover:text-ink">Browse the map</Link>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-[12vh] pt-10">
        <IntakeFlow />
      </div>
    </main>
  );
}
