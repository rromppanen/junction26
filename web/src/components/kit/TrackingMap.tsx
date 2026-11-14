"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ROBOT_ROUTE } from "@/data/robotRoute";
import { splitRoute, type LngLat } from "@/lib/kit/route";

/** OpenFreeMap: free vector tiles from OpenStreetMap data, no key needed. */
const STYLE = "https://tiles.openfreemap.org/styles/positron";

function line(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

function markerEl(kind: "robot" | "home" | "hub", label: string): HTMLElement {
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

/**
 * A live map of the robot's route, in the style of a courier tracker: the road still ahead in teal,
 * the part behind faded, and the robot moving along it as `progress` goes from 0 to 1.
 */
export function TrackingMap({ progress, labels }: { progress: number; labels: { robot: string; home: string; hub: string; error: string } }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const robot = useRef<Marker | null>(null);
  const ready = useRef(false);
  const latest = useRef(progress);
  const [failed, setFailed] = useState(false);
  latest.current = progress;

  function draw(p: number) {
    const m = map.current;
    if (!m || !ready.current) return;
    const { at, done, ahead } = splitRoute(ROBOT_ROUTE, p);
    (m.getSource("done") as GeoJSONSource | undefined)?.setData(line(done));
    (m.getSource("ahead") as GeoJSONSource | undefined)?.setData(line(ahead));
    robot.current?.setLngLat(at);
  }

  useEffect(() => {
    let cancelled = false;
    let instance: MlMap | null = null;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelled || !box.current) return;
        const bounds = new ml.LngLatBounds(ROBOT_ROUTE[0], ROBOT_ROUTE[0]);
        ROBOT_ROUTE.forEach((c) => bounds.extend(c));
        instance = new ml.Map({
          container: box.current,
          style: STYLE,
          bounds,
          fitBoundsOptions: { padding: { top: 48, bottom: 48, left: 40, right: 40 } },
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
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
          instance.addSource("done", { type: "geojson", data: line([]) });
          instance.addSource("ahead", { type: "geojson", data: line(ROBOT_ROUTE) });
          instance.addLayer({ id: "done", type: "line", source: "done", layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#9aa9b6", "line-width": 5, "line-dasharray": [0.5, 1.6] } });
          instance.addLayer({ id: "ahead-casing", type: "line", source: "ahead", layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#ffffff", "line-width": 9 } });
          instance.addLayer({ id: "ahead", type: "line", source: "ahead", layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#004b87", "line-width": 5 } });
          new ml.Marker({ element: markerEl("hub", labels.hub) }).setLngLat(ROBOT_ROUTE[0]).addTo(instance);
          new ml.Marker({ element: markerEl("home", labels.home) }).setLngLat(ROBOT_ROUTE[ROBOT_ROUTE.length - 1]).addTo(instance);
          robot.current = new ml.Marker({ element: markerEl("robot", labels.robot) }).setLngLat(ROBOT_ROUTE[0]).addTo(instance);
          ready.current = true;
          draw(latest.current);
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
    };
    // The map is created once; labels only name the markers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw(progress);
  }, [progress]);

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
