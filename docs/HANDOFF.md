# Handoff: Gap Radar (Junction 2026, AstraZeneca challenge)

Written Sat 14.11.2026 ~00:30 to continue in a new chat. Read this first, then `docs/challenge.md`.

## The project
- **Event:** Junction 2026 (Espoo). Final submission **Sun 15.11 10:00** (name, punchline, description, tech, demo link, source link, deck PDF, video max 2:00). **Whole team at peer review Sun 10:30** or lose main-prize eligibility. Pre-submission was due Fri 23:55 (user said they'd handle it; confirm it was done).
- **Challenge:** AstraZeneca "Equal Care Across Finland". Judging: Actionability 30%, Insight 25%, Data quality & transparency 20%, Execution 15%, Clarity 10%. Must: source every claim, cover a Goal 3 indicator, give actionable proposals, working demo.
- **Bounties we target:** Google DeepMind Gemini API (in use), Context.dev (code in, key broken), Aiven (not done).
- **Main user:** a wellbeing services county's cancer care lead (decided).
- **Product:** Gap Radar, a Next.js 15 + TypeScript app in `web/`. All numbers come from public data or pure code; Gemini only writes text, and a validator rejects any number not in the facts.

## Repo and branches
- Repo `~/code/junction26`, GitHub `rromppanen/junction26`.
- `main`: v2 features merged (PR #4) + UI simplification (PR #5).
- **`feat/start-screen`** (current, pushed through `6582e84`): start-screen/barrier-lens design spec, mentor notes, scenario tool, "Reach them" kit, draft script check. **No PR opened yet.**
- **Uncommitted:** `web/data/cancer-registry/mortality-2020-2024.csv` (cancer mortality 2020–2024 per county, age-standardised Finland 2014, by sex; all 23 counties + YTA + whole country, exported from tilastot.syoparekisteri.fi). Commit it.

## How to run
- Node 22: `cd web && PATH=/Users/Daniel/.nvm/versions/node/v22.23.4/bin:$PATH npm run dev` (port 3000). `npm run data` fetches the Sotkanet + Statistics Finland snapshot if missing (it's generated, gitignored); `npm run data -- --force` refreshes.
- Tests `npm test` (109 passing), `npx tsc --noEmit -p .`, `npx eslint src`. Don't run `npm run build` while the dev server runs (corrupts `.next`; fix = stop server, `rm -rf web/.next`, restart).
- Keys in `web/.env.local` (gitignored; the agent can't read it): `GEMINI_API_KEY` works; model default `gemini-3.5-flash-lite` (override with `GEMINI_MODEL`, e.g. `gemini-3.8-flash` for the demo; heavier models gave 503 under load). **`CONTEXT_DEV_API_KEY` is invalid** (401, no `ctxt_` prefix): get a fresh secret key at context.dev/dashboard.
- CI: `.github/workflows/ci.yml` (fetch data, lint, test, build, gitleaks) on PRs.

## What the app does now (county page `/county/[id]`, e.g. 960 Helsinki)
1. Pathway fingerprint: where the gap starts (detection vs after detection).
2. **Scenario tool** "What if X raised screening?": per screening programme, compare Finland level / 80% target / best quarter / own slider in extra people per 1,000, people/year, €/year, cancers found, € per cancer. Inputs: invited per year, cost per screen, cancers per 1,000 screened. Only cervical €20 HPV test default is filled (Virtanen 2015); the rest show "enter your figure".
3. Actions (Gemini, sourced, owner/timeframe/strategy goal; validator-checked; deterministic fallback).
4. Who is left behind: lagging municipalities + area-level correlations (education, foreign background, unemployment).
5. **Reach them kit:** target areas, top 5 foreign languages (Statistics Finland table 11rm, 2025), rule-based actions, Gemini invitation + SMS drafts per language with English back-translation; automatic checks (alphabet per language, `[phone]`/`[link]`, SMS ≤ 160) with one retry, else withheld and shown.
6. Peer twin (similar county doing better + its web pages via Context.dev).
7. Start measuring kit (3 monthly delay measures per THL 21/2016, CSV at `/county/[id]/measure`).
8. Finnish board memo `/county/[id]/memo`; radar map at `/`.
Indicators (Sotkanet): breast 3621, colorectal 6103, cervical 3620 screening (Goal 2: 80% in every county); breast 3625 and bowel 3627 survival (Goal 3). 308 municipalities with equity + language data.

## Key evidence and findings
- Strategy headline targets (strategy p. 5): Goal 2 = 80% screening in every county, ≥70% stage I–II; Goal 3 = Nordic-level survival in poor-prognosis cancers, mortality −10% from 13,300/yr, treatment within THL 21/2016 target times. General target times exist; cancer-specific ones are planned 2026–2028 (roadmap p. 56).
- Roadmap p. 11: diagnosis twice as long via public primary care (lymphoma study). p. 13: outcomes worse > 50 km from treatment.
- **AstraZeneca mentor feedback** (`docs/research/2026-11-13-astrazeneca-mentor-feedback.md`): not one recommendation but a tool to compare options and **cost**; cost-benefit decides; user group is ours to choose; patients can't see their pathway; nobody monitors guidelines in real time; make the strategy real. Mentor Laura's number is on the challenge page.
- **Cancer Registry stats app (tilastot.syoparekisteri.fi), Shiny, no API, CSV per selection:** incidence and mortality per county (23); **stage at diagnosis and education only nationally** (stage is mostly "unknown", ~60%); **"Toteamistapa" (how found, e.g. screening vs symptoms) per county 2020–2024** (export not finished); survival only national + 5 YTA. Export trick: after every area change re-set `tabu` and `value_type`, click `#submit`, then fetch `#download_csv` href.
- **Sourced default values for the scenario tool (found, not yet in the app):** breast 4.7 cancers per 1,000 screens, asymptomatic women (Finnish Mass Screening Registry, Acta Oncologica, https://medicaljournalssweden.se/actaoncologica/article/view/28618); colorectal ~2.7 per 1,000 FIT returners, 64% participation, 6% positive (Southwest Finland 2022–23, Scand J Gastroenterol 2025, https://utupub.fi/handle/10024/179904); cervical HPV test €20 (Virtanen 2015). **No public Finnish per-screen cost for mammography or FIT**: label any default as an assumption. Screening ages (decree 339/2011 + 2021 amendment): breast 50–69 every ~2 y, cervical 30–60 every 5 y, colorectal 56–74 every 2 y.

## Scoring (my estimate vs AstraZeneca criteria): ~3.7/5
Actionability 4, Insight 3.5, Data quality 4.5, Execution 3 (not deployed), Clarity 3 (Helsinki page ~2,400 words, 9 sections). Junction: Innovation 4, Impact 3.5, Implementation 3.5.

## TODO (user asked to do all of these; in this order)
1. **Scenario tool upgrade:** sliders + default values for euros/detection/invited (use the sourced defaults above; invited per year = residents in target age ÷ interval, Statistics Finland population by age; mark assumptions clearly); better actionability (e.g. highlight best value, a "pick this option" plan).
2. Commit the mortality CSV; finish the "Toteamistapa" per-county export; parse both into new indicators (mortality = Goal 3 headline, lower is better; share found through screening).
3. **2-minute summary box** at the top of the county page (gap, where it starts, who is missed, best scenario, first action); the rest below.
4. Barrier lens (`docs/superpowers/specs/2026-11-13-start-screen-barrier-lens-design.md`; adapt: no per-county stage data, use "how found" instead).
5. National impact line ("if every county reached 80%…").
6. Start screen (same spec).
7. Update README punchline (still says "three sourced actions"; mentors said not one recommendation) and fill `docs/idea.md`, then run the judge agent (`.claude/agents/judge.md`).
8. Open a PR for `feat/start-screen` into `main`.
9. **User-only:** Vercel deploy (root `web`, Node 22, env vars), fix Context.dev key, optionally Aiven Postgres (`DATABASE_URL`, then `npm run data -- --force`), call Laura for cost/detection figures, record the 2:00 video + deck PDF, warm county pages within 10 min of demo.

## Working rules used so far
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; commit only your files (other sessions sometimes work in this checkout); ask before pushing.
- Never invent numbers; cite every figure; area-level wording for correlations.
- SDD ledger and briefs live in `.superpowers/sdd/2026-11-13-gap-radar-v2/` (gitignored).
