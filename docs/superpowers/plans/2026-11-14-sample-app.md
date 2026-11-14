# Läpi sample app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A demo app where a person takes the bowel-screening home test (FIT), books a simulated robot pickup, and follows the sample to the result and, if positive, a colonoscopy booking. A screening nurse sees every sample on one board, sees stuck samples flagged and acts on them. The phone and the board stay in sync live.

**Architecture:** The core is pure, tested logic in `web/src/lib/sample/`: the event log per sample, the derived stage, the stuck rules and the robot simulation. A small client store keeps the demo state in `localStorage` and syncs tabs with `BroadcastChannel` and the `storage` event, so two tabs, or two iframes on `/demo`, update each other. There is no server state. Pages:
- `/kit` is the phone flow;
- `/staff` is the nurse board;
- `/demo` shows both side by side;
- `/` is the new start page.

The old pages (`/map`, `/county/*`, `/analyse`, `/simulator`, `/findings`) stay reachable but leave the start page.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4 tokens in `web/src/app/globals.css` (Läpi palette: `brand`, `brand-strong`, `brand-soft`, `behind`, `ahead`, `ink`, `muted`, `rule`, `paper`, `surface`), lucide-react icons, Vitest.

**Spec:** Design agreed in chat on Sat 14.11:
- bowel-screening home test;
- citizen and nurse views, linked;
- robot simulated in the app;
- start fresh from the old pages;
- keep the Läpi name and design.

## Global Constraints

- **Environment:**
  - Node 22: prefix commands with `export PATH=/Users/Daniel/.nvm/versions/node/v22.23.4/bin:$PATH &&` and run them in `web/`.
  - No new npm dependencies.
  - Worktree: `/Users/Daniel/code/junction26-lapi`, branch `feat/sample-app`.
  - Don't run `npm run build`. A dev server may be running on :3001 from this worktree.
- **Demo data:** all people, dates, results and the robot are invented. Every page says so in one short line: "Demo: invented people; the robot, lab and bookings are simulated."
- **Medical content:**
  - Real facts only come from the HUS colorectal screening page (`https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february`). They are:
    - no preparation or fasting is needed;
    - the stool sample is taken at home;
    - results come within about a month;
    - about 4 in 100 samples contain blood;
    - the usual follow-up is a colonoscopy;
    - screening covers ages 56–74, every two years.
  - The kit instructions are generic ("follow the leaflet in your kit"). They don't invent device-specific steps.
- **Languages:** the phone UI comes in Finnish, Swedish and English (fixed strings). No machine-written medical text in other languages.
- **Real figures** come only from `web/src/lib/pathwayData.ts` (Finnish Cancer Registry), with the source link (`COLORECTAL_SOURCE.url`).
- **Accessibility:** buttons are at least 44px tall; `aria-live` for status changes; works at 375px width with no sideways scroll; respects `prefers-reduced-motion`.
- **Commits:** commit only your own files (`git add <paths>`, never `-A`). End messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push. Never dispatch subagents.

## Review Focus

- **Phone and board out of sync:** they must converge within a second. A page reload keeps the state.
- **Robot timing:** a reload mid-route resumes from the stored booking time, not from zero.
- **Reset demo:** it restores the seed in every open tab.
- **Positive result:** must offer colonoscopy times, and the board must flag a positive with no booking.
- **Width:** 375px, with no horizontal scroll on `/kit`.

---

### Task 1: Sample domain, store and robot simulation

**Files:**
- Create `web/src/lib/sample/model.ts`.
- Create `web/src/lib/sample/model.test.ts`.
- Create `web/src/lib/sample/seed.ts`.
- Create `web/src/lib/sample/store.ts` ("use client" hooks).

**Interfaces (Produces):**

The types:

