# Cancer equity analyst: prototype design

Status: proposed for team review, 13 November 2026. This document specifies a new prototype; it does not approve a clinical intervention or describe an implemented app. The branch starts from `origin/main` at `c444559`, independently of the earlier Gap Radar implementation.

## Decision and feasibility

Build a constrained analyst that turns one verified public cancer dataset into a reproducible comparison and a sourced action brief for a Finnish wellbeing services county. This is feasible for a hackathon. An agent that understands any cancer database, identifies causes of inequality, and selects effective interventions without expert review is a longer-term research and integration problem.

The prototype answers: **Which observed outcome differences deserve investigation, what can we conclude from the data, and what should a county do next?** Its primary user is a county cancer-care lead. Success is a decision-maker understanding the finding, its limitations, and a practical next step within two minutes.

Separate three claims throughout the product:

1. **Observed difference:** a reproducible comparison of comparable aggregate outcomes.
2. **Possible explanation:** a hypothesis that needs additional pathway evidence.
3. **Proposed action:** a source-supported service improvement or investigation, with an owner and a measurement plan.

An outcome difference is a signal of possible inequity, not proof of unfair access, poor treatment, or a causal mechanism. Aggregate data cannot establish an individual patient's experience.

## Challenge contract

The supplied AstraZeneca brief is the authority for the competition requirements. The [existing challenge notes](../challenge.md) remain background; verify their factual claims against the primary documents listed below.

| Requirement | Prototype response | Evidence required before claiming completion |
| --- | --- | --- |
| Identify a gap | Compare one cancer's age-standardised outcomes across regions | Frozen official extract, reproducible calculation, population and uncertainty visible |
| Locate the pathway gap | Distinguish measured outcomes from unmeasured detection, referral, diagnosis, and treatment stages | A measured stage indicator or corroborated mentor evidence; otherwise explicitly unresolved |
| Recommend what to do | Produce a bounded improvement/investigation plan tied to reviewed evidence | Source passage supporting the action, named owner, deliverable, and follow-up metric |
| Cover Goal 3 | Display lung-cancer survival and mortality, with exact strategy mapping | Strategy page 5 and source metric definitions |
| Working demo | Select a region, inspect a finding, open evidence, generate an action brief | End-to-end demonstration including a failure case |
| Public aggregate data only | Use a versioned official public extract | No patient records, personal identifiers, or private database credentials in the pipeline |

**Challenge-fit risk:** outcome-only data do not locate the responsible pathway stage. This first pipeline can be useful and demonstrable while still only partially satisfying that requirement. Before feature freeze, obtain relevant public process data or a documented mentor statement that supports a specific pathway hypothesis. Mentor context cannot be relabelled as a measured local delay. If neither is available, disclose the incomplete coverage rather than claim a full solution.

## First database and scope

Use the **Finnish Cancer Registry public cancer statistics** as the sole quantitative source. Start with lung cancer, one published multi-year period, county-level geography, sex-specific strata, and the supplied national comparator. Retain incidence, mortality, and relative survival as distinct measures; never combine them into an opaque equity score.

The registry provides downloadable statistics [S1]. Its 2024 report contains regional lung-cancer outcome tables with intervals, and reports regional mortality differences but no statistically significant county survival differences [S2, section 13.4 and tables 15.12–15.13]. This provides both a potential positive finding and a valuable negative control. Do not select a county merely because it has the lowest survival estimate.

Preferred ingestion is a manually selected official CSV export plus its metadata. The report's published regional tables are the bounded fallback from the same registry if the export cannot be obtained reliably. No stable API, exact export columns, redistribution licence, or completed ingestion has been verified in this design. Resolve these in the first implementation checkpoint. Record the actual observation window; a report year is not necessarily a survival follow-up window.

Use a committed, reproducible snapshot only after confirming reuse terms. Otherwise provide a local download/import procedure and retain permitted provenance metadata. Store no source PDFs in Git by default. The strategy and roadmap form the recommendation evidence library, not additional outcome databases.

### Goal 3 mapping

