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

The board components (`src/components/staff/`) and the sample model and store (`src/lib/sample/`) are copies from `web/`. The old `/staff` page there still works, so for now a fix to the shared logic goes into both places. Keep the storage key `lapi.demo.v1` and the channel name `lapi-demo` identical in both apps, or the live sync stops.

## Pages

- `/nurse`: the board, with every sample and the stuck ones flagged.
- `/nurse/robots`: the pickup robots on a map of Päijät-Häme, with a Helsinki inset. Each robot shows where it is, its route, and whether it is on the way, at the door, waiting too long or returning. The page also lists samples taken with no pickup booked, and recent trips.

The samples hold no robots. `src/lib/robots/fleet.ts` builds the fleet from the sample events: six robots, four at the Lahti lab and two at the Helsinki hub. Each pickup booking goes to a free robot from the person's depot, so every tab shows the same assignment.
