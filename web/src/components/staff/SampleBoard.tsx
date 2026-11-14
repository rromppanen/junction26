"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarCheck, Phone, RotateCcw, Send, FlaskConical, CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { flagsOf, stageOf, STAGES_FOR_BOARD, type EventType, type Sample, type Stage } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";

export const DEMO_NOTE = "Demo: invented people; the robot, lab and bookings are simulated.";

const EVENT_LABEL: Record<EventType, string> = {
  invited: "Invitation sent",
  kitOpened: "Kit opened",
  sampleTaken: "Sample taken",
  pickupBooked: "Robot pickup booked",
  pickedUp: "Picked up by robot",
  atLab: "Arrived at the lab",
  resultNegative: "Result: no blood found",
  resultPositive: "Result: blood found",
  reminderSent: "Reminder sent",
  nurseCalled: "Nurse called",
  colonoscopyBooked: "Colonoscopy booked",
  colonoscopyDone: "Colonoscopy done",
};

const MILESTONES: Partial<Record<EventType, true>> = {
  invited: true, kitOpened: true, sampleTaken: true, pickupBooked: true, pickedUp: true, atLab: true,
  resultNegative: true, resultPositive: true, colonoscopyBooked: true, colonoscopyDone: true,
};

const ME = "me";

function matches(spec: Stage | Stage[], stage: Stage): boolean {
  return Array.isArray(spec) ? spec.includes(stage) : spec === stage;
}

function inStage(s: Sample, now: number): string {
  let at = 0;
  for (const e of s.events) if (MILESTONES[e.type] && e.at > at) at = e.at;
  const ms = Math.max(0, now - at);
  if (ms < 86_400_000) {
    const min = Math.max(1, Math.floor(ms / 60_000));
    return min >= 60 ? `${Math.floor(min / 60)} h in stage` : `${min} min in stage`;
  }
  return `${Math.floor(ms / 86_400_000)} d in stage`;
}

function colonoscopySlots(now: number): string[] {
  const times = ["9:00", "10:30", "13:00"];
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    out.push(`${fmt.format(d)} ${times[out.length]}`);
  }
  return out;
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Row = { s: Sample; stage: Stage; flags: ReturnType<typeof flagsOf> };

const STAGE_LABEL: Record<Stage, string> = {
  invited: "Invited",
  sampleTaken: "Sample taken",
  pickupBooked: "Pickup booked",
  robotEnRoute: "Robot on the way",
  robotAtDoor: "Robot at the door",
  pickedUp: "Picked up",
  atLab: "At lab",
  negative: "Negative",
  positive: "Positive",
  colonoscopyBooked: "Colonoscopy booked",
  done: "Done",
};

const BTN = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-white px-3 py-2 text-sm font-medium hover:bg-brand-soft disabled:opacity-50";

function SampleActions({ row, now, busy, note, setNote, act }: {
  row: Row;
  now: number;
  busy: boolean;
  note: string;
  setNote: (v: string) => void;
  act: (row: Row, type: EventType, extra?: { note?: string; slot?: string }) => void;
}) {
  const open = row.stage !== "done" && row.stage !== "negative";
  const btn = BTN;
  const sel = row;
  return (
    <div className="mt-4 flex flex-col gap-2">
      {open && (
        <button type="button" className={btn} disabled={busy} onClick={() => act(row, "reminderSent")}>
          <Send size={16} aria-hidden /> Send reminder
        </button>
      )}
      {open && (
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <label className="sr-only" htmlFor={`call-note-${row.s.id}`}>Call note</label>
          <input id={`call-note-${row.s.id}`} value={note} onChange={(e) => setNote(e.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-rule px-3 text-sm" />
          <button type="button" className={btn} disabled={busy} onClick={() => act(row, "nurseCalled", { note })}>
            <Phone size={16} aria-hidden /> Call
          </button>
        </div>
      )}
      {sel.stage === "atLab" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Record lab result</p>
          <button type="button" className={btn} disabled={busy} onClick={() => act(row, "resultNegative")}>
            <FlaskConical size={16} aria-hidden /> No blood
          </button>
          <button type="button" className={btn} disabled={busy} onClick={() => act(row, "resultPositive")}>
            <FlaskConical size={16} aria-hidden /> Blood found
          </button>
        </div>
      )}
      {sel.stage === "positive" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Book colonoscopy</p>
          {colonoscopySlots(now).map((slot) => (
            <button key={slot} type="button" className={btn} disabled={busy}
              onClick={() => act(row, "colonoscopyBooked", { slot })}>
              <CalendarCheck size={16} aria-hidden /> {slot}
            </button>
          ))}
        </div>
      )}
      {sel.stage === "colonoscopyBooked" && (
        <button type="button" className={btn} disabled={busy} onClick={() => act(row, "colonoscopyDone")}>
          <CheckCircle2 size={16} aria-hidden /> Mark colonoscopy done
        </button>
      )}
    </div>
  );
}

