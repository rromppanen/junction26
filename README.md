# junction26

> **Punchline:** Läpi takes a bowel screening sample from a person's home to the lab and on to care: a home test, a robot pickup, and a nurse board that flags every sample left waiting.

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | Läpi |
| Punchline | Läpi takes a bowel screening sample from a person's home to the lab and on to care: a home test, a robot pickup, and a nurse board that flags every sample left waiting. |
| Challenge(s) | AstraZeneca: Equal Care Across Finland. Tech bounty: Google DeepMind Best Use of Gemini API |
| Technologies | Next.js, TypeScript, Tailwind CSS, Gemini API, Finnish Cancer Registry screening statistics, Vitest, GitHub Actions |
| Demo link | _TBD_ |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck (PDF) | [`docs/pitch/`](docs/pitch/) |
| Pitch video (max 2:00) | _TBD_ |

## Description

**Problem.** Finland's bowel cancer screening relies on people taking a stool test at home and posting it back, and on someone following up every positive result. Both steps leak. In the Finnish Cancer Registry's national figures, a large share of invited people never return the test, and many positive tests have no colonoscopy in the programme. Nobody watches each sample from start to finish.

**Who it is for.** The person invited to screening (ages 56–74, every two years), and the screening nurse who has to make sure no positive result is left waiting.

**What we built.** Läpi is a web app with two linked views:

- **Phone app (`/kit`):** in Finnish, Swedish or English. The person takes the home test following the leaflet in their kit, books a pickup, and watches a robot come to the door to collect the sample. The result follows; a positive result offers colonoscopy times to book. A question box answers in the person's own language, only from the screening facts.
- **Nurse board (`/staff`):** every sample on one board by stage. Stuck samples are flagged: no sample 14 days after the invitation, a positive result with no colonoscopy booked after 7 days, a robot left waiting at the door. The nurse acts from the sample's drawer.
- **Demo (`/demo`):** the phone and the board side by side, kept in sync live, with an autopilot that plays the whole story.

**How it works.** The sample logic is plain tested code: an event log per sample, the stage derived from it, the stuck rules and the robot simulation. The demo state lives in the browser and syncs between tabs, so there is no server state. Gemini answers kit questions from a fixed list of screening facts and cites which ones it used; without a key, a fixed answer takes its place. Medical facts come only from the HUS colorectal screening page, and national figures only from the Finnish Cancer Registry, with the source shown.

**What's new.** _TBD by the team._

**What's next.** _TBD by the team._

Demo: invented people; the robot, lab and bookings are simulated.

## Run locally

```
cd web
npm ci
npm run dev        # http://localhost:3000, then open /demo
```

Optional keys go in `web/.env.local`: `GEMINI_API_KEY` and `GEMINI_MODEL` for the kit question box (without them a fixed answer is shown). Run `npm run check` before pushing; CI runs the same checks.

`npm run smoke -- <base url>` loads every page once and fails on any error; run it against the deployed site before the demo. Deployment steps are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
