# Screening pathway drop-off: what the Finnish Cancer Registry already publishes

Research note, 14.11.2026. It supports the product idea in [docs/idea.md](../idea.md).

The Finnish Cancer Registry's annual screening reports contain counts for each step of the screening pathway, per wellbeing services county and per population group. For colorectal screening they also show the wait from a positive test to colonoscopy per county. This is public, measured data on steps that [docs/challenge.md](../challenge.md) lists as having no data.

## Sources

| Programme | Report | Downloaded | SHA-256 of the HTML |
| --- | --- | --- | --- |
| Colorectal | <https://stats.cancerregistry.fi/joukkistilastot/suolisto.html> | 13.11.2026 | `8700c9618456bb29ed7465b04b70492c408e4c47cf1259dbc18638ee2e5e7e52` |
| Breast | <https://stats.cancerregistry.fi/joukkistilastot/rinta.html> | 13.11.2026 | `736943ae3ee8d665173e52affd00dae9bf328c37962c3ae89f54504fc046380c` |
| Cervical | <https://stats.cancerregistry.fi/joukkistilastot/kohtu.html> | 13.11.2026 | `275e967bd2c9e38455f21261fa15d88e8ea9407cc67f01d282044463ac58f5b7` |

- The cervical report is the one `feat/care-equity-mvp` already parses with `web/scripts/ingest.py`; the checksum matches its manifest. The other two reports use the same HTML structure, so the same parser pattern applies.
- All figures below were parsed from the report tables, not typed by hand. The exception is the waiting times, which the reports publish only as charts; those values are read from the chart and marked "about".
- The colorectal report includes findings reported to the Registry by 15.5.2026. It says the data is completed retrospectively, so the latest year can still change.
- Bowel cancer survival is Sotkanet indicator 3627 for 2024, from the app's own snapshot.

## The colorectal screening pathway, whole country

| Step | 2022 | 2023 | 2024 |
| --- | ---: | ---: | ---: |
| Selected for invitation | 354,174 | 422,650 | 421,365 |
| Returned the test | 273,708 (77.3%) | 314,303 (74.4%) | 309,871 (73.5%) |
| Positive test | 14,020 | 16,501 | 14,083 |
| Positive test, no colonoscopy in the programme | 2,982 (21.3%) | 3,536 (21.4%) | 3,840 (27.3%, still incomplete) |
| Cancers found at colonoscopy | 632 | 771 | 413 |

- 2024 participation by sex: men 69.2%, women 77.7%.
- In 2023, colonoscopy found a cancer in 5.9% of those examined (771 of 12,965) and an advanced precursor in 40.6% (5,258).
- The 2022 and 2023 "no colonoscopy" shares are almost identical, so about one in five is the settled level, not a reporting delay. The 2024 figure is higher because follow-up is still being reported.
- "No colonoscopy in the programme" does not prove no examination took place. Some people may have had one elsewhere, or had a medical reason not to. The report mentions 128 CT colonographies as an alternative examination in 2024.

### Where the cancers were found (people eligible in 2022)

The report links screening data with the Cancer Registry for the 2022 round:

| Route | Bowel cancers | Share |
| --- | ---: | ---: |
| Found by screening | 719 | 57.9% |
| In people who did not return the test | 259 | 20.9% |
| After a negative test (interval cancer) | 176 | 14.2% |
| In people with a positive test and no screening colonoscopy | 87 | 7.0% |
| Total | 1,241 | |

So 346 of 1,241 cancers (28%) were in people the programme invited but did not carry through: 259 at the invitation step and 87 at the colonoscopy step.

This table counts 719 screen-found cancers for 2022 where the pathway table above has 632. The report explains that this table combines the screening register with the Cancer Registry, while the pathway table uses the screening register alone.

## Colorectal screening by county

Sorted by the share of positive tests with no colonoscopy in 2023, the latest settled year. Åland is not part of the national programme.

