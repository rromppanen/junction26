# Cancer equity analyst

Status: proposed product concept, 13 November 2026. This describes the intended solution, not implemented functionality.

## The idea

An adaptive AI analyst that turns new cancer-care datasets into evidence-backed improvement plans. A researcher or care-service lead uploads a dataset; the app standardises it, identifies credible outcome disparities between available population groups, investigates where those disparities emerge in the care pathway, and recommends practical actions supported by applicable evidence. When new data arrive, the app repeats the analysis and tracks whether the gaps persist or improve.

The product is a reusable workflow rather than a fixed dashboard or a one-off list of findings. Its analysis adapts to the data: a dataset containing gender can support gender comparisons, one containing nationality can support nationality comparisons, and one containing pathway milestones can support analysis of delays between those milestones.

The central promise is: **Understand who is worse off, locate what the data can reveal about the pathway, and decide what to do next—with the evidence visible.**

The primary users are Finnish wellbeing services county cancer-care leads, service planners, and researchers. The initial use case is the AstraZeneca [Equal Care Across Finland challenge](challenge.md).

## What makes the idea practical

Different files can be translated into a common analytical representation. Different analytical questions can be selected from a library of validated methods. AI assists interpretation, analysis planning, literature retrieval, and explanation; tested code performs the calculations.

The system must distinguish three levels of conclusion:

1. **Observed disparity:** a measured difference between comparable populations.
2. **Supported explanation:** an association or pathway finding that helps explain the difference, while leaving alternative explanations open.
3. **Causal estimate:** an effect supported by an appropriate study design and explicitly stated assumptions.

Not every dataset supports all three. The app should identify missing evidence and propose the next useful investigation when it cannot establish a cause or support an intervention. It should never manufacture a root cause to complete the workflow.

## End-to-end workflow

```text
Upload data and definitions
    → confirm the dataset mapping
    → assess which questions are answerable
    → detect credible disparities
    → locate measured pathway problems
    → investigate competing explanations
    → retrieve and appraise intervention evidence
    → propose an action and evaluation plan
    → analyse subsequent data and track progress
```

### 1. Import and understand the dataset

Support common tabular formats, initially CSV and Excel, with Parquet and JSON as additional options. “Flexible input” means different schemas within a supported domain; it does not mean that any arbitrary file contains enough information for meaningful analysis.

The user supplies a data dictionary or answers a short set of questions about what each row represents, the population, outcomes, observation periods, coding, missing values, and study design. The app profiles the file and proposes a mapping from source columns into concepts such as population group, outcome, region, care milestone, intervention, and follow-up.

Code checks types, units, category values, dates, duplicate records, and relationships. The user confirms consequential ambiguities—for example whether a date represents first suspicion or confirmed diagnosis. The approved mapping is saved for future uploads.

Preserve the original data and transformation history. Do not silently equate sex with gender, nationality with ethnicity, or citizenship with residence. Do not infer demographic categories from names.

### 2. Establish what the data can support

Before searching for gaps, show a capability assessment.

| Available information | Supported capability |
| --- | --- |
| Defined outcome, groups, and appropriate denominators or observations | Compare outcomes between groups |
| Event status and follow-up time | Analyse time-to-event outcomes while accounting for incomplete follow-up |
| Comparable pathway transition counts | Compare recorded completion at specific steps |
| Linked milestone dates or well-defined interval summaries | Compare delays between measured milestones |
| Relevant clinical and operational variables | Investigate explanatory associations |
| Suitable experimental or quasi-experimental design | Estimate particular causal effects under reviewed assumptions |

Aggregate tables and individual records require different methods. A table of regional averages cannot be treated as linked patient journeys. If essential definitions or denominators are absent, request clarification or disable the affected analysis.

### 3. Discover credible gaps dynamically

Identify available demographic and service dimensions, then propose an analysis plan using supported methods. The user can inspect the outcomes, comparisons, reference populations, and exclusions before execution.

The numerical engine calculates effect sizes, uncertainty, counts, and suitable comparisons. It chooses methods according to the outcome and study structure rather than applying the same test to every column.

