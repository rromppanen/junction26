import type { Map as MlMap, Marker, GeoJSONSource, LngLatLike } from "maplibre-gl";
import { splitRoute, type LngLat } from "@/lib/kit/route";
import { addRouteLayers, hideTravelled, markerEl } from "@/components/kit/TrackingMap";
import { FLEET_HUBS, FLEET_TRIPS, HYPE_ROUTE } from "@/data/reelRoute";
import fleetRoutes from "@/data/reelFleetRoutes.json";

/** Each other robot's street route from its hub, precomputed by scripts/fetch-reel-routes.ts (same order as FLEET_TRIPS). */
const ROUTES = fleetRoutes.routes as LngLat[][];
if (ROUTES.length !== FLEET_TRIPS.length) console.warn("reel: run scripts/fetch-reel-routes.ts, the fleet routes are out of date");
const routeOf = (i: number): LngLat[] => ROUTES[i] ?? [FLEET_HUBS[FLEET_TRIPS[i].hub], FLEET_TRIPS[i].to];
/** How fast the other robots creep along their routes during the overview (share of the route per second). */
const CREEP_PER_S = 1 / 80;
/** How long the other robots, hubs and paths take to fade away when the camera flies back to ours. */
const FLEET_OUT_MS = 600;

const STYLE = "https://tiles.openfreemap.org/styles/positron";

export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

