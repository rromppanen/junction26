"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Globe, Loader2, MapPin, RotateCcw, X } from "lucide-react";
import { ROBOT_SPEEDUP, ROBOT_TRAVEL_MS, stageOf, type SampleEvent } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";
import {
  isKitLang, KIT_LANGS, langInfo, READ_MORE, ROBOT_ANIMS, SOURCES, STEP_ANIMS, TEXT,
  type Anim, type KitLang, type StepText, type Ui,
} from "@/lib/kit/content";
import { pickupWindows, type Window } from "@/lib/kit/slots";
import { StepAnimation } from "./StepAnimation";
import { TrackingMap } from "./TrackingMap";
import { ROBOT_ROUTE } from "@/data/robotRoute";
import { shareableRoute, type LngLat } from "@/lib/kit/route";
import { forgetRobotRoute, locateAndRoute, storedRoute } from "./useRobotRoute";
import "./animations.css";

const ME = "me";
const LANG_KEY = "lapi.kit.language";
// Versioned: older builds stored the step index differently.
const STEP_KEY = "lapi.kit.progress.v3";
const CLICK_GUARD_MS = 350;
/** Matches the window's closing animation in animations.css. */
const WINDOW_CLOSE_MS = 380;
/** How long the arrival check stays (time to read it), and its fade out; the fade matches animations.css. */
const ARRIVAL_SHOW_MS = 2600;
const ARRIVAL_FADE_MS = 900;

/** The opening screens come before the sampling steps: -3 invitation and language, -2 what this is, -1 how it works. */
const INVITE = -3;
const ABOUT = -2;
const HOW = -1;

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the value lives for this page only */
  }
}

function lastOf(s: { events: SampleEvent[] }, type: SampleEvent["type"]): SampleEvent | undefined {
  for (let i = s.events.length - 1; i >= 0; i--) if (s.events[i].type === type) return s.events[i];
  return undefined;
}

