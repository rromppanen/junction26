"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, DemoBar } from "@/components/NurseNav";
import { ME } from "@/components/staff/boardShared";
import { useSamples } from "@/lib/sample/store";
import { HUBS, awaitingIntake, fleetAt, pickupCode, readyForPickup, simStep, tripsOf, type RobotView, type SimSpeed } from "@/lib/robots/fleet";
import { useRoutes } from "@/lib/robots/routes";

// Leaflet needs the browser's window, so the map renders on the client only.
const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => <div className="flex h-[min(72vh,680px)] min-h-[420px] items-center justify-center bg-paper text-sm text-muted">Loading the map…</div>,
});

function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86_400)} d`;
}

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const SHOWN = 5;

/** What the robot is doing, in a few words. */
function doing(v: RobotView): string {
  const s = v.status;
  if (s.kind === "outbound") return `Arrives in ${ago(s.etaMs)}`;
  if (s.kind === "atDoor") return `At the door for ${ago(s.waitedMs)}`;
  if (s.kind === "returning") return `${s.trip.handedOver ? "Bringing the sample back" : "Coming back empty"}, ${ago(s.etaMs)}`;
  return "Free";
}

const panel = "rounded-md border bg-surface";

export function RobotsView() {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [speed, setSpeed] = useState<SimSpeed>(20);
  const [showAllReady, setShowAllReady] = useState(false);
  const [status, setStatus] = useState("");
  const lastTick = useRef(0);
  useEffect(() => setMounted(true), []);

  const trips = useMemo(() => tripsOf(samples), [samples]);
  const fleet = useMemo(() => fleetAt(trips, now), [trips, now]);
  const ready = useMemo(() => readyForPickup(samples, now), [samples, now]);
  const activeTrips = useMemo(() => fleet.flatMap((v) => (v.status.kind === "idle" ? [] : [v.status.trip])), [fleet]);
  const routes = useRoutes(activeTrips);

  // Other households: while this page is open, robots go out to waiting samples and collect them.
  useEffect(() => {
    if (!mounted || !simulate || now === lastTick.current) return;
    lastTick.current = now;
    for (const a of simStep(samples, now, ME, `Now, ${clock.format(now)}`, speed)) add(a.sampleId, a.event);
  }, [mounted, simulate, speed, now, samples, add]);

  const active = fleet.filter((v) => v.status.kind !== "idle");
  const free = fleet.length - active.length;
  const stuck = fleet.filter((v) => v.status.kind === "atDoor" && v.status.flagged);
  const intake = awaitingIntake(samples, now);
  const intakeCount = intake.reduce((n, g) => n + g.samples.length, 0);
  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id));

  function resetDemo() {
    if (!window.confirm("Reset the demo? This removes all recorded actions in both the nurse and participant apps.")) return;
    reset();
    setSelected(null);
    setStatus("Demo reset. All recorded actions cleared.");
  }

  function registerAtLab(group: (typeof intake)[number]) {
    const count = group.samples.length;
    const hub = HUBS[group.hub].name;
    if (!window.confirm(`Confirm you have collected ${count} ${count === 1 ? "sample" : "samples"} at ${hub} and registered them at the lab?`)) return;
    group.samples.forEach((sample) => add(sample.id, { type: "atLab" }));
    setStatus(`${count} ${count === 1 ? "sample" : "samples"} registered at the lab from ${hub}.`);
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-8 sm:px-6">
      <AppHeader />

      <div className="mx-auto w-full max-w-[96rem] pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[length:var(--step-2)] font-semibold leading-tight text-brand-strong">Robot pickups</h1>
            <p className="mt-1 text-muted">Helsinki, Espoo and Vantaa</p>
            <p className="mt-1 text-sm text-muted">
              {simulate ? `Demo: new trips run at ${speed}× speed.` : "Demo: automatic bookings paused. Trips underway continue."}
            </p>
          </div>
        </div>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : (
          <>
            <p role="status" className={status ? "mt-4 text-sm font-medium text-brand-strong" : "sr-only"}>{status}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-rule py-4 sm:flex sm:flex-wrap sm:gap-x-10">
              {([
                ["Samples to collect", intakeCount, intakeCount > 0],
                ["Waiting too long at a door", stuck.length, stuck.length > 0],
                ["On a trip", active.length, false],
                ["Available robots", free, false],
              ] as const).map(([label, n, warn]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className={`text-xl font-semibold tabular-nums ${warn ? "text-behind" : "text-ink"}`}>{n}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
              <section aria-label="Map" className="min-w-0">
                <div className={`${panel} relative overflow-hidden border-rule`}>
                  {active.length === 0 && ready.length === 0 && (
                    <div className="absolute inset-x-3 top-3 z-[1000] flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/95 p-3 shadow">
                      <p className="text-sm">No pickups in progress or waiting. Check below for samples awaiting lab registration.</p>
                      <button type="button" onClick={resetDemo}
                        className="min-h-11 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-strong">
                        Reset demo
                      </button>
                    </div>
                  )}
                  <LiveMap fleet={fleet} ready={ready} intake={Object.fromEntries(intake.map((g) => [g.hub, g.samples.length]))} routes={routes} selected={selected} onSelect={toggle} />
                </div>
                <ul aria-label="Map key" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-brand" aria-hidden />Robot</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-behind" aria-hidden />Needs attention</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-sm bg-brand-strong" aria-hidden />Hub</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full border-2 border-ink bg-white" aria-hidden />Waiting for a robot</li>
                </ul>
              </section>

              <div className="flex min-w-0 flex-col gap-6">
                <section aria-labelledby="needs-h">
                  <h2 id="needs-h" className="text-lg font-semibold">Needs attention</h2>
                  {intake.length === 0 && stuck.length === 0 && <p className="mt-1 text-muted">No samples to collect or delayed pickups.</p>}
                  <ul className="mt-2 space-y-2">
                    {intake.map((g) => (
                      <li key={g.hub} className={`${panel} border-behind p-3`}>
                        <p className="font-semibold">Collect at {HUBS[g.hub].name}</p>
                        <p className="text-sm text-muted">
                          {g.samples.length} {g.samples.length === 1 ? "sample" : "samples"}, oldest {ago(now - (g.samples[0].events.findLast((e) => e.type === "pickedUp")?.at ?? now))} ago
                        </p>
                        <button type="button" onClick={() => registerAtLab(g)}
                          className="mt-2 min-h-11 w-full rounded-lg bg-brand px-3 font-semibold text-white hover:bg-brand-strong">
                          Register {g.samples.length} {g.samples.length === 1 ? "sample" : "samples"} at lab
                        </button>
                      </li>
                    ))}
                    {stuck.map((v) => {
                      if (v.status.kind !== "atDoor") return null;
                      const p = v.status.trip.person;
                      return (
                        <li key={v.robot.id} className={`${panel} border-behind p-3`}>
                          <p className="font-semibold">Pickup delayed · {p.area}</p>
                          <p className="text-sm text-muted">
                            {v.robot.name} has waited {ago(v.status.waitedMs)} at {pickupCode(v.status.trip.sampleId)}.
                            {" "}Call{p.interpreter ? ` with a ${p.interpreter} interpreter` : p.homeLanguage ? ` (${p.homeLanguage})` : ""}.
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section aria-labelledby="trips-h">
                  <h2 id="trips-h" className="text-lg font-semibold">On a trip ({active.length})</h2>
                  {active.length === 0 && <p className="mt-1 text-muted">All robots are at their hubs.</p>}
                  <ul className={`${panel} mt-2 divide-y divide-rule border-rule`}>
                    {active.map((v) => {
                      if (v.status.kind === "idle") return null;
                      const t = v.status.trip;
                      const on = selected === v.robot.id;
                      return (
                        <li key={v.robot.id}>
                          <button type="button" aria-pressed={on} onClick={() => toggle(v.robot.id)}
                            className={`flex min-h-14 w-full flex-wrap items-center justify-between gap-3 px-3 py-2 text-left hover:bg-paper ${on ? "bg-brand-soft" : ""}`}>
                            <span className="min-w-0">
                              <span className="block font-semibold">{v.robot.name}{t.sampleId === ME ? " · phone demo" : ""}</span>
                              <span className="block truncate text-sm text-muted">{pickupCode(t.sampleId)}, {t.route ? "the phone's location" : t.person.area}</span>
                            </span>
                            <span className="shrink-0 text-right text-sm">{doing(v)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section aria-labelledby="ready-h">
                  <h2 id="ready-h" className="text-lg font-semibold">Waiting for a robot ({ready.length})</h2>
                  {ready.length === 0 ? (
                    <p className="mt-1 text-muted">None.</p>
                  ) : (
                    <ul id="waiting-pickups" className={`${panel} mt-2 divide-y divide-rule border-rule text-sm`}>
                      {(showAllReady ? ready : ready.slice(0, SHOWN)).map((s) => (
                        <li key={s.id} className="flex justify-between gap-3 px-3 py-2">
                          <span>{pickupCode(s.id)}, {s.person.area}</span>
                          <span className="text-muted">{ago(now - (s.events.find((e) => e.type === "sampleTaken")?.at ?? now))}</span>
                        </li>
                      ))}
                      {ready.length > SHOWN && <li>
                        <button type="button" aria-expanded={showAllReady} aria-controls="waiting-pickups"
                          onClick={() => setShowAllReady((value) => !value)}
                          className="min-h-11 w-full px-3 py-2 text-left font-medium text-brand hover:bg-brand-soft">
                          {showAllReady ? "Show fewer pickups" : `Show all ${ready.length} pickups`}
                        </button>
                      </li>}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      <DemoBar onReset={resetDemo}>
        <details className="basis-full">
          <summary className="w-fit cursor-pointer py-2 font-medium text-brand">Simulation settings</summary>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2">
            <label className="inline-flex min-h-11 items-center gap-2">
              Simulation speed
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value) as SimSpeed)} className="rounded-md border border-rule bg-white px-2">
                <option value={1}>Real time (6 km/h)</option>
                <option value={20}>20× faster</option>
                <option value={60}>60× faster</option>
              </select>
            </label>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} className="accent-[var(--brand)]" />
              Simulate other households
            </label>
            <span>Speed applies to new trips. Existing trips keep their speed.</span>
          </div>
        </details>
      </DemoBar>
    </main>
  );
}