Protect against misleading discoveries:

- Record all searched comparisons and apply an appropriate multiple-testing strategy.
- Limit intersectional searches when groups become too small for reliable analysis.
- Report practical importance alongside statistical uncertainty.
- Account for repeated observations, clustering, missingness, and incomplete follow-up where applicable.
- Show crude and appropriately adjusted results, with the adjustment rationale visible.
- Distinguish an outcome disparity from evidence that a treatment works differently between groups.
- Return a clear negative or inconclusive result when no credible gap is established.

Discoveries made through exploration remain exploratory until supported by an appropriate confirmation strategy. A model must not keep changing the question until an attractive result appears.

### 4. Locate the pathway problem

Where data permit, compare the same populations across measured transitions, such as referral → assessment → diagnosis → treatment decision → treatment start. Look for differences in waiting times, completion, and where the disparity becomes observable.

Account for different legitimate care routes, clinical urgency, repeated tests, incomplete records, and people still waiting. The longest interval is not automatically a bottleneck, and the point where a disparity appears is not necessarily where its cause originated.

Each finding identifies the measured transition, population, comparator, uncertainty, and evidence limitations. If the dataset contains only outcomes, the app marks pathway location as unresolved instead of inferring it from survival or mortality alone.

### 5. Investigate possible causes

Maintain competing explanations and test those that the data can address. For example, a waiting-time difference might relate to geography, clinical case mix, referral completeness, language access, facility capacity, or recording practices.

Ask whether the difference persists within comparable clinical groups, is concentrated in particular services or periods, or changes under reasonable assumptions about missing data. Identify the additional measurement that would help distinguish unresolved explanations.

Causal analysis requires a specific question, a reviewed causal model, an identification strategy, and sensitivity checks. Automatically adjusting for every available variable can introduce bias or remove a mechanism of inequality. Feature importance alone does not establish a cause. Randomisation supports conclusions about the assigned intervention, not automatically about every demographic difference.

### 6. Build an evidence-based recommendation

Connect two evidence chains: the local finding that warrants action, and research supporting the proposed intervention. Then assess whether that intervention is applicable to the local population and service setting.

Start with a small reviewed library of interventions, guidelines, and relevant research. Add literature retrieval to find additional evidence and updates. The workflow structures the research question, screens studies, extracts findings, assesses limitations and applicability, and considers contradictory evidence and harms.

Each recommendation includes:

- The finding and pathway step it addresses.
- The proposed action, target population, owner, and implementation assumptions.
- Supporting source passages, study populations, designs, and outcomes.
- Evidence certainty and limitations, with expert review of consequential judgments.
- A deliverable, proposed timeframe, success measure, and balancing measures.
- What would invalidate the recommendation or justify stopping the intervention.

An accessible citation is not enough: the cited evidence must support the actual claim. Policy alignment does not establish an intervention's effect size, and evidence from another setting may not transfer directly. If strong evidence is unavailable, recommend a targeted investigation or evaluated pilot rather than promise a fix.

### 7. Monitor and learn from subsequent data

Save confirmed mappings, cohort definitions, analysis versions, findings, recommendations, and implementation status. A new upload reruns compatible analyses, flags schema changes, and highlights new or persistent disparities. Scheduled connectors can be added later.

Separate exploratory discovery from predefined monitoring rules, including how repeated checks handle false alarms. Show whether an action was implemented and whether the relevant measures improved. A before-and-after improvement alone does not prove that the intervention caused it.

## Key product features

| Feature | User value |
| --- | --- |
| Assisted dataset mapping with saved definitions | Reuse the app with unfamiliar and recurring datasets |
| Capability assessment | Know which conclusions are supported before analysis starts |
| Adaptive demographic comparisons | Investigate the groups actually represented in the data |
| Statistical checks and uncertainty | Distinguish credible signals from unstable patterns |
| Pathway view | See where a measured delay or loss of coverage occurs |
| Explanation assessment | Separate observations, associations, and causal evidence |
| Inspectable evidence and recommendations | Trace proposed actions to applicable research |
| Action register and repeated analysis | Follow findings through implementation and evaluation |
| Reproducible analysis history | Reconstruct how a conclusion was reached |

