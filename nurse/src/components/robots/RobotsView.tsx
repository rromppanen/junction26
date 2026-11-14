"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, PackageCheck, RotateCcw } from "lucide-react";
import { NurseNav } from "@/components/NurseNav";
import { Wordmark } from "@/components/Wordmark";
import { BTN, DEMO_NOTE, ME } from "@/components/staff/boardShared";
import type { Person } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import { FLEET, HUBS, ROBOT_SPEED_KMH, awaitingIntake, finishedTrips, fleetAt, readyForPickup, simStep, tripsOf, type RobotView, type SimSpeed } from "@/lib/robots/fleet";
import { useRoutes } from "@/lib/robots/routes";

// Leaflet needs the browser's window, so the map renders on the client only.
const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => <div className="flex h-[min(72vh,680px)] min-h-[420px] items-center justify-center rounded-xl bg-paper text-sm text-muted">Loading the map…</div>,
});

function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86_400)} d`;
}

const STATUS_LABEL: Record<RobotView["status"]["kind"], string> = {
  idle: "Parked",
  outbound: "On the way",
  atDoor: "At the door",
  returning: "Returning",
};

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** "Somali, interpreter" or "" for people using the app in their own language. */
function language(p: Person): string {
  return [p.homeLanguage, p.interpreter ? "interpreter" : ""].filter(Boolean).join(", ");
}

/** One line on what the robot is doing, in words a nurse would say. */
function detail(v: RobotView): string {
  const s = v.status;
  switch (s.kind) {
    case "outbound":
      return `To ${s.trip.person.name}, ${s.trip.person.area}. Arrives in ${ago(s.etaMs)}.`;
    case "atDoor":
      return s.flagged
        ? `Has waited ${ago(s.waitedMs)} at ${s.trip.person.name}'s door. Consider calling${s.trip.person.interpreter ? ` with a ${s.trip.person.interpreter} interpreter` : ""}.`
        : `At ${s.trip.person.name}'s door, ${s.trip.person.area}, for ${ago(s.waitedMs)}.`;
    case "returning":
      return s.trip.handedOver
        ? `Bringing ${s.trip.person.name}'s sample to ${HUBS[s.trip.hub].name}, ${ago(s.etaMs)} left.`
        : `Coming back to ${HUBS[s.trip.hub].name} without ${s.trip.person.name}'s sample, ${ago(s.etaMs)} left.`;
    default:
      return `At ${HUBS[v.robot.hub].name}, ready.`;
  }
}

function pillClass(v: RobotView): string {
  const s = v.status;
  if (s.kind === "atDoor" && s.flagged) return "bg-behind-soft text-behind";
  if (s.kind === "atDoor") return "bg-ahead-soft text-ahead";
  if (s.kind === "outbound") return "bg-brand-soft text-brand";
  return "bg-par-soft text-ink";
}

