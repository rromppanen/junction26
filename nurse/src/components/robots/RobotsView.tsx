"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal,
  X,
  Users,
  Stethoscope,
  Bot,
  Route,
  Building2,
  Package,
  Layers,
  ListFilter,
  MapPin,
  RotateCcw,
  Check,
  ChevronRight,
} from "lucide-react";
import { AppHeader } from "@/components/NurseNav";
import {
  BTN,
  EVENT_LABEL,
  ME,
  matches,
  type Row,
} from "@/components/staff/boardShared";
import { patientRows } from "@/components/staff/patientRows";
import { NursePatients } from "@/components/staff/NursePatients";
import { SampleDrawer } from "@/components/staff/SampleDrawer";
import { STAGES_FOR_BOARD, type EventType } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import {
  HUBS,
  COMPARTMENTS,
  awaitingIntake,
  fleetAt,
  hubOf,
  pickupCode,
  readyForPickup,
  simStep,
  tripsOf,
  type SimSpeed,
  type HubId,
} from "@/lib/robots/fleet";
import { useRoutes } from "@/lib/robots/routes";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted">
      Loading the map…
    </div>
  ),
});
const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});
const INITIAL_LAYERS = {
  participants: true,
  robots: true,
  routes: true,
  hubs: true,
  ready: true,
};
const LAYER_LABELS = {
  participants: "Screening participants",
  robots: "Robots & pickup homes",
  routes: "Robot routes",
  hubs: "Hubs & lab collections",
  ready: "Waiting for a robot",
};

const LAYER_ICONS = {
  participants: Users,
  robots: Bot,
  routes: Route,
  hubs: Building2,
  ready: Package,
};

