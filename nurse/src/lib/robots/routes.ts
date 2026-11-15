"use client";

import { useEffect, useState } from "react";
import { curvedRoute, routeKey, type LatLng, type Trip } from "./fleet";

/**
 * Walking routes along real streets for every leg a robot drives: hub to first home, each hop to the
 * next home, and the drive back after a run. Asked from the main app's /api/walk (OSRM, with Valhalla
 * as a fallback) when the nurse app is served under it, else straight from the FOSSGIS OSRM server.
 * Only two coordinates per leg leave the browser: invented homes and hubs.
 *
 * The public routers refuse bursts (HTTP 429), so at most MAX_INFLIGHT requests run at once and a
 * failed leg is retried after RETRY_MS. Until a route arrives the map draws a curve, so the demo never
 * depends on the network. Routes are cached in memory and in localStorage.
 */
const ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const ROUTE_CACHE_NAME = "farmagusta.routes.v2";
const MAX_INFLIGHT = 3;
const RETRY_MS = 60_000;

const cache = new Map<string, LatLng[]>();
const retryAt = new Map<string, number>();
const inflight = new Set<string>();
let loaded = false;
let walkApi = true; // false once /api/walk is missing (the nurse app on its own port)

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

async function viaWalkApi(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  if (!walkApi) return null;
  const q = (p: LatLng) => `${p[1].toFixed(6)},${p[0].toFixed(6)}`;
  const res = await fetch(`/api/walk?from=${q(from)}&to=${q(to)}`, { signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) {
    walkApi = false;
    return null;
  }
  if (!res.ok) throw new Error(`walk ${res.status}`);
  const { route } = (await res.json()) as { route?: [number, number][] };
  if (!route?.length) throw new Error("no route");
  return [from, ...route.map(([lng, lat]): LatLng => [lat, lng]), to];
}

async function viaOsrm(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const url = `${ROUTER}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`router ${res.status}`);
  const data = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] };
  const coords = data.routes?.[0]?.geometry.coordinates;
  if (!coords?.length) throw new Error("no route");
  return [from, ...coords.map(([lng, lat]): LatLng => [lat, lng]), to];
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  return (await viaWalkApi(from, to)) ?? (await viaOsrm(from, to));
}

/** The key of a run's drive back, from its last home to where it started. */
export function backKey(t: Pick<Trip, "hub" | "sampleId">): string {
  return `${routeKey(t)}:back`;
}

/**
 * The line a leg follows, start first and home last: the phone's own route, a fetched street route,
 * or a curve while that loads. With `back`, the run's drive back, also drawn start first (the robot
 * walks it from the home end).
 */
export function legLine(t: Trip, routes: Map<string, LatLng[]>, back = false): LatLng[] {
  if (back) return routes.get(backKey(t)) ?? curvedRoute(t.backTo, t.home, backKey(t));
  return (t.compartment === 1 ? t.route : undefined) ?? routes.get(routeKey(t)) ?? curvedRoute(t.from, t.home, routeKey(t));
}

/** Street routes for every leg of the given stops (and the drive back after a run's last stop). */
export function useRoutes(trips: Trip[]): Map<string, LatLng[]> {
  const [version, setVersion] = useState(0);
  load();

  const wanted: { key: string; from: LatLng; to: LatLng }[] = [];
  for (const t of trips) {
    if (!(t.compartment === 1 && t.route)) wanted.push({ key: routeKey(t), from: t.from, to: t.home });
    if (t.last && t.stops > 1) wanted.push({ key: backKey(t), from: t.backTo, to: t.home });
  }
  const now = Date.now();
  const missing = wanted.filter((w) => !cache.has(w.key) && !inflight.has(w.key) && (retryAt.get(w.key) ?? 0) <= now);
  const signature = missing.map((m) => m.key).join("|");

  useEffect(() => {
    if (!signature) return;
    let alive = true;
    // A few at a time; the rest are picked up when these finish and the hook runs again.
    for (const m of missing.slice(0, Math.max(0, MAX_INFLIGHT - inflight.size))) {
      inflight.add(m.key);
      fetchRoute(m.from, m.to)
        .then((line) => {
          cache.set(m.key, line);
          retryAt.delete(m.key);
          save();
        })
        .catch(() => retryAt.set(m.key, Date.now() + RETRY_MS))
        .finally(() => {
          inflight.delete(m.key);
          if (alive) setVersion((v) => v + 1);
        });
    }
    return () => {
      alive = false;
    };
  }, [signature, version]); // eslint-disable-line react-hooks/exhaustive-deps

  return cache;
}
