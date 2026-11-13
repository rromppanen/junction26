import Link from "next/link";

/**
 * The Gap Radar mark and name, linking home.
 * The mark is the care pathway reduced to three stops: figures, a stretch with none, figures.
 * It is drawn in ink and grey only, so the status colours keep meaning status.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`wordmark inline-flex items-center gap-2 ${className}`}>
      <svg aria-hidden viewBox="0 0 34 12" width="34" height="12" className="shrink-0 translate-y-[0.5px]">
        <circle cx="5" cy="6" r="4.5" fill="var(--ink)" />
        <circle cx="13" cy="6" r="1.4" fill="var(--par)" />
        <circle cx="19" cy="6" r="1.4" fill="var(--par)" />
        <circle cx="28.5" cy="6" r="3.6" fill="none" stroke="var(--ink)" strokeWidth="2.2" />
      </svg>
      <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">Gap Radar</span>
    </Link>
  );
}
