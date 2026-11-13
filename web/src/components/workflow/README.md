# Workflow ownership

Assign one teammate to each step. Improve the implementation behind its contract without adding unrelated screens. The user follows **Upload → Prepare → Analyse → Recommend**.

| Step | Main file | Input → output | Supporting code |
| --- | --- | --- | --- |
| 1. Upload | [UploadStep.tsx](UploadStep.tsx) | Public CSV file → `InputDataset` with parsed table and source checksum | [CSV parser](../../lib/csv.ts); [source adapter](../../../scripts/ingest.py) |
| 2. Prepare | [PrepareStep.tsx](PrepareStep.tsx) | `InputDataset` + confirmed mapping → `PreparedDataset` | [Mapping and normalisation](../../lib/csv.ts); `validateRows` in [analysis.ts](../../lib/analysis.ts) |
| 3. Analyse | [AnalyseStep.tsx](AnalyseStep.tsx) | `PreparedDataset` + selection → `AnalysisResult` | `analyse`, intervals and triage rules in [analysis.ts](../../lib/analysis.ts) |
| 4. Recommend | [RecommendStep.tsx](RecommendStep.tsx) | `PreparedDataset` + `AnalysisResult` → interpretation, sourced proposals and downloadable report | `recommend` / `fallbackDraft` in [analysis.ts](../../lib/analysis.ts), [evidence library](../../data/evidence.ts), [brief endpoint](../../app/api/brief/route.ts), [draft validator](../../lib/brief.ts) |

## Shared integration boundary

[types.ts](types.ts) owns the cross-step contracts. The [page](../../app/page.tsx) only holds step state and passes outputs forward. Assign one integration owner to these shared files. Coordinate contract changes before editing consumers.

The numerical engine currently contains validation, calculation and recommendation functions. Step owners should change only their relevant functions or coordinate with the integration owner; these shared files are not independent writing surfaces.

- Keep original source meaning and provenance. Do not silently reinterpret columns.
- A new upload or confirmed preparation invalidates downstream results.
- Changing analysis settings requires another run before continuing.
- Interpretations and recommendations refer to the selected calculated finding.
- Errors stay in the responsible step and block invalid progression.
- Steps do not import other step components. Share contracts and supporting functions instead.

## What each owner should make rigorous

**Upload:** supported formats, bounded parsing, faithful missing values and source provenance. Preserve local-only handling of uploaded records. Test malformed input as well as valid unfamiliar headers.

**Prepare:** semantic mappings, units, population and cohort definitions, denominators, duplicate detection, comparability and missingness. Header matching is currently a deterministic suggestion, not reliable semantic inference. Test that ambiguous or invalid input requires correction.

**Analyse:** define the estimand and comparison population; assess power, uncertainty, missingness, dependence, confounding and multiplicity when adding methods. The current five-point rule is descriptive triage. Do not silently promote it to statistical significance or causation. Test positive, negative and insufficient-data cases.

**Recommend:** distinguish the measured transition from a possible cause, verify evidence applicability and source entailment, consider harms and contrary evidence, and abstain when support is missing. Currently actions come from guideline templates; optional AI drafts only the interpretation. Do not describe it as a systematic evidence review or causal intervention estimate.

## Integration checks

From `web/`:

```bash
npm test
npm run check
npm run test:e2e
npm run build
```

Use the [app README](../../../README.md) for run instructions and data limitations. Unit tests cover shared data/method boundaries; browser tests cover all four steps, invalidation, failure recovery and mobile layout. Add meaningful checks for each new capability, and keep at least one reproducible real-data example and an appropriate abstention example.

This separation enables parallel team ownership. It does not mean every stage already meets a research-grade standard. Broader dataset support, causal inference, evidence appraisal and a direct Goal 3 indicator remain substantive work.
