# junction26

> **Punchline:** Gap Radar shows each Finnish wellbeing services county where people fall off its cancer pathway, what closing each gap would cost and gain, and the material to act on it.

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | Gap Radar |
| Punchline | Gap Radar shows each Finnish wellbeing services county where people fall off its cancer pathway, what closing each gap would cost and gain, and the material to act on it. |
| Challenge(s) | AstraZeneca: Equal Care Across Finland. Tech bounties: Google DeepMind Best Use of Gemini API; Context.dev Fully Structured Web |
| Technologies | Next.js, TypeScript, Tailwind CSS, Gemini API, Context.dev, THL Sotkanet open data, Finnish Cancer Registry screening reports and statistics, Statistics Finland, Vitest, GitHub Actions |
| Demo link | _TBD_ |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck (PDF) | [`docs/pitch/`](docs/pitch/) |
| Pitch video (max 2:00) | _TBD_ |

## Description

**Problem.** Finland's National Cancer Strategy 2026–2035 promises equal cancer care in every region, yet comparison between regions is done only occasionally, with crude and fragmented measures (strategy p. 35). The gaps are real: about 249,000 screening invitations a year lead to no screening, one in five positive bowel-screening tests is never followed by a colonoscopy in the programme, and people whose mother tongue is not Finnish, Swedish or Sami take part at 53–61% against 75–83% for everyone else (Finnish Cancer Registry screening reports, 2023–2024). A county decision-maker has no quick way to see which of these gaps is theirs, what fixing it would cost, or what to do on Monday.

**Who it is for.** The cancer-care lead or screening coordinator of one of Finland's 21 wellbeing services counties (plus Helsinki and Åland), who has to take a costed proposal to the county board.

**What we built.** Gap Radar is a web app with one page per county:

- **In two minutes:** the county's biggest gap, its Goal 3 cancer-death rate against Finland, where the pathway breaks, who is missed, a costed option and the first action, each linked to the working.
- **See and locate:** a map and ranking on THL Sotkanet indicators, and the county's bowel-screening funnel in people (invited → tested → positive → colonoscopy) from Cancer Registry counts, with the larger break ranked by findings missed against the best quarter of counties.
- **Decide:** a board of options at four targets with people, colonoscopies, cancers and precursors found, cost a year and cost per finding, at cited unit prices (Pohjois-Pohjanmaa's 2025 price list). A breast screening simulator adds life-years, deaths averted, cost per life-year, sensitivity and uncertainty from two choices (the target and the outreach cost) and a cautious, central or optimistic reading of sourced evidence. The tools compare; the county chooses.
- **Act:** three sourced next steps with an owner and timeframe, invitation and SMS drafts in the largest foreign languages of the lagging areas, and a one-page board memo in Finnish.
- **Monitor:** a monthly kit for the delays nobody publishes yet (THL guidance 21/2016).

**How it works.** Tested code computes every number; nothing is predicted by AI. Gemini writes the brief and the translated drafts from those numbers only, and a validator rejects any figure or source not in the data before it reaches the screen; without Gemini, a rule-based brief takes its place. Context.dev finds the county's own public pages on cancer care. Every figure carries its source, and the simulator labels each one observed, inferred, simulated or expert insight.

**What's new.** Screening simulators exist (OncoSim in Canada, EU-TOPIA), and IHE publishes a national cancer dashboard for Finland. None of them works at the level of a Finnish wellbeing services county, from public data, ending in a costed decision and the material to act on it.

**Strategy goals.** Screening attendance is the Goal 2 target (80% in every county). Cancer mortality per county (Cancer Registry, 2020–2024, age-standardised) and breast, bowel and cervical cancer survival (Sotkanet) are the Goal 3 measures each county page shows.

**What's next.** Pilot with one county's screening team: load their own monthly delay figures, check whether the chosen option moved the funnel after six months, and add access times and stage at diagnosis as THL publishes them.

## Run locally

```
cd web
npm ci
npm run dev        # http://localhost:3000
```

Optional keys go in `web/.env.local`: `GEMINI_API_KEY` (AI analyst; without it a rule-based brief is shown), `GEMINI_MODEL`, `CONTEXT_DEV_API_KEY` (live web context), `DATABASE_URL` (otherwise the bundled Sotkanet snapshot is used). Run `npm run check` before pushing; CI runs the same checks.

`npm run smoke -- <base url>` loads every page once and fails on any error; run it against the deployed site before the demo to warm the pages. Deployment steps are in [docs/DEPLOY.md](docs/DEPLOY.md), and the pitch script and Q&A prep in [docs/pitch/script.md](docs/pitch/script.md).

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