| County | Invited 2024 | Took part 2024 | Positive tests 2023 | No colonoscopy 2023 | No colonoscopy 2024 (incomplete) | Bowel cancer 5-year survival |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Helsingin kaupunki | 42,015 | 69.6% | 1,452 | 457 (31.5%) | 32.2% | 71% |
| Vantaa ja Kerava | 17,443 | 71.3% | 677 | 181 (26.7%) | 27.0% | 73% |
| Kymenlaakso | 14,431 | 70.0% | 616 | 164 (26.6%) | 37.9% | 70% |
| Pohjois-Savo | 21,844 | 75.4% | 944 | 245 (26.0%) | 30.6% | 64% |
| Päijät-Häme | 17,272 | 75.2% | 739 | 192 (26.0%) | 28.8% | 63% |
| Keski-Uusimaa | 15,179 | 74.0% | 591 | 140 (23.7%) | 29.8% | 74% |
| Länsi-Uusimaa | 32,139 | 71.5% | 1,157 | 266 (23.0%) | 25.5% | 70% |
| Pirkanmaa | 37,764 | 74.3% | 1,427 | 327 (22.9%) | 29.9% | 66% |
| Keski-Suomi | 21,191 | 76.5% | 832 | 187 (22.5%) | 24.4% | 72% |
| Pohjanmaa | 12,299 | 75.9% | 473 | 103 (21.8%) | 26.3% | 71% |
| Kainuu | 7,009 | 76.5% | 308 | 65 (21.1%) | 35.0% | 64% |
| Lappi | 16,183 | 73.7% | 701 | 147 (21.0%) | 27.3% | 73% |
| Kanta-Häme | 14,399 | 74.3% | 596 | 116 (19.5%) | 25.4% | 66% |
| Pohjois-Pohjanmaa | 29,646 | 75.6% | 1,111 | 209 (18.8%) | 26.4% | 69% |
| Keski-Pohjanmaa | 4,928 | 73.3% | 203 | 38 (18.7%) | 25.6% | 70% |
| Itä-Uusimaa | 7,884 | 72.0% | 292 | 52 (17.8%) | 34.5% | 72% |
| Satakunta | 18,076 | 72.6% | 824 | 139 (16.9%) | 28.0% | 64% |
| Etelä-Karjala | 11,131 | 74.0% | 474 | 76 (16.0%) | 24.3% | 65% |
| Etelä-Pohjanmaa | 15,941 | 74.6% | 616 | 98 (15.9%) | 18.2% | 65% |
| Varsinais-Suomi | 36,669 | 73.5% | 1,467 | 222 (15.1%) | 21.9% | 67% |
| Pohjois-Karjala | 14,800 | 73.2% | 417 | 52 (12.5%) | 20.5% | 66% |
| Etelä-Savo | 13,122 | 76.9% | 584 | 60 (10.3%) | 23.1% | 72% |
| **Finland** | 421,365 | 73.5% | 16,501 | 3,536 (21.4%) | 27.3% | 68% |

- The share with no colonoscopy ranges from 10.3% (Etelä-Savo) to 31.5% (Helsinki), a threefold difference.
- No county reaches the national 80% participation target. Reaching it everywhere would take 27,232 more participants a year (2024 figures).
- Survival is shown for context only. Each survival year pools patients diagnosed over 15 years, mostly before the programme began in 2022, so it cannot be read as an effect of these screening figures.

### Wait from positive test to colonoscopy (read from the report's charts)

The report shows the median wait in months per county, with the bounds of the fastest and slowest tenth. Values are read from the chart to about ±0.1 months.

| | 2023 | 2024 |
| --- | ---: | ---: |
| Whole country, median | about 2.1 | about 1.9 |
| Päijät-Häme | about 4.5 | about 3.7 |
| Pohjois-Savo | about 3.6 | about 3.7 |
| Vantaa ja Kerava | about 5.3 | about 3.6 |
| Helsinki | about 5.3 | about 3.4 |
| Fastest counties | Etelä-Savo, Pohjois-Karjala: about 1.2 | Keski-Uusimaa: about 0.8; Varsinais-Suomi, Etelä-Savo: about 1.0 |

