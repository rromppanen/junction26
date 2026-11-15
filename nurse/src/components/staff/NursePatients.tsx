"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { BTN, STAGE_LABEL, type Row } from "./boardShared";
import { pickupCode } from "@/lib/robots/fleet";

function patientNote(row: Row): string | null {
  const flag = row.flags[0];
  if (!flag) return null;
  switch (flag.kind) {
    case "noSample":
      return `No sample · ${flag.days ?? 0} days since invitation`;
    case "awaitingIntake":
      return "Ready for lab registration";
    case "positiveNoBooking":
      return "Colonoscopy not booked";
    case "robotWaiting":
      return "Pickup delayed";
  }
}

/** A focused patient queue alongside the map; actions open in the shared drawer. */
/** How long the most pressing flag has waited, in days (0 for flags without a day count). */
function urgency(row: Row): number {
  return Math.max(0, ...row.flags.map((f) => f.days ?? 0));
}

export function NursePatients({
  rows,
  onSelect,
  onClose,
}: {
  rows: Row[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState(false);
  const [limit, setLimit] = useState(12);
  const moreButton = useRef<HTMLButtonElement>(null);
  const flagged = rows.filter((row) => row.flags.length > 0).length;
  const patients = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return rows
      .filter(
        (row) =>
          (!attention || row.flags.length > 0) &&
          (!search ||
            [
              row.s.person.name,
              row.s.person.area,
              row.s.person.municipality,
              row.s.person.lang,
              row.s.person.homeLanguage,
              pickupCode(row.s.id),
            ]
              .join(" ")
              .toLocaleLowerCase()
              .includes(search)),
      )
      .sort(
        (a, b) =>
          Number(b.flags.length > 0) - Number(a.flags.length > 0) ||
          // Most urgent first: the longest wait among a person's flags.
          urgency(b) - urgency(a) ||
          a.s.person.name.localeCompare(b.s.person.name),
      );
  }, [rows, query, attention]);
  return (
    <aside
      id="nurse-patients"
      aria-label="Nurse patient workspace"
      className="workspace-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Patients</h2>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center text-muted hover:bg-paper"
          aria-label="Close patients"
          onClick={onClose}
        >
          <X size={17} aria-hidden />
        </button>
      </div>
      <label className="relative mt-2 block">
        <span className="sr-only">Search patients</span>
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-3.5 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(12);
          }}
          placeholder="Name, area or pickup code"
          className="w-full rounded border border-rule bg-white py-2 pr-3 pl-9 text-sm"
        />
      </label>
      <div
        className="mt-4 flex border-b border-rule"
        aria-label="Patient queue filters"
      >
        <button
          type="button"
          aria-pressed={!attention}
          className={`queue-tab ${!attention ? "is-active" : ""}`}
          onClick={() => {
            setAttention(false);
            setLimit(12);
          }}
        >
          All patients <span className="queue-count">{rows.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={attention}
          className={`queue-tab ${attention ? "is-active" : ""}`}
          onClick={() => {
            setAttention(true);
            setLimit(12);
          }}
        >
          Needs attention <span className="queue-count">{flagged}</span>
        </button>
      </div>
      <p
        className={query ? "mt-3 text-xs text-muted" : "sr-only"}
        aria-live="polite"
      >
        {patients.length} {patients.length === 1 ? "patient" : "patients"}
        {query ? " found" : " in this queue"}
      </p>
      <ul
        id="patient-list"
        aria-label="Patients"
        className="divide-y divide-rule"
      >
        {patients.slice(0, limit).map((row) => (
          <li key={row.s.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              className="patient-row"
              onClick={() => onSelect(row.s.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">
                    {row.s.person.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    <span className="sr-only">Age </span>
                    {row.s.person.age}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {row.s.person.area || row.s.person.municipality} ·{" "}
                  {STAGE_LABEL[row.stage]}
                </span>
                {patientNote(row) && (
                  <span
                    className="mt-1 block text-xs text-behind"
                    title={row.flags[0].label}
                  >
                    {patientNote(row)}
                  </span>
                )}
              </span>
              <ChevronRight
                size={14}
                className="shrink-0 text-muted"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
      {patients.length === 0 && (
        <p className="py-6 text-sm text-muted">
          {rows.length === 0
            ? "No patients in the selected locations. Choose a location in Filters."
            : attention
              ? "No patients need attention in this queue."
              : "No patients match this search."}
          {(query || attention) && (
            <button
              type="button"
              className={`${BTN} mt-3 w-full`}
              onClick={() => {
                setQuery("");
                setAttention(false);
                setLimit(12);
              }}
            >
              Show all patients
            </button>
          )}
        </p>
      )}
      {patients.length > 12 && (
        <div className="mt-3 flex gap-2 border-t border-rule pt-3">
          {patients.length > limit && (
            <button
              ref={moreButton}
              type="button"
              className={`${BTN} flex-1`}
              aria-controls="patient-list"
              aria-expanded={limit > 12}
              onClick={() => setLimit(limit + 12)}
            >
              Show more patients
            </button>
          )}
          {limit > 12 && (
            <button
              type="button"
              className={`${BTN} flex-1`}
              aria-controls="patient-list"
              aria-expanded={true}
              onClick={() => {
                setLimit(12);
                requestAnimationFrame(() => moreButton.current?.focus());
              }}
            >
              Show fewer patients
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
