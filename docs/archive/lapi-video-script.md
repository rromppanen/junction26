# 2:00 video script

The voice-over is about 270 words, which takes about 2:00 at a calm pace. Record the screens first, then the voice. Cut the screen to the voice, not the other way round. If you run long, cut the lines marked *(cut if long)*.

Before you record, check each number against the live app. The app shows the source for every figure in this script.

**Setup**
- **Browser.** Full screen at 1920×1080, zoom 110%, light theme, no bookmarks bar.
- **Pages.** Warm them with `npm run smoke` within 10 minutes of recording.
- **Cursor.** Move it slowly and click once. Don't scroll while the voice is saying a number.
- **Title cards.** Use deck slides 1, 2 and 12 (export them from the PDF). They give the video the same look as the deck.
- **Music.** Optional: low, no lyrics, fading out under the last line.

| Time | On screen | On-screen text (big, short) | Voice-over |
| --- | --- | --- | --- |
| 0:00–0:08 | Deck slide 2: "1 in 5", red on dark | 1 in 5 | "In Finland, one in five people with a positive bowel-screening test never gets the colonoscopy." |
| 0:08–0:18 | Deck slide 3: "28%" | 28% of cancers | "In one screening cohort, over a quarter of the bowel cancers were in people the programme had already lost. And where you live decides how likely that is." |
| 0:18–0:28 | Deck slide 1: Läpi logo, a path passing a gate | Läpi | "Läpi, Finnish for 'through', shows each of Finland's 21 wellbeing services counties where its people fall off the cancer pathway, and what to do about it." |
| 0:28–0:42 | App start page: national view, then the early-warning list | Detect | "It starts with the whole country: where Finland loses people, and which counties are getting worse before the gap is big." |
| 0:42–1:00 | County picker → Helsinki → "In two minutes" box | Understand | "Pick your county. In two minutes you see the gap, cancer deaths against the Finnish average, the step where people are lost, and who is likely missed. Here, the largest foreign-language groups are Russian, Somali and Arabic speakers." |
| 1:00–1:20 | Decide board, then the stress-test slider pulled to −20% | Simulate | "Then compare options with real prices. A nurse who calls every positive means 209 more colonoscopies a year, about €1,800 per cancer or advanced precursor found. And if capacity drops, you see what goes unfound before it happens." |
| 1:20–1:38 | Board memo (FI), then Reach them with a Somali draft and its back-translation | Implement | "One click turns the choice into a Finnish board memo, and drafts invitations in the area's own languages, each checked and translated back." |
| 1:38–1:48 | Measuring kit, then loading the example CSV with sparklines going down | Learn | "Each month the county measures its delays and sees whether its changes worked. *(cut if long)*" |
| 1:48–1:55 | Evidence labels on a figure (Observed / Simulated) | 0 numbers from AI | "Every number comes from public registers and tested code. The AI only writes, and a validator checks every figure it uses." |
| 1:55–2:00 | Deck slide 12: "Next: one county, one quarter, one gap closed." | [demo link] | "Läpi. Where you live should matter less for how quickly your cancer is found." |

## Notes for the voice

- **Delivery.** Say it, don't read it. Pause for half a second after each big number: "one in five", "a quarter", "209".
- **Numbers.**
  - Say "about eighteen hundred euros", not "€1,787". The exact figure is on screen.
  - Don't say "21.4%" aloud; "one in five" is enough.
- **Claims.** Don't claim a national control tower, a digital twin or live hospital capacity data. The stress test is a scenario on public counts, and the app says so.

## Sources for every spoken figure

| Figure | Source as shown in the app |
| --- | --- |
| One in five (3,536 of 16,501, 2023) | Finnish Cancer Registry, bowel screening statistics |
| Over a quarter (28%, 2022 cohort) | Finnish Cancer Registry |
| 21 wellbeing services counties | Sotkanet area list |
| Russian, Somali, Arabic (Helsinki) | Statistics Finland table 11rm, 2025 |
| 209 colonoscopies; €1,787 per finding | The app's Decide board, using Pohjois-Pohjanmaa's 2025 service price list |