export function RobotsView() {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [speed, setSpeed] = useState<SimSpeed>(1);
  const lastTick = useRef(0);
  useEffect(() => setMounted(true), []);

  const trips = useMemo(() => tripsOf(samples), [samples]);
  const fleet = useMemo(() => fleetAt(trips, now), [trips, now]);
  const ready = useMemo(() => readyForPickup(samples, now), [samples, now]);
  const recent = useMemo(() => finishedTrips(trips, now).slice(0, 5), [trips, now]);
  const activeTrips = useMemo(() => fleet.flatMap((v) => (v.status.kind === "idle" ? [] : [v.status.trip])), [fleet]);
  const routes = useRoutes(activeTrips);

  // Other households: while this page is open, robots go out to waiting samples and collect them.
  useEffect(() => {
    if (!mounted || !simulate || now === lastTick.current) return;
    lastTick.current = now;
    for (const a of simStep(samples, now, ME, `Now, ${clock.format(now)}`, speed)) add(a.sampleId, a.event);
  }, [mounted, simulate, speed, now, samples, add]);

  const active = fleet.filter((v) => v.status.kind !== "idle");
  const parked = fleet.filter((v) => v.status.kind === "idle");
  const count = (k: RobotView["status"]["kind"]) => fleet.filter((v) => v.status.kind === k).length;
  const flagged = fleet.filter((v) => v.status.kind === "atDoor" && v.status.flagged).length;
  const robotName = (id: string) => FLEET.find((r) => r.id === id)?.name ?? id;
  const sampleTakenAt = (id: string) => samples.find((s) => s.id === id)?.events.find((e) => e.type === "sampleTaken")?.at ?? now;
  const intake = awaitingIntake(samples, now);
  const intakeCount = intake.reduce((n, g) => n + g.samples.length, 0);
  const toggle =(id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <header className="mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Wordmark />
          <span className="text-sm text-muted">Screening nurse</span>
          <NurseNav />
        </div>
        <button type="button" className={BTN} onClick={() => { reset(); setSelected(null); }}>
          <RotateCcw size={16} aria-hidden /> Reset demo
        </button>
      </header>

      <div className="mx-auto w-full max-w-[96rem] pt-3">
        <p className="text-xs text-muted">{DEMO_NOTE}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[length:var(--step-1)] font-semibold">Pickup robots, Helsinki capital region</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <label className="inline-flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} className="size-5 accent-[var(--brand)]" />
              Simulate other households
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm">
              Speed
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value) as SimSpeed)}
                className="min-h-9 rounded-lg border border-rule bg-white px-2 text-sm">
                <option value={1}>Real time ({ROBOT_SPEED_KMH} km/h)</option>
                <option value={10}>10× faster</option>
                <option value={60}>60× faster</option>
              </select>
            </label>
          </div>
        </div>
        <p className="text-xs text-muted">
          Robots drive at about {ROBOT_SPEED_KMH} km/h, so a trip takes 5 to 40 minutes each way. A faster speed applies to robots sent after you change it.
        </p>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading the robots…</p>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              {([
                ["Arrived, waiting for a nurse", intakeCount, intakeCount > 0],
                ["On the way", count("outbound"), false],
                ["At the door", count("atDoor"), flagged > 0],
                ["Returning", count("returning"), false],
                ["Parked", count("idle"), false],
              ] as const).map(([label, n, warn]) => (
                <div key={label} className={`rounded-xl border bg-white p-3 ${warn ? "border-behind" : "border-rule"}`}>
                  <dd className={`text-2xl font-semibold ${warn ? "text-behind" : ""}`}>{n}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label}{warn && label === "At the door" ? `, ${flagged} waiting too long` : ""}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <section aria-label="Map of robots, routes and homes" className="min-w-0">
                <div className="overflow-hidden rounded-xl border border-rule">
                  <LiveMap fleet={fleet} ready={ready} intake={Object.fromEntries(intake.map((g) => [g.hub, g.samples.length]))} routes={routes} selected={selected} onSelect={toggle} />
                </div>
                <ul aria-label="Map legend" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-brand-strong" aria-hidden /> Hub</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-behind" aria-hidden /> Hub with samples to collect</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand" aria-hidden /> On the way</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-ahead" aria-hidden /> At the door</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-behind" aria-hidden /> Waiting too long</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-par" aria-hidden /> Returning</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-ink bg-white" aria-hidden /> Sample ready, no pickup booked</li>
                </ul>
                <p className="mt-1 text-xs text-muted">Zoom with the scroll wheel, a pinch or the + and − buttons; drag to move. Routes follow walking paths from OpenStreetMap. Without a connection the map draws a curve instead.</p>
              </section>

              <div className="flex min-w-0 flex-col gap-4">
                <section aria-labelledby="fleet-h">
                  <h2 id="fleet-h" className="text-base font-semibold">Out on trips ({active.length})</h2>
                  {active.length === 0 && <p className="mt-1 text-sm text-muted">All robots are parked.</p>}
                  <ul className="mt-2 space-y-2">
                    {active.map((v) => {
                      const warn = v.status.kind === "atDoor" && v.status.flagged;
                      const trip = v.status.kind === "idle" ? null : v.status.trip;
                      return (
                        <li key={v.robot.id}>
                          <button type="button" aria-pressed={selected === v.robot.id} onClick={() => toggle(v.robot.id)}
                            className={`flex min-h-14 w-full flex-col gap-1 rounded-xl border bg-white px-3 py-2 text-left text-sm hover:bg-paper ${warn ? "border-behind" : "border-rule"} ${selected === v.robot.id ? "ring-2 ring-brand" : ""}`}>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{v.robot.name}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pillClass(v)}`}>
                                {warn && <AlertTriangle size={12} aria-hidden />}
                                {warn ? "Waiting too long" : STATUS_LABEL[v.status.kind]}
                              </span>
                              {trip?.sampleId === ME && (
                                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live (phone)</span>
                              )}
                            </span>
                            <span className="text-muted">{detail(v)}</span>
                            {trip && language(trip.person) && <span className="text-xs text-muted">Language: {language(trip.person)}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {parked.length > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      <span className="font-medium text-ink">Parked ({parked.length}): </span>
                      {Object.values(HUBS)
                        .map((h) => ({ h, rs: parked.filter((v) => v.robot.hub === h.id) }))
                        .filter((g) => g.rs.length > 0)
                        .map((g) => `${g.h.name} ${g.rs.map((v) => v.robot.id.slice(1)).join(", ")}`)
                        .join(" · ")}
                    </p>
                  )}
                </section>

                <section aria-labelledby="intake-h" className="order-first">
                  <h2 id="intake-h" className="flex items-center gap-2 text-base font-semibold">
                    {intakeCount > 0 && <AlertTriangle size={16} className="text-behind" aria-hidden />}
                    Arrived, waiting for a nurse ({intakeCount})
                  </h2>
                  {intake.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">No samples waiting in the robots.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm">
                      {intake.map((g) => (
                        <li key={g.hub} className="rounded-xl border border-behind bg-white px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">
                              {HUBS[g.hub].name}: {g.samples.length} {g.samples.length === 1 ? "sample" : "samples"} to collect
                            </span>
                            <button type="button" className={BTN} onClick={() => g.samples.forEach((s) => add(s.id, { type: "atLab" }))}>
                              <PackageCheck size={16} aria-hidden /> Collected and registered
                            </button>
                          </div>
                          <p className="mt-1 text-muted">
                            {g.samples.slice(0, 6).map((s) => s.person.name).join(", ")}
                            {g.samples.length > 6 ? ` and ${g.samples.length - 6} more` : ""}
                            {" · "}longest wait {ago(now - (g.samples[0].events.findLast((e) => e.type === "pickedUp")?.at ?? now))}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="ready-h">
                  <h2 id="ready-h" className="text-base font-semibold">Samples ready, no pickup booked ({ready.length})</h2>
                  {ready.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">None right now.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {ready.map((s) => (
                        <li key={s.id} className="rounded-lg border border-rule bg-white px-3 py-2">
                          <span className="font-medium">{s.person.name}</span>
                          <span className="text-muted">, {s.person.area}, {s.person.municipality} · taken {ago(now - sampleTakenAt(s.id))} ago</span>
                          {language(s.person) && <span className="block text-xs text-muted">Language: {language(s.person)}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="recent-h">
                  <h2 id="recent-h" className="text-base font-semibold">Recent trips</h2>
                  {recent.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">No finished trips yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {recent.map((t) => (
                        <li key={`${t.sampleId}-${t.bookedAt}`} className="rounded-lg border border-rule bg-white px-3 py-2">
                          <span className="font-medium">{robotName(t.robotId)}</span>
                          <span className="text-muted">
                            {" · "}{t.person.name}, {t.person.area} · {t.handedOver ? "sample collected" : "came back empty"} {ago(now - (t.leftAt ?? now))} ago
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