/** The home-sample app a person opens from the QR code on their kit envelope. */
export function KitApp() {
  const params = useSearchParams();
  const router = useRouter();
  /** The demo's start page links here with start=1: begin a fresh run from the invitation. */
  const fresh = params.get("start") === "1";
  const { samples, now, add, restart: restartPerson } = useSamples();
  const me = samples.find((s) => s.id === ME);

  const [mounted, setMounted] = useState(false);
  const [storedLang, setStoredLang] = useState<KitLang | null>(null);
  const [step, setStepState] = useState(INVITE);
  const [robotStep, setRobotStep] = useState(0);
  const [panel, setPanel] = useState<"why" | "lang" | null>(null);
  const [route, setRoute] = useState<LngLat[]>(ROBOT_ROUTE);
  /** The moment the robot arrives: a check over the blurred map, long enough to read, then the hand-over steps. */
  const [arrival, setArrival] = useState<"showing" | "leaving" | "done">("done");
  /** Booking waits for location: the robot is only sent once the person has allowed it. */
  const [locating, setLocating] = useState<"idle" | "asking" | "denied">("idle");
  const pending = useRef<{ label: string; at?: number } | null>(null);

  const stepKey = STEP_KEY;
  useEffect(() => {
    if (fresh) {
      // Only this phone's person starts again; the nurse board and other people keep their progress.
      restartPerson(ME);
      clearLocal();
      router.replace("/kit");
      setMounted(true);
      return;
    }
    setMounted(true);
    const saved = storedRoute();
    if (saved) setRoute(saved);
    const l = readStored(LANG_KEY);
    if (isKitLang(l)) setStoredLang(l);
    const raw = readStored(stepKey);
    const s = Number(raw);
    if (raw !== null && Number.isInteger(s) && s >= INVITE) setStepState(s);
    // Runs once on load; restartPerson, clearLocal and router are stable for that purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  function setStep(n: number) {
    setStepState(n);
    writeStored(stepKey, String(n));
  }

  function chooseLang(l: KitLang) {
    setStoredLang(l);
    writeStored(LANG_KEY, l);
  }

  function clearLocal() {
    setStepState(INVITE);
    writeStored(stepKey, null);
    setRobotStep(0);
    setPanel(null);
    setLocating("idle");
    setArrival("done");
    pending.current = null;
    setRoute(ROBOT_ROUTE);
    setStoredLang(null);
    writeStored(LANG_KEY, null);
    forgetRobotRoute();
  }

  // A reset from another tab (or the fleet board) brings the person back to an untouched invitation.
  const meEvents = me?.events.length ?? 0;
  const prevEvents = useRef(meEvents);
  useEffect(() => {
    if (meEvents === 1 && prevEvents.current > 1) clearLocal();
    prevEvents.current = meEvents;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meEvents]);

  const stage = me ? stageOf(me, now) : "invited";

  async function book(label: string, at?: number) {
    pending.current = { label, at };
    setLocating("asking");
    const r = await locateAndRoute();
    if (r === "denied") {
      setLocating("denied");
      return;
    }
    setRoute(r);
    setLocating("idle");
    // travelMs and route let the nurse app's fleet drive the same robot, on the same clock and the
    // same streets, to the same door as this phone.
    act({ type: "pickupBooked", slot: label, travelMs: ROBOT_TRAVEL_MS, route: shareableRoute(r), ...(at !== undefined ? { slotAt: at } : {}) });
    // As soon as possible, or a window already under way: the robot leaves now. A later window waits
    // for its start (or for the person to send the robot early); see scheduledFor below.
    if (at === undefined || at <= Date.now()) act({ type: "robotDispatched" });
  }

  /** The start of a booked window the robot is waiting for, or undefined once it has been sent. */
  const booking = me ? lastOf(me, "pickupBooked") : undefined;
  const scheduledFor = stage === "pickupBooked" ? booking?.slotAt : undefined;
  const windowStarted = scheduledFor !== undefined && now >= scheduledFor;
  useEffect(() => {
    // The window has started: send the robot, dated to the window's start so the nurse map agrees.
    if (scheduledFor !== undefined && windowStarted) act({ type: "robotDispatched", at: scheduledFor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledFor, windowStarted]);

  // When the robot reaches the door the app moves on to the arrival steps by itself (and buzzes where phones can).
  const prevStage = useRef(stage);
  useEffect(() => {
    if (stage === "robotAtDoor" && prevStage.current === "robotEnRoute") {
      setRobotStep(0);
      setArrival("showing");
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* not supported */
      }
    }
    prevStage.current = stage;
  }, [stage]);

  useEffect(() => {
    if (arrival === "done") return;
    const t = setTimeout(() => setArrival(arrival === "showing" ? "leaving" : "done"), arrival === "showing" ? ARRIVAL_SHOW_MS : ARRIVAL_FADE_MS);
    return () => clearTimeout(t);
  }, [arrival]);

  // Ignore taps right after a screen change, so a double tap cannot act on the next screen.
  const screenKey = `${stage}:${step}:${robotStep}:${arrival}`;
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [screenKey]);
  const guarded = (fn: () => void) => () => {
    if (Date.now() - shownAt.current < CLICK_GUARD_MS) return;
    fn();
  };
  const act = (e: Omit<SampleEvent, "at"> & { at?: number }) => add(ME, e);

  const lang: KitLang = storedLang ?? (me && isKitLang(me.person.lang) ? me.person.lang : "fi");
  const info = langInfo(lang);
  const text = TEXT[lang];
  const t = text.ui;
  const test = text.test;

  return (
    <main className="min-h-dvh bg-paper sm:flex sm:h-dvh sm:items-center sm:justify-center sm:p-4">
      <div lang={lang} dir={info.dir}
        className="relative mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-surface sm:h-[min(820px,100%)] sm:rounded-[1.75rem] sm:border sm:border-rule sm:shadow-xl">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-5">
          <p className="min-w-0 truncate text-sm font-semibold text-brand-strong">{test?.name}</p>
          {mounted && step !== INVITE && (
            <button type="button" onClick={() => setPanel("lang")} aria-label={t.langLabel}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand hover:bg-brand-soft">
              <Globe aria-hidden size={18} />{info.native}
            </button>
          )}
        </header>

        {!mounted || !me ? (
          <div className="flex-1" aria-busy="true" />
        ) : (
          renderScreen()
        )}

        {panel === "why" && (
          <InfoWindow title={t.whyTitle} closeLabel={t.close} onClose={() => setPanel(null)}>
            <p className="text-lg leading-relaxed">{test.why.lead}</p>
            <ul className="mt-4 space-y-3">
              {test.why.points.map((p) => (
                <li key={p} className="border-s-4 border-brand bg-brand-soft/60 p-4 leading-relaxed">{p}</li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed">{test.why.close}</p>
            <div className="mt-5 border-t border-rule pt-4" dir="ltr" lang="en">
              <h3 className="text-sm font-semibold">{t.sources}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {SOURCES.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="link text-muted">{s.label}</a></li>
                ))}
              </ul>
            </div>
          </InfoWindow>
        )}

        {panel === "lang" && (
          <InfoWindow title={t.chooseLang} closeLabel={t.close} onClose={() => setPanel(null)}>
            <LanguageList value={lang} onChoose={chooseLang} />
          </InfoWindow>
        )}
      </div>
    </main>
  );

  function renderScreen() {
    if (!me) return null;
    const restart = (
      <button type="button" onClick={() => { restartPerson(ME); clearLocal(); }}
        className="mx-auto mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl border border-rule px-5 text-sm font-semibold text-muted hover:bg-brand-soft">
        <RotateCcw aria-hidden size={16} />{t.restartDemo}
      </button>
    );

    if (stage === "invited" && step === INVITE) {
      return (
        <Body key="invite" footer={<Primary onClick={guarded(() => { if (!me.events.some((e) => e.type === "kitOpened")) act({ type: "kitOpened" }); setStep(ABOUT); })}>{t.next}</Primary>}>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-brand-strong">{test.invited}</h1>
          <p className="mt-3 leading-relaxed text-muted">{t.invitedSub}</p>
          <h2 className="mt-7 text-base font-semibold">{t.chooseLang}</h2>
          <div className="mt-3"><LanguageList value={lang} onChoose={chooseLang} /></div>
        </Body>
      );
    }

    if (stage === "invited" && step === ABOUT) {
      return (
        <Body key="about" footer={<Nav back={t.back} onBack={guarded(() => setStep(INVITE))} primary={<Primary onClick={guarded(() => setStep(HOW))}>{t.next}</Primary>} />}>
          <h1 className="mt-2 text-[1.6rem] font-semibold leading-tight">{t.aboutTitle}</h1>
          <p className="mt-3 text-lg leading-relaxed">{test.intro}</p>
          <ul className="mt-5 space-y-2.5">
            {test.facts.map((f) => (
              <li key={f} className="flex items-center gap-3"><Check aria-hidden size={20} className="shrink-0 text-brand" />{f}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setPanel("why")}
            className="mt-7 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-brand px-4 text-start font-semibold text-brand hover:bg-brand-soft">
            {t.why}<ChevronRight aria-hidden className="shrink-0 rtl:rotate-180" />
          </button>
        </Body>
      );
    }

    if (stage === "invited" && step === HOW) {
      const rows = [t.howSample, t.howRobot, test.resultWait];
      return (
        <Body key="how" footer={<Nav back={t.back} onBack={guarded(() => setStep(ABOUT))} primary={<Primary onClick={guarded(() => setStep(0))}>{t.startSampling}</Primary>} />}>
          <h1 className="mt-2 text-[1.6rem] font-semibold leading-tight">{t.howTitle}</h1>
          <ol className="mt-5 space-y-5">
            {rows.map((r, i) => (
              <li key={r} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white">{i + 1}</span>
                <span className="pt-1.5 leading-relaxed">{r}</span>
              </li>
            ))}
          </ol>
        </Body>
      );
    }

    if (stage === "invited") {
      const anims = STEP_ANIMS;
      const i = Math.min(step, anims.length - 1);
      const last = i === anims.length - 1;
      return (
        <StepView key={`s${i}`} anim={anims[i]} text={test.steps[i]} index={i} total={anims.length} t={t}
          onBack={guarded(() => setStep(i === 0 ? HOW : i - 1))}
          primary={last
            ? <Primary onClick={guarded(() => act({ type: "sampleTaken" }))}>{t.sampleDone}</Primary>
            : <Primary onClick={guarded(() => setStep(i + 1))}>{t.next}</Primary>} />
      );
    }

    // A later window is booked: show when the robot comes, with a way to send it early.
    if (scheduledFor !== undefined) {
      return <Scheduled key="scheduled" t={t} slot={booking?.slot ?? ""} onSendNow={guarded(() => act({ type: "robotDispatched" }))} />;
    }

    if (stage === "sampleTaken" || stage === "pickupBooked") {
      return <Booking key="book" lang={lang} t={t} now={now} locating={locating} onBook={(label, at) => void book(label, at)}
        onRetry={() => pending.current && void book(pending.current.label, pending.current.at)} />;
    }

    // The hand-over steps once the robot is at the door.
    const robotSteps = () => {
      const i = Math.min(robotStep, ROBOT_ANIMS.length - 1);
      const primary =
        i === 1 ? <Primary onClick={guarded(() => setRobotStep(2))}>{t.openLid}</Primary>
        : i === ROBOT_ANIMS.length - 1 ? <Primary onClick={guarded(() => act({ type: "pickedUp" }))}>{t.lidClosed}</Primary>
        : <Primary onClick={guarded(() => setRobotStep(i + 1))}>{t.next}</Primary>;
      return (
        <StepView key={`r${i}`} anim={ROBOT_ANIMS[i]} text={text.robot[i]} index={i} total={ROBOT_ANIMS.length} t={t}
          kicker={t.arrived} onBack={guarded(() => setRobotStep(Math.max(0, i - 1)))} primary={primary} />
      );
    };

    /*
      On the way, and for a moment after arriving: the map, with the arrival check over it once the
      robot is there. When the moment ends, the hand-over steps start fading in underneath while the
      map and check fade out on top, so it is one crossfade. The map keeps its place in the tree
      throughout, so it is never rebuilt.
    */
    if (stage === "robotEnRoute" || stage === "robotAtDoor") {
      const dispatchedAt = lastOf(me, "robotDispatched")?.at ?? now;
      const atDoor = stage === "robotAtDoor";
      const showMap = !atDoor || arrival !== "done";
      const showSteps = atDoor && arrival !== "showing";
      const leaving = atDoor && arrival === "leaving";
      // Both layers keep their places in the tree, so neither is rebuilt when the other comes or goes.
      return (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {showSteps && <div className="absolute inset-0 flex flex-col">{robotSteps()}</div>}
          {showMap && (
            <div className={`relative z-10 flex min-h-0 flex-1 flex-col bg-surface ${leaving ? "kit-crossfade-out" : ""}`} aria-hidden={leaving || undefined}>
              <LiveTracking route={route} dispatchedAt={dispatchedAt} t={t} />
              {atDoor && <ArrivedMoment t={t} />}
            </div>
          )}
        </div>
      );
    }

    if (stage === "pickedUp" || stage === "atLab") {
      return (
        <Centered key="thanks">
          <div className="mx-auto w-full max-w-[260px]"><StepAnimation anim="robotLeave" /></div>
          <h1 className="text-2xl font-semibold text-brand-strong">{t.thanksTitle}</h1>
          <p className="text-muted">{t.thanksBody}</p>
          <p className="text-muted">{test.resultWait}</p>
          <a href={READ_MORE[lang] ?? READ_MORE.en} target="_blank" rel="noreferrer"
            className="mx-auto mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-brand underline underline-offset-4 hover:bg-brand-soft">
            {t.readMore}<ExternalLink aria-hidden size={16} />
          </a>
          {restart}
        </Centered>
      );
    }

    const result = stage === "negative" ? test.negative : test.positive;
    return (
      <Centered key="result">
        <h1 className="text-2xl font-semibold text-brand-strong">{result.title}</h1>
        <p className="leading-relaxed text-muted">{result.body}</p>
        {restart}
      </Centered>
    );
  }
}

/** A screen's content fades and rises in, one child after another; the actions stay at the bottom. */
export function Body({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <>
      <div className="kit-enter min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5" aria-live="polite">{children}</div>
      <div className="px-5 pb-5 pt-2">{footer}</div>
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="kit-enter flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto px-5 pb-8 text-center" aria-live="polite">{children}</div>;
}

export function Nav({ back, onBack, primary }: { back: string; onBack: () => void; primary: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onBack} aria-label={back} className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-rule text-brand hover:bg-brand-soft">
        <ChevronLeft aria-hidden className="rtl:rotate-180" />
      </button>
      <div className="flex-1">{primary}</div>
    </div>
  );
}

export function StepView({ anim, text, index, total, t, onBack, primary, kicker }: {
  anim: Anim; text: StepText; index: number; total: number; t: Ui; onBack: () => void; primary: React.ReactNode; kicker?: string;
}) {
  return (
    <Body footer={<Nav back={t.back} onBack={onBack} primary={primary} />}>
      <div>
        {kicker && <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand"><Bell aria-hidden size={16} />{kicker}</p>}
        <p className="text-sm font-semibold text-muted">{t.stepOf(index + 1, total)}</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, k) => (
            <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= index ? "bg-brand" : "bg-rule"}`} />
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-brand-soft/70 px-6 py-4" dir="ltr">
        <StepAnimation anim={anim} className="mx-auto max-h-[min(210px,24dvh)]" />
      </div>
      <h1 className="mt-5 text-[1.45rem] font-semibold leading-snug">{text.title}</h1>
      {text.body && <p className="mt-2 leading-relaxed text-muted">{text.body}</p>}
    </Body>
  );
}

export function LanguageList({ value, onChoose }: { value: KitLang; onChoose: (l: KitLang) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {KIT_LANGS.map((l) => (
        <li key={l.code}>
          <button type="button" lang={l.code} dir={l.dir} onClick={() => onChoose(l.code)} aria-pressed={value === l.code}
            className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 text-start font-semibold ${value === l.code ? "border-brand bg-brand text-white" : "border-rule hover:border-brand hover:bg-brand-soft"}`}>
            {l.native}
            {value === l.code && <Check aria-hidden size={18} className="shrink-0" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A window that opens over the screen: the page dims, the card grows into place, and closing plays it backwards. */
function InfoWindow({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: React.ReactNode }) {
  const [closing, setClosing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, WINDOW_CLOSE_MS);
  };
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={`absolute inset-0 z-30 ${closing ? "kit-window-out" : ""}`}>
      <div className="kit-backdrop absolute inset-0 bg-[rgba(0,40,75,0.45)]" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="kit-window-title"
        className="kit-window absolute inset-x-3 bottom-3 top-8 flex flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <h2 id="kit-window-title" className="text-lg font-semibold text-brand-strong">{title}</h2>
          <button ref={closeRef} type="button" onClick={close} aria-label={closeLabel} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-brand-soft">
            <X aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="px-5 pb-4 pt-2"><Primary onClick={close}>{closeLabel}</Primary></div>
      </div>
    </div>
  );
}

/**
 * The robot on its way. Progress is computed every animation frame from the dispatch time, so the
 * robot glides along the map and the bar fills smoothly instead of stepping once a second.
 */
function LiveTracking({ route, dispatchedAt, t }: { route: LngLat[]; dispatchedAt: number; t: Ui }) {
  const [p, setP] = useState(() => Math.min(1, Math.max(0, (Date.now() - dispatchedAt) / ROBOT_TRAVEL_MS)));
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const next = Math.min(1, Math.max(0, (Date.now() - dispatchedAt) / ROBOT_TRAVEL_MS));
      setP(next);
      if (next < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [dispatchedAt]);
  const secs = Math.ceil(((1 - p) * ROBOT_TRAVEL_MS) / 1000);
  return (
    <>
      <div className="min-h-0 flex-1" dir="ltr">
        <TrackingMap route={route} progress={p} labels={{ robot: t.onTheWay, home: t.home, hub: t.hub, error: t.mapError }} />
      </div>
      <section className="relative z-10 -mt-5 rounded-t-3xl bg-surface px-5 pb-6 pt-5 shadow-[0_-8px_24px_-12px_rgba(0,60,108,0.3)]">
        <p className="text-sm font-semibold text-muted">{t.onTheWay}</p>
        <h1 className="mt-1 text-2xl font-semibold tabular-nums text-brand-strong" aria-live="polite">{secs <= 1 ? t.almostThere : t.arrivesIn(secs)}</h1>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
          <div className="h-full rounded-full bg-brand" style={{ width: `${p * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{t.from}</p>
        <p className="mt-2 text-xs font-semibold tabular-nums text-muted">{t.spedUp(ROBOT_SPEEDUP)}</p>
      </section>
    </>
  );
}

/** The robot is here: the map softens behind a check and a few words, then the app moves on by itself. */
export function ArrivedMoment({ t }: { t: Ui }) {
  return (
    <div role="status" className="kit-arrived absolute inset-0 z-20 flex items-center justify-center">
      <div className="kit-arrived-veil absolute inset-0 bg-white/40 backdrop-blur-[6px]" aria-hidden />
      <div className="kit-arrived-card relative mx-8 flex flex-col items-center gap-4 rounded-3xl bg-surface/90 px-8 py-8 text-center shadow-2xl">
        <svg viewBox="0 0 64 64" className="size-20" aria-hidden>
          <circle cx={32} cy={32} r={30} fill="var(--brand)" />
          <path d="M19 33 l9 9 l17 -19" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="kit-arrived-tick" />
        </svg>
        <p className="text-2xl font-semibold text-brand-strong">{t.arrived}</p>
        <p className="text-muted">{t.arrivedBody}</p>
      </div>
    </div>
  );
}

function Booking({ lang, t, now, locating, onBook, onRetry }: {
  lang: KitLang; t: Ui; now: number; locating: "idle" | "asking" | "denied"; onBook: (label: string, at?: number) => void; onRetry: () => void;
}) {
  const busy = locating === "asking";
  const today = pickupWindows(now, 0);
  const [day, setDay] = useState<0 | 1>(today.length ? 0 : 1);
  const [chosen, setChosen] = useState<Window | null>(null);
  const windows = day === 0 ? today : pickupWindows(now, 1);
  const dayName = (d: 0 | 1) => (d === 0 ? t.today : t.tomorrow);
  const label = (w: Window) => `${dayName(w.day)} ${w.start}–${w.end}`;
  const dateFmt = new Intl.DateTimeFormat(langInfo(lang).locale, { weekday: "short", day: "numeric", month: "numeric" });

  return (
    <>
      <div className="kit-enter min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <h1 className="text-[1.6rem] font-semibold leading-tight">{t.bookTitle}</h1>
        <p className="mt-2 flex gap-2 text-muted"><Clock aria-hidden size={18} className="mt-1 shrink-0 text-brand" />{t.bookBody}</p>
        <p className="mt-2 flex gap-2 text-muted"><MapPin aria-hidden size={18} className="mt-1 shrink-0 text-brand" />{t.locationWhy}</p>
        {locating === "denied" && (
          <div role="alert" className="mt-4 rounded-xl border-s-4 border-[#e30513] bg-[#fdecee] p-4">
            <p className="leading-relaxed">{t.locationDenied}</p>
            <button type="button" onClick={onRetry} className="primary-action mt-3 w-full !rounded-lg">{t.tryAgain}</button>
          </div>
        )}
        <button type="button" disabled={busy} onClick={() => onBook(t.asap)}
          className="mt-5 flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 border-brand bg-brand-soft px-4 text-start hover:bg-[#cddff0]">
          <span><span className="block font-semibold text-brand-strong">{t.asap}</span><span className="text-sm text-muted">{t.asapNote}</span></span>
          <ChevronRight aria-hidden className="shrink-0 text-brand rtl:rotate-180" />
        </button>
        <div>
          <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
            {([0, 1] as const).map((d) => {
              const date = new Date(now);
              date.setDate(date.getDate() + d);
              return (
                <button key={d} role="tab" type="button" aria-selected={day === d} onClick={() => { setDay(d); setChosen(null); }}
                  className={`min-h-12 rounded-lg text-sm font-semibold ${day === d ? "bg-surface text-brand-strong shadow-sm" : "text-muted"}`}>
                  {dayName(d)} <span className="font-normal text-muted">{dateFmt.format(date)}</span>
                </button>
              );
            })}
          </div>
          {windows.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t.noTimesToday}</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2" dir="ltr">
              {windows.map((w) => (
                <button key={w.at} type="button" aria-pressed={chosen?.at === w.at} onClick={() => setChosen(w)}
                  className={`min-h-12 rounded-lg border text-sm font-semibold tabular-nums ${chosen?.at === w.at ? "border-brand bg-brand text-white" : "border-rule hover:border-brand"}`}>
                  {w.start}–{w.end}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-4 pt-2">
        <button type="button" disabled={!chosen || busy} onClick={() => chosen && onBook(label(chosen), chosen.at)}
          className="primary-action !min-h-14 w-full !rounded-xl !text-base disabled:opacity-40">
          {busy ? <><Loader2 aria-hidden size={18} className="animate-spin" />{t.locating}</> : chosen ? t.confirm(label(chosen)) : t.pickTime}
        </button>
      </div>
    </>
  );
}

/** A pickup booked for a later window: when the robot comes, and a way to send it now instead. */
function Scheduled({ t, slot, onSendNow }: { t: Ui; slot: string; onSendNow: () => void }) {
  return (
    <Body footer={<Primary onClick={onSendNow}>{t.sendNow}</Primary>}>
      <div className="flex flex-col items-center gap-3 pt-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand"><Clock aria-hidden size={30} /></span>
        <p className="font-semibold text-muted">{t.scheduledTitle}</p>
        <h1 className="text-3xl font-semibold text-brand-strong">{slot}</h1>
        <p className="max-w-sm leading-relaxed text-muted">{t.scheduledBody}</p>
      </div>
    </Body>
  );
}

export function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="primary-action !min-h-14 w-full !rounded-xl !text-base">{children}</button>;
}
