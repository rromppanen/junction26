# farmagusta pitch: speaker notes

Notes for the 15-slide [pitch deck](farmagusta-pitch.pdf). Numbered sources and evidence limits are in [references.md](references.md). Figures describe cited studies or planning scenarios, not measured outcomes of farmagusta.

## 1. farmagusta .

We built farmagusta to help people finish their bowel screening test. It guides them in their own language, collects the sample at the door and gives nurses a way to follow up. The robot, lab and bookings are simulated in the demo.

## 2. Too many tests never come back

In 2024, 12,789 people invited to bowel screening in Helsinki did not return the test: 30.4% of invitees. That is the gap we want to address. Returning the test is the first step before a result or any follow-up can happen.

## 3. Earlier detection matters

Goal 3 of the cancer strategy concerns equal and effective care. In the Flanders study, five-year relative survival was 93.8% for screen-detected cancers and 61.9% for FIT non-participants, rounded to 94% and 62% on the slide. This observational comparison includes lead-time bias and should not be read as a causal effect estimate. The study also reported stage I–II detection in 67% versus 40%.

## 4. The gap is wider for other language groups

Participation was 74.5% among people whose mother tongue was Finnish, Swedish or Sami, and 53.4% among people with another or missing mother tongue. The Registry counts are 299,347 of 401,645 and 10,524 of 19,720. These figures show an association; they do not establish language as the cause.

## 5. Make the test easier to finish

The earlier deck identified four barriers: understanding the leaflet, seeing a need for the test, remembering to complete it, and discomfort or difficulty returning the sample. The HUS leaflet is available in Finnish, Swedish and English. Gordon and Green’s US survey reported that 32.9% of non-users considered the test unnecessary and 59.6% named discomfort, disgust or embarrassment among their reasons. In Vives et al.’s randomised trial, an SMS reminder raised kit return from 53.7% to 64.2% at 30 days. Ricciardi et al. reported lower odds of a stool test among people with disabilities (OR 0.72). These findings motivate nine-language guidance, plain explanations, reminders and doorstep pickup. They come from different settings and are not measured effects of farmagusta.

## 6. The letter opens the app

The invitation still arrives by post. Its QR code opens farmagusta, starting with language choice. The app supports Finnish, Swedish, English, Russian, Estonian, Arabic, Ukrainian, Somali and Persian, with right-to-left layout where needed.

## 7. Four steps, all from home

The app takes the person from language selection through ten illustrated sampling steps, a pickup booking and live tracking at the door. The sampling order follows the HUS kit leaflet. A pickup can be booked as soon as possible or in a one-hour window.

## 8. An ordinary delivery robot

The proposed service uses the kind of robot already delivering groceries, with no medical markings. Each pickup is identified on the map by a code. Phone-controlled access and dedicated sample compartments are part of the proposed service, not a deployed clinical integration. Patient names remain available to nurses in their workspace.

## 9. Use an existing delivery fleet

We propose using an existing fleet rather than building a robot. Starship publishes a partner API for delivery jobs and status. farmagusta handles booking, pickup grouping and nurse visibility; the robot partner would handle physical delivery. Medical sample handling and the compartment insert would need to be developed and validated with the partner. No commercial partnership is claimed.

## 10. One locked compartment per sample

Each sample needs its own compartment so a later pickup cannot expose an earlier sample. The current demo models four compartments per robot. The hardware insert and phone-controlled access are proposals requiring partner validation. The intended rule is that a patient can open only the compartment assigned to that pickup; collected samples remain locked until lab intake.

## 11. See who needs help. Act from the map.

The nurse workspace combines a live map, a patient queue and filters. Nurses can open a patient to send a reminder, record a call, register an arrived sample or book a colonoscopy where appropriate. The demo has 30 robots across six hubs. Multi-stop runs collect up to four samples before returning for nurse intake.

## 12. A clear next action for the nurse

The nurse can see where a person stopped and choose a follow-up action. The flags are simple rules, not diagnoses or inferences about someone’s motivation. No sample 14 days after invitation and no colonoscopy booking seven days after a positive result are demo assumptions. A real service would need clinical review of these rules and its escalation process.

## 13. Return-mail base cost: a yearly scenario

The estimate covers Helsinki, Espoo, Vantaa and Kauniainen, with 235,677 people aged 56–74. The slide rounds annual counts to whole kits and samples: 235,677 ÷ 2 = 117,838.5, shown as 117,839 kits; 117,839 × 80% = 94,271.2, shown as 94,271 returns. Return postage is 94,271 × €2.07 = €195,140.97, rounded to €195,141. An estimated €0.40 envelope in all 117,839 kits costs €47,135.60, rounded to €47,136. The displayed sum is €242,277, presented as approximately €240,000. Calculating without intermediate rounding gives €242,275.96; the difference is display rounding. This is a base-cost planning scenario, not total postage or net savings. The Posti tariff lists Economyvastaus at €2.07 per item plus €17.24/kg, with account and possible handling fees. Weight, account, handling, robot and SMS costs are excluded. The invitation still goes by post. The age range 56–74 is a full-rollout planning cohort; HUS’s 2026 invitation cohorts are narrower, so this is not a claim about actual 2026 annual expenditure. Population: Statistics Finland table 11re, 31 December 2025. Postage: Posti contract price list, 1 October 2026, VAT 0. Envelope price is our estimate.

## 14. What still needs validation

The demo uses invented people. Robots, laboratory processing and appointments are simulated. The evidence we cite supports reminders, not robot pickup, and the proposed compartments and medical collection service would need validation with a delivery partner. The Vives trial tested reminders in a pharmacy-based FIT programme; it did not test robots or this prototype.

## 15. Making cancer screening easier to complete

Making cancer screening easier to complete, so fewer people are left behind.

## Strategy and evidence boundaries

Goal 2’s 80% participation target and Goal 1.3’s language-equity target motivate the proposal [2]. Slide 3 uses an international bowel-cancer study as background: its relative-survival comparison is observational and does not demonstrate a treatment effect or fulfil the strategy’s Nordic benchmark for poor-prognosis cancers. For Goal 3.1, time from a positive FIT to colonoscopy is a proposed diagnostic-pathway proxy; the official indicator concerns access to treatment within target times. The prototype does not measure treatment initiation or patient survival. The 14-day and 7-day flags are team assumptions, not guideline deadlines. Pilot evaluation would need clinical governance and an actual comparison group.

The cost slide uses the population cohort from the earlier team deck, attributed to Statistics Finland table 11re (2025; four municipalities; ages 56–74). The table is accessible, but an independent API re-sum could not be completed during this citation pass (HTTP 400). Retain this limitation until the team reproduces the extraction. Posti’s published per-item and per-kilogram prices were checked directly. The €0.40 envelope price and medical delivery design are team assumptions, not external evidence.
