# Our challenge: AstraZeneca, Equal Care Across Finland

Source: the challenge page on hackjunction.app (read 13.11.2026). Prizes: €1,000 / €750 / €250. AstraZeneca wants to continue promising work in a follow-up project with a Finnish wellbeing services county (hyvinvointialue).

## The ask

Build an **AI-powered system** that supports equal and effective cancer care across Finland. It must:

1. **Identify the gap:** detect differences in access to cancer care or in treatment outcomes.
2. **Locate the gap in the care pathway:** detection → referral from primary to specialist care → diagnosis → treatment initiation.
3. **Recommend what to do (most important):** concrete, evidence-based improvement proposals that a health center or wellbeing services county could implement. Diagnosis alone is not enough.

Possible formats: an AI analyst explaining indicator trends and proposing actions, a monitoring dashboard with recommendations, an early-warning system for emerging delays, or a simulation of an intervention's impact.

## Minimum requirements (fail any and we lose)

- **Reliable evidence:** public data and/or AstraZeneca mentor insights, **with the source shown for every claim**.
- **Goal 3:** cover at least one indicator connected to Goal 3 of the national cancer strategy (see below).
- **Actionable recommendations:** concrete proposals, not just analysis.
- **Working demo:** slides alone are not enough.

## Judging criteria

| Criterion | Weight | What judges ask |
| --- | --- | --- |
| Actionability | 30% | Are the proposals concrete enough for a health center or wellbeing services county to implement? |
| Insight | 25% | Does it reveal a real, meaningful gap and show where in the pathway it emerges? |
| Data quality & transparency | 20% | Clear sources, limitations acknowledged, no unsupported assumptions? |
| Execution | 15% | Does it work in a live demo in front of the judges? |
| Clarity | 10% | Can a non-technical decision-maker get the key message and action in **under 2 minutes**? |

## Known bottlenecks (from the brief)

1. **Late detection:** cancer not found early enough.
2. **Primary → specialist care:** referrals delayed or not progressing smoothly.
3. **Diagnosis → treatment:** patients not starting treatment within target timeframes.

Data on Finnish cancer care is limited, and **working around that data gap is part of the challenge**. Expect to combine public data with what the mentors tell us.

## Key facts from the provided documents

Sources: *Kansallinen syöpästrategia 2026–2035* (the "strategy", 64 pp.), *Toimeenpanon tiekartta 2026–2031* (the "roadmap", 111 pp.), and the *Syöpästrategiat ja syöpädata* link collection. Page numbers refer to the PDFs.

### Headline targets of the strategy (strategy p. 5)

Verified against the strategy text; see also Inka's [situation and gaps](research/AstraZeneca%20cancer%20care%20challenge%20situation%20and%20gaps.md).

| Goal | Headline indicator | Usable per county? |
| --- | --- | --- |
| **Goal 2** (prevention, early detection) | **80% participation in every screening programme in every county** | Yes: Sotkanet breast, cervical, colorectal screening |
| Goal 2 | At least 70% of cancers diagnosed at stage I–II | No public county data |
| **Goal 3** (equal, effective care) | 5-year survival in poor-prognosis cancers reaches the Nordic level (Sweden–Norway average): +14 percentage points in lung, +6 in pancreatic, +14 in liver cancer from the 2023 Nordcan level | Not per county; Sotkanet has breast, cervical, bowel survival per county |
| Goal 3 | Cancer mortality falls 10% from 13,300 deaths a year | Not per county in Sotkanet |
| Goal 3 | Patients start treatment within the target times of THL guidance 21/2016 | No public data |

Distance matters (roadmap p. 13): some people live over 400 km from a central hospital and over 700 km from a university hospital, and outcomes are weaker already beyond 50 km from a treatment unit.

### Goal 3 = "Varmistetaan yhdenvertainen ja vaikuttava syövänhoito" (ensure equal and effective cancer care), strategy pp. 32–42

