"use client";

import { useRef, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  FlaskConical,
  PackageCheck,
  Phone,
  Send,
} from "lucide-react";
import { BTN, colonoscopySlots, type ActFn, type Row } from "./boardShared";

export function SampleActions({
  row,
  now,
  busy,
  act,
  onDraftChange,
}: {
  row: Row;
  now: number;
  busy: boolean;
  act: ActFn;
  onDraftChange?: (dirty: boolean) => void;
}) {
  const callRef = useRef<HTMLButtonElement>(null);
  const [calling, setCalling] = useState(false);
  const [note, setNote] = useState("");
  function closeCall() {
    setNote("");
    onDraftChange?.(false);
    setCalling(false);
    requestAnimationFrame(() => callRef.current?.focus());
  }
  const hasDraft = calling && Boolean(note.trim());
  const open = row.stage !== "done" && row.stage !== "negative";
  const intake = row.flags.some((flag) => flag.kind === "awaitingIntake");
  const booked = row.s.events.findLast(
    (event) => event.type === "colonoscopyBooked",
  );
  const id = row.s.id;
  const nextStep = intake
    ? "Register the returned sample at the lab."
    : (
        {
          invited:
            "Awaiting a sample. Contact the patient if they need help returning it.",
          sampleTaken: "Sample ready. Waiting for a robot pickup to be booked.",
          pickupBooked: "Pickup booked. Waiting for the robot to leave.",
          robotEnRoute: "The robot is on its way to the patient.",
          robotAtDoor: "The robot is at the patient's door.",
          pickedUp:
            "Sample collected. Waiting for the robot to return to the hub.",
          atLab: "Record the laboratory result.",
          positive: "Choose an appointment to book a colonoscopy.",
          colonoscopyBooked: booked?.slot
            ? `Appointment: ${booked.slot}`
            : "Colonoscopy booked.",
          negative: "Negative result recorded.",
          done: "Colonoscopy completed.",
        } as const
      )[row.stage];
  return (
    <div className="mt-5 space-y-5">
      <section aria-label="Screening actions">
        <h3 className="text-sm font-semibold">
          {open ? "Next step" : "Screening status"}
        </h3>
        <p className="mt-1 text-sm text-muted">{nextStep}</p>
        {hasDraft && (
          <p className="mt-2 text-xs text-muted">
            Save or cancel the call note before updating screening.
          </p>
        )}
        {intake && (
          <button
            type="button"
            className="primary-action mt-3 w-full"
            disabled={busy || hasDraft}
            onClick={() => act(row, "atLab")}
          >
            <PackageCheck size={16} aria-hidden />
            Register sample at lab
          </button>
        )}
        {row.stage === "atLab" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN}
              disabled={busy || hasDraft}
              onClick={() => act(row, "resultNegative")}
            >
              <FlaskConical size={16} aria-hidden />
              Result: no blood
            </button>
            <button
              type="button"
              className={BTN}
              disabled={busy || hasDraft}
              onClick={() => act(row, "resultPositive")}
            >
              <FlaskConical size={16} aria-hidden />
              Result: blood found
            </button>
          </div>
        )}
        {row.stage === "positive" && (
          <div
            className="mt-3 flex flex-col gap-2"
            aria-label="Colonoscopy appointments"
          >
            {colonoscopySlots(now).map((slot) => (
              <button
                key={slot}
                type="button"
                className={`${BTN} justify-start`}
                disabled={busy || hasDraft}
                onClick={() => act(row, "colonoscopyBooked", { slot })}
              >
                <CalendarCheck size={16} aria-hidden />
                {slot}
                <span className="ml-auto text-xs text-brand">Book</span>
              </button>
            ))}
          </div>
        )}
        {row.stage === "colonoscopyBooked" && (
          <button
            type="button"
            className="primary-action mt-3"
            disabled={busy || hasDraft}
            onClick={() => act(row, "colonoscopyDone")}
          >
            <CheckCircle2 size={16} aria-hidden />
            Mark colonoscopy done
          </button>
        )}
      </section>
      {open && (
        <section
          aria-label="Contact patient"
          className="border-t border-rule pt-4"
        >
          <h3 className="mb-2 text-sm font-semibold">Contact patient</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN}
              disabled={busy}
              onClick={() => act(row, "reminderSent")}
            >
              <Send size={16} aria-hidden />
              Send reminder
            </button>
            {!calling && (
              <button
                type="button"
                ref={callRef}
                className={BTN}
                onClick={() => setCalling(true)}
              >
                <Phone size={16} aria-hidden />
                Record a call
              </button>
            )}
          </div>
          {calling && (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (busy || !note.trim()) return;
                act(row, "nurseCalled", { note: note.trim() });
                setNote("");
                closeCall();
              }}
            >
              <label
                className="block text-sm font-medium"
                htmlFor={`call-note-${id}`}
              >
                Call note
              </label>
              <textarea
                autoFocus
                required
                rows={3}
                placeholder="What happened and what was agreed?"
                id={`call-note-${id}`}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  onDraftChange?.(Boolean(e.target.value.trim()));
                }}
                className="mt-1 w-full resize-y rounded border border-rule p-3 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  className={BTN}
                  disabled={busy || !note.trim()}
                >
                  Save note
                </button>
                <button type="button" className={BTN} onClick={closeCall}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
