"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { BTN, STAGE_LABEL, type Row } from "./boardShared";
import { pickupCode } from "@/lib/robots/fleet";

/** A focused patient queue alongside the map; actions open in the shared drawer. */
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
          a.s.person.name.localeCompare(b.s.person.name),
      );
  }, [rows, query, attention]);
  return (
    <aside
      id="nurse-patients"
      aria-label="Nurse patient workspace"
      className="workspace-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
            <Stethoscope size={16} aria-hidden />
            Nurse workspace
          </div>
          <h2 className="text-xl font-semibold">Patients</h2>
        </div>
        <button
          type="button"
          className={BTN}
          aria-label="Close patients"
          onClick={onClose}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Review a patient to send a reminder, record a call or update their
        screening.
      </p>
      <label className="relative mt-4 block">
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
          className="w-full rounded-lg border border-rule bg-paper py-2 pr-3 pl-9 text-sm"
        />
      </label>
      <div className="my-4 flex gap-2" aria-label="Patient queue filters">
        <button
          type="button"
          aria-pressed={!attention}
          className={`queue-tab ${!attention ? "is-active" : ""}`}
          onClick={() => {
            setAttention(false);
            setLimit(12);
          }}
        >
          <Users size={14} aria-hidden />
          All {rows.length}
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
          <AlertTriangle size={14} aria-hidden />
          Attention {flagged}
        </button>
      </div>
      <p className="mb-2 text-xs text-muted" aria-live="polite">
        {patients.length} patients · selected locations
      </p>
      <ul aria-label="Patients" className="divide-y divide-rule">
        {patients.slice(0, limit).map((row) => (
          <li key={row.s.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              className="group flex w-full items-center gap-3 py-3 text-left"
              onClick={() => onSelect(row.s.id)}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${row.flags.length ? "bg-behind-soft text-behind" : "bg-brand-soft text-brand"}`}
              >
                {row.flags.length ? (
                  <AlertTriangle size={16} aria-hidden />
                ) : (
                  <Users size={16} aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold group-hover:text-brand">
                  {row.s.person.name}
                  <span className="ml-1 font-normal text-muted">
                    {row.s.person.age}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted">
                  {row.s.person.area || row.s.person.municipality} ·{" "}
                  {STAGE_LABEL[row.stage]}
                </span>
                {row.flags[0] && (
                  <span className="mt-1 block text-xs text-behind">
                    {row.flags[0].label}
                  </span>
                )}
              </span>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-brand"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
      {patients.length === 0 && (
        <p className="rounded-lg bg-paper p-4 text-sm text-muted">
          No patients match. Try another name, queue or location.
        </p>
      )}
      {patients.length > limit && (
        <button
          type="button"
          className={`${BTN} mt-3 w-full`}
          onClick={() => setLimit(limit + 12)}
        >
          Show more patients
        </button>
      )}
    </aside>
  );
}
