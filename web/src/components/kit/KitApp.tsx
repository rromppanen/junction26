"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { ROBOT_TRAVEL_MS, robotProgress, stageOf, type Lang, type Stage } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import { RobotMap } from "./RobotMap";
import { LOCALES, STRINGS, type KitStrings } from "./strings";

const ME = "me";
const LANG_KEY = "lapi.kit.lang";
const LANGS: Lang[] = ["fi", "sv", "en"];
const NOW_LABELS = LANGS.map((l) => STRINGS[l].nowDemo);
const INTERPRETER_NOTE = "Interpreter needed";
const CLICK_GUARD_MS = 400;

function stepOf(stage: Stage): number {
  switch (stage) {
    case "invited": return 0;
    case "sampleTaken": case "pickupBooked": case "robotEnRoute": case "robotAtDoor": return 2;
    case "pickedUp": case "atLab": return 3;
    default: return 4;
  }
}

/** First option sends the robot now (demo); two later windows follow, today if there is time, otherwise tomorrow. */
function pickupSlots(now: number, t: KitStrings): string[] {
  const h = new Date(now).getHours();
  if (h <= 17) return [t.nowDemo, ...[2, 4].map((d) => `${t.today} ${h + d}–${h + d + 1}`)];
  return [t.nowDemo, ...["8–9", "10–11"].map((w) => `${t.tomorrow} ${w}`)];
}

