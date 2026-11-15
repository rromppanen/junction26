# Pitch plan and Q&A

The deck is [deck/farmagusta-pitch.pdf](deck/farmagusta-pitch.pdf), 14 slides. What to say on each slide, with sources, is in the [speaker notes](deck/speaker-notes.md). This page holds the timing, the limits to say first and the short answers for Q&A. The product story is in [docs/idea.md](../idea.md).

## In one breath

Three in ten people invited to bowel screening in Helsinki never send the test back, and people with another mother tongue skip it almost twice as often. farmagusta guides them through the test in their own language, sends a robot to collect the sample from their door, and shows the nurse exactly where each person stopped.

**Say the limits before a judge does:** the robots, the lab and the bookings are simulated, and the people in the demo are invented. No effect is claimed until a pilot measures one.

## 3:00 live pitch

| Time | Slides | Part |
| --- | --- | --- |
| 0:00–0:40 | 1–4 | The gap: 30.4% of Helsinki's invited people never return the test; 53.4% against 74.5% by mother tongue; the link to Goal 3 survival |
| 0:40–1:00 | 5 | Four reasons people skip, one fix for each |
| 1:00–2:10 | 6–12 | The journey (QR, language, steps, robot pickup) and the nurse dashboard. Show the live app here if the connection is good |
| 2:10–3:00 | 13–14 | Mailing cost avoided, and the ask: one Helsinki district for one screening round, with Starship as robot partner |

Before the demo, run `npm run smoke -- https://farmagusta.vercel.app` in `web/` and open `/kit` and `/nurse` once on the devices you'll use.

The 2:00 video is edited from the clips in [farmagusta/video/](farmagusta/video/README.md).

## Q&A in one line each

- **Which Goal 3 indicator?** Survival and cancer deaths, through returning the test (slide 3), and sub-goal 3.1, delay-free care: the days from a positive test to colonoscopy, which the nurse board flags after 7 days.
- **What does a robot pickup cost?** We don't know yet; pricing it against the €2.07 postage is part of the pilot. The €240,000 is gross mailing cost avoided in the capital region at the 80% goal, before robot costs.
- **Why a robot and not just an SMS?** The SMS reminder is in the service and has the strongest evidence (53.7% → 64.2% in a Catalan trial). The robot removes the trip and the embarrassment of posting a stool sample. The pilot can test the two separately.
- **Does this help rural Finland?** Not with robots. The language guidance, reminders and nurse board work anywhere; the robots fit dense areas, where most foreign-language speakers live.
- **Who runs the robots?** Starship, through its partner API. The clinical integration and the locked compartments are our proposal to build with them; in the demo they are simulated.
- **What about patient data?** The demo holds only invented people. Robot destinations show a pickup code, not a name, and only the patient's phone opens their compartment.
- **Is the language gap caused by language?** Not proven. It is an association in the Registry's figures; the pilot logs where each person stops, and nurses note reasons on calls.
