# Automatic workflow and team ownership

The user uploads once. The four stages run on the server, emit real progress, and return insights with evidence-linked recommendations. There are no routine mapping, analysis-selection or continue screens. Only unresolved column meanings interrupt the run.

Assign one teammate per stage:

| Stage | Implementation owner | Input → output | Main improvement work |
| --- | --- | --- | --- |
| Standardise & clean | [`prepare.ts`](../../lib/pipeline/prepare.ts) | `PipelineInput` → `PreparedData` | Semantic mapping, formats, units, provenance, missingness and data-quality checks |
| Find disparities | [`analyse.ts`](../../lib/pipeline/analyse.ts) | `PreparedData` → `Findings` | Estimands, comparability, uncertainty, adjustment, multiplicity and valid pathway localisation |
| Find evidence | [`research.ts`](../../lib/pipeline/research.ts), [`context.ts`](../../lib/context.ts) | `Findings` → sources and retrieval status | Search strategy, source relevance, original passages, evidence appraisal and applicability |
| Recommend | [`recommend.ts`](../../lib/pipeline/recommend.ts) | Findings + sources → checked interpretation and proposals | Evidence entailment, alternative explanations, action specificity, evaluation and abstention |

## Shared boundaries

- [`types.ts`](../../lib/pipeline/types.ts) owns cross-stage contracts. Assign one integration owner for coordinated changes.
- [`run.ts`](../../lib/pipeline/run.ts) orchestrates stages and emits progress. It contains no UI decisions.
- [`/api/pipeline`](../../app/api/pipeline/route.ts) validates bounded requests and streams NDJSON. `GET` returns configuration flags, never secrets.
- [`gemini.ts`](../../lib/gemini.ts) owns structured Gemini requests, timeouts and one validation retry. It adapts the Gap Radar analyst pattern using the same environment variable names and model default.
- [`csv.ts`](../../lib/csv.ts) and [`analysis.ts`](../../lib/analysis.ts) contain shared parsing, numerical validation, calculations and fallback templates. Coordinate edits to these shared files.
- [`page.tsx`](../../app/page.tsx) owns request cancellation, stream consumption and upload/progress/attention/result state. It does not calculate findings or execute an analysis plan in the browser.

## UI components

- [`UploadStep.tsx`](UploadStep.tsx): one upload starts the request; an official demo is available.
- [`PipelineProgress.tsx`](PipelineProgress.tsx): actual stage messages, not simulated percentages or user navigation.
- [`AttentionPanel.tsx`](AttentionPanel.tsx): targeted clarification only when preparation cannot resolve a field safely; resumes the same dataset.
- [`ResultsPanel.tsx`](ResultsPanel.tsx): prioritised insights with linked recommendations and evidence. Cleaning details and the full comparison set are expandable.

## Contracts to preserve

- Uploaded public data are processed on the server. Gemini may receive column examples and aggregate findings; Context.dev receives a topic query, not raw rows or filenames. The app does not write uploads to disk.
- Models never rewrite numerical observations or execute arbitrary code. Safe format cleaning is recorded; absent outcomes are not imputed.
- A finding always retains its cohort, dimension, period, denominator, measured transition and source locator.
- Automatic scanning currently uses each cohort/dimension's latest period. Threshold signals are descriptive, not significance tests or causal findings.
- Live search results are untrusted excerpts, not automatically appraised studies. Generated actions require reviewed guideline support, not only a matching citation ID or search result.
- Missing keys or failed providers are visible in results; never label fallback templates as Gemini output or claim that live research succeeded.
- Invalid data stop the pipeline. Ambiguity requests a specific correction. Cancelled or replaced runs cannot overwrite a new result.

## Verification

From `web/`, run `npm test`, `npm run check`, `npm run test:e2e`, and `npm run build`. If a dev server already owns the checkout, set `PLAYWRIGHT_BASE_URL` to its URL for browser checks. See [the app README](../../../README.md).

Provider tests mock Gemini and Context.dev and exercise the full pipeline, including uploaded-data standardisation, retrieval and generated recommendations. The local app can run without keys, but that is not evidence of live-provider quality. Broader study formats, causal inference, expert evidence grading and direct Goal 3 outcomes remain substantive work for stage owners.
