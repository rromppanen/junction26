"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BellOff, ChevronRight, Send } from "lucide-react";
import { AppHeader, DemoBar } from "@/components/NurseNav";
import { flagsOf, reminderNote, stageOf, STAGES_FOR_BOARD, type EventType, type Flag, type Stage } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import { pickupCode } from "@/lib/robots/fleet";
import { SampleDrawer } from "./SampleDrawer";
import {
  BTN, DEMO_NOTE, EVENT_LABEL, ME, STAGE_LABEL, inStage, matches, msInStage, type Row,
} from "./boardShared";

export { DEMO_NOTE };

function unreminded(r: Row): boolean {
  return r.flags.some((f) => f.kind === "noSample" && (f.remindedDaysAgo === null || f.remindedDaysAgo === undefined));
}

/** Tells a reminded person apart from one nobody has contacted yet. */
function ReminderTag({ flag }: { flag: Flag }) {
  const none = flag.remindedDaysAgo === null || flag.remindedDaysAgo === undefined;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${none ? "bg-behind-soft text-behind" : "bg-par-soft text-muted"}`}>
      {none ? <BellOff size={12} aria-hidden /> : <Send size={12} aria-hidden />} {reminderNote(flag)}
    </span>
  );
}

/** Stages where the robots page refers to the sample by its anonymous pickup code. */
const IN_PICKUP: Stage[] = ["sampleTaken", "robotEnRoute", "robotAtDoor", "pickedUp"];

export function SampleBoard({ embed = false }: { embed?: boolean }) {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setMounted(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const rows = useMemo(
    () =>
      samples
        .map((s): Row => ({ s, stage: stageOf(s, now), flags: flagsOf(s, now) }))
        .sort((a, b) =>
          (b.flags.length > 0 ? 1 : 0) - (a.flags.length > 0 ? 1 : 0) ||
          // Among the flagged, people nobody has reminded yet come first.
          (unreminded(b) ? 1 : 0) - (unreminded(a) ? 1 : 0) ||
          (a.s.id === ME ? 0 : 1) - (b.s.id === ME ? 0 : 1) ||
          msInStage(b.s, now) - msInStage(a.s, now)),
    [samples, now],
  );

  const inProgress = rows.filter((r) => r.stage !== "negative" && r.stage !== "done").length;
  const flagged = rows.filter((r) => r.flags.length > 0).length;
  const invited = rows.filter((r) => r.stage === "invited").length;

  const sel = rows.find((r) => r.s.id === selected) ?? null;

  const search = query.trim().toLocaleLowerCase();
  const visible = rows.filter((r) => {
    const person = r.s.person;
    const searchable = [person.name, person.municipality, person.area, person.homeLanguage,
      person.lang, person.interpreter, pickupCode(r.s.id)].filter(Boolean).join(" ").toLocaleLowerCase();
    return (filter === null || matches(STAGES_FOR_BOARD[filter].stage, r.stage)) &&
      (!attentionOnly || r.flags.length > 0) && (!search || searchable.includes(search));
  });

  function clearFilters() {
    setQuery("");
    setFilter(null);
    setAttentionOnly(false);
  }

  function act(row: Row, type: EventType, extra: { note?: string; slot?: string } = {}) {
    if (busy) return;
    if ((type === "resultNegative" || type === "resultPositive" || type === "colonoscopyDone") &&
      !window.confirm(`Record “${EVENT_LABEL[type]}” for ${row.s.person.name}?`)) return;
    add(row.s.id, { type, ...extra });
    setStatus(`Recorded: ${EVENT_LABEL[type].toLowerCase()} for ${row.s.person.name}.`);
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusy(false), 800);
  }

  function clearBusy() {
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
  }

  function select(id: string) {
    if (id !== selected) { clearBusy(); setStatus(""); }
    setSelected(id);
  }

  function closeDrawer() {
    const id = selected;
    setSelected(null);
    clearBusy();
    if (id) requestAnimationFrame(() => (rowRefs.current.get(id) ?? searchRef.current)?.focus());
  }


  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <AppHeader />
      <div className="mx-auto w-full max-w-[96rem] pt-3">
        {!mounted ? (
          <p className="mt-6 text-muted">Loading the board…</p>
        ) : (
          <>
            <div className="mt-6 border-b border-rule pb-5">
              <h1 className="text-title font-semibold text-brand-strong">Screening participants</h1>
              <p className="mt-2 text-sm text-muted">
                {inProgress} in progress · {invited} invited · {flagged} need attention
              </p>
            </div>
            <p role="status" aria-live="polite" className={status ? "mt-3 text-sm font-medium text-brand-strong" : "sr-only"}>{status}</p>


            <form role="search" className="mt-5 flex flex-wrap items-end gap-4" onSubmit={(e) => e.preventDefault()}>
              <label className="flex min-w-0 flex-1 basis-64 flex-col gap-1 text-sm font-medium">
                Find a participant
                <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, area, language or pickup code"
                  className="w-full rounded-md border border-rule bg-white px-3 py-2 font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Screening stage
                <select value={filter ?? "all"} onChange={(e) => setFilter(e.target.value === "all" ? null : Number(e.target.value))}
                  className="max-w-full rounded-md border border-rule bg-white px-3 py-2 font-normal">
                  <option value="all">All stages</option>
                  {STAGES_FOR_BOARD.map((stage, i) => <option key={stage.label} value={i}>{stage.label}</option>)}
                </select>
              </label>
              <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={attentionOnly} onChange={(e) => setAttentionOnly(e.target.checked)} className="accent-[var(--brand)]" />
                Needs attention
              </label>
              {(query || filter !== null || attentionOnly) && <button type="button" className={BTN} onClick={clearFilters}>Clear filters</button>}
            </form>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <p aria-live="polite">{visible.length} of {rows.length} people</p>
              <p>People who need attention are listed first.</p>
            </div>

            <div aria-hidden="true" className="mt-3 hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_12rem] gap-4 border-t border-rule bg-paper px-4 py-3 text-xs font-semibold text-muted lg:grid">
              <span>Participant</span><span>Attention needed</span><span>Screening stage</span>
            </div>
            <ul aria-label="Screening participants" className="mt-2 divide-y divide-rule border-y border-rule bg-white lg:mt-0">
              {visible.map((r) => {
                const { s, flags } = r;
                const p = s.person;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      ref={(el) => { if (el) rowRefs.current.set(s.id, el); else rowRefs.current.delete(s.id); }}
                      onClick={() => select(s.id)}
                      aria-haspopup="dialog"
                      className={`grid min-h-14 w-full grid-cols-1 items-center gap-x-4 gap-y-2 px-4 py-4 text-left text-sm hover:bg-brand-soft lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_12rem] ${selected === s.id ? "bg-brand-soft" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          {s.id === ME && (
                            <span className="text-xs font-medium text-brand">Phone demo</span>
                          )}
                          <span className="font-semibold">{p.name}, {p.age}</span>
                        </span>
                        <span className="block text-muted">
                          {p.area ? `${p.area}, ` : ""}{p.municipality} · {p.homeLanguage ? `${p.homeLanguage} · app ` : ""}{p.lang.toUpperCase()}{p.interpreter ? ` · interpreter: ${p.interpreter}` : ""}
                          {IN_PICKUP.includes(r.stage) ? ` · ${pickupCode(s.id)}` : ""}
                        </span>
                      </span>
                      <span className={`min-w-0 flex-col items-start gap-1 ${flags.length ? "flex" : "hidden lg:flex"}`}>
                        {flags.length > 0 ? (
                          <>
                            <span className="inline-flex items-start gap-1 font-medium text-behind">
                              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden /> {flags[0].label}
                            </span>
                            {reminderNote(flags[0]) && <ReminderTag flag={flags[0]} />}
                          </>
                        ) : <span className="hidden text-muted lg:inline">No flags</span>}
                      </span>
                      <span className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-2 font-medium">{STAGE_LABEL[r.stage]} <ChevronRight size={16} aria-hidden /></span>
                        <span className="text-xs text-muted">{inStage(s, now)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-4 py-8 text-sm text-muted"><p>No people match these filters.</p><button type="button" className={`${BTN} mt-3`} onClick={clearFilters}>Show everyone</button></li>}
            </ul>
          </>
        )}
      </div>
      {!embed && <DemoBar onReset={() => { if (!window.confirm("Reset the demo? This removes all recorded actions in both the nurse and participant apps.")) return; reset(); setSelected(null); clearBusy(); setStatus("Demo started again."); }} />}
      {sel && <SampleDrawer row={sel} now={now} busy={busy} act={act} status={status} onClose={closeDrawer} />}
    </main>
  );
}
