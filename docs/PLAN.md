# Junction 2026 plan

This is the team's one place for decisions, the task split and the submission checklist. Update it whenever any of those change.

## Hard deadlines

| When | What | Notes |
| --- | --- | --- |
| Fri 13.11 19:30 | Hacking starts | No code before this. Not tied to an existing company. |
| **Fri 13.11 23:59** | **Pre-submission:** draft plus chosen challenge(s) | Can be changed later. Don't skip it. |
| Sat 14.11 ~22:00 | Feature freeze (our own target) | After this, only bug fixes and demo polish. |
| Sun 15.11 ~06:00–09:30 | Video, deck, README, submission form | Budget several hours for these. |
| **Sun 15.11 10:00** | **Final submission** | No late submissions. |
| **Sun 15.11 10:30–13:00** | Peer review | **Whole team present**, or we can't win the main prize. |
| Sun afternoon | Top 5: 3 min pitch + 3 min Q&A, 7 judges | |

## Decision

- Product vision: [adaptive cancer equity analyst](idea.md). The [earlier design](design/2026-11-13-cancer-equity-agent.md) is a proposal; the implemented MVP now uses the Registry's cervical-screening tables rather than lung-cancer outcomes. Current scope and run instructions are in [the app README](../web/README.md).
- Next checkpoint: expert review of findings and recommendation applicability; Goal 3 is now measured as county cervical cancer 5-year survival (Sotkanet 3626); waiting times and the headline lung, pancreatic and liver targets still have no county data. The current prototype does not infer root causes or treatment delays.
- Challenge(s): AstraZeneca — Equal Care Across Finland.
- Why us / why this: demonstrate the whole reusable workflow with public counts, explicit evidence limits and traceable proposed actions.
- Main judging criteria to hit: **Innovation** (unlike other projects), **Impact** (share of affected people actually helped), **Implementation** (realistic, viable, feasible). Each partner also judges its own challenge with its own criteria.

## Workshops worth attending

| When | Partner | Why |
| --- | --- | --- |
| Fri 20:00 | Google DeepMind | |
| Fri 20:30 | Verda / Arduino (hardware lab) | |
| Fri 21:00 | MLH x GitHub | |
| Sat 11:00 | Cala | They say what their judges want |
| Sat 12:00 | Intel (hardware) | |
| Sat 13:30 | Modal | |
| Sat 14:30 | Kiuas: "Can it be a company?" | Helps with the Implementation and viability story |
| Sat 16:30 | Exa | |
| Sat 17:30 | Context | |
| Sat 18:00 | Maria01 | |

Mark the ones we actually go to and who goes.

## Task split

| Person | Area | Current task | Status |
| --- | --- | --- | --- |
| Unassigned | Standardise & clean | Improve `web/src/lib/pipeline/prepare.ts`: semantic mapping, formats, missingness and validation | Automatic stage implemented; ready for owner |
| Unassigned | Find disparities | Improve `web/src/lib/pipeline/analyse.ts` and the calculation engine | Automatic stage implemented; ready for owner |
| Unassigned | Find evidence | Improve `web/src/lib/pipeline/research.ts` and the Context.dev adapter | Automatic stage implemented; ready for owner |
| Unassigned | Recommend | Improve `web/src/lib/pipeline/recommend.ts`: grounding, applicability and evaluation | Automatic stage implemented; ready for owner |
| Unassigned | Integration | Own pipeline types/orchestration, streamed route and focused UI | Coordinate shared-file edits |

See [workflow ownership](../web/src/components/workflow/README.md) for file boundaries, contracts and acceptance concerns. Assign names here before concurrent changes to shared libraries.

## MVP scope

- Active implementation: a local Next.js/TypeScript prototype in `web/`, using the existing available JavaScript toolchain. This replaces the proposed Python UI for this increment; the product workflow in `idea.md` remains the authority for behavior.
- First source: Finnish Cancer Registry cervical-screening report. Public aggregate screening-chain counts for 2020–2024 with distinct cohort/dimension metadata.
- Current flow: one upload automatically runs standardisation/cleaning → all available latest-period group comparisons → Context.dev evidence retrieval → Gemini interpretation and recommendations. Progress stages are not user-operated screens. Only unresolved column meanings request clarification.
- Acceptance: upload alone starts the entire server pipeline; progress reflects actual work; valid recognised inputs need no additional clicks; results prioritise insights and link actions to evidence. Invalid counts fail visibly, ambiguous mappings ask focused questions, cancellation cannot overwrite a new run, and missing provider settings never masquerade as live AI.
- Scope limit: screening/process measures are not survival outcomes or measured treatment-start times. County survival is shown next to screening findings as an outcome, not as proof of cause. No confidential records, causal guarantees, or general-purpose dataset support.
- Must have for the demo: one upload or one public-demo click produces insights and evidence-linked proposals automatically. The Gemini and Context.dev adapters use Gap Radar's environment variable names and structured-output/search patterns.
- Demo focus: watch actual progress, then see the highest-priority insight and its next action together, with supporting passages and original source links.
- Riskiest part: overclaiming from incomplete follow-up or model prose. Values remain deterministic; generated actions require reviewed guideline references. Live excerpts are not automatically appraised evidence. Rejected or unavailable model output produces explicitly labelled templates.
- Out of scope for this simplified prototype: monitoring, action persistence, confidential/patient-level data, arbitrary study formats, autonomous causal identification, live systematic reviews, shared cloud storage and deployment. Live provider generation needs credentials and remains separate from mocked integration verification.
- Data handling: uploads are processed in server memory; Gemini may receive bounded column examples and aggregate findings. Context.dev receives only a topic query. This supersedes the earlier browser-only upload implementation; public aggregate data only remains the constraint.
- Runtime configuration check: the local app reported both Gemini and Context.dev unconfigured. Tests mock provider responses; a live public-data HTTP smoke test ran the complete fallback pipeline and returned 86 comparisons. Never claim live-provider verification until keys are configured and a real run succeeds.
- Automatic-flow verification: 31 unit/integration tests and 6 browser tests pass. Tests exercise the real server orchestration with mocked Gemini mapping/recommendations and Context.dev retrieval, failure fallback, invalid input, ambiguity/resume, cancellation and mobile layout. TypeScript and production build pass. Actual public-demo desktop/mobile screens were inspected.

## Submission checklist

- [ ] Pre-submission sent (Fri 23:59)
- [ ] Repo public, MIT [LICENSE](../LICENSE) present, README filled in
- [ ] Name and punchline
- [ ] Description
- [ ] Technologies list
- [ ] Demo link works in an incognito window
- [ ] Source link
- [ ] Pitch deck exported to PDF in [`docs/pitch/`](pitch/)
- [ ] Pitch video **≤ 2:00** (check the exact length before uploading)
- [ ] Submitted to every challenge we qualify for
- [ ] Final submission before Sun 10:00
- [ ] Whole team at peer review at 10:30

## Research sources

- **Scopus (now):** search it through the browser at <https://www.scopus.com> with university sign-in (Aalto). No API key needed.
- **Scopus via MCP (option, not active):** [scopus-mcp](https://github.com/qwe4559999/scopus-mcp) gives Claude Code direct tools: search, abstracts, authors, citing papers. A working, tested setup is in commit `c1df85a`; restore it with `git revert 76422a7`. It needs an Elsevier API key from <https://dev.elsevier.com/> in `.env`, plus `uv`. Keep the `mcp>=1.0,<2` pin, because the server crashes with MCP SDK 2.x.

## Mentor questions

_Write down what we ask and what we hear back._
