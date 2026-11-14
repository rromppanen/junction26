/** The farmagusta wordmark, shared with the pitch deck. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    // Cross-app link: next/link would prefix the /nurse base path.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/" aria-label="farmagusta home" className={`wordmark inline-flex items-baseline font-heading text-[1.25rem] font-semibold tracking-[-0.04em] text-brand ${className}`}>
      <span>farmagusta<span aria-hidden className="text-accent">.</span></span>
    </a>
  );
}
