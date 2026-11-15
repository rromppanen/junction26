"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { BatteryFull, Check, ChevronRight, Clock, Globe, Loader2, MapPin, Signal, Wifi, X } from "lucide-react";
import { REAL_TRIP_MS } from "@/lib/sample/model";
import { langInfo, ROBOT_ANIMS, SOURCES, STEP_ANIMS, TEXT, type KitLang, type TestText, type Ui } from "@/lib/kit/content";
import { pickupWindows, type Window } from "@/lib/kit/slots";
import { ArrivedMoment, Body, LanguageList, Nav, Primary, StepView } from "@/components/kit/KitApp";
import { TrackingMap } from "@/components/kit/TrackingMap";
import { StepAnimation } from "@/components/kit/StepAnimation";
import { HYPE_ROUTE } from "@/data/reelRoute";
import { splitRoute } from "@/lib/kit/route";
import { createFleetMap, easeInOutSine, type FleetMap } from "./fleetMap";
import { arrivingMs, Caption, CAPTION_LEAVE_MS, readingMs } from "./Caption";
import { CAPTIONS, type CaptionItem } from "./captions";
import "@/components/kit/animations.css";
import "./reel.css";

/*
  The demo reel: the phone app's own screens, played through by a script for a screen recording.
  Nothing here is stored or sent; the robot's trip and the location are fixed to Hybridiarena Hype.
  Space or a click plays it, F toggles full screen, R starts over. /reel?autoplay=1 plays at once.
*/

const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL = 14;
const STATUS_H = 46;
/** The robot's trip on screen: long enough for the fleet overview to play out while it drives. */
const TRAVEL_MS = 22_000;
const ARRIVAL_SHOW_MS = 2200;
const ARRIVAL_FADE_MS = 900;
const WINDOW_CLOSE_MS = 380;
const CAMERA_MS = 1200;
const CROSSFADE_MS = 500;
/** The phone sliding aside to make room for the captions, and back. */
const SLIDE_MS = 1300;
const FLY_MS = 2300;
/** Reading pauses are scaled by this: lower plays the reel faster. */
const PACE = 0.8;

/** The robot's progress, read every frame by the parts that draw it, so the rest of the page is not re-rendered. */
type TripClock = { dispatchedAt: number | null; live: boolean };
const progressOf = (c: TripClock) => (c.dispatchedAt === null ? 0 : Math.min(1, (performance.now() - c.dispatchedAt) / TRAVEL_MS));

type Screen = "invite" | "about" | "how" | "step" | "swoop" | "book" | "track";
type Arrival = "enRoute" | "showing" | "leaving" | "done";
type Finger = { id: number; x: number; y: number; mode: "tap" | "drag" | "lift" };
type Camera = { s: number; tx: number; ty: number; ms: number };

class Stopped extends Error {}

/**
 * With ?render=1 the maps are listed on window.__reelMaps, so scripts/render-reel.mjs can wait for
 * their tiles before it captures each frame of the video.
 */
function exposeForRender(m: MlMap) {
  if (new URLSearchParams(window.location.search).get("render") !== "1") return;
  const w = window as unknown as { __reelMaps?: MlMap[] };
  (w.__reelMaps ??= []).push(m);
}

/**
 * The reel's clock: the real time during pickup hours, otherwise 12:41 today, so the first time on
 * the booking screen is always today's, whenever the reel is recorded.
 */
function demoNow(): number {
  const d = new Date();
  if (d.getHours() >= 8 && d.getHours() < 18) return d.getTime();
  d.setHours(12, 41, 0, 0);
  return d.getTime();
}

