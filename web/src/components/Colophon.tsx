/**
 * One line on who made this and how far to trust it. Sits under the DataBadge in a page footer.
 */
export function Colophon({ className = "" }: { className?: string }) {
  return (
    <p className={`max-w-prose text-xs text-muted ${className}`}>
      Made by a small team at Junction 2026 for the AstraZeneca challenge on equal cancer care. The county briefs are
      written by an AI model from the public figures; treat them as a first draft for the people who run the services.
    </p>
  );
}
