import { EVIDENCE } from "@/data/evidence";
import type { ReachPlan } from "@/lib/reach";
import type { ReachDrafts } from "@/lib/reachDrafts";
import { More } from "@/components/ui";
import { Link2 } from "lucide-react";

/**
 * "Reach them": areas with more speakers of other languages, the languages, actions and draft messages.
 * Language data describes residents, not who was invited, so nothing here says who did or did not attend.
 */
export function ReachThem({
  plan, drafts, programme, target, toTarget, name,
}: {
  plan: ReachPlan | null;
  drafts: ReachDrafts | null;
  programme: string; // e.g. "Breast"
  target: number | null;
  toTarget: number | null;
  name: string;
}) {
  if (!plan) {
    return (
      <p className="max-w-2xl text-sm text-muted">
        There are no language figures for the areas of {name} that need the most attention, so no kit can be built here yet.
      </p>
    );
  }
  const ev = EVIDENCE.find((e) => e.id === plan.actions[0]?.evidenceId);
  return (
    <div>
      <p className="max-w-2xl">
        Start with {programme.toLowerCase()} cancer screening, the screening furthest from its {target}% target.
        {toTarget !== null && toTarget > 0 && (
          <> To reach {target}%: <strong className="tabular-nums">+{toTarget} per 1,000 invited</strong>.</>
        )}
      </p>

      <h3 className="mt-6 font-semibold">Where</h3>
      <p className="mt-1 max-w-2xl text-sm">{plan.areas.map((a) => a.name).join(", ")}</p>

      <h3 className="mt-6 font-semibold">Languages to start with</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        These areas have more speakers of these languages among their residents. The figures describe residents, not who was invited or who attended.
      </p>
      <table className="mt-3 w-full max-w-lg border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink">
            <th scope="col" className="py-2 pr-3 font-semibold">Language</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Residents</th>
            <th scope="col" className="py-2 font-semibold">Share of residents</th>
          </tr>
        </thead>
        <tbody>
          {plan.languages.map((l) => (
            <tr key={l.language} className="border-b border-rule">
              <th scope="row" className="py-2 pr-3 font-medium">{l.language}</th>
              <td className="py-2 pr-3 tabular-nums">{l.count.toLocaleString("en-GB")}</td>
              <td className="py-2 tabular-nums">{l.sharePct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">Source: Statistics Finland, table 11rm, {plan.year}.</p>

      <h3 className="mt-8 font-semibold">What to do</h3>
      <ul className="mt-2 space-y-2">
        {plan.actions.map((a) => (
          <li key={a.text} className="flex flex-wrap items-baseline gap-x-3">
            <span className="max-w-2xl">{a.text}</span>
            {ev && (
              <a href={ev.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-xs" title={ev.titleEn}>
                <Link2 aria-hidden size={12} /> Cancer roadmap, p. {ev.page}
              </a>
            )}
          </li>
        ))}
      </ul>

      {drafts && (
        <details className="more mt-8 rounded-lg border border-rule p-4"><summary className="cursor-pointer font-semibold">View draft invitations and SMS templates</summary>
          <p className="mt-1 text-sm font-medium text-behind">Draft — have a native speaker check before use</p>
          {drafts.status === "fallback" && (
            <p className="mt-1 max-w-2xl text-sm text-muted">
              The AI translator didn&rsquo;t answer, so only an English template is shown. Translate it into the languages above.
            </p>
          )}
          {drafts.withheld.length > 0 && (
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Withheld after an automatic check, because the AI&rsquo;s text failed twice:{" "}
              {drafts.withheld.map((w) => `${w.language} (${w.reason})`).join("; ")}. Have these translated by a person.
            </p>
          )}
          <div className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
            {drafts.drafts.map((d) => (
              <article key={d.language} className="border-t border-ink pt-3">
                <h4 className="font-semibold">{d.language}</h4>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">Invitation</p>
                <p className="mt-0.5 font-serif leading-snug">{d.invitation}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">SMS</p>
                <p className="mt-0.5 font-serif leading-snug">{d.sms}</p>
                {drafts.status === "ok" && (
                  <>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">English back-translation</p>
                    <p className="mt-0.5 text-sm text-muted">{d.backTranslation}</p>
                  </>
                )}
              </article>
            ))}
          </div>
          <More label="About these drafts" className="mt-4">
            Gemini wrote the drafts from fixed rules: plain language, free of charge, how to book through [phone] and [link], an interpreter is welcome, no other medical claims. Replace the placeholders before sending.
          </More>
        </details>
      )}
    </div>
  );
}
