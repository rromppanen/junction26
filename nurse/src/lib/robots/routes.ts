"use client";

import { useEffect, useState } from "react";
import { HUBS, routeKey, type LatLng, type Trip } from "./fleet";

/**
 * Walking routes along real streets from the FOSSGIS OSRM server (OpenStreetMap data).
 * Only the two coordinates of a trip leave the browser: an invented home and a hub.
 * Routes are cached in memory and in localStorage; when the server cannot be reached
 * the map keeps its drawn curve, so the demo never depends on the network.
 */
const ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const ROUTE_CACHE_NAME = "lapi.routes.v1";

const cache = new Map<string, LatLng[]>();
const failed = new Set<string>();
const inflight = new Set<string>();
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(ROUTE_CACHE_NAME);
    if (raw) for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, LatLng[]>)) cache.set(k, v);
  } catch {
    /* storage blocked or corrupt: fetch again */
  }
}

function save() {
  try {
    window.localStorage.setItem(ROUTE_CACHE_NAME, JSON.stringify(Object.fromEntries(cache)));
  } catch {
    /* storage blocked: memory still holds the routes */
  }
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const url = `${ROUTER}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`router ${res.status}`);
  const data = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] };
  const coords = data.routes?.[0]?.geometry.coordinates;
  if (!coords?.length) throw new Error("no route");
  return [from, ...coords.map(([lng, lat]): LatLng => [lat, lng]), to];
}

/** Street routes for the given trips, keyed by routeKey; missing keys use the curve. */
export function useRoutes(trips: Trip[]): Map<string, LatLng[]> {
  const [, setVersion] = useState(0);
  load();

  // Trips booked on the phone bring their own route; only the simulated ones need a router.
  const wanted = trips.filter((t) => !t.route).map((t) => ({ key: routeKey(t), from: HUBS[t.hub].at, to: t.home }));
  const missing = wanted.filter((w) => !cache.has(w.key) && !failed.has(w.key) && !inflight.has(w.key));
  const signature = missing.map((m) => m.key).join("|");

  useEffect(() => {
    if (!signature) return;
    let alive = true;
    for (const m of missing) {
      inflight.add(m.key);
      fetchRoute(m.from, m.to)
        .then((line) => { cache.set(m.key, line); save(); })
        .catch(() => { failed.add(m.key); })
        .finally(() => { inflight.delete(m.key); if (alive) setVersion((v) => v + 1); });
    }
    return () => { alive = false; };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  return cache;
}
