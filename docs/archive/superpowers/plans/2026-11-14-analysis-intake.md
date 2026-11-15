# Analysis intake (steps 1–2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guided intake at `/analyse`: step 1 the user picks public datasets and/or uploads their own aggregate CSV; step 2 Gemini asks at most five clarifying questions (unclear columns, audience, level, county), turns the answers into a column mapping that code validates and the user confirms, ending in an analysis setup summary.

**Architecture:** Pure, tested intake modules in `web/src/lib/intake/` (CSV parsing, field mapping, privacy check, setup type). Two route handlers call Gemini with a fixed JSON schema and fall back to deterministic name matching. Client components hold the wizard state; nothing is stored server-side. The AI asks and maps; code validates every mapping and computes nothing new.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, `@google/genai` (existing pattern in `web/src/lib/reachDrafts.ts`), Vitest.

**Spec:** The agreed design in chat (Sat 14.11): the teammate's workflow vision, steps 1–2, narrowed to column mapping + audience + level + county; "the AI asks, routes and writes; the code calculates". Context: `docs/idea.md` (NULLPATH funnel), `docs/challenge.md`.

## Global Constraints

- Node 22; prefix commands with `export PATH=/Users/Daniel/.nvm/versions/node/v22.23.4/bin:$PATH &&`; run in `web/`.
- No new npm dependencies.
- Uploads: aggregate data only, CSV ≤ 1 MB, ≤ 30 columns, ≤ 5,000 rows, parsed in the browser; the server receives only headers and at most 5 sample rows.
- Refuse files whose headers look like personal data (henkilötunnus/hetu/ssn/personal id, name/nimi, birth date/syntymäaika, address/osoite, phone/puhelin, email).
- Gemini never invents data or numbers; it only proposes questions and a mapping onto the fixed field list. Every mapping is validated by code and confirmed by the user.
- Without `GEMINI_API_KEY` or on any Gemini error/timeout the flow still works via name matching and manual dropdowns.
- Commit only your own files (never `git add -A`); commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push. Don't run `npm run build` while the dev server on :3000 runs.

## Review Focus

- A CSV with a semicolon delimiter, BOM, quoted commas or Finnish headers (vuosi, kutsutut, osallistuneet) must parse and map.
- A file with a personal-data header is refused before anything is sent to the server.
- Gemini down or returning junk: questions fall back to fixed questions and dropdowns; nothing crashes.
- Answers in free natural language (Finnish or English) that don't match an option must still be handled (Gemini maps them; fallback keeps the dropdown).
- Public-data-only path (no upload) must skip column questions and still ask audience, level and county.

---

### Task 1: Intake core (CSV, fields, mapping, privacy, setup type)

**Files:**
- Create: `web/src/lib/intake/csv.ts`, `web/src/lib/intake/fields.ts`, `web/src/lib/intake/privacy.ts`, `web/src/lib/intake/setup.ts`, `web/src/lib/intake/intake.test.ts`

**Interfaces:**
- Produces:
  - `parseCSV(text: string): Table` with `type Table = { headers: string[]; rows: string[][] }` (port from `origin/feat/care-equity-mvp:web/src/lib/csv.ts`: BOM, `;`/`,` delimiter, quotes, limits 1 MB / 30 cols / 5,000 rows, unique non-empty headers).
  - `type Field = "year" | "region" | "group" | "programme" | "invited" | "attended" | "positive" | "examined" | "waitDays" | "ignore"`; `FIELDS` with `{ id, labelEn, description, required: boolean }` (required: year, invited, attended).
  - `type Mapping = Record<string, Field>` (source header → field).
  - `suggestMapping(headers: string[]): Mapping` using English + Finnish aliases (year: year, vuosi; region: region, alue, hyvinvointialue, county, kunta; group: group, ryhmä, kieli, language, sukupuoli, gender; programme: programme, program, ohjelma, seulonta; invited: invited, kutsutut, kutsuttu; attended: attended, screened, osallistuneet, osallistunut; positive: positive, positiiviset, referred; examined: examined, colonoscopy, tutkitut, completed; waitDays: wait, viive, odotus, days, vrk); unknown → "ignore".
  - `validateMapping(table: Table, m: Mapping): string[]` errors: each required field mapped exactly once; no field mapped twice except ignore; counts (invited, attended, positive, examined) are whole non-negative numbers in all rows; attended ≤ invited, examined ≤ positive ≤ attended when present; year is 2000–2100.
  - `personalDataHeaders(headers: string[]): string[]` (privacy.ts) — headers matching the Global Constraints list (case-insensitive, Finnish and English).
  - `type Audience = "county-board" | "screening-unit" | "national"`; `type Level = "municipality" | "county" | "national"`; `type PublicDataset = "sotkanet-screening" | "registry-pathway" | "languages" | "mortality"`; `type AnalysisSetup = { datasets: PublicDataset[]; upload: { fileName: string; headers: string[]; rowCount: number; mapping: Mapping } | null; audience: Audience; level: Level; countyId: number | null }` and `PUBLIC_DATASETS: { id: PublicDataset; nameEn: string; source: string; description: string }[]` (setup.ts).
- [ ] **Step 1:** Write failing tests: semicolon + BOM + quoted comma parse; limits throw; Finnish headers `vuosi;kutsutut;osallistuneet` suggest year/invited/attended; unknown header → ignore; validateMapping catches missing required, duplicate field, non-integer count, attended > invited; personalDataHeaders flags `henkilötunnus`, `Name`, `syntymäaika` and not `kunta`.
- [ ] **Step 2:** Run `npx vitest run src/lib/intake` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests pass; `npx tsc --noEmit -p .` clean.
- [ ] **Step 5:** Commit `feat: intake core for uploaded aggregate CSVs`.

