"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Sample } from "@/lib/sample/model";
import { AREAS, HUBS, curvedRoute, homeOf, pickupCode, positionOf, routeKey, type LatLng, type RobotView } from "@/lib/robots/fleet";

const COLOUR = {
  outbound: "#0f6e56",
  atDoor: "#245f88",
  flagged: "#a34a08",
  returning: "#6d8582",
  idle: "#ffffff",
  ink: "#12272e",
  hub: "#085041",
};

function colourOf(v: RobotView): string {
  const s = v.status;
  if (s.kind === "atDoor") return s.flagged ? COLOUR.flagged : COLOUR.atDoor;
  return COLOUR[s.kind];
}

function robotIcon(v: RobotView, selected: boolean): L.DivIcon {
  const idle = v.status.kind === "idle";
  const size = idle ? 18 : 26;
  return L.divIcon({
    className: "robot-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="robot-dot${idle ? " is-idle" : ""}${selected ? " is-selected" : ""}" style="background:${colourOf(v)}">${v.robot.id.slice(1)}</span>`,
  });
}

const hubIcon = L.divIcon({ className: "hub-pin", iconSize: [18, 18], iconAnchor: [9, 9], html: "<span></span>" });
const hubIntakeIcon = L.divIcon({ className: "hub-pin has-intake", iconSize: [22, 22], iconAnchor: [11, 11], html: "<span></span>" });

// Fit the whole capital region: every hub and neighbourhood.
const BOUNDS = L.latLngBounds([...Object.values(HUBS).map((h) => h.at), ...Object.values(AREAS).map((a) => a.at)]).pad(0.06);

const statusText: Record<RobotView["status"]["kind"], string> = {
  idle: "parked", outbound: "on the way", atDoor: "at the door", returning: "returning",
};

function langLine(p: Sample["person"]): string {
  return [p.homeLanguage, p.interpreter ? "needs interpreter" : ""].filter(Boolean).join(", ");
}

/** A button that zooms back out to the whole capital region. */
function FitButton() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control">
        <button type="button" onClick={() => map.fitBounds(BOUNDS)}
          className="min-h-9 rounded-md border border-rule bg-white px-3 text-sm font-medium shadow-sm hover:bg-brand-soft">
          Whole region
        </button>
      </div>
    </div>
  );
}

/**
 * The capital region on an OpenStreetMap base map: hubs, homes waiting for a pickup,
 * robots and the street routes they follow. Rendered only in the browser.
 */
export default function LiveMap({ fleet, ready, intake, routes, selected, onSelect }: {
  fleet: RobotView[];
  ready: Sample[];
  /** Samples waiting for a nurse, per hub id. */
  intake: Record<string, number>;
  routes: Map<string, LatLng[]>;
  selected: string | null;
  onSelect: (robotId: string) => void;
}) {
  const lineOf = (v: RobotView): LatLng[] | undefined => {
    if (v.status.kind === "idle") return undefined;
    const t = v.status.trip;
    return routes.get(routeKey(t)) ?? curvedRoute(HUBS[t.hub].at, t.home, routeKey(t));
  };

  return (
    <MapContainer bounds={BOUNDS} zoomSnap={0.25} zoomDelta={0.5} wheelPxPerZoomLevel={90} minZoom={9} maxZoom={16} scrollWheelZoom className="h-[min(72vh,680px)] min-h-[420px] w-full rounded-xl" attributionControl>
      <FitButton />
      {/* Esri's light grey canvas: quiet streets so the routes and robots stand out. No API key. */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
        attribution='Base map &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; routes: <a href="https://routing.openstreetmap.de/about.html">FOSSGIS OSRM</a>, OpenStreetMap'
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />

      {fleet.map((v) => {
        const line = lineOf(v);
        if (!line) return null;
        const on = selected === v.robot.id;
        const returning = v.status.kind === "returning";
        return (
          <Polyline key={`route-${v.robot.id}`} positions={line}
            pathOptions={{
              color: colourOf(v), weight: on ? 6 : 4, opacity: selected && !on ? 0.35 : 0.9,
              dashArray: returning ? "4 8" : undefined, lineCap: "round",
            }} />
        );
      })}

      {ready.map((s) => (
        <CircleMarker key={`ready-${s.id}`} center={homeOf(s.person)} radius={6}
          pathOptions={{ color: COLOUR.ink, weight: 2, fillColor: "#ffffff", fillOpacity: 1 }}>
          <Tooltip>{pickupCode(s.id)}, {s.person.area} · sample ready, no pickup booked{langLine(s.person) ? ` · ${langLine(s.person)}` : ""}</Tooltip>
        </CircleMarker>
      ))}

      {fleet.map((v) => {
        if (v.status.kind === "idle") return null;
        const t = v.status.trip;
        const flagged = v.status.kind === "atDoor" && v.status.flagged;
        return (
          <CircleMarker key={`home-${v.robot.id}`} center={t.home} radius={flagged ? 11 : 7}
            pathOptions={{ color: flagged ? COLOUR.flagged : COLOUR.ink, weight: 2, fillColor: flagged ? COLOUR.flagged : COLOUR.ink, fillOpacity: flagged ? 0.35 : 1 }}>
            <Tooltip permanent direction="right" offset={[10, 0]} className="home-label">{pickupCode(t.sampleId)}</Tooltip>
          </CircleMarker>
        );
      })}

      {/* Parked robots are counted on their hub's label rather than stacked on top of it. */}
      {Object.values(HUBS).map((h) => {
        const parked = fleet.filter((v) => v.robot.hub === h.id && v.status.kind === "idle").length;
        return (
          <Marker key={h.id} position={h.at} icon={intake[h.id] ? hubIntakeIcon : hubIcon} zIndexOffset={-100}>
            <Tooltip key={intake[h.id] ? "intake" : "ready"} permanent direction="bottom" offset={[0, 8]} className={`hub-label${intake[h.id] ? " has-intake" : ""}`}>
              {h.name} · {intake[h.id] ? `${intake[h.id]} to collect` : `${parked} ready`}
            </Tooltip>
          </Marker>
        );
      })}

      {fleet.map((v) => {
        if (v.status.kind === "idle") return null;
        const on = selected === v.robot.id;
        return (
          <Marker key={v.robot.id} position={positionOf(v, lineOf(v), 0)} icon={robotIcon(v, on)}
            zIndexOffset={1000}
            eventHandlers={{ click: () => onSelect(v.robot.id) }}
            keyboard={false}>
            <Tooltip direction="top" offset={[0, -12]}>
              {v.robot.name}, {statusText[v.status.kind]}: {pickupCode(v.status.trip.sampleId)}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
