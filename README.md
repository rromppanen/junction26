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
| Technologies | Next.js, TypeScript, Tailwind CSS, Leaflet, OpenStreetMap routing (OSRM), Upstash Redis, Vercel, Vitest, GitHub Actions |
| Demo link | https://farmagusta.vercel.app |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck | [`docs/pitch/farmagusta-screening-attendance.pptx`](docs/pitch/farmagusta-screening-attendance.pptx) |
| Pitch video (max 2:00) | _TBD_ |

## Description

**Problem.** In 2024, 12,789 people in Helsinki (30.4% of those invited) did not return their bowel screening test. Helsinki's participation was 69.6%, against 73.5% in Finland and the national cancer strategy's goal of 80%. The gap is widest by mother tongue: 53.4% of people with another or missing mother tongue took part, against 74.5% of Finnish, Swedish or Sami speakers (Finnish Cancer Registry, 2024). After a positive test, Helsinki's median wait for a colonoscopy was about 3.4 months, against 1.9 in Finland (read from the Registry's chart).

**Who it is for.** The person invited to screening (ages 56–74, every two years), and the screening nurse who follows up everyone who falls behind.

**What we built.** Two linked web apps on one address:

- **Phone app (`/kit`):** in nine languages (Finnish, Swedish, English, Russian, Estonian, Arabic, Ukrainian, Somali and Persian, with right-to-left layout for Arabic and Persian). It explains the test in plain words, walks through the ten sampling steps, books a robot pickup (as soon as possible or a one-hour window), shows the robot on a live map and guides the handover at the door. A positive result tells the person that a nurse will contact them to book a colonoscopy.
- **Nurse board (`/nurse`):** every participant by stage, with their language and interpreter need. People who fall behind are flagged first: no sample 14 days after the invitation (with reminder status), a positive result with no colonoscopy booked after 7 days, a robot waiting at the door, a sample waiting to be registered at the lab. The nurse sends a reminder, records a call or books a colonoscopy from the person's drawer. These thresholds are our assumptions, not clinical deadlines.
- **Robots (`/nurse/robots`):** the simulated pickup fleet (30 robots, six hubs in Helsinki, Espoo and Vantaa) on a street map, with destinations shown by pickup code, not by name.

**How it works.** The sample logic is plain tested code: an event log per person, the stage derived from it, the flag rules and the robot simulation. The phone and the board share one event log behind `/api/samples` (Upstash Redis on Vercel), so a phone and a laptop see each other's actions. Walking routes come from the public FOSSGIS OSRM router. The kit instructions follow the lab's sampling leaflet, and the registry figures above are in the pitch deck with their sources. The app uses no AI model.

**Strategy fit.** Participation is Goal 2 of the national cancer strategy. The Goal 3 indicator we track is the time from a positive test to colonoscopy, which the nurse board flags per person.

**Cost.** In Helsinki the service could replace up to about €74,000 a year of postage: 29,226 reply-paid return envelopes at €2.07 and one paper reminder at €1.03 to each of 12,789 non-returners (Posti contract prices from 1 October 2026, VAT 0; one reminder each is our assumption). This is before robot and SMS costs, so it is not a net saving.

**What's new.** _TBD by the team._

**What's next.** _TBD by the team._

Demo: invented people; the robot, lab and bookings are simulated.

## Run locally

The main app and the nurse board are two Next.js apps. Run each in its own terminal:

```
cd web && npm ci && npm run dev      # http://localhost:3000, phone app at /kit
cd nurse && npm ci && npm run dev    # port 3100; the main app forwards /nurse here
```

Without Upstash keys the shared event log lives in the dev server's memory. Run `npm run check` in `web/` before pushing; CI runs the same checks.

`npm run smoke -- <base url>` loads every page once and fails on any error; run it against the deployed site before the demo. Deployment steps are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
