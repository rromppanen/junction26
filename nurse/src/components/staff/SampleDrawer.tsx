"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { MiniTimeline } from "./MiniTimeline";
import { SampleActions } from "./SampleActions";
import { EVENT_LABEL, STAGE_LABEL, stepIndex, timeFmt, type ActFn, type Row } from "./boardShared";

export function SampleDrawer({ row, now, busy, act, onClose }: {
  row: Row;
  now: number;
  busy: boolean;
  act: ActFn;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  const p = row.s.person;

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeFn.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 hidden bg-ink/30 md:block" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white p-4 shadow-xl md:w-[28rem] md:max-w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-lg font-semibold">{p.name}</h2>
            <p className="text-sm text-muted">
              {p.age}, {p.area ? `${p.area}, ` : ""}{p.municipality}, {p.homeLanguage ? `${p.homeLanguage}, app ` : ""}{p.lang.toUpperCase()}{p.interpreter ? `, interpreter: ${p.interpreter}` : ""}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-rule hover:bg-brand-soft">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <MiniTimeline step={stepIndex(row.stage)} flagged={row.flags.length > 0} />
          <span className="text-muted">{STAGE_LABEL[row.stage]}</span>
        </p>
        {row.flags.map((f) => (
          <p key={f.kind} className="mt-2 flex items-start gap-1 rounded-md bg-behind-soft px-2 py-1 text-sm font-medium text-behind">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden /> {f.label}
          </p>
        ))}

        <SampleActions key={row.s.id} row={row} now={now} busy={busy} act={act} />

        <h3 className="mt-5 text-sm font-semibold">History</h3>
        <ol className="mt-2 space-y-2 text-sm">
          {[...row.s.events].sort((a, b) => b.at - a.at).map((e, i) => (
            <li key={`${e.type}-${e.at}-${i}`} className="border-l-2 border-rule pl-3">
              <span className="block font-medium">{EVENT_LABEL[e.type]}</span>
              <span className="block text-xs text-muted">
                {timeFmt.format(e.at)}{e.slot ? ` · ${e.slot}` : ""}{e.note ? ` · ${e.note}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