- `type Lang = "fi" | "sv" | "en"`
- `type EventType = "invited" | "kitOpened" | "sampleTaken" | "pickupBooked" | "pickedUp" | "atLab" | "resultNegative" | "resultPositive" | "reminderSent" | "nurseCalled" | "colonoscopyBooked" | "colonoscopyDone"`
- `type SampleEvent = { type: EventType; at: number /* epoch ms */; note?: string; slot?: string /* for pickupBooked and colonoscopyBooked */ }`
- `type Person = { id: string; name: string; age: number; municipality: string; lang: Lang; interpreter?: string }`
- `type Sample = { id: string; person: Person; events: SampleEvent[] }`
- `type Stage = "invited" | "sampleTaken" | "pickupBooked" | "robotEnRoute" | "robotAtDoor" | "pickedUp" | "atLab" | "negative" | "positive" | "colonoscopyBooked" | "done"`

The functions:

- `stageOf(s: Sample, now: number): Stage`
  - It comes from the latest milestone event.
  - After `pickupBooked`, the stage is time-based:
    - `robotEnRoute` until `bookedAt + ROBOT_TRAVEL_MS`;
    - then `robotAtDoor` until a `pickedUp` event.
  - `atLab` follows `pickedUp` at once, as an event added by the store.
- `const ROBOT_TRAVEL_MS = 20_000`.
- `robotProgress(s: Sample, now: number): number | null`
  - It returns a value from 0 to 1 while en route, and 1 at the door.
  - It returns null when no pickup is booked or after pickup.
- `type Flag = { kind: "noSample" | "positiveNoBooking" | "robotWaiting"; label: string; days?: number }`
- `flagsOf(s: Sample, now: number): Flag[]`
  - `noSample`: invited ≥ 14 days ago and no `sampleTaken`.
  - `positiveNoBooking`: `resultPositive` ≥ 7 days ago and no `colonoscopyBooked`.
  - `robotWaiting`: at the door for more than 60 s (demo scale).
  - A day is 86,400,000 ms.
- `const STAGES_FOR_BOARD: { stage: Stage | Stage[]; label: string }[]` is the ordered board columns:
  1. Invited
  2. Sample taken
  3. Pickup
  4. At lab
  5. Result
  6. Colonoscopy
  7. Done
- `addEvent(samples: Sample[], id: string, e: SampleEvent): Sample[]` is pure and immutable. It ignores unknown ids.
- `seedSamples(now: number): Sample[]` is in seed.ts.
  - It returns about 10 invented people across stages. Dates are relative to `now`.
  - At least one is `noSample` (20 days), one is `positiveNoBooking` (9 days), and one is done.
  - The person used on the phone has id `"me"` and starts at `invited` today, lang "fi".
- store.ts:
  - `useSamples(): { samples: Sample[]; now: number; add(id: string, e: Omit<SampleEvent, "at">): void; reset(): void }`
  - It uses `useSyncExternalStore` over `localStorage["lapi.demo.v1"]`.
  - It broadcasts on `BroadcastChannel("lapi-demo")` and also listens to `storage` events.
  - `now` ticks every 1 s.
  - With no stored state, it seeds.
  - When `add` records `pickedUp`, it also records `atLab` 1 ms later.
  - All storage access sits in try/catch. With storage blocked, it runs in memory.

- [ ] **Step 1:** Write failing tests in model.test.ts.
  - **Stages:**
    - stage progression for each milestone;
    - the robot is en route at booked + 5 s;
    - at the door at booked + 21 s;
    - `robotProgress` ≈ 0.25 at 5 s;
    - null after `pickedUp`.
  - **Flags:**
    - `noSample` at 14 days but not at 13;
    - `positiveNoBooking` at 7 days and cleared by `colonoscopyBooked`;
    - `robotWaiting` after 61 s at the door.
  - **Other:**
    - `addEvent` doesn't mutate its input;
    - the seed contains `"me"` at `invited` and at least one of each flag kind except `robotWaiting`.
