import { addEvent, type Sample, type SampleEvent } from "./model";
import { seedSamples } from "./seed";

/**
 * Shared demo state, kept as an append-only log so that the phone, the nurse board and the
 * robot simulation can all write at once without overwriting each other.
 * The state is always `seedSamples(seedAt)` with the log's entries applied in order.
 * A reset starts a new log with a new `seedAt`; a RESTART entry starts one person again.
 *
 * Keep this file identical in web/ and nurse/.
 */

/**
 * Log-only event: puts one person back to their seed state, timed from `at`. The phone app writes
 * it to start its person again without wiping everyone else's progress on the shared demo.
 */
export const RESTART = "restarted";
export type LogEvent = SampleEvent | { type: typeof RESTART; at: number };
export type LogEntry = { uid: string; id: string; event: LogEvent };

/** What GET /api/samples returns: the entries from index `from` onwards. */
export type LogPage = { seedAt: number; from: number; entries: LogEntry[]; durable: boolean };

export const MAX_ENTRIES_PER_POST = 50;
export const MAX_LOG_LENGTH = 20_000;

export function applyEntry(samples: Sample[], e: Omit<LogEntry, "uid">): Sample[] {
  if (e.event.type === RESTART) {
    const fresh = seedSamples(e.event.at).find((s) => s.id === e.id);
    return fresh ? samples.map((s) => (s.id === e.id ? fresh : s)) : samples;
  }
  return addEvent(samples, e.id, e.event);
}

export function buildSamples(seedAt: number, entries: readonly LogEntry[]): Sample[] {
  let samples = seedSamples(seedAt);
  for (const e of entries) samples = applyEntry(samples, e);
  return samples;
}

function isEvent(v: unknown): v is SampleEvent {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return typeof e.type === "string" && e.type.length <= 40 && typeof e.at === "number" && Number.isFinite(e.at);
}

/** Parses untrusted entries; null if any entry is malformed or the batch is too large. */
export function parseEntries(v: unknown): LogEntry[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_ENTRIES_PER_POST) return null;
  const out: LogEntry[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.uid !== "string" || r.uid.length === 0 || r.uid.length > 64) return null;
    if (typeof r.id !== "string" || r.id.length === 0 || r.id.length > 64) return null;
    if (!isEvent(r.event) || JSON.stringify(r.event).length > 1_000) return null;
    out.push({ uid: r.uid, id: r.id, event: r.event });
  }
  return out;
}
