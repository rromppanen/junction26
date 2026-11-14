"use client";

import { useSyncExternalStore } from "react";
import type { Anim } from "@/lib/kit/content";
import "./animations.css";

/**
 * Minimal line drawings, one movement per step. The motion lives in animations.css.
 * Drawn in ink with the brand blue for the part that matters; decorative, so hidden from screen
 * readers (the step title says the same thing in words).
 */
const INK = "var(--ink)";
const BRAND = "var(--brand)";
const SOFT = "var(--brand-soft)";
const RULE = "var(--rule)";
const LIQUID = "#dcecef";
const CAP = "#3a9d5d";
const STOOL = "#9a6a44";
const PAPER = "#f6f2e7";
const W = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Each scene's loop length in seconds, and whether it fades out and in at the loop (scenes that do not end where they start). */
const SCENES: Record<Anim, { d: number; fade: boolean; draw: () => React.ReactNode }> = {
  unbag: { d: 3.6, fade: true, draw: () => (
    <>
      <g className="a a-unbag"><ClosedTube y={46} h={56} /></g>
      <Bag />
    </>
  ) },
  rebag: { d: 3.6, fade: true, draw: () => (
    <>
      <g className="a a-rebag"><ClosedTube y={46} h={56} /></g>
      <Bag sealClass="a a-seal" />
    </>
  ) },
  base: { d: 3.6, fade: true, draw: () => (
    <>
      <rect x={70} y={10} width={60} height={20} rx={5} fill="#fff" {...W} />
      <ellipse cx={100} cy={85} rx={58} ry={44} fill="#fff" {...W} />
      <ellipse cx={100} cy={88} rx={36} ry={26} fill={LIQUID} stroke={INK} strokeWidth={2} />
      <g className="a a-base">
        <rect x={56} y={60} width={88} height={52} rx={3} fill={PAPER} {...W} strokeWidth={2.5} />
        {[72, 80, 88, 96].map((y) => (
          <line key={y} x1={66} y1={y} x2={y === 96 ? 110 : 134} y2={y} stroke={INK} strokeWidth={1.5} opacity={0.35} />
        ))}
      </g>
    </>
  ) },
  // The stick hangs inside the tube (drawn behind it); the cap sits on top (drawn in front). Both lift together.
  twist: { d: 4.4, fade: true, draw: () => (
    <>
      <defs>
        <clipPath id="kit-cap-clip"><rect x={84} y={42} width={32} height={20} rx={4} /></clipPath>
      </defs>
      <g className="a a-lift"><Stick x={100} top={60} /></g>
      <TubeBody y={60} h={74} />
      <g className="a a-lift">
        <rect x={84} y={42} width={32} height={20} rx={4} fill={CAP} />
        <g clipPath="url(#kit-cap-clip)">
          <g className="a a-ridges">
            {[-20, -14, -8, -2, 4, 10, 16, 22, 28].map((dx) => (
              <line key={dx} x1={100 + dx} y1={45} x2={100 + dx} y2={59} stroke={INK} strokeWidth={1.5} opacity={0.45} />
            ))}
          </g>
        </g>
        <rect x={84} y={42} width={32} height={20} rx={4} fill="none" {...W} />
      </g>
      <g className="a a-turn-arrow" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M76 66 q24 12 48 0" stroke="#fff" strokeWidth={7} />
        <path d="M76 66 q24 12 48 0" stroke={BRAND} strokeWidth={3} />
        <path d="M116 62 l8 4 l-5 7" stroke={BRAND} strokeWidth={3} />
      </g>
    </>
  ) },
  // Leaning stick, pivoting on its tip, swept back and forth across the middle of the stool.
  scrape: { d: 3, fade: false, draw: () => (
    <>
      <ellipse cx={100} cy={120} rx={82} ry={17} fill="#fff" {...W} />
      <path d="M62 120 q4 -16 22 -14 q12 -12 28 -4 q18 -6 26 8 q4 10 -12 12 h-54 q-12 0 -10 -2z" fill={STOOL} stroke={INK} strokeWidth={2} />
      <g className="a a-scrape">
        <g transform="rotate(22 100 112)">
          <Stick x={100} top={48} length={64} />
          <rect x={84} y={30} width={32} height={20} rx={4} fill={CAP} {...W} />
        </g>
      </g>
    </>
  ) },
  click: { d: 3.2, fade: true, draw: () => (
    <>
      <TubeBody />
      <g className="a a-press">
        <rect x={84} y={34} width={32} height={20} rx={4} fill={CAP} {...W} />
      </g>
      <g className="a a-burst" stroke={BRAND} strokeWidth={3} strokeLinecap="round">
        <line x1={72} y1={30} x2={64} y2={22} />
        <line x1={128} y1={30} x2={136} y2={22} />
        <line x1={100} y1={22} x2={100} y2={12} />
      </g>
    </>
  ) },
  shake: { d: 3.2, fade: false, draw: () => (
    <>
      <g className="a a-shake"><ClosedTube y={46} /></g>
      <path d="M52 60 q-10 28 0 56 M148 60 q10 28 0 56" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
    </>
  ) },
  // The sticker starts on the background form (left), is peeled off and put on the flat side of the tube (right).
  label: { d: 5.2, fade: true, draw: () => (
    <>
      <rect x={14} y={26} width={78} height={100} rx={4} fill="#fff" {...W} strokeWidth={2.5} />
      {[40, 50, 60, 70].map((y) => (
        <line key={y} x1={24} y1={y} x2={y === 70 ? 60 : 82} y2={y} stroke={INK} strokeWidth={1.5} opacity={0.35} />
      ))}
      <rect x={54} y={86} width={20} height={30} rx={2} fill="none" stroke={RULE} strokeWidth={2} strokeDasharray="3 3" />
      <ClosedTube x={140} y={46} h={80} />
      <g className="a a-sticker">
        <rect x={54} y={86} width={20} height={30} rx={2} fill="#fff" stroke={BRAND} strokeWidth={2.5} />
        <line x1={58} y1={96} x2={70} y2={96} stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <line x1={58} y1={104} x2={66} y2={104} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </g>
    </>
  ) },
  // Ticks appear one by one, stay, then all clear before the next loop.
  form: { d: 5, fade: false, draw: () => (
    <>
      <rect x={66} y={8} width={68} height={134} rx={12} fill="#fff" {...W} />
      {[38, 70, 102].map((y, i) => (
        <g key={y}>
          <rect x={78} y={y} width={16} height={16} rx={3} fill="#fff" stroke={INK} strokeWidth={2} />
          <line x1={100} y1={y + 8} x2={124} y2={y + 8} stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
          <path d={`M81 ${y + 8} l4 4 l7 -8`} fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} className={`a a-tick t${i + 1}`} />
        </g>
      ))}
    </>
  ) },
  // Back panel, then the bag, then the front pocket over the bag's lower half. The flap is drawn
  // twice: behind the back panel while it stands open, in front once it folds past the top edge.
  envelope: { d: 4.4, fade: true, draw: () => <EnvelopeScene /> },
  robotArrive: { d: 3.6, fade: true, draw: () => (
    <>
      <Ground />
      <rect x={166} y={40} width={26} height={93} rx={2} fill="#fff" {...W} />
      <circle cx={172} cy={90} r={2.5} fill={INK} />
      <g className="a a-arrive"><Robot /></g>
    </>
  ) },
  robotUnlock: { d: 3.2, fade: true, draw: () => (
    <>
      <rect x={66} y={8} width={68} height={134} rx={12} fill="#fff" {...W} />
      <rect x={88} y={50} width={24} height={20} rx={4} fill={SOFT} {...W} />
      <path d="M93 50 v-8 a7 7 0 0 1 14 0 v8" fill="none" {...W} className="a a-shackle" />
      <rect x={78} y={96} width={44} height={20} rx={10} fill={BRAND} className="a a-button" />
      <circle cx={100} cy={106} r={14} fill="none" stroke={BRAND} strokeWidth={3} className="a a-tap" />
    </>
  ) },
  robotPlace: { d: 3.6, fade: true, draw: () => (
    <>
      <Ground />
      <Robot lidClass="a-lid-open" lidBehind light={false} cargo={
        <g className="a a-dropin">
          <rect x={76} y={4} width={48} height={30} rx={3} fill="#fff" {...W} />
          <path d="M76 8 L100 22 L124 8" fill="none" {...W} strokeWidth={2} />
        </g>
      } />
    </>
  ) },
  robotClose: { d: 3.6, fade: true, draw: () => (
    <>
      <Ground />
      <Robot lidClass="a a-lid-close" light={false} />
      <g className="a a-lock">
        <circle cx={100} cy={34} r={14} fill={BRAND} />
        <path d="M93 34 l5 5 l9 -10" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  ) },
  // Plays once: the robot drives right off the picture, then a check takes its place and stays.
  robotLeave: { d: 3.2, fade: false, draw: () => (
    <>
      <Ground />
      <g className="a-leave">
        <Robot />
        <path d="M30 80 h-14 M34 96 h-20 M30 112 h-12" stroke={RULE} strokeWidth={3} strokeLinecap="round" />
      </g>
      <g className="a-done">
        <circle cx={100} cy={78} r={30} fill={BRAND} />
        <path d="M86 78 l10 10 l18 -20" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} className="a-done-tick" />
      </g>
    </>
  ) },
};

