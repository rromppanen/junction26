# web: the farmagusta main app

The project landing page, the person's phone app and the shared demo log. The nurse board is a separate app in [`../nurse`](../nurse/README.md); this app forwards `/nurse/*` to it, so both run on one address. What the project is and why: [the root README](../README.md) and [docs/idea.md](../docs/idea.md).

## Run and check

```sh
npm ci
npm run dev                  # http://localhost:3000
npm run check                # lint, tests and production build, as in CI
npm run smoke -- <base url>  # loads every page once; fails on any error
```

Start the nurse app as well (`cd ../nurse && npm run dev`, port 3100) to use `/nurse`. Set `NURSE_URL` when it runs elsewhere.

Optional settings in `.env.local`, which is never committed:

| Variable | Used for |
| --- | --- |
| `NURSE_URL` | Where `/nurse` is forwarded. Default `http://localhost:3100` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | The shared event log behind `/api/samples`. Without them, the log lives in the dev server's memory |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Only the unlinked question box at `/api/kit/ask` |

## Pages and routes

| Path | What it is |
| --- | --- |
| `/` | Project landing page with phone and nurse demo links |
| `/kit` | The phone app: language choice, what the test is, the sampling steps, robot pickup booking, live tracking and handover |
| `/reel` | Scripted phone walkthrough for demo recording |
| `/staff` | Compatibility redirect to `/nurse` |
| `/api/samples` | The shared demo event log, so a phone and a laptop see each other's actions |
| `/api/walk` | Walking routes for the robot, from the public OSRM router with Valhalla as fallback |
| `/api/kit/ask` | A Gemini question box limited to fixed HUS kit facts. No page links to it |

## Code

| Where | What |
| --- | --- |
| `src/lib/sample/` | The sample model: an event log per person, the stage derived from it, the flag rules, the robot simulation and the sync between tabs and devices. Counterparts in `../nurse`; keep event and storage contracts compatible, preserving its separate nurse intake step |
| `src/lib/kit/` | Kit content and the nine translations (`text/`), pickup slots and robot routes |
| `src/components/kit/` | The phone app's screens, step animations and tracking map |
| `src/data/` | Finnish Cancer Registry figures (`registry.json`, from `npm run ingest:registry`) and the wait to colonoscopy read from the Registry's chart (`registryWaits.ts`) |