- In 2023, the slowest tenth of positives waited more than about 8 months in Helsinki and in Vantaa ja Kerava.
- Päijät-Häme and Pohjois-Savo are among the slowest in both years.
- The app needs exact values. Options: ask the Registry for the numbers behind the chart, or digitise the chart. Until then, show the values as approximate with a link to the chart.

The breast report has the same kind of chart for the wait from a positive mammogram to confirmatory examinations (2024): whole country about 0.6 months; Helsinki longest at about 1.2 months.

## Who does not take part (2024, whole country)

The same groups are missed in all three programmes. These are individual-level registry figures, not area-level correlations.

| Group | Colorectal | Breast | Cervical |
| --- | ---: | ---: | ---: |
| Everyone invited | 73.5% | 81.6% | 73.8% |
| Mother tongue Finnish, Swedish or Sami | 74.5% | 83.2% | 76.2% |
| Other or missing mother tongue | 53.4% (men 47.2%) | 60.8% | 56.3% |
| Basic or unknown education | 61.5% (men 58.4%) | 63.5% | 50.8% |
| Higher education | 79.3% | 85.9% | 80.3% |
| Born in Africa | 40.5% | 45.1% | 49.0% |
| Born in Finland | 74.5% | 83.1% | 76.0% |

- People invited in 2024: 421,365 (colorectal), 344,851 (breast), 280,812 (cervical, routine screening). Together, about 249,000 invitations did not lead to a screening.
- The cervical group figures pool routine and risk-group screening (292,110 invited), as the report does.
- "Other or missing" combines other languages with missing data, and "basic or unknown" does the same for education. The reports define them this way.
- Breast screening is below the 80% target only in Helsinki, Länsi-Uusimaa, Vantaa ja Kerava and Itä-Uusimaa (3,926 more participants needed). Cervical screening is below it in 21 of 23 regions (18,628 more participants needed).

## Standards and evidence to cite

| Claim | Source | Checked |
| --- | --- | --- |
| Follow-up colonoscopy after a positive screening test should be scheduled within 31 days of referral (acceptable above 90%, desirable above 95%) | European guidelines for quality assurance in colorectal cancer screening and diagnosis, 1st edition, recommendation 3.16 (Endoscopy 2012) | Wording seen in a search snippet of the guideline. Confirm against the full text and check for a newer edition. |
| Colonoscopy 10–12 months after a positive test was associated with more colorectal cancer (odds ratio 1.48) and more advanced-stage disease (1.97) than colonoscopy at 8–30 days; no significant increase up to 9 months | Corley et al., JAMA 2017;317(16), 70,124 patients | From summaries of the paper, not the full text. Observational: the authors do not claim cause. |
| Patient navigators and provider reminders raise colonoscopy completion after a positive test (moderate evidence; differences from −7 to +25 percentage points across studies) | Selby et al., Annals of Internal Medicine 2017;167:565–575, systematic review of 23 studies | From summaries, not the full text. Over half the studies had a high risk of bias. |
| Reminders for non-participants and invitations in additional languages | FICAN cervical screening quality handbook 2024, pp. 18–19 | Already in `feat/care-equity-mvp`'s `web/src/data/evidence.ts`, with page links. |

The European guideline counts from referral and the Registry counts from the positive test, so the two are not the same clock. Say so wherever they are compared.

## Not found yet

- A Finnish unit cost for a screening colonoscopy, a reminder, or a navigation call. Leave these as the county's own figures unless a source is found.
- The target times in THL guidance 21/2016. The PDF could not be fetched; it is still an open question in `docs/challenge.md`.
- Whether the Finnish colorectal programme has its own target for the wait to colonoscopy. Ask the mentors or check the programme's quality handbook.
