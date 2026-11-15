"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Languages, X } from "lucide-react";
import { MiniTimeline } from "./MiniTimeline";
import { reminderNote } from "@/lib/sample/model";
import { SampleActions } from "./SampleActions";
import {
  EVENT_LABEL,
  STAGE_LABEL,
  stepIndex,
  timeFmt,
  type ActFn,
  type Row,
} from "./boardShared";

export function SampleDrawer({
  row,
  now,
  busy,
  act,
  status,
  onClose,
}: {
  row: Row;
  now: number;
  busy: boolean;
  act: ActFn;
  status: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  const p = row.s.person;
  useEffect(() => {
    // A recorded result or booking can remove the focused action button.
    if (!dialogRef.current?.contains(document.activeElement))
      contentRef.current?.focus();
  }, [row.stage, status]);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFn.current();
      }
      if (e.key !== "Tab") return;
      const elements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ) ?? [],
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 hidden bg-ink/30 md:block"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-xl md:w-[32rem] md:max-w-full"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-rule p-4">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-lg font-semibold">
              {p.name}
            </h2>
            <p className="text-sm text-muted">
              {p.age} years · {p.area ? `${p.area}, ` : ""}
              {p.municipality}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-rule hover:bg-brand-soft"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div
          ref={contentRef}
          tabIndex={-1}
          aria-label="Patient record"
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        >
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            {p.homeLanguage && (
              <>
                <dt className="text-muted">Home language</dt>
                <dd>{p.homeLanguage}</dd>
              </>
            )}
            <dt className="text-muted">App language</dt>
            <dd>{{ en: "English", fi: "Finnish", sv: "Swedish" }[p.lang]}</dd>
          </dl>
          {p.interpreter && (
            <p className="mt-3 flex items-center gap-2 border-l-2 border-brand pl-3 text-sm font-medium text-brand-strong">
              <Languages size={16} aria-hidden />
              {p.interpreter} interpreter needed
            </p>
          )}
          <p className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <MiniTimeline
              step={stepIndex(row.stage)}
              flagged={row.flags.length > 0}
            />
            <span className="text-muted">{STAGE_LABEL[row.stage]}</span>
          </p>
          {row.flags.map((f) => (
            <p
              key={f.kind}
              className="mt-2 flex items-start gap-1 rounded-md bg-behind-soft px-2 py-1 text-sm font-medium text-behind"
            >
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0"
                aria-hidden
              />{" "}
              {f.label}
              {reminderNote(f) ? `. ${reminderNote(f)}.` : ""}
            </p>
          ))}

          <p
            role="status"
            aria-live="polite"
            className={
              status ? "mt-3 text-sm font-medium text-brand-strong" : "sr-only"
            }
          >
            {status}
          </p>
          <SampleActions
            key={row.s.id}
            row={row}
            now={now}
            busy={busy}
            act={act}
          />

          <h3 className="mt-6 border-t border-rule pt-4 text-sm font-semibold">
            History
          </h3>
          <ol className="mt-2 space-y-2 text-sm">
            {[...row.s.events]
              .sort((a, b) => b.at - a.at)
              .map((e, i) => (
                <li
                  key={`${e.type}-${e.at}-${i}`}
                  className="border-l-2 border-rule pl-3"
                >
                  <span className="block font-medium">
                    {EVENT_LABEL[e.type]}
                  </span>
                  <span className="block text-xs text-muted">
                    {timeFmt.format(e.at)}
                    {e.slot ? ` · ${e.slot}` : ""}
                    {e.note ? ` · ${e.note}` : ""}
                  </span>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
