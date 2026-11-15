# Nurse workspace

The nurse side of farmagusta, our Junction 2026 screening demo. A full-height map is the main workspace; patient actions and filters open alongside it. Both `/nurse` and `/nurse/robots` open this workspace.

## Run and check

Use the Node version in `.nvmrc`, then:

```sh
npm ci
npm run dev          # http://localhost:3100/nurse
npm run check        # lint, tests and production build, as in CI
```

Start the main app in a second terminal (`cd ../web && npm ci && npm run dev`). Open `http://localhost:3000/nurse` to use both apps on one origin. `web/` forwards `/nurse/*` here; set its `NURSE_URL` when the nurse app runs elsewhere (default `http://localhost:3100`).

With both apps running, `npm run smoke -- http://localhost:3000` checks the nurse routes through the main app. Without an argument, it checks this app directly on port 3100.

## Demo workflow

- Select a person, robot or hub on the map to inspect it and take action.
- **Patients** opens a searchable queue, with people needing attention first. Open a patient to send a reminder, record a call, register an arrived sample or book a colonoscopy when available. The queue starts with 12 people and can show more or fewer.
- **Filters** contains expandable groups for participants, labs and locations, map layers and screening stages. Selected labs and locations also limit the patient queue; the queue has its own search and attention filter.
- When a complete robot run returns to its hub, its samples become ready for lab registration. A nurse can register them from the patient drawer or together from the hub.
- **Filters → Demo settings** controls simulated households, speed for new trips (real time, 20× by default, or 60×) and reset. Reset clears recorded actions in both apps after confirmation.

The demo has 97 invented participants and 30 robots across six hubs in Helsinki, Espoo and Vantaa. Each robot can collect up to four samples on a run, with one compartment per sample. Destinations on the map use pickup codes; names are shown in the patient workspace. Robots, lab results and bookings are simulated.

## Code and shared state

| Where | Responsibility |
| --- | --- |
| `src/components/robots/RobotsView.tsx` | Map workspace, selection, filters, simulation and hub intake |
| `src/components/robots/LiveMap.tsx` | Leaflet map, robot routes and markers |
| `src/components/staff/` | Patient queue, drawer, actions and display helpers |
| `src/lib/robots/` | Fleet assignment, multi-stop runs, simulation and route cache |
| `src/lib/sample/` | Sample events, stage and flag rules, seed data and sync |

The sample model, store, seed and sync code have counterparts in `../web/src/lib/sample/`. Keep their event and storage contracts compatible. Both apps use `farmagusta.demo.v4` in `localStorage`, the `farmagusta-demo` BroadcastChannel and the same seed data. Same-origin tabs sync locally; across devices, both apps poll the event log at `/api/samples`, served by `web/`.

The two apps deliberately differ at lab intake: the phone demo registers its own sample at the lab immediately after handover. Nurse-simulated samples wait until their robot run returns, then require nurse registration. Preserve this distinction when changing shared logic. The tests cover cross-app event labels and the nurse workflow.

## Maps and timing

The map uses Esri's World Light Gray Canvas tiles and the public FOSSGIS OSRM walking router (`routing.openstreetmap.de`), with OpenStreetMap route data. Routes are cached in `localStorage`. Later stops in a multi-stop run, and routes unavailable from the router, use drawn curves. These services require network access; choose suitable provider terms before a production deployment.

Robot travel times use an approximate 6 km/h speed and the selected simulation multiplier. The phone user's own trip keeps its fixed 20-second timing so the phone demo stays short.

## Styling

The app has its own `src/app/globals.css`, including map and workspace rules. It shares the phone app's Open Sans and Poppins typography and brand colours; the stylesheets serve different layouts and should be edited independently.
