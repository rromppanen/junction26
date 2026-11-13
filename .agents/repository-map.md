# Repository map

Only facts that are already confirmed go here. Mark everything else _TBD_, and never guess commands.

## Purpose and boundaries

- Product or artifact: Care Equity Lab for AstraZeneca's Equal Care Across Finland challenge. Intended users are county cancer-care leads, service planners and researchers. See [`docs/PLAN.md`](../docs/PLAN.md).
- Main components: local Next.js/TypeScript MVP in `web/`; [operating instructions and scope](../web/README.md).
- Screening data artifacts: `web/src/data/screening.json` and `web/public/data/screening.csv`, owned by `web/scripts/ingest.py`. Do not hand-edit them. Reviewed evidence summaries live in `web/src/data/evidence.ts`.
- Generated artifacts: pitch deck PDF in `docs/pitch/` (exported, not generated from source).
- Proposed prototype design: [`docs/design/2026-11-13-cancer-equity-agent.md`](../docs/design/2026-11-13-cancer-equity-agent.md). Covers the data contract, evidence boundaries, demo and implementation acceptance criteria; not an implemented system.
- Existing instructions: [`AGENTS.md`](../AGENTS.md) (agent working agreement), `.agents/instructions/` (principles, workflow, writing), `.claude/skills/` (change procedures), `web/AGENTS.md` (framework-generated guidance; Next.js owns its managed block).

## Environment and checks

| Operation | Verified command or owning document | Expected evidence |
| --- | --- | --- |
| Prepare local environment | Node 24; `cd web && npm ci` | Dependencies from lockfile |
| Run affected tests | `cd web && npm test` | Source, calculation, import and model-boundary tests |
| Check static constraints | `cd web && npm run check` | TypeScript passes |
| Build or render | `cd web && npm run build` | Next.js production build passes |
| Reproduce user behavior | `cd web && npm run test:e2e`; [walkthrough](../web/README.md) | Public-data flow, imports, action persistence, monitoring, mobile and endpoint checks |

## Delivery and operation

- Review and merge: short-lived branches into `main`. Hackathon pace, so a teammate glance is enough.
- Release: a demo link deployed before Sun 15.11 10:00. Host _TBD_.
- Plans and checkpoints: [`docs/PLAN.md`](../docs/PLAN.md).
- Acceptance owner: the team. Final judges are the partners, peer review and the main jury.

## Authority and data

- Operations requiring approval: force-pushes are denied. Pushes to `main` need the team's agreement.
- Licensing: all code is MIT ([`LICENSE`](../LICENSE)) and written during the event (from Fri 13.11 19:30).
- Secrets: in `.env` files only. These are gitignored, and agents are denied read access. Never commit API keys.