### Task 2: Gemini question and mapping endpoints

**Files:**
- Create: `web/src/lib/intake/clarify.ts`, `web/src/lib/intake/clarify.test.ts`, `web/src/app/api/intake/questions/route.ts`, `web/src/app/api/intake/mapping/route.ts`

**Interfaces:**
- Consumes: Task 1 types and `suggestMapping`, `validateMapping`, `personalDataHeaders`, `FIELDS`.
- Produces:
  - `type Question = { id: string; kind: "column" | "audience" | "level" | "county"; column?: string; text: string; options: { value: string; label: string }[] }`
  - `type QuestionInput = { datasets: PublicDataset[]; headers: string[] | null; sample: string[][] | null }` (sample ≤ 5 rows, server truncates)
  - `getQuestions(input, generate?): Promise<{ status: "ai" | "fallback"; questions: Question[]; suggested: Mapping | null }>` — max 5 questions total; always includes audience, level and county questions (fixed options; county options = the 23 counties from the dataset, kind "county"); column questions only for headers where `suggestMapping` gave "ignore" or that Gemini marks ambiguous, with options = FIELDS. Gemini gets headers + sample + FIELDS and returns column questions in plain English via a JSON schema; invalid/missing → fallback (one column question per unmapped header, fixed wording).
  - `type Answer = { questionId: string; option?: string; text?: string }`
  - `answersToSetup(input, questions, answers, generate?): Promise<{ status: "ai" | "fallback"; mapping: Mapping | null; audience: Audience; level: Level; countyId: number | null; notes: string[] }>` — picked options are applied directly; free-text answers are sent to Gemini to map onto the allowed values only (schema enums); anything unresolved stays as the suggested mapping and is listed in `notes`. Result mapping is passed through `validateMapping` only by the UI (errors returned as notes too).
  - Route handlers: `POST /api/intake/questions` (body QuestionInput) and `POST /api/intake/mapping` (body `{ input, questions, answers }`); both reject bodies with personal-data headers (400) and over-size samples.
- [ ] **Step 1:** Failing tests with an injected generator (no real API): fallback without key returns audience/level/county + one question per unmapped header; public-only input has no column questions; Gemini junk → fallback; free-text answer "kutsutut tarkoittaa kutsuttuja" mapped via generator to invited; option answers applied without the generator; personal-data header rejected.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (Gemini pattern, model and timeout as in `src/lib/reachDrafts.ts`; 15 s timeout). **Step 4:** Tests + tsc pass; `curl -X POST localhost:3000/api/intake/questions` with a small body returns 200 JSON.
- [ ] **Step 5:** Commit `feat: AI clarifying questions and answer mapping for intake`.

### Task 3: `/analyse` step 1 UI (choose data)

**Files:**
- Create: `web/src/app/analyse/page.tsx`, `web/src/components/intake/IntakeWizard.tsx` ("use client"), `web/src/components/intake/StepData.tsx`
- Modify: the app header (`web/src/components/ui.tsx` AppHeader usage on `/` and county page) to add a link "Analyse your data".

**Interfaces:**
- Consumes: Task 1 (`parseCSV`, `personalDataHeaders`, `suggestMapping`, `PUBLIC_DATASETS`).
- Produces: `IntakeWizard` owning state `{ step: 1 | 2 | 3; datasets; table; fileName; ... }`; `StepData` props `{ datasets, onDatasets, onFile(table, fileName), error }`.
- [ ] **Step 1:** Page renders step 1: checkboxes for the four public datasets (name, source, one-line description; Sotkanet + Registry pathway ticked by default), a file input (CSV only) parsed client-side with `parseCSV`, a refusal message listing personal-data headers, a preview (headers + first 5 rows, row count), and "Continue" (enabled when ≥ 1 dataset or a valid upload). Follow the app's existing styling (`AppHeader`, `IconHeading`, Tailwind tokens).
- [ ] **Step 2:** Verify `/analyse` returns 200 and the dev server shows no errors; tsc + eslint clean.
- [ ] **Step 3:** Commit `feat: analyse page step 1, choose public data or upload`.

### Task 4: `/analyse` step 2 UI (questions, confirm mapping, setup summary)

**Files:**
- Create: `web/src/components/intake/StepQuestions.tsx`, `web/src/components/intake/StepConfirm.tsx`
- Modify: `web/src/components/intake/IntakeWizard.tsx`

**Interfaces:**
- Consumes: Task 2 endpoints and types, Task 1 `validateMapping`, `FIELDS`.
- [ ] **Step 1:** Step 2 calls `/api/intake/questions` with headers + ≤ 5 sample rows, shows each question with option buttons and a free-text box (placeholder "or answer in your own words"), a badge "Asked by Gemini" or "Standard questions"; submit → `/api/intake/mapping`.
- [ ] **Step 2:** Confirm step: a table source column → field (dropdown editable), `validateMapping` errors shown inline, audience/level/county shown and editable, notes from the endpoint listed; "Confirm setup" enabled only with no errors.
- [ ] **Step 3:** Summary: the `AnalysisSetup` in plain English (datasets with sources, uploaded file and mapped fields, audience, level, county) and a link "Continue to {county}'s pathway" → `/county/{id}` (or `/` for national). Store the setup in `sessionStorage` (try/catch) under `gapRadar.analysisSetup` for later steps.
- [ ] **Step 4:** Browser check with a small sample CSV (Finnish headers) through all steps; tsc + eslint + tests clean.
- [ ] **Step 5:** Commit `feat: analyse page step 2, clarifying questions and confirmed setup`.
