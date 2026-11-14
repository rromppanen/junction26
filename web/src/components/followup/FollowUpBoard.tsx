"use client";

import { useEffect, useMemo, useState } from "react";
import type { Barrier } from "@/lib/followup/barrier";
import type { Outreach } from "@/lib/followup/message";
import {
  DEMO_PATIENTS,
  LANGUAGE_NAMES,
  OVERDUE_DAYS,
  REGISTRY_BASELINE as R,
  STATUS_LABELS,
  caseId,
  isResolved,
  sortWorklist,
  type Owner,
  type Patient,
  type Status,
} from "@/lib/followup/patients";

type ReadReply = Barrier & { source: "gemini" | "rules"; translation?: string };
type Entry = { at: string; from: "nurse" | "patient" | "system"; text: string; note?: string };
type DemoState = { patients: Patient[]; threads: Record<string, Entry[]> };

const STORAGE_KEY = "followup-demo-v1";
const FRESH: DemoState = { patients: DEMO_PATIENTS, threads: {} };

/** Example replies a presenter can click, in the patient's own language where it matters. */
const QUICK_REPLIES: Record<string, string[]> = {
  p1: ["لا أستطيع أخذ إجازة من العمل", "I can't get time off work"],
  p2: ["Pelottaa, sattuuko se?", "Kyllä, varatkaa aika"],
  p3: ["What does this mean?", "Please call me"],
  p6: ["I have no car and the bus is far", "Please call me"],
};
const DEFAULT_REPLIES = ["Yes, please book", "I can't get time off work", "I already had it done at occupational health", "I'm scared it will hurt"];

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const STATUS_TONE: Record<Status, string> = {
  not_contacted: "bg-behind-soft text-behind",
  contacted: "bg-par-soft text-ink",
  barrier: "bg-behind-soft text-behind",
  booked: "bg-par-soft text-ink",
  verify_elsewhere: "bg-par-soft text-ink",
  examined: "bg-ahead-soft text-ahead",
  examined_elsewhere: "bg-ahead-soft text-ahead",
};

const NEXT_ACTION: Partial<Record<Status, string>> = {
  contacted: "Wait for reply, call if none in 3 days",
  booked: "Record the examination when it is done",
  verify_elsewhere: "Check the outside report in Kanta, then confirm",
  examined: "None",
  examined_elsewhere: "None",
};

const btn = "min-h-11 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50";
const primary = `${btn} bg-brand text-white`;
const secondary = `${btn} border border-rule`;

