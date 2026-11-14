# farmagusta

**Get the people who don't return the bowel screening test back into screening.**

farmagusta guides the person invited to bowel cancer screening through the home test in their own language. A robot collects the sample from the door, and a nurse board flags everyone who falls behind.

Challenge: AstraZeneca, *Equal Care Across Finland* ([challenge.md](challenge.md)). Pitch deck: [farmagusta-screening-attendance.pptx](pitch/farmagusta-screening-attendance.pptx). Pitch and Q&A: [pitch/script.md](pitch/script.md). The team's earlier direction, Läpi, is in the [archive](archive/README.md).

## The problem

All figures are from the Finnish Cancer Registry's bowel screening statistics for 2024 unless stated otherwise ([report](https://stats.cancerregistry.fi/joukkistilastot/suolisto.html)).

- **Helsinki misses the goal by 10 points.** 69.6% of those invited returned the test, against 73.5% in Finland and the national cancer strategy's goal of 80%. That is 12,789 people a year who did not return it.
- **The gap is widest by mother tongue.** Nationally, 53.4% of people with another or missing mother tongue took part, against 74.5% of Finnish, Swedish or Sami speakers. Men took part less than women: 69.2% against 77.7%.
- **After a positive test, Helsinki waits longer.** The median wait from a positive test to colonoscopy was about 3.4 months, against 1.9 in Finland. The Registry publishes this only as a chart, so the values are read by hand ([`registryWaits.ts`](../web/src/data/registryWaits.ts)).
- **21% of Helsinki's residents speak a foreign language**, against 11% in Finland (City of Helsinki, end of 2025).

## Why people don't take part

The evidence is mostly from surveys, much of it from abroad. For any one person, the cause is unknown.

| Cause | What farmagusta does | Evidence for a similar fix |
| --- | --- | --- |
| Doesn't understand the letter | The app in nine languages; a nurse calls with an interpreter | The language gap above (53.4% against 74.5%). No trial yet |
| Forgets or puts it off | A booked pickup time and a text reminder | SMS reminder RCT: kit return 53.7% → 64.2% at 30 days (Vives et al. 2024, Catalonia) |
| Returning it is a hassle | The robot collects at the door | An extra return option raised participation by 2.9 points in the lowest group (Sandiford et al. 2018, New Zealand) |
| Finds it unpleasant | Not solved: clear steps and answers only | 59.6% of non-users in a US study cited discomfort, disgust or embarrassment (Gordon & Green 2015) |

Full citations are on the deck's sources slide and in its speaker notes.

## Who it is for

- **The person invited to screening**, aged 56–74, every two years. The service is built around the groups that take part least: people with another mother tongue and people with disabilities.
- **The screening nurse**, who follows up everyone who falls behind.

The AstraZeneca mentors told us that a patient can't see where they should be on the pathway, what happens next or how long a delay is allowed, and that treatment guidelines exist but nobody monitors them ([mentor notes](research/2026-11-13-astrazeneca-mentor-feedback.md), Junction 13.11.2026). farmagusta answers both: the person sees the next step, and the nurse sees who is stuck.

## What we built

Two linked web apps on one address, deployed at <https://farmagusta.vercel.app>.

| Part | Path | What it does |
| --- | --- | --- |
| Phone app | `/kit` | Explains the test in plain words in nine languages, walks through the ten sampling steps of the HUS kit leaflet, books a robot pickup, shows the robot on a live map and guides the handover. A positive result says that a nurse will contact the person to book a colonoscopy |
| Nurse board | `/nurse` | Every participant by stage, with language and interpreter need. Flags no sample 14 days after the invitation, a positive result with no colonoscopy booked after 7 days, a robot waiting at the door and a sample waiting for lab registration. The nurse sends a reminder, records a call or books a colonoscopy |
| Robot pickups | `/nurse/robots` | A simulated fleet of 30 robots at six hubs in Helsinki, Espoo and Vantaa, with destinations shown by pickup code, not by name |

The flag thresholds are our assumptions, not clinical deadlines. The demo uses invented people, and the robot, lab and bookings are simulated. Technical details are in the [README](../README.md) and [nurse/README.md](../nurse/README.md).

## Strategy goals covered

- **Goal 2** (80% participation in every screening programme in every county): the test-return rate, which the pilot measures.
- **Sub-goal 1.3**: people whose mother tongue is not Finnish or Swedish reach the same participation as Finnish and Swedish speakers (strategy pp. 19–20).
- **Goal 3, sub-goal 3.1** (equal, delay-free care along national pathways): the days from a positive test to colonoscopy, logged per person and flagged after 7 days. Colonoscopy is diagnostics, so this is not claimed as a treatment target time under THL guidance 21/2016.

## Cost

In Helsinki, the service could replace up to about €74,000 a year of postage: 29,226 reply-paid return envelopes at €2.07, and one paper reminder at €1.03 to each of 12,789 non-returners (Posti contract prices from 1.10.2026, VAT 0). Sending each non-returner one reminder is our assumption. This figure is gross postage avoided, before robot and SMS costs, so it is not a net saving. The cost of one robot pickup is not known yet.

## The proposal: one district pilot in Helsinki

Compare against the usual invitation in the same period, split by mother tongue and sex.

- **Measure:** the test-return rate in the whole assigned group, the days from a positive test to colonoscopy, lab acceptance and invalid samples, and staff time and collection cost per returned test.
- **Find:** a district to pilot in, and a robot pickup partner, and price one pickup against a €2.07 return envelope.
- **Check:** have the nine translations reviewed by professional translators, and test the service with migrants and people with disabilities.
- **Keep:** the post and the phone for people without a smartphone.

No effect is claimed until the pilot measures one.

## Where the AI is

The app on `main` uses no AI model. An earlier question box (`/api/kit/ask`, [`kitAsk.ts`](../web/src/lib/kitAsk.ts)) answered questions about the kit with Gemini, using only a fixed list of HUS facts. It still exists, but no page links to it.

## Limits

- The robots, lab registration and colonoscopy booking are simulated. No real lab or booking system is connected.
- The causes of non-participation come mostly from surveys abroad. The pilot logs where each person stops, and nurses note reasons on calls, to measure the cause in Finland.
- The language figures are national; the Registry publishes no county breakdown by mother tongue.
- The wait to colonoscopy is read from the Registry's chart to about ±0.1 months.
- The service needs a smartphone and someone at home when the robot arrives. Sidewalk robots suit dense cities, not sparsely populated regions.
