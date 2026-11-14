import Link from "next/link";

/** The farmagusta wordmark, shared with the pitch deck. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="farmagusta home" className={`wordmark inline-flex items-baseline font-heading text-[1.25rem] font-semibold tracking-[-0.04em] text-brand ${className}`}>
      <span>farmagusta<span aria-hidden className="text-accent">.</span></span>
    </Link>
  );
}
