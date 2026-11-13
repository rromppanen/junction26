# Gap Radar: MVP design

Status: approved in chat on Fri 13.11.2026. Challenge: AstraZeneca "Equal Care Across Finland" (see [docs/challenge.md](../../challenge.md)).
Tech bounties: Google DeepMind Gemini API, Context.dev, Aiven.

## Goal

A decision-maker in a wellbeing services county (hyvinvointialue) opens Gap Radar and, **within two minutes**, sees:

1. Where their county falls behind on a cancer-care indicator (**the gap**)
2. Which stage of the care pathway that gap belongs to (**the location**)
3. Three concrete, sourced actions they could take (**the recommendation**)

Done means a working, deployed demo by **Sat 14.11 ~22:00** that passes the four AstraZeneca minimum requirements: sourced claims, at least one Goal 3 indicator, actionable proposals, live demo.

## Users

- **Primary:** decision-makers in wellbeing services counties (cancer-care leads, service directors). They're non-technical.
- **Secondary:** the AstraZeneca jury and national actors (FICAN, THL).

## Non-goals

- No patient-level or personal data. The challenge allows public aggregate data only.
- No user accounts, editing or multi-tenant features.
- No numbers produced by the AI. All figures come from the data and the gap engine.
- No claims about cancer-specific target times for access to care. Finland has not defined them yet; the roadmap plans them for 2026–2028.

## Architecture

```
Sotkanet REST ──ingest script──▶ Aiven Postgres ◀── snapshot JSON (fallback, committed)
                                       │
                                  gap engine (pure TS)
                                       │ gap facts
strategy/roadmap excerpts ──┐          ▼
Context.dev county pages ───┼──▶ analyst (Gemini) ──▶ validator ──▶ county brief
                            │
                    Next.js UI: radar view + county brief
```

One Next.js (TypeScript) app with App Router. Server-side API routes call the database, Gemini and Context.dev, so API keys never reach the browser. Deployed to Vercel.

## Components

### 1. Indicator catalog (`src/data/indicators.ts`)
A static list. Each entry has: Sotkanet id, English and Finnish names, unit, "higher is better" flag, pathway stage, Goal 3 sub-goal, and source URL.

MVP indicators:

| Sotkanet id | Indicator | Pathway stage | Years per county |
| --- | --- | --- | --- |
| 3621 | Breast cancer screening attendance, % | Detection | 2019–2024 |
| 6103 | Colorectal cancer screening attendance, % | Detection | 2022–2024 |
| 3625 | 5-year relative survival, breast cancer, % | Outcome | 2019–2024 |

Stretch: 3620 (cervical screening), 3627 (bowel cancer survival), 3626 (cervical cancer survival), 10024 (cancer death rate), 2475 (oncology outpatient visits, a treatment-access proxy).

Pathway stages: Detection → Referral → Diagnosis → Treatment → Outcome. **Referral** and **Diagnosis** have no public county-level data; the UI shows them greyed out with "no public data" and a link to roadmap action 3.1.2.

### 2. Ingest (`scripts/ingest.ts`)
- Fetches each catalog indicator from `https://sotkanet.fi/rest/1.1/json?indicator=<id>&years=...&genders=total|female`, plus region metadata from `/rest/1.1/regions`.
- Keeps regions with category `HYVINVOINTIALUE` (21 counties + Helsinki + Åland, as Sotkanet lists them) and the national total.
- Upserts into Postgres table `indicator_values(indicator_id, region_id, region_name, year, value, source_url, fetched_at)`.
- Writes `src/data/snapshot.json` with the same rows.

### 3. Data access (`src/lib/data.ts`)
- Reads from Postgres when `DATABASE_URL` is set and reachable. Otherwise, or on error, reads `snapshot.json`.
- The response says which source it used, and the UI shows it as "data: live database" or "data: snapshot <date>".

### 4. Gap engine (`src/lib/gap.ts`, pure functions, unit-tested)
For one indicator, county and year, it computes:
- county value, national value, and the county's rank among counties
- gap to the national value and to the best-quartile value, with the sign corrected by "higher is better"
- 3-year trend: the change between the latest year and the value three years earlier, when available
- a status: `behind` / `on par` / `ahead`, using a threshold of 2 percentage points (the constant can be tuned)

