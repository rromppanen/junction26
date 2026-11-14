"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, DemoBar } from "@/components/NurseNav";
import { ME } from "@/components/staff/boardShared";
import { useSamples } from "@/lib/sample/store";
import { HUBS, hubOf, awaitingIntake, fleetAt, pickupCode, readyForPickup, simStep, tripsOf, type RobotView, type HubId, type SimSpeed } from "@/lib/robots/fleet";
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

const card = "rounded-xl border bg-surface";

export function RobotsView() {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [speed, setSpeed] = useState<SimSpeed>(20);
  const [hub, setHub] = useState<HubId | "all">("all");
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

  // Everything below is limited to the chosen hub; the simulation above still runs for all of them.
  const inHub = (h: HubId) => hub === "all" || h === hub;
  const shownFleet = fleet.filter((v) => inHub(v.robot.hub));
  const shownReady = ready.filter((s) => inHub(hubOf(s.person)));
  const active = shownFleet.filter((v) => v.status.kind !== "idle");
  const free = shownFleet.length - active.length;
  const listed = hub === "all" ? active : [...active, ...shownFleet.filter((v) => v.status.kind === "idle")];
  const stuck = shownFleet.filter((v) => v.status.kind === "atDoor" && v.status.flagged);
  const intake = awaitingIntake(samples, now).filter((g) => inHub(g.hub));
  const intakeCount = intake.reduce((n, g) => n + g.samples.length, 0);
  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-8 sm:px-6">
      <AppHeader />

      <div className="mx-auto w-full max-w-[96rem] pt-6">
        <h1 className="text-[length:var(--step-2)] font-semibold leading-tight text-brand-strong">Robots</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">{hub === "all" ? "Helsinki, Espoo and Vantaa" : `Pickups from ${HUBS[hub].name}`}</p>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            Hub
            <select value={hub} onChange={(e) => { setHub(e.target.value as HubId | "all"); setSelected(null); }}
              className="min-h-11 rounded-lg border border-rule bg-white px-3 font-normal">
              <option value="all">All hubs</option>
              {Object.values(HUBS).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
        </div>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ["Samples to collect", intakeCount, intakeCount > 0],
                ["Waiting too long at a door", stuck.length, stuck.length > 0],
                ["On a trip", active.length, false],
                ["Free", free, false],
              ] as const).map(([label, n, warn]) => (
                <div key={label} className={`${card} p-4 ${warn ? "border-behind" : "border-rule"}`}>
                  <dd className={`text-3xl font-semibold ${warn ? "text-behind" : "text-brand-strong"}`}>{n}</dd>
                  <dt className="mt-1 text-sm text-muted">{label}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
              <section aria-label="Map" className="min-w-0">
                <div className={`${card} overflow-hidden border-rule`}>
                  <LiveMap hub={hub} fleet={shownFleet} ready={shownReady} intake={Object.fromEntries(intake.map((g) => [g.hub, g.samples.length]))} routes={routes} selected={selected} onSelect={toggle} />
                </div>
                <ul aria-label="Map key" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-brand" aria-hidden />Robot</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-behind" aria-hidden />Needs you</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-sm bg-brand-strong" aria-hidden />Hub</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full border-2 border-ink bg-white" aria-hidden />Waiting for a robot</li>
                </ul>
              </section>

              <div className="flex min-w-0 flex-col gap-6">
                <section aria-labelledby="needs-h">
                  <h2 id="needs-h" className="text-lg font-semibold">Needs you</h2>
                  {intake.length === 0 && stuck.length === 0 && <p className="mt-1 text-muted">Nothing right now.</p>}
                  <ul className="mt-2 space-y-2">
                    {intake.map((g) => (
                      <li key={g.hub} className={`${card} border-behind p-3`}>
                        <p className="font-semibold">Collect at {HUBS[g.hub].name}</p>
                        <p className="text-sm text-muted">
                          {g.samples.length} {g.samples.length === 1 ? "sample" : "samples"}, oldest {ago(now - (g.samples[0].events.findLast((e) => e.type === "pickedUp")?.at ?? now))} ago
                        </p>
                        <button type="button" onClick={() => g.samples.forEach((s) => add(s.id, { type: "atLab" }))}
                          className="mt-2 min-h-11 w-full rounded-lg bg-brand px-3 font-semibold text-white hover:bg-brand-strong">
                          Register {g.samples.length} at the lab
                        </button>
                      </li>
                    ))}
                    {stuck.map((v) => {
                      if (v.status.kind !== "atDoor") return null;
                      const p = v.status.trip.person;
                      return (
                        <li key={v.robot.id} className={`${card} border-behind p-3`}>
                          <p className="font-semibold">No one at the door, {p.area}</p>
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
                  {/* All hubs: robots on a trip. One hub: every robot of that hub, free ones last. */}
                  <h2 id="trips-h" className="text-lg font-semibold">
                    {hub === "all" ? `On a trip (${active.length})` : `Robots at ${HUBS[hub].name} (${shownFleet.length})`}
                  </h2>
                  {listed.length === 0 && <p className="mt-1 text-muted">All robots are free at their hubs.</p>}
                  <ul className={`${card} mt-2 divide-y divide-rule border-rule`}>
                    {listed.map((v) => {
                      const t = v.status.kind === "idle" ? null : v.status.trip;
                      const on = selected === v.robot.id;
                      return (
                        <li key={v.robot.id}>
                          <button type="button" aria-pressed={on} onClick={() => toggle(v.robot.id)}
                            className={`flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-paper ${on ? "bg-brand-soft" : ""}`}>
                            <span className="min-w-0">
                              <span className="block font-semibold">{v.robot.name}{t?.sampleId === ME ? " · phone demo" : ""}</span>
                              <span className="block truncate text-sm text-muted">{t ? `${pickupCode(t.sampleId)}, ${t.person.area}` : HUBS[v.robot.hub].name}</span>
                            </span>
                            <span className={`shrink-0 text-right text-sm ${t ? "" : "text-muted"}`}>{doing(v)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section aria-labelledby="ready-h">
                  <h2 id="ready-h" className="text-lg font-semibold">Waiting for a robot ({shownReady.length})</h2>
                  {shownReady.length === 0 ? (
                    <p className="mt-1 text-muted">None.</p>
                  ) : (
                    <ul className={`${card} mt-2 divide-y divide-rule border-rule text-sm`}>
                      {shownReady.slice(0, SHOWN).map((s) => (
                        <li key={s.id} className="flex justify-between gap-3 px-3 py-2">
                          <span>{pickupCode(s.id)}, {s.person.area}</span>
                          <span className="text-muted">{ago(now - (s.events.find((e) => e.type === "sampleTaken")?.at ?? now))}</span>
                        </li>
                      ))}
                      {shownReady.length > SHOWN && <li className="px-3 py-2 text-muted">and {shownReady.length - SHOWN} more</li>}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      <DemoBar onReset={() => { reset(); setSelected(null); }}>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} className="size-5 accent-[var(--brand)]" />
          Other households
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          Speed
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value) as SimSpeed)} className="min-h-11 rounded-lg border border-rule bg-white px-2">
            <option value={1}>Real (6 km/h)</option>
            <option value={20}>20×</option>
            <option value={60}>60×</option>
          </select>
        </label>
      </DemoBar>
    </main>
  );
}
