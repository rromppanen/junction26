# junction26

> **Punchline:** farmagusta helps more people complete bowel cancer screening: a guided home test in their own language, a robot that collects the sample from the door, and a nurse board that flags everyone who falls behind.

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | farmagusta |
| Punchline | farmagusta helps more people complete bowel cancer screening: a guided home test in their own language, a robot that collects the sample from the door, and a nurse board that flags everyone who falls behind. |
| Challenge(s) | AstraZeneca: Equal Care Across Finland |
| Technologies | Next.js, TypeScript, Tailwind CSS, MapLibre GL, Leaflet, OpenStreetMap routing (OSRM), Upstash Redis, Vercel, Vitest, GitHub Actions |
| Demo link | https://farmagusta.vercel.app |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck | [PDF](docs/pitch/deck/farmagusta-pitch.pdf) · [HTML](docs/pitch/deck/farmagusta-pitch.html) · [speaker notes](docs/pitch/deck/speaker-notes.md). Earlier version: [PDF](docs/pitch/farmagusta-screening-attendance.pdf) · [PowerPoint](docs/pitch/farmagusta-screening-attendance.pptx) |
| Pitch video (max 2:00) | _TBD_ |

## Description

**Problem.** In 2024, 12,789 people in Helsinki (30.4% of those invited) did not return their bowel screening test. Helsinki's participation was 69.6%, against 73.5% in Finland and the national cancer strategy's goal of 80%. The gap is widest by mother tongue: 53.4% of people with another or missing mother tongue took part, against 74.5% of Finnish, Swedish or Sami speakers (Finnish Cancer Registry, 2024). After a positive test, Helsinki's median wait for a colonoscopy was about 3.4 months, against 1.9 in Finland (read from the Registry's chart).

**Who it is for.** The person invited to screening (ages 56–74, every two years), and the screening nurse who follows up everyone who falls behind.

**What we built.** Two linked web apps on one address:

- **Phone app (`/kit`):** in nine languages (Finnish, Swedish, English, Russian, Estonian, Arabic, Ukrainian, Somali and Persian, with right-to-left layout for Arabic and Persian). It explains the test in plain words, walks through the ten sampling steps, books a robot pickup (as soon as possible or a one-hour window), shows the robot on a live map and guides the handover at the door. A positive result tells the person that a nurse will contact them to book a colonoscopy.
- **Nurse workspace (`/nurse`):** a live map with an expandable patient queue and filters for stages, labs, locations and map layers. Patient details include language and interpreter need. People who fall behind appear first in the queue: no sample 14 days after the invitation (with reminder status), a positive result with no colonoscopy booked after 7 days, a robot waiting at the door, a sample waiting to be registered at the lab. The nurse sends a reminder, records a call or books a colonoscopy from the person's drawer. These thresholds are our assumptions, not clinical deadlines.
- **Robots:** the same workspace (also available at `/nurse/robots`) shows the simulated fleet: 30 robots across six hubs in Helsinki, Espoo and Vantaa, each with up to four sample compartments. Destinations use pickup codes. Select a robot or hub to inspect its run and register returned samples.

**How it works.** The sample logic is plain tested code: an event log per person, the stage derived from it, the flag rules and the robot simulation. The phone and the board share one event log behind `/api/samples` (Upstash Redis on Vercel), so a phone and a laptop see each other's actions. Walking routes come from the public FOSSGIS OSRM router. The sampling steps follow the HUS kit leaflet in order, and the registry figures above are in the pitch deck with their sources. Robot routes are planned with shortest-path search of the A* family, a classic AI planning method; the flag rules are plain tested code, so a nurse can see why someone is flagged.

**Strategy fit.** Participation is Goal 2 of the National Cancer Strategy 2026–2035 (80% in every wellbeing services county). The Goal 3 indicator we track is the time from a positive test to colonoscopy, which the nurse board flags per person. Sub-goal 1.3 asks that people whose mother tongue is not Finnish or Swedish reach the same screening participation as Finnish and Swedish speakers (strategy pp. 19–20), which is the group the app is built around.

**Who gains most.** People with another mother tongue, most of whom live in cities (56% of Finland's foreign-language speakers live in Uusimaa), and people with disabilities, who have lower odds of doing a stool test (OR 0.72, Ricciardi et al. 2024) and no longer need a trip to post it.

**Cost.** In Helsinki, Espoo, Vantaa and Kauniainen, 235,677 people are aged 56–74 (Statistics Finland). Invited every two years, that is about 118,000 kits a year. At the 80% goal, about 94,000 samples come back, each in a Posti business-reply envelope at €2.07 (contract price, VAT 0), and every kit carries a prepaid cardboard return envelope, which we estimate at €0.40. Robot pickup would avoid about €240,000 of mailing a year, or about €218,000 at today's return rate of about 70%. This is gross mailing cost avoided, before robot running costs, which the pilot will price.

**What's new.** Today the invitation arrives as a letter, the person posts the sample by the next working day or takes it to a lab, and nobody sees who stopped where. farmagusta changes three things:

- One guided journey on the person's phone, in their own language, from the invitation to the handover.
- A robot collects the sample from the door, so nobody has to find a post box or a lab.
- Each step is logged per person, so a nurse sees who stopped where and can send a reminder or call with an interpreter. The same log tracks the days from a positive test to colonoscopy.

**What's next.** One district pilot in Helsinki, against the usual invitation in the same period:

- Measure the test-return rate in the whole assigned group and the days from a positive test to colonoscopy, split by mother tongue and sex.
- Find a robot pickup partner and price one pickup against a €2.07 return envelope.
- Have the nine translations reviewed by professional translators, and test the service with migrants and people with disabilities.
- Keep the post and the phone for people without a smartphone, and connect the lab's sample registration, which the prototype only simulates.

Demo: invented people; the robot, lab and bookings are simulated.

## Run locally

The main app and the nurse board are two Next.js apps. Run each in its own terminal:

```
cd web && npm ci && npm run dev      # http://localhost:3000, phone app at /kit
cd nurse && npm ci && npm run dev    # port 3100; the main app forwards /nurse here
```

Without Upstash keys the shared event log lives in the dev server's memory. Run `npm run check` in both `web/` and `nurse/` before pushing; CI runs the same checks.

`npm run smoke -- <base url>` loads every page once and fails on any error; run it against the deployed site before the demo. Deployment steps are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Team

- Daniel Nikkar
- Inka Hiltunen
- Kuutti Niku
- Roope Romppanen

## Docs

| Document | What it holds |
| --- | --- |
| [docs/idea.md](docs/idea.md) | The product story: problem, causes, what we built, strategy goals, cost, pilot and limits |
| [docs/challenge.md](docs/challenge.md) | The AstraZeneca brief and key facts from the national cancer strategy |
| [docs/pitch/script.md](docs/pitch/script.md) | The 3:00 pitch and Q&A |
| [docs/pitch/farmagusta/](docs/pitch/farmagusta/README.md) | Video props and the video clips |
| [docs/PLAN.md](docs/PLAN.md) | Deadlines, decisions and the submission checklist |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deploying both apps to Vercel |
| [docs/research/](docs/research/) | Mentor notes and research behind the figures |

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
