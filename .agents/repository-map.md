# Repository map

Only facts that are already confirmed go here. Mark everything else _TBD_, and never guess commands.

## Purpose and boundaries

- Product or artifact: Junction 2026 hackathon project. The challenge and users are _TBD_. See [`docs/PLAN.md`](../docs/PLAN.md).
- Main components: _TBD once the stack is chosen._
- Generated artifacts: pitch deck PDF in `docs/pitch/` (exported, not generated from source).
- Existing instructions: [`AGENTS.md`](../AGENTS.md) (agent working agreement), `.agents/instructions/` (principles, workflow, writing), `.claude/skills/` (change procedures).

## Environment and checks

| Operation | Verified command or owning document | Expected evidence |
| --- | --- | --- |
| Prepare local environment | `cd web && npm ci`, then API keys in `web/.env.local` (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_CRITIC_MODEL` for the recommendation reviewer, `CONTEXT_DEV_API_KEY`, `DATABASE_URL`; all optional) | Install finishes |
| Run affected tests | `npm test` in `web/` (Vitest) | All tests pass |
| Check static constraints | `npm run check` in `web/`: lint, tests and production build, the same as CI | Exit 0 |
| Build or render | `npm run build` in `web/` (also type-checks); `npm run dev` serves http://localhost:3000 | Build lists the `/` and `/county/[id]` routes |
| Reproduce user behavior | _TBD_: the demo flow | Demo works end to end |

## Delivery and operation

- Review and merge: short-lived branches into `main` through pull requests. Hackathon pace, so a teammate glance is enough.
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull request and every push to `main`. The *Web* job runs `npm ci`, lint, tests and build in `web/` without API keys. The *Secret scan* job runs gitleaks over the full history. Merge only when both are green.
- Release: a demo link deployed before Sun 15.11 10:00. Host _TBD_.
- Plans and checkpoints: [`docs/PLAN.md`](../docs/PLAN.md).
- Acceptance owner: the team. Final judges are the partners, peer review and the main jury.

## Authority and data

- Operations requiring approval: force-pushes are denied. Pushes to `main` need the team's agreement.
- Licensing: all code is MIT ([`LICENSE`](../LICENSE)) and written during the event (from Fri 13.11 19:30).
- Secrets: in `.env` files only. These are gitignored, and agents are denied read access. Never commit API keys.