Output: a typed `GapFacts` object. This is the **only** source of numbers for the analyst and the UI.

### 5. Evidence excerpts (`src/data/evidence.ts`)
Hand-picked passages from the strategy and the roadmap (Finnish original + short English summary), each with document and page. Covers Goal 3 sub-goals 3.1–3.5, roadmap actions 2.5.2 and 3.1.2, the lymphoma diagnosis-delay finding (roadmap p. 11) and the 70%-at-stage-I–II target. These passages are what the analyst cites.

### 6. Live county context (`src/lib/context.ts`, stretch)
- Uses Context.dev to search and scrape the selected county's own public pages about cancer care and access times.
- Returns short text snippets with URLs, cached on disk/in memory per county for 24 h.
- Failure returns an empty list, and the analyst still runs.

### 7. Analyst (`src/lib/analyst.ts`, Gemini API)
- **Input:** `GapFacts` for the selected county (all MVP indicators), the evidence excerpts, and the live snippets if available.
- **Prompt rules:** use only numbers that appear in the facts; cite a source id for every claim; recommendations must name an owner (for example the county's primary care unit or FICAN), a timeframe, and the Goal 3 indicator they move; state limitations.
- **Output:** JSON matching the schema below (Gemini structured output).

```ts
type Brief = {
  headline: string;                 // one sentence, plain language
  finding: string;
  pathwayStage: "detection" | "referral" | "diagnosis" | "treatment" | "outcome";
  recommendations: {
    action: string;
    owner: string;
    timeframe: string;
    goal3Indicator: string;         // e.g. "3.1: patients treated within target times"
    sources: string[];              // evidence ids or data source ids
  }[];                              // exactly 3
  limitations: string[];
};
```

### 8. Validator (`src/lib/validate.ts`, unit-tested)
Rejects a brief when:
- a recommendation has no `sources`, or cites an unknown source id
- any number in the text does not appear in `GapFacts` (allowing for rounding)
- there are not exactly 3 recommendations

On rejection it retries Gemini once with the errors. If that also fails, it shows a deterministic fallback brief built from `GapFacts` and a fixed recommendation template per pathway stage.

### 9. UI
- **`/` Radar view:** indicator selector, year selector, a choropleth map of the counties (red = behind, grey = on par, green = ahead), the pathway strip, and a ranked list of counties. Clicking a county opens its brief.
- **`/county/[id]` County brief:** headline, gap chart (county vs. national vs. best quartile over time), the 3 recommendation cards with owner, timeframe and Goal 3 tag, a sources panel (every source id resolves to a link and page), limitations, and the data-source badge.
- **Map shape:** wellbeing services county boundaries as GeoJSON from Statistics Finland's open geoservice, simplified and committed to `public/`. Fallback: a fixed tile grid of counties.

## Error handling

| Failure | What happens |
| --- | --- |
| Database unreachable | Snapshot data; the badge says "snapshot" |
| Gemini error or timeout | One retry, then the deterministic fallback brief, labelled as such |
| Validator rejects the brief twice | Deterministic fallback brief |
| Context.dev fails | No live snippets; the brief still renders |
| Indicator missing for a county or year | Shown as "no data"; excluded from ranking |

## Testing

- **Unit tests (Vitest):** the gap engine (sign handling, ranking, missing data) and the validator (unsourced claims, invented numbers, wrong recommendation count).
- **Ingest check:** row counts per indicator, and every county is present for the latest year.
- **Manual demo script:** pick breast screening 2024, open the lowest-ranked county, check that the brief cites sources and that every number on screen matches the chart.
- **Judge agent:** run `.claude/agents/judge.md` on `docs/idea.md` before Saturday evening.

## Environment variables

`GEMINI_API_KEY`, `DATABASE_URL` (Aiven Postgres), `CONTEXT_DEV_API_KEY`. Stored in `.env.local`, never committed.

## Bounty fit

- **Gemini API:** the analyst and its structured output.
- **Aiven:** Postgres holding the indicator data.
- **Context.dev:** live county context (stretch). It must be working by Saturday evening to count.
