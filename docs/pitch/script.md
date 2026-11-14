# Pitch script and Q&A

Every figure below is one the app shows, with the source it shows. If the app changes, check the number on screen before you say it.

## The story in one breath

Finland's cancer strategy promises equal care in every county, but nobody can see where each county loses its patients. We turn the national registers into a learning loop: **detect** where people fall off the pathway, **understand** which step is the county's to fix, **simulate** the options and their cost, **implement** with a board memo and invitations in the right languages, and **learn** from what moves. Today it works for one county at a time; the vision is the intelligence layer for the whole country.

**Vision line (ONCO-NATION framing, use only if the team agrees):** "What if Finland could stop reacting to cancer-care inequalities and start anticipating them? We're building the intelligence layer that turns national cancer data into decisions, measurable interventions and continuous improvement."

**Honest limit, say it before a judge does:** we use public aggregate data only. Capacity monitoring and national optimisation are the vision, not what we built this weekend.

## 2:00 video

| Time | Screen | Voice-over |
| --- | --- | --- |
| 0:00–0:15 | Start page, national view | "One in five people with a positive bowel-screening test in Finland never gets the colonoscopy: 3,536 of 16,501 in 2023. Over a quarter of one cohort's bowel cancers were in people the programme lost." |
| 0:15–0:30 | Early-warning list, the loop strip | "Gap Radar is the learning loop for Finland's cancer care. It flags counties that are getting worse, before the gap is big." |
| 0:30–0:50 | County picker → Helsinki, "In two minutes" | "Pick your county. In two minutes: the gap, cancer deaths against Finland (Goal 3), the step where people are lost, who is missed, and one costed option." |
| 0:50–1:15 | Decide board, then the stress test | "Decide compares options. In Helsinki, a nurse calling every positive without a booking means 209 more colonoscopies a year for about €174,000, €1,787 per cancer or advanced precursor found. And what if capacity fell by 20%? You see the cost before it happens." |
| 1:15–1:35 | Memo (FI), Reach them | "One click turns the choice into a Finnish board memo, and drafts invitations in the area's largest languages, because people with other mother tongues take part at 53–61% against 75–83%." |
| 1:35–1:50 | Simulator | "For breast screening, the simulator puts closing the gap in life-years and cost per life-year, with every assumption visible and adjustable." |
| 1:50–2:00 | Start page | "Every number is sourced. Gap Radar: from registers to decisions, in every county." |

## 3:00 live pitch (top 5)

1. **Problem (30 s):** the strategy's promise; the 21.4% and 28% figures; nobody sees which gap is theirs.
2. **Demo (2 min):** start page → early warning → Helsinki → In two minutes → Decide → stress test → Memo. Have the pages warm (`npm run smoke` within 10 minutes).
3. **Why it matters and what's next (30 s):** the learning loop; a pilot with one county's screening team; the method could carry across Nordic registries.

Have Päijät-Häme ready as the second example: a service break with a ~3.7-month wait to colonoscopy, about twice the national median (2024, read from the Registry's chart).

## Q&A: the hardest questions

**"Your simulator says about €6,000 per life-year. Where do the stage mix and costs come from?"**
Most of the breast simulator's assumptions are still placeholders, and the page says so. That's why every one is a slider with a range, and the uncertainty section shows the spread. The decision board for bowel screening uses real prices: Pohjois-Pohjanmaa's 2025 price list, €614 per colonoscopy and €100 per nurse call. A county replaces our defaults with its own.

**"Screening is Goal 2. Which Goal 3 indicator do you cover?"**
Cancer mortality per county, the Goal 3 headline (10% fewer cancer deaths, strategy p. 5), from the Cancer Registry, 2020–2024, age-standardised. Plus breast, bowel and cervical cancer survival per county from Sotkanet. Screening is how a county moves those.

**"Low attendance correlates with foreign background. Is that the cause?"**
No; it's an area-level association and we label it Inferred. The individual-level fact comes from the Registry: people whose mother tongue isn't Finnish, Swedish or Sami take part at 53–61% in all three programmes. That's why the Reach them kit targets languages, and the measuring kit checks after six months whether it worked.

**"What does the AI add over a table?"**
The numbers come from tested code, never from the AI. Gemini turns them into a brief a board member reads, drafts invitations in Somali or Arabic with a back-translation, and a validator rejects any figure the data doesn't contain. Without the AI the app still works; with it, a county gets the material to act on Monday.

**"Who pays, and who keeps it running?"**
It runs on public data and costs almost nothing to host. The natural owner is a national body (FICAN or THL) or a pilot with one wellbeing services county; AstraZeneca said it wants to continue promising work with a county. The data refreshes itself from the public APIs on each deploy.

**"Isn't this just another dashboard?"**
A dashboard shows a number. We locate the step where people are lost, cost the options, stress-test them, and hand over the memo and the invitations. Existing tools such as OncoSim (Canada) and EU-TOPIA model screening, but none works at the level of a Finnish county, from public data, ending in a decision.
