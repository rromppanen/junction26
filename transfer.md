# Transfer: Läpi (Junction 2026, AstraZeneca challenge)

Written Sat 14.11.2026, early evening, to continue in another session or on another machine. It supersedes `docs/HANDOFF.md` for the current product. That file still describes the earlier dashboard and is useful as background.

## Deadlines

- **Final submission: Sun 15.11 at 10:00.** It needs a name, punchline, description, tech, demo link, source link, deck PDF and a video of at most 2:00.
- **The whole team must be at peer review, Sun 10:30.**
- **Judging weights:**

  | Criterion | Weight |
  |---|---|
  | Actionability | 30% |
  | Insight | 25% |
  | Data quality and transparency | 20% |
  | Execution | 15% |
  | Clarity | 10% |

  Must: cover a Goal 3 indicator, source every claim, give actionable proposals, have a working demo.

## The product now: Läpi

Läpi is Finnish for "through".
- A person gets a screening invitation letter with a QR code and opens the app.
- The app explains the screening and books by test type:
  - **Bowel (FIT):** a home test, collected by a simulated robot.
  - **Cervical (HPV):** a clinic visit.
- Bookings can be rebooked or cancelled.
- A live view follows the robot or the appointment, then the result and the follow-up: colonoscopy, or a follow-up visit.
- A screening nurse sees every sample on one board, with stuck ones flagged, and acts on them.
- `/demo` shows the phone and the board side by side, synced live, with an autopilot ("Play the story", or the space bar).
- Gemini answers kit questions in any language, only from fixed screening facts, and code checks every answer.
- All people, the robot, the lab and the bookings are invented or simulated, and every page says so.

**Real figures** (Finnish Cancer Registry, 2023, on the start page):
- 74.4% of invited people returned the bowel test;
- 3,536 of 16,501 positive tests (21.4%) had no colonoscopy in the programme.

**Medical text:**
- Bowel facts only from the [HUS colorectal screening page](https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february).
- Cervical facts only from Government Decree 339/2011: every five years, women aged 30–60.

## Where the code is

