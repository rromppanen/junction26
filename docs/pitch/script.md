# Pitch script and Q&A

The pitch follows the deck ([make_deck.py](make_deck.py) builds `lapi-deck-mockup.pdf`). Every figure has its source on the slide. Say once, out loud, that the demo's people, pickup, lab and bookings are invented or simulated.

## In one breath

Finland promises that 80% of people take part in every cancer screening, in every county. Today the people who fall short are the ones the system is hardest for: other languages, men, people far away, people who can't take time off. Läpi brings the test to them and has someone follow every sample all the way to care.

**Say the limit before a judge does:** this is a working prototype. We have not measured that it raises participation or shortens waits; the pilot measures that.

## 3:00 live pitch

| Time | Slide | Say |
| --- | --- | --- |
| 0:00–0:15 | 1 Title | "Läpi: cancer screening that reaches everyone." |
| 0:15–0:35 | 2 · 80% | "Finland has promised that by 2035, 80% of people take part in every cancer screening, in every county." |
| 0:35–0:55 | 3 · Who is left out | "We're not there. In bowel screening, people with another mother tongue send back the test at 53%. Men at 69%. The gap is not random: it follows language, sex and place." |
| 0:55–1:10 | 4 · 1 in 5 | "And even when the test finds blood, one in five has no follow-up colonoscopy in the programme. In Helsinki it's almost a third; in Etelä-Savo, one in ten." |
| 1:10–1:20 | 5 · Why | "Screening is built for people who already find it easy: a letter in Finnish, a post office, time off, and nobody noticing who's missing." |
| 1:20–1:25 | 6 · The idea | "So we turned it around. The test comes to you. Someone follows it all the way." |
| 1:25–2:20 | **Live demo** `/demo` | Phone on the left, nurse board on the right. **Phone:** Aino, 62, Lahti: kit → sample taken → pickup booked → it reaches her door → lab. **Board:** her card moves live. **Lab:** record a positive → her phone offers colonoscopy times, with an interpreter if needed → booked. **Board:** point at the flagged cards: "no sample after two weeks", "positive, no colonoscopy after a week". The nurse reminds, calls, books. |
| 2:20–2:35 | 9 · Each barrier, removed | "Language, distance, work, getting lost. Each one has an answer in the flow." |
| 2:35–2:50 | 10 · Bigger picture | "Today bowel screening. Tomorrow every screening that can start at home, and one way for every county to see who it isn't reaching." |
| 2:50–3:00 | 11 → 12 | "Next: one county, one quarter. We measure participation by group, follow-up and days to colonoscopy, before we claim anything. Because your language, your job or your postcode shouldn't decide when your cancer is found." |

Skip slides 7 and 8 live; the demo shows them. Use them in the video or if the demo fails.

## If the demo fails

Stay on slides 7 and 8 and narrate the same flow. The point survives without the clicks.

## Q&A in one line each

- **Goal 3?** Strategy Goal 3.1 and roadmap action 3.1.2 ask counties to set owners and access times for each pathway step. Läpi gives the step from positive test to colonoscopy an owner, a timer and a record. Participation itself is Goal 2.
- **Is the pickup real?** It's simulated. In practice it is any pickup: a courier, a pharmacy drop-off or a parcel locker. The point is that each sample is tracked, not the vehicle.
- **Why not just post, as today?** Post works for most people. Läpi is for the people it doesn't work for, and it shows the nurse exactly who they are.
- **Does it raise participation?** We haven't measured that. The pilot compares participation by group and follow-up against the Registry baseline. Endoscopy capacity can still limit the effect.
- **Is there AI?** Only answer this if the demo shows it. The flow itself is plain, tested code on purpose. Code owns every status, and nothing is decided by a model.
- **Other screenings?** Bowel screening already starts at home. Others would follow only where a home or self-sample test is in use. That's the vision, not this build.
- **Privacy?** The demo uses only invented people. A pilot would run inside the county's systems.
- **Who runs it?** The county's screening team, inside the programme that already exists.

The 2:00 video has its own script: [video-script.md](video-script.md).
