# Overnight improvement plan, Sat 14.11.2026

Written ~01:45 Saturday after merging #11–#15. Goal: raise every AstraZeneca and Junction score before the Saturday 22:00 feature freeze, without touching what teammates are building.

## Where we stand (self-scored, harsh)

| AstraZeneca criterion | Weight | Now | Main weakness |
| --- | --- | --- | --- |
| Actionability | 30% | 3.5 → 4 | Costed options exist (Decide board, simulator); the memo doesn't carry Goal 3 or the costed option yet |
| Insight | 25% | 3 → 3.5 | The funnel locates breaks; the start page doesn't say what it adds up to nationally |
| Data quality & transparency | 20% | 3.5 | 18 of 20 simulator assumptions are placeholders; evidence labels only on the simulator |
| Execution | 15% | 3 | Not deployed; no smoke test of all pages; two external services unreliable |
| Clarity | 10% | 2.5 → 3.5 | County page has a two-minute summary now; start page still opens on a ranking table |

Junction: Innovation 3, Impact 3, Implementation 3.5, Challenge fit 4.

## Rules for the night

- One branch and pull request per item. `npm run check` before every push; merge only when both CI checks are green.
- Never force-push; never touch `.env*`; never change `types.ts` or `evidence.ts` shapes (shared contracts).
- No invented numbers. A figure gets a source or an "assumption" label; a source we can't verify stays out.
- Keep edits to teammates' components small and additive. If a branch is updated by someone else overnight, stop and leave a note here instead of merging over it.

## The bigger frame: a national learning loop (added ~02:00)

Inka's proposal (ONCO-NATION): sell a national cancer-care intelligence layer, not a county dashboard. The app already has most of the loop, county by county:

| Loop step | What exists | What tonight adds |
| --- | --- | --- |
| 1. Detect | Map, ranking, funnel per county | National view: where Finland's pathway breaks, and early-warning flags for counties getting worse (item 1) |
| 2. Understand | Pathway fingerprint, break ranking | — |
| 3. Simulate | Breast simulator, Decide board, scenario tool | Capacity stress test: what a 20% colonoscopy-capacity drop would cost in missed findings (item 1b) |
| 4. Implement | Memo, Reach them kit, next steps | Memo carries Goal 3 and the costed option (item 2) |
| 5. Learn | Measuring kit, "Learn from" peer county | The loop drawn on the start page, linking each step to where it lives (item 1) |

Guardrails: no public data on hospital capacity exists, so the stress test is labelled Simulated and never claims to monitor capacity. "Control tower", "optimizer" and "European pilot" are pitch vision, not features. The name (Gap Radar, NULLPATH or ONCO-NATION) is a team decision; the pitch script (item 7) uses the learning-loop story either way.

## Items, in order of score gained per hour

### 1. Start page: national view, early warning and the loop (Clarity, Insight, Impact)

The judges' first screen is the map page, and it opens on "N counties are behind on breast screening". Add above it:

- **National line, all from Cancer Registry counts already in `registry.json`:** invitations a year that lead to no screening, positives without a colonoscopy, and the share of programme-missed cancers. Each with source and year.
- **"If every county reached the best quarter":** extra colonoscopies and expected findings a year, summed from `rankBreaks` per county. Labelled as a calculation at Finland's yield.
- **Early warning:** counties whose screening attendance fell over the last three years (Sotkanet `trend3y`), by programme, so a deterioration shows before it becomes a gap.
- **The learning loop** (Detect → Understand → Simulate → Implement → Learn) as one strip, each step linking to where it lives in the app.
- **A county picker** ("Open your county") so a judge lands on a county page in one click.
- **Tests:** the national sums equal the sum of county rows; the warning list matches the trend data; the section hides when data is missing.

### 1b. Capacity stress test (Simulate step of the loop)

On the Decide board: "What if colonoscopy capacity fell by X%?" Using the county's own counts, show positives left without a colonoscopy and the cancers and advanced precursors that would go unfound, at Finland's yield. Labelled Simulated; no claim about real capacity.

