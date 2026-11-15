# Pitch script and Q&A

The deck is [farmagusta-screening-attendance.pptx](farmagusta-screening-attendance.pptx). Every figure below is on a deck slide with its source. If a slide changes, check the number before you say it. The product story is in [docs/idea.md](../idea.md).

## In one breath

12,789 people in Helsinki didn't return their bowel screening test in 2024, and people with another mother tongue take part least. farmagusta guides them through the home test in their own language, sends a robot to collect the sample from the door, and shows the nurse everyone who falls behind.

**Say the limits before a judge does:** the robots, the lab and the bookings are simulated, and the people in the demo are invented. No effect is claimed until a pilot measures one.

## 3:00 live pitch

1. **Problem (40 s), slides 2–4.**
   - Abdirahman, 66, from Kontula, is a composite of the groups that take part least. The invitation arrives in Finnish, the kit goes in a drawer, and nobody notices it never comes back.
   - Helsinki: 69.6% returned the test, against 73.5% in Finland and the 80% goal.
   - Other mother tongue: 53.4% take part, against 74.5%.
2. **Why, and the fix (30 s), slides 5–6.** Four barriers, each with a fix. Text reminders already have trial evidence: kit return rose from 53.7% to 64.2% in a Catalan RCT.
3. **Demo (1:30), slides 7–9 or the live app.**
   - `/kit` on a phone: choose a language, read what the test is, follow the steps, book the robot, watch it arrive.
   - `/nurse` on a laptop: the same person moves stage; the flagged people sort first; send a reminder or record a call.
   - `/nurse/robots`: the fleet on the map, destinations by pickup code, not by name.
4. **Pilot and ask (20 s), slides 10–11.** One Helsinki district against usual care, measuring the test-return rate (Goal 2) and the days from a positive test to colonoscopy (Goal 3). We are looking for a district and a robot pickup partner.

Before the demo, run `npm run smoke -- https://farmagusta.vercel.app` in `web/` and open `/kit` and `/nurse` once on the devices you'll use.

The 2:00 video is edited from the clips in [farmagusta/video/](farmagusta/video/README.md). Its voice-over guide is [narration-draft.md](farmagusta/video/project/narration-draft.md).

## Q&A in one line each

- **Which Goal 3 indicator?** Sub-goal 3.1, delay-free care along the pathway: the days from a positive test to colonoscopy. Helsinki's median wait is about 3.4 months, against 1.9 in Finland (Registry chart, 2024). Participation itself is Goal 2.
- **What does a robot pickup cost?** We don't know yet; pricing it against a €2.07 return envelope is part of the pilot. The €74,000 is gross postage avoided in Helsinki, before robot and SMS costs.
- **Why a robot and not just an SMS?** The SMS reminder is in the service, and it has the strongest evidence. The robot removes the trip to a post box or lab, which matters most for people with disabilities (OR 0.72 for doing a stool test, Ricciardi et al. 2024). The pilot can test the two separately.
- **Does this help rural Finland?** Not with robots. The language guidance, reminders and nurse board work anywhere; the robot is for dense areas, where most foreign-language speakers live (56% live in Uusimaa).
- **Where is the AI?** The app uses no AI model. Every rule is plain tested code, so a nurse can see why someone is flagged. An optional question box answered only from a fixed list of HUS kit facts; it isn't linked in the demo.
- **What about patient data?** The demo holds only invented people. Robot destinations show a pickup code, not a name. A real service would run under the wellbeing services county's data protection, as screening already does.
- **Is the language gap caused by language?** Not proven. It is an association in the Registry's figures; the pilot logs where each person stops, and nurses note reasons on calls.