- **Repo:** `~/code/junction26`, GitHub `rromppanen/junction26`.
- **`main`** already has:
  - the sample app (PR #36);
  - the UI round (PR #37): demo stage, board overview, autopilot, Gemini ask box;
  - the Läpi rebrand.
- **Current work:** worktree `~/code/junction26-lapi`, branch **`feat/letter-flow`**. **It is not pushed and has no PR.** Commits on top of `main`:
  - `a5f0861` docs: the plan for this flow (Tasks 8–10 in the plan file).
  - `3ac25c5` **Task 8, done.** The model for two screenings, bookings and rebooking, the robot timed to the booked window, and new flags (`noBooking`, `rebooked`). The localStorage key is now `lapi.demo.v2`.
  - `225e77a` **Task 10, done; not reviewed and not browser-tested.** The board and autopilot for the new flow:
    - both live people (`me` = Aino, bowel; `me-cx` = Sanna, cervical) pinned at the top;
    - robot ETA, booking history and "Record clinic visit";
    - a `/demo` toggle for which letter the phone shows;
    - the new autopilot story.
  - `71db124` **Task 9, WIP: stopped part-way, on purpose.** The phone flow from the letter:
    - new `Letter.tsx` and `slots.ts`;
    - changed `KitApp.tsx`, `strings.ts` and `Illustrations.tsx`.
- **State of the WIP:**
  - tsc and eslint pass, all 440 tests pass, and `/kit`, `/kit?who=me-cx`, `/staff` and `/demo` all return 200;
  - but the flow was never checked against the brief or in a browser.
- **Running locally:**
  - dev server for the worktree on **http://localhost:3001**: `cd ~/code/junction26-lapi/web && npx next dev -p 3001`;
  - port 3000 is the old main checkout.
- **Other open PRs from teammates:**
  - #35: handoff keys;
  - #38: pitch, video script and deck for the home-test and nurse-board flow;
  - #39: reviewer checks.

## Continue here

1. **Read the plan and the ledger first:**
   - plan: `docs/superpowers/plans/2026-11-14-sample-app.md`. The section "Letter-to-robot flow" has Tasks 8–10 with exact names and copy;
   - ledger: `.superpowers/sdd/2026-11-14-sample-app/progress.md`, gitignored, local to this machine. It holds rulings, deferred minors and task briefs and reports.
2. **Finish Task 9** against its brief: `.superpowers/sdd/2026-11-14-sample-app/task-9-brief.md`. The screens, in order:
   1. Letter with QR.
   2. What this is and the next-steps checklist.
   3. Booking: a robot pickup window, or a clinic time.
   4. The live view:
      - bowel: booked, then sample steps, then the robot map with ETA, then the box code;
      - cervical: an appointment card with rebook and cancel.
   5. Lab.
   6. The result.
   7. The follow-up booking.

   Also: FI/SV/EN strings, and a progress bar with Letter, Booking, Sample, Lab and Result.
3. **Browser walkthrough** on http://localhost:3001/demo:
   - run the autopilot;
   - switch the letter toggle to Sanna;
   - rebook and cancel on the phone and check the board;
   - check the phone at 375px.
4. **One combined review of Tasks 8–10**, then `npm run check` in `web/` (lint, tests, build).
   - Don't build while the dev server runs in the same folder: use a temporary worktree or stop the server.
   - The build needs network access for Google Fonts.
5. **Push `feat/letter-flow` and open a PR into `main`.** Merge only when both CI checks, *Web* and *Secret scan*, are green.

## The judge's latest review (before this flow): 5.2/10

| Criterion | Score /10 | Main reason |
|---|---|---|
| Actionability | 5 | No owner, cost or target on the new screens. |
| Insight | 5 | Only one national number; the county differences sit behind `/map`. |
| Data quality | 4 | Few sources on the phone and board; the flag thresholds have no source. |
| Execution | 7 | Works, but not deployed. |
| Clarity | 6 | A decision-maker can't say what to decide. |

The recommended next steps, in order:
1. **County panel on `/staff`** (+1.0, 3–4 h).
   - **Contents:** the county's Registry share of positives examined, the best-quarter target (82.9%), and the nurse-call option's cost (€614 per colonoscopy, €100 per call, from Pohjois-Pohjanmaa's 2025 price list).
   - **Labels:** Goal 3.1 and 3.2, with an owner and a date.
   - **Reuse:** `web/src/lib/pathway.ts`, `pathwayData.ts` and the existing `DecisionBoard.tsx`.
2. **Sources and limits on every screen** (+0.4):
   - source footers on the phone and board;
   - links on the Gemini facts in `kitAsk.ts`;
   - the flag thresholds marked as assumptions (the European guideline's 31 days is the nearest benchmark);
   - the "examined outside the programme" caveat in `ImpactStrip.tsx`.
3. **Rewrite README, `docs/idea.md` and the pitch for Läpi** (+0.3). Add Q&A answers for:
   - "Where is Goal 3?": Goal 3.2 (regional differences in diagnostics) and 3.1 (pathways without delays);
   - "Why a robot?";
   - "How is this different from England's BCSS?". Our new part is the Finnish multilingual person view.

   PR #38 from a teammate may already cover the pitch: check it first.
4. **Make the robot optional.** Post as the default return, the robot as a labelled simulated option (+0.2). This was not agreed; it's the user's call.
5. **Deploy to Vercel** (user only).
   - Settings: root `web`, Node 22, env `GEMINI_API_KEY` (and `CONTEXT_DEV_API_KEY` for the old pages).
   - Then run `npm run smoke` against the URL and record a backup video.

## Rules used in this repo

- **Branches and pushing:**
  - Work on a branch and open a PR into `main`.
  - Run `git pull` before starting and again before pushing.
  - Ask the user before pushing or merging.
- **Commits:**
  - Commit only your own files (`git add <paths>`, never `-A`).
  - End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Secrets:** keys live only in `web/.env.local` and are never committed. Both the Gemini and Context.dev keys there were replaced on 14.11 and work.
- **Numbers and claims:**
  - Never invent numbers, and cite every figure.
  - Medical text stays within the cited facts.
  - Simulated things are labelled as such.
- **Node:** use Node 22: `export PATH=/Users/Daniel/.nvm/versions/node/v22.23.4/bin:$PATH`.