/*
  The envelope flap changes shape rather than flipping, so it never thins to a line: the tip travels
  from above the envelope to over the pocket, and the sides bow outwards on the way, as a folding
  flap does seen from the front. Corners stay on the envelope's top corners and the shut flap's
  point meets the pocket's V. SMIL drives the shape (CSS cannot morph a path in Safari).
*/
const FLAP_OPEN = "M40 70 Q70 50 100 30 Q130 50 160 70 Z";
const FLAP_MID = "M40 70 Q70 60 100 66 Q130 60 160 70 Z";
const FLAP_SHUT = "M40 70 Q70 90 100 110 Q130 90 160 70 Z";
/*
  The fold is one movement split across the two drawings at the top edge. The first half speeds up
  into the hand-over and the second leaves it at the same speed (both curves have slope 1 there),
  and each half lasts in proportion to how far the point travels (36 and 44 units), so the flap
  never pauses at the edge.
*/
const HOLD = "0 0 1 1";
const FOLD_IN = "0.5 0 0.75 0.75";
const FOLD_OUT = "0.25 0.25 0.5 1";

function EnvelopeScene() {
  const still = usePrefersReducedMotion();
  const D = "4.4s";
  return (
    <>
      <path d={still ? FLAP_SHUT : FLAP_OPEN} fill={SOFT} {...W} opacity={still ? 0 : 1}>
        {!still && <>
          <animate attributeName="d" dur={D} repeatCount="indefinite" calcMode="spline"
            values={`${FLAP_OPEN};${FLAP_OPEN};${FLAP_MID};${FLAP_MID}`} keyTimes="0;0.54;0.63;1" keySplines={`${HOLD};${FOLD_IN};${HOLD}`} />
          <animate attributeName="opacity" dur={D} repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.63" />
        </>}
      </path>
      <rect x={40} y={70} width={120} height={66} rx={4} fill={SOFT} {...W} />
      <g className="a a-intoenv">
        <rect x={70} y={8} width={60} height={44} rx={5} fill="#fff" {...W} />
        <line x1={76} y1={16} x2={124} y2={16} stroke={BRAND} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* The pocket's V runs from the top corners to the shut flap's point, so the shut flap lies exactly on it. */}
      <path d="M40 70 L100 110 L160 70 V132 a4 4 0 0 1 -4 4 H44 a4 4 0 0 1 -4 -4 Z" fill="#fff" {...W} />
      <path d={still ? FLAP_SHUT : FLAP_MID} fill="#fff" {...W} opacity={still ? 1 : 0}>
        {!still && <>
          <animate attributeName="d" dur={D} repeatCount="indefinite" calcMode="spline"
            values={`${FLAP_MID};${FLAP_MID};${FLAP_SHUT};${FLAP_SHUT}`} keyTimes="0;0.63;0.74;1" keySplines={`${HOLD};${FOLD_OUT};${HOLD}`} />
          <animate attributeName="opacity" dur={D} repeatCount="indefinite" calcMode="discrete" values="0;1" keyTimes="0;0.63" />
        </>}
      </path>
    </>
  );
}

