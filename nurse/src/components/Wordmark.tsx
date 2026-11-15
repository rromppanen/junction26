/**
 * The farmagusta wordmark, as in the pitch deck and the user app (web/): the name in lowercase with a
 * turquoise dot. A plain link, not next/link: "/" is outside this app's /nurse base path.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/" aria-label="farmagusta home"
      className={`wordmark inline-flex items-baseline font-[family-name:var(--font-poppins)] text-[1.25rem] font-semibold leading-none tracking-[-0.04em] text-brand ${className}`}>
      <span>farmagusta<span aria-hidden className="text-accent">.</span></span>
    </a>
  );
}
