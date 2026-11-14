"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { activeBooking, robotEta, robotProgress, stageOf, type Lang, type Stage, type Sample } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import { BagIllustration, CheckIllustration, ClinicIllustration, LeafletIllustration, TubeIllustration } from "./Illustrations";
import { AskBox } from "./AskBox";
import { Letter } from "./Letter";
import { RobotMap } from "./RobotMap";
import { hhmm, pickupWindows, weekdaySlots, type Slot } from "./slots";
import { STRINGS } from "./strings";

const LETTERS = [
  { who: "me", label: "Aino · bowel" },
  { who: "me-cx", label: "Sanna · cervical" },
];
const LANG_KEY = "lapi.kit.lang";
const LANGS: Lang[] = ["fi", "sv", "en"];
const INTERPRETER_NOTE = "Interpreter needed";
const CLICK_GUARD_MS = 400;

/** Progress step: 0 Letter, 1 Booking, 2 Sample, 3 Lab, 4 Result. */
function stepOf(stage: Stage, opened: boolean): number {
  switch (stage) {
    case "invited": return opened ? 1 : 0;
    case "booked": case "robotEnRoute": case "robotAtDoor": return 2;
    case "pickedUp": case "atLab": return 3;
    default: return 4;
  }
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const TAKE_PICTURES = [LeafletIllustration, TubeIllustration, BagIllustration];
const CHECK_FRESH_MS = 3000;


export function KitApp() {
  const params = useSearchParams();
  const router = useRouter();
  const embed = params.get("embed") === "1";
  const who = LETTERS.some((l) => l.who === params.get("who")) ? (params.get("who") as string) : "me";
  const { samples, now, add, reset } = useSamples();
  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useState<Lang | null>(null);
  const [interpreter, setInterpreter] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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

  const me: Sample | undefined = samples.find((s) => s.id === who);
  // When the demo is reset (here or from the board), start the next run like the first: no interpreter tick, the person's own language.
  const meEvents = me?.events.length ?? 0;
  const prevEvents = useRef(meEvents);
  useEffect(() => {
    if (meEvents === 1 && prevEvents.current > 1) {
      setInterpreter(false);
      setBooking(false);
      setConfirmCancel(false);
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
  const opened = me?.events.some((e) => e.type === "letterOpened") ?? false;
  const screenKey = me ? `${who}:${stageOf(me, now)}:${opened}:${booking}:${confirmCancel}` : "";
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [screenKey]);
  /** Ignore clicks right after a screen change so a double click cannot act on the next screen. */
  const act = (e: Parameters<typeof add>[1]): boolean => {
    if (Date.now() - shownAt.current < CLICK_GUARD_MS) return false;
    add(who, e);
    return true;
  };
  const guarded = (fn: () => void) => () => {
    if (Date.now() - shownAt.current >= CLICK_GUARD_MS) fn();
  };
  const t = STRINGS[lang];
  const hour = Math.floor(now / 3_600_000);
  const day = Math.floor(now / 86_400_000);
  const pWindows = useMemo(() => pickupWindows(now, t), [hour, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const clinicSlots = useMemo(() => weekdaySlots(now, lang, 2), [day, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const followUps = useMemo(() => weekdaySlots(now, lang, 3), [day, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-dvh bg-paper sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-surface sm:min-h-[760px] sm:rounded-[2rem] sm:border sm:border-rule sm:shadow-xl">
        {!mounted || !me ? (
          <div className="flex-1 p-5" aria-busy="true"><Wordmark /></div>
        ) : (
          screen(me)
        )}
      </div>
    </main>
  );

  function book(s: Slot | "now", programme: Sample["programme"]) {
    const startsAt = s === "now" ? Date.now() : s.startsAt;
    const slot = s === "now" ? t.nowDemo : s.label;
    if (act({ type: programme === "bowel" ? "pickupBooked" : "clinicBooked", slot, startsAt })) {
      setBooking(false);
    }
  }

  function screen(me: Sample) {
    const stage = stageOf(me, now);
    const bowel = me.programme === "bowel";
    const step = stepOf(stage, opened);
    const finished = stage === "negative" || stage === "done" || stage === "colonoscopyBooked";
    const first = me.person.name.split(" ")[0];
    const progress = robotProgress(me, now);
    const eta = robotEta(me, now);
    const active = activeBooking(me);
    const taken = me.events.some((e) => e.type === "sampleTaken");
    const colo = [...me.events].reverse().find((e) => e.type === "colonoscopyBooked");
    const pickedAt = [...me.events].reverse().find((e) => e.type === "pickedUp")?.at;
    const freshPickup = pickedAt !== undefined && now - pickedAt >= 0 && now - pickedAt < CHECK_FRESH_MS;
    const laterWindow = bowel && stage === "booked" && active?.startsAt !== undefined && active.startsAt > now;
    const showBooking = booking && (stage === "invited" || stage === "booked") && opened;
    const showExplain = stage === "invited" && opened && !booking;

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
                  <span className={`mt-1 flex items-center gap-0.5 text-xs ${current ? "font-semibold text-brand" : "text-muted"}`}>
                    {done && <Check aria-hidden size={12} className="shrink-0 text-brand" />}
                    <span className="truncate">{label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </header>

        <div className="flex-1 space-y-5 px-5 py-6" aria-live="polite">
          {stage === "invited" && !opened && (
            <>
              {!embed && (
                <div role="group" aria-label="Demo letter" className="flex overflow-hidden rounded-lg border border-rule text-sm">
                  {LETTERS.map((l) => (
                    <button
                      key={l.who}
                      type="button"
                      aria-pressed={who === l.who}
                      onClick={() => router.replace(`/kit?who=${l.who}`)}
                      className={`min-h-11 flex-1 px-2 font-semibold ${who === l.who ? "bg-brand text-white" : "bg-surface text-muted hover:bg-brand-soft"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
              <h1 className="text-2xl font-semibold">{t.greeting(first)}</h1>
              <Letter
                t={t.letter}
                name={me.person.name}
                programme={me.programme}
                now={now}
                lang={lang}
                onOpen={guarded(() => act({ type: "letterOpened" }))}
              />
            </>
          )}

          {showExplain && (
            <>
              <h1 className="text-2xl font-semibold">{t.greeting(first)}</h1>
              <section className="space-y-3 rounded-xl border border-rule bg-surface p-4">
                <h2 className="text-lg font-semibold">{bowel ? t.welcomeTitleBowel : t.welcomeTitleCervical}</h2>
                <p className="text-sm leading-relaxed text-muted">{bowel ? t.welcomeBodyBowel : t.welcomeBodyCervical}</p>
                {bowel ? (
                  <ul className="space-y-2 pt-1">
                    {t.factsBowel.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check aria-hidden size={16} className="shrink-0 text-brand" />{f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <a href="https://www.finlex.fi/fi/laki/ajantasa/2011/20110339" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-brand underline">
                    {t.sourceLink}
                  </a>
                )}
              </section>
              <section className="space-y-2">
                <h2 className="text-base font-semibold">{t.nextTitle}</h2>
                <ol className="space-y-2">
                  {(bowel ? t.nextBowel : t.nextCervical).map((n, i) => (
                    <li key={n} className="flex items-center gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                      {n}
                    </li>
                  ))}
                </ol>
              </section>
              <Primary onClick={guarded(() => setBooking(true))}>{t.bookCta}</Primary>
              {bowel && <AskBox t={t.ask} lang={lang} />}
            </>
          )}

          {showBooking && (
            <>
              <h1 className="text-2xl font-semibold">
                {stage === "booked" ? t.bookTitleChange : bowel ? t.bookTitleBowel : t.bookTitleCervical}
              </h1>
              <p className="text-sm text-muted">{bowel ? t.bookBodyBowel : t.bookBodyCervical}</p>
              {!bowel && <p className="text-sm font-semibold">{t.clinicName}</p>}
              <div className="space-y-3">
                {bowel && <SlotButton label={t.nowDemo} onClick={() => book("now", me.programme)} />}
                {(bowel ? pWindows : clinicSlots).map((s) => (
                  <SlotButton key={s.startsAt} label={s.label} onClick={() => book(s, me.programme)} />
                ))}
              </div>
              {stage === "booked" && (
                <button type="button" onClick={guarded(() => setBooking(false))} className="inline-flex min-h-11 items-center text-sm underline">
                  {t.back}
                </button>
              )}
            </>
          )}

          {stage === "booked" && !showBooking && bowel && (
            <>
              <h1 className="text-2xl font-semibold">{t.yourPickup(active?.slot ?? "")}</h1>
              {laterWindow && active?.startsAt !== undefined && (
                <p className="rounded-xl border border-rule bg-brand-soft p-4 text-center text-lg font-semibold text-brand">
                  {t.robotLeavesAt(hhmm(active.startsAt))}
                </p>
              )}
              {taken ? (
                <p className="flex items-center gap-2 text-sm font-semibold"><Check aria-hidden size={18} className="text-brand" />{t.takenDone}</p>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{t.takeTitle}</h2>
                  <ol className="space-y-3">
                    {t.takeSteps.map((s, i) => {
                      const Pic = TAKE_PICTURES[i];
                      return (
                        <li key={s} className="flex items-center gap-4 rounded-xl border border-rule bg-surface p-4 text-sm">
                          {Pic && <Pic className="text-ink" />}
                          <span className="flex min-w-0 items-start gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                            <span>{s}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <Primary onClick={guarded(() => act({ type: "sampleTaken" }))}>{t.taken}</Primary>
                </>
              )}
              {laterWindow && (
                <Secondary onClick={guarded(() => book("now", me.programme))}>{t.sendNow}</Secondary>
              )}
              {changeButtons()}
            </>
          )}

          {stage === "booked" && !showBooking && !bowel && (
            <>
              <h1 className="text-2xl font-semibold">{t.apptTitle}</h1>
              <section className="flex items-center gap-4 rounded-xl border border-rule bg-brand-soft p-4">
                <ClinicIllustration className="text-ink" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-muted">{t.clinicName}</p>
                  <p className="text-lg font-semibold text-brand">{active?.slot}</p>
                </div>
              </section>
              <p className="text-sm leading-relaxed">{t.apptBring}</p>
              {changeButtons()}
              <Secondary onClick={guarded(() => act({ type: "clinicVisited" }))}>{t.clinicVisit}</Secondary>
            </>
          )}

          {stage === "robotEnRoute" && (
            <>
              <h1 className="text-2xl font-semibold">{t.enRouteTitle}</h1>
              {active?.slot && <p className="text-sm text-muted">{t.yourPickup(active.slot)}</p>}
              <RobotMap progress={progress ?? 0} labLabel={t.lab} homeLabel={t.home} to={t.mapTo} />
              <p className="text-sm">{t.robotLeft}</p>
              <p aria-hidden className="text-center text-sm text-muted">
                <span className="text-4xl font-semibold tabular-nums text-brand">{t.arrivesIn(mmss(eta ?? 0))}</span>
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
              {!taken && <p className="text-sm text-muted">{t.notTakenYet}</p>}
              <Primary onClick={guarded(() => act({ type: "pickedUp" }))}>{t.putIn}</Primary>
            </>
          )}

          {(stage === "pickedUp" || stage === "atLab") && (
            <div className="space-y-4">
              <div className="flex justify-center"><CheckIllustration animate={freshPickup} className="size-24 text-ink" /></div>
              <Message title={t.labTitle} body={bowel ? t.labBodyBowel : t.labBodyCervical} />
            </div>
          )}

          {stage === "negative" && <Message title={t.negTitle} body={bowel ? t.negBodyBowel : t.negBodyCervical} tone="ok" />}

          {stage === "positive" && (
            <>
              <h1 className="text-2xl font-semibold">{bowel ? t.posTitleBowel : t.posTitleCervical}</h1>
              <p className="text-sm leading-relaxed">{bowel ? t.posBodyBowel : t.posBodyCervical}</p>
              <h2 className="pt-1 text-base font-semibold">{bowel ? t.posChooseBowel : t.posChooseCervical}</h2>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={interpreter} onChange={(e) => setInterpreter(e.target.checked)} className="size-5 accent-[var(--brand)]" />
                {t.interpreter}
              </label>
              <div className="space-y-3">
                {followUps.map((s) => (
                  <SlotButton
                    key={s.startsAt}
                    label={s.label}
                    onClick={() => act({ type: "colonoscopyBooked", slot: s.label, startsAt: s.startsAt, ...(interpreter ? { note: INTERPRETER_NOTE } : {}) })}
                  />
                ))}
              </div>
            </>
          )}

          {stage === "colonoscopyBooked" && (
            <>
              <h1 className="text-2xl font-semibold">{bowel ? t.bookedTitleBowel : t.bookedTitleCervical}</h1>
              <p className="rounded-xl border border-rule bg-brand-soft p-4 text-lg font-semibold text-brand">
                {(bowel ? t.bookedBodyBowel : t.bookedBodyCervical)(colo?.slot ?? "")}
              </p>
              <p className="text-sm leading-relaxed">{t.reminder}</p>
              <p className="text-sm text-muted">{t.remind}</p>
            </>
          )}

          {stage === "done" && (
            <Message title={bowel ? t.doneTitleBowel : t.doneTitleCervical} body={bowel ? t.doneBodyBowel : t.doneBodyCervical} tone="ok" />
          )}
        </div>

        <footer className="space-y-2 border-t border-rule px-5 py-4 text-xs text-muted">
          {!embed && <p>{t.demoLine}</p>}
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center underline">{t.restart}</button>
        </footer>
      </>
    );
  }

  function changeButtons() {
    return confirmCancel ? (
      <div role="group" aria-label={t.cancelAsk} className="space-y-2 rounded-xl border border-rule p-4">
        <p className="text-sm font-semibold">{t.cancelAsk}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={guarded(() => {
              if (act({ type: "bookingCancelled" })) setConfirmCancel(false);
            })}
            className="min-h-11 flex-1 rounded-lg bg-brand px-3 text-sm font-semibold text-white"
          >
            {t.yes}
          </button>
          <button type="button" onClick={() => setConfirmCancel(false)} className="min-h-11 flex-1 rounded-lg border border-rule px-3 text-sm font-semibold">
            {t.no}
          </button>
        </div>
      </div>
    ) : (
      <div className="flex gap-2">
        <button type="button" onClick={guarded(() => setBooking(true))} className="min-h-11 flex-1 rounded-lg border border-rule px-3 text-sm font-semibold hover:border-brand">
          {t.rebook}
        </button>
        <button type="button" onClick={guarded(() => setConfirmCancel(true))} className="min-h-11 flex-1 rounded-lg border border-rule px-3 text-sm font-semibold hover:border-brand">
          {t.cancel}
        </button>
      </div>
    );
  }
}

function SlotButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between rounded-xl border border-rule bg-surface px-4 text-left font-medium hover:border-brand hover:bg-brand-soft"
    >
      {label}<ChevronRight aria-hidden size={18} className="text-muted" />
    </button>
  );
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="primary-action !min-h-14 w-full !rounded-xl !text-base">
      {children}
    </button>
  );
}

function Secondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="min-h-12 w-full rounded-xl border border-rule px-4 text-sm font-semibold hover:border-brand hover:bg-brand-soft">
      {children}
    </button>
  );
}

function Message({ title, body, tone }: { title: string; body: string; tone?: "ok" }) {
  return (
    <section className="space-y-3 rounded-xl border border-rule bg-surface p-5">
      {tone === "ok" && <Check aria-hidden className="text-brand" />}
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm leading-relaxed">{body}</p>
    </section>
  );
}
