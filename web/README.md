# Care Equity Lab

Upload once. The app automatically **standardises and cleans → analyses population differences → retrieves evidence → generates recommendations**. The final screen leads with the most important insights and their next actions. Progress stages are not manual screens.

The stages have separate server modules and typed contracts for team ownership: see [workflow ownership](src/components/workflow/README.md).

## Run

Use Node 24:

```bash
cd web
npm ci
npm run dev
```

Open the printed URL. If port 3000 is occupied, use `npm run dev -- --port 3001`. Stop with Ctrl+C. Production: `npm run build`, then `npm start`.

Click **Try the public Registry dataset**, or select a CSV. Both start the complete pipeline immediately. Only a genuine unresolved column meaning requires input; a clarification resumes the pipeline. Invalid counts stop with an actionable error rather than being silently repaired.

## Gemini and Context.dev

The integrations adapt the Gemini analyst and Context.dev adapter from `feat/gap-radar`, using its existing configuration names:

```text
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-3.5-flash-lite
CONTEXT_DEV_API_KEY=<your key>
```

Set these in ignored `web/.env.local` or the app's process environment, then restart. Never commit keys. Credentials are not stored in Git branches or copied by switching branches. The app's initial configuration line reports whether settings are present, not whether a live call has succeeded.

- **Gemini:** reviews unfamiliar column mappings from headers and bounded examples; later generates an interpretation and action proposals from calculated findings and supplied evidence. Structured output is validated, with one retry for rejected output. The same model setting is used for both stages.
- **Context.dev:** calls `https://api.context.dev/v1/web/search` with Bearer authentication and highlight options, as in Gap Radar. Topic queries are selected from measured gaps. Only HTTPS results from a bounded list of authoritative publishers are retained. Results include source URLs and retrieval times and are cached for up to a day; failures are not cached.
- **Without keys or on provider failure:** recognised schemas still run using deterministic calculations and source-based templates. The result explicitly labels each integration's status. Unresolved mappings still require clarification; the app does not pretend to understand missing semantics.

Both real integration paths are implemented. Tests use mocked providers; the local runtime initially reported neither key configured, so live provider responses were not verified with credentials.

## What gets processed

Use public aggregate cervical-screening counts only, not confidential studies or patient records. Uploading starts server-side processing automatically. Gemini may receive column examples and aggregate findings. Context.dev receives a topic query, never raw uploaded rows or filenames. The app does not write uploads to a database or disk. Provider processing follows the account's provider settings.

The current tab retains the input while the run completes or awaits clarification. Refreshing clears the app's in-memory state. Download results as JSON to keep findings, mappings, cleaning notes, recommendations, source references and provider status.

## Standardisation and cleaning

CSV inputs may use UTF-8, comma or semicolon delimiters, quoted values, up to 1 MB, 5,000 rows and 30 columns. Required concepts are year, population group, invited count and attended count. Optional concepts are dimension, cohort, and paired referred/completed counts.

The preparation stage uses a verified schema for the bundled data, recognised header aliases for clear input, or Gemini's checked semantic mapping when configured. It preserves original source labels. It normalises whitespace, valid grouped whole counts, whole-number decimal representations and explicit missing markers in optional fields. Cleaning actions and assumptions are recorded. Missing outcomes are not imputed and duplicate observations are not silently removed.

Counts must be non-negative whole numbers and satisfy `completed ≤ referred ≤ attended ≤ invited` where supplied. Overall totals must reconcile with disjoint groups. The engine rejects percentages mapped as counts, invalid values, duplicate keys and incomplete paired follow-up values. A missing cohort is explicitly reported as an assumption.

## Automatic analysis

All available population dimensions and measures are compared in the latest period for each dimension/cohort. Cohorts remain separate. Each group is compared with its disjoint remainder using actual denominators. Review signals require a difference of at least five percentage points below that comparator and at least thirty observations in each denominator. These are descriptive triage rules, not clinical standards or statistical significance tests.

Up to three prioritised findings from different dimensions are displayed first; all comparisons and methods remain available in the result details. Missing data and small groups lead to an insufficient-data result. A no-gap dataset produces a monitoring recommendation rather than an invented disparity.

The recorded transition is distinct from its cause. Low recorded examination completion could reflect missing reports, ongoing follow-up or access problems; it is not a waiting-time measure. Neither causal identification nor confounder adjustment is implemented.

## Evidence and recommendations

Reviewed source summaries live in `src/data/evidence.ts`. Context.dev adds clearly labelled live excerpts. Gemini receives both along with calculated findings, and returns proposals linked to finding IDs and known evidence IDs. Every generated action must reference reviewed guideline support, not only a search result. Validators reject unknown citations, unknown findings, unsupported numerical/causal promises and malformed responses.

These checks do not prove source entailment, evidence certainty or local applicability. The app is not a systematic review or autonomous clinical decision tool. A service lead must review recommendations before implementation. Templates remain available when a provider fails.

## Bundled source

The demo contains 240 factual rows across five dimensions and five years from the [Finnish Cancer Registry cervical-screening report](https://stats.cancerregistry.fi/joukkistilastot/kohtu.html), published 20 May 2026:

- Language, education and birthplace tables pool routine and risk-group screening; age and region tables use routine screening only.
- Tables are separate marginal views and cannot be joined into individual or intersectional records.
- Unknown categories remain unchanged. Language is not nationality; birthplace is not ethnicity.
- Follow-up/reporting completeness affects interpretation, especially for recent periods.

The snapshot and downloadable CSV are owned by `scripts/ingest.py`; do not edit them manually. The source manifest records the original URL, retrieval time, HTML checksum and adapter version. To regenerate deliberately:

```bash
curl -fL https://stats.cancerregistry.fi/joukkistilastot/kohtu.html -o /tmp/kohtu.html
npm run ingest -- /tmp/kohtu.html
npm test
```

Review source definitions and reuse terms before redistributing a new extract. Original HTML and PDFs are not included in the repo.

**Challenge limit:** screening participation mainly relates to Goal 2. Direct Goal 3 survival, mortality or treatment-start timeliness are not measured by this dataset.

## Verification

```bash
npm test
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
```

Browser tests use port 3100 by default. If another dev server already owns this checkout, reuse it: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e`. No existing server needs to be stopped. Browser tests mock the streaming API for reproducibility; server tests run the real pipeline with provider responses mocked. An HTTP smoke test also exercises the public demo without keys.

The local API has bounded requests, timeouts and concurrency. It is not a hosted multi-user service; authentication, rate limiting and deployment controls are future delivery work.
