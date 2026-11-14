# Handoff: Gap Radar (Junction 2026, AstraZeneca challenge)

Checkpoint written Sat 14.11.2026, about 13:00. It replaces the 00:30 version. Read it first, then `docs/challenge.md`. A teammate's handover is in [NEXT-STEPS.md](NEXT-STEPS.md) (deck, video script, the `feat/deck-and-loop` branch). Read both.

## Deadlines and judging

- **Final submission: Sun 15.11 at 10:00.** It needs a name, punchline, description, tech, demo link, source link, deck PDF and a video of at most 2:00.
- **Whole team at peer review Sun 10:30.** Missing it costs main-prize eligibility.
- **AstraZeneca "Equal Care Across Finland".** The criteria are weighted:

  | Criterion | Weight |
  |---|---|
  | Actionability | 30% |
  | Insight | 25% |
  | Data quality and transparency | 20% |
  | Execution | 15% |
  | Clarity | 10% |

  Every claim must be sourced, the work must cover a Goal 3 indicator, and the demo must work.
- **Bounties:**
  - Gemini API: in use.
  - Context.dev: the key in `web/.env.local` is invalid (401). A fresh key is needed.
  - Aiven: not done. It earns nothing for AstraZeneca and is only worth it for its own prize.

## Current state of the repo (`~/code/junction26`, GitHub `rromppanen/junction26`)

- `main` is at `34877a6`.
  - It includes the analysis intake: PR #22, merged with both CI checks green.
  - It includes the shorter pitch script: PR #21.
  - There are no open PRs.
- **The current branch is `fix/demo-credibility`, cut from `main`, with uncommitted work in progress.** The next section lists it.
- The dev server may be running on :3000 from this checkout (Next 15.5.4).

### Uncommitted on `fix/demo-credibility` (from the judge review, items 2 and 3)

1. **Simulator: placeholder outcomes are hidden by default** (`web/src/components/simulator/ScreeningSimulator.tsx`).
   - Life-years, deaths averted, net cost, € per life-year, the outcome columns of the table and the analysis section stay hidden until the user clicks "Show illustrative outcomes".
   - Once shown, they are labelled "Illustration: N placeholder assumptions, not for quoting".
   - Extra screens are always shown, because they come from observed data. When outcomes are hidden, the table is sorted by screens.
2. **Sourced scenario defaults** (`web/src/data/scenarioDefaults.ts`).
   - Breast: 4.7 cancers per 1,000 screens, from the Finnish Mass Screening Registry, Acta Oncologica.
   - Colorectal: 2.7 per 1,000 FIT returners, Southwest Finland 2022–23 (Scand J Gastroenterol 2025, utupub 10024/179904).
   - Cost per screen stays empty. `ScenarioTool.tsx` now says: "No public Finnish cost per screen exists for this programme. Enter your own figure."
3. **Who organises colorectal screening.** HUS organises it for the Uusimaa counties, Helsinki, Kymenlaakso and Etelä-Karjala. This was checked on HUS's own news page of 2.2.2026.
   - `web/src/lib/screeningOperator.ts` and its test are new.
   - `PathwayFunnel.tsx` shows the line "Who acts: HUS organises colorectal screening for …" with the source.
   - In the memo (`/county/[id]/memo?option=…`), the "Vastuutaho" row adds "yhdessä seulonnan järjestäjän (HUS) kanssa".
4. **Funnel caveat** (`PathwayFunnel.tsx`).
   - The existing limit line ("No colonoscopy in the programme is not proof that no examination happened") now adds that where more people use private or occupational care, part of the gap may be people examined outside the programme.
   - It links to Cancer roadmap p. 11, which says private care is a common route.

**Verified:** `npx tsc --noEmit -p .` and `npx eslint` on the changed files are clean, and `npx vitest run` passes 324 of 324 tests.

**Not verified:** the browser check. Its call was interrupted. Open `/simulator`, `/county/960` (Helsinki, HUS line), `/county/970` (Pirkanmaa, no HUS line) and `/county/960/memo?option=service` before committing. Then commit, run `npm run check`, push and open a PR. Ask the user before pushing.

## Judge review of `main` (Sat ~12:00, `.claude/agents/judge.md`)

Weighted score: **6.35/10**.

| Criterion | Score | Main reason |
|---|---|---|
| Actionability | 7 | |
| Insight | 7 | The positive-test-to-colonoscopy gap ranked per county is new: 21.4% nationally, 10.3–31.5% across counties. |
| Data quality | 6 | The simulator showed results built on placeholders. The branch above fixes this. |
| Execution | 4 | Not deployed. `/analyse` ends at the summary. |
| Clarity | 5 | The county page has 11 sections. `docs/idea.md` still says NULLPATH. |

The judge's ranked next work:

