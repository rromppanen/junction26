# Care Equity Lab

A four-step prototype: **Upload → Prepare → Analyse → Recommend**. Each step has a separate component and an input/output contract so teammates can improve it independently. See [workflow ownership](src/components/workflow/README.md).

## Run

Use Node 24:

```bash
cd web
npm ci
npm run dev
```

Open the printed localhost URL. If port 3000 is occupied, use `npm run dev -- --port 3001`. Stop with Ctrl+C. For a production build, run `npm run build` then `npm start`.

## Walkthrough

1. **Upload:** choose a public aggregate cervical-screening CSV, or use the bundled public demo. Download an example CSV from this screen.
2. **Prepare:** check the column mapping and confirm population/count definitions. Invalid counts or duplicate groups block progression.
3. **Analyse:** select a population dimension, year, cohort and measure. Run the analysis, then select a group for recommendations. Changed settings require a new run.
4. **Recommend:** read the finding, measured pathway interpretation, proposed actions and supporting sources. Download the result as JSON or go back to rerun a comparison.

There is no dashboard, action register or monitoring screen. Refreshing clears the in-memory analysis; download results to retain them. Uploaded files stay in the current browser tab. There is no account or shared storage.

## Supported data

This MVP accepts public aggregate cervical-screening counts, not arbitrary clinical studies or confidential patient records. CSV imports support UTF-8, comma or semicolon delimiters, quoted values, up to 1 MB, 5,000 rows and 30 columns.

Required fields are `year`, `group`, `invited` and `attended`. Optional fields are `dimension`, `cohort`, and paired `referred` / `completed` counts. The preparation screen suggests aliases and lets the user change the mapping; these are deterministic header suggestions, not model-based semantic inference.

Counts must be non-negative integers and satisfy `completed ≤ referred ≤ attended ≤ invited` when supplied. Empty paired counts mean follow-up is unavailable, not zero. Duplicate keys are rejected. A supplied `All groups` row must reconcile with a complete disjoint partition. Missing dimension/cohort fields use the defaults stated on the preparation screen.

The bundled snapshot contains 240 rows across five dimensions and five years, extracted from the [Finnish Cancer Registry cervical-screening report](https://stats.cancerregistry.fi/joukkistilastot/kohtu.html), published 20 May 2026:

- Language, education and birthplace tables pool routine and risk-group screening.
- Age and region tables contain routine age-based screening only.
- Tables are separate marginal views; they cannot be joined into individual records.
- Unknown categories remain unchanged. Language is not nationality; birthplace is not ethnicity.
- Recorded examination completion does not measure individual waiting times. Incomplete reports or ongoing follow-up can resemble missing care.

The generated snapshot and downloadable CSV are owned by `scripts/ingest.py`, not manually edited. The source manifest records the URL, retrieval time, HTML checksum and adapter version. To regenerate deliberately:

```bash
curl -fL https://stats.cancerregistry.fi/joukkistilastot/kohtu.html -o /tmp/kohtu.html
npm run ingest -- /tmp/kohtu.html
npm test
```

Review the publisher's definitions and reuse terms before redistributing refreshed extracts. Original HTML and PDFs are not included in the repository.

## Analysis and evidence limits

The engine compares each group against the remaining disjoint groups in the same dimension/cohort/year, weighted by actual denominators. A review signal means at least five percentage points below the remainder, with at least 30 observations in both denominators. This is descriptive triage, not a clinical standard, significance test or causal estimate.

Source locators and illustrative Wilson binomial intervals are available under result details. Missing or insufficient comparisons do not establish a pathway gap. The app does not adjust for confounding or perform a systematic literature review. Actions come from reviewed guideline summaries in `src/data/evidence.ts`; recommendations require human assessment of applicability. Proposed planning windows are not clinical targets.

Screening participation primarily relates to Goal 2. Full challenge coverage still needs a validated direct Goal 3 measure such as survival, mortality or timely treatment.

## Optional AI interpretation

The recommendation step automatically requests an interpretation for the official demo dataset. Without credentials it returns a clearly labelled source-based template. To enable live drafting, set `GEMINI_API_KEY` in ignored `web/.env.local` and restart. `GEMINI_MODEL` optionally overrides the default `gemini-2.5-flash`. Never commit keys.

Only official public facts and source summaries are sent to the provider. Uploaded data use local templates and are never submitted. The server recomputes official findings, validates output and returns a template on timeout, service failure or invalid output. AI and cached AI drafts are labelled. Numerical findings and proposed actions remain deterministic; source-ID/schema checks do not prove medical correctness or source entailment.

Live provider quality has not been verified with credentials. Integration tests use mocked provider responses. This is a local prototype, not a production multi-user service.

## Verification

```bash
npm test
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
```

Browser tests start a server on port 3100. They cover the public-data flow, CSV mapping, invalid input, stale-result prevention, insufficient follow-up, optional model failure, export and mobile layout. Synthetic boundary-test data are separate from the real demo snapshot. Generated artifacts and browser output are ignored.

If a dev server already owns this checkout, reuse it without stopping it: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e` (use its actual URL).
