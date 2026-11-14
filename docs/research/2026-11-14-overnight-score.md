# Re-score after the overnight work, Sat 14.11.2026 ~03:30

Scored harshly against `.claude/agents/judge.md`, on `main` after PRs #11–#18. Same method as the evening score in the session (3.2/5 for AstraZeneca). A self-score, so treat it as optimistic by half a point.

## Minimum requirements

| Requirement | Evening | Now | Why |
| --- | --- | --- | --- |
| Every claim shows its source | Pass, at risk | **Pass** | Sources on every figure; evidence labels on every county-page section and the simulator. 17 of 20 simulator assumptions are still placeholders, labelled as such. |
| Names a Goal 3 indicator | Pass, weakly | **Pass** | Cancer mortality per county (the Goal 3 headline) on every county page, in the summary and in the Finnish memo; survival for three cancers; the simulator ties deaths averted to the target. |
| Concrete proposals | Pass | **Pass** | Costed options at real prices, a stress test, the memo with the option, translated invitations. |
| Working demo | Local only | **Local only** | Still not deployed. `docs/DEPLOY.md` and `npm run smoke` make it a 15-minute job for whoever has a Vercel login. |

## AstraZeneca criteria

| Criterion | Weight | Evening | Now | What moved it |
| --- | --- | --- | --- | --- |
| Actionability | 30% | 3.5 | **4** | Decide board with Pohde prices, stress test, memo with Goal 3 and the costed option, Reach them kit |
| Insight | 25% | 3 | **4** | Funnel locates the break per county; national view (21.4% of positives unexamined, 28% of a cohort's cancers in people the programme lost, the language gap); early-warning list |
| Data quality & transparency | 20% | 3.5 | **4** | Evidence labels everywhere; Registry, Statistics Finland and Sotkanet data with tests that check them against the source; one simulator placeholder replaced |
| Execution | 15% | 3 | **3** | Works locally, 71/71 pages pass the smoke test, but no demo link yet |
| Clarity | 10% | 2.5 | **3.5** | "In two minutes" on every county page; national view and county picker on the start page; simulator analysis behind a toggle. The county page is still long below the summary. |
| **Weighted** | | **3.2** | **3.8** | |

Deploying would move Execution to about 4 and the total to about 3.95.

## Junction criteria

| Criterion | Evening | Now | Why |
| --- | --- | --- | --- |
| Innovation | 3 | **3.5** | The national learning loop (detect → understand → simulate → implement → learn) at county level, from public registers, is not what OncoSim, EU-TOPIA or IHE's dashboard do |
| Impact | 3 | **3.5** | National figures in people: about 8,600 more test returns and 800 more colonoscopies a year if every county matched the best quarter |
| Implementation | 3.5 | **3.5** | Cheap, legal, public data; deploy guide written. Owner and funding still a pitch answer, not a fact |
| Challenge fit | 4 | **4.5** | Covers every part of the brief, including the mentors' "compare options by cost" |

## Weakest point now

No demo link. Everything else is a pitch problem; this one is a disqualification risk if it isn't fixed by Sunday 10:00.

## Next three changes that would move the score most

1. **Deploy** (Execution, minimum requirement). `docs/DEPLOY.md`.
2. **Mentor figures for the breast simulator** (Data quality): stage at diagnosis by attendance, and the cost of a screening mammogram. Three placeholders drive most of the result: the non-attenders' distant-stage share, outreach cost and screening cost.
3. **Rehearse the pitch with the script** (Clarity): `docs/pitch/script.md`, timed to 2:00.