1. **Deploy to Vercel and run `npm run smoke` against the public URL; pre-warm Helsinki and Päijät-Häme.** The user does this, since it needs their Vercel account. Root is `web`, Node 22, and the env vars are `GEMINI_API_KEY` and optionally `GEMINI_MODEL`. See `docs/DEPLOY.md`.
2. Simulator cleanup and sourced defaults: **done on the branch above.**
3. Thin **step 3** of the analysis workflow, 3–4 h: read `sessionStorage["gapRadar.analysisSetup"]` and run the uploaded county counts through the existing `web/src/lib/pathway.ts`. Show "your data vs public data" next to the Registry funnel. It overlaps with `MeasureUpload`. Until step 3 exists, consider labelling the `/analyse` header link "preview".
4. Head off the colonoscopy-gap questions: **done on the branch above.** Also in the pitch, put mortality and Goal 3.2 first, not participation.
5. Clarity:
   - cut the 2-minute summary to three lines (gap, option, first action);
   - fold "Learn from", "Figures" and "Evidence" under "More";
   - rename `docs/idea.md` to Gap Radar and add the team names and video link.
6. Optional, high risk: the Cancer Registry diagnosis-method (toteamistapa) export per county, comparing screening with symptoms.
7. Skip these: the mortality indicator (`MortalityPanel` exists) and the summary and national view (they exist).

## The analysis intake (`/analyse`, on main)

- **Code:**
  - `web/src/lib/intake/`: csv, fields with mapping validation and `parseCount` for "1 200", privacy, setup, `clarify.ts` (Gemini behind an injected generator), and `route-input.ts` (size bounds).
  - Routes: `web/src/app/api/intake/{questions,mapping}`.
  - UI: `web/src/components/intake/` (IntakeWizard, StepData, StepQuestions, StepConfirm).
- **Flow:**
  1. Choose public datasets and/or upload an aggregate CSV, parsed in the browser.
  2. Files with personal-data headers are refused, both in the browser and on the server.
  3. Answer at most five questions: audience, level, county and unclear columns.
  4. Confirm the mapping.
  5. Read the summary, which links to `/county/{id}`.
  6. The setup is saved to `sessionStorage` without rows.
- **Privacy rule (deliberately fail-closed).** Any header with a name/nimi token is refused, including glued forms like `potilasnimi`, unless it is an allow-listed place or organisation name such as `kuntanimi` or `Kunnan nimi`. Row IDs like `patient_id`, `asiakasnumero` and `sotu` are refused. Harmless headers like `filename` are refused too, which is accepted.
- **Gemini is never trusted.** Allowed values are rebuilt on the server, and each option's label is sent to Gemini so it can map "Espoo" to Länsi-Uusimaa. Every value is validated by code. Without a key, the flow falls back to standard questions.
- **Known minor gaps, deferred:**
  - The 64 KB limit is counted in characters, not bytes.
  - A chunked body is buffered in full before the size check.
  - Going Back from confirm reloads the questions and loses answers.
  - There are no component tests (the repo has no component test setup).

## How to run and check

- Node 22: `export PATH=/Users/Daniel/.nvm/versions/node/v22.23.4/bin:$PATH`, then `cd web && npm run dev`.
- `npm run check` runs lint, tests and build, the same as CI.
  - Don't build in `web/` while the dev server runs, because it corrupts `.next`. To build alongside it, use a temporary worktree: `git worktree add --detach <tmp> HEAD`, symlink `web/node_modules`, copy `web/src/data/snapshot.json` and `.env.local`, build there, then `git worktree remove`.
  - The build fetches Google Fonts, so it needs network access. In a sandbox it fails with `ENOTFOUND fonts.googleapis.com`.
- CI on PRs runs two checks: *Web* (lint, test, build) and *Secret scan*. Merge only when both are green. GitHub doesn't enforce this on our plan.
- Keys are only in `web/.env.local`. Never commit them.

## Rules used so far

- Work on a branch and deliver through a PR into `main`. Run `git pull` before starting and again before pushing.
- Commit only your own files (`git add <paths>`, never `-A`). Other sessions sometimes work in this checkout.
- End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ask the user before pushing or merging.
- Never invent numbers. Cite every figure. Word correlations as area-level, never individual. Label cost defaults without a source as assumptions.
- Gemini only writes text or picks from allowed values. The code computes, and a validator rejects any number that isn't in the facts.

## Ruled out, with evidence (don't retry)

- **`gemini-2.5-flash`:** not available to new keys. The default is `gemini-3.5-flash-lite`; heavier models gave 503 under load.
- **Cancer Registry stage and education data:** national only, not per county. Stage is about 60% "unknown".
- **Public Finnish cost per mammography or FIT screen:** none found. Don't put a default in the app.
- **Privacy word lists of person terms:** an endless arms race. Replaced by the fail-closed allow-list (place and organisation names only).

## For the user only

- Vercel deploy.
- A fresh Context.dev key.
- Aiven, optionally.
- Call mentor Laura for cost and detection figures.
- Record the 2:00 video and build the deck PDF (`docs/pitch/`).
- Open the county pages within 10 minutes of the demo so they load fast.
- Fill in the team names in `docs/idea.md`.
