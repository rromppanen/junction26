"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { NurseNav } from "@/components/NurseNav";
import { Wordmark } from "@/components/Wordmark";
import { flagsOf, stageOf, STAGES_FOR_BOARD, type EventType } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import { MiniTimeline } from "./MiniTimeline";
import { SampleActions } from "./SampleActions";
import { SampleDrawer } from "./SampleDrawer";
import {
  BTN, DEMO_NOTE, EVENT_LABEL, ME, STAGE_LABEL, inStage, matches, msInStage, stepIndex, timeFmt, type Row,
} from "./boardShared";

export { DEMO_NOTE };

export function SampleBoard({ embed = false }: { embed?: boolean }) {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          (a.s.id === ME ? 0 : 1) - (b.s.id === ME ? 0 : 1) ||
          (b.flags.length > 0 ? 1 : 0) - (a.flags.length > 0 ? 1 : 0) ||
          msInStage(b.s, now) - msInStage(a.s, now)),
    [samples, now],
  );

  const inProgress = rows.filter((r) => r.stage !== "negative" && r.stage !== "done").length;
  const flagged = rows.filter((r) => r.flags.length > 0).length;
  const awaiting = rows.filter((r) => r.stage === "positive").length;

  const live = rows.find((r) => r.s.id === ME) ?? null;
  const latest = live ? [...live.s.events].sort((a, b) => b.at - a.at)[0] : undefined;
  const sel = rows.find((r) => r.s.id === selected) ?? null;

  const counts = STAGES_FOR_BOARD.map((c) => {
    const items = rows.filter((r) => matches(c.stage, r.stage));
    return { n: items.length, flagged: items.filter((r) => r.flags.length > 0).length };
  });
  const visible = filter === null ? rows : rows.filter((r) => matches(STAGES_FOR_BOARD[filter].stage, r.stage));

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

  function select(id: string) {
    if (id !== selected) clearBusy();
    setSelected(id);
  }

  function closeDrawer() {
    const id = selected;
    setSelected(null);
    clearBusy();
    if (id) requestAnimationFrame(() => rowRefs.current.get(id)?.focus());
  }

  const seg = "relative inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium";

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <header className="mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="text-sm text-muted">Screening nurse</span>
          <NurseNav />
        </div>
        <button type="button" className={BTN} onClick={() => { reset(); setSelected(null); clearBusy(); setStatus("Demo reset"); }}>
          <RotateCcw size={16} aria-hidden /> Reset demo
        </button>
      </header>
      <div className="mx-auto w-full max-w-[96rem] pt-3">
        {!embed && <p className="text-xs text-muted">{DEMO_NOTE}</p>}
        {!mounted ? (
          <p className="mt-6 text-muted">Loading the board…</p>
        ) : (
          <>
            <dl className={`grid grid-cols-3 gap-2 sm:gap-3 ${embed ? "mt-2" : "mt-4"}`}>
              {[
                ["In progress", inProgress, false],
                ["Flagged", flagged, flagged > 0],
                ["Positives awaiting colonoscopy", awaiting, false],
              ].map(([label, n, warn]) => (
                <div key={label as string} className={`rounded-xl border bg-white ${embed ? "px-3 py-1.5" : "p-3"} ${warn ? "border-behind" : "border-rule"}`}>
                  <dd className={`font-semibold ${embed ? "text-lg" : "text-2xl"} ${warn ? "text-behind" : ""}`}>{n as number}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label as string}</dt>
                </div>
              ))}
            </dl>
            <p className="sr-only" aria-live="polite">{status}</p>

            {live && (
              <section aria-label="Live sample (phone)" className="mt-3 rounded-xl border-2 border-brand bg-white p-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live sample (phone)</span>
                  <h2 className="text-base font-semibold">{live.s.person.name}</h2>
                  <span className="text-sm text-muted">Stage: {STAGE_LABEL[live.stage]}</span>
                  <MiniTimeline step={stepIndex(live.stage)} flagged={live.flags.length > 0} />
                </div>
                {latest && (
                  <p className="mt-1 text-sm text-muted">Latest: {EVENT_LABEL[latest.type]}, {timeFmt.format(latest.at)}</p>
                )}
                {live.flags.map((f) => (
                  <p key={f.kind} className="mt-2 rounded-md bg-behind-soft px-2 py-1 text-sm font-medium text-behind">{f.label}</p>
                ))}
                <SampleActions key={live.s.id} row={live} now={now} busy={busy} act={act} />
              </section>
            )}

            <nav aria-label="Filter by step" className="mt-4 flex flex-wrap gap-2">
              {[{ label: "All", n: rows.length, fl: flagged, i: null as number | null },
                ...STAGES_FOR_BOARD.map((c, i) => ({ label: c.label, n: counts[i].n, fl: counts[i].flagged, i }))].map((b) => {
                const on = filter === b.i;
                return (
                  <button key={b.label} type="button" aria-pressed={on} onClick={() => setFilter(b.i)}
                    className={`${seg} ${on ? "border-brand bg-brand text-white" : "border-rule bg-white hover:bg-brand-soft"}`}>
                    {b.label}
                    <span className={`text-xs ${on ? "text-white" : "text-muted"}`}>{b.n}</span>
                    {b.i !== null && b.fl > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-behind">
                        <span className="size-2 rounded-full bg-behind" aria-hidden />
                        <span className="sr-only">flagged: </span>{b.fl}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <ul className="mt-3 space-y-2">
              {visible.map((r) => {
                const { s, flags } = r;
                const p = s.person;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      ref={(el) => { if (el) rowRefs.current.set(s.id, el); else rowRefs.current.delete(s.id); }}
                      onClick={() => select(s.id)}
                      className={`flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border bg-white px-3 py-2 text-left text-sm hover:bg-paper ${
                        flags.length ? "border-behind" : "border-rule"
                      } ${selected === s.id ? "ring-2 ring-brand" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          {s.id === ME && (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live (phone)</span>
                          )}
                          <span className="font-semibold">{p.name}, {p.age}</span>
                          {flags.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-behind-soft px-2 py-0.5 text-xs font-medium text-behind">
                              <AlertTriangle size={12} aria-hidden /> {flags[0].label}
                            </span>
                          )}
                        </span>
                        <span className="block text-muted">
                          {p.municipality} · {p.lang.toUpperCase()}{p.interpreter ? ` · interpreter: ${p.interpreter}` : ""}
                        </span>
                      </span>
                      <span className="flex flex-col items-start gap-1 sm:items-end">
                        <MiniTimeline step={stepIndex(r.stage)} flagged={flags.length > 0} />
                        <span className="text-xs text-muted">{STAGE_LABEL[r.stage]} · {inStage(s, now)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-1 py-2 text-sm text-muted">No samples in this step.</li>}
            </ul>
          </>
        )}
      </div>
      {sel && <SampleDrawer row={sel} now={now} busy={busy} act={act} onClose={closeDrawer} />}
    </main>
  );
}
