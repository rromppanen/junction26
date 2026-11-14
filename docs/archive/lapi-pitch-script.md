# Pitch script and Q&A

Every figure is one the app shows. If the app changes, check the number on screen before you say it.

## In one breath

Finland's cancer strategy promises equal care in every county, but nobody can see where each county loses its patients. Läpi shows the step where people drop off, costs the options, and hands the county a board memo to act on.

**Say the limit before a judge does:** public aggregate data only. Capacity monitoring and national rollout are the vision, not this weekend's build.

## 3:00 live pitch

1. **Problem (30 s):** One in five people with a positive bowel-screening test never gets the colonoscopy: 3,536 of 16,501 in 2023 (21.4%). Over a quarter (28%) of one cohort's bowel cancers were in people the programme lost.
2. **Demo (2 min):** start page → early warning → Helsinki → In two minutes → Decide → stress test → Memo.
   - Key line in Decide: a nurse calling every positive without a booking means 209 more colonoscopies a year for about €174,000.
   - Warm the pages first (`npm run smoke` within 10 minutes).
3. **Next (30 s):** pilot with one county's screening team; the method carries across Nordic registries.

Backup example: Päijät-Häme, ~3.7-month wait to colonoscopy, about twice the national median (2024).

The 2:00 video has its own script: [video-script.md](video-script.md).

## Q&A in one line each

- **Goal 3?** Cancer mortality per county (Cancer Registry, 2020–2024, age-standardised), plus survival per county from Sotkanet. Screening is how a county moves them.
- **Where do the simulator's costs come from?** Breast assumptions are placeholders shown as sliders with ranges. Bowel uses Pohjois-Pohjanmaa's 2025 prices: €614 per colonoscopy, €100 per nurse call.
- **Is foreign background the cause?** No, it's an area-level association, labelled Inferred. The Registry fact: non-Finnish/Swedish/Sami speakers take part at 53–61%.
- **What does the AI add?** Numbers come from tested code. Gemini writes the board brief and translated invitations, and a validator rejects any figure not in the data.
- **Just another dashboard?** A dashboard shows a number. We locate the step, cost the options, stress-test them and hand over the memo.
- **Who runs it?** Public data, near-zero hosting. Natural owner: FICAN/THL or a pilot county.