export function Reel() {
  const [screen, setScreen] = useState<Screen>("invite");
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<KitLang>("fi");
  const [why, setWhy] = useState<"open" | "closing" | null>(null);
  const [chosen, setChosen] = useState<Window | null>(null);
  const [locating, setLocating] = useState(false);
  const [arrival, setArrival] = useState<Arrival>("enRoute");
  const [finger, setFinger] = useState<Finger | null>(null);
  const [fit, setFit] = useState(1);
  const [camera, setCamera] = useState<Camera>({ s: 1, tx: 0, ty: 0, ms: 0 });
  const [overlay, setOverlay] = useState(false);
  const [fleetCount, setFleetCount] = useState(0);
  const [card, setCard] = useState(false);
  const [caption, setCaption] = useState<CaptionItem | null>(null);
  /** Beside the phone (which then sits left of centre), or on a card over the fleet map. */
  const [captionAt, setCaptionAt] = useState<"phone" | "map">("phone");
  const [layout, setLayout] = useState<{ shiftX: number; phone: React.CSSProperties; map: React.CSSProperties }>({ shiftX: 0, phone: {}, map: {} });
  /** The script runs from the first render's closure, so it reads the layout from here. */
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [playing, setPlaying] = useState(false);
  const [now] = useState(demoNow);
  /** The phone map's pixel ratio: enough for the screen normally, enough to fill the screen while zoomed in. */
  const [ratios, setRatios] = useState({ base: 2, cover: 2 });
  const [boost, setBoost] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const swoop = useRef<((pos: number) => void) | null>(null);
  const fingerEl = useRef<HTMLSpanElement>(null);
  const clock = useRef<TripClock>({ dispatchedAt: null, live: true }).current;
  const fleetBox = useRef<HTMLDivElement>(null);
  const fleet = useRef<FleetMap | null>(null);
  const phoneMap = useRef<MlMap | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fingerId = useRef(0);
  /** The script runs from the first render's closure, so it reads the fit from here. */
  const fitRef = useRef(1);
  fitRef.current = fit;

  // Fit the phone to the window; the camera's scale multiplies this.
  useEffect(() => {
    const onResize = () => {
      const h = PHONE_H + 2 * BEZEL;
      const w = PHONE_W + 2 * BEZEL;
      const f = Math.min((window.innerHeight * 0.92) / h, (window.innerWidth * 0.9) / w);
      const dpr = window.devicePixelRatio || 1;
      setFit(f);
      // With captions on screen the phone moves to about a third of the width, the text fills the right.
      const vw = window.innerWidth;
      const margin = Math.max(24, vw * 0.045);
      const half = (PHONE_W / 2 + BEZEL) * f;
      const phoneX = Math.max(margin * 1.5 + half, vw * 0.31);
      const textLeft = phoneX + half + vw * 0.055;
      setLayout({
        shiftX: phoneX - vw / 2,
        phone: { left: textLeft, top: "50%", width: Math.max(280, Math.min(820, vw - textLeft - margin)) },
        map: { left: margin, top: window.innerHeight * 0.26, width: Math.max(280, Math.min(640, vw / 2 - half - margin * 1.6)) },
      });
      setRatios({ base: Math.max(1, dpr * f), cover: Math.min(6, (dpr * Math.max(window.innerWidth, window.innerHeight)) / PHONE_W) });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The full-screen map loads hidden at once, so its tiles are ready when the overview comes.
  useEffect(() => {
    let alive = true;
    let made: FleetMap | null = null;
    if (fleetBox.current) {
      createFleetMap(fleetBox.current).then((m) => {
        if (alive) {
          fleet.current = made = m;
          exposeForRender(m.map);
        }
        else m.remove();
      }).catch((e) => console.warn("fleet map", e));
    }
    return () => {
      alive = false;
      made?.remove();
      fleet.current = null;
    };
  }, []);

  useEffect(() => () => abort.current?.abort(), []);

  const play = useCallback(() => {
    if (abort.current) return;
    const ac = new AbortController();
    abort.current = ac;
    setPlaying(true);
    run(ac.signal).catch((e) => {
      if (!(e instanceof Stopped)) console.error("reel", e);
    });
    // run reads only refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); play(); }
      else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      } else if (e.key === "r" || e.key === "R") window.location.reload();
    };
    window.addEventListener("keydown", onKey);
    if (new URLSearchParams(window.location.search).get("autoplay") === "1") {
      const t = setTimeout(play, 1200);
      return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  /* ---------- the script ---------- */

  async function run(signal: AbortSignal) {
    /** A pause to read or watch, at the reel's pace. */
    const hold = (ms: number) => sleep(ms * PACE);
    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => { clearTimeout(t); reject(new Stopped()); }, { once: true });
      });
    const tween = (ms: number, ease: (t: number) => number, fn: (v: number) => void) =>
      new Promise<void>((resolve, reject) => {
        const start = performance.now();
        const frame = () => {
          if (signal.aborted) return reject(new Stopped());
          const t = Math.min(1, (performance.now() - start) / ms);
          fn(ease(t));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    const find = (sel: string) =>
      screenRef.current?.querySelector<HTMLElement>(
        sel.startsWith("lang-") ? `[data-reel-langs] button[lang="${sel.slice(5)}"]` : `[data-reel="${sel}"]`,
      ) ?? null;
    /** Where an element's centre is on the phone screen, in the phone's own pixels. */
    const spot = (el: HTMLElement, dy = 0) => {
      const sr = screenRef.current!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const k = sr.width / PHONE_W;
      return { x: (r.left + r.width / 2 - sr.left) / k, y: (r.top + r.height / 2 - sr.top) / k + dy };
    };
    /** A touch: the finger mark lands on the element, the element presses in, the action runs, the mark lifts. */
    const tap = async (sel: string, action: () => void) => {
      // A screen that was just switched to may not be drawn yet (in the video renderer especially): wait for it.
      for (let i = 0; i < 125 && !find(sel); i++) await sleep(16);
      const el = find(sel);
      if (!el) throw new Error(`reel: nothing to tap at ${sel}`);
      const target = (el.querySelector("button") as HTMLElement | null) ?? el;
      const id = ++fingerId.current;
      setFinger({ id, ...spot(target), mode: "tap" });
      await sleep(170);
      target.classList.add("reel-pressed");
      await sleep(190);
      target.classList.remove("reel-pressed");
      action();
      setFinger((f) => (f && f.id === id ? { ...f, mode: "lift" } : f));
      await sleep(330);
      setFinger((f) => (f && f.id === id ? null : f));
    };

    /** Caption on screen now, so say() knows whether the old one has to leave first. */
    let onScreen = false;
    /**
     * Shows a caption (or clears it with null) and waits until it has arrived, and with `read`, until it
     * has been on screen long enough to read. Captions take turns: the old one leaves before the new arrives.
     */
    const say = async (c: CaptionItem | null, read = true) => {
      const leave = onScreen ? CAPTION_LEAVE_MS : 0;
      setCaption(c);
      onScreen = c !== null;
      await sleep(leave + (c ? arrivingMs(c) + (read ? readingMs(c) : 0) : 0));
    };
    const slidePhone = async (aside: boolean) => {
      setCamera({ s: 1, tx: aside ? layoutRef.current.shiftX : 0, ty: 0, ms: SLIDE_MS });
      await sleep(SLIDE_MS);
    };

    // 1. The invitation, in the middle for a moment; then the phone moves aside for the text.
    await hold(2600);
    await slidePhone(true);
    await say(CAPTIONS.languageGap);
    await tap("lang-en", () => setLang("en"));
    await say(CAPTIONS.ownLanguage);
    await tap("next", () => setScreen("about"));
    // Stays up through the "why" window below, which takes longer than reading it.
    await say(CAPTIONS.whyItMatters, false);

    // 2. What is this: open "Why does this matter?", read, scroll down, close.
    await hold(2400);
    await tap("why", () => setWhy("open"));
    await hold(1800);
    const scroller = find("why-scroll");
    if (scroller) {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const start = spot(scroller);
      const x = start.x + 40;
      const from = start.y + 170;
      const travel = 300;
      setFinger({ id: ++fingerId.current, x, y: from, mode: "drag" });
      await sleep(150);
      // The finger moves by itself (no re-render per frame) while the window scrolls under it.
      await tween(3000, easeInOutSine, (v) => {
        scroller.scrollTop = v * max;
        if (fingerEl.current) fingerEl.current.style.top = `${from - v * travel}px`;
      });
      setFinger((f) => (f ? { ...f, y: from - travel, mode: "lift" } : f));
      await sleep(330);
      setFinger(null);
    }
    await hold(1400);
    await tap("why-close", () => setWhy("closing"));
    await sleep(WINDOW_CLOSE_MS);
    setWhy(null);
    await hold(800);
    await tap("next", () => setScreen("how"));
    void say(null);

    // 3. How it works.
    await hold(2600);
    await tap("next", () => { setStep(0); setScreen("step"); });
    // Stays up through the guide steps and the sweep, which take longer than reading it.
    await say(CAPTIONS.video, false);

    // 4. The guide: step 1, step 2, then the pictures and text sweep past to the last step.
    await hold(2400);
    await tap("next", () => setStep(1));
    await hold(1800);
    setScreen("swoop"); // looks exactly like step 2, so nothing visibly changes
    await sleep(50);
    const last = STEP_ANIMS.length - 1;
    await tap("step-next", () => {});
    await tween(3000, easeInOutSine, (v) => swoop.current?.(1 + (last - 1) * v));
    await hold(2200);
    await tap("step-next", () => setScreen("book"));
    // Straight on to where the people who miss screening live, while the booking plays out underneath.
    void (async () => {
      await say(null);
      await sleep(350);
      await say(CAPTIONS.cities, false);
    })();

    // 5. Booking: the first time today, then book; the phone finds its place.
    await hold(1900);
    await tap("slot-0", () => setChosen(pickupWindows(now, 0)[0] ?? pickupWindows(now, 1)[0]));
    await hold(1000);
    await tap("book", () => setLocating(true));
    await sleep(1600);
    setScreen("track");
    setLocating(false);

    // 6. The robot sets off. The phone's map and sheet read its progress from the clock every frame.
    const dispatchedAt = performance.now();
    clock.dispatchedAt = dispatchedAt;
    /** Keeps the full-screen map's robot moving while that map is on screen. */
    const followOnFleet = () => {
      let raf = 0;
      const frame = () => {
        fleet.current?.setProgress(progressOf(clock));
        raf = requestAnimationFrame(frame);
      };
      frame();
      return () => cancelAnimationFrame(raf);
    };

    // The cities caption came up during booking; leave it a moment longer, then clear the way for the zoom.
    await sleep(1400);
    await say(null);
    // Back to the middle, where the camera zooms in.
    await slidePhone(false);
    // Both maps must have loaded before the camera can hand one over to the other.
    for (let i = 0; i < 100 && !(phoneMap.current && fleet.current); i++) await sleep(100);

    // 7. The camera moves into the phone's map until the map fills the screen.
    const mapEl = find("map");
    const fm = fleet.current;
    const pm = phoneMap.current as MlMap | null;
    if (mapEl && fm && pm) {
      const fit = fitRef.current;
      const r = mapEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // How far the camera blows the phone up: until the map fills the screen.
      const cover = Math.max(vw / r.width, vh / r.height) * fit * 1.02;
      const s = cover / fit;
      const zoom = pm.getZoom() + Math.log2(cover);
      const elapsed = () => performance.now() - dispatchedAt;
      /**
       * Where the camera looks: at the robot as it will be `ahead` ms from now, kept far enough inside the
       * map that the picture never runs past its edges. Gives the phone's camera and the matching geography.
       */
      const aim = (ahead: number) => {
        const mw = r.width / fit;
        const mh = r.height / fit - 20; // the sheet overlaps the map's foot
        const hw = vw / cover / 2;
        const hh = vh / cover / 2;
        const at = splitRoute(HYPE_ROUTE, Math.min(1, (elapsed() + ahead) / TRAVEL_MS)).at;
        const px = pm.project(at);
        const x = hw * 2 >= mw ? mw / 2 : Math.min(mw - hw, Math.max(hw, px.x));
        const y = hh * 2 >= mh ? mh / 2 : Math.min(mh - hh, Math.max(hh, px.y));
        const lx = (r.left - vw / 2) / fit + x;
        const ly = (r.top - vh / 2) / fit + y;
        return { center: pm.unproject([x, y]), camera: { s, tx: -lx * cover, ty: -ly * cover } };
      };
      // The phone's map is drawn sharper only now, for the zoom, since that costs every frame.
      setBoost(true);
      await sleep(120);
      const into = aim(CAMERA_MS);
      // Ready the full-screen map on exactly this picture before it is shown.
      fm.match(into.center, zoom, cover);
      fm.setProgress(progressOf(clock));
      setCamera({ ...into.camera, ms: CAMERA_MS });
      await sleep(CAMERA_MS + 80);

      // 8. Hand over to the full-screen map and zoom out to the whole region; the fleet pops in.
      const stopFollow = followOnFleet();
      setOverlay(true);
      await sleep(CROSSFADE_MS);
      clock.live = false; // the phone is covered: stop drawing it
      await fm.flyOut(FLY_MS - CROSSFADE_MS);
      setFleetCount(1);
      setCard(true);
      setCaptionAt("map");
      // The robots pop in while the first text is read.
      const popping = fm.popFleet(2800, setFleetCount);
      await say(CAPTIONS.routing);
      await popping;
      await say(CAPTIONS.savings);
      await say(null);

      // 9. Back to our robot, back into the phone.
      setCard(false);
      const back = aim(FLY_MS);
      await fm.flyBack(back.center, zoom, cover, FLY_MS);
      // Under the full-screen map, the phone's camera jumps to the same picture; then the map fades away.
      clock.live = true;
      setCamera({ ...back.camera, ms: 0 });
      await sleep(80);
      setOverlay(false);
      await sleep(CROSSFADE_MS + 50);
      stopFollow();
      setCamera({ s: 1, tx: 0, ty: 0, ms: CAMERA_MS });
      await sleep(CAMERA_MS);
      setBoost(false);
    }

    // 10. The robot arrives: the check over the map, then the first hand-over step.
    while (progressOf(clock) < 1) await sleep(50);
    setArrival("showing");
    await sleep(ARRIVAL_SHOW_MS);
    setArrival("leaving");
    await sleep(ARRIVAL_FADE_MS);
    setArrival("done");
    // Tells scripts/render-reel.mjs the story is over.
    document.documentElement.dataset.reelDone = "1";
  }

  /* ---------- the phone ---------- */

  const text = TEXT[lang];
  const t = text.ui;
  const test = text.test;
  const info = langInfo(lang);
  const noop = () => {};
  const S = fit * camera.s;

  function screenContent() {
    if (screen === "invite") {
      return (
        <Body key="invite" footer={<div data-reel="next"><Primary onClick={noop}>{t.next}</Primary></div>}>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-brand-strong">{test.invited}</h1>
          <p className="mt-3 leading-relaxed text-muted">{t.invitedSub}</p>
          <h2 className="mt-7 text-base font-semibold">{t.chooseLang}</h2>
          <div className="mt-3" data-reel-langs><LanguageList value={lang} onChoose={noop} /></div>
        </Body>
      );
    }
    if (screen === "about") {
      return (
        <Body key="about" footer={<Nav back={t.back} onBack={noop} primary={<div data-reel="next"><Primary onClick={noop}>{t.next}</Primary></div>} />}>
          <h1 className="mt-2 text-[1.6rem] font-semibold leading-tight">{t.aboutTitle}</h1>
          <p className="mt-3 text-lg leading-relaxed">{test.intro}</p>
          <ul className="mt-5 space-y-2.5">
            {test.facts.map((f) => (
              <li key={f} className="flex items-center gap-3"><Check aria-hidden size={20} className="shrink-0 text-brand" />{f}</li>
            ))}
          </ul>
          <button type="button" data-reel="why"
            className="mt-7 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-brand px-4 text-start font-semibold text-brand">
            {t.why}<ChevronRight aria-hidden className="shrink-0" />
          </button>
        </Body>
      );
    }
    if (screen === "how") {
      const rows = [t.howSample, t.howRobot, test.resultWait];
      return (
        <Body key="how" footer={<Nav back={t.back} onBack={noop} primary={<div data-reel="next"><Primary onClick={noop}>{t.startSampling}</Primary></div>} />}>
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
    if (screen === "step") {
      return (
        <StepView key={`s${step}`} anim={STEP_ANIMS[step]} text={test.steps[step]} index={step} total={STEP_ANIMS.length} t={t}
          onBack={noop} primary={<div data-reel="next"><Primary onClick={noop}>{t.next}</Primary></div>} />
      );
    }
    if (screen === "swoop") return <StepSwoop key="swoop" t={t} test={test} from={1} control={swoop} />;
    return <Booking key="book" lang={lang} t={t} now={now} chosen={chosen} busy={locating} />;
  }

  function trackLayer() {
    // On the way, then the arrival check over the map, then one crossfade to the hand-over step.
    const atDoor = arrival !== "enRoute";
    const showMap = arrival !== "done";
    const showSteps = arrival === "leaving" || arrival === "done";
    const leaving = arrival === "leaving";
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        {showSteps && (
          <div className="absolute inset-0 flex flex-col">
            <StepView anim={ROBOT_ANIMS[0]} text={text.robot[0]} index={0} total={ROBOT_ANIMS.length} t={t} kicker={t.arrived}
              onBack={noop} primary={<Primary onClick={noop}>{t.next}</Primary>} />
          </div>
        )}
        {showMap && (
          <div className={`relative z-10 flex min-h-0 flex-1 flex-col bg-surface ${leaving ? "kit-crossfade-out" : ""}`}>
            <LiveTracking clock={clock} t={t} pixelRatio={boost ? ratios.cover : ratios.base} onMap={(m) => { phoneMap.current = m; exposeForRender(m); }} />
            {atDoor && <ArrivedMoment t={t} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className={`reel-stage fixed inset-0 overflow-hidden ${playing ? "cursor-none" : ""}`} onClick={play}>
      {/* The phone, centred; the camera moves and scales it as one picture. */}
      <div className="absolute left-1/2 top-1/2 size-0"
        style={{
          transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${S})`,
          transformOrigin: "0 0",
          transition: camera.ms ? `transform ${camera.ms}ms cubic-bezier(0.65, 0, 0.35, 1)` : undefined,
        }}>
        <div className="reel-phone absolute" style={{ width: PHONE_W + 2 * BEZEL, height: PHONE_H + 2 * BEZEL, left: -(PHONE_W / 2 + BEZEL), top: -(PHONE_H / 2 + BEZEL), padding: BEZEL }}>
          <div ref={screenRef} lang={lang} dir={info.dir}
            className="relative flex flex-col overflow-hidden rounded-[2.6rem] bg-surface" style={{ width: PHONE_W, height: PHONE_H }}>
            <StatusBar start={now} />
            <header className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-5">
              <p className="min-w-0 truncate text-sm font-semibold text-brand-strong">{test.name}</p>
              {screen !== "invite" && (
                <span className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand">
                  <Globe aria-hidden size={18} />{info.native}
                </span>
              )}
            </header>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {/* The tracking map loads hidden under the booking screen, so it is ready when the robot sets off. */}
              {(screen === "book" || screen === "track") && (
                <div key="track" className="absolute inset-0 flex flex-col transition-opacity duration-500" style={{ opacity: screen === "track" ? 1 : 0 }}>
                  {trackLayer()}
                </div>
              )}
              {screen !== "track" && (
                <div key="screen" className="relative z-10 flex min-h-0 flex-1 flex-col bg-surface">{screenContent()}</div>
              )}
            </div>
            {why && <WhyWindow t={t} test={test} closing={why === "closing"} />}
            {finger && (
              <span key={finger.id} ref={fingerEl} aria-hidden className={`reel-finger reel-finger-${finger.mode}`}
                style={{ left: finger.x, top: finger.y }} />
            )}
          </div>
        </div>
      </div>

      {/* The full-screen fleet map, faded in over the phone while the phone's map fills the screen. */}
      <div className="pointer-events-none fixed inset-0 z-40 transition-opacity ease-in-out"
        style={{ opacity: overlay ? 1 : 0, transitionDuration: `${CROSSFADE_MS}ms` }}>
        <div ref={fleetBox} className="h-full w-full bg-[#eef2f1]" />
        <div className={`reel-fleet-card absolute left-8 top-8 rounded-2xl bg-white/95 px-6 py-4 shadow-xl ${card ? "reel-fleet-card-in" : ""}`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Fleet monitoring</p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-brand-strong">{fleetCount} {fleetCount === 1 ? "robot" : "robots"}</p>
          <p className="text-sm text-muted">collecting samples across the capital region</p>
        </div>
      </div>

      <Caption item={caption} panel={captionAt === "map"} style={captionAt === "map" ? layout.map : layout.phone} />

      {!playing && (
        <p className="reel-hint pointer-events-none fixed inset-x-0 bottom-4 text-center text-xs text-muted">
          Space or click to play · F full screen · R restart
        </p>
      )}
    </main>
  );
}

function StatusBar({ start }: { start: number }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const mounted = Date.now();
    const fmt = () => setTime(new Intl.DateTimeFormat("fi-FI", { hour: "2-digit", minute: "2-digit" }).format(new Date(start + Date.now() - mounted)).replace(".", ":"));
    fmt();
    const t = setInterval(fmt, 10_000);
    return () => clearInterval(t);
  }, [start]);
  return (
    <div className="relative flex shrink-0 items-center justify-between px-8 text-[15px] font-semibold text-ink" style={{ height: STATUS_H }} dir="ltr">
      <span className="tabular-nums">{time}</span>
      <span className="absolute left-1/2 top-2.5 h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      <span className="flex items-center gap-1.5" aria-hidden><Signal size={16} strokeWidth={2.5} /><Wifi size={16} strokeWidth={2.5} /><BatteryFull size={22} strokeWidth={2} /></span>
    </div>
  );
}

/**
 * Steps 2 to 10 in one sweep. The step number, bar and buttons stay put; each step's picture (with its
 * blue box) and text glide past together, while the bar fills and the number counts up.
 * control(pos) places it, pos 0..9 (fractions between). Only the pictures next to the position are
 * drawn, so ten looping animations never run at once.
 */
function StepSwoop({ t, test, from, control }: {
  t: Ui; test: TestText; from: number; control: React.RefObject<((pos: number) => void) | null>;
}) {
  const n = STEP_ANIMS.length;
  const [near, setNear] = useState(from);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const place = (pos: number) => {
      if (!track.current || !fill.current || !label.current) return;
      track.current.style.transform = `translate3d(${-pos * PHONE_W}px, 0, 0)`;
      fill.current.style.clipPath = `inset(0 ${100 - ((pos + 1) / n) * 100}% 0 0)`;
      label.current.textContent = t.stepOf(Math.round(pos) + 1, n);
      setNear(Math.round(pos));
    };
    control.current = place;
    place(from);
    return () => { control.current = null; };
  }, [control, from, n, t]);

  const bar = (cls: string) => (
    <div className="flex gap-1">{Array.from({ length: n }, (_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${cls}`} />)}</div>
  );
  return (
    <div className="reel-still flex min-h-0 flex-1 flex-col">
      <Body footer={<Nav back={t.back} onBack={() => {}} primary={<div data-reel="step-next"><Primary onClick={() => {}}>{near === n - 1 ? t.sampleDone : t.next}</Primary></div>} />}>
        <div>
          <p ref={label} className="text-sm font-semibold text-muted">{t.stepOf(from + 1, n)}</p>
          <div className="relative mt-2" aria-hidden>
            {bar("bg-rule")}
            <div ref={fill} className="absolute inset-0">{bar("bg-brand")}</div>
          </div>
        </div>
        {/* One item per step, a screen's width apart, laid out exactly as StepView lays out one step. */}
        <div className="-mx-5 overflow-hidden">
          <div ref={track} className="flex items-start will-change-transform">
            {STEP_ANIMS.map((anim, i) => (
              <div key={anim} className="shrink-0 px-5" style={{ width: PHONE_W }}>
                <div className="mt-5 rounded-2xl bg-brand-soft/70 px-6 py-4" dir="ltr">
                  {Math.abs(i - near) <= 1
                    ? <StepAnimation anim={anim} className="mx-auto max-h-[min(210px,24dvh)]" />
                    : <div className="h-[min(210px,24dvh)]" />}
                </div>
                <h1 className="mt-5 text-[1.45rem] font-semibold leading-snug">{test.steps[i].title}</h1>
                {test.steps[i].body && <p className="mt-2 leading-relaxed text-muted">{test.steps[i].body}</p>}
              </div>
            ))}
          </div>
        </div>
      </Body>
    </div>
  );
}

/** The tracking screen's map and sheet, redrawn every frame from the trip clock (and not while covered). */
function LiveTracking({ clock, t, pixelRatio, onMap }: { clock: TripClock; t: Ui; pixelRatio: number; onMap: (m: MlMap) => void }) {
  const [p, setP] = useState(() => progressOf(clock));
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      if (clock.live) setP(progressOf(clock));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [clock]);
  return (
    <>
      <div className="min-h-0 flex-1" dir="ltr" data-reel="map">
        <TrackingMap route={HYPE_ROUTE} progress={p} pixelRatio={pixelRatio} onMap={onMap}
          labels={{ robot: t.onTheWay, home: t.home, hub: t.hub, error: t.mapError }} />
      </div>
      <Sheet t={t} progress={p} />
    </>
  );
}

/** The bottom sheet of the tracking screen, as in the phone app. */
function Sheet({ t, progress }: { t: Ui; progress: number }) {
  const secs = Math.ceil(((1 - progress) * TRAVEL_MS) / 1000);
  return (
    <section className="relative z-10 -mt-5 rounded-t-3xl bg-surface px-5 pb-6 pt-5 shadow-[0_-8px_24px_-12px_rgba(0,60,108,0.3)]">
      <p className="text-sm font-semibold text-muted">{t.onTheWay}</p>
      <h1 className="mt-1 text-2xl font-semibold tabular-nums text-brand-strong">{secs <= 1 ? t.almostThere : t.arrivesIn(secs)}</h1>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{t.from}</p>
      <p className="mt-2 text-xs font-semibold tabular-nums text-muted">{t.spedUp(Math.round(REAL_TRIP_MS / TRAVEL_MS))}</p>
    </section>
  );
}

/** "Why this matters", as the phone app's window, opened and closed by the script. */
function WhyWindow({ t, test, closing }: { t: Ui; test: TestText; closing: boolean }) {
  return (
    <div className={`absolute inset-0 z-30 ${closing ? "kit-window-out" : ""}`} style={{ top: STATUS_H }}>
      <div className="kit-backdrop absolute inset-0 bg-[rgba(0,40,75,0.45)]" aria-hidden />
      <div role="dialog" className="kit-window absolute inset-x-3 bottom-3 top-8 flex flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <h2 className="text-lg font-semibold text-brand-strong">{t.whyTitle}</h2>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full"><X aria-hidden /></span>
        </div>
        <div className="reel-noscrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4" data-reel="why-scroll">
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
              {SOURCES.map((s) => <li key={s.url}><span className="link text-muted">{s.label}</span></li>)}
            </ul>
          </div>
        </div>
        <div className="px-5 pb-4 pt-2" data-reel="why-close"><Primary onClick={() => {}}>{t.close}</Primary></div>
      </div>
    </div>
  );
}

/** The booking screen, as in the phone app, with the choice made by the script. */
function Booking({ lang, t, now, chosen, busy }: { lang: KitLang; t: Ui; now: number; chosen: Window | null; busy: boolean }) {
  const today = pickupWindows(now, 0);
  const day: 0 | 1 = today.length ? 0 : 1;
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
        <button type="button"
          className="mt-5 flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 border-brand bg-brand-soft px-4 text-start">
          <span><span className="block font-semibold text-brand-strong">{t.asap}</span><span className="text-sm text-muted">{t.asapNote}</span></span>
          <ChevronRight aria-hidden className="shrink-0 text-brand" />
        </button>
        <div>
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
            {([0, 1] as const).map((d) => {
              const date = new Date(now);
              date.setDate(date.getDate() + d);
              return (
                <span key={d} className={`flex min-h-12 items-center justify-center gap-1 rounded-lg text-sm font-semibold ${day === d ? "bg-surface text-brand-strong shadow-sm" : "text-muted"}`}>
                  {dayName(d)} <span className="font-normal text-muted">{dateFmt.format(date)}</span>
                </span>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2" dir="ltr">
            {windows.map((w, i) => (
              <button key={w.at} type="button" data-reel={`slot-${i}`}
                className={`min-h-12 rounded-lg border text-sm font-semibold tabular-nums transition-colors ${chosen?.at === w.at ? "border-brand bg-brand text-white" : "border-rule"}`}>
                {w.start}–{w.end}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 pb-4 pt-2" data-reel="book">
        <button type="button" disabled={!chosen && !busy}
          className="primary-action !min-h-14 w-full !rounded-xl !text-base transition-opacity disabled:opacity-40">
          {busy ? <><Loader2 aria-hidden size={18} className="animate-spin" />{t.locating}</> : chosen ? t.confirm(label(chosen)) : t.pickTime}
        </button>
      </div>
    </>
  );
}
