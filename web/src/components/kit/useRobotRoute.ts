"use client";

import { metresBetween, robotStart, type LngLat } from "@/lib/kit/route";

const ROUTE_KEY = "farmagusta.kit.route";
const LOCATE_TIMEOUT_MS = 15_000;

/** Asks the app's own /api/walk for a street route; throws when it has none. */
async function fetchRoute(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<LngLat[]> {
  const q = (p: LngLat) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const res = await fetch(`/api/walk?from=${q(from)}&to=${q(to)}`, { signal });
  if (!res.ok) throw new Error(`/api/walk answered ${res.status}`);
  const { route } = (await res.json()) as { route?: LngLat[] };
  if (!Array.isArray(route) || route.length < 2) throw new Error("/api/walk returned no route");
  return route;
}

/** The route saved when the robot was sent, so a reload shows the same one. */
export function storedRoute(): LngLat[] | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(ROUTE_KEY) ?? "null");
    return Array.isArray(v) && v.length >= 2 ? (v as LngLat[]) : null;
  } catch {
    return null;
  }
}

function store(route: LngLat[]) {
  try {
    window.localStorage.setItem(ROUTE_KEY, JSON.stringify(route));
  } catch {
    /* storage blocked: the route lasts for this page only */
  }
}

export function forgetRobotRoute() {
  try {
    window.localStorage.removeItem(ROUTE_KEY);
  } catch {
    /* ignore */
  }
}

/** Remembers the route the robot was sent on, so a reload shows the same one. */
export function rememberRoute(route: LngLat[]) {
  store(route);
}

/**
 * The person's position from the browser, or null when they refuse, none comes in time, or the
 * browser has no geolocation. The pin map starts there; without it the person moves the map themselves.
 */
export function currentPosition(): Promise<LngLat | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT_MS, maximumAge: 60_000 },
    );
  });
}

/**
 * The robot's walking route from the nearest hub to the pin. The router snaps the pin to the nearest
 * street or path, so the route's last point is the spot the robot can actually reach; that is where
 * it stops. If no router answers, a straight line to the pin itself.
 */
export async function routeToPin(pin: LngLat, signal?: AbortSignal): Promise<{ route: LngLat[]; snapped: boolean }> {
  const hub = robotStart(pin);
  try {
    // The router starts at the street nearest the hub; the hub itself comes first, so the nurse map
    // sees the route leave it.
    const route = await fetchRoute(hub, pin, signal);
    return { route: metresBetween(route[0], hub) > 1 ? [hub, ...route] : route, snapped: true };
  } catch (e) {
    if (signal?.aborted) throw e;
    console.warn("walking route unavailable, using a straight line", e);
    return { route: [hub, pin], snapped: false };
  }
}
