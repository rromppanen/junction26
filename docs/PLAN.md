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
| _TBD_ | | | |

## MVP scope

- Active implementation: a local Next.js/TypeScript prototype in `web/`, using the existing available JavaScript toolchain. This replaces the proposed Python UI for this increment; the product workflow in `idea.md` remains the authority for behavior.
- First source: Finnish Cancer Registry cervical-screening report. Extract public aggregate screening-chain counts for 2020–2024 with distinct cohort/dimension metadata. Demonstrate import/mapping, descriptive disparities, measured transitions, reviewed evidence, an action register and subsequent-year comparisons.
- Acceptance: source-backed demo data, recalculation on dimension/year/group changes, validated CSV import, explicit unresolved causes, traceable recommendation evidence, optional server-side model drafting with a labelled deterministic fallback, local action persistence and JSON export. Verify numerical/CSV boundaries with tests and build/type checks; exercise the UI if browser tooling is available.
- Scope limit: screening/process measures are not survival outcomes or measured treatment-start times. Goal 3 context must be distinguished from a directly measured Goal 3 outcome. No confidential records, causal guarantees, or general-purpose dataset support.
- Must have for the demo: import/mapping → population comparisons → measured transition → evidence → action plan → repeat-period monitoring. Implemented in `web/`.
- The "wow" moment: switch the population dimension and follow a real disparity through to a sourced action, then append a reporting period without losing the action register.
- Riskiest part: overclaiming from incomplete follow-up or AI prose. The app labels descriptive results and unresolved causes; optional model failure returns a labelled deterministic template. Recommendation actions use reviewed guideline summaries.
- Out of scope: confidential/patient-level data, arbitrary study formats, autonomous causal identification, live systematic reviews, shared cloud persistence and deployment. Live provider generation requires credentials and remains separate from mocked integration verification.
- Verified on 13 November: 19 unit/integration tests, 5 browser tests, TypeScript and production build passed. Browser coverage includes the official-data workflow, renamed CSV headers, missing follow-up, invalid counts, local action persistence, report download, mobile layout, endpoint validation and appending a new reporting period. Desktop/mobile screenshots were inspected locally. Dependency installation reported no known vulnerabilities. Live model-provider generation was not verified with credentials.

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
