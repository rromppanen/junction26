# Pitch sources and evidence limits

Checked 15 November 2026. Numbers match the linked markers in the HTML and PDF. Sources describe the cited populations and services; they do not establish the effectiveness of farmagusta or medical robot collection.

## Sources

1. **Finnish Cancer Registry — colorectal screening annual statistics, 2024.** [Report](https://stats.cancerregistry.fi/joukkistilastot/suolisto.html). Helsinki: 42,015 invited, 29,226 participating, 69.6% participation. Non-returners are the team’s subtraction: 12,789, or 30.4%. Mother-tongue groups: 299,347/401,645 (74.5%) for Finnish/Swedish/Sami; 10,524/19,720 (53.4%) for other/missing. This is descriptive, not evidence that language alone causes the gap. **Slides 2 and 4.**

2. **National Cancer Strategy 2026–2035, Finland.** [English PDF, FICAN](https://fican.fi/wp-content/uploads/2026/01/National_Cancer_Strategy_2026-2035_Finland.pdf). Page 5: 80% screening participation in each county; survival, mortality and treatment access indicators. Pages 19–20: clear, multilingual health communication and reducing language-group participation gaps (1.3). Page 33: timely care through pathways (3.1). The five-year survival benchmark focuses on poor-prognosis cancers; a bowel-screening study is background evidence, not proof of meeting that benchmark. **Slides 2–4, 12 and 13.**

3. **Tran et al. (2023), FIT screening outcomes in Flanders.** *International Journal of Environmental Research and Public Health* 20(2):1654. [Full paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC9864341/), [DOI](https://doi.org/10.3390/ijerph20021654). Five-year **relative** survival: 93.8% in screen-detected cancers and 61.9% in FIT non-participants, displayed as 94% and 62%. Observational comparison; lead-time and selection effects limit causal interpretation. These are not absolute survival estimates for Finnish invitees. **Slide 3.**

4. **HUS — colorectal cancer screening and sample instructions.** [Service page](https://www.hus.fi/en/patient/treatments-and-examinations/colorectal-cancer-screening), [English sampling leaflet](https://www.hus.fi/sites/default/files/2022-06/Instructions%20for%20collecting%20the%20sample%2C%20filling%20in%20preliminary%20information%20and%20returning%20the%20sample.pdf). The reviewed HUS guidance is available in Finnish, Swedish and English; this does not establish that no other translated material exists. Sample return is by prepaid envelope or HUS lab. The app adapts the sampling sequence; HUS has not endorsed this prototype. **Slides 5 and 7.**

5. **Gordon & Green (2015), survey of FIT use and non-use.** *BMC Public Health* 15:546. [Paper](https://link.springer.com/article/10.1186/s12889-015-1908-x), [DOI](https://doi.org/10.1186/s12889-015-1908-x). In a US insured-population survey, 32.9% of non-users considered FIT unnecessary; 59.6% cited discomfort, disgust or embarrassment. These are self-reported reasons, not Finnish population estimates or evidence that pickup changes behavior. **Slide 5.**

6. **Vives et al. (2024), M-TICS randomised trial.** *JMIR Public Health and Surveillance* 10:e57959. [Paper](https://publichealth.jmir.org/2024/1/e57959), [DOI](https://doi.org/10.2196/57959). Among pharmacy-kit recipients who had not returned FIT after 14 days, a targeted SMS reminder produced 64.2% completion at 30 days versus 53.7% in control. This supports reminders in that setting, not robot pickup, the whole app or medical transport. **Slides 5 and 14.**

7. **Ricciardi et al. (2024), disability and colorectal screening meta-analysis.** *Current Oncology* 31(11):7023–7039. [Publisher](https://www.mdpi.com/1718-7729/31/11/517), [PubMed](https://pubmed.ncbi.nlm.nih.gov/39590148/), [DOI](https://doi.org/10.3390/curroncol31110517). Odds of FOBT/FIT participation among people with disabilities: OR 0.72 (95% CI 0.65–0.81). This is an odds ratio, not a 28-percentage-point difference. It neither isolates mobility as the cause nor proves that doorstep pickup closes the gap. **Slide 5.**

8. **Starship Technologies — published delivery capabilities.** [Delivery-app integration](https://www.starship.xyz/delivery-apps/), [Robot access](https://www.starship.xyz/our-robots/). The company describes APIs for delivery jobs and status, and customer-phone access to locked cargo. These pages concern existing delivery operations; they do not validate medical specimen collection or a compartment insert. No partnership with farmagusta is claimed. **Slides 8 and 9.**

9. **Statistics Finland — population structure, table 11re.** [Table](https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__vaerak/statfin_vaerak_pxt_11re.px/). Cohort selection from the earlier team deck: 2025; Helsinki, Espoo, Vantaa and Kauniainen; ages 56–74; both sexes; 235,677 people. The table and its dimensions were checked, but the API re-sum was unavailable during this pass (HTTP 400); the total is retained from the supplied deck pending reproduction. This is a full-age-rollout planning cohort, not the actual 2026 invitation population. [HUS’s 2026 invitation cohorts](https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february) are narrower. **Slide 13.**

10. **Posti — contract letter-service prices from 1 October 2026.** [PDF, page 26](https://assets.ctfassets.net/dvxpcmq06s7e/NBjq2IyKk3qCsIP1mqWYp/4df58c076869fe32f5f32ab112a65ebc/202608_Posti_Kirje-suoramarkkinointi-ja_lehtipalveluiden_sopimushinnasto_FI_1.10.2026_alkaen_WEB.pdf#page=26). Economyvastaus is €2.07 per item **plus €17.24/kg**, excluding VAT; account/handling charges can also apply. The slide includes only the item base fee and an **assumed €0.40 envelope per kit**, with rounded counts. It excludes weight/account/handling charges, robot costs and SMS costs. €242,277 is a base-cost scenario, not total postage expenditure or demonstrated savings. **Slide 13.**

11. **farmagusta team — prototype and proposed service.** [Repository](https://github.com/rromppanen/junction26), [Presentation PR](https://github.com/rromppanen/junction26/pull/96), [Nurse app](https://github.com/rromppanen/junction26/tree/main/nurse). Source for nine supported languages, the demo fleet (30 robots, six hubs), simulated four-compartment runs, patient actions and flag rules. These are implementation facts or design proposals, not external clinical evidence. Invented people and simulated operations are stated on the slides. **Slides 6–12 and 14.**

## AstraZeneca challenge alignment

The team’s [challenge notes](../../challenge.md) record the brief’s emphasis on evidence, a Goal 3 link, concrete actions, a working demo and clarity. This mapping explains the proposal; it does not assert a judging outcome.

| Requirement | Where the deck addresses it | Boundary |
| --- | --- | --- |
| Identify a gap and locate it in the pathway | 2: invitation → test return; 4: participation by mother tongue | Descriptive registry data; causes are not inferred from language alone |
| Goal 3 | 3: relative-survival background; 12: follow-up actions and a proposed positive-FIT → colonoscopy timing measure | Diagnostic timing is a proxy related to timely care, not the official treatment-start indicator; the demo has no survival or treatment-start outcomes |
| Evidence-based action | 5: multilingual guidance, explanations, reminders and pickup proposal | Reminder evidence is supported by a trial; pickup effectiveness and medical delivery require a pilot |
| Concrete operations and working demo | 6–12: phone journey, delivery concept and nurse actions | Robots, lab processing and appointments are simulated |
| Data quality and transparency | Linked citations, short caveats and slide 14 | Observational comparisons, external populations, assumed costs and unvalidated hardware remain explicit |

## Cost calculation and rounding

235,677 ÷ 2 → 117,839 annual kits (rounded); ×80% → 94,271 returns (rounded). 94,271 × €2.07 → €195,141 base postage; 117,839 × €0.40 → €47,136 envelopes. Rounded sum: **€242,277**, presented as **approximately €240,000**. With no intermediate rounding, the included components total €242,275.96. Weight and account fees are additional and are not estimated here.