- [ ] **Step 2:** Run `npx vitest run src/lib/sample`. Expected: FAIL.
- [ ] **Step 3:** Implement model.ts, seed.ts and store.ts.
- [ ] **Step 4:** Tests pass, and `npx tsc --noEmit -p .` and `npx eslint src/lib/sample` are clean.
- [ ] **Step 5:** Commit `feat: sample domain, demo store and robot simulation`.

### Task 2: Phone flow `/kit`

**Files:**
- Create `web/src/app/kit/page.tsx`.
- Create `web/src/components/kit/KitApp.tsx` ("use client").
- Create `web/src/components/kit/RobotMap.tsx`.
- Create `web/src/components/kit/strings.ts`, holding the fi/sv/en strings as one typed object per language.

**Interfaces (Consumes):** Task 1's `useSamples`, `stageOf`, `robotProgress` and `ROBOT_TRAVEL_MS`. It acts on sample `"me"`.

- [ ] **Step 1:** Build the phone screen, about 390px wide and centred, with a phone-like frame on desktop and full width on phones. One screen per stage, with a progress bar of 5 steps at the top: Kit, Sample, Pickup, Lab, Result.
  - **Invited:**
    - a greeting by first name;
    - a language switch (FI, SV, EN), saved in localStorage key `lapi.kit.lang`;
    - "Your bowel screening kit" and why it matters, from the HUS facts: free, no preparation, results within about a month;
    - an "I'm ready" button records `kitOpened`.
  - **Take sample:**
    - three generic steps: follow the leaflet, write the date on the tube, close the tube in its bag;
    - "I've taken the sample" records `sampleTaken`.
  - **Book pickup:** three time windows today. Choosing one records `pickupBooked` with `slot`.
  - **En route:**
    - `RobotMap`, an SVG with a fixed route from "Lab" to "Home" and a robot dot at `robotProgress`;
    - an arrival countdown;
    - status text in `aria-live`.
  - **At door:**
    - "The robot is at your door. Code 4 8 1 2 opens its box";
    - "I put the sample in" records `pickedUp`.
  - **At lab:** "Your sample is at the lab. Results within about a month (demo: the nurse records the result)."
  - **Negative:** "No blood found. Next invitation in two years."
  - **Positive:**
    - calm wording: "Blood was found. This is common, about 4 in 100 samples, and usually not cancer, but it needs a colonoscopy";
    - three colonoscopy times plus "I need an interpreter" (a checkbox recorded in the note);
    - choosing a time records `colonoscopyBooked` with `slot`.
  - **Colonoscopy booked:** the time, a reminder note, and "Läpi will remind you the day before".
- [ ] **Step 2:** Verify that `/kit` returns 200, and that tsc and eslint are clean. Check at 375px wide. Use curl, and a quick headless check if one is available. The controller does the browser walkthrough.
- [ ] **Step 3:** Commit `feat: phone flow for the home sample, robot pickup and result`.

### Task 3: Nurse board `/staff`, side-by-side `/demo`, new start page

**Files:**
- Create `web/src/app/staff/page.tsx`.
- Create `web/src/components/staff/SampleBoard.tsx` ("use client").
- Create `web/src/app/demo/page.tsx`.
- Modify `web/src/app/page.tsx` (replace the FollowUpBoard start page).
- Create `web/src/components/ImpactStrip.tsx` (server component).

**Interfaces (Consumes):** Task 1, all of it. Also `loadPathway` and `COLORECTAL_SOURCE` from `@/lib/pathwayData`.

- [ ] **Step 1:** `/staff`:
  - a header with Wordmark and "Screening nurse";
  - counts: in progress, flagged, positives awaiting colonoscopy;
  - a column per `STAGES_FOR_BOARD` (stacked list on phones), with a card per sample showing name, age, municipality, language and days in stage;
  - flagged cards get a `behind` border and the flag label;
  - selecting a card opens a side panel with the event timeline (time and label) and actions that record events:
    - "Send reminder" (`reminderSent`);
    - "Call" (`nurseCalled`, with a note);
    - "Record lab result: no blood / blood found" (only at `atLab`);
    - "Book colonoscopy" (only at `positive`);
    - "Mark colonoscopy done";
  - a "Reset demo" button.
  - The `"me"` card is marked "Live (phone)".