/** Three colonoscopy times on upcoming weekdays, starting three days out. */
function colonoscopySlots(now: number, lang: Lang): string[] {
  const times = ["9:00", "10:30", "13:00"];
  const fmt = new Intl.DateTimeFormat(LOCALES[lang], { weekday: "short", day: "numeric", month: "short" });
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    out.push(`${fmt.format(d)} ${times[out.length]}`);
  }
  return out;
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function KitApp() {
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useState<Lang | null>(null);
  const [interpreter, setInterpreter] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const v = window.localStorage.getItem(LANG_KEY);
      if (v === "fi" || v === "sv" || v === "en") setStored(v);
    } catch {
      /* storage blocked: keep default */
    }
  }, []);

  function chooseLang(l: Lang) {
    setStored(l);
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }

  const me = samples.find((s) => s.id === ME);
  // When the demo is reset (here or from the board), start the next run like the first: no interpreter tick, the person's own language.
  const meEvents = me?.events.length ?? 0;
  const prevEvents = useRef(meEvents);
  useEffect(() => {
    if (meEvents === 1 && prevEvents.current > 1) {
      setInterpreter(false);
      setStored(null);
      try {
        window.localStorage.removeItem(LANG_KEY);
      } catch {
        /* ignore */
      }
    }
    prevEvents.current = meEvents;
  }, [meEvents]);
  const lang: Lang = stored ?? me?.person.lang ?? "fi";
  const screenKey = me ? `${stageOf(me, now)}:${me.events.some((e) => e.type === "kitOpened")}` : "";
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [screenKey]);
  /** Ignore clicks right after a screen change so a double click cannot act on the next screen. */
  const act = (e: Parameters<typeof add>[1]) => {
    if (Date.now() - shownAt.current < CLICK_GUARD_MS) return;
    add(ME, e);
  };
  const t = STRINGS[lang];
  const pSlots = useMemo(() => pickupSlots(now, t), [Math.floor(now / 3_600_000), t]); // eslint-disable-line react-hooks/exhaustive-deps
  const cSlots = useMemo(() => colonoscopySlots(now, lang), [Math.floor(now / 86_400_000), lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-dvh bg-paper sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-surface sm:min-h-[760px] sm:rounded-[2rem] sm:border sm:border-rule sm:shadow-xl">
        {!mounted || !me ? (
          <div className="flex-1 p-5" aria-busy="true"><Wordmark /></div>
        ) : (
          screen()
        )}
      </div>
    </main>
  );

  function screen() {
    if (!me) return null;
    const stage = stageOf(me, now);
    const kitOpened = me.events.some((e) => e.type === "kitOpened");
    const step = stepOf(stage);
    const finished = stage === "negative" || stage === "done" || stage === "colonoscopyBooked";
    const first = me.person.name.split(" ")[0];
    const progress = robotProgress(me, now);
    const booked = [...me.events].reverse().find((e) => e.type === "pickupBooked");
    const colo = [...me.events].reverse().find((e) => e.type === "colonoscopyBooked");
    const remaining = progress === null ? 0 : (1 - progress) * ROBOT_TRAVEL_MS;

    return (
      <>
        <header className="space-y-4 px-5 pt-5">
          <div className="flex items-center justify-between">
            <Wordmark />
            <div role="group" aria-label={t.langLabel} className="flex overflow-hidden rounded-lg border border-rule">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => chooseLang(l)}
                  aria-pressed={lang === l}
                  className={`min-h-11 min-w-11 text-sm font-semibold uppercase ${lang === l ? "bg-brand text-white" : "bg-surface text-muted hover:bg-brand-soft"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ol aria-label={t.progress} className="flex gap-1.5">
            {t.steps.map((label, i) => {
              const done = i < step || (finished && i === step);
              const current = i === step && !finished;
              return (
                <li key={label} aria-current={current ? "step" : undefined} className="min-w-0 flex-1">
                  <div className={`h-1.5 rounded-full ${done || current ? "bg-brand" : "bg-rule"} ${current ? "opacity-60" : ""}`} />
                  <span className={`mt-1 block truncate text-[11px] ${current ? "font-semibold text-brand" : "text-muted"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </header>

        <div className="flex-1 space-y-5 px-5 py-6" aria-live="polite">
          {stage === "invited" && !kitOpened && (
            <>
              <h1 className="text-2xl font-semibold">{t.greeting(first)}</h1>
              <section className="space-y-3 rounded-xl border border-rule bg-surface p-4">
                <h2 className="text-lg font-semibold">{t.welcomeTitle}</h2>
                <p className="text-sm leading-relaxed text-muted">{t.welcomeBody}</p>
                <ul className="space-y-2 pt-1">
                  {t.facts.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check aria-hidden size={16} className="shrink-0 text-brand" />{f}
                    </li>
                  ))}
                </ul>
              </section>
              <Primary onClick={() => act({ type: "kitOpened" })}>{t.ready}</Primary>
            </>
          )}

          {stage === "invited" && kitOpened && (
            <>
              <h1 className="text-2xl font-semibold">{t.takeTitle}</h1>
              <ol className="space-y-3">
                {t.takeSteps.map((s, i) => (
                  <li key={s} className="flex gap-3 rounded-xl border border-rule bg-surface p-4 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <Primary onClick={() => act({ type: "sampleTaken" })}>{t.taken}</Primary>
            </>
          )}

          {stage === "sampleTaken" && (
            <>
              <h1 className="text-2xl font-semibold">{t.bookTitle}</h1>
              <p className="text-sm text-muted">{t.bookBody}</p>
              <div className="space-y-3">
                {pSlots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => act({ type: "pickupBooked", slot: s })}
                    className="flex min-h-14 w-full items-center justify-between rounded-xl border border-rule bg-surface px-4 text-left font-medium hover:border-brand hover:bg-brand-soft"
                  >
                    {s}<ChevronRight aria-hidden size={18} className="text-muted" />
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === "robotEnRoute" && (
            <>
              <h1 className="text-2xl font-semibold">{t.enRouteTitle}</h1>
              {booked?.slot && <p className="text-sm text-muted">{t.pickupAt(booked.slot)}</p>}
              <RobotMap progress={progress ?? 0} labLabel={t.lab} homeLabel={t.home} to={t.mapTo} />
              <p className="text-sm">{t.robotLeft}</p>
              {booked?.slot && !NOW_LABELS.includes(booked.slot) && <p className="text-xs text-muted">{t.laterNote}</p>}
              <p aria-hidden className="text-center text-sm text-muted">
                <span className="text-2xl font-semibold tabular-nums text-brand">{t.arrivesIn(mmss(remaining))}</span>
              </p>
            </>
          )}

          {stage === "robotAtDoor" && (
            <>
              <h1 className="text-2xl font-semibold">{t.doorTitle}</h1>
              <RobotMap progress={1} labLabel={t.lab} homeLabel={t.home} to={t.mapTo} />
              <p className="text-sm leading-relaxed">{t.doorBody}</p>
              <p className="rounded-xl border border-rule bg-brand-soft p-4 text-center">
                <span className="block text-xs text-muted">{t.codeLabel}</span>
                <span className="text-3xl font-semibold tracking-[0.4em] text-brand">4812</span>
              </p>
              <Primary onClick={() => act({ type: "pickedUp" })}>{t.putIn}</Primary>
            </>
          )}

          {(stage === "pickedUp" || stage === "atLab") && (
            <Message title={t.labTitle} body={t.labBody} />
          )}

          {stage === "negative" && <Message title={t.negTitle} body={t.negBody} tone="ok" />}

          {stage === "positive" && (
            <>
              <h1 className="text-2xl font-semibold">{t.posTitle}</h1>
              <p className="text-sm leading-relaxed">{t.posBody}</p>
              <h2 className="pt-1 text-base font-semibold">{t.posChoose}</h2>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={interpreter} onChange={(e) => setInterpreter(e.target.checked)} className="size-5 accent-[var(--brand)]" />
                {t.interpreter}
              </label>
              <div className="space-y-3">
                {cSlots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => act({ type: "colonoscopyBooked", slot: s, ...(interpreter ? { note: INTERPRETER_NOTE } : {}) })}
                    className="flex min-h-14 w-full items-center justify-between rounded-xl border border-rule bg-surface px-4 text-left font-medium hover:border-brand hover:bg-brand-soft"
                  >
                    {s}<ChevronRight aria-hidden size={18} className="text-muted" />
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === "colonoscopyBooked" && (
            <>
              <h1 className="text-2xl font-semibold">{t.bookedTitle}</h1>
              <p className="rounded-xl border border-rule bg-brand-soft p-4 text-lg font-semibold text-brand">{t.bookedBody(colo?.slot ?? "")}</p>
              <p className="text-sm leading-relaxed">{t.reminder}</p>
              <p className="text-sm text-muted">{t.remind}</p>
            </>
          )}

          {stage === "done" && <Message title={t.doneTitle} body={t.doneBody} tone="ok" />}
        </div>

        <footer className="space-y-2 border-t border-rule px-5 py-4 text-xs text-muted">
          <p>{t.demoLine}</p>
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center underline">{t.restart}</button>
        </footer>
      </>
    );
  }
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="primary-action !min-h-14 w-full !rounded-xl !text-base">
      {children}
    </button>
  );
}

function Message({ title, body, tone }: { title: string; body: string; tone?: "ok" }) {
  return (
    <section className="space-y-3 rounded-xl border border-rule bg-surface p-5">
      {tone === "ok" && <Check aria-hidden className="text-brand" />}
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm leading-relaxed">{body}</p>
    </section>
  );
}
