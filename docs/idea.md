# NULLPATH

**Find where access breaks.**

NULLPATH shows a wellbeing services county the exact step where people fall off the cancer pathway, what closing that break would take and cost, and hands over the material to act on it.

A *null path* is a pathway that ends in nothing: an invitation with no screening, or a positive test with no examination.

Status: proposed direction, 14.11.2026. It combines what is already built on `main`, `feat/start-screen`, `feat/screening-simulator-page` and `feat/care-equity-mvp`. The team has not agreed it yet. Data and sources are in the [research note on pathway drop-off](research/2026-11-14-screening-pathway-drop-off.md).

## The insight

[docs/challenge.md](challenge.md) lists the referral and diagnosis steps as having no public county data. For the screening pathway, that data exists. The Finnish Cancer Registry publishes, per county, every step from invitation to treatment. It publishes them as statistical reports, not as something a county can decide from.

Colorectal screening, whole country:

- **One in five positive tests is never followed by a colonoscopy in the programme**: 3,536 of 16,501 in 2023 (21.4%), and the same share in 2022.
- **The share varies threefold between counties**: 10.3% in Etelä-Savo, 31.5% in Helsinki (2023).
- **The wait varies more than fourfold**: the median from positive test to colonoscopy is about 1.9 months nationally, about 3.7 months in Päijät-Häme and Pohjois-Savo, and about 0.8 months in Keski-Uusimaa (2024, read from the Registry's chart). The European quality guideline asks for 31 days from referral.
- **The breaks cost cancers found late.** Of the 1,241 bowel cancers among people eligible in 2022, 259 were in people who never returned the test and 87 in people with a positive test and no screening colonoscopy. That is 28% of the cancers.
- **The same people are missed everywhere.** People whose mother tongue is not Finnish, Swedish or Sami take part at 53% in colorectal, 61% in breast and 56% in cervical screening, against 75–83% for everyone else (2024).

Across the three screening programmes, about 249,000 invitations a year lead to no screening.

## Who it is for

The cancer-care lead or screening coordinator of a wellbeing services county, who has to take a proposal with a budget to the county board. The AstraZeneca mentors said the user is "probably public, but you decide" (mentors, Junction 13.11.2026).

## What it does

One flow, five steps. Each step answers one question a county lead has.

| Step | Question | What the user sees | Brief requirement |
| --- | --- | --- | --- |
| 1. **See** | Where do we lose people? | The county's pathway as a funnel in people, not percentages: invited → took part → positive → examined → treated, next to Finland and the best quarter of counties | Identify the gap |
| 2. **Locate** | Which step is ours to fix? | The break ranked largest: an **access** break (people don't come: invitation step) or a **service** break (people come and wait: after a positive test), with the wait in months | Locate it in the pathway |
| 3. **Decide** | What are our options and what do they cost? | A decision board: 3–4 options for that break, each with people reached, cost, cancers and precursors found, and cost per finding. Assumptions are cited and editable | Recommend, as the mentors asked: "not one recommendation, a tool for weighing options" |
| 4. **Act** | What do I take to the board on Monday? | A one-page board memo in Finnish with the chosen option, budget line, owner and target; invitation and SMS drafts in the county's largest languages | Actionable proposals |
| 5. **Monitor** | Did it work, and what about the steps nobody measures? | A monthly recording kit for the unmeasured steps; the county uploads its own figures and the funnel updates | "Guidelines exist, but nobody monitors them" (mentors) |

### Steps 1–2: the funnel and the break

The funnel uses Registry counts for all three programmes. Colorectal screening goes furthest: it reaches colonoscopy and treatment, so it covers all four stages in the brief (detection, referral, diagnosis, treatment initiation).

The break is classified by rule, not by AI:

- **Access break:** participation below the 80% target or the national level. The "who is left behind" panel shows which groups, using the Registry's own breakdowns by language, education, birthplace and sex.
- **Service break:** people take part, but positives are not examined, or wait long. Shown with the county's share without colonoscopy and its median wait.
- **Unmeasured:** symptom to referral, and diagnosis to treatment start. Shown as "no public data", leading to step 5.

### Step 3: the decision board

Each option is a row. The user changes the target or any assumption and the row recalculates.

| Break | Options to compare | Evidence |
| --- | --- | --- |
| Access (invitation → screening) | Reminder by SMS; invitation and reminder in the area's largest languages; outreach with local language-group associations; evening or weekend slots | FICAN cervical screening quality handbook pp. 18–19; roadmap p. 10 |
| Service (positive test → colonoscopy) | A screening nurse calls every positive without a booking within a week; a pre-booked colonoscopy time in the result letter; buying examination capacity to reach a target wait | Selby et al. 2017 (navigation and provider reminders: moderate evidence); European guideline rec. 3.16; Corley et al. 2017 |
| Unmeasured steps | Start recording three delays monthly | THL guidance 21/2016; roadmap actions 2.5.2 and 3.1.2 |

Outputs per option, all computed from the county's own counts:

- **People:** extra participants or extra colonoscopies a year.
- **Findings:** expected cancers and advanced precursors found, at the yield observed in the county's own programme. Marked as an assumption.
- **Cost:** people × unit cost. A unit cost is pre-filled only when it has a public source; otherwise the county enters its own.
- **Value:** cost per finding. For breast screening, life-years and cost per life-year from the stage-shift model, with its sensitivity and uncertainty range.

No effect size or cost is invented. An option without a sourced effect shows "set your own expected effect" and still calculates.

### Step 4: the kit

- The **board memo** (*hallitusmuistio*) exists on `main`. It gains the chosen option, its budget line and a target written as baseline → target → date.
- The **reach kit** on `feat/start-screen` drafts invitations and SMS reminders in the largest languages of the lagging areas, with a back-translation and an automatic check.

### Step 5: monitor

- The **recording kit** on `main` defines three monthly measures: referral to specialist visit, suspicion to diagnosis, diagnosis to treatment start.
- The **upload pipeline** on `feat/care-equity-mvp` takes the county's filled-in CSV, maps and validates it, and adds the county's own figures to its funnel. Public data shows where to look; the county's own data shows the rest.

## The demo: one programme, two counties, two different fixes

**Päijät-Häme: a service break.**

- 75.2% return the colorectal test, above the national 73.5%. People come.
- 26.0% of positives had no colonoscopy in the programme (192 of 739 in 2023), against 21.4% nationally.
- The median wait to colonoscopy is about 3.7 months, the longest in Finland together with Pohjois-Savo, and about twice the national median.
- Bowel cancer 5-year survival is 63%, against 68% nationally (Sotkanet 3627).
- Decision board: matching the best quarter of counties (16% without colonoscopy) means 74 more colonoscopies a year, and about 4 cancers and 30 advanced precursors found (assumption: the same yield as in those examined in 2023).
- Memo target: "Positives examined in the programme: from 74% (2023) to 84% in the 2027 round. Median wait: from about 3.7 months to under 2 by the end of 2027."

**Helsinki: an access break first.**

- 69.6% return the test, the lowest in Finland. Reaching 80% means 4,386 more participants a year.
- The reach kit shows the largest languages in the lagging areas and drafts the invitations.
- Helsinki also has the highest share of positives without colonoscopy (31.5%), so the board shows both breaks and lets the user compare what each costs.

The contrast is the point: the same programme breaks at different steps in different counties, so the same recommendation for everyone would be wrong.

## Strategy goals covered

- **Goal 3, sub-goal 3.2** (reliable information on regional differences in diagnostics): the share of positives examined, per county.
- **Goal 3, sub-goal 3.1** (delay-free care): the wait from positive test to colonoscopy, and from positive mammogram to confirmatory examination, per county. Treatment-start times are not published; the recording kit covers them.
- **Goal 3 headline** (survival): 5-year survival per county for bowel, breast and cervical cancer (Sotkanet 3627, 3625, 3626), shown as the outcome, never as an effect of one year's screening.
- **Goal 2** (80% participation in every programme in every county): the participation step. Screening participation is labelled Goal 2.

## Where the AI is

| Task | AI does | Guard |
| --- | --- | --- |
| County brief and memo text | Gemini words the finding and the chosen option | A validator rejects any number or source not in the data; a labelled rule-based text replaces it on failure |
| Reach kit | Gemini drafts invitations in other languages | Back-translation shown; drafts failing the automatic check are withheld |
| Upload | Gemini proposes how an unfamiliar CSV's columns map to the pathway steps | The user confirms unclear mappings; counts are validated by code |
| Evidence | Context.dev retrieves passages from a fixed list of authoritative publishers | Shown with URL and retrieval time; not treated as appraised evidence |

AI never produces a number, never classifies the break and never chooses the option. The county lead chooses.

## How it meets the criteria

| Criterion | Weight | What the judges see |
| --- | --- | --- |
| Actionability | 30% | Options with people, cost and expected findings; a target with baseline, value and date; a board memo and invitation drafts ready to use |
| Insight | 25% | A measured break at a named step, in people, per county, including referral-to-diagnosis; who is left behind from individual-level registry data |
| Data quality & transparency | 20% | Registry counts with a link per figure; assumptions cited, editable and marked; limits stated on screen |
| Execution | 15% | One live flow in a deployed app; rule-based fallbacks so the demo never depends on a model call |
| Clarity | 10% | "Where do we lose people" as a funnel; the answer and the action fit one printed page |

Minimum requirements: sources on every claim; Goal 3 covered by measured indicators (3.1, 3.2, survival); proposals with cost and target; a working demo.

## Limits to state on screen

- "No colonoscopy in the programme" is not proof that no examination happened. Some people are examined elsewhere or have a medical reason.
- The latest year is incomplete. Use 2023 for the share examined, and label 2024.
- Waiting times are read from the Registry's charts until exact values are obtained.
- The European 31-day standard counts from referral; the Registry counts from the positive test.
- Expected findings assume the yield seen in those who were examined. People who do not attend may differ.
- Survival pools 15 years of diagnoses, mostly before colorectal screening began in 2022. It is context, not an effect.
- Language and education groups include missing data, as the Registry defines them.
- Symptom-based pathways, which most cancers follow, have no public county data. The tool says so and offers the recording kit.

## What exists and what to build

| Piece | Where it is now | What is needed |
| --- | --- | --- |
| County map, brief, validator, Finnish memo, recording kit | `main` | Keep. Add the chosen option and target to the memo |
| Scenario tool with cited, editable assumptions | `feat/start-screen` | Extend from one target to rows of options: the decision board |
| Reach kit with translated drafts | `feat/start-screen` | Keep. Feed it the Registry's language figures |
| Stage-shift model with sensitivity and uncertainty | `feat/screening-simulator-page` | Replace placeholder inputs with sourced values, or show them as assumptions; link it from the breast option |
| Registry report parser with checksums | `feat/care-equity-mvp` (`web/scripts/ingest.py`) | Extend from the cervical report to the colorectal and breast reports |
| Upload pipeline (map, validate, analyse) | `feat/care-equity-mvp` | Reuse as step 5: the county's own monthly figures |
| County survival for cervical cancer | PR #6 | Rebase onto the pipeline refactor, or port into `main`'s indicators |

Build order for Saturday, most valuable first:

1. **Colorectal funnel per county** from the Registry report: counts for each step, 2022–2024, with Finland and the best quarter. Done when the Päijät-Häme and Helsinki figures above appear on the county page with source links.
2. **Break classification** by rule, with the "who is left behind" panel from Registry group tables. Done when Päijät-Häme shows a service break and Helsinki an access break, with tests.
3. **Decision board** for the two break types. Done when changing a target or a unit cost recalculates every row, and no pre-filled figure lacks a source.
4. **Memo** carries the chosen option, budget line and target. Done when the printed page for Päijät-Häme matches the demo above.
5. **Deploy and pre-warm** the two demo counties. Done when the flow runs in an incognito window without a model call.
6. Stretch: upload of the recording kit CSV; breast and cervical funnels; exact waiting times.

The two `web/` apps cannot be merged by Git; one has to host the other's modules. Most of the pieces above already run in the `main` app, so the smaller job is to port the Registry parser and the upload pipeline into it. This is the team's decision to make first thing Saturday.

## Questions for the mentors on Saturday

1. Does the colorectal programme have its own target for the wait to colonoscopy, and would a county act on this figure?
2. What does a screening colonoscopy cost a county, and a nurse's follow-up call?
3. Who in a county owns the step between a positive test and the colonoscopy?
4. Which of the access options have counties already tried?

Their answers count as evidence under the brief and fill the board's unit costs.

## Pitch in one breath

Finland sends over a million cancer screening invitations a year. A quarter of a million lead nowhere, and one in five positive bowel tests is never followed up in the programme. Where that happens differs by county: in Helsinki people don't come; in Päijät-Häme they come and wait. NULLPATH shows each county its own break, in people; lets its cancer lead compare what each fix costs and finds; and prints the board memo. The strategy says equal care. This is where it stops being equal, and what Monday's decision is.