function subscribeMotion(cb: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

/** SMIL ignores the CSS reduced-motion rule, so the envelope checks the setting itself. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

export function StepAnimation({ anim, className = "" }: { anim: Anim; className?: string }) {
  const scene = SCENES[anim];
  return (
    <svg viewBox="0 0 200 150" aria-hidden className={`kit-anim block h-auto w-full ${className}`}
      style={{ "--d": `${scene.d}s` } as React.CSSProperties}>
      {scene.fade ? <g className="a a-fade">{scene.draw()}</g> : scene.draw()}
    </svg>
  );
}

function TubeBody({ x = 88, y = 52, h = 72 }: { x?: number; y?: number; h?: number }) {
  return (
    <>
      <rect x={x} y={y} width={24} height={h} rx={8} fill={LIQUID} {...W} />
      <line x1={x + 6} y1={y + h - 26} x2={x + 18} y2={y + h - 26} stroke={INK} strokeWidth={1.5} opacity={0.35} />
    </>
  );
}

/** The sampling stick hanging down from (x, top), with its ridged tip at the bottom. */
function Stick({ x, top, length = 56 }: { x: number; top: number; length?: number }) {
  const tip = top + length;
  return (
    <>
      <line x1={x} y1={top} x2={x} y2={tip - 2} {...W} strokeWidth={2.5} />
      <path d={`M${x - 4} ${tip - 10} l8 2 l-8 3 l8 2 l-8 3`} fill="none" {...W} strokeWidth={2} />
    </>
  );
}

function ClosedTube({ x = 88, y = 52, h = 72 }: { x?: number; y?: number; h?: number }) {
  return (
    <>
      <TubeBody x={x} y={y} h={h} />
      <rect x={x - 4} y={y - 18} width={32} height={20} rx={4} fill={CAP} {...W} />
    </>
  );
}

function Bag({ sealClass = "" }: { sealClass?: string }) {
  return (
    <>
      <rect x={48} y={70} width={104} height={76} rx={8} fill="#fff" {...W} />
      <line x1={56} y1={80} x2={144} y2={80} stroke={RULE} strokeWidth={3} strokeLinecap="round" className={sealClass} />
    </>
  );
}

/**
 * Side view of a delivery robot. `cargo` is drawn behind the body, so it disappears into the
 * compartment. The lid is drawn on top of the body, so a closed lid rests on it; while it stands
 * open with cargo going in (`lidBehind`), it is drawn first, so the cargo passes in front of it.
 */
function Robot({ lidClass = "", light = true, cargo, lidBehind = false }: {
  lidClass?: string; light?: boolean; cargo?: React.ReactNode; lidBehind?: boolean;
}) {
  const lid = (
    <g className={lidClass}>
      <rect x={50} y={62} width={100} height={12} rx={6} fill={SOFT} {...W} />
    </g>
  );
  return (
    <>
      {lidBehind && lid}
      <line x1={40} y1={100} x2={40} y2={24} {...W} strokeWidth={2} />
      <path d="M40 24 l-20 6 l20 6 z" fill={BRAND} stroke={BRAND} strokeWidth={2} strokeLinejoin="round" />
      {cargo}
      <path d="M40 100 H50" {...W} strokeWidth={2} />
      <rect x={50} y={72} width={100} height={44} rx={12} fill="#fff" {...W} />
      {light && <circle cx={140} cy={86} r={4} fill={BRAND} className="a a-blink" />}
      {[72, 100, 128].map((cx) => (
        <circle key={cx} cx={cx} cy={122} r={10} fill={INK} />
      ))}
      {!lidBehind && lid}
    </>
  );
}

function Ground() {
  return <line x1={10} y1={133} x2={190} y2={133} stroke={RULE} strokeWidth={3} strokeLinecap="round" />;
}
