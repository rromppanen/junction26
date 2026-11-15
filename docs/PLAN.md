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

- Challenge: AstraZeneca "Equal Care Across Finland". Pre-submission text is in the README's submission fields; it can be changed until Sun 10:00.
- Product: **farmagusta**, a guided home bowel-screening test in nine languages, robot pickup of the sample and a nurse board that flags everyone who falls behind. The story is in [idea.md](idea.md).
- Why this: Helsinki returns 69.6% of bowel screening tests against the 80% goal, and people with another mother tongue take part least (53.4% against 74.5%, Finnish Cancer Registry 2024). The mentors said the patient can't see the next step and nobody monitors the guidelines.
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

- Must have for the demo: `/kit` from language choice to robot handover, and `/nurse` showing the same person move stage and the flagged people first.
- The "wow" moment: the robot arrives on the phone's map while the nurse board on the laptop updates live.
- Riskiest part, and the fallback if it fails: the shared log (`/api/samples`) or the public map and routing services. Fallback: two tabs in one browser, and the straight-line route the app draws when no router answers.
- Out of scope: a real robot, lab or booking integration; measured effect on participation; regions outside the capital area.

## Submission checklist

- [ ] Pre-submission sent (Fri 23:59)
- [ ] Repo public, MIT [LICENSE](../LICENSE) present, README filled in
- [ ] Name and punchline
- [ ] Description
- [ ] Technologies list
- [ ] Demo link works in an incognito window
- [ ] Source link
- [x] Pitch deck exported to [PDF](pitch/farmagusta-screening-attendance.pdf), from [PowerPoint](pitch/farmagusta-screening-attendance.pptx)
- [ ] Pitch video **≤ 2:00** (check the exact length before uploading)
- [ ] Submitted to every challenge we qualify for
- [ ] Final submission before Sun 10:00
- [ ] Whole team at peer review at 10:30

## Research sources

- **Scopus (now):** search it through the browser at <https://www.scopus.com> with university sign-in (Aalto). No API key needed.
- **Scopus via MCP (option, not active):** [scopus-mcp](https://github.com/qwe4559999/scopus-mcp) gives Claude Code direct tools: search, abstracts, authors, citing papers. A working, tested setup is in commit `c1df85a`; restore it with `git revert 76422a7`. It needs an Elsevier API key from <https://dev.elsevier.com/> in `.env`, plus `uv`. Keep the `mcp>=1.0,<2` pin, because the server crashes with MCP SDK 2.x.

## Mentor questions

_Write down what we ask and what we hear back._