| Sub-goal | Indicators we could cover |
| --- | --- |
| **3.1** National treatment guidelines and care pathways steer equal, **delay-free** care | **Patients get treatment within the target times** ("Potilaat pääsevät hoitoon tavoiteaikojen puitteissa"); availability of guidelines/pathways vs. Nordic peers (%); national quality and effectiveness targets set for agreed cancers |
| **3.2** National cancer care quality register, systematic comparison, peer review | Number of cancer types with quality-register data; data coverage incl. stage (target 90%); **reliable information on regional differences in diagnostics and treatment practices**; clinical cancer notifications (90% automated by 2030) |
| **3.3** Rehabilitation, psychosocial support, palliative care equally available | % patients with symptom/QoL/function data; % units offering support services; % advanced-cancer patients with early palliative care; % receiving cancer treatment in the last month of life |
| **3.4** Functional-capacity data steers care of older patients (75+) | % wellbeing services counties doing geriatric-oncology assessment; G8 screening use; functional data included in referrals |
| **3.5** Sufficient, skilled workforce | Regional distribution of professionals; **usage rate of digital care pathways and AI applications** in cancer units |

### Why this matters (the evidence for a gap)

- Regional differences in resources, service availability, treatment practices and support services weaken patients' equality (strategy p. 32).
- Regional comparison is done only occasionally, using crude and fragmented measures, "if at all". There is **no national cancer-care quality register yet**, and clinical cancer data is poorly recorded (strategy p. 35).
- **Target times: general ones exist, cancer-specific ones don't yet.** Access to cancer care is monitored against the general target times in THL guidance 21/2016 (strategy p. 5). Cancer-specific pathways with their own access times are planned for five cancers in 2026–2028, using Nordic models: Denmark's *Kræftpakkeforløb*, Sweden's *SVF* and Norway's *Pakkeforløp* (roadmap p. 56, action 3.1.2).
- Standardized referral criteria from primary to specialist care, for at least the five most common cancers, are planned for 2026–2028 (roadmap p. 52, action 2.5.2).
- Socioeconomic gap: a not-yet-published lymphoma study found that **time to diagnosis is twice as long when a patient with symptoms goes to public primary care** rather than private providers. Occupational health care is well resourced, while public health centers are under-resourced (roadmap p. 11).
- Immigrants participate less in cancer screening; low socioeconomic status is linked to suspected diagnostic delay, weaker access and lower screening participation (roadmap pp. 10–11).
- Early-detection target: **≥70% of cancers diagnosed at stage I–II by 2035** (roadmap p. 52). The early-detection indicators are stage at diagnosis, access times, the share treated with curative intent, and survival (roadmap pp. 23–24).
- Action 3.5.3 explicitly promotes digital tools and AI in cancer care, measured by the usage rate of digital pathways and AI applications.

### Public data sources (from the link collection)

- **Finnish Cancer Registry (Syöpärekisteri):** cancer statistics app, screening statistics; survival and mortality nationally and by region
- **THL Sotkanet:** regional health indicators
- **Statistics Finland:** cause-of-death statistics (StatFin)
- **Kela:** open data, medicine reimbursement rights
- **NORDCAN 2.0:** Nordic cancer registry data, for Nordic comparison
- **FICAN** (national cancer center) and the regional FICANs
- Findata, FinRegistry and the biobanks need research permits, so they're **not usable this weekend**.

## Mentors

- **Fri from 18:00:** Hanna Rusila (Marketing), Hanna Toivola (Diagnostics), Kaisa Kaitila (Medical Affairs), Laura Aaltonen (Marketing), Joanna Tuormaa (Business Excellence)
- **Sat during the day:** Kaisa Kaitila (Medical Affairs)
- **Sun 14:00, judging:** Hanna Rusila, Laura Aaltonen, Joanna Tuormaa
- **Contacts:** Joanna Tuormaa (main), Laura Aaltonen (questions; phone number on the challenge page)

AstraZeneca shares "key insights" at their stand on **Fri at 20:00**. Go, and write down what they say, because mentor insights count as evidence.
