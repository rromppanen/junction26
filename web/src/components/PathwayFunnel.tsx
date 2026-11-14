import { TriangleAlert } from "lucide-react";
import type { PathwayView } from "@/lib/pathwayData";
import { COLORECTAL_SOURCE } from "@/lib/pathwayData";
import { WAIT_SOURCE } from "@/data/registryWaits";
import { OPTION_EVIDENCE } from "@/data/pathwayCosts";
import { More } from "@/components/ui";
import { colorectalScreeningOperator, HUS_SCREENING_SOURCE } from "@/lib/screeningOperator";
import { EVIDENCE } from "@/data/evidence";

const n = (v: number) => v.toLocaleString("en-GB");

export const BREAK_TEXT = {
  access: { title: "Access break", step: "invitation → returned test", short: "people don't come" },
  service: { title: "Service break", step: "positive test → colonoscopy", short: "people come, but positives aren't examined" },
} as const;

/** Where people fall off the colorectal screening pathway in one county, in people, from Registry counts. */
export function PathwayFunnel({ view, name }: { view: PathwayView; name: string }) {
  const { pathway: p, breaks, waits } = view;
  const top = breaks[0];
  const hasBreak = top.people > 0;
  const steps: { label: string; count: number; rate?: { county: number; national: number; best: number; of: string } }[] = [
    { label: "Selected for an invitation", count: p.funnel.selected },
    { label: "Returned the test", count: p.funnel.participated, rate: { county: p.rates.participation, national: p.national.participation, best: p.bestQuarter.participation, of: "of those selected" } },
    { label: "Positive test", count: p.findings.positive },
    { label: "Colonoscopy in the programme", count: p.examinedPeople, rate: { county: p.rates.examined, national: p.national.examined, best: p.bestQuarter.examined, of: "of positives" } },
    { label: "Cancer found", count: p.findings.cancer },
  ];
  const wait = waits[0];
  const operator = colorectalScreeningOperator(name);
  const privateCare = EVIDENCE.find((e) => e.id === "roadmap-p11-lymphoma");

  return (
    <div>
      <p className="max-w-3xl font-serif text-[1.25rem] leading-snug">
        {hasBreak ? (
          <>
            {name} loses the most at the <strong>{BREAK_TEXT[top.kind].step}</strong> step: {n(top.people)}{" "}
            {top.kind === "access" ? "fewer people returned the test" : "fewer positives had a colonoscopy"} than at the rate of the best quarter of
            counties. At Finland&rsquo;s yield, that is about <strong>{top.cancers.toLocaleString("en-GB")} cancers</strong> and{" "}
            <strong>{n(top.advanced)} advanced precursors</strong> a year not found in the programme.
          </>
        ) : (
          <>{name} is at or above the best quarter of counties at both steps of colorectal screening.</>
        )}
      </p>
      {operator && (
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Who acts: {operator} organises colorectal screening for {name}, so a fix at either step needs {operator}&rsquo;s
          screening unit as well as the county.{" "}
          <a href={HUS_SCREENING_SOURCE} target="_blank" rel="noreferrer" className="link">HUS, 2 February 2026</a>.
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-xs text-muted">Colorectal screening in {name}, {p.year}: the latest year with complete follow-up.</caption>
          <thead>
            <tr className="border-b border-ink align-bottom">
              <th scope="col" className="py-2 pr-3 font-semibold">Step</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">People</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{name}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Finland</th>
              <th scope="col" className="py-2 font-semibold">Best quarter</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => {
              const behind = s.rate && s.rate.county < s.rate.best;
              return (
                <tr key={s.label} className="border-b border-rule align-top">
                  <th scope="row" className="py-2 pr-3 font-medium">{s.label}</th>
                  <td className="py-2 pr-3 text-right tabular-nums">{n(s.count)}</td>
                  <td className={`py-2 pr-3 tabular-nums ${behind ? "font-semibold text-behind" : ""}`}>
                    {s.rate ? <>{s.rate.county.toFixed(1)}% <span className="font-normal text-muted">{s.rate.of}</span></> : ""}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{s.rate ? `${s.rate.national.toFixed(1)}%` : ""}</td>
                  <td className="py-2 tabular-nums">{s.rate ? `${s.rate.best.toFixed(1)}%` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {breaks.map((b, i) => (
          <article key={b.kind} className={`border-t-2 pt-3 ${i === 0 && hasBreak ? "border-behind" : "border-rule"}`}>
            <h3 className="font-semibold">
              {BREAK_TEXT[b.kind].title} <span className="font-normal text-muted">({BREAK_TEXT[b.kind].short})</span>
            </h3>
            {b.people > 0 ? (
              <p className="mt-1 text-sm">
                {n(b.people)} {b.kind === "access" ? "more participants" : "more colonoscopies"} a year to match the best quarter: about{" "}
                {b.cancers.toLocaleString("en-GB")} cancers and {n(b.advanced)} advanced precursors found.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">At or above the best quarter of counties.</p>
            )}
            {b.kind === "service" && wait && (
              <p className="mt-2 text-sm">
                Median wait from positive test to colonoscopy: <strong>about {wait.county.toFixed(1)} months</strong> (Finland about{" "}
                {wait.national.toFixed(1)}), {wait.year}.{" "}
                <a href={WAIT_SOURCE.url} target="_blank" rel="noreferrer" className="link">Read from the Registry&rsquo;s chart</a>.
              </p>
            )}
          </article>
        ))}
      </div>

      <More label="Who doesn't take part (whole of Finland)" className="mt-6">
        <p className="mb-2">
          Colorectal screening participation by group, {view.groupsYear}. The Registry publishes these for the whole country only, from its own
          registers; they are not figures for {name}.
        </p>
        <ul className="space-y-0.5 text-ink">
          {view.groups.slice(0, 5).map((g) => (
            <li key={`${g.dimension}-${g.group}`} className="tabular-nums">
              {g.dimension === "language" ? "Mother tongue" : g.dimension === "education" ? "Education" : "Born in"}: {g.group}: <strong>{g.rate.toFixed(1)}%</strong>{" "}
              <span className="text-muted">({n(g.participated)} of {n(g.invited)})</span>
            </li>
          ))}
        </ul>
      </More>

      {view.intervalCancers && (
        <More label="Why the two breaks matter (whole of Finland)" className="mt-1">
          Of the {n(view.intervalCancers.screenDetected + view.intervalCancers.nonParticipant + view.intervalCancers.afterNegativeTest + view.intervalCancers.positiveNoColonoscopy)} bowel cancers found among people
          invited in {view.intervalCancers.cohortYear}, {n(view.intervalCancers.nonParticipant)} were in people who did not return the test and{" "}
          {n(view.intervalCancers.positiveNoColonoscopy)} in people with a positive test and no screening colonoscopy; {n(view.intervalCancers.screenDetected)} were
          found by screening.
        </More>
      )}

      <More label="What these figures can't tell you" icon={TriangleAlert} className="mt-1">
        <ul className="list-[square] space-y-1.5 pl-5 text-ink marker:text-par">
          <li>&ldquo;No colonoscopy in the programme&rdquo; is not proof that no examination happened: some people are examined in private or occupational care, and some have a medical reason not to be. Where more people use private or occupational care, part of this gap may be people examined outside the programme.{privateCare && <> Private care is a common route in Finland: <a href={privateCare.url} target="_blank" rel="noreferrer" className="link">Cancer roadmap, p. {privateCare.page}</a>.</>}</li>
          <li>Expected findings use Finland&rsquo;s yield per colonoscopy in {p.year} ({(p.yield.cancerPerColonoscopy * 100).toFixed(1)}% cancer, {(p.yield.advancedPerColonoscopy * 100).toFixed(1)}% advanced precursor), not {name}&rsquo;s own. People who don&rsquo;t come may differ.</li>
          <li>Waiting times are medians read from a chart. {OPTION_EVIDENCE.standard.note}</li>
          <li>The newest year is still being completed by the Registry, so this uses {p.year}.</li>
        </ul>
        <p className="mt-2">
          Source: <a href={COLORECTAL_SOURCE.url} target="_blank" rel="noreferrer" className="link">Finnish Cancer Registry, colorectal screening annual statistics</a>{" "}
          (counts by wellbeing services county).
        </p>
      </More>
    </div>
  );
}
