/** Robot pickup windows: one hour each, 8:00 to 20:00, today and tomorrow only (the sample must be sent within a day). */
export const FIRST_HOUR = 8;
export const LAST_HOUR = 20;

export type Window = { day: 0 | 1; start: number; end: number; at: number };

/** Hour windows for today (day 0, from the hour now under way: at 18:28 the first is 18–19) or tomorrow (day 1), in local time. */
export function pickupWindows(now: number, day: 0 | 1): Window[] {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + day);
  const out: Window[] = [];
  for (let h = FIRST_HOUR; h < LAST_HOUR; h++) {
    const at = new Date(base);
    at.setHours(h);
    const end = at.getTime() + 3_600_000;
    if (end > now) out.push({ day, start: h, end: h + 1, at: at.getTime() });
  }
  return out;
}