The national strategy's page 5 lists poor-prognosis cancer survival, cancer mortality, and timely access as Goal 3 measures [S3]. Lung-cancer relative survival connects directly to the survival topic. Regional age-standardised mortality is related to the mortality goal, but does **not** measure achievement of the national reduction in death counts. This prototype does not reproduce the Nordic survival target without comparable Nordic data and methods.

The same page references THL guidance 21/2016 for timeliness. The roadmap schedules further pathway and access-time definitions [S4, pp. 56–57]. Therefore do not assert that Finland has no cancer access-time guidance, or invent a target time. Any later timeliness metric must carry its cancer, milestone definitions, target source, and applicability dates.

## Data contract and provenance

Implement a single reviewed adapter. A future adapter can translate another source into this contract; schema inference may be AI-assisted but requires confirmation of units, definitions, and comparability before analysis.

Each normalised observation contains:

| Field group | Required contents |
| --- | --- |
| Identity | Stable observation ID, source ID, cancer classification/code, metric ID |
| Population | Region code/name/type and boundary version, sex, age group or standardisation method |
| Time | Period start/end, estimate method and follow-up window where relevant |
| Value | Estimate, unit, lower/upper interval if supplied, interval level, explicit missing/suppressed status |
| Context | Counts/denominators only when supplied and applicable to this exact metric; never infer survival sample size from incidence totals |
| Provenance | Publisher URL, file name and checksum, retrieval time, source row or table locator, adapter version |

Keep raw input immutable. Derived findings reference observation IDs and an analysis version. Missing and suppressed values remain missing, never zero. Reject duplicate observation keys, invalid units, reversed intervals, unrecognised geographic levels, and mixtures of incompatible periods or standardisation methods. Do not treat national totals, collaborative areas, counties, and Åland as interchangeable geographic units.

## Analysis rules

The numerical engine is ordinary tested code. The model can choose among permitted questions; it cannot issue arbitrary SQL, change comparability rules, or manufacture calculations.

1. Select rows with the same cancer definition, sex, metric, period, and statistical method. Fail explicitly if metadata cannot establish comparability.
2. Compare each eligible county with the publisher's matching national value. Do not reconstruct the national age-standardised rate by averaging county rates.
3. Compute an absolute rate difference for mortality, a rate ratio only with a nonzero valid comparator, and a percentage-point difference for survival. Preserve the original intervals and display rounding separately from calculation precision.
4. Classify results as `descriptive_difference`, `source_reported_difference`, `no_clear_difference`, or `not_comparable`. A published source's inferential statement must retain its locator and scope.
5. For the MVP, do not generate new significance tests from marginal confidence intervals. County and national estimates overlap in population; interval overlap is not a valid significance test. Statistical claims must come from the publisher's stated comparison. New model-based inference and multiple-comparison correction require a separately reviewed method.
6. List descriptive differences by absolute magnitude within one metric and stratum, explicitly labelled as exploratory. Show uncertainty beside each result. Do not label that ordering a league table of care quality.

Use only one period initially. Overlapping rolling estimates must not be presented as independent annual observations or evidence of a trend. Age standardisation reduces age-composition differences; it does not remove differences in exposure, cancer subtype, stage, comorbidity, or ascertainment. Mortality reflects incidence as well as survival. A difference in mortality does not establish a treatment failure.

The app must return a useful `no_clear_difference` result. Do not keep changing cancers or strata until an attractive significant result appears. Freeze the analysis choices and show all eligible regions and missingness for the chosen comparison.

## Pathway reasoning and recommendations

Represent pathway attribution separately from the outcome finding:

```text
stage: detection | referral | diagnosis | treatment_start | unresolved
support: measured | mentor_context | hypothesis | unavailable
evidence_ids: [...]
missing_evidence: [...]
```

With the initial outcome extract, default to `unresolved`. For example, higher mortality supports investigation; it cannot tell us whether a referral is slow. Display the detection → referral → diagnosis → treatment strip with unavailable stages labelled. Outcomes appear alongside the pathway, not as an invented fifth bottleneck.

