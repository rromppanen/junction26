"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Languages, MessageSquare, Phone, PhoneOff, RotateCcw, Search, Send, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import {
  EVENT_LABEL,
  LANG_NAME,
  STAGE_LABEL,
  isOtherLanguage,
  isOverdue,
  slotsAfter,
  statusOf,
  summarize,
  type EventType,
  type InviteEvent,
  type Invitee,
  type Stage,
} from "@/lib/invite/model";
import { ME } from "@/lib/invite/seed";
import { useInvitees } from "@/lib/invite/store";
import { TARGET_ATTENDANCE } from "@/lib/invitation";

const BTN =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rule bg-white px-3 text-sm font-medium hover:bg-brand-soft disabled:opacity-50";
const PRIMARY = "inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-strong";

const dateFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const pct = (v: number | null) => (v === null ? "–" : `${(v * 100).toFixed(1)}%`);

type Tab = "action" | "upcoming" | "done" | "all";
type Row = { inv: Invitee; stage: Stage; overdue: boolean; appointment: number | null; attempt: number; noAnswer: number };

const ACTION_ORDER: Record<string, number> = { overdue: 0, elsewherePending: 1, call: 2, missed: 3 };

export function InviteBoard({ embed = false }: { embed?: boolean }) {
  const { list, now, add, addMany, reset } = useInvitees();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("action");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => setMounted(true), []);

  const rows: Row[] = useMemo(
    () =>
      list.map((inv) => {
        const s = statusOf(inv);
        return { inv, stage: s.stage, overdue: isOverdue(inv, now), appointment: s.appointment, attempt: s.attempt, noAnswer: s.noAnswer };
      }),
    [list, now],
  );
  const sum = useMemo(() => summarize(list, now), [list, now]);
  const live = rows.find((r) => r.inv.id === ME) ?? null;

  const needsAction = (r: Row) => r.overdue || r.stage === "missed" || r.stage === "call" || r.stage === "elsewherePending";
  const actionKey = (r: Row) => (r.overdue ? "overdue" : r.stage);
  const inTab = (r: Row) =>
    tab === "all" ||
    (tab === "action" && needsAction(r)) ||
    (tab === "upcoming" && r.stage === "booked" && !r.overdue) ||
    (tab === "done" && (r.stage === "attended" || r.stage === "elsewhere" || r.stage === "optedOut"));
  const q = query.trim().toLowerCase();
  const visible = rows
    .filter((r) => r.inv.id !== ME && inTab(r))
    .filter((r) => !q || `${r.inv.person.name} ${r.inv.person.id} ${r.inv.person.district} ${LANG_NAME[r.inv.person.lang]}`.toLowerCase().includes(q))
    .sort((a, b) =>
      tab === "action"
        ? (ACTION_ORDER[actionKey(a)] ?? 9) - (ACTION_ORDER[actionKey(b)] ?? 9)
        : (a.appointment ?? Infinity) - (b.appointment ?? Infinity),
    );
  const missed = rows.filter((r) => r.stage === "missed");
  const tabCount: Record<Tab, number> = {
    action: rows.filter(needsAction).length,
    upcoming: rows.filter((r) => r.stage === "booked" && !r.overdue).length,
    done: rows.filter((r) => r.stage === "attended" || r.stage === "elsewhere" || r.stage === "optedOut").length,
    all: rows.length,
  };

  function act(r: Row, e: Omit<InviteEvent, "at">) {
    add(r.inv.id, e);
    setStatus(`${EVENT_LABEL[e.type]}: ${r.inv.person.name}`);
  }

  function sendSecondToAll() {
    const slots = slotsAfter(now, missed.length, 10);
    addMany(missed.map((r, i) => ({ id: r.inv.id, e: { type: "secondBooked" as EventType, slot: slots[i] } })));
    setStatus(`Second booked time sent to ${missed.length} women`);
  }

  const goal = TARGET_ATTENDANCE;
  const att = sum.attendance ?? 0;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 pb-12 sm:px-6">
      <header className="mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="text-sm text-muted">Breast screening · Itäkeskus unit · autumn round</span>
        </div>
        <button type="button" className={BTN} onClick={() => { reset(); setStatus("Demo reset"); }}>
          <RotateCcw size={16} aria-hidden /> Reset demo
        </button>
      </header>
      <p className="sr-only" aria-live="polite">{status}</p>

      <div className="mx-auto w-full max-w-[96rem]">
        {!embed && <p className="mt-2 text-xs text-muted">Demo: invented women and appointments. The round is generated from Helsinki&rsquo;s attendance by language.</p>}
        {!mounted ? (
          <p className="mt-6 text-muted">Loading the round…</p>
        ) : (
          <>
            {/* Progress to the goal */}
            <section aria-labelledby="progress-h" className="mt-4 rounded-xl border border-rule bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="progress-h" className="font-semibold">Round progress</h2>
                <span className="text-sm text-muted">Goal: {Math.round(goal * 100)}% in every county (national cancer strategy)</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Invited", sum.invited],
                  ["Screened", sum.screened],
                  ["Attendance so far", pct(sum.attendance)],
                  ["Incl. screened elsewhere", pct(sum.recorded)],
                  ["Upcoming appointments", sum.upcoming],
                ].map(([label, v]) => (
                  <div key={label}>
                    <dd className="text-2xl font-semibold tabular-nums">{v}</dd>
                    <dt className="text-xs text-muted">{label}</dt>
                  </div>
                ))}
              </dl>
              <div className="relative mt-4 h-3 rounded-full bg-par-soft" role="img" aria-label={`Attendance ${pct(sum.attendance)} against a goal of ${Math.round(goal * 100)}%`}>
                <div className={`h-3 rounded-full ${att >= goal ? "bg-brand" : "bg-ahead"}`} style={{ width: `${Math.min(100, att * 100)}%` }} />
                <div className="absolute -top-1 h-5 w-0.5 bg-ink" style={{ left: `${goal * 100}%` }} />
                <span className="absolute top-4 -translate-x-1/2 text-xs text-muted" style={{ left: `${goal * 100}%` }}>80%</span>
              </div>
              <p className="mt-6 text-sm">
                {sum.due} women have had their first time. {sum.broughtBack > 0 && <><strong>{sum.broughtBack}</strong> {sum.broughtBack === 1 ? "was" : "were"} screened only after a second booked time or a call. </>}
                Attendance counts women whose first booked time has passed.
              </p>
            </section>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
              {/* Equity */}
              <section aria-labelledby="lang-h" className="rounded-xl border border-rule bg-white p-4">
                <h2 id="lang-h" className="flex items-center gap-2 font-semibold"><Languages aria-hidden size={18} className="text-muted" /> Attendance by mother tongue</h2>
                <ul className="mt-3 space-y-3">
                  {(["native", "other"] as const).map((g) => {
                    const v = sum.byLanguage[g];
                    const r = v.due ? v.screened / v.due : null;
                    return (
                      <li key={g}>
                        <div className="flex justify-between text-sm">
                          <span>{g === "native" ? "Finnish or Swedish" : "Other languages"}</span>
                          <span className="tabular-nums"><strong>{pct(r)}</strong> <span className="text-muted">({v.screened} of {v.due})</span></span>
                        </div>
                        <div className="relative mt-1 h-2 rounded-full bg-par-soft">
                          <div className={`h-2 rounded-full ${g === "other" ? "bg-behind" : "bg-ahead"}`} style={{ width: `${(r ?? 0) * 100}%` }} />
                          <div className="absolute -top-0.5 h-3 w-0.5 bg-ink" style={{ left: `${goal * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-muted">Registry 2024, all of Finland: 83.2% and 60.8%.</p>
              </section>

              {/* Layers */}
              <section aria-labelledby="layers-h" className="rounded-xl border border-rule bg-white p-4">
                <h2 id="layers-h" className="font-semibold">Invitation layers this round</h2>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {[
                    ["Booked time in the letter", sum.invited, "all invitations"],
                    ["Changed time online", sum.layers.rebooked, "rebookings"],
                    ["Text reminders", sum.layers.sms, "sent"],
                    ["Letters in her language", sum.layers.ownLanguage, "not Finnish or Swedish"],
                    ["Second booked times", sum.layers.secondBooked, "sent after a miss"],
                    ["Personal calls", sum.layers.calls, `${sum.layers.callBooked} booked on the call`],
                    ["Screened elsewhere", sum.layers.elsewhereReported, `${sum.layers.elsewhereVerified} found in Kanta`],
                  ].map(([label, n, sub]) => (
                    <li key={label as string} className="rounded-lg bg-paper p-2">
                      <div className="text-lg font-semibold tabular-nums">{n}</div>
                      <div className="font-medium leading-tight">{label}</div>
                      <div className="text-xs text-muted">{sub}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {live && (
              <section aria-label="Live woman (phone)" className="mt-3 rounded-xl border-2 border-brand bg-white p-3">
                <RowView r={live} now={now} act={act} live />
              </section>
            )}

            {/* Worklist */}
            <section aria-labelledby="work-h" className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="work-h" className="text-lg font-semibold">Worklist</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative">
                    <span className="sr-only">Search</span>
                    <Search aria-hidden size={15} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, ID, district, language" className="min-h-10 rounded-lg border border-rule bg-white ps-8 pe-3 text-sm" />
                  </label>
                  {missed.length > 0 && (
                    <button type="button" className={PRIMARY} onClick={sendSecondToAll}>
                      <Send aria-hidden size={15} /> Send second booked time to all {missed.length} missed
                    </button>
                  )}
                </div>
              </div>
              <nav aria-label="Filter" className="mt-3 flex flex-wrap gap-2">
                {([
                  ["action", "Needs action"],
                  ["upcoming", "Upcoming"],
                  ["done", "Done"],
                  ["all", "All"],
                ] as [Tab, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={tab === k}
                    onClick={() => setTab(k)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium ${tab === k ? "border-brand bg-brand text-white" : "border-rule bg-white hover:bg-brand-soft"}`}
                  >
                    {label} <span className={`text-xs ${tab === k ? "text-white" : "text-muted"}`}>{tabCount[k]}</span>
                  </button>
                ))}
              </nav>
              <ul className="mt-3 space-y-2">
                {visible.map((r) => (
                  <li key={r.inv.id} className={`rounded-xl border bg-white p-3 ${r.overdue || r.stage === "call" ? "border-behind" : "border-rule"}`}>
                    <RowView r={r} now={now} act={act} />
                  </li>
                ))}
                {visible.length === 0 && <li className="px-1 py-2 text-sm text-muted">Nothing here.</li>}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function RowView({ r, now, act, live = false }: { r: Row; now: number; act: (r: Row, e: Omit<InviteEvent, "at">) => void; live?: boolean }) {
  const p = r.inv.person;
  const other = isOtherLanguage(p.lang);
  const latest = [...r.inv.events].sort((a, b) => b.at - a.at)[0];
  const nextSlot = (days: number) => slotsAfter(now, 1, days)[0];

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {live && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Live (phone)</span>}
          <span className="font-semibold">{p.name}, {p.age}</span>
          <span className="text-xs text-muted">{p.id === ME ? "HEL-DEMO" : p.id}</span>
          {other && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ahead-soft px-2 py-0.5 text-xs font-medium text-ahead">
              <Languages aria-hidden size={12} /> Letter in {LANG_NAME[p.lang]}
            </span>
          )}
          {r.overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-behind-soft px-2 py-0.5 text-xs font-medium text-behind">
              <AlertTriangle aria-hidden size={12} /> Time passed, not marked
            </span>
          )}
        </div>
        <div className="text-sm text-muted">
          {p.district} · {STAGE_LABEL[r.stage]}
          {r.appointment !== null && ` · ${dateFmt.format(r.appointment)}`}
          {r.attempt > 1 && ` · booked time no. ${r.attempt}`}
          {r.noAnswer > 0 && ` · ${r.noAnswer} unanswered call${r.noAnswer > 1 ? "s" : ""}`}
        </div>
        {latest && (
          <details className="mt-1 text-xs text-muted">
            <summary className="cursor-pointer">Latest: {EVENT_LABEL[latest.type]}{latest.note ? ` (${latest.note})` : ""}, {dayFmt.format(latest.at)}</summary>
            <ol className="mt-1 space-y-0.5 ps-4">
              {[...r.inv.events].sort((a, b) => a.at - b.at).map((e, i) => (
                <li key={i}>
                  {dayFmt.format(e.at)}: {EVENT_LABEL[e.type]}
                  {e.outcome ? ` (${e.outcome === "noAnswer" ? "no answer" : e.outcome})` : ""}
                  {e.slot ? ` → ${dateFmt.format(e.slot)}` : ""}
                  {e.note ? ` (${e.note})` : ""}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {r.stage === "booked" && (
          <>
            {!r.overdue && (
              <button type="button" className={BTN} onClick={() => act(r, { type: "smsSent" })}>
                <MessageSquare aria-hidden size={15} /> Send reminder
              </button>
            )}
            <button type="button" className={BTN} onClick={() => act(r, { type: "attended" })}><Check aria-hidden size={15} /> Screened</button>
            <button type="button" className={BTN} onClick={() => act(r, { type: "missed" })}><X aria-hidden size={15} /> Did not come</button>
          </>
        )}
        {r.stage === "missed" && (
          <>
            <button type="button" className={PRIMARY} onClick={() => act(r, { type: "secondBooked", slot: nextSlot(10) })}>
              <CalendarClock aria-hidden size={15} /> Send second booked time
            </button>
            <button type="button" className={BTN} onClick={() => act(r, { type: "callQueued" })}><Phone aria-hidden size={15} /> Add to call queue</button>
          </>
        )}
        {r.stage === "call" && (
          <>
            <button type="button" className={PRIMARY} onClick={() => act(r, { type: "called", outcome: "booked", slot: nextSlot(4) })}>
              <Phone aria-hidden size={15} /> Booked on the call
            </button>
            <button type="button" className={BTN} onClick={() => act(r, { type: "called", outcome: "noAnswer" })}><PhoneOff aria-hidden size={15} /> No answer</button>
            <button type="button" className={BTN} onClick={() => act(r, { type: "called", outcome: "declined" })}><X aria-hidden size={15} /> Declined</button>
          </>
        )}
        {r.stage === "elsewherePending" && (
          <>
            <button type="button" className={PRIMARY} onClick={() => act(r, { type: "elsewhereVerified" })}><Check aria-hidden size={15} /> Found in Kanta</button>
            <button type="button" className={BTN} onClick={() => act(r, { type: "elsewhereNotFound" })}><X aria-hidden size={15} /> Not found</button>
          </>
        )}
      </div>
    </div>
  );
}