export function FollowUpBoard() {
  const [state, setState] = useState<DemoState>(FRESH);
  const [selectedId, setSelectedId] = useState("p1");
  const [draft, setDraft] = useState<Outreach | null>(null);
  const [reading, setReading] = useState<ReadReply | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<"" | "draft" | "reply">("");
  const [error, setError] = useState("");

  // Synthetic demo state only. Storage can be unavailable; the demo still works without it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved) as DemoState);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const { patients, threads } = state;
  const list = useMemo(() => sortWorklist(patients), [patients]);
  const selected = patients.find((p) => p.id === selectedId) ?? patients[0];
  const thread = threads[selected.id] ?? [];

  const open = patients.filter((p) => !isResolved(p));
  const overdue = open.filter((p) => p.status !== "booked" && p.daysSincePositive >= OVERDUE_DAYS).length;
  const owned = open.filter((p) => p.owner && p.nextAction).length;
  const bookedNotExamined = patients.filter((p) => p.status === "booked").length;

  function select(id: string) {
    setSelectedId(id);
    setDraft(null);
    setReading(null);
    setReply("");
    setError("");
  }
  function log(id: string, e: Omit<Entry, "at">) {
    setState((s) => ({ ...s, threads: { ...s.threads, [id]: [...(s.threads[id] ?? []), { at: now(), ...e }] } }));
  }
  function update(id: string, status: Status, owner?: Owner, nextAction?: string) {
    setState((s) => ({
      ...s,
      patients: s.patients.map((p) =>
        p.id === id ? { ...p, status, owner: owner ?? p.owner, nextAction: nextAction ?? NEXT_ACTION[status] ?? p.nextAction } : p,
      ),
    }));
  }
  function reset() {
    setState(FRESH);
    select("p1");
  }

  async function call<T>(body: object): Promise<T | null> {
    setError("");
    try {
      const res = await fetch("/api/followup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      return json as T;
    } catch (e) {
      setError(`${e instanceof Error ? e.message : "Request failed"}. You can still write the message yourself.`);
      return null;
    }
  }

  async function makeDraft() {
    setBusy("draft");
    const out = await call<Outreach>({ action: "draft", patientId: selected.id });
    setBusy("");
    setDraft(out ?? { language: selected.language, sms: "", backTranslation: "", source: "template" });
  }

  function send() {
    if (!draft?.sms.trim()) return;
    log(selected.id, { from: "nurse", text: draft.sms, note: draft.backTranslation && draft.backTranslation !== draft.sms ? draft.backTranslation : undefined });
    setDraft(null);
    if (selected.status === "not_contacted") update(selected.id, "contacted");
  }

  async function receive(text: string) {
    if (!text.trim()) return;
    const id = selected.id;
    log(id, { from: "patient", text });
    setReply("");
    setBusy("reply");
    const out = await call<ReadReply>({ action: "reply", text });
    setBusy("");
    if (out) {
      setReading(out);
      if (out.translation && out.translation !== text) log(id, { from: "system", text: `AI translation: ${out.translation}` });
      update(id, "barrier", out.owner, out.action);
    }
  }

  function act() {
    if (!reading) return;
    log(selected.id, { from: "system", text: `${reading.owner}: ${reading.action}` });
    update(selected.id, reading.nextStatus, reading.owner);
    setReading(null);
  }

  function confirmClose(status: "examined" | "examined_elsewhere", text: string) {
    if (!window.confirm(`${text}\n\nOnly confirm this if it has been checked. It closes the case.`)) return;
    log(selected.id, { from: "system", text });
    update(selected.id, status, "Screening nurse");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-rule bg-surface p-4 sm:p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted">The gap · observed, public data</p>
        <p className="mt-1 text-[length:var(--step-2)] font-semibold leading-tight">
          In {R.year}, {R.noColonoscopy.toLocaleString("en-US")} of {R.positiveTests.toLocaleString("en-US")} positive bowel screening tests in Finland ({pct(R.noColonoscopyShare)}) had no colonoscopy recorded in the programme.
        </p>
        <p className="mt-2 text-sm text-muted">
          Helsinki: {pct(R.helsinkiShare)}. In the 2022 round, {R.cancersInLostGroup2022} bowel cancers were diagnosed in people with a positive test and no programme colonoscopy.
          Source: <a className="underline" href={R.source} target="_blank" rel="noreferrer">Finnish Cancer Registry, colorectal screening statistics</a>.
          Limits: some people were examined outside the programme or had a medical reason not to be; the numbers do not show why each case was lost.
        </p>
        <p className="mt-2 text-sm text-muted">
          Strategy link: National Cancer Strategy 2026–2035 Goal 3.1 (pp. 33–34) and roadmap action 3.1.2 (pp. 56–57) ask counties to set pathway stages, responsibilities and access times. This tool supports that coordination; it is not the official access-time indicator.
        </p>
      </section>

      <section aria-label="Demo metrics" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span><strong>{open.length}</strong> open of {patients.length}</span>
        <span><strong>{owned}/{open.length}</strong> open cases with an owner and next action</span>
        <span><strong>{bookedNotExamined}</strong> booked, not yet examined</span>
        <span><strong className="text-behind">{overdue}</strong> unbooked ≥{OVERDUE_DAYS} days</span>
        <span className="text-muted">Synthetic demo cases. The {OVERDUE_DAYS}-day limit is a demo assumption, not an official target.</span>
        <button type="button" onClick={reset} className={`${secondary} ml-auto`}>Reset demo</button>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="worklist-h">
          <h2 id="worklist-h" className="text-[length:var(--step-1)] font-semibold">Positive tests awaiting follow-up</h2>
          <p className="mt-1 text-sm text-muted">Sorted by a plain rule: unbooked and overdue first, then days waited. No AI risk score.</p>
          <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-surface">
            {list.map((p) => {
              const late = !isResolved(p) && p.status !== "booked" && p.daysSincePositive >= OVERDUE_DAYS;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    aria-current={p.id === selected.id}
                    className={`flex w-full min-h-11 items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-paper ${p.id === selected.id ? "bg-highlight" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{p.name}</span> <span className="text-xs text-muted">{caseId(p)}</span>
                      <span className={`block text-sm ${late ? "font-medium text-behind" : "text-muted"}`}>{p.daysSincePositive} days since positive · {LANGUAGE_NAMES[p.language]}</span>
                      {!isResolved(p) && <span className="block truncate text-xs text-muted">{p.owner}: {p.nextAction}</span>}
                    </span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_TONE[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="patient-h" className="rounded-lg border border-rule bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="patient-h" className="text-[length:var(--step-1)] font-semibold">{selected.name} <span className="text-sm font-normal text-muted">{caseId(selected)} · synthetic</span></h2>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_TONE[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
          </div>
          <p className="text-sm text-muted">
            {selected.age} {selected.sex === "M" ? "man" : "woman"} · {selected.municipality} · speaks {LANGUAGE_NAMES[selected.language]} · positive test {selected.daysSincePositive} days ago
          </p>
          {selected.flags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {selected.flags.map((f) => <li key={f} className="rounded bg-par-soft px-2 py-0.5 text-xs">{f}</li>)}
            </ul>
          )}
          <p className="mt-3 rounded-md bg-paper p-2.5 text-sm">
            <span className="font-medium">Owner:</span> {selected.owner} · <span className="font-medium">Next:</span> {selected.nextAction}
            <span className="mt-1 block text-xs text-muted">Closed only when an examination is recorded, or an outside examination is verified. A booking does not close the case.</span>
          </p>

          {thread.length > 0 && (
            <ol className="mt-4 space-y-2" aria-label="Activity log">
              {thread.map((e, i) => (
                <li key={i} className={`rounded-md p-2.5 text-sm ${e.from === "patient" ? "ml-8 bg-ahead-soft" : e.from === "nurse" ? "mr-8 border border-rule bg-paper" : "text-muted"}`}>
                  <span className="block text-xs font-medium text-muted">{e.at} · {e.from === "nurse" ? "Text message sent (simulated)" : e.from === "patient" ? "Patient replied (simulated)" : "Log"}</span>
                  <span dir="auto">{e.text}</span>
                  {e.note && <span className="mt-1 block text-xs text-muted">English: {e.note}</span>}
                </li>
              ))}
            </ol>
          )}

          {!isResolved(selected) && (
            <div className="mt-4 space-y-5">
              {selected.status === "booked" && (
                <div>
                  <h3 className="font-semibold">Examination</h3>
                  <button type="button" onClick={() => confirmClose("examined", "Colonoscopy done; result sent to the treating unit.")} className={`${primary} mt-2`}>Record examination done</button>
                </div>
              )}
              {selected.status === "verify_elsewhere" && (
                <div>
                  <h3 className="font-semibold">Outside examination</h3>
                  <button type="button" onClick={() => confirmClose("examined_elsewhere", "Outside colonoscopy report found in Kanta and checked.")} className={`${primary} mt-2`}>Confirm verified in Kanta</button>
                </div>
              )}

              {selected.status !== "booked" && selected.status !== "verify_elsewhere" && (
                <>
                  <div>
                    <h3 className="font-semibold">1. Message</h3>
                    {!draft ? (
                      <button type="button" onClick={makeDraft} disabled={busy !== ""} className={`${primary} mt-2`}>
                        {busy === "draft" ? "Writing…" : `Draft a text in ${LANGUAGE_NAMES[selected.language]}`}
                      </button>
                    ) : (
                      <div className="mt-2 space-y-2 text-sm">
                        <label htmlFor="draft" className="sr-only">Message text</label>
                        <textarea id="draft" dir="auto" rows={4} value={draft.sms} onChange={(e) => setDraft({ ...draft, sms: e.target.value })} className="w-full rounded-md border border-rule bg-paper p-2.5" />
                        {draft.backTranslation && draft.backTranslation !== draft.sms && <p className="text-xs text-muted">English check: {draft.backTranslation}</p>}
                        <p className="text-xs text-muted">
                          {draft.source === "gemini" ? "Drafted by AI from the case facts. Review it; a native speaker should check translations before real use." : "Checked template (AI unavailable)."} Nothing is sent for real.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={send} disabled={!draft.sms.trim()} className={primary}>Approve and send</button>
                          <button type="button" onClick={makeDraft} disabled={busy !== ""} className={secondary}>Redraft</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold">2. Patient reply <span className="font-normal text-muted">(simulated)</span></h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(QUICK_REPLIES[selected.id] ?? DEFAULT_REPLIES).map((q) => (
                        <button key={q} type="button" dir="auto" onClick={() => receive(q)} disabled={busy !== ""} className="min-h-9 rounded-full border border-rule px-3 py-1 text-sm hover:bg-paper disabled:opacity-50">{q}</button>
                      ))}
                    </div>
                    <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); receive(reply); }}>
                      <label htmlFor="reply" className="sr-only">Patient reply</label>
                      <input id="reply" dir="auto" value={reply} maxLength={600} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply in any language" className="min-h-11 min-w-0 flex-1 rounded-md border border-rule bg-paper px-3 text-sm" />
                      <button type="submit" disabled={busy !== "" || !reply.trim()} className={secondary}>{busy === "reply" ? "Reading…" : "Receive"}</button>
                    </form>
                  </div>

                  {reading && (
                    <div className="rounded-md border-l-4 border-behind bg-behind-soft p-3">
                      <h3 className="font-semibold">3. Barrier: {reading.label}</h3>
                      <p className="mt-1 text-sm"><span className="font-medium">{reading.owner}:</span> {reading.action}</p>
                      <p className="mt-1 text-xs text-muted">{reading.source === "gemini" ? "Barrier suggested by AI." : "Barrier suggested by keyword rules (AI unavailable)."} The nurse decides.</p>
                      <button type="button" onClick={act} className={`${primary} mt-3`}>Assign and record</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {isResolved(selected) && <p className="mt-4 rounded-md bg-ahead-soft p-3 text-sm text-ahead">Closed: {STATUS_LABELS[selected.status].toLowerCase()}.</p>}
          {error && <p role="alert" className="mt-3 text-sm text-behind">{error}</p>}
        </section>
      </div>
    </div>
  );
}
