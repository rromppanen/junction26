import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ImpactStrip } from "@/components/ImpactStrip";

const LINKS = [
  { href: "/demo", title: "Open the demo", text: "Phone and nurse board side by side, live.", primary: true },
  { href: "/kit", title: "Phone app", text: "Take the test at home and book the robot pickup." },
  { href: "/staff", title: "Nurse board", text: "Every sample on one board, stuck ones flagged." },
];

export default function StartPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <div className="mx-auto w-full max-w-4xl pt-5">
        <Wordmark />
        <h1 className="mt-8 text-[length:var(--step-3)] font-semibold leading-tight">
          Every bowel screening sample, from your home to the lab and on to care
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          A person takes the home test and books a pickup. A robot collects it, the lab reports, and a screening nurse follows every sample, so no positive result is left waiting for a colonoscopy.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`flex min-h-28 flex-col justify-between rounded-xl border p-4 ${l.primary ? "border-brand bg-brand text-white hover:bg-brand-strong" : "border-rule bg-white hover:bg-surface"}`}>
              <span className="text-lg font-semibold">{l.title}</span>
              <span className={`text-sm ${l.primary ? "text-white/90" : "text-muted"}`}>{l.text}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8"><ImpactStrip /></div>
        <p className="mt-6 text-sm">
          <Link href="/map" className="text-muted underline">County data explorer</Link>
        </p>
        <p className="mt-4 text-xs text-muted">Demo: invented people; the robot, lab and bookings are simulated.</p>
      </div>
    </main>
  );
}
