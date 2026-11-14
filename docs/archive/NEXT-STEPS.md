# Next steps (handover, Sat 14.11.2026)

Read this to continue from any device. It replaces nothing: the older [HANDOFF.md](HANDOFF.md) and [PLAN-overnight.md](PLAN-overnight.md) are history.

**Deadlines**
- Feature freeze: Sat 22:00.
- **Final submission: Sun 15.11, 10:00.**
- **Peer review: Sun 10:30, whole team present.**

## Pick up on another device

```sh
git clone https://github.com/rromppanen/junction26.git   # or: git pull
git checkout feat/deck-and-loop
cd web && npm ci && npm run data && npm run dev           # app on http://localhost:3000
python docs/pitch/make_deck.py                            # rebuilds the deck PDF (needs matplotlib, numpy)
```

- **API keys.** They are not in git. Copy `web/.env.local` across by hand (`GEMINI_API_KEY`, and optionally `CONTEXT_DEV_API_KEY`).
- **Workflow.**
  1. Branch from `main`.
  2. Run `cd web && npm run check` before pushing.
  3. Open a PR into `main`.
  4. Merge only when both *Web* and *Secret scan* are green.

## Where things are

| What | Where | State |
| --- | --- | --- |
| App: deck, measure upload, county page in loop order | PR #20, branch `feat/deck-and-loop` | CI green, **not merged yet** |
| Pitch deck (12 slides, startup style, dark) | `docs/pitch/lapi-deck-mockup.pdf`, built by `docs/pitch/make_deck.py` (rebuild it: the committed `gap-radar-deck-mockup.pdf` still shows the old name and colours) | Placeholders: team names, demo link |
| 2:00 video script | `docs/pitch/video-script.md` | Ready to record |
| 3:00 live pitch + hardest Q&A | `docs/pitch/script.md` | Ready |
| Deploy guide | `docs/DEPLOY.md` | Not deployed yet |

## Doing next (in order)

1. **Merge PR #20** once the team agrees (CI is green).
2. **Deploy to Vercel** using `docs/DEPLOY.md`: root `web`, Node 22, env vars from `.env.local`. Then put the URL in:
   - `make_deck.py`: slide 12, `[demo link]`.
   - `video-script.md`: the last row.
   - The README.
   - The submission form.
3. **Fill in the team names.** In `make_deck.py`, slide 1 has `Team [names]`. Then rebuild the PDF.
4. **Make the repo public** (judges need the source link).
5. **Record the video** from `video-script.md`. Export deck slides 1, 2, 3 and 12 as title cards.
6. **Rehearse the 3:00 pitch** from `script.md`. Have Päijät-Häme ready as the second example.

## Nice to have, only if time allows before the freeze

- **Breast and cervical funnels.** Like the bowel one: positive → examined. Needs new Finnish Cancer Registry parsers, about 3 hours.
- **Real mentor figures.** Ask the AstraZeneca mentors for Finnish stage at diagnosis by screening attendance and survival by stage. The simulator calibrates the first and uses US data for the second.
- **New Context.dev key.** The current one returns 401. Get one from context.dev/dashboard; it is needed for the bounty.
- **Name.** Decided: **Läpi** (Finnish for "through"), replacing Gap Radar. App, README, deck builder and scripts are renamed.
- **Old PRs.** Decide on PR #6 and close PR #8.

## Checks before submitting

- Every number in the deck and video matches the live app. The source line at the foot of each slide says where it comes from.
- `npm run smoke` passes against the deployed URL.
- Don't claim a national control tower, a digital twin or live capacity data. These are the vision, not what we built.
