/**
 * The Farmagusta name, as on the screening invitation: the name in brand blue, the service under it.
 * A plain link, not next/link: "/" is outside this app's /nurse base path.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/" className={`inline-flex flex-col leading-none ${className}`}>
      <span className="font-[family-name:var(--font-poppins)] text-[1.25rem] font-semibold text-brand-strong">Farmagusta</span>
      <span className="mt-1 border-t-2 border-accent pt-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Screening services</span>
    </a>
  );
}
