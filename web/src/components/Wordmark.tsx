import Link from "next/link";

/**
 * The Läpi mark and name, linking home.
 * The mark is a path passing a gate: nobody falls out between a test and treatment.
 * It is drawn in the brand teal only, so the status colours keep meaning status.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`wordmark inline-flex items-center gap-2 ${className}`}>
      {/* Läpi ("through"): a path that passes a gate and carries on. */}
      <svg aria-hidden viewBox="0 0 30 16" width="30" height="16" className="shrink-0">
        <path d="M2 8 H25" stroke="var(--brand)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M20.5 3.5 L26.5 8 L20.5 12.5" fill="none" stroke="var(--brand)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="11" y="1" width="3.4" height="14" rx="1.7" fill="var(--brand-strong)" />
      </svg>
      <span className="text-[1.125rem] font-semibold tracking-[-0.015em]">Läpi</span>
    </Link>
  );
}
