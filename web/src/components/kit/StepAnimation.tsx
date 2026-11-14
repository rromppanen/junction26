import type { Anim } from "@/lib/kit/content";
import "./animations.css";

/**
 * Minimal line drawings, one movement per step. The motion lives in animations.css.
 * Drawn in ink with teal for the part that matters; decorative, so hidden from screen readers
 * (the step title says the same thing in words).
 */
const INK = "var(--ink)";
const BRAND = "var(--brand)";
const SOFT = "var(--brand-soft)";
const RULE = "var(--rule)";
const LIQUID = "#dcecef";
const CAP = "#3a9d5d";
const STOOL = "#9a6a44";
const W = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function StepAnimation({ anim, className = "" }: { anim: Anim; className?: string }) {
  return (
    <svg viewBox="0 0 200 150" aria-hidden className={`kit-anim block h-auto w-full ${className}`}>
      {DRAW[anim]()}
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

/** The green cap with its stick hanging down from it. */
function CapWithStick({ x = 88, y = 52, ridgesClass = "" }: { x?: number; y?: number; ridgesClass?: string }) {
  return (
    <>
      <line x1={x + 12} y1={y} x2={x + 12} y2={y + 56} {...W} strokeWidth={2.5} />
      <path d={`M${x + 8} ${y + 50} l8 2 l-8 3 l8 2 l-8 3`} fill="none" {...W} strokeWidth={2} />
      <rect x={x - 4} y={y - 18} width={32} height={20} rx={4} fill={CAP} {...W} />
      <g className={ridgesClass}>
        {[4, 10, 16, 22].map((d) => (
          <line key={d} x1={x - 4 + d + 2} y1={y - 14} x2={x - 4 + d + 2} y2={y - 2} stroke={INK} strokeWidth={1.5} opacity={0.5} />
        ))}
      </g>
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

/** Side view of a delivery robot; `cargo` is drawn between the lid and the body, so it can go in under an open lid. */
function Robot({ lidClass = "", light = true, cargo }: { lidClass?: string; light?: boolean; cargo?: React.ReactNode }) {
  return (
    <>
      <line x1={40} y1={100} x2={40} y2={24} {...W} strokeWidth={2} />
      <path d="M40 24 l-20 6 l20 6 z" fill={BRAND} stroke={BRAND} strokeWidth={2} strokeLinejoin="round" />
      <g className={lidClass}>
        <rect x={50} y={60} width={100} height={14} rx={7} fill={SOFT} {...W} />
      </g>
      {cargo}
      <path d="M40 100 H50" {...W} strokeWidth={2} />
      <rect x={50} y={72} width={100} height={44} rx={12} fill="#fff" {...W} />
      {light && <circle cx={140} cy={86} r={4} fill={BRAND} className="a a-blink" />}
      {[72, 100, 128].map((cx) => (
        <circle key={cx} cx={cx} cy={122} r={10} fill={INK} />
      ))}
    </>
  );
}

function Envelope({ flapClass = "", children }: { flapClass?: string; children?: React.ReactNode }) {
  return (
    <>
      <rect x={40} y={70} width={120} height={66} rx={4} fill={SOFT} {...W} />
      {children}
      <path d="M40 74 L100 112 L160 74 V132 a4 4 0 0 1 -4 4 H44 a4 4 0 0 1 -4 -4 Z" fill="#fff" {...W} />
      <path d="M40 72 L100 34 L160 72 Z" fill="#fff" {...W} className={flapClass} />
    </>
  );
}

function Ground() {
  return <line x1={10} y1={133} x2={190} y2={133} stroke={RULE} strokeWidth={3} strokeLinecap="round" />;
}

function Swab({ x, y }: { x: number; y: number }) {
  // Horizontal swab, soft tip on the right at (x, y), handle running left.
  return (
    <>
      <line x1={x - 90} y1={y} x2={x - 8} y2={y} {...W} strokeWidth={4} />
      <ellipse cx={x} cy={y} rx={11} ry={6} fill={SOFT} stroke={BRAND} strokeWidth={3} />
      <line x1={x - 60} y1={y - 5} x2={x - 60} y2={y + 5} {...W} strokeWidth={2} />
    </>
  );
}

const DRAW: Record<Anim, () => React.ReactNode> = {
  unbag: () => (
    <>
      <g className="a a-unbag">
        <ClosedTube y={46} h={56} />
      </g>
      <Bag />
    </>
  ),
  rebag: () => (
    <>
      <g className="a a-rebag">
        <ClosedTube y={46} h={56} />
      </g>
      <Bag sealClass="a a-seal" />
    </>
  ),
  base: () => (
    <>
      <rect x={70} y={10} width={60} height={20} rx={5} fill="#fff" {...W} />
      <ellipse cx={100} cy={85} rx={58} ry={44} fill="#fff" {...W} />
      <ellipse cx={100} cy={88} rx={36} ry={26} fill="#dcecef" stroke={INK} strokeWidth={2} />
      <g className="a a-base">
        <rect x={56} y={60} width={88} height={52} rx={3} fill="#f6f2e7" {...W} strokeWidth={2.5} />
        {[72, 80, 88, 96].map((y) => (
          <line key={y} x1={66} y1={y} x2={y === 96 ? 110 : 134} y2={y} stroke={INK} strokeWidth={1.5} opacity={0.35} />
        ))}
      </g>
    </>
  ),
  twist: () => (
    <>
      <g className="a a-twist-cap">
        <CapWithStick ridgesClass="a a-twist-ridges" />
      </g>
      <TubeBody />
      <path d="M80 28 a24 9 0 0 0 40 0" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" className="a a-twist-arrow" />
      <path d="M120 28 l-7 -4 m7 4 l-2 7" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" className="a a-twist-arrow" />
    </>
  ),
  scrape: () => (
    <>
      <ellipse cx={100} cy={120} rx={78} ry={18} fill="#fff" {...W} />
      <path d="M78 118 q8 -14 22 -10 q14 -8 22 4 q4 8 -10 10 h-26 q-12 0 -8 -4z" fill={STOOL} stroke={INK} strokeWidth={2} />
      <g className="a a-scrape">
        <g transform="rotate(-18 100 60)">
          <CapWithStick x={88} y={50} />
        </g>
      </g>
    </>
  ),
  click: () => (
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
  ),
  shake: () => (
    <>
      <g className="a a-shake">
        <ClosedTube y={46} />
      </g>
      <path d="M52 60 q-10 28 0 56 M148 60 q10 28 0 56" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
    </>
  ),
  label: () => (
    <>
      <ClosedTube y={40} />
      <g className="a a-sticker">
        <rect x={91} y={58} width={18} height={44} rx={2} fill="#fff" stroke={BRAND} strokeWidth={2.5} />
        <line x1={95} y1={68} x2={105} y2={68} stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <line x1={95} y1={76} x2={102} y2={76} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </g>
    </>
  ),
  form: () => (
    <>
      <rect x={66} y={8} width={68} height={134} rx={12} fill="#fff" {...W} />
      {[38, 70, 102].map((y, i) => (
        <g key={y}>
          <rect x={78} y={y} width={16} height={16} rx={3} fill="#fff" stroke={INK} strokeWidth={2} />
          <line x1={100} y1={y + 8} x2={124} y2={y + 8} stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
          <path d={`M81 ${y + 8} l4 4 l7 -8`} fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} className={`a a-tick ${i === 1 ? "d1" : i === 2 ? "d2" : ""}`} />
        </g>
      ))}
    </>
  ),
  envelope: () => (
    <Envelope flapClass="a a-flap">
      <g className="a a-intoenv">
        <rect x={70} y={30} width={60} height={44} rx={5} fill="#fff" {...W} />
        <line x1={76} y1={38} x2={124} y2={38} stroke={BRAND} strokeWidth={3} strokeLinecap="round" />
      </g>
    </Envelope>
  ),
  wash: () => (
    <>
      <path d="M40 30 H112 a8 8 0 0 1 8 8 V48" fill="none" {...W} strokeWidth={6} />
      <rect x={52} y={18} width={22} height={8} rx={3} fill={INK} />
      {[0, 1, 2].map((i) => (
        <path key={i} d="M120 58 q-4 6 0 9 q4 -3 0 -9z" fill={BRAND} className={`a a-drop ${i === 1 ? "d1" : i === 2 ? "d2" : ""}`} />
      ))}
      <path d="M72 128 q-6 -26 14 -30 l34 0 q20 4 14 30 z" fill="#fff" {...W} />
      <path d="M86 98 q34 -10 34 0" fill="none" {...W} strokeWidth={2} />
      {[[92, 112], [106, 106], [118, 116]].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r={4} fill="none" stroke={BRAND} strokeWidth={2} />
      ))}
    </>
  ),
  unwrap: () => (
    <>
      <g className="a a-unwrap">
        <g transform="rotate(180 100 75)">
          <Swab x={150} y={75} />
        </g>
        <circle cx={50} cy={75} r={17} fill="none" stroke={BRAND} strokeWidth={2} strokeDasharray="4 4" className="a a-notouch" />
      </g>
      <rect x={20} y={60} width={104} height={30} rx={5} fill="#eef4f2" fillOpacity={0.85} {...W} />
      <line x1={124} y1={60} x2={124} y2={90} stroke={INK} strokeWidth={3} strokeDasharray="3 5" />
    </>
  ),
  insert: () => (
    <>
      <path d="M130 50 q40 -12 64 0 v50 q-24 12 -64 0 z" fill={SOFT} stroke="none" />
      <path d="M130 62 q30 -4 64 -2 M130 88 q30 4 64 2" fill="none" {...W} />
      <g className="a a-insert">
        <Swab x={110} y={75} />
      </g>
      <g className="a a-measure" stroke={BRAND} strokeWidth={2} strokeLinecap="round">
        <line x1={132} y1={110} x2={168} y2={110} />
        <line x1={132} y1={105} x2={132} y2={115} />
        <line x1={168} y1={105} x2={168} y2={115} />
      </g>
      <text x={150} y={132} textAnchor="middle" fontSize={14} fontWeight={600} fill={BRAND} className="a a-measure">5 cm</text>
    </>
  ),
  rotate: () => (
    <>
      <Swab x={130} y={75} />
      <g className="a a-roll">
        {[0, 8, 16].map((d) => (
          <line key={d} x1={70} y1={70 + d} x2={78} y2={70 + d} stroke={INK} strokeWidth={1.5} opacity={0.4} />
        ))}
      </g>
      <g className="a a-spin">
        <path d="M130 51 a24 24 0 1 1 -22 14" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" />
        <path d="M108 65 l-1 -9 m1 9 l8 -3" fill="none" stroke={BRAND} strokeWidth={3} strokeLinecap="round" />
      </g>
      <text x={130} y={130} textAnchor="middle" fontSize={14} fontWeight={600} fill={BRAND}>10–30 s</text>
    </>
  ),
  intube: () => (
    <>
      <g className="a a-swabdown">
        <g transform="rotate(90 100 20)">
          <Swab x={150} y={20} />
        </g>
      </g>
      <rect x={86} y={80} width={28} height={60} rx={9} fill={LIQUID} fillOpacity={0.8} {...W} />
      <g className="a a-capdown">
        <rect x={82} y={62} width={36} height={20} rx={4} fill={BRAND} {...W} />
      </g>
    </>
  ),
  robotArrive: () => (
    <>
      <Ground />
      <rect x={166} y={40} width={26} height={93} rx={2} fill="#fff" {...W} />
      <circle cx={172} cy={90} r={2.5} fill={INK} />
      <g className="a a-arrive">
        <Robot />
      </g>
    </>
  ),
  robotUnlock: () => (
    <>
      <rect x={66} y={8} width={68} height={134} rx={12} fill="#fff" {...W} />
      <rect x={88} y={50} width={24} height={20} rx={4} fill={SOFT} {...W} />
      <path d="M93 50 v-8 a7 7 0 0 1 14 0 v8" fill="none" {...W} className="a a-shackle" />
      <rect x={78} y={96} width={44} height={20} rx={10} fill={BRAND} className="a a-button" />
      <circle cx={100} cy={106} r={14} fill="none" stroke={BRAND} strokeWidth={3} className="a a-tap" />
    </>
  ),
  robotPlace: () => (
    <>
      <Ground />
      <Robot lidClass="a-lid-open" light={false} cargo={
        <g className="a a-dropin">
          <rect x={76} y={4} width={48} height={30} rx={3} fill="#fff" {...W} />
          <path d="M76 8 L100 22 L124 8" fill="none" {...W} strokeWidth={2} />
        </g>
      } />
    </>
  ),
  robotClose: () => (
    <>
      <Ground />
      <Robot lidClass="a a-lid-close" light={false} />
      <g className="a a-lock">
        <circle cx={100} cy={34} r={14} fill={BRAND} />
        <path d="M93 34 l5 5 l9 -10" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  ),
  robotLeave: () => (
    <>
      <Ground />
      <g className="a a-leave">
        <Robot />
        <path d="M30 80 h-14 M34 96 h-20 M30 112 h-12" stroke={RULE} strokeWidth={3} strokeLinecap="round" />
      </g>
    </>
  ),
};