export function RobotsView({ embed = false }: { embed?: boolean }) {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [stages, setStages] = useState(() => STAGES_FOR_BOARD.map(() => true));
  const [locations, setLocations] = useState<HubId[]>(() =>
    Object.values(HUBS).map((hub) => hub.id),
  );
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [hubId, setHubId] = useState<HubId | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [speed, setSpeed] = useState<SimSpeed>(20);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTick = useRef(0);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const patientsButton = useRef<HTMLButtonElement>(null);
  const mapRegion = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    setMounted(true);
    setPatientsOpen(window.matchMedia("(min-width: 768px)").matches);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const rows = useMemo(() => patientRows(samples, now), [samples, now]);
  const search = query.trim().toLocaleLowerCase();
  const visible = rows.filter((r) => {
    const p = r.s.person;
    return (
      locations.includes(hubOf(p)) &&
      STAGES_FOR_BOARD.some(
        (stage, i) => stages[i] && matches(stage.stage, r.stage),
      ) &&
      (!attentionOnly || r.flags.length > 0) &&
      (!search ||
        [
          p.name,
          p.area,
          p.municipality,
          p.homeLanguage,
          p.lang,
          p.interpreter,
          pickupCode(r.s.id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search))
    );
  });
  const visibleIds = new Set(visible.map((r) => r.s.id));
  const trips = useMemo(() => tripsOf(samples), [samples]);
  const fleet = useMemo(() => fleetAt(trips, now), [trips, now]);
  const routes = useRoutes(
    useMemo(
      () =>
        fleet.flatMap((v) => (v.status.kind === "idle" ? [] : [v.status.trip])),
      [fleet],
    ),
  );
  const mapFleet = layers.robots
    ? fleet.filter(
        (v) =>
          locations.includes(v.robot.hub) &&
          (v.status.kind === "idle" ||
            v.run.some((stop) => visibleIds.has(stop.sampleId))),
      )
    : [];
  const ready = readyForPickup(samples, now).filter((s) =>
    visibleIds.has(s.id),
  );
  const intake = awaitingIntake(samples, now)
    .map((g) => ({
      ...g,
      samples: g.samples.filter((s) => visibleIds.has(s.id)),
    }))
    .filter((g) => g.samples.length);
  const sel = rows.find((r) => r.s.id === sampleId);
  const robot = mapFleet.find(
    (v) => v.robot.id === selected && v.status.kind !== "idle",
  );
  const hub =
    hubId && locations.includes(hubId) && layers.hubs ? HUBS[hubId] : null;
  const group = intake.find((g) => g.hub === hubId);

  useEffect(() => {
    if (!mounted || !simulate || now === lastTick.current) return;
    lastTick.current = now;
    for (const a of simStep(
      samples,
      now,
      ME,
      `Now, ${clock.format(now)}`,
      speed,
    ))
      add(a.sampleId, a.event);
  }, [mounted, simulate, speed, now, samples, add]);

  function clearFilters() {
    setQuery("");
    setAttentionOnly(false);
    setStages(STAGES_FOR_BOARD.map(() => true));
    setLayers(INITIAL_LAYERS);
    setLocations(Object.values(HUBS).map((hub) => hub.id));
  }
  function openSample(id: string) {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSampleId(id);
    setStatus("");
  }
  function closeSample() {
    setSampleId(null);
    requestAnimationFrame(() =>
      (returnFocus.current?.isConnected
        ? returnFocus.current
        : patientsOpen
          ? patientsButton.current
          : mapRegion.current
      )?.focus(),
    );
  }
  function act(
    row: Row,
    type: EventType,
    extra: { note?: string; slot?: string } = {},
  ) {
    if (busy) return;
    if (
      ["resultNegative", "resultPositive", "colonoscopyDone"].includes(type) &&
      !window.confirm(`Record “${EVENT_LABEL[type]}” for ${row.s.person.name}?`)
    )
      return;
    add(row.s.id, { type, ...extra });
    setStatus(`${EVENT_LABEL[type]} recorded for ${row.s.person.name}`);
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusy(false), 800);
  }
  function registerAtLab() {
    if (
      !group ||
      !hub ||
      !window.confirm(
        `Confirm you have collected these ${group.samples.length} samples at ${hub.name} and registered them at the lab?`,
      )
    )
      return;
    group.samples.forEach((s) => add(s.id, { type: "atLab" }));
    setStatus(
      `${group.samples.length} samples registered at the lab from ${hub.name}.`,
    );
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-dvh flex-col overflow-hidden"
    >
      <h1 className="sr-only">Hospital map</h1>
      <AppHeader>
        <div className="flex items-center gap-2">
          <button
            ref={patientsButton}
            type="button"
            className={`${BTN} ${patientsOpen ? "border-brand bg-brand-soft text-brand" : ""}`}
            aria-expanded={patientsOpen}
            aria-controls="nurse-patients"
            onClick={() => {
              setPatientsOpen(!patientsOpen);
              setMenuOpen(false);
            }}
          >
            <Stethoscope size={17} aria-hidden /> Patients
            <span className="rounded-full bg-brand-soft px-1.5 text-xs text-brand">
              {
                rows.filter(
                  (row) =>
                    row.flags.length > 0 &&
                    locations.includes(hubOf(row.s.person)),
                ).length
              }
              <span className="sr-only"> need attention</span>
            </span>
          </button>
          <button
            ref={filtersButton}
            type="button"
            className={BTN}
            aria-expanded={menuOpen}
            aria-controls="map-filters"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setPatientsOpen(false);
            }}
          >
            <SlidersHorizontal size={16} aria-hidden /> Filters
          </button>
        </div>
      </AppHeader>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative z-0 flex min-h-0 flex-1">
          {patientsOpen && (
            <NursePatients
              rows={rows.filter((row) =>
                locations.includes(hubOf(row.s.person)),
              )}
              onSelect={openSample}
              onClose={() => {
                setPatientsOpen(false);
                patientsButton.current?.focus();
              }}
            />
          )}
          {menuOpen && (
            <aside
              id="map-filters"
              aria-label="Map filters"
              className="workspace-panel"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  <SlidersHorizontal size={17} aria-hidden /> Map filters
                </h2>
                <button
                  type="button"
                  aria-label="Close filters"
                  className={BTN}
                  onClick={() => {
                    setMenuOpen(false);
                    filtersButton.current?.focus();
                  }}
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
              <p className="mb-3 text-xs text-muted" aria-live="polite">
                {visible.length} of {rows.length} participants shown
              </p>
              <details className="filter-group">
                <summary>
                  <Users size={17} aria-hidden />
                  Participants
                </summary>
                <div className="pb-3">
                  <label className="block text-sm font-medium">
                    Find a person
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Name, area, language or code"
                      className="mt-1 w-full rounded-md border border-rule px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={attentionOnly}
                      onChange={(e) => setAttentionOnly(e.target.checked)}
                    />
                    Needs attention only
                  </label>
                </div>
              </details>
              <details className="filter-group">
                <summary>
                  <MapPin size={17} aria-hidden />
                  Labs & locations{" "}
                  <span className="filter-count">
                    {locations.length} / {Object.keys(HUBS).length}
                  </span>
                </summary>
                <fieldset className="pb-3">
                  <legend className="sr-only">Labs & locations</legend>
                  {Object.values(HUBS).map((hub) => (
                    <label key={hub.id} className="filter-option">
                      <input
                        type="checkbox"
                        checked={locations.includes(hub.id)}
                        onChange={(e) =>
                          setLocations((current) =>
                            e.target.checked
                              ? [...current, hub.id]
                              : current.filter((id) => id !== hub.id),
                          )
                        }
                      />
                      <Building2 size={16} aria-hidden className="text-muted" />
                      {hub.name}
                    </label>
                  ))}
                </fieldset>
              </details>
              <details className="filter-group">
                <summary>
                  <Layers size={17} aria-hidden />
                  Map layers{" "}
                  <span className="filter-count">
                    {Object.values(layers).filter(Boolean).length} on
                  </span>
                </summary>
                <fieldset className="pb-3">
                  <legend className="sr-only">Map layers</legend>
                  {(Object.keys(layers) as (keyof typeof layers)[]).map(
                    (key) => {
                      const Icon = LAYER_ICONS[key];
                      return (
                        <label
                          key={key}
                          className={`filter-option layer-option ${layers[key] ? "is-on" : ""}`}
                        >
                          <span className="layer-icon">
                            <Icon size={18} aria-hidden />
                          </span>
                          <span className="flex-1">{LAYER_LABELS[key]}</span>
                          <input
                            type="checkbox"
                            checked={layers[key]}
                            onChange={(e) =>
                              setLayers({ ...layers, [key]: e.target.checked })
                            }
                          />
                        </label>
                      );
                    },
                  )}
                </fieldset>
              </details>
              <details className="filter-group">
                <summary>
                  <ListFilter size={17} aria-hidden />
                  Screening stages{" "}
                  <span className="filter-count">
                    {stages.filter(Boolean).length}/{stages.length}
                  </span>
                </summary>
                <fieldset className="pb-3">
                  <legend className="sr-only">Screening stages</legend>
                  {STAGES_FOR_BOARD.map((stage, i) => (
                    <label key={stage.label} className="filter-option">
                      <input
                        type="checkbox"
                        checked={stages[i]}
                        onChange={(e) =>
                          setStages(
                            stages.map((on, j) =>
                              i === j ? e.target.checked : on,
                            ),
                          )
                        }
                      />
                      {stage.label}
                    </label>
                  ))}
                </fieldset>
              </details>
              <button
                type="button"
                className={`${BTN} mt-4 w-full`}
                onClick={clearFilters}
              >
                <RotateCcw size={15} aria-hidden />
                Reset filters
              </button>
              {!embed && (
                <details className="mt-6 border-t border-rule pt-3 text-sm text-muted">
                  <summary className="cursor-pointer py-2">
                    Demo settings
                  </summary>
                  <p className="my-2 text-xs">
                    Invented people; simulated robots, lab and bookings.
                  </p>
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={simulate}
                      onChange={(e) => setSimulate(e.target.checked)}
                    />
                    Simulate other households
                  </label>
                  <label className="block">
                    Speed for new trips
                    <select
                      className="mt-1 w-full rounded border border-rule"
                      value={speed}
                      onChange={(e) =>
                        setSpeed(Number(e.target.value) as SimSpeed)
                      }
                    >
                      <option value={1}>Real time</option>
                      <option value={20}>20× faster</option>
                      <option value={60}>60× faster</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className={`${BTN} mt-3`}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Reset the demo? This removes all recorded actions in both apps.",
                        )
                      )
                        return;
                      reset();
                      setSampleId(null);
                      setSelected(null);
                      setHubId(null);
                      setStatus("Demo reset.");
                    }}
                  >
                    Reset demo
                  </button>
                </details>
              )}
            </aside>
          )}
          <section
            ref={mapRegion}
            tabIndex={-1}
            aria-label="Hospital action map"
            className="relative z-0 min-w-0 flex-1"
          >
            {mounted && (
              <LiveMap
                fleet={mapFleet}
                ready={layers.ready ? ready : []}
                participants={layers.participants ? visible : []}
                showRoutes={layers.routes}
                showHubs={layers.hubs}
                locations={locations}
                intake={Object.fromEntries(
                  intake.map((g) => [g.hub, g.samples.length]),
                )}
                routes={routes}
                selected={robot ? selected : null}
                onSelect={(id) => {
                  setSelected(id);
                  setHubId(null);
                }}
                onSample={openSample}
                onHub={(id) => {
                  setHubId(id as HubId);
                  setSelected(null);
                }}
              />
            )}
            {mounted && !Object.values(layers).some(Boolean) && (
              <div className="absolute inset-x-4 bottom-16 z-[1000] rounded border border-rule bg-white p-4 text-sm shadow sm:left-auto sm:w-72">
                <p>All map layers are hidden.</p>
                <button
                  type="button"
                  className={`${BTN} mt-2`}
                  onClick={() => setLayers(INITIAL_LAYERS)}
                >
                  Show map layers
                </button>
              </div>
            )}
            {mounted &&
              Object.values(layers).some(Boolean) &&
              visible.length === 0 && (
                <div className="absolute inset-x-4 bottom-16 z-[1000] rounded-lg border border-rule bg-white p-4 text-sm shadow">
                  <p>No people match these filters.</p>
                  <button
                    type="button"
                    className={`${BTN} mt-2`}
                    onClick={clearFilters}
                  >
                    Show everyone
                  </button>
                </div>
              )}
            {(robot || hub) && (
              <section
                aria-label="Map selection"
                className="absolute bottom-14 right-3 left-3 z-[1000] max-h-[50%] overflow-y-auto rounded-lg border border-rule bg-white p-4 shadow-lg sm:left-auto sm:w-80"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">
                    {robot ? robot.robot.name : hub?.name}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close selection"
                    className={BTN}
                    onClick={() => {
                      setSelected(null);
                      setHubId(null);
                    }}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
                {robot && robot.status.kind !== "idle" && (
                  <>
                    <p className="mt-2 text-sm">
                      {pickupCode(robot.status.trip.sampleId)} ·{" "}
                      {robot.status.kind === "atDoor"
                        ? `At the door${robot.status.flagged ? ", needs attention" : ""}`
                        : robot.status.kind === "returning"
                          ? "Returning to hub"
                          : "On the way"}
                    </p>
                    <button
                      type="button"
                      className={`${BTN} mt-3`}
                      onClick={() => {
                        if (robot.status.kind !== "idle")
                          openSample(robot.status.trip.sampleId);
                      }}
                    >
                      Open participant & actions
                    </button>
                    <div className="mt-4 border-t border-rule pt-3">
                      <p className="flex items-center gap-2 text-xs font-semibold">
                        <Package size={15} aria-hidden />
                        {
                          robot.run.filter((stop) => stop.handedOver).length
                        }{" "}
                        collected · {robot.run.length} stops · {COMPARTMENTS}{" "}
                        compartments
                      </p>
                      <div
                        className="mt-2 grid grid-cols-4 gap-2"
                        aria-label="Robot compartments"
                      >
                        {Array.from({ length: COMPARTMENTS }, (_, i) => {
                          const stop = robot.run.find(
                            (stop) => stop.compartment === i + 1,
                          );
                          return (
                            <div
                              key={i}
                              className={`rounded-md border p-2 text-center text-xs ${stop?.handedOver ? "border-brand bg-brand-soft text-brand" : "border-rule text-muted"}`}
                            >
                              <span className="block font-semibold">
                                {i + 1}
                              </span>
                              {stop?.handedOver
                                ? "Collected"
                                : stop
                                  ? "Assigned"
                                  : "Empty"}
                            </div>
                          );
                        })}
                      </div>
                      <ol
                        className="mt-2 divide-y divide-rule"
                        aria-label="Run stops"
                      >
                        {robot.run.map((stop) => (
                          <li key={stop.sampleId}>
                            <button
                              type="button"
                              className="flex min-h-11 w-full items-center gap-2 text-left text-xs hover:text-brand"
                              onClick={() => openSample(stop.sampleId)}
                            >
                              <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-brand">
                                {stop.handedOver ? (
                                  <Check size={13} aria-hidden />
                                ) : (
                                  stop.compartment
                                )}
                              </span>
                              <span className="flex-1">
                                {pickupCode(stop.sampleId)}
                                <span className="block text-muted">
                                  {stop.handedOver
                                    ? "Collected"
                                    : stop.compartment ===
                                        (robot.status.kind !== "idle"
                                          ? robot.status.trip.compartment
                                          : 0)
                                      ? "Current stop"
                                      : stop.leftAt !== undefined
                                        ? "Left without sample"
                                        : "Upcoming"}
                                </span>
                              </span>
                              <ChevronRight size={14} aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </>
                )}
                {hub && (
                  <>
                    <p className="mt-2 text-sm">
                      {group
                        ? `${group.samples.length} matching samples to collect`
                        : "No matching samples awaiting lab registration."}
                    </p>
                    {group && (
                      <button
                        type="button"
                        className="primary-action mt-3"
                        onClick={registerAtLab}
                      >
                        Register {group.samples.length} at lab
                      </button>
                    )}
                  </>
                )}
              </section>
            )}
            <div className="map-key pointer-events-none absolute bottom-6 left-3 z-[1000] flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/95 px-3 py-2 text-xs text-muted shadow">
              <span>
                <Users size={13} aria-hidden />
                Patient
              </span>
              <span className="text-behind">
                <Package size={13} aria-hidden />
                Attention
              </span>
              <span>
                <Bot size={13} aria-hidden />
                Robot
              </span>
              <span>
                <Building2 size={13} aria-hidden />
                Hub
              </span>
            </div>
          </section>
        </div>
      </div>
      <p
        role={sel ? undefined : "status"}
        aria-live={sel ? "off" : "polite"}
        className={
          status
            ? "shrink-0 border-t border-rule bg-white px-4 py-2 text-sm text-brand-strong"
            : "sr-only"
        }
      >
        {status}
      </p>
      {sel && (
        <SampleDrawer
          row={sel}
          now={now}
          busy={busy}
          act={act}
          status={status}
          onClose={closeSample}
        />
      )}
    </main>
  );
}
