# Why robot pickup could narrow the bowel screening gap

Research note, 14.11.2026. It supports the Läpi sample app (`/kit`, `/staff`, `/demo`), where a delivery robot collects the home stool test (FIT) and a nurse board tracks every sample to colonoscopy. See the [sample app plan](../superpowers/plans/2026-11-14-sample-app.md).

**Summary:**
- **What the robot fixes:** getting the sample back.
- **What the system fixes:** the booked pickup, the tracking and the nurse board fix forgetting, missing deadlines and positives with no colonoscopy.
- **Evidence:** no study has tested home pickup of FIT. Every justification below borrows evidence from a similar intervention.

## The gap it targets

Finnish Cancer Registry, 2024. The figures and sources are in [screening pathway drop-off](2026-11-14-screening-pathway-drop-off.md).

| Group | Bowel screening participation |
| --- | ---: |
| Everyone invited | 73.5% |
| Men | 69.2% (women 77.7%) |
| Other or missing mother tongue | 53.4% (men 47.2%) |
| Basic or unknown education | 61.5% |
| Born in Africa | 40.5% |
| Helsinki | 69.6% |

**Helsinki** also has the largest share of positive tests with no colonoscopy: 31.5% in 2023, against 21.4% nationally.

**The robots already run there.** Starship has delivered for Alepa grocery stores in Espoo since 2022, and in Helsinki, Espoo and Vantaa since 2023 ([Starship](https://www.starship.xyz/?p=4974); [Helsinki Times](https://www.helsinkitimes.fi/finland/finland-news/domestic/25222-finnish-grocery-chain-expands-robotic-delivery-to-over-100-stores-by-year-end.html)). The county with the worst figures already has robots.

## Problems it fixes, and the evidence

| # | Problem | How the app answers it | Evidence | Strength |
| --- | --- | --- | --- | --- |
| 1 | Took the sample, never sent it | The robot comes to the door; no trip to a post box | 6.5% of non-users forgot to mail a sample they had taken ([Gordon & Green 2015](https://link.springer.com/10.1186/s12889-015-1908-x)). Among people who did not return a kit, 44.7% forgot and 37.7% made no plan ([Australian survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC4332898)) | Medium, from abroad |
| 2 | No plan or deadline | A booked pickup window is a concrete plan with a time | Scotland's TEMPO trial: a suggested 2-week deadline raised returns at 3 months from 66.0% to 68.0% ([TEMPO protocol](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10201271/); [result as reported](https://pmc.ncbi.nlm.nih.gov/articles/PMC4423577)). In mammography, Helsinki's attendance fell from about 72% to 62% without a booked time ([Yle](https://yle.fi/a/74-20198630)) | Medium, from a trial |
| 3 | Posting is awkward for some groups | A return method that needs no post office | In New Zealand, a community-lab drop-off raised participation by 2.88 percentage points among Māori and Pacific people, the lowest-participating groups; other groups gained less ([interrupted time series](https://searchworks.jioinstitute.edu.in/articles/cmedm__28525616)) | Best evidence for equity; not randomised |
| 4 | Tight return rule | Same-day pickup on weekdays | Helsinki asks people to post the sample no later than the day after taking it ([hel.fi](https://www.hel.fi/en/health-and-social-services/health-care/other-health-care-services/colorectal-cancer-screening)) | A Finnish rule; its effect on returns is not measured |
| 5 | Sample spoils in heat | Faster return | Haemoglobin in positive samples fell 5.1% after 7 days at 20°C and 20.5% at 30°C ([Dovepress](https://www.dovepress.com/accuracy-of-a-fecal-immunochemical-test-according-to-outside-temperatu-peer-reviewed-fulltext-article-CLEP)). A Dutch trial found that return time alone did not change positivity ([Erasmus](https://repub.eur.nl/pub/34934)) | Weak in Finland; matters only on hot days |
| 6 | Nobody sees stuck samples or positives with no colonoscopy | Every sample is tracked; the board flags positives with no booking | A text to people who had picked up a kit but not returned it raised completion at 30 days from 53.7% to 64.2% ([Catalonia RCT](https://pmc.ncbi.nlm.nih.gov/articles/11325104)). Patient navigation raises colonoscopy completion after a positive test ([Selby et al. 2017](https://pubmed.ncbi.nlm.nih.gov/29049756/)) | Strongest overall; targets Helsinki's 31.5% |

## What it does not fix

- **Handling stool.** Discomfort, disgust or embarrassment was the most common reason non-users gave (59.6%), and "screening is unnecessary" came next (32.9%) ([Gordon & Green 2015](https://link.springer.com/10.1186/s12889-015-1908-x)). The robot only comes after the sample is taken.
- **Language.** The phone app runs in Finnish, Swedish and English only, which leaves the largest gap (53.4% for other languages) unaddressed. The invitation app on `feat/invitation-design` shows how other languages could work. Medical text in those languages needs a professional translator.
- **Rural areas.** Sidewalk robots run only in cities. Elsewhere the fallback is the post or the lab return boxes.
- **Cost and proof.** No price per pickup has been published, and no trial of home pickup exists.

## How to prove it

Offer robot pickup in one Helsinki district and compare it with postal return. Measure:
- the share of samples returned within 30 days;
- the share of positives with a colonoscopy within 31 days.

Split both by sex and mother tongue, because those are the gaps the robot should narrow.

## Pitch line

"Helsinki has Finland's lowest bowel screening participation and the most positive tests with no colonoscopy. It already has delivery robots. We remove the trip to return the sample, give every person a booked pickup time, and let a nurse see every sample until the colonoscopy."
