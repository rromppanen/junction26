import type { LiveContext } from "@/lib/context";
import type { Indicator } from "@/lib/types";
import { MIN_BETTER } from "@/lib/peers";
import { fmt } from "@/components/format";

function host(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Most similar county doing better on this county's weakest measure, and what it publishes about it. */
export function PeerTwin({
  name, twinName, indicator, countyValue, twinValue, practices,
}: {
  name: string;
  twinName: string;
  indicator: Indicator;
  countyValue: number;
  twinValue: number;
  practices: LiveContext;
}) {
  return (
    <section className="mb-14 print-break" aria-labelledby="peer-h">
      <h2 id="peer-h" className="mb-2 text-2xl font-semibold tracking-tight">A county to learn from</h2>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        The county most like {name} in size and education level that does better on {name}&rsquo;s weakest
        measure, at least {MIN_BETTER} points ahead.
      </p>
      <p className="border-t border-ink pt-5 font-serif text-xl leading-snug">
        Most similar county doing better: <strong>{twinName}</strong>{" "}
        (<span className="tabular-nums">{fmt(twinValue, indicator.unit)}</span> vs{" "}
        <span className="tabular-nums">{fmt(countyValue, indicator.unit)}</span>).
      </p>
      <p className="mt-1 text-xs text-muted">{indicator.nameEn}</p>
      <h3 className="mb-2 mt-5 text-sm font-semibold">
        {indicator.stage === "outcome" ? "What they publish about their care pathway" : "What they publish about invitations and reminders"}
      </h3>
      {practices.snippets.length > 0 ? (
        <ul className="grid gap-x-10 gap-y-5 text-sm md:grid-cols-2">
          {practices.snippets.map((l) => (
            <li key={l.id} className="print-break">
              <a href={l.url} target="_blank" rel="noreferrer" className="link font-medium">{l.title}</a>
              <span className="mt-0.5 block truncate text-xs text-muted">{host(l.url)}</span>
              <span className="mt-1.5 block leading-relaxed">{l.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {practices.status === "not-configured"
            ? "Live search is off, so there are no practices to show here."
            : practices.status === "empty"
              ? `The search found no public pages from ${twinName} about this.`
              : "The web search didn’t answer just now."}
        </p>
      )}
    </section>
  );
}
