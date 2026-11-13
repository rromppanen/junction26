# Start screen and barrier lens: design

Status: draft for review, Fri 13.11.2026 evening. Builds on Gap Radar v2 (merged to `main`, PR #4) and the UI simplification (PR #5).
Challenge: AstraZeneca "Equal Care Across Finland" ([docs/challenge.md](../../challenge.md)).

## Goal

Two additions that make Gap Radar answer **the question the user came with**, and say **where the barrier is**:

1. **A start screen ("What do you want to know?")** with a few guided paths instead of dropping everyone on the map. Each path ends in a concrete answer with actions, not a configurable dashboard.
2. **A barrier lens ("Where is the barrier?")** that sorts each gap into *access*, *service* or *unknown (no data)*, using fixed, evidence-backed rules. Gemini only words it.

The message both carry: **"The gap shows up in people's behaviour, but the levers are on the service side."** Actions stay addressed to county units, never to patients.

## Non-goals

- No free-form "pick any dimension, any database" builder. The judges reward actionability (30%) and clarity (10%), not configurability.
- No data that needs research permits (Findata, FinRegistry, biobanks).
- No AI-classified barriers: the classification is rule-based and testable. Gemini may phrase it but not decide it.
- No claims about individuals; associations stay area-level (same rule as the equity lens).

## 1. Start screen

New route `/` becomes the start screen; the current radar moves to `/radar` (links and the "Back to the map" nav are updated).

Four paths, each a large card with one plain question:

| Path | Question on the card | Asks for | Goes to |
| --- | --- | --- | --- |
| **My county** | "How is my county doing?" | County (dropdown of the 23) | `/county/[id]` (today's brief) |
| **Left behind** | "Who is being left behind?" | County + lens: municipalities, education, foreign background, or men vs women | `/county/[id]?lens=<lens>`: the brief opens at the "Who is left behind" section with that lens |
| **Compare** | "How do the counties compare?" | Indicator | `/radar?ind=<slug>` (today's radar) |
| **Nordic level** *(stretch)* | "How far is Finland from the Nordic level?" | Cancer type | `/nordic`: Finland vs Sweden–Norway 5-year survival from NORDCAN |

Rules:
- Every path is one choice deep, then lands on an answer page. No multi-step wizard.
- The start screen remembers nothing (no accounts); choices live in the URL so links can be shared and demoed.
- Plain language and a Finnish toggle can come later; English first, matching the current app.

### "Men vs women" lens

Only colorectal screening (Sotkanet 6103) has separate men's and women's figures per county; breast and cervical screening are women-only by definition. So the lens is offered only where data exists, and the page says why:
- Ingest adds 6103 with `genders=male` and `genders=female` (county level; verified: 440 rows each for 2024).
- The "Left behind" view shows men vs women for colorectal screening in the chosen county against the national figures, with the gap in percentage points.
- For other indicators the lens shows: "Breast and cervical screening invite only women, so there is no comparison by sex."

### "Nordic level" path (stretch, needs verification first)

Goal 3's headline indicator is 5-year survival reaching the Sweden–Norway average (+14 points lung, +6 pancreatic, +14 liver; strategy p. 5). NORDCAN 2.0 publishes survival by country. **Before building:** confirm NORDCAN has a downloadable table or API usable without login; if not, drop this path. Country-level only, so it's framed as national context, not a county view.

## 2. Barrier lens: "Where is the barrier?"

A new section on the county brief, right after "Where along the pathway". For each indicator that is behind (vs national or vs the 80% screening target), it shows one barrier type and the evidence that put it there.

### Barrier types

| Type | Meaning | Typical county levers |
| --- | --- | --- |
| **Access** | People don't reach the service: invitations, reminders, distance, language, health literacy, fees | Reminders, translated invitations, evening hours, mobile units, fee waivers |
| **Service** | The service itself is slow or uneven after people arrive: referral, diagnostic capacity, treatment | Standardised referral criteria (roadmap 2.5.2), pathway targets (3.1.2), capacity |
| **Unknown** | No public data can show it | The "start measuring" kit |

### Rules (pure function, unit-tested)

`classifyBarriers(facts, indicators, equity, fingerprint): BarrierFinding[]` in `web/src/lib/barriers.ts`, where
`BarrierFinding = { indicatorId: number; type: "access" | "service" | "unknown"; reasons: string[]; evidenceIds: string[] }`.

1. **Screening indicator behind → Access.** Screening attendance measures people reaching the service. Evidence: `roadmap-p10-socioeconomic` (lower screening participation among people with lower socioeconomic status and among immigrants).
   - Add the reason "lower attendance goes with more residents of foreign background / lower education here" when the equity lens has |rho| ≥ 0.4 for that indicator (area-level wording).
   - Add the reason "some municipalities are far behind the county" when any lagging municipality is ≥ 5 points below the county.
2. **Survival indicator behind while its matching screening is on par or ahead → Service.** People are found, outcomes still lag, so the gap is after detection. Evidence: `roadmap-p11-lymphoma` (diagnosis twice as long via public primary care) and `roadmap-p13-distance` (weaker outcomes beyond 50 km).
3. **Survival behind and matching screening also behind → Access + Service** (two findings): the gap may start at detection and continue after it.
4. **Referral and diagnosis stages → always Unknown**, pointing to the "start measuring" kit (`strategy-goal3-headline`).
5. **No indicator behind →** no barrier findings; the section says "No stage is behind Finland" (consistent with the fingerprint's "none" pattern).

"Matching" screening ↔ survival pairs: breast screening (3621) ↔ breast survival (3625); colorectal screening (6103) ↔ bowel survival (3627). Cervical screening has no survival pair in the radar set, so rule 1 only.

### On the page

- One row per finding: the indicator, a barrier tag (Access / Service / Unknown), one-sentence reason(s) built by the UI from the rule outputs, and source chips.
- A fixed line under the section: "The gap shows up in people's behaviour, but the levers are on the service side."
- Gemini gets the findings as input (`BARRIERS:` block) with the rule "each action must address one listed barrier and name which"; the deterministic fallback brief uses the first finding's type to pick its action template (access → outreach templates, service → referral/pathway templates).
- No new numbers are produced (reasons reuse facts already passed through the validator's `extra` list; the 5-point municipality threshold is added to it).

## Data changes

- Ingest: add 6103 male/female county rows (new `gender` field on `IndicatorValue`, default "total"; existing code filters `gender === "total"` unless a lens asks otherwise).
- No new external services for the core. NORDCAN only if the stretch path is verified.

## Testing

- `barriers.test.ts`: each rule 1–5, the matching pairs, the equity reason threshold (|rho| ≥ 0.4), the 5-point municipality reason, and no findings when nothing is behind.
- Start screen: a route test that each path builds the right URL; the "Left behind" lens param opens the right section.
- Men vs women: ingest counts (23 counties × 2 sexes for 2024) and the "women-only" message for breast/cervical.
- Manual: walk all four paths for Helsinki (960), Pohjois-Pohjanmaa (973, "none" pattern) and Åland (956).

## Open questions for the team

1. Should the start screen replace the map at `/`, or sit above it on the same page? (Draft: replace, and keep the map at `/radar`.)
2. Is the Nordic path worth a verification spike tonight, or drop it?
3. Which path opens the demo? (Suggestion: "Who is being left behind?" for Helsinki, because it shows equity, the barrier lens and actions in one flow.)
