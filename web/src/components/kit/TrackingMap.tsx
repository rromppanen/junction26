"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker, GeoJSONSource, LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { splitRoute, type LngLat } from "@/lib/kit/route";

/** OpenFreeMap: free vector tiles from OpenStreetMap data, no key needed. */
export const STYLE = "https://tiles.openfreemap.org/styles/positron";

const PADDING = { top: 56, bottom: 48, left: 40, right: 40 };

function boundsOf(route: LngLat[]): LngLatBoundsLike {
  const lngs = route.map((c) => c[0]);
  const lats = route.map((c) => c[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

function line(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

export function markerEl(kind: "robot" | "home" | "hub", label: string): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("aria-label", label);
  if (kind === "robot") {
    el.className = "flex size-11 items-center justify-center rounded-full border-2 border-white bg-[var(--brand)] shadow-lg";
    el.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="3" fill="#fff"/><circle cx="7" cy="19" r="2" fill="#fff"/><circle cx="12" cy="19" r="2" fill="#fff"/><circle cx="17" cy="19" r="2" fill="#fff"/><path d="M5 7V2l5 1.5L5 5" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  } else if (kind === "home") {
    el.className = "flex size-9 items-center justify-center rounded-full border-2 border-white bg-[var(--ink)] shadow-md";
    el.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="#fff"/></svg>';
  } else {
    el.className = "size-4 rounded-sm border-2 border-white bg-[var(--muted)] shadow";
  }
  return el;
}

const ROUTE_COLOR = "#004b87";

/**
 * Draws the whole route once; hideTravelled() then hides the part behind the robot. Cutting the line
 * with a gradient is a cheap paint change, where replacing the line's data every frame made the map
 * re-process it in its worker each time and dropped frames.
 */
export function addRouteLayers(m: MlMap, route: LngLat[]) {
  m.addSource("ahead", { type: "geojson", data: line(route), lineMetrics: true });
  m.addLayer({ id: "ahead-casing", type: "line", source: "ahead", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9 } });
  m.addLayer({ id: "ahead", type: "line", source: "ahead", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ROUTE_COLOR, "line-width": 5 } });
  hideTravelled(m, 0);
}

/** Shows only the route still ahead of the robot, `p` (0..1) of the way along. */
export function hideTravelled(m: MlMap, p: number) {
  const cut = Math.min(1, Math.max(0, p));
  const gradient = (color: string) => ["step", ["line-progress"], "rgba(0,0,0,0)", cut, color];
  // line-progress is measured along the line on the map, the same share splitRoute() uses for the robot.
  m.setPaintProperty("ahead-casing", "line-gradient", gradient("#ffffff"));
  m.setPaintProperty("ahead", "line-gradient", gradient(ROUTE_COLOR));
}

/**
 * A live map of the robot's route, in the style of a courier tracker: only the road still ahead is
 * drawn, and the robot moves along it as `progress` goes from 0 to 1.
 */
export function TrackingMap({ route, progress, labels, pixelRatio, onMap }: {
  route: LngLat[]; progress: number; labels: { robot: string; home: string; hub: string; error: string };
  /** Render the map sharper than the screen needs (the demo reel zooms into it). */
  pixelRatio?: number;
  /** Called once the map has loaded and framed the route. */
  onMap?: (map: MlMap) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const robot = useRef<Marker | null>(null);
  const hub = useRef<Marker | null>(null);
  const home = useRef<Marker | null>(null);
  const routeRef = useRef(route);
  routeRef.current = route;
  const ready = useRef(false);
  const latest = useRef(progress);
  const [failed, setFailed] = useState(false);
  latest.current = progress;

  function draw(p: number) {
    const m = map.current;
    if (!m || !ready.current) return;
    const { at } = splitRoute(routeRef.current, p);
    hideTravelled(m, p);
    robot.current?.setLngLat(at);
  }

  useEffect(() => {
    let cancelled = false;
    let instance: MlMap | null = null;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelled || !box.current) return;
        instance = new ml.Map({
          container: box.current,
          style: STYLE,
          bounds: boundsOf(routeRef.current),
          fitBoundsOptions: { padding: PADDING },
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          ...(pixelRatio ? { pixelRatio } : {}),
        });
        // Credit sits at the top: the bottom of the map is under the arrival sheet.
        instance.addControl(new ml.AttributionControl({ compact: true }), "top-right");
        map.current = instance;
        instance.on("error", (e) => {
          // A missing tile is not fatal; a style that never loads is.
          if (!instance?.isStyleLoaded() && !ready.current) console.warn("map", e.error?.message);
        });
        instance.on("load", () => {
          if (!instance) return;
          addRouteLayers(instance, routeRef.current);
          const r = routeRef.current;
          hub.current = new ml.Marker({ element: markerEl("hub", labels.hub) }).setLngLat(r[0]).addTo(instance);
          home.current = new ml.Marker({ element: markerEl("home", labels.home) }).setLngLat(r[r.length - 1]).addTo(instance);
          robot.current = new ml.Marker({ element: markerEl("robot", labels.robot) }).setLngLat(r[0]).addTo(instance);
          ready.current = true;
          // The route may have changed (location arrived) while the style loaded: frame the current one.
          instance.fitBounds(boundsOf(r), { padding: PADDING, duration: 0 });
          draw(latest.current);
          onMap?.(instance);
        });
        // If the style has not loaded in 12 s (offline, tiles blocked), say so instead of showing a blank box.
        setTimeout(() => {
          if (!cancelled && !ready.current) setFailed(true);
        }, 12_000);
      } catch (e) {
        console.warn("map", e);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      ready.current = false;
      instance?.remove();
      map.current = null;
      robot.current = null;
      hub.current = null;
      home.current = null;
    };
    // The map is created once; labels only name the markers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new route (the person's real location arrived): move the end markers and frame the whole route.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    (m.getSource("ahead") as GeoJSONSource | undefined)?.setData(line(route));
    hub.current?.setLngLat(route[0]);
    home.current?.setLngLat(route[route.length - 1]);
    m.fitBounds(boundsOf(route), { padding: PADDING, duration: 900 });
    draw(latest.current);
  }, [route]);

  useEffect(() => {
    draw(progress);
  }, [progress]);

  // The demo reel sharpens the map only while its camera zooms in.
  useEffect(() => {
    if (pixelRatio && map.current && ready.current) map.current.setPixelRatio(pixelRatio);
  }, [pixelRatio]);

  return (
    <div className="relative h-full w-full bg-[#eef2f1]">
      {/* MapLibre makes its container position: relative, so size it by height, not by inset. */}
      <div ref={box} className="h-full w-full" />
      {failed && (
        <p className="absolute inset-x-4 top-4 rounded-lg bg-white/95 p-3 text-sm text-muted shadow">{labels.error}</p>
      )}
    </div>
  );
}
