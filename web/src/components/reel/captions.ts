/**
 * The on-screen claims of the demo reel: one plain idea each, led by its number. Each one rests on the
 * source named under it; the full references are in the comments. Words in **double asterisks** are
 * highlighted; words in ##double hashes## are highlighted and set larger. Keep every number exactly as the source gives it.
 */
export type CaptionItem = { text: string; source?: string };

export const CAPTIONS = {
  /*
    Finnish Cancer Registry, preliminary 2024 screening statistics, via Syöpäjärjestöt press release
    "Osallistuminen syöpäseulontoihin pysyi vakaana – erot väestöryhmien välillä suuria", 21 Nov 2025:
    bowel screening participation 75 % with Finnish or Swedish as native language, 53 % with another.
    https://www.sttinfo.fi/tiedote/71628038/osallistuminen-syopaseulontoihin-pysyi-vakaana-erot-vaestoryhmien-valilla-suuria
  */
  languageGap: {
    text: "Only **53%** of foreign-language speakers take part, vs. **75%** of native speakers.",
    source: "Finnish Cancer Registry, screening statistics 2024",
  },
  /*
    Iqbal N, Bhargava S, Hofvind S, et al. Effect of reminder phone calls in the language of origin on
    colorectal cancer screening participation among immigrants in Norway: a randomised controlled trial.
    Lancet Reg Health Eur 2026. doi:10.1016/j.lanepe.2026.101648. Participation 24 % (53/217) vs 11 % (22/199),
    RR 2.21 (95 % CI 1.40–3.49).
    Note: a translated invitation letter alone did not change attendance in BreastScreen Norway
    (Hofvind S et al., BMJ 2023;382:e075465), so the claim is about contact in the own language, not translation.
  */
  ownLanguage: {
    text: "Contact in their own language more than doubled participation, from **11%** to **24%**.",
    source: "Iqbal et al., randomised trial, ColorectalScreen Norway, Lancet Reg Health Eur 2026",
  },
  /*
    Berg-Beckhoff G, Leppin A, Nielsen JB. Reasons for participation and non-participation in colorectal cancer
    screening. Public Health 2022. doi:10.1016/j.puhe.2022.01.010. Danish national survey (15,072 sampled): among
    those intending to decline, a perceived low risk was the most frequent reason.
    In line with: Wangmar J et al., Patient Educ Couns 2021, doi:10.1016/j.pec.2020.09.005 (SCREESCO, Sweden):
    non-participants were less convinced that screening reduces the risk of dying from colorectal cancer.
  */
  whyItMatters: {
    text: "Non-participants often cite **not seeing the need** as their reason.",
    source: "Berg-Beckhoff et al., Danish national survey, Public Health 2022",
  },
  /*
    Naidoo N, Bell-Brown A, Kimura A, et al. Fecal immunochemical test completion by instruction type: a randomized
    clinical trial comparing quick response code-linked video to pictorial instructions. Am J Gastroenterol 2026.
    doi:10.14309/ajg.0000000000003637. 13,979 patients sent a FIT kit; completion 33.5 % with a QR code to a video
    vs 30.4 % with pictorial instructions (difference 3.1 points, 95 % CI 1.5–4.6).
    Note: a video link added to text-message reminders made no difference in a large Kaiser Permanente trial, so
    the claim is about instructions that come with the kit, as the app's QR code does.
  */
  video: {
    text: "Video instructions with the kit raised completed tests from **30.4%** to **33.5%**.",
    source: "Naidoo et al., randomised trial of 13,979 patients, Am J Gastroenterol 2026",
  },
  /*
    City of Helsinki, Espoo and Vantaa research units with the Helsinki-Uusimaa Regional Council, foreign-language
    population projection for Uusimaa 2025–2045 (Statistics Finland data): at the end of 2024, 56 % of Finland's
    foreign-language speakers lived in Uusimaa, and about 86 % of those in the region's largest cities.
    https://www.hel.fi/en/news/number-of-foreign-language-speakers-in-uusimaa-could-double-by-2045
  */
  cities: {
    text: "**86%** of Uusimaa's foreign-language speakers live in its cities: the perfect place for robot fleets.",
    source: "Helsinki-Uusimaa foreign-language population projection 2025–2045",
  },
  routing: {
    text: "An **AI algorithm** optimizes the fleet's routes.",
  },
  /*
    Rough, optimistic estimate of the return mail a capital-region fleet would replace, with the full programme
    (ages 56–74, invited every two years):
      235,677 residents aged 56–74 in Helsinki, Espoo, Vantaa and Kauniainen, 31 Dec 2025
        (Statistics Finland, table 11re: Helsinki 130,303, Espoo 56,490, Vantaa 46,695, Kauniainen 2,189)
      invited every two years            → 117,839 kits a year
      80 % returned (the national target) → 94,271 samples a year
      Posti Economyvastaus (business reply), contract price from 1 Oct 2026: €2.07 per returned item
        → 94,271 × 2.07 = €195,141
      prepaid cardboard return envelope in every kit, assumed €0.40 → 117,839 × 0.40 = €47,136
      total ≈ €242,000 a year, shown as "€240,000".
    Not counted: the outbound kit mailing (still needed) and the cost of running the robots.
  */
  savings: {
    text: "The fleet replaces prepaid return mail, saving ##€240,000 a year## in the capital region alone.",
    source: "Estimate: 94,000 samples a year × Posti business reply €2.07 + €0.40 envelope",
  },
} satisfies Record<string, CaptionItem>;