Build a small evidence library from reviewed passages in the strategy and roadmap. Each entry includes a stable ID, document URL/version, printed page/section, a short original passage or faithful summary, scope, supported action types, and limitations. Keep source text separate from instructions. Policy recommendations support alignment and plausibility; they do not prove an intervention's effect size.

For an unresolved outcome signal, an acceptable first action is a **targeted pathway review**, not automatic expansion of a clinical service. Proposed example:

- County oncology service lead and primary-care lead convene a joint review with the regional cancer centre.
- Map local referral responsibilities and request an approved aggregate summary of referral, diagnosis, and treatment-start intervals, with completeness and agreed definitions. No patient-level upload to this app.
- Deliver a prioritised bottleneck assessment and a named owner for one pilot; compare process completion and waiting-time measures before and after the pilot using an agreed evaluation design.
- A proposed initial review window of four weeks is a product planning suggestion, not a national standard or a measured intervention effect.

The basis is regional pathway implementation in roadmap action 3.1.2 and systematic peer development in action 3.2.2 [S4, pp. 56–57, 60–61]. The evidence supports this review process, not a claim that a specific county's referrals are defective. If local evidence later identifies a stage, select a stage-specific action whose supporting source actually addresses it. Show one or two justified actions rather than force three generic recommendations.

Each recommendation must include the triggering finding ID, action, proposed owner, timeframe and its basis, deliverable, process metric, supporting evidence IDs, assumptions, and what would invalidate it. Separate expected direction from quantified benefit. Do not forecast lives saved, survival gains, costs, or causal effects without an applicable validated model. A clinical lead reviews recommendations before operational use.

## Architecture and model boundary

Use a small Python pipeline with validated records and a lightweight Streamlit interface for the prototype. This is a proposed stack; no commands are yet verified. Avoid adding a production database, autonomous crawler, or multi-agent orchestration to the first build.

```text
Official aggregate export + source manifest
    → reviewed adapter → validated observations → deterministic findings
Reviewed strategy/roadmap evidence → bounded evidence selection
    → model drafts brief using finding IDs and evidence IDs
    → structural validation + claim checks → decision-maker interface
```

Persist versioned JSON artifacts for observations, findings, evidence, and briefs. These files are generated by the pipeline; code and reviewed evidence definitions own them. Use one CLI entry point to rebuild artifacts once implemented. Keep model calls on the server, with keys in ignored environment files. The model receives public aggregate facts and reviewed excerpts only.

The brief schema contains a headline, finding IDs, pathway assessment, recommendations, limitations, and claim-to-evidence references. Render numerical values and units directly from finding records. Prefer structured statements referencing facts over unconstrained prose containing copied numbers.

Validate schema, referenced IDs, supported action types, missing-data handling, and forbidden claims of measured pathway delays without measured evidence. A valid citation ID does not prove that the source entails the sentence: manually review the demo briefs against their passages. Review Finnish-to-English summaries with the original open. Log model/version, prompt version, input artifact hashes, validation outcome, and generation time; do not retain credentials.

Allow one bounded retry after validation failure. If generation still fails, display the factual findings and a clearly labelled reviewed action template, or state that no supported action is available. Keep an approved cached AI brief for the selected demo case; label cached generation and its date. Never present cached output as a live model response.

## Two-minute demo

1. **0–20 seconds:** choose lung cancer, a sex stratum, and the frozen period. Display national coverage, source, and available measures.
2. **20–50 seconds:** open a county. Show the estimate, national comparator, difference, intervals, and whether the publisher supports an inferential claim.
3. **50–80 seconds:** open the pathway assessment. State what is known and which stage remains unmeasured; show the exact additional information needed.
4. **80–110 seconds:** generate or open the labelled cached action brief. Show the owner, concrete deliverable, evaluation metric, and supporting passage.
5. **110–120 seconds:** open provenance and demonstrate that the numbers trace to source rows. Be ready to show a survival case with no clear regional difference.

The primary view needs a comparison plot and a concise brief. A geographic map, conversational interface, arbitrary file upload, Nordic comparison, additional databases, and impact simulation can wait.

## Delivery checkpoints