- [ ] **Step 2:** `/demo`:
  - two iframes, `/kit` in a 390×800 frame and `/staff` beside it, with flex wrap on narrow screens;
  - one line above: "Act on the phone; the board updates live."
- [ ] **Step 3:** `ImpactStrip`:
  - national figures for the latest settled year: invited people who returned the test (participation %), and positives with no programme colonoscopy (count, total and %);
  - computed from `loadPathway` of any mainland county via `.pathway.national` or the national fields that exist. Read `web/src/lib/pathway.ts` for the exact field names;
  - a source link.
- [ ] **Step 4:** `/`:
  - Wordmark;
  - h1 "Every bowel screening sample, from your home to the lab and on to care";
  - one paragraph;
  - three big links: Open the demo (`/demo`), Phone app (`/kit`), Nurse board (`/staff`);
  - `ImpactStrip`;
  - a small "County data explorer" link to `/map`;
  - the demo disclaimer line.
- [ ] **Step 5:** Verify that `/`, `/staff` and `/demo` return 200 and that tsc, eslint and vitest are clean.
- [ ] **Step 6:** Commit `feat: nurse board, side-by-side demo and new start page`.

---

## UI round (agreed Sat 14.11 evening)

Tasks 4 and 5 touch disjoint files and may run in parallel. When committing, if git reports `index.lock`, wait two seconds and retry; never delete the lock file.

### Task 4: Demo stage and phone polish

**Files:**
- Modify `web/src/app/demo/page.tsx`.
- Modify `web/src/components/kit/KitApp.tsx`, `RobotMap.tsx` and `strings.ts`.
- Create `web/src/components/kit/Illustrations.tsx`.

**Interfaces:** It consumes Task 1's store and model unchanged. Don't edit `web/src/lib/sample/*` or `web/src/components/staff/*`.

- [ ] **Step 1: `/demo` is a stage.**
  - **One header:** the Wordmark and "Act on the phone; the board updates live." appear once. The disclaimer appears once, under the stage.
  - **The page passes `?embed=1`** to both iframes (`/kit?embed=1`, `/staff?embed=1`).
    - `KitApp` reads it with `useSearchParams` (wrap the kit page in `<Suspense>`). In embed mode it hides its footer disclaimer, but keeps the restart button.
    - The board's embed handling belongs to Task 5. Task 4 only passes the parameter.
  - **The phone is drawn as a device:**
    - `rounded-[2.75rem]`, a 10px dark frame (`bg-ink`) and a small notch bar;
    - a soft shadow (`shadow-[0_24px_60px_-20px_rgba(18,39,46,0.35)]`);
    - the iframe sits inside at 375×760.
  - **The stage background** is `bg-brand-soft` with `rounded-3xl` and padding.
  - **Captions** under each side, small and muted: "The person (phone)" and "The screening nurse".
  - **Wrapping:** below 1100px the board wraps under the phone.
- [ ] **Step 2: Phone polish.**
  - **Illustrations.tsx:** inline SVG line drawings with `stroke=currentColor` and a `brand` accent, about 72px tall, `aria-hidden`:
    - one per sample step: the leaflet, a tube with a date label, a tube in a bag;
    - a small friendly robot (rounded box on wheels with a lid);
    - a check mark.
  - **Take-sample screen:** each step is a card with its picture.
  - **RobotMap** uses the robot drawing as the moving marker, in place of the dot.
  - **Picked-up moment:** a large check that draws in (`stroke-dashoffset` animation, skipped under `prefers-reduced-motion`), then the at-lab text.
  - **Progress bar:** 6px tall bars, 12px labels, the current step in `font-semibold text-brand`, and done steps showing a small check.
  - **Countdown:** `text-4xl tabular-nums`.
  - **Result headings:** `text-2xl`.