The main decision-maker view should explain the finding, the supported pathway assessment, and the next action within two minutes. Detailed methods and provenance remain available for researchers and reviewers.

## Proposed technical approach

These are implementation options, not installed or verified project capabilities.

| Component | Proposed approach |
| --- | --- |
| Prototype interface | Streamlit for upload, mapping review, findings, evidence, and action tracking |
| Processing | Python, DuckDB, pandas, and Parquet artifacts |
| Structured contracts | Pydantic schemas for mappings, analysis plans, findings, and recommendations |
| Statistics | SciPy and statsmodels; lifelines for supported survival analyses |
| Pathway analysis | Explicit transition calculations first; PM4Py for complex event histories later |
| Evidence | Versioned reviewed documents and structured evidence records, with literature retrieval |
| Model | A capable model with structured outputs and bounded calls to approved tools |
| Persistence | Local versioned artifacts initially; database and object storage as needed |

Use an explicit workflow with bounded retries and visible failures. The model proposes mappings and analyses, invokes validated functions, and drafts explanations. It does not freely execute arbitrary code or invent calculations. No custom model training or autonomous multi-agent system is required for the initial prototype.

Every result should retain the input checksum, mapping version, cohort definition, analysis method and parameters, code version, model/prompt version where applicable, and evidence references. Treat uploaded documents and retrieved pages as evidence, not executable instructions.

## Hackathon scope and longer-term vision

The hackathon should demonstrate the reusable pipeline with one high-quality public aggregate source, a small set of supported outcome and pathway analyses, and a reviewed intervention library. Test a differently structured input to show that the mapping and analysis selection adapt rather than relying on fixed column names. If a second observation period is available, demonstrate the monitoring loop.

The exact first dataset remains a data-validation decision. Prefer one that genuinely supports group comparisons and at least one pathway transition. Include an explicit Goal 3 indicator; screening participation alone does not satisfy that mapping. Verify source definitions, reuse terms, and evidence coverage before committing to the demo case.

The challenge uses public aggregate data. Processing confidential study records is a future capability requiring appropriate deployment, access controls, retention rules, and an approved data-handling process; it is not assumed by this prototype.

Longer-term expansion can add more adapters, analytical methods, evidence coverage, connectors, and reviewed causal designs. Broad automatic root-cause discovery and comprehensive evidence synthesis require substantial methodological development and external validation.

The [earlier prototype design](design/2026-11-13-cancer-equity-agent.md) provides a narrower single-source starting point. This idea document records the broader adaptive product vision; the earlier dataset choice and fixed prototype scope should be reconsidered against this workflow. Task ownership and delivery decisions belong in [PLAN.md](PLAN.md).

## How we prove it works

Evaluate against reference conclusions reviewed by a statistician or domain expert. Include renamed columns, ambiguous coding, missing groups, no true gap, small samples, confounding, incomplete follow-up, a measured pathway delay, and an unsupported causal explanation.

Measure mapping accuracy, numerical correctness, false discoveries, appropriate abstention, source support, and recommendation applicability. Verify that every displayed number can be reproduced and every consequential recommendation can be traced to its evidence. A successful demo must show both a useful supported finding and a case where the app correctly limits its conclusion.

## Methodological references

- [OHDSI data standards](https://www.ohdsi.org/data-standards/): common representations and preservation of source meaning and provenance.
- [PATH statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC7531587/): principles and limitations of treatment-effect subgroup analysis.
- [statsmodels multiple-testing methods](https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html): available correction procedures; method choice still requires a valid analysis plan.
- [DoWhy introduction](https://www.pywhy.org/dowhy/main/user_guide/intro.html): explicit causal assumptions, identification, estimation, and refutation.
- [Cochrane handbook, chapter 14](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14): appraisal and communication of evidence certainty.