These are proposed work budgets, not recorded completion. Keep task ownership and actual progress in [PLAN.md](../PLAN.md).

| Checkpoint | Work | Acceptance evidence and stop condition |
| --- | --- | --- |
| First 60–90 minutes | Obtain one official extract, metadata, terms, and source definitions | Reproduce several rows including a missing/uncertain case. If export fails, use the official report tables with a reviewed extraction and precise locators |
| Next 2–3 hours | Adapter, validation, comparisons | All included rows accounted for; hand-checked results match source precision; no invented significance |
| Next 2–3 hours | Evidence entries, structured brief, validation | Reviewed passages support each demo action; model abstains on unmeasured pathway claims |
| Next 3–4 hours | Interface and offline artifacts | Full demo works from a frozen snapshot; network/model failure is visible and recoverable |
| Before feature freeze | Mentor review and challenge-fit decision | Confirm usefulness, Goal 3 mapping, and whether stage attribution has enough evidence; record remaining gaps |

Cut optional features if the data checkpoint fails. Do not rescue the demo with fabricated county statistics. If a clean survival finding is unavailable, retain the negative result and use a valid mortality finding with the appropriate interpretation. This is an explicit metric choice within the frozen scope, not a substitute claim about treatment quality.

## Verification and acceptance

The implementation should include focused tests for incompatible strata, missing/suppressed observations, duplicate keys, unit errors, interval ordering, zero comparators, national comparator selection, percentage points versus percentages, and deterministic results. Fixture numbers must be labelled synthetic and kept separate from demo data.

Verify adapter output against the actual source rows. Check all selected-region numerical values and metadata, including the negative survival result, before accepting the demo. Test model output with unknown citations, unsupported stage attribution, fabricated benefits, conflicting source text, and empty evidence. Exercise timeout, invalid output, and cached fallback paths in the interface.

Done means a working pipeline and demo with reproducible real observations, a useful sourced action, explicit missing pathway evidence, traceable claims, and a mentor/team assessment of the remaining competition requirement. Passing software tests alone cannot establish that the recommendation is clinically effective or that the full challenge has been met.

## Decisions still requiring evidence

- Exact official export schema, available intervals, period definitions, geography, and reuse terms.
- Whether an expert accepts the outcome signal as a useful starting point and which local process measurement would resolve it.
- Whether public aggregate stage/process data or documented mentor evidence can support the pathway requirement in time.
- Model provider, available credentials, deployment host, and the team's implementation owner. These do not block the data proof.

## Primary sources and verification status

Checked 13 November 2026. No source has been used to claim that an intervention has a quantified causal effect.

- **S1 — [Finnish Cancer Registry: cancer statistics](https://cancerregistry.fi/statistics/cancer-statistics/).** Registry describes export through its interactive app. The page was read; the embedded app timed out in research, so a concrete CSV schema/API is unverified.
- **S2 — [Cancer in Finland 2024](https://syoparekisteri.fi/assets/themes/ssy3/factsheets/cancer_in_finland_2024.html).** Read the published report, especially section 13.4 and regional tables 15.12–15.13. Use it to cross-check the first extract, not to infer service causes.
- **S3 — [National cancer strategy 2026–2035](https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf).** Downloaded and text-extracted; checked printed page 5 for Goal 3, and pp. 33–35 for pathway and comparison context. The web reader could not open this URL; local PDF extraction succeeded.
- **S4 — [Implementation roadmap 2026–2031](https://files.hackjunction.app/resources/Kansallinen_syopastrategia_toimeenpanon_tiekartta_2026_2031.pdf).** Downloaded and text-extracted; checked actions 3.1.2 (pp. 56–57) and 3.2.2 (pp. 60–61). Distinguish planned actions from deployed services.
- **S5 — [Supplied cancer strategy and data source list](https://files.hackjunction.app/resources/Sy%C3%B6p%C3%A4strategiat%20ja%20sy%C3%B6p%C3%A4data_linkkikokoelma.pdf).** Downloaded and text-extracted; lists the Cancer Registry, THL, and other potential future sources. Inclusion in this list does not establish usable access or comparable data.