- [ ] **Step 3:** Run tsc and eslint. `/demo` and `/kit` return 200. The 375px kit has no sideways scroll.
- [ ] **Step 4:** Commit `feat: demo stage with a phone frame, illustrated kit steps and robot marker`.

### Task 5: Board overview bar, filtered list, drawer

**Files:**
- Modify `web/src/components/staff/SampleBoard.tsx` (split it into files under `web/src/components/staff/` if it grows past about 350 lines).
- Modify `web/src/app/staff/page.tsx`.

**Interfaces:** It consumes Task 1's store and model (`STAGES_FOR_BOARD`, `stageOf`, `flagsOf`) unchanged. Don't edit `web/src/lib/sample/*`, `web/src/components/kit/*` or `web/src/app/demo/*`.

- [ ] **Step 1: Overview bar.** It replaces the 7 columns: a horizontal row of the 7 board steps as connected segments (chevrons or line-joined pills).
  - Each segment shows its label and count. A segment holding flagged samples shows a small amber dot and the flagged count.
  - Clicking a segment filters the list. An "All" segment comes first and is the default.
  - The bar wraps to two rows on narrow widths. It never scrolls the page.
- [ ] **Step 2: One list below.** A list of sample rows replaces the columns.
  - **Sorting:** the live "me" row first, then flagged rows, then by days in stage, longest first.
  - **Row contents:** name, age, municipality, language, interpreter, step label, time in step, flag chip, and a mini timeline of 7 dots for the board steps (filled up to the current step, an amber ring on a flagged step).
  - **Selecting a row** opens a drawer from the right on desktop (a full-width sheet on phones). The drawer holds the history and the actions. It has a close button, closes on Esc, and moves focus into the drawer.
  - **Without a selection** there is no side panel, and the list uses the full width.
- [ ] **Step 3: Compact live strip.**
  - Actions sit in one wrapping row of small buttons (`min-h-11`, auto width).
  - "Call" opens a small inline note field with Save/Cancel. Only Save records `nurseCalled` with the note.
  - The strip shows the mini timeline too.
- [ ] **Step 4: Embed mode.** `/staff?embed=1` (read via `useSearchParams` inside `<Suspense>`) hides the page header's demo line and makes the tiles more compact. The Reset button stays.
- [ ] **Step 5:**
  - Run tsc and eslint.
  - `/staff` and `/staff?embed=1` return 200.
  - There is no page-level sideways scroll at 375px.
- [ ] **Step 6:** Commit `feat: board overview bar, single sorted list with drawer, compact live strip`.

## Hackathon features (agreed Sat 14.11 evening)

Tasks 6 and 7 touch disjoint files and may run in parallel with each other and with Task 5. If git reports `index.lock`, wait two seconds and retry.

### Task 6: Demo autopilot

**Files:**
- Create `web/src/components/demo/Autopilot.tsx` ("use client").
- Modify `web/src/app/demo/page.tsx` (mount it in the header).

**Interfaces:** It consumes `useSamples()` (`add`, `reset`, `samples`, `now`) and `stageOf` from Task 1. The phone and board iframes on `/demo` follow automatically through the shared store.