export function SampleBoard() {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Called, agreed next step");
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const rows = useMemo(
    () =>
      samples.map((s) => ({ s, stage: stageOf(s, now), flags: flagsOf(s, now) })).sort((a, b) =>
        (a.s.id === ME ? 0 : 1) - (b.s.id === ME ? 0 : 1)),
    [samples, now],
  );

  const inProgress = rows.filter((r) => r.stage !== "negative" && r.stage !== "done").length;
  const flagged = rows.filter((r) => r.flags.length > 0).length;
  const awaiting = rows.filter((r) => r.stage === "positive").length;

  const live = rows.find((r) => r.s.id === ME) ?? null;
  const latest = live ? [...live.s.events].sort((a, b) => b.at - a.at)[0] : undefined;
  const sel = rows.find((r) => r.s.id === selected) ?? null;

  function act(row: Row, type: EventType, extra: { note?: string; slot?: string } = {}) {
    if (busy) return;
    add(row.s.id, { type, ...extra });
    setStatus(`${EVENT_LABEL[type]}: ${row.s.person.name}`);
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusy(false), 800);
  }

  function clearBusy() {
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
  }

  const btn = BTN;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <header className="mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="text-sm text-muted">Screening nurse</span>
        </div>
        <button type="button" className={btn} onClick={() => { reset(); setSelected(null); clearBusy(); setStatus("Demo reset"); }}>
          <RotateCcw size={16} aria-hidden /> Reset demo
        </button>
      </header>
      <div className="mx-auto w-full max-w-[96rem] pt-4">
        <p className="text-xs text-muted">{DEMO_NOTE}</p>
        {!mounted ? (
          <p className="mt-6 text-muted">Loading the board…</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                ["In progress", inProgress, false],
                ["Flagged", flagged, flagged > 0],
                ["Positives awaiting colonoscopy", awaiting, false],
              ].map(([label, n, warn]) => (
                <div key={label as string} className={`rounded-xl border bg-white p-3 ${warn ? "border-behind" : "border-rule"}`}>
                  <dd className={`text-2xl font-semibold ${warn ? "text-behind" : ""}`}>{n as number}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label as string}</dt>
                </div>
              ))}
            </dl>
            <p className="sr-only" aria-live="polite">{status}</p>

            {live && (
              <section aria-label="Live sample (phone)" className="mt-4 rounded-xl border-2 border-brand bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live sample (phone)</span>
                  <h2 className="text-base font-semibold">{live.s.person.name}</h2>
                  <span className="text-sm text-muted">Stage: {STAGE_LABEL[live.stage]}</span>
                </div>
                {latest && (
                  <p className="mt-1 text-sm text-muted">Latest: {EVENT_LABEL[latest.type]}, {timeFmt.format(latest.at)}</p>
                )}
                {live.flags.map((f) => (
                  <p key={f.kind} className="mt-2 rounded-md bg-behind-soft px-2 py-1 text-sm font-medium text-behind">{f.label}</p>
                ))}
                <SampleActions row={live} now={now} busy={busy} note={note} setNote={setNote} act={act} />
              </section>
            )}

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 lg:overflow-x-auto lg:pb-2">
                <div className="grid gap-4 lg:min-w-[70rem] lg:grid-cols-7 lg:gap-3">
                  {STAGES_FOR_BOARD.map((col) => {
                    const items = rows.filter((r) => matches(col.stage, r.stage));
                    return (
                      <section key={col.label} aria-label={`${col.label}, ${items.length}`} className="rounded-xl bg-surface p-2">
                        <h2 className="flex items-center justify-between px-1 py-1 text-sm font-semibold">
                          {col.label}
                          <span className="rounded-full bg-white px-2 text-xs text-muted">{items.length}</span>
                        </h2>
                        <ul className="mt-1 space-y-2">
                          {items.map(({ s, flags }) => {
                            const p = s.person;
                            const isSel = selected === s.id;
                            return (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  aria-pressed={isSel}
                                  onClick={() => { if (s.id !== selected) clearBusy(); setSelected(s.id); }}
                                  className={`block w-full rounded-xl border bg-white p-3 text-left text-sm hover:bg-paper ${
                                    flags.length ? "border-behind" : "border-rule"
                                  } ${isSel ? "ring-2 ring-brand" : ""}`}
                                >
                                  {s.id === ME && (
                                    <span className="mb-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live (phone)</span>
                                  )}
                                  <span className="block font-semibold">{p.name}, {p.age}</span>
                                  <span className="block text-muted">{p.municipality}</span>
                                  <span className="block text-muted">
                                    {p.lang.toUpperCase()}{p.interpreter ? ` · interpreter: ${p.interpreter}` : ""}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted">{inStage(s, now)}</span>
                                  {flags.map((f) => (
                                    <span key={f.kind} className="mt-2 flex items-start gap-1 rounded-md bg-behind-soft px-2 py-1 text-xs font-medium text-behind">
                                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden /> {f.label}
                                    </span>
                                  ))}
                                </button>
                              </li>
                            );
                          })}
                          {items.length === 0 && <li className="px-1 py-2 text-xs text-muted">No samples</li>}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </div>

              <aside aria-label="Sample details" className="min-w-0 rounded-xl border border-rule bg-white p-4 lg:sticky lg:top-4">
                {!sel ? (
                  <p className="text-sm text-muted">Select a sample to see its history and act on it.</p>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold">{sel.s.person.name}</h2>
                    <p className="text-sm text-muted">
                      {sel.s.person.age}, {sel.s.person.municipality}, {sel.s.person.lang.toUpperCase()}
                      {sel.s.person.interpreter ? `, interpreter: ${sel.s.person.interpreter}` : ""}
                    </p>
                    {sel.flags.map((f) => (
                      <p key={f.kind} className="mt-2 rounded-md bg-behind-soft px-2 py-1 text-sm font-medium text-behind">{f.label}</p>
                    ))}

                    <SampleActions row={sel} now={now} busy={busy} note={note} setNote={setNote} act={act} />

                    <h3 className="mt-5 text-sm font-semibold">History</h3>
                    <ol className="mt-2 space-y-2 text-sm">
                      {[...sel.s.events].sort((a, b) => b.at - a.at).map((e, i) => (
                        <li key={`${e.type}-${e.at}-${i}`} className="border-l-2 border-rule pl-3">
                          <span className="block font-medium">{EVENT_LABEL[e.type]}</span>
                          <span className="block text-xs text-muted">
                            {timeFmt.format(e.at)}{e.slot ? ` · ${e.slot}` : ""}{e.note ? ` · ${e.note}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
