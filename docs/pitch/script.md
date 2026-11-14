# Pitch script and Q&A

Every figure is one the app shows. If the app changes, check the number on screen before you say it. Demo people, the robot, the lab and bookings are invented or simulated; say so once, out loud.

## In one breath

One in five Finns with a positive bowel-screening test never gets the colonoscopy that would find the cancer. Läpi follows every home test sample from the person's door to the lab and on to the colonoscopy, and shows the screening nurse every sample that is stuck, so nobody is lost between steps.

**Say the limit before a judge does:** this is a working prototype with invented people. The robot, the lab and the bookings are simulated. We have not measured that it shortens waits; that is what a pilot would show.

## 3:00 live pitch

1. **Problem (30 s).**
   - "In 2023, 3,536 of 16,501 people with a positive bowel-screening test had no colonoscopy in the programme. That is one in five."
   - "These people are already found. Their result says *look closer*, and then the pathway loses them."
   - "In Päijät-Häme the wait from a positive test to colonoscopy is about 3.7 months, twice the national median."
2. **What we built (15 s).** "Not a dashboard for decision-makers. A tool for the two people who close this gap: the person with the test, and the screening nurse."
3. **Demo (1:45).** Open `/demo`: the phone on the left, the nurse board on the right.
   - **Phone (Aino, 62, Lahti):** kit → "I've taken the sample" → book a pickup → the robot is on its way → it reaches the door → the sample goes to the lab.
   - **Board:** Aino's card moves across the columns live, with no refresh.
   - **Result:** record a positive at the lab. Aino's phone offers colonoscopy times, with an interpreter if needed. She books one.
   - **The stuck ones:**
     - Point at the flagged cards: "Positive result, no colonoscopy booked for N days".
     - Then "No sample 14 days after invitation".
     - The nurse sends a reminder or logs a call note, and books the colonoscopy for the person.
   - **Key line:** "Every positive has an owner and a next step until the colonoscopy is booked. A booking is not a done examination: the card stays open until it is."
4. **Why it works and what's next (30 s).**
   - "Screening is already run by HUS and the counties, and the nurse role already exists. Läpi gives that nurse one board instead of letters and spreadsheets."
   - "Next: pilot it with one county's screening team for one quarter. Measure the share of positives without a colonoscopy, and the days from positive to colonoscopy, against the Registry baseline."

> **AI line: only say it if the AI is in the demo.** The current `/demo` flow uses no AI. The brief asks for an AI-powered system. Either wire in the AI piece before the freeze, or answer the AI question honestly (see Q&A). Example once it is wired in: "AI drafts the nurse's message in the person's language and reads their reply for the barrier, such as work, fear or transport. The nurse approves every message."

## Q&A in one line each

- **Goal 3?**
  - Strategy Goal 3.1 and roadmap action 3.1.2 ask counties to define pathway stages, responsibilities and access times. Läpi gives the step from positive test to colonoscopy an owner, a timer and a record.
  - It supports the access-time indicator; it is not that indicator.
- **Is the robot real?** No, it's simulated. It stands for any pickup: a courier, a pharmacy drop-off or a parcel locker. The point is that the sample's journey is tracked, not the vehicle.
- **Why not post, as today?** Post works for most people. The board is for the people it doesn't work for. It shows who hasn't sent a sample, and who has a positive with no booking.
- **Where does "one in five" come from?** Finnish Cancer Registry, colorectal screening statistics, 2023. Some people were examined outside the programme. The app says so.
- **What does the AI do?** Say only what the demo shows. If it isn't wired in: "The workflow is deterministic on purpose. Code owns every status, and AI's place is drafting messages and reading replies, with the nurse approving each one."
- **Did it shorten waits?** We haven't measured that. The pilot measures it against the Registry baseline, and capacity can still limit it.
- **Privacy?** All demo people are invented. A real pilot would run inside the county's systems, with Kanta for verified examinations.
- **Who runs it?** The county's screening team, inside the existing screening programme. HUS runs Uusimaa's.

Backup figure: Etelä-Savo 10.3% against Helsinki 31.5% of positives without a programme colonoscopy (2023), so the gap varies threefold between counties.

The 2:00 video has its own script: [video-script.md](video-script.md).
