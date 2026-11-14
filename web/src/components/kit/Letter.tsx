import { Mail } from "lucide-react";
import type { Lang, Programme } from "@/lib/sample/model";
import { LOCALES, type KitStrings } from "./strings";

// Decorative pseudo-random 21x21 module grid with three finder squares. Not a real code.
const N = 21;
const CELLS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let seed = 20260;
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (!finder(x, y) && seed % 100 < 48) out.push([x, y]);
    }
  }
  return out;
})();
const FINDERS: [number, number][] = [[0, 0], [N - 7, 0], [0, N - 7]];

function FakeQr({ label }: { label: string }) {
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} role="img" aria-label={label} className="size-40 bg-white text-ink" shapeRendering="crispEdges">
      {FINDERS.map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="currentColor" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
        </g>
      ))}
      {CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

/** The invitation letter, on screen only. The code is decorative. */
export function Letter({
  t,
  name,
  programme,
  now,
  lang,
  onOpen,
}: {
  t: KitStrings["letter"];
  name: string;
  programme: Programme;
  now: number;
  lang: Lang;
  onOpen: () => void;
}) {
  const date = new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "long", year: "numeric" }).format(now);
  return (
    <section className="space-y-4 rounded-xl border border-rule bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand">
        <Mail aria-hidden size={18} />
        {t.sender}
      </div>
      <p className="text-xs text-muted">
        {t.to}: <span className="font-semibold text-ink">{name}</span> · {t.date}: {date}
      </p>
      <p className="text-base font-semibold">{programme === "bowel" ? t.inviteBowel : t.inviteCervical}</p>
      <p className="text-sm text-muted">{t.scan}</p>
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={onOpen} aria-label={`${t.demoCode}: ${t.open}`} className="rounded-lg border border-rule p-2 hover:border-brand">
          <FakeQr label={t.demoCode} />
        </button>
        <span className="text-xs text-muted">{t.demoCode}</span>
        <button type="button" onClick={onOpen} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">
          {t.open}
        </button>
      </div>
    </section>
  );
}
