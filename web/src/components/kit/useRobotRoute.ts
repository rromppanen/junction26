"use client";

import { ROBOT_ROUTE } from "@/data/robotRoute";
import { hubNear, type LngLat } from "@/lib/kit/route";

const ROUTE_KEY = "lapi.kit.route";
const LOCATE_TIMEOUT_MS = 15_000;

/** Asks the app's own /api/walk for a street route; throws when it has none. */
async function fetchRoute(from: LngLat, to: LngLat): Promise<LngLat[]> {
  const q = (p: LngLat) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const res = await fetch(`/api/walk?from=${q(from)}&to=${q(to)}`);
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

/**
 * Asks the browser for the person's location and plans the robot's walking route to it from a hub
 * nearby. Resolves to the route once it is saved, or to "denied" when the person refuses or no
 * position comes (the robot is not sent then). A browser without geolocation gets the demo route in
 * Tapiola; if no router answers, a straight line from the hub.
 */
export function locateAndRoute(): Promise<LngLat[] | "denied"> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      store(ROBOT_ROUTE);
      resolve(ROBOT_ROUTE);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const home: LngLat = [pos.coords.longitude, pos.coords.latitude];
        const hub = hubNear(home);
        let route: LngLat[];
        try {
          route = await fetchRoute(hub, home);
        } catch (e) {
          console.warn("walking route unavailable, using a straight line", e);
          route = [hub, home];
        }
        store(route);
        resolve(route);
      },
      () => resolve("denied"),
      { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT_MS, maximumAge: 60_000 },
    );
  });
}