function line(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

/** A marker whose inner element can be scaled without fighting MapLibre's own positioning transform. */
function scalable(inner: HTMLElement, extraClass = ""): { outer: HTMLElement; inner: HTMLElement } {
  const outer = document.createElement("div");
  outer.className = extraClass;
  inner.style.transformOrigin = "50% 50%";
  outer.appendChild(inner);
  return { outer, inner };
}

/** A fleet marker: pops in, and fades out with the rest of the fleet (.reel-fleet-out on the map). */
function fleetItem(inner: HTMLElement): HTMLElement {
  const outer = document.createElement("div");
  const mid = document.createElement("div");
  mid.className = "reel-fleet-item reel-pop";
  mid.appendChild(inner);
  outer.appendChild(mid);
  return outer;
}

function smallRobot(): HTMLElement {
  const el = document.createElement("div");
  el.className = "flex size-7 items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] shadow-md";
  el.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="3" fill="#fff"/><circle cx="7" cy="19" r="2" fill="#fff"/><circle cx="12" cy="19" r="2" fill="#fff"/><circle cx="17" cy="19" r="2" fill="#fff"/></svg>';
  return el;
}

export type FleetMap = {
  map: MlMap;
  /** Our robot's share of its route, 0..1. */
  setProgress(p: number): void;
  /** Jump to the phone map's view as it looks when blown up `scale` times: same picture, drawn natively. */
  match(center: LngLatLike, zoom: number, scale: number): void;
  /** Zoom out to the whole capital region. */
  flyOut(ms: number): Promise<void>;
  /** Pop in the hubs, then the robots, one by one; `onCount` hears the running robot count. */
  popFleet(ms: number, onCount: (n: number) => void): Promise<void>;
  /** Fly back in to a view of the phone's map blown up `scale` times, as match() would show it. */
  flyBack(center: LngLatLike, zoom: number, scale: number, ms: number): Promise<void>;
  remove(): void;
};

/**
 * The full-screen map of the reel's fleet overview. Created hidden at load (so the region's tiles are
 * fetched early), then shown over the phone at the moment the phone's map fills the screen.
 */
export async function createFleetMap(container: HTMLElement): Promise<FleetMap> {
  const ml = await import("maplibre-gl");
  const all: LngLat[] = [...Object.values(FLEET_HUBS), ...FLEET_TRIPS.map((t) => t.to), ...HYPE_ROUTE];
  const lngs = all.map((c) => c[0]);
  const lats = all.map((c) => c[1]);
  const region: [LngLat, LngLat] = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  const regionPadding = { top: 140, bottom: 90, left: 90, right: 90 };

  const map: MlMap = new ml.Map({
    container,
    style: STYLE,
    bounds: region,
    fitBoundsOptions: { padding: regionPadding },
    attributionControl: false,
    interactive: false,
    fadeDuration: 0,
    maxTileCacheSize: 800,
  });
  map.addControl(new ml.AttributionControl({ compact: true }), "bottom-right");
  await new Promise<void>((resolve) => map.once("load", () => resolve()));
  await warmUp(map, region, regionPadding);

  const route = HYPE_ROUTE;
  map.addSource("fleet", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({ id: "fleet", type: "line", source: "fleet", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#004b87", "line-width": 2.5, "line-opacity": 0.4, "line-opacity-transition": { duration: FLEET_OUT_MS, delay: 0 } } });
  addRouteLayers(map, route);

  // Our trip: the same markers as the phone's map.
  const ours = [
    { ...scalable(markerEl("hub", "Sample hub")), at: route[0] },
    { ...scalable(markerEl("home", "Home")), at: route[route.length - 1] },
  ];
  const robot = scalable(markerEl("robot", "Robot"), "reel-ours");
  const oursMarkers = ours.map((m) => new ml.Marker({ element: m.outer }).setLngLat(m.at).addTo(map));
  const robotMarker = new ml.Marker({ element: robot.outer }).setLngLat(route[0]).addTo(map);

  // While the view is the phone's blown up, markers and the line are blown up too; they shrink to their
  // own size as the map zooms out, as if they were part of the picture until then.
  let matchZoom = 0;
  let matchScale = 1;
  const applyScale = () => {
    const k = Math.min(matchScale, Math.max(1, matchScale * 2 ** (map.getZoom() - matchZoom)));
    for (const el of [robot.inner, ...ours.map((o) => o.inner)]) el.style.transform = `scale(${k})`;
    map.setPaintProperty("ahead-casing", "line-width", 9 * k);
    map.setPaintProperty("ahead", "line-width", 5 * k);
  };
  map.on("move", applyScale);

  const fleetMarkers: { marker: Marker; route: LngLat[]; at: number; shownAt: number }[] = [];
  const hubMarkers: Marker[] = [];
  let raf = 0;
  const tick = () => {
    raf = 0;
    if (!fleetMarkers.length) return;
    const now = performance.now();
    // The other robots creep along their streets, so the overview looks alive.
    for (const f of fleetMarkers) {
      const t = Math.min(0.97, f.at + ((now - f.shownAt) / 1000) * CREEP_PER_S);
      f.marker.setLngLat(splitRoute(f.route, t).at);
    }
    raf = requestAnimationFrame(tick);
  };

  const fly = (opts: { center: LngLatLike; zoom: number }, ms: number) =>
    new Promise<void>((resolve) => {
      map.once("moveend", () => resolve());
      map.flyTo({ ...opts, duration: ms, easing: easeInOutSine, essential: true, curve: 1.2 });
    });

  return {
    map,
    setProgress(p) {
      hideTravelled(map, p);
      robotMarker.setLngLat(splitRoute(route, p).at);
    },
    match(center, zoom, scale) {
      matchZoom = zoom;
      matchScale = scale;
      map.jumpTo({ center, zoom, bearing: 0, pitch: 0 });
      applyScale();
    },
    flyOut(ms) {
      const cam = map.cameraForBounds(region, { padding: regionPadding });
      return fly({ center: cam?.center ?? map.getCenter(), zoom: cam?.zoom ?? 10 }, ms);
    },
    async popFleet(ms, onCount) {
      container.classList.add("reel-overview");
      const hubs = Object.entries(FLEET_HUBS).filter(([id]) => id !== "kivenlahti");
      for (const [, at] of hubs) {
        hubMarkers.push(new ml.Marker({ element: fleetItem(markerEl("hub", "Hub")) }).setLngLat(at).addTo(map));
        await wait(70);
      }
      // Robots come quickly at first and then ever faster, the way a fleet "fills in".
      const n = FLEET_TRIPS.length;
      const budget = ms - hubs.length * 70;
      const times = FLEET_TRIPS.map((_, i) => budget * Math.sqrt((i + 1) / n));
      let prev = 0;
      const lines: GeoJSON.Feature<GeoJSON.LineString>[] = [];
      for (let i = 0; i < n; i++) {
        await wait(times[i] - prev);
        prev = times[i];
        const route = routeOf(i);
        const at = FLEET_TRIPS[i].at;
        const marker = new ml.Marker({ element: fleetItem(smallRobot()) }).setLngLat(splitRoute(route, at).at).addTo(map);
        fleetMarkers.push({ marker, route, at, shownAt: performance.now() });
        // The other robots creep along only once the overview shows them.
        if (!raf) raf = requestAnimationFrame(tick);
        lines.push(line(route));
        (map.getSource("fleet") as GeoJSONSource).setData({ type: "FeatureCollection", features: lines });
        onCount(i + 2); // the other robots plus ours
      }
    },
    flyBack(center, zoom, scale, ms) {
      container.classList.remove("reel-overview");
      // The rest of the fleet bows out as the camera leaves, so only our robot is left when it lands.
      container.classList.add("reel-fleet-out");
      map.setPaintProperty("fleet", "line-opacity", 0);
      matchZoom = zoom;
      matchScale = scale;
      return fly({ center, zoom }, ms);
    },
    remove() {
      cancelAnimationFrame(raf);
      for (const m of [...oursMarkers, robotMarker, ...hubMarkers, ...fleetMarkers.map((f) => f.marker)]) m.remove();
      map.remove();
    },
  };
}

/**
 * Visits the views the reel will fly through, hidden, so their tiles are cached before the camera gets
 * there and the zoom-out never shows unloaded squares.
 */
async function warmUp(map: MlMap, region: [LngLat, LngLat], padding: { top: number; bottom: number; left: number; right: number }) {
  const cam = map.cameraForBounds(region, { padding });
  const end = HYPE_ROUTE[HYPE_ROUTE.length - 1];
  const mid = HYPE_ROUTE[Math.floor(HYPE_ROUTE.length / 2)];
  const views: { center: LngLatLike; zoom: number }[] = [
    { center: HYPE_ROUTE[0], zoom: 17.5 }, { center: mid, zoom: 17.5 }, { center: end, zoom: 17.5 },
    { center: mid, zoom: 16 }, { center: mid, zoom: 14.5 }, { center: mid, zoom: 13 }, { center: mid, zoom: 11.5 },
  ];
  if (cam?.center && cam.zoom !== undefined) views.push({ center: cam.center, zoom: cam.zoom });
  for (const v of views) {
    map.jumpTo(v);
    await Promise.race([new Promise<void>((r) => map.once("idle", () => r())), wait(6000)]);
  }
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, Math.max(0, ms)));
}
