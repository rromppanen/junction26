import { serviceOption, type Break, type Costs, type CountyPathway } from "./pathway";
import type { ReachPlan } from "./reach";
import type { CountyMortality } from "./mortality";
import type { GapFacts, Indicator, Recommendation } from "./types";

/**
 * The county page's two-minute summary: one sentence each for the gap, where it starts, who is missed,
 * a costed option and the first action. Every number comes from figures the page already shows; a line
 * whose data is missing is left out rather than guessed.
 */
export type SummaryLine = { key: "gap" | "goal3" | "where" | "who" | "option" | "first"; label: string; text: string; href: string };

const nf = (d = 0) => new Intl.NumberFormat("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const n0 = (v: number) => nf(0).format(v);
const n1 = (v: number) => nf(1).format(v);
const eur = (v: number) => `€${n0(v)}`;

/** "Breast" from "Breast cancer screening attendance (mammography)". */
export function programmeName(ind: Indicator): string {
  return ind.nameEn.match(/^(\w+) cancer screening/i)?.[1] ?? ind.nameEn;
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function countySummary(input: {
  name: string;
  facts: GapFacts[];
  indicators: Indicator[];
  pathway: { pathway: CountyPathway; breaks: Break[] } | null;
  reach: { plan: ReachPlan; indicator: Indicator } | null;
  firstAction: Recommendation | undefined;
  costs: Costs;
  /** Goal 3 headline: cancer mortality, optional. */
  mortality?: CountyMortality | null;
}): SummaryLine[] {
  const { name, facts, indicators, pathway, reach, firstAction, costs, mortality } = input;
  const lines: SummaryLine[] = [];

  if (pathway) {
    const p = pathway.pathway;
    const opt = serviceOption(p, p.bestQuarter.examined, costs);
    if (opt.extraColonoscopies > 0 && opt.cost !== null) {
      return [
        { key: "gap", label: "Measured gap · bowel", href: "#funnel",
          text: `${n1(p.rates.examined)}% of positive bowel tests received a colonoscopy in the programme in ${p.year}; Finland was ${n1(p.national.examined)}%.` },
        { key: "where", label: "Comparison target", href: "#funnel",
          text: `Matching the best quarter of counties (${n1(p.bestQuarter.examined)}%) would mean ${n0(opt.extraColonoscopies)} additional colonoscopies a year. This is a scenario, not an observed outcome.` },
        { key: "option", label: "Modelled option", href: "#decide",
          text: `A nurse follows up positive tests without a booked colonoscopy. At the pre-filled unit prices, the scenario costs about ${eur(opt.cost)} a year. Check local costs and endoscopy capacity before choosing it.` },
        { key: "first", label: "First action to consider", href: "#decide",
          text: `Ask the bowel screening coordinator and endoscopy unit to review unbooked positive tests, confirm available capacity and compare the targets below. Other programmes and strategy actions follow in the supporting sections.` },
      ];
    }
  }

  // 1. The gap: the screening programme furthest below its national target.
  const short = facts
    .filter((f) => f.target !== null && f.value !== null && f.gapToTarget !== null)
    .sort((a, b) => (a.gapToTarget as number) - (b.gapToTarget as number));
  const worst = short[0];
  if (worst) {
    const ind = indicators.find((i) => i.id === worst.indicatorId);
    const prog = ind ? programmeName(ind) : "Screening";
    lines.push({
      key: "gap",
      label: "The gap",
      href: "#ind",
      text:
        (worst.gapToTarget as number) < 0
          ? `${prog} screening: ${n1(worst.value as number)}% took part in ${worst.year}, ${n1(Math.abs(worst.gapToTarget as number))} points short of the ${worst.target}% target${worst.national !== null ? ` (Finland ${n1(worst.national)}%)` : ""}.`
          : `Every screening programme with a figure meets the ${worst.target}% target; the lowest is ${prog.toLowerCase()} at ${n1(worst.value as number)}%.`,
    });
  }

  // 1b. Goal 3's headline measure: cancer deaths, age-standardised.
  if (mortality) {
    const { women, men, period } = mortality;
    const word = (s: CountyMortality["men"]) => (s.status === "on-par" ? "about level with" : s.diff > 0 ? "above" : "below");
    lines.push({
      key: "goal3",
      label: "Goal 3: deaths",
      href: "#ind",
      text: `Cancer deaths ${period}: ${n1(women.rate)} per 100,000 women (${word(women)} Finland's ${n1(women.national)}) and ${n1(men.rate)} per 100,000 men (${word(men)} Finland's ${n1(men.national)}), age-standardised.`,
    });
  }

  // 2. Where it starts: the larger break in the bowel screening funnel, against the best quarter of counties.
  const top = pathway?.breaks.find((b) => b.people > 0);
  if (pathway && top) {
    const found = `about ${n1(top.cancers)} cancers and ${n0(top.advanced)} advanced precursors a year`;
    lines.push({
      key: "where",
      label: "Where it starts",
      href: "#funnel",
      text:
        top.kind === "access"
          ? `In bowel screening, ${name} loses people before the test: ${n0(top.people)} more a year would return it if ${name} matched the best quarter of counties, ${found} (${pathway.pathway.year}).`
          : `In bowel screening, ${name} loses people after a positive test: ${n0(top.people)} more a year would get a colonoscopy if ${name} matched the best quarter of counties, ${found} (${pathway.pathway.year}).`,
    });
  }

  // 3. Who is missed: the lagging areas and their largest foreign languages.
  if (reach && reach.plan.areas.length > 0) {
    const areas = reach.plan.areas.slice(0, 3).map((a) => a.name);
    const langs = reach.plan.languages.slice(0, 3).map((l) => l.language);
    const prog = programmeName(reach.indicator);
    // A one-municipality county (Helsinki) has no smaller area to point at.
    const whole = reach.plan.areas.length === 1 && areas[0].toLowerCase() === name.toLowerCase();
    lines.push({
      key: "who",
      label: "Who is missed",
      href: "#reach",
      text: whole
        ? `${name} is a single municipality, so ${prog.toLowerCase()} screening outreach covers all of it. The largest foreign languages spoken there are ${list(langs)}.`
        : `${prog} screening attendance is lowest in ${list(areas)}. The largest foreign languages spoken there are ${list(langs)}.`,
    });
  }

  // 4. A costed option: follow up every positive bowel test, to the best quarter's level, at the cited unit prices.
  if (pathway) {
    const p = pathway.pathway;
    const opt = serviceOption(p, p.bestQuarter.examined, costs);
    if (opt.extraColonoscopies > 0 && opt.cost !== null) {
      lines.push({
        key: "option",
        label: "A costed option",
        href: "#decide",
        text: `A nurse calls every positive bowel test without a colonoscopy booked. Reaching the best quarter's ${n1(p.bestQuarter.examined)}% examined means ${n0(opt.extraColonoscopies)} more colonoscopies a year for about ${eur(opt.cost)}${opt.costPerFinding !== null ? `, ${eur(opt.costPerFinding)} per cancer or advanced precursor found` : ""}.`,
      });
    }
  }

  // 5. The first action from the brief, with its owner and timeframe.
  if (firstAction) {
    const action = firstAction.action.trim().replace(/\.$/, "");
    lines.push({
      key: "first",
      label: "First action",
      href: "#rec",
      text: `${action}. Who: ${firstAction.owner}. By when: ${firstAction.timeframe}.`,
    });
  }

  return lines;
}
