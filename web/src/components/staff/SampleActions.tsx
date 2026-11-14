"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, FlaskConical, Phone, Send } from "lucide-react";
import { BTN, followUpSlots, type ActFn, type Row } from "./boardShared";

export function SampleActions({ row, now, busy, act }: { row: Row; now: number; busy: boolean; act: ActFn }) {
  const [calling, setCalling] = useState(false);
  const [note, setNote] = useState("Called, agreed next step");
  const open = row.stage !== "done" && row.stage !== "negative";
  const id = row.s.id;
  const bowel = row.s.programme === "bowel";
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {open && (
          <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "reminderSent")}>
            <Send size={16} aria-hidden /> Send reminder
          </button>
        )}
        {open && !calling && (
          <button type="button" className={BTN} disabled={busy} onClick={() => setCalling(true)}>
            <Phone size={16} aria-hidden /> Call
          </button>
        )}
        {row.stage === "booked" && row.s.programme === "cervical" && (
          <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "clinicVisited")}>
            <CalendarCheck size={16} aria-hidden /> Record clinic visit
          </button>
        )}
        {row.stage === "atLab" && (
          <>
            <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "resultNegative")}>
              <FlaskConical size={16} aria-hidden /> Result: no findings
            </button>
            <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "resultPositive")}>
              <FlaskConical size={16} aria-hidden /> Result: positive
            </button>
          </>
        )}
        {row.stage === "colonoscopyBooked" && (
          <button type="button" className={BTN} disabled={busy} onClick={() => act(row, "colonoscopyDone")}>
            <CheckCircle2 size={16} aria-hidden /> Mark done
          </button>
        )}
      </div>
      {open && calling && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`call-note-${id}`}>Call note</label>
          <input id={`call-note-${id}`} value={note} onChange={(e) => setNote(e.target.value)}
            className="min-h-11 min-w-0 flex-1 basis-48 rounded-lg border border-rule px-3 text-sm" />
          <button type="button" className={BTN} disabled={busy}
            onClick={() => { act(row, "nurseCalled", { note }); setCalling(false); }}>
            Save
          </button>
          <button type="button" className={BTN} onClick={() => setCalling(false)}>Cancel</button>
        </div>
      )}
      {row.stage === "positive" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{bowel ? "Book colonoscopy" : "Book follow-up visit"}</span>
          {followUpSlots(now).map((slot) => (
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
