"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ChevronLeft, Crosshair, Loader2, MapPin } from "lucide-react";
import { ROBOT_ROUTE } from "@/data/robotRoute";
import type { Ui } from "@/lib/kit/content";
import { metresBetween, type LngLat } from "@/lib/kit/route";
import { STYLE } from "./TrackingMap";
import { currentPosition, routeToPin } from "./useRobotRoute";

/** Where the map opens before (or without) the person's position: the demo street in Tapiola. */
const FALLBACK: LngLat = ROBOT_ROUTE[ROBOT_ROUTE.length - 1];
const START_ZOOM = 16;
const LOCATED_ZOOM = 17.5;
/** Wait this long after the map stops before asking the router, so a quick second drag does not ask twice. */
const SETTLE_MS = 250;
/** Closer than this, the reachable spot is drawn on the pin itself rather than as a separate stop. */
const SAME_SPOT_M = 4;

type Status = "locating" | "moving" | "snapping" | "ready";

function line(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

function stopEl(label: string): HTMLElement {
  // MapLibre places a marker by setting its element's transform, so the pop-in animates a child.
  const el = document.createElement("div");
  el.setAttribute("aria-label", label);
  el.innerHTML = '<div class="kit-stop"></div>';
  return el;
}

/**
 * Where should the robot come: the person moves the map until the pin in its middle is at their door,
 * as in ride and delivery apps. Each time the map settles, the app asks the router for a walking route
 * from a hub nearby; the router snaps the pin to the nearest street or path, and that spot is shown as
 * the robot's stop. Confirming hands over the route, which ends at that stop.
 */
export function PinPicker({ t, onBack, onConfirm }: { t: Ui; onBack: () => void; onConfirm: (route: LngLat[]) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const stop = useRef<Marker | null>(null);
  const [status, setStatus] = useState<Status>("locating");
  const [denied, setDenied] = useState(false);
  const [route, setRoute] = useState<LngLat[] | null>(null);
  const [failed, setFailed] = useState(false);
  const asking = useRef<AbortController | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locatingRef = useRef(true);
  /** A position that came before the map was made: the map opens there. */
  const early = useRef<LngLat | null>(null);

  /** The pin is where the map's centre is; ask where the robot can stop nearest to it. */
  async function snap() {
    const m = map.current;
    if (!m) return;
    asking.current?.abort();
    const ac = new AbortController();
    asking.current = ac;
    const c = m.getCenter();
    const pin: LngLat = [c.lng, c.lat];
    setStatus("snapping");
    try {
      const r = await routeToPin(pin, ac.signal);
      if (ac.signal.aborted) return;
      const end = r.route[r.route.length - 1];
      const apart = metresBetween(pin, end) > SAME_SPOT_M;
      stop.current?.setLngLat(end).addTo(m);
      stop.current?.getElement().classList.toggle("kit-stop-on-pin", !apart);
      (m.getSource("walk") as GeoJSONSource | undefined)?.setData(line(apart ? [pin, end] : [pin, pin]));
      setRoute(r.route);
      setStatus("ready");
    } catch {
      /* replaced by a newer request */
    }
  }

  function locate() {
    locatingRef.current = true;
    setStatus("locating");
    setDenied(false);
    void currentPosition().then((p) => {
      locatingRef.current = false;
      const m = map.current;
      if (!p) {
        setDenied(true);
        if (m) void snap();
        return;
      }
      if (m) m.flyTo({ center: p, zoom: LOCATED_ZOOM, duration: 1200 });
      else early.current = p;
    });
  }

  useEffect(() => {
    let cancelled = false;
    let instance: MlMap | null = null;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelled || !box.current) return;
        instance = new ml.Map({
          container: box.current, style: STYLE,
          center: early.current ?? FALLBACK, zoom: early.current ? LOCATED_ZOOM : START_ZOOM,
          attributionControl: false, dragRotate: false, pitchWithRotate: false,
        });
        // Credit sits at the top: the bottom of the map is under the sheet.
        instance.addControl(new ml.AttributionControl({ compact: true }), "top-left");
        instance.touchZoomRotate.disableRotation();
        map.current = instance;
        stop.current = new ml.Marker({ element: stopEl(t.pinHere) });
        instance.on("load", () => {
          if (!instance) return;
          // The credit starts folded into its (i) button, so it does not cover the top of the map.
          instance.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          instance.addSource("walk", { type: "geojson", data: line([FALLBACK, FALLBACK]) });
          instance.addLayer({ id: "walk", type: "line", source: "walk", layout: { "line-cap": "round" },
            paint: { "line-color": "#004b87", "line-width": 3, "line-dasharray": [0.6, 1.8] } });
          // Without a position (yet), start from the map as it is.
          if (!locatingRef.current) void snap();
        });
        instance.on("movestart", () => {
          if (settle.current) clearTimeout(settle.current);
          asking.current?.abort();
          stop.current?.remove();
          setRoute(null);
          if (!locatingRef.current) setStatus("moving");
        });
        instance.on("moveend", () => {
          if (settle.current) clearTimeout(settle.current);
          settle.current = setTimeout(() => void snap(), SETTLE_MS);
        });
        setTimeout(() => {
          if (!cancelled && !instance?.loaded()) setFailed(true);
        }, 12_000);
      } catch (e) {
        console.warn("map", e);
        if (!cancelled) setFailed(true);
      }
    })();
    locate();
    return () => {
      cancelled = true;
      if (settle.current) clearTimeout(settle.current);
      asking.current?.abort();
      instance?.remove();
      map.current = null;
    };
    // The map is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lifted = status === "moving" || status === "locating";
  const note =
    status === "locating" ? t.locating
    : status === "ready" ? t.pinHere
    : t.pinSnapping;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 bg-[#eef2f1]" dir="ltr">
        <div ref={box} className="h-full w-full" />
        {/* The pin stays in the middle; the map moves under it. Its tip is the exact centre. */}
        <div className={`kit-pin pointer-events-none absolute left-1/2 top-1/2 ${lifted ? "kit-pin-lifted" : ""}`} aria-hidden>
          <svg viewBox="0 0 40 52" width={40} height={52}>
            <path d="M20 50 C20 50 4 31 4 19 a16 16 0 0 1 32 0 C36 31 20 50 20 50z" fill="var(--brand)" stroke="#fff" strokeWidth={2.5} />
            <circle cx={20} cy={19} r={6.5} fill="#fff" />
          </svg>
          <span className="kit-pin-shadow" />
        </div>
        <button type="button" onClick={locate} aria-label={t.myLocation}
          className="absolute bottom-8 right-3 flex size-11 items-center justify-center rounded-full bg-surface text-brand shadow-md hover:bg-brand-soft">
          <Crosshair aria-hidden size={20} />
        </button>
        {failed && <p className="absolute inset-x-4 top-16 rounded-lg bg-white/95 p-3 text-sm text-muted shadow">{t.mapError}</p>}
      </div>
      <section className="relative z-10 -mt-5 rounded-t-3xl bg-surface px-5 pb-5 pt-5 shadow-[0_-8px_24px_-12px_rgba(0,60,108,0.3)]">
        <h1 className="text-[1.4rem] font-semibold leading-tight">{t.pinTitle}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.pinBody}</p>
        <p className="mt-3 flex min-h-6 items-center gap-2 text-sm font-semibold text-brand-strong" aria-live="polite">
          {status === "ready"
            ? <MapPin aria-hidden size={16} className="shrink-0 text-brand" />
            : <Loader2 aria-hidden size={16} className="shrink-0 animate-spin text-brand" />}
          {note}
        </p>
        {denied && <p className="mt-1 text-sm text-muted">{t.locationDenied}</p>}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onBack} aria-label={t.back}
            className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-rule text-brand hover:bg-brand-soft">
            <ChevronLeft aria-hidden className="rtl:rotate-180" />
          </button>
          <button type="button" disabled={!route || status !== "ready"} onClick={() => route && onConfirm(route)}
            className="primary-action !min-h-14 flex-1 !rounded-xl !text-base disabled:opacity-40">
            {t.pinConfirm}
          </button>
        </div>
      </section>
    </div>
  );
}
