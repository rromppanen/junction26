"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Fragment, useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Sample } from "@/lib/sample/model";
import { STAGE_LABEL, type Row } from "@/components/staff/boardShared";
import {
  AREAS,
  HUBS,
  homeOf,
  pickupCode,
  positionOf,
  splitLine,
  type LatLng,
  type RobotView,
} from "@/lib/robots/fleet";
import { legLine } from "@/lib/robots/routes";

// The HUS palette of the user app (web/): brand blue for a robot on its way, like the kit's tracking map.
const COLOUR = {
  outbound: "#004b87",
  atDoor: "#004b87",
  flagged: "#a34a08",
  returning: "#004b87",
  idle: "#ffffff",
  ink: "#1d252c",
  hub: "#003c6c",
  behind: "#9aa9b6",
};

const HOUSE =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="#fff"/></svg>';
const homeIcon = L.divIcon({
  className: "home-pin",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<span>${HOUSE}</span>`,
});
const homeFlaggedIcon = L.divIcon({
  className: "home-pin is-flagged",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: `<span>${HOUSE}</span>`,
});

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

const hubIcon = L.divIcon({
  className: "hub-pin",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: "<span></span>",
});
const hubIntakeIcon = L.divIcon({
  className: "hub-pin has-intake",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: "<span></span>",
});

// Fit the whole capital region: every hub and neighbourhood.
const BOUNDS = L.latLngBounds([
  ...Object.values(HUBS).map((h) => h.at),
  ...Object.values(AREAS).map((a) => a.at),
]).pad(0.06);

const statusText: Record<RobotView["status"]["kind"], string> = {
  idle: "parked",
  outbound: "on the way",
  atDoor: "at the door",
  returning: "returning",
};

function langLine(p: Sample["person"]): string {
  return [p.homeLanguage, p.interpreter ? "needs interpreter" : ""]
    .filter(Boolean)
    .join(", ");
}

/** A button that zooms back out to the whole capital region. */
function FitButton() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control">
        <button
          type="button"
          onClick={() => map.fitBounds(BOUNDS)}
          className="min-h-9 rounded-md border border-rule bg-white px-3 text-sm font-medium shadow-sm hover:bg-brand-soft"
        >
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
export default function LiveMap({
  fleet,
  ready,
  intake,
  routes,
  selected,
  onSelect,
  participants,
  showRoutes,
  showHubs,
  locations,
  onSample,
  onHub,
}: {
  participants: Row[];
  showRoutes: boolean;
  showHubs: boolean;
  locations: string[];
  onSample: (id: string) => void;
  onHub: (id: string) => void;
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
    // Street routes for every leg; the drive back after a longer run is its own route.
    return legLine(t, routes, v.status.kind === "returning" && t.stops > 1);
  };

  return (
    <MapContainer
      bounds={BOUNDS}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={90}
      minZoom={9}
      maxZoom={16}
      scrollWheelZoom
      className="hospital-map h-full w-full"
      attributionControl
    >
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

      {showRoutes &&
        fleet.map((v) => {
          const line = lineOf(v);
          if (!line) return null;
          const on = selected === v.robot.id;
          const dim = selected && !on ? 0.3 : 1;
          // As on the kit's tracking map: the road still to drive is solid with a white outline, the rest is grey dots.
          const s = v.status;
          const ahead =
            s.kind === "outbound"
              ? splitLine(line, s.progress).ahead
              : s.kind === "returning"
                ? splitLine(line, 1 - s.progress).done
                : [];
          return (
            <Fragment key={`route-${v.robot.id}`}>
              {on &&
                s.kind !== "idle" &&
                v.run
                  .filter(
                    (stop) =>
                      stop.compartment > s.trip.compartment &&
                      stop.leftAt === undefined,
                  )
                  .map((stop) => (
                    <Polyline
                      key={`next-${stop.sampleId}`}
                      positions={legLine(stop, routes)}
                      pathOptions={{
                        color: COLOUR.outbound,
                        weight: 3,
                        opacity: 0.65,
                        dashArray: "5 7",
                      }}
                    />
                  ))}
              <Polyline
                positions={line}
                pathOptions={{
                  color: COLOUR.behind,
                  weight: 4,
                  opacity: dim,
                  dashArray: "1 9",
                  lineCap: "round",
                }}
              />
              {ahead.length > 1 && (
                <>
                  <Polyline
                    positions={ahead}
                    pathOptions={{
                      color: "#ffffff",
                      weight: on ? 10 : 8,
                      opacity: dim,
                      lineCap: "round",
                    }}
                  />
                  <Polyline
                    positions={ahead}
                    pathOptions={{
                      color: colourOf(v),
                      weight: on ? 6 : 4,
                      opacity: dim,
                      lineCap: "round",
                    }}
                  />
                </>
              )}
            </Fragment>
          );
        })}

      {participants.map((row) => (
        <Marker
          key={`person-${row.s.id}`}
          position={homeOf(row.s.person)}
          title={`${pickupCode(row.s.id)} · ${STAGE_LABEL[row.stage]}`}
          icon={L.divIcon({
            className: "participant-pin",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            html: `<span class="${row.flags.length ? "is-flagged" : ""}"></span>`,
          })}
          eventHandlers={{ click: () => onSample(row.s.id) }}
        >
          <Tooltip>
            {pickupCode(row.s.id)} · {STAGE_LABEL[row.stage]}
            {row.flags.length ? ` · ${row.flags[0].label}` : ""}
          </Tooltip>
        </Marker>
      ))}

      {ready.map((s) => (
        <Marker
          key={`ready-${s.id}`}
          position={homeOf(s.person)}
          title={`${pickupCode(s.id)} · waiting for a robot`}
          icon={L.divIcon({
            className: "participant-pin waiting-pin",
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            html: "<span></span>",
          })}
          eventHandlers={{ click: () => onSample(s.id) }}
        >
          <Tooltip>
            {pickupCode(s.id)}, {s.person.area} · sample ready, no pickup booked
            {langLine(s.person) ? ` · ${langLine(s.person)}` : ""}
          </Tooltip>
        </Marker>
      ))}

      {fleet.map((v) => {
        if (v.status.kind === "idle") return null;
        const t = v.status.trip;
        const flagged = v.status.kind === "atDoor" && v.status.flagged;
        return (
          <Fragment key={`homes-${v.robot.id}`}>
            <Marker
              key={`home-${v.robot.id}`}
              position={t.home}
              icon={flagged ? homeFlaggedIcon : homeIcon}
              title={pickupCode(t.sampleId)}
              eventHandlers={{ click: () => onSample(t.sampleId) }}
            >
              <Tooltip
                permanent={selected === v.robot.id}
                direction="right"
                offset={[10, 0]}
                className="home-label"
              >
                {pickupCode(t.sampleId)}
                {t.stops > 1 ? ` · stop ${t.compartment}/${t.stops}` : ""}
              </Tooltip>
            </Marker>
            {v.run
              .filter(
                (stop) =>
                  stop.compartment > t.compartment && stop.leftAt === undefined,
              )
              .map((stop) => (
                <Marker
                  key={stop.sampleId}
                  position={stop.home}
                  title={`${pickupCode(stop.sampleId)} · compartment ${stop.compartment} of ${stop.stops}`}
                  icon={L.divIcon({
                    className: "stop-pin",
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                    html: `<span>${stop.compartment}</span>`,
                  })}
                  eventHandlers={{ click: () => onSample(stop.sampleId) }}
                >
                  <Tooltip>
                    {v.robot.name} · stop {stop.compartment} of {stop.stops} ·{" "}
                    {pickupCode(stop.sampleId)}
                  </Tooltip>
                </Marker>
              ))}
          </Fragment>
        );
      })}

      {/* Parked robots are counted on their hub's label rather than stacked on top of it. */}
      {showHubs &&
        Object.values(HUBS)
          .filter((h) => locations.includes(h.id))
          .map((h) => {
            const parked = fleet.filter(
              (v) => v.robot.hub === h.id && v.status.kind === "idle",
            ).length;
            return (
              <Marker
                key={h.id}
                position={h.at}
                icon={intake[h.id] ? hubIntakeIcon : hubIcon}
                zIndexOffset={2000}
                title={h.name}
                eventHandlers={{ click: () => onHub(h.id) }}
              >
                <Tooltip
                  key={intake[h.id] ? "intake" : "ready"}
                  permanent
                  direction="bottom"
                  offset={[0, 8]}
                  className={`hub-label${intake[h.id] ? " has-intake" : ""}`}
                >
                  {h.name} ·{" "}
                  {intake[h.id]
                    ? `${intake[h.id]} to collect`
                    : `${parked} ready`}
                </Tooltip>
              </Marker>
            );
          })}

      {fleet.map((v) => {
        if (v.status.kind === "idle") return null;
        const on = selected === v.robot.id;
        return (
          <Marker
            key={v.robot.id}
            position={positionOf(v, lineOf(v), 0)}
            icon={robotIcon(v, on)}
            zIndexOffset={1000}
            eventHandlers={{ click: () => onSelect(v.robot.id) }}
            title={v.robot.name}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {v.robot.name}, {statusText[v.status.kind]}:{" "}
              {pickupCode(v.status.trip.sampleId)}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
