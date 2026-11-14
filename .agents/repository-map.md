# Repository map

Only facts that are already confirmed go here. Mark everything else _TBD_, and never guess commands.

## Purpose and boundaries

- Product or artifact: farmagusta, our Junction 2026 project for the AstraZeneca challenge "Equal Care Across Finland". Users: the person invited to bowel cancer screening and the screening nurse. See [`docs/idea.md`](../docs/idea.md) and [`docs/PLAN.md`](../docs/PLAN.md).
- Main components: a Next.js app in `web/`. `/kit` is the phone flow for the home bowel-screening test and robot pickup; `/staff` redirects to the nurse board. Sample logic and the robot simulation are in `web/src/lib/sample/`. Demo state lives in the browser (`localStorage`) and is shared across devices through the event log at `/api/samples` (Upstash Redis on Vercel, in memory without keys). The nurse board is its own Next.js app in `nurse/`, served under `/nurse`. `web/` forwards `/nurse/*` to it (`NURSE_URL`, default http://localhost:3100) so both share one origin and the live sync works. Its board and sample code are copies of the `web/` ones; see [`nurse/README.md`](../nurse/README.md).
- Generated artifacts: none from source. The pitch deck is `docs/pitch/farmagusta-screening-attendance.pptx`, edited by hand.
- Existing instructions: [`AGENTS.md`](../AGENTS.md) (agent working agreement), `.agents/instructions/` (principles, workflow, writing), `.claude/skills/` (change procedures).

## Environment and checks

| Operation | Verified command or owning document | Expected evidence |
| --- | --- | --- |
| Prepare local environment | `cd web && npm ci`; optional settings are listed in [`web/README.md`](../web/README.md) | Install finishes |
| Run affected tests | `npm test` in `web/` or `nurse/` (Vitest) | All tests pass |
| Check static constraints | `npm run check` in `web/`: lint, tests and production build, the same as CI | Exit 0 |
| Build or render | `npm run build` in `web/` (also type-checks); `npm run dev` serves http://localhost:3000 | Build lists the `/`, `/kit`, `/staff`, `/api/samples`, `/api/walk` and `/api/kit/ask` routes |
| Run the nurse app | `npm run dev` in `nurse/` (port 3100), with the `web/` dev server running; open `/nurse` on the web port | The board loads, scripts under `/nurse/_next/` return 200 |
| Reproduce user behavior | Run both apps, open `/kit` in one tab and `/nurse` in another, book a pickup; `npm run smoke -- <base url>` loads every page | The board shows the phone's person move stage |

## Delivery and operation

- Review and merge: short-lived branches into `main` through pull requests. Hackathon pace, so a teammate glance is enough.
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull request and every push to `main`. The *Web* job runs `npm ci`, lint, tests and build in `web/` without API keys. The *Nurse* job does the same in `nurse/`. The *Secret scan* job runs gitleaks over the full history. Merge only when all three are green.
- Release: Vercel, two projects (`web/` and `nurse/`), deployed at https://farmagusta.vercel.app. Steps in [`docs/DEPLOY.md`](../docs/DEPLOY.md).
- Plans and checkpoints: [`docs/PLAN.md`](../docs/PLAN.md).
- Acceptance owner: the team. Final judges are the partners, peer review and the main jury.

## Authority and data

- Operations requiring approval: force-pushes are denied. Pushes to `main` need the team's agreement.
- Licensing: all code is MIT ([`LICENSE`](../LICENSE)) and written during the event (from Fri 13.11 19:30).
- Secrets: in `.env` files only. These are gitignored, and agents are denied read access. Never commit API keys.