### 2. Board memo carries Goal 3 and the costed option (Actionability)

The Finnish memo (`/county/[id]/memo`) is what a county lead takes to the board.

- Add the county's cancer mortality against Finland (Goal 3 headline) in Finnish, with source.
- Add the two-minute summary's costed option (nurse follow-up of every positive at Pohde prices), unless the memo already shows a board option.
- **Tests:** the memo still renders for all counties; the Finnish sentences use decimal commas.

### 3. Evidence labels across the county page (Data quality)

Reuse `EvidenceTag` so a reader can tell measured from modelled at a glance:

- **Observed:** funnel counts, measures, mortality.
- **Simulated:** Decide board results, scenario tool, summary's costed option.
- **Inferred:** "who is left behind" associations.
- **Expert insight:** mentor notes where cited.
- One small legend at the top of the Evidence section explaining the four labels.

### 4. Simulator: replace a placeholder with real county data (Data quality)

`women_50_69_share` is one placeholder for all counties; the capital region is younger.

- Fetch women aged 50–69 per county from Statistics Finland's open PxWeb API in `scripts/ingest.ts` (the ingest already reads a Statistics Finland table for languages), store them in the snapshot, and use each county's own count in the simulator.
- Mark the row "from data" with the table id and year.
- If the API or table can't be verified tonight, skip this item and say so here.

### 5. Smoke test and warm-up script (Execution)

- `npm run smoke -- <base url>` fetches `/`, `/simulator`, and every county page, memo and measure route, and fails on any non-200 or a page missing its headline.
- The same script warms the pages before the demo (HANDOFF: warm county pages within 10 minutes of the demo).
- Document it in the README's run section.

### 6. Deployment guide (Execution)

`docs/DEPLOY.md`: Vercel project settings (root `web`, Node 22), the env vars and which are optional, how to refresh data, how to check the deployment with the smoke script, and what each failure looks like. The deploy itself needs a team member's Vercel login.

### 7. Pitch material (Clarity, all Junction criteria)

`docs/pitch/script.md`:

- **The story:** the national learning loop (Detect → Understand → Simulate → Implement → Learn), shown on one county, with the vision line and its honest limits.
- **2:00 video script** with timings, following the demo flow: problem with one number, one county (Päijät-Häme service break or Helsinki), Decide, memo, close.
- **3:00 live pitch** and the order of clicks.
- **Q&A prep:** answers to the hardest questions from the self-scoring (placeholder assumptions, Goal 2 vs Goal 3, correlation vs cause, what the AI adds, who pays and who maintains it), each with the figure and source to quote.

### 8. Simulator clarity (Clarity)

- Collapse "What drives the result" and "How sure we can be" behind one "Show the analysis" toggle, so the first screen is headline, figures, chart and table.
- Add a one-line "how to read" under the four headline figures.

### 9. Re-score and hand over (all)

- Re-score against `.claude/agents/judge.md` and write the result to `docs/research/2026-11-14-overnight-score.md`.
- Update this file: what was done, what was skipped and why, and what is left for the team.

## Out of scope tonight (team decisions or needs a login)

- Choosing between Gap Radar and NULLPATH as the name; Care Equity Lab (#6).
- Vercel deploy and env vars, a new Context.dev key, Aiven Postgres.
- Calling the mentors for cost and stage figures; recording the video; building the deck.

## Progress

| Item | Status | PR |
| --- | --- | --- |
| 1. National view, early warning, loop | planned | |
| 1b. Capacity stress test | planned | |
| 2. Memo with Goal 3 and option | planned | |
| 3. Evidence labels | planned | |
| 4. Women 50–69 from Statistics Finland | planned | |
| 5. Smoke test | planned | |
| 6. Deploy guide | planned | |
| 7. Pitch script and Q&A | planned | |
| 8. Simulator clarity | planned | |
| 9. Re-score and hand-over | planned | |
