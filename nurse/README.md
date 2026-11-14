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

The board components (`src/components/staff/`) and the sample model and store (`src/lib/sample/`) are copies from `web/`. The old `/staff` page there still works, so for now a fix to the shared logic goes into both places. Keep the storage key `lapi.demo.v3`, the channel name `lapi-demo` and `seed.ts` identical in both apps, or the live sync stops. Both apps seed the same storage, so whichever loads first would otherwise decide the demo data.

## Demo data

97 invented people in Helsinki, Espoo and Vantaa (`src/lib/sample/seed.ts`). Most have a mother tongue other than Finnish or Swedish, for example Somali, Arabic, Russian, Estonian, Ukrainian, Kurdish, Persian, Dari, Albanian or Vietnamese, because screening reaches minority-language speakers least. The optional fields `area` (neighbourhood) and `homeLanguage` place each person on the map and show their language on the board.

## Pages

- `/nurse`: the board, with every sample and the stuck ones flagged.
- `/nurse/robots`: the pickup robots on a real map of the capital region. Each robot shows where it is, the street route it follows, and whether it is on the way, at the door, waiting too long or returning. The page also lists samples taken with no pickup booked, and recent trips.

The samples hold no robots. `src/lib/robots/fleet.ts` builds the fleet from the sample events: 30 robots across six hubs. Each pickup booking goes to a free robot from the person's hub, so every tab shows the same assignment.

**Simulate other households** (on by default, robots page only): while the page is open, one robot leaves every hub at once when the map is quiet, then the next waiting sample gets a robot every 3 seconds when its hub has one free, so about 15 robots are out at a time. The 60 waiting samples last about three minutes; **Reset demo** starts again. Each household hands its sample over a few seconds after the robot arrives. Four households (Kamal T. in Malmi among them) take 75 seconds, so the "waiting too long" flag appears. The simulation never touches the phone user (`me`). It writes ordinary events, so the board shows the same progress. **Reset demo** brings the waiting samples back.

## Map services

The map loads from the internet when the page opens. Only map tile coordinates and the coordinates of the invented homes and hubs leave the browser.

- Base map: Esri's World Light Gray Canvas, no API key. (CARTO now requires a key, and OpenStreetMap's own tile servers blocked our requests.)
- Street routes: the FOSSGIS OSRM walking router at routing.openstreetmap.de, using OpenStreetMap data. Routes are cached in `localStorage`. If the router is unreachable, the map draws a curve instead.

Both services are fine for a demo, but not for production volume. Before a real deployment, pick a provider with terms that fit.

## Samples waiting for a nurse

When a robot is back at its hub with a sample, the sample gets the flag "Sample has arrived: collect it from the robot and register it at the lab". The board shows the flag and a **Collected and registered at the lab** button. The robots page lists the waiting samples per hub, with one button per hub, and turns the hub orange on the map.

This is where `nurse/` differs from `web/` on purpose: in `web/`, putting the sample in the robot registers it at the lab at once (`store.ts`). So the phone user's own sample skips this step, and the flag exists only in the nurse app's copy of `model.ts`.

The map zooms with the scroll wheel, a pinch or the + and − buttons. **Whole region** zooms back out.

## Robot speed

Simulated robots drive at about 6 km/h, a typical speed for sidewalk delivery robots, so a trip takes 5 to 40 minutes each way depending on the distance. Each booking stores its own driving time (`travelMs` on the `pickupBooked` event), and the board's "on the way" and "at the door" stages use it. The **Speed** selector on the robots page runs new trips 10 or 60 times faster for a demo.

When the page opens on a quiet map, up to three robots per hub are booked as if they had left earlier, so the fleet is already part-way to its homes. After that, one new booking is made every 3 minutes in real time (every 3 seconds at 60×).

The phone user's own robot still takes the fixed 20 seconds from `web/`, so the phone demo stays short. The earlier figures in this file (a robot every 3 seconds, about three minutes of samples) describe the 60× speed.

## Anonymous destinations and demo speed

The robots page and map never show a person's name. Each pickup has a code such as "Pickup 4821" (`pickupCode` in `fleet.ts`), and the page shows the code, the neighbourhood and the language. The board shows the same code next to the person for samples in the pickup steps, so a nurse can match them.

The **Speed** selector now offers Real time, Demo speed (20× faster, the default) and 60×. At demo speed a trip takes under two minutes each way and a new booking is made every 9 seconds.

## Look

The nurse app uses the same HUS styling as the user app in `web/`: `globals.css` is a copy of `web/src/app/globals.css` (plus the map rules at the end), with Open Sans for text and Poppins for headings. The robots map follows the kit's tracking map: the road still to drive is brand blue with a white outline, the part behind is grey dots, and the destination is a house marker. When the theme changes in `web/`, copy the stylesheet again.
