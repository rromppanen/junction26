import type { LiveContext } from "@/lib/context";
import type { Indicator } from "@/lib/types";
import { MIN_BETTER } from "@/lib/peers";
import { fmt, host } from "@/components/format";
import { More } from "@/components/ui";

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
    <>
      <p className="text-xl leading-snug">
        <strong>{twinName}</strong>{" "}
        <span className="font-narrow font-bold tabular-nums">{fmt(twinValue, indicator.unit)}</span>
        <span className="text-muted"> vs {name} </span>
        <span className="font-narrow font-bold tabular-nums">{fmt(countyValue, indicator.unit)}</span>
      </p>
      <p className="mt-1 text-sm text-muted">{indicator.nameEn}</p>
      <More label="Why this county" className="mt-1">
        The county most like {name} in size and education level that does better on {name}&rsquo;s weakest measure,
        at least {MIN_BETTER} points ahead.
      </More>
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
    </>
  );
}
