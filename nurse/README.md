# Nurse board app

The screening nurse's board as its own Next.js app. It shows every sample on one board and flags the stuck ones.

It is served under the base path `/nurse`. The main app in `../web` forwards `/nurse/*` here, so in the browser both apps share one origin. This matters because the board and the phone app (`/kit`) sync through `localStorage` and `BroadcastChannel`. Those work only within a single origin.

## Run it

```sh
npm ci
npm run dev          # http://localhost:3100/nurse
```

In a second terminal, start the main app: `cd ../web && npm run dev`. Then open `/nurse` on the main app's port. The board now updates live when you act in `/kit` in another tab.

If the nurse app runs elsewhere, set `NURSE_URL` for the web app, for example `NURSE_URL=https://nurse.example.com`. The default is `http://localhost:3100`.

## Check

```sh
npm run check        # lint, tests and build, as in CI
npm run smoke -- http://localhost:3000   # loads /nurse through the main app
```

## Relation to web/

The board components (`src/components/staff/`) and the sample model and store (`src/lib/sample/`) are copies from `web/`. The old `/staff` page there still works, so for now a fix to the shared logic goes into both places. Keep the storage key `lapi.demo.v2`, the channel name `lapi-demo` and `seed.ts` identical in both apps, or the live sync stops. Both apps seed the same storage, so whichever loads first would otherwise decide the demo data.

## Demo data

32 invented people in Helsinki, Espoo and Vantaa (`src/lib/sample/seed.ts`). Most have a mother tongue other than Finnish or Swedish, for example Somali, Arabic, Russian, Estonian, Ukrainian, Kurdish, Persian, Dari, Albanian or Vietnamese, because screening reaches minority-language speakers least. The optional fields `area` (neighbourhood) and `homeLanguage` place each person on the map and show their language on the board.

## Pages

- `/nurse`: the board, with every sample and the stuck ones flagged.
- `/nurse/robots`: the pickup robots on a real map of the capital region. Each robot shows where it is, the street route it follows, and whether it is on the way, at the door, waiting too long or returning. The page also lists samples taken with no pickup booked, and recent trips.

The samples hold no robots. `src/lib/robots/fleet.ts` builds the fleet from the sample events: 13 robots across six hubs. Each pickup booking goes to a free robot from the person's hub, so every tab shows the same assignment.

**Simulate other households** (on by default, robots page only): while the page is open, the next waiting sample gets a robot every 9 seconds when its hub has one free. Each household hands its sample over a few seconds after the robot arrives. One household (Kamal T., Malmi) takes 75 seconds, so the "waiting too long" flag appears. The simulation never touches the phone user (`me`). It writes ordinary events, so the board shows the same progress. **Reset demo** brings the waiting samples back.

## Map services

The map loads from the internet when the page opens. Only map tile coordinates and the coordinates of the invented homes and hubs leave the browser.

- Base map: Esri's World Light Gray Canvas, no API key. (CARTO now requires a key, and OpenStreetMap's own tile servers blocked our requests.)
- Street routes: the FOSSGIS OSRM walking router at routing.openstreetmap.de, using OpenStreetMap data. Routes are cached in `localStorage`. If the router is unreachable, the map draws a curve instead.

Both services are fine for a demo, but not for production volume. Before a real deployment, pick a provider with terms that fit.
