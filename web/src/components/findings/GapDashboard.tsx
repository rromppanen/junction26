"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnalysisLoading } from "./AnalysisLoading";
import { ArrowLeft, ArrowRight, ChartLine, Lightbulb, RotateCcw, Route, Table2 } from "lucide-react";
import { AppHeader, HeaderLink, IconHeading, More, Stat } from "@/components/ui";
import { FadeIn } from "@/components/intake/fade";
import { METRIC_LABEL, findGaps, gapDetail, gapId, impactOf, type GapDetail, type MetricId, type Steps } from "@/lib/gaps";
import type { GroupKind } from "@/lib/intake/fields";
import { FIGURE_TITLE, GroupFigure, TrendLine } from "./charts";
import { n0, pct, pts, sentence, trend } from "./findingWords";
import { KIND_ICON, groupLabel, groupPhrase, impactText } from "./groupWords";
import { Recommendations } from "./Recommendations";
import { useAnalysis } from "./useAnalysis";

/** One gap, opened from the grid: what it is, where in the pathway it happens, the numbers and a fitting figure. */
export function GapDashboard({ id }: { id: string }) {
  const loaded = useAnalysis();
  const data = useMemo(() => {
    if (!loaded || loaded === "missing") return null;
    const u = loaded.setup.upload;
    const table = { headers: u.headers, rows: loaded.rows };
    const report = findGaps(table, u.mapping, u.groupKinds ?? {});
    const detail = gapDetail(table, u.mapping, u.groupKinds ?? {}, id);
    const index = report.findings.findIndex((f) => gapId(f) === id);
    return { report, detail, index, setup: loaded.setup };
  }, [loaded, id]);

  if (loaded === null) return <AnalysisLoading />;
  if (!data?.detail) {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <FadeIn className="space-y-4">
          <h1 className="text-heading font-semibold">This gap is not in the current analysis</h1>
          <p className="text-lede text-muted">Your file stays in this browser tab only, so a gap link works only where the analysis was run.</p>
          <Link href={loaded === "missing" ? "/" : "/findings"} className="inline-block rounded-xl bg-brand px-6 py-3 font-medium text-white">
            {loaded === "missing" ? "Start an analysis" : "All gaps"}
          </Link>
        </FadeIn>
      </main>
    );
  }

  const { report, detail, index, setup } = data;
  const f = detail.finding;
  const d = f.dimension;
  const g = f.group;
  const Icon = KIND_ICON[d.kind];
  const who = groupPhrase(d.kind, d.label, g.value);
  const short = groupLabel(d.kind, g.value);
  const s = sentence(f);
  const t = trend(f, report.firstYear, report.years);
  const prev = report.findings[index - 1], next = report.findings[index + 1];
  const wait = f.metric === "wait";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/findings" icon={ArrowLeft} label="All gaps" />
        <HeaderLink href="/" icon={RotateCcw} label="New analysis" />
      </AppHeader>

      <FadeIn>
        <p className="inline-flex items-center gap-1.5 text-small text-muted">
          <Icon aria-hidden size={15} />
          Gap {index + 1} of {report.findings.length} · {d.label} · {METRIC_LABEL[f.metric]} · {detail.span}
        </p>
        <h1 className="mt-3 max-w-4xl text-title font-semibold leading-tight sm:text-heading">{s.lead}</h1>
        {(s.detail || t) && <p className="mt-3 max-w-3xl text-lede text-muted">{[s.detail, t].filter(Boolean).join(" ")}</p>}
      </FadeIn>

      <nav aria-label="Gap details" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[['where-h','Pathway'],['fig-h','Group comparison'],['recs-h','Recommendations'],['ideas-h','What to check']].map(([anchor,label]) => <a key={anchor} href={`#${anchor}`} className="inline-flex min-h-11 items-center rounded-md border border-rule px-3 py-2 hover:bg-surface">{label}</a>)}
      </nav>
      <p className="mt-4 text-sm text-muted">Source: {loaded !== "missing" && loaded.setup.upload.fileName}. Comparison: the other groups in this breakdown, {detail.span}.</p>
      <FadeIn delay={200} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-rule py-6 md:grid-cols-4">
        <Stat value={wait ? `${g.figure!.toFixed(0)} d` : pct(g.figure)} label={short} tone="text-behind" />
        <Stat value={wait ? `${g.rest!.toFixed(0)} d` : pct(g.rest)} label="Everyone else" />
        <Stat value={wait ? `+${g.gap!.toFixed(0)} d` : `−${pts(g.gap!)}`} label={wait ? "Longer wait" : "Gap"} tone="text-behind" />
        <Stat value={`≈${n0(impactOf(f))}`} label={wait ? "Calculated extra waiting days" : `Additional people at comparison rate`} />
      </FadeIn>

      <p className="mt-3 max-w-3xl text-sm text-muted">The impact is a comparison scenario, not a measured outcome of an intervention. Differences between groups do not establish their cause.</p>
      <FadeIn delay={350}>
        <section aria-labelledby="where-h" className="mt-12 scroll-mt-6">
          <IconHeading icon={Route} id="where-h" className="text-title">Where in the care pathway</IconHeading>
          <p className="mt-1 text-small text-muted">{who} at each step, against everyone else. The gap is at the outlined step.</p>
          <PathwayStrip detail={detail} label={short} />
        </section>
      </FadeIn>

      <FadeIn delay={500}>
        <section aria-labelledby="fig-h" className="mt-14 scroll-mt-6">
          <IconHeading icon={Icon} id="fig-h" className="text-title">{FIGURE_TITLE[d.kind]}</IconHeading>
          <p className="mt-1 mb-5 text-small text-muted">{METRIC_LABEL[f.metric]}, {detail.span}.</p>
          <GroupFigure kind={d.kind} groups={d.byMetric[f.metric]!} selected={g.value} metric={f.metric} />
        </section>
      </FadeIn>

      {detail.series.filter((p) => p.group !== null).length >= 2 && (
        <FadeIn delay={650}>
          <section aria-labelledby="time-h" className="mt-14 scroll-mt-6">
            <IconHeading icon={ChartLine} id="time-h" className="text-title">Over time</IconHeading>
            <p className="mt-1 mb-4 text-small text-muted">{METRIC_LABEL[f.metric]}, each year on its own.</p>
            <TrendLine series={detail.series} metric={f.metric} label={short} />
          </section>
        </FadeIn>
      )}

      <FadeIn delay={800}>
        <Recommendations
          cacheKey={`gapRadar.recs:${setup.upload.fileName}:${id}`}
          brief={{
            who, kind: d.kind, kindLabel: d.label, metric: f.metric, metricLabel: METRIC_LABEL[f.metric],
            figure: g.figure!, rest: g.rest!, gap: g.gap!, n: g.n, impact: impactOf(f), span: detail.span, trend: t,
            group: detail.group, others: detail.rest, source: setup.upload.fileName,
            // Public figures other than the county comparison are national; never let them read as the county's own.
            place: setup.upload.isPublic
              ? `the whole of Finland (national figures)${setup.placeName && setup.placeName !== "the whole country" ? `; the team works in ${setup.placeName}` : ""}`
              : (setup.placeName ?? null),
          }}
        />
      </FadeIn>

      <FadeIn delay={900}>
        <section aria-labelledby="ideas-h" className="mt-14 scroll-mt-6 rounded-lg border border-rule bg-surface p-5">
          <IconHeading icon={Lightbulb} id="ideas-h" className="text-title">Worth looking into</IconHeading>
          <p className="mt-1 text-small text-muted">Questions to check with the team, not findings from the data.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {ideas(f.metric, d.kind).map((q) => <li key={q}>{q}</li>)}
          </ul>
        </section>
      </FadeIn>

      <More label="The numbers behind this gap" icon={Table2} className="mt-12 scroll-mt-6">
        <NumbersTable detail={detail} label={short} />
      </More>

      <nav aria-label="Other gaps" className="mt-14 flex flex-wrap justify-between gap-4 border-t border-rule pt-5 text-small">
        {prev ? (
          <Link href={`/findings/${encodeURIComponent(gapId(prev))}`} className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md border border-rule px-3 py-2 hover:bg-surface">
            <ArrowLeft aria-hidden size={15} /> {groupPhrase(prev.dimension.kind, prev.dimension.label, prev.group.value)} · {impactText(prev.metric, impactOf(prev))}
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/findings/${encodeURIComponent(gapId(next))}`} className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md border border-rule px-3 py-2 hover:bg-surface">
            {groupPhrase(next.dimension.kind, next.dimension.label, next.group.value)} · {impactText(next.metric, impactOf(next))} <ArrowRight aria-hidden size={15} />
          </Link>
        )}
      </nav>
    </main>
  );
}

/* ---------- The pathway strip: each step for the group and for everyone else ---------- */

type Step = { key: keyof Steps; name: string; rate?: [keyof Steps, keyof Steps]; rateWord?: string; metric?: MetricId };
const STEPS: Step[] = [
  { key: "invited", name: "Invited" },
  { key: "attended", name: "Took part", rate: ["attended", "invited"], rateWord: "of invited", metric: "participation" },
  { key: "positive", name: "Positive result", rate: ["positive", "attended"], rateWord: "of those screened" },
  { key: "examined", name: "Follow-up done", rate: ["examined", "positive"], rateWord: "of positives", metric: "followUp" },
];
const ratio = (s: Steps, [a, b]: [keyof Steps, keyof Steps]) => (s[a] !== null && s[b] ? ((s[a] as number) / (s[b] as number)) * 100 : null);

function PathwayStrip({ detail, label }: { detail: GapDetail; label: string }) {
  const { group, rest, finding } = detail;
  const steps = STEPS.filter((st) => group[st.key] !== null);
  const waitAt = steps.findIndex((st) => st.key === "examined");
  return (
    <ol className="mt-5 grid gap-2 md:auto-cols-fr md:grid-flow-col">
      {steps.map((st, i) => {
        const here = st.metric === finding.metric;
        const gr = st.rate ? ratio(group, st.rate) : null, rr = st.rate ? ratio(rest, st.rate) : null;
        return (
          <li key={st.key} className="relative">
            {i === waitAt && group.waitDays !== null && (
              <p className={`mb-1 text-caption md:absolute md:-top-6 md:left-0 md:-translate-x-1/2 md:whitespace-nowrap ${finding.metric === "wait" ? "font-semibold text-behind" : "text-muted"}`}>
                Wait {group.waitDays.toFixed(0)} d vs {rest.waitDays?.toFixed(0)} d
              </p>
            )}
            <div className={`h-full rounded-xl border p-3 ${here || (finding.metric === "wait" && i === waitAt) ? "border-2 border-behind bg-surface" : "border-rule"}`}>
              <p className="flex items-center justify-between text-small font-semibold">
                {st.name}
                {i < steps.length - 1 && <ArrowRight aria-hidden size={14} className="hidden text-muted md:block" />}
              </p>
              <p className="mt-2 text-title font-semibold tabular-nums">{n0(group[st.key] as number)}</p>
              <p className="text-caption text-muted">{label}</p>
              {gr !== null && (
                <p className="mt-2 text-small tabular-nums">
                  <span className={here ? "font-semibold text-behind" : "font-semibold"}>{gr.toFixed(0)}%</span>{" "}
                  <span className="text-muted">vs {rr?.toFixed(0)}% {st.rateWord}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NumbersTable({ detail, label }: { detail: GapDetail; label: string }) {
  const rows: [string, (s: Steps) => string][] = [
    ["Invited", (s) => (s.invited === null ? "–" : n0(s.invited))],
    ["Took part", (s) => (s.attended === null ? "–" : `${n0(s.attended)} (${pct(ratio(s, ["attended", "invited"]))})`)],
    ["Positive result", (s) => (s.positive === null ? "–" : `${n0(s.positive)} (${pct(ratio(s, ["positive", "attended"]))})`)],
    ["Follow-up done", (s) => (s.examined === null ? "–" : `${n0(s.examined)} (${pct(ratio(s, ["examined", "positive"]))})`)],
    ["Average wait", (s) => (s.waitDays === null ? "–" : `${s.waitDays.toFixed(1)} days`)],
  ];
  return (
    <div className="overflow-x-auto"><table className="w-full min-w-[22rem] max-w-xl border-collapse text-left text-small text-ink">
      <thead>
        <tr>
          <th scope="col" className="border-b border-rule py-1.5 pr-4 font-semibold">{detail.span}</th>
          <th scope="col" className="border-b border-rule py-1.5 pr-4 text-right font-semibold">{label}</th>
          <th scope="col" className="border-b border-rule py-1.5 text-right font-semibold">Everyone else</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, f]) => (
          <tr key={name}>
            <th scope="row" className="border-b border-rule py-1.5 pr-4 font-normal">{name}</th>
            <td className="border-b border-rule py-1.5 pr-4 text-right tabular-nums">{f(detail.group)}</td>
            <td className="border-b border-rule py-1.5 text-right tabular-nums">{f(detail.rest)}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

/* ---------- Questions worth asking, by step and kind of group. Prompts, not claims about the data. ---------- */

const FOREIGN: GroupKind[] = ["language", "nationality", "birthCountry", "migrantBackground"];

function ideas(metric: MetricId, kind: GroupKind): string[] {
  if (metric === "wait") {
    return [
      "Where does the time go: the referral, booking the appointment, or capacity at the unit?",
      ...(FOREIGN.includes(kind) ? ["Does booking an interpreter add days before the appointment can be given?"] : []),
      ...(kind === "region" ? ["Do people here have to travel to another municipality, and do appointments wait for transport?"] : []),
      "Is there a target time from a positive result to follow-up, and who is told when it is missed?",
    ];
  }
  if (metric === "followUp") {
    return [
      "Who contacts people who have not booked their follow-up after a positive result, and when?",
      ...(FOREIGN.includes(kind) ? ["Is the result letter understandable in the languages this group reads, and is an interpreter offered for the follow-up?"] : []),
      ...(kind === "region" ? ["How far is the follow-up unit from here, and is help with travel offered?"] : []),
      ...(kind === "age" ? ["Do other illnesses in this age group make follow-up harder, and is that considered when booking?"] : []),
      "Does the team see who drops out between the result and the follow-up, by group?",
    ];
  }
  const byKind: Partial<Record<GroupKind, string[]>> = {
    language: ["Are the invitation and reminders available in this language, and do they reach people in it?", "Could community organisations or channels this group already uses carry the message?"],
    nationality: ["Does everyone in this group get an invitation, for example people who moved recently or have no Finnish address history?", "Are the invitation and instructions understandable without fluent Finnish or Swedish?"],
    birthCountry: ["Are the invitation and instructions understandable without fluent Finnish or Swedish?", "Is screening familiar in the countries this group comes from, and is its purpose explained?"],
    migrantBackground: ["Are the invitation and reminders available in the languages this group reads?", "Is the purpose of screening explained in a way that is familiar to people new to the Finnish system?"],
    sex: ["Would a reminder or an invitation written with this group in mind help?", "Is the screening practical for this group to do, for example the kit or the appointment times?"],
    age: ["Is this the first time this age group is invited? First invitations are often answered less.", "Would a reminder at a different time or in a different channel reach this age group better?"],
    region: ["How far is the nearest screening point, and is there public transport to it?", "Would a mobile unit, a mailed kit or extra appointment times help here?"],
  };
  return [...(byKind[kind] ?? ["What is different about how this group is invited or reached?"]), "Has a reminder for people who did not take part been tried, and with what result?"];
}