- [ ] **Step 1: The "Play the story" button.** It sits in the `/demo` header. The button and the caption both live in `/demo`; never inside the iframes.
  - **The script** runs on sample `"me"`:
    1. Reset the demo.
    2. Wait 2 s, then `kitOpened`.
    3. Wait 3 s, then `sampleTaken`.
    4. Wait 3 s, then `pickupBooked` with slot "Now (demo)".
    5. Wait for `stageOf` to reach `robotAtDoor` (about 20 s), plus 2 s, then `pickedUp`.
    6. Wait 4 s, then `resultPositive`, recorded with the note "Lab result (demo)".
    7. Wait 4 s, then `colonoscopyBooked`, with the first weekday slot 3 days out (same format as the kit, e.g. "Tue 17 Nov 9:00") and the note "Interpreter needed".
    8. Wait 3 s, then stop.
  - **Step captions:** each step shows a one-line caption beside the button (e.g. "Aino takes the sample at home") in `aria-live="polite"`.
  - **Controls:**
    - while it runs, the button becomes "Stop";
    - Stop cancels the remaining timers, and unmounting cancels them too;
    - after the last step the button reads "Play again".
- [ ] **Step 2: Keyboard shortcut.** On `/demo` only, the space bar starts the story when no input is focused (for the video).
- [ ] **Step 3:** Run tsc and eslint. `/demo` returns 200.
- [ ] **Step 4:** Commit `feat: demo autopilot that plays the whole story`.

### Task 7: Ask in your own language (Gemini)

**Files:**
- Create `web/src/lib/kitAsk.ts`.
- Create `web/src/lib/kitAsk.test.ts`.
- Create `web/src/app/api/kit/ask/route.ts`.
- Create `web/src/components/kit/AskBox.tsx`.
- Modify `web/src/components/kit/KitApp.tsx` (mount AskBox) and `strings.ts`.

**Interfaces:**
- `KIT_FACTS: { id: string; en: string }[]` holds the HUS facts from the plan's Global Constraints, plus:
  - "the sample tube is returned via the robot in this demo";
  - "results come by post and in the app".
- `type AskResult = { status: "ai" | "fallback"; answer: string; factIds: string[] }`.
- `askKit(question: string, generate?: (prompt: string) => Promise<unknown>): Promise<AskResult>`:
  - Gemini (same model, `withTimeout` pattern and 12 s timeout as `web/src/lib/reachDrafts.ts`) answers in the language of the question, using only `KIT_FACTS`.
  - It uses a JSON schema of `{ answer: string, factIds: string[], answerable: boolean }`.
- **Validation:**
  - `answer` is at most 600 characters;
  - every `factId` must be known and at least one must be given;
  - the answer contains no digits that aren't in the cited facts;
  - otherwise the result is a fallback.
- **Fallback:** when there's no key, on error, or when the question isn't answerable, return a fixed message in English, Finnish and Swedish: "I can only answer questions about this screening kit. For other questions, call the screening unit." and `factIds: []`.
- **`POST /api/kit/ask`:**
  - body `{ question: string }`, at most 300 characters;
  - returns 400 for an empty or too-long question, and 200 with `AskResult` otherwise.

- [ ] **Step 1:** Write failing tests with an injected generator:
  - valid answer gives "ai";
  - an unknown factId gives "fallback";
  - an invented number ("take 3 samples") gives "fallback";
  - `answerable: false` gives "fallback";
  - the generator throws gives "fallback";
  - no generator and no key gives "fallback".
- [ ] **Step 2:** Implement `kitAsk.ts` and the route.
- [ ] **Step 3: AskBox on the kit.**
  - It is collapsible: "Ask a question in your own language" (fi/sv/en strings).
  - It has a text field (placeholder in the UI language, e.g. "Esim. Saako näytteen ottaa kuukautisten aikana?" for Finnish, and the same kind of example in Swedish and English) and a Send button.
  - The answer shows with a badge, "Answered by AI from the screening facts" or "Standard answer". Below it: "For anything else, call the screening unit."
  - It appears on the invited and take-sample screens only.
  - It uses `dir="auto"` so Arabic and other right-to-left text displays correctly.
- [ ] **Step 4:** tsc, eslint and vitest are clean. Curl `/api/kit/ask` with a Finnish question and an Arabic question; both return 200. Report the answers.
- [ ] **Step 5:** Commit `feat: ask about the kit in your own language, answered only from the screening facts`.
