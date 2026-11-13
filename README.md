# junction26

> **Punchline:** Gap Radar shows each Finnish wellbeing services county where its cancer care falls behind the rest of the country, and three sourced actions to close the gap.

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | Gap Radar |
| Punchline | Gap Radar shows each Finnish wellbeing services county where its cancer care falls behind the rest of the country, and three sourced actions to close the gap. |
| Challenge(s) | AstraZeneca: Equal Care Across Finland. Tech bounties: Google DeepMind Best Use of Gemini API; Context.dev Fully Structured Web |
| Technologies | Next.js, TypeScript, Tailwind CSS, Gemini API, Context.dev, Sotkanet (THL) open data, Vitest, GitHub Actions |
| Demo link | _TBD_ |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck (PDF) | [`docs/pitch/`](docs/pitch/) |
| Pitch video (max 2:00) | _TBD_ |

## Description

**Problem.** Finland's National Cancer Strategy 2026–2035 promises equal cancer care in every region, yet comparison between regions is done only occasionally, with crude and fragmented measures (strategy p. 35). A county decision-maker has no quick way to see where their county falls behind or what to do about it.

**What we built.** Gap Radar is a web app for decision-makers in Finland's wellbeing services counties. For each of the 23 regions (21 wellbeing services counties, Helsinki and Åland) it compares public Sotkanet indicators with the national level and the best-performing quarter of counties: screening attendance for breast, colorectal and cervical cancer, and 5-year survival for breast and bowel cancer. A map and ranking show where the gaps are, and each county gets a one-page brief that names its largest gap, places it on the care pathway (detection to outcome), and proposes three concrete actions with an owner, a timeframe and the strategy goal they move.

**How it works.** A tested gap engine computes every number. A Gemini analyst writes the brief from those numbers only, and a validator rejects any figure or source that is not backed by the data before it reaches the screen; without Gemini, a rule-based brief takes its place. Context.dev searches the web live for the county's own public pages on cancer care and access times, so the brief shows what the county already says publicly. Every claim links to Sotkanet, the strategy or the roadmap.

**What's next.** Add indicators as THL publishes them, especially access times and stage at diagnosis, track whether gaps close over time, and test the briefs with county cancer-care leads.

## Run locally

```
cd web
npm ci
npm run dev        # http://localhost:3000
```

Optional keys go in `web/.env.local`: `GEMINI_API_KEY` (AI analyst; without it a rule-based brief is shown), `GEMINI_MODEL`, `CONTEXT_DEV_API_KEY` (live web context), `DATABASE_URL` (otherwise the bundled Sotkanet snapshot is used). Run `npm run check` before pushing; CI runs the same checks.

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
