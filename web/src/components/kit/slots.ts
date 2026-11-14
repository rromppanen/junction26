import type { Lang } from "@/lib/sample/model";
import { LOCALES, type KitStrings } from "./strings";

export type Slot = { label: string; startsAt: number };

const HOUR = 3_600_000;
const CLINIC_TIMES: [number, number][] = [[9, 0], [10, 30], [13, 0]];

/** Two whole-hour pickup windows at least 2 h ahead between 8 and 21, else tomorrow 8–9 and 10–11. "Now (demo)" is added by the caller. */
export function pickupWindows(now: number, t: KitStrings): Slot[] {
  const first = new Date(Math.ceil((now + 2 * HOUR) / HOUR) * HOUR);
  const todayStart = new Date(now);
  todayStart.setHours(8, 0, 0, 0);
  const base = first.getTime() < todayStart.getTime() ? todayStart : first;
  const sameDay = base.getDate() === new Date(now).getDate();
  const starts = sameDay && base.getHours() <= 18
    ? [base.getTime(), base.getTime() + 2 * HOUR]
    : [8, 10].map((h) => {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        d.setHours(h, 0, 0, 0);
        return d.getTime();
      });
  return starts.map((startsAt) => {
    const d = new Date(startsAt);
    const day = d.getDate() === new Date(now).getDate() ? t.today : t.tomorrow;
    return { label: `${day} ${d.getHours()}–${d.getHours() + 1}`, startsAt };
  });
}

/** Three upcoming weekday times (9:00, 10:30, 13:00), starting `fromDays` days out. */
export function weekdaySlots(now: number, lang: Lang, fromDays: number): Slot[] {
  const fmt = new Intl.DateTimeFormat(LOCALES[lang], { weekday: "short", day: "numeric", month: "short" });
  const out: Slot[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + fromDays - 1);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const [h, m] = CLINIC_TIMES[out.length];
    const at = new Date(d);
    at.setHours(h, m, 0, 0);
    out.push({ label: `${fmt.format(d)} ${h}:${String(m).padStart(2, "0")}`, startsAt: at.getTime() });
  }
  return out;
}

export function hhmm(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
