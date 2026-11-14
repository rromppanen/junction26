"use client";

import { useRef, useState } from "react";
import { CalendarCheck, CheckCircle2, FlaskConical, PackageCheck, Phone, Send } from "lucide-react";
import { BTN, colonoscopySlots, type ActFn, type Row } from "./boardShared";

export function SampleActions({ row, now, busy, act }: { row: Row; now: number; busy: boolean; act: ActFn }) {
  const callRef = useRef<HTMLButtonElement>(null);
  function closeCall() {
    setCalling(false);
    requestAnimationFrame(() => callRef.current?.focus());
  }
  const [calling, setCalling] = useState(false);
  const [note, setNote] = useState("");
  const open = row.stage !== "done" && row.stage !== "negative";
  const id = row.s.id;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {open && (
          <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "reminderSent")}>
            <Send size={16} aria-hidden /> Send reminder
          </button>
        )}
        {open && !calling && (
          <button type="button" ref={callRef} className={BTN} onClick={() => setCalling(true)}>
            <Phone size={16} aria-hidden /> Record a call
          </button>
        )}
        {row.flags.some((f) => f.kind === "awaitingIntake") && (
          <button type="button" className={`${BTN} border-brand`} disabled={busy} onClick={() => act(row, "atLab")}>
            <PackageCheck size={16} aria-hidden /> Collected and registered at the lab
          </button>
        )}
        {row.stage === "atLab" && (
          <>
            <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "resultNegative")}>
              <FlaskConical size={16} aria-hidden /> Result: no blood
            </button>
            <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "resultPositive")}>
              <FlaskConical size={16} aria-hidden /> Result: blood found
            </button>
          </>
        )}
        {row.stage === "colonoscopyBooked" && (
          <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "colonoscopyDone")}>
            <CheckCircle2 size={16} aria-hidden /> Mark colonoscopy done
          </button>
        )}
      </div>
      {open && calling && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (busy || !note.trim()) return; act(row, "nurseCalled", { note: note.trim() }); setNote(""); closeCall(); }}>
          <label className="w-full text-sm font-medium" htmlFor={`call-note-${id}`}>Call note</label>
          <input autoFocus required placeholder="What happened and what was agreed?" id={`call-note-${id}`} value={note} onChange={(e) => setNote(e.target.value)}
            className="min-h-11 min-w-0 flex-1 basis-48 rounded-lg border border-rule px-3 text-sm" />
          <button type="submit" className={BTN} disabled={busy || !note.trim()}>
            Save note
          </button>
          <button type="button" className={BTN} onClick={closeCall}>Cancel</button>
        </form>
      )}
      {row.stage === "positive" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Book colonoscopy</span>
          {colonoscopySlots(now).map((slot) => (
            <button key={slot} type="button" className={BTN} disabled={busy}
              onClick={() => act(row, "colonoscopyBooked", { slot })}>
              <CalendarCheck size={16} aria-hidden /> {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
