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
- Next checkpoint: expert review of findings and recommendation applicability; select an additional validated Goal 3 measure before claiming full challenge coverage. The current prototype does not infer root causes or treatment delays.
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
| Unassigned | Upload | Improve parsing, supported formats and provenance in `UploadStep.tsx` | Step implemented; ready for owner |
| Unassigned | Prepare | Improve semantic mapping and validation in `PrepareStep.tsx` | Step implemented; ready for owner |
| Unassigned | Analyse | Improve methods and uncertainty in `AnalyseStep.tsx` and the calculation engine | Step implemented; ready for owner |
| Unassigned | Recommend | Improve evidence appraisal and applicability in `RecommendStep.tsx` and the evidence/brief pipeline | Step implemented; ready for owner |
| Unassigned | Integration | Own shared contracts, shell and integrated checks | Coordinate shared-file edits |

See [workflow ownership](../web/src/components/workflow/README.md) for file boundaries, contracts and acceptance concerns. Assign names here before concurrent changes to shared libraries.

## MVP scope

- Active implementation: a local Next.js/TypeScript prototype in `web/`, using the existing available JavaScript toolchain. This replaces the proposed Python UI for this increment; the product workflow in `idea.md` remains the authority for behavior.
- First source: Finnish Cancer Registry cervical-screening report. Public aggregate screening-chain counts for 2020–2024 with distinct cohort/dimension metadata.
- Current flow: Upload → Prepare → Analyse → Recommend. No dashboard, sidebar, action register or monitoring screen. Separate components let one teammate own each step; the shell passes typed outputs between them.
- Acceptance: source-backed demo data, confirmed CSV mapping, explicit analysis execution, invalidation when comparison settings change, no invented causes, sourced recommendations and JSON download. The optional model interpretation returns a labelled template when unavailable; uploaded records stay in the browser.
- Scope limit: screening/process measures are not survival outcomes or measured treatment-start times. Goal 3 context must be distinguished from a directly measured Goal 3 outcome. No confidential records, causal guarantees, or general-purpose dataset support.
- Must have for the demo: complete all four steps with either the public demo or a valid mapped CSV. Reject invalid input before analysis and abstain when a comparison is unsupported.
- Demo focus: follow one real population disparity from confirmed data through calculated findings to a sourced proposed action.
- Riskiest part: overclaiming from incomplete follow-up or AI prose. The app labels descriptive results and unresolved causes; optional model failure returns a labelled deterministic template. Recommendation actions use reviewed guideline summaries.
- Out of scope for this simplified prototype: monitoring, action persistence, confidential/patient-level data, arbitrary study formats, autonomous causal identification, live systematic reviews, shared cloud storage and deployment. Live provider generation needs credentials and remains separate from mocked integration verification.
- Simplified-flow verification: 19 unit/integration tests and 6 browser tests pass, including manual mapping retention, stale-result prevention, insufficient-data abstention, provider failure and mobile layout. TypeScript and production build pass; desktop/mobile screens were inspected. Browser checks reuse the existing local dev server without replacing it. Live provider responses remain unverified with credentials.

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
