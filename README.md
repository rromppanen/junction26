# Care Equity Lab

> Turn cancer-care data into a traceable improvement plan.

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | Care Equity Lab |
| Punchline | Turn cancer-care data into a traceable improvement plan. |
| Challenge(s) | AstraZeneca: Equal Care Across Finland |
| Technologies | Next.js, React, TypeScript, optional Gemini API, Finnish Cancer Registry public data |
| Demo link | Local prototype; not deployed |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck (PDF) | [`docs/pitch/`](docs/pitch/) |
| Pitch video (max 2:00) | _TBD_ |

## Description

A research workspace for service leads to compare population groups, inspect measured screening-pathway differences, review source evidence and track proposed improvement actions. The first prototype uses public aggregate cervical-screening data from the Finnish Cancer Registry. It accepts mapped screening-count CSVs and can append new reporting periods while retaining the action register.

The app distinguishes descriptive gaps from unresolved causes, and guidance-supported proposals from proven local effects. Survival and treatment-start timing are not measured in this first dataset. See [the product idea](docs/idea.md) for the broader adaptive analyst vision.

## Run locally

The Care Equity Lab MVP runs on Node 24:

```bash
cd web
npm ci
npm run dev
```

Open the printed localhost URL. If port 3000 is occupied, use `npm run dev -- --port 3001`.

The demo includes real public Finnish Cancer Registry counts and runs without credentials. It shows dataset mapping, population comparisons, pathway assessment, sources, proposed actions and period monitoring. See [the app README](web/README.md) for the walkthrough, optional AI setup, data limitations and verification commands.

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
