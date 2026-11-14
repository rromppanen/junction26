"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { NurseNav } from "@/components/NurseNav";
import { Wordmark } from "@/components/Wordmark";
import { BTN, DEMO_NOTE, ME } from "@/components/staff/boardShared";
import { useSamples } from "@/lib/sample/store";
import { DEPOTS, finishedTrips, fleetAt, readyForPickup, tripsOf, type RobotView } from "@/lib/robots/fleet";
import { RobotMap } from "./RobotMap";

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

/** One line on what the robot is doing, in words a nurse would say. */
function detail(v: RobotView): string {
  const s = v.status;
  switch (s.kind) {
    case "outbound":
      return `To ${s.trip.person.name}, ${s.trip.person.municipality}. Arrives in ${ago(s.etaMs)}.`;
    case "atDoor":
      return s.flagged
        ? `Has waited ${ago(s.waitedMs)} at ${s.trip.person.name}'s door. Consider calling.`
        : `At ${s.trip.person.name}'s door, ${s.trip.person.municipality}, for ${ago(s.waitedMs)}.`;
    case "returning":
      return s.trip.handedOver
        ? `Bringing ${s.trip.person.name}'s sample to ${DEPOTS[s.trip.depot].name}, ${ago(s.etaMs)} left.`
        : `Coming back to ${DEPOTS[s.trip.depot].name} without ${s.trip.person.name}'s sample, ${ago(s.etaMs)} left.`;
    default:
      return `At ${DEPOTS[v.robot.depot].name}, ready.`;
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
  const { samples, now, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const trips = useMemo(() => tripsOf(samples), [samples]);
  const fleet = useMemo(() => fleetAt(trips, now), [trips, now]);
  const ready = useMemo(() => readyForPickup(samples, now), [samples, now]);
  const recent = useMemo(() => finishedTrips(trips, now).slice(0, 5), [trips, now]);

  const count = (k: RobotView["status"]["kind"]) => fleet.filter((v) => v.status.kind === k).length;
  const flagged = fleet.filter((v) => v.status.kind === "atDoor" && v.status.flagged).length;
  const robotName = (id: string) => fleet.find((v) => v.robot.id === id)?.robot.name ?? id;
  const sampleTakenAt = (id: string) => samples.find((s) => s.id === id)?.events.find((e) => e.type === "sampleTaken")?.at ?? now;

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
        <h1 className="mt-3 text-[length:var(--step-1)] font-semibold">Pickup robots</h1>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading the robots…</p>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {([
                ["On the way", count("outbound"), false],
                ["At the door", count("atDoor"), flagged > 0],
                ["Returning", count("returning"), false],
                ["Parked", count("idle"), false],
              ] as const).map(([label, n, warn]) => (
                <div key={label} className={`rounded-xl border bg-white p-3 ${warn ? "border-behind" : "border-rule"}`}>
                  <dd className={`text-2xl font-semibold ${warn ? "text-behind" : ""}`}>{n}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label}{warn ? `, ${flagged} waiting too long` : ""}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <section aria-label="Map" className="min-w-0">
                <RobotMap fleet={fleet} ready={ready} selected={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} />
                <ul aria-label="Map legend" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-brand-strong" aria-hidden /> Depot</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand" aria-hidden /> On the way</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-ahead" aria-hidden /> At the door</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-behind" aria-hidden /> Waiting too long</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-par" aria-hidden /> Returning</li>
                  <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-ink bg-white" aria-hidden /> Sample ready, no pickup booked</li>
                </ul>
              </section>

              <div className="flex min-w-0 flex-col gap-4">
                <section aria-labelledby="fleet-h">
                  <h2 id="fleet-h" className="text-base font-semibold">Fleet</h2>
                  <ul className="mt-2 space-y-2">
                    {fleet.map((v) => {
                      const warn = v.status.kind === "atDoor" && v.status.flagged;
                      const trip = v.status.kind === "idle" ? null : v.status.trip;
                      return (
                        <li key={v.robot.id}>
                          <button type="button" aria-pressed={selected === v.robot.id}
                            onClick={() => setSelected((cur) => (cur === v.robot.id ? null : v.robot.id))}
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
                            {trip?.slot && v.status.kind !== "returning" && <span className="text-xs text-muted">Booked slot: {trip.slot}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section aria-labelledby="ready-h">
                  <h2 id="ready-h" className="text-base font-semibold">Samples ready, no pickup booked</h2>
                  {ready.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">None right now.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {ready.map((s) => (
                        <li key={s.id} className="rounded-lg border border-rule bg-white px-3 py-2">
                          <span className="font-medium">{s.person.name}</span>
                          <span className="text-muted">, {s.person.municipality} · sample taken {ago(now - sampleTakenAt(s.id))} ago</span>
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
                            {" · "}{t.person.name}, {t.person.municipality} · {t.handedOver ? "sample collected" : "came back empty"} {ago(now - (t.leftAt ?? now))} ago
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
