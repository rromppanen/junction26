"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

const ITEMS = [
  { href: "/", label: "Participants" },
  { href: "/robots", label: "Robots" },
];

/** The white bar at the top of every nurse page, like the header of the user app. */
export function AppHeader() {
  const path = usePathname();
  return (
    <header className="-mx-4 border-b border-rule bg-surface px-4 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex min-h-16 w-full max-w-[96rem] items-center justify-between gap-4">
        <Wordmark />
        <nav aria-label="Nurse views" className="flex h-16 items-stretch gap-1">
          {ITEMS.map((i) => {
            const on = path === i.href;
            return (
              <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
                className={`flex items-center border-b-[3px] px-3 text-sm font-semibold ${on ? "border-brand text-brand-strong" : "border-transparent text-muted hover:text-brand"}`}>
                {i.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Demo-only controls, kept apart from the nurse's work at the foot of the page. */
export function DemoBar({ onReset, children }: { onReset: () => void; children?: React.ReactNode }) {
  return (
    <footer className="mx-auto mt-10 flex w-full max-w-[96rem] flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-4 text-sm text-muted">
      <span className="font-semibold text-ink">Demo</span>
      <span>Invented people. Robots, lab and bookings are simulated.</span>
      {children}
      <button type="button" onClick={onReset} className="min-h-11 rounded-lg border border-rule bg-white px-3 font-semibold text-brand hover:bg-brand-soft">
        Start again
      </button>
    </footer>
  );
}
