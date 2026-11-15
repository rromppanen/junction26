"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { addEvent, type Sample, type SampleEvent } from "./model";
import { seedSamples } from "./seed";
import { applyEntry, buildSamples, MAX_ENTRIES_PER_POST, RESTART, type LogEntry, type LogPage } from "./sync-core";

// v4: Helsinki-area demo data, half Finnish or Swedish speakers. A new key makes open browsers reseed instead of keeping the old people.
const KEY = "farmagusta.demo.v4";
const CHANNEL = "farmagusta-demo";

const EMPTY: Sample[] = [];
let cache: { raw: string | null; samples: Sample[] } | null = null;
let memory: Sample[] | null = null; // used when storage is blocked
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let wired = false;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeRaw(raw: string): void {
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* blocked: memory fallback holds the state */
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function persist(samples: Sample[]) {
  const raw = JSON.stringify(samples);
  memory = samples;
  cache = { raw, samples };
  writeRaw(raw);
  try {
    channel?.postMessage("changed");
  } catch {
    /* ignore */
  }
  notify();
}

function parse(raw: string): Sample[] | null {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Sample[]) : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Sample[] {
  const raw = readRaw();
  if (raw !== null) {
    if (cache && cache.raw === raw) return cache.samples;
    const parsed = parse(raw);
    if (parsed) {
      cache = { raw, samples: parsed };
      memory = parsed;
      return parsed;
    }
  }
  // Nothing (valid) stored: use the in-memory copy, or seed.
  if (!memory) {
    memory = seedSamples(Date.now());
    const seeded = JSON.stringify(memory);
    cache = { raw: seeded, samples: memory };
    writeRaw(seeded);
  }
  return memory;
}

function getServerSnapshot(): Sample[] {
  return EMPTY;
}

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => notify();
  } catch {
    channel = null;
  }
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === KEY) notify();
  });
  void poll();
  setInterval(() => void poll(), POLL_MS);
}

// --- Shared log across devices (see sync-core.ts and web/src/app/api/samples) ---
// Every browser polls the server's event log and rebuilds the same state from it, so a phone and
// a laptop see each other's actions. Without the API (e.g. the nurse app on its own port) the
// first poll gets a 404 and the store stays local-only, synced between tabs as before.
const SYNC_URL = "/api/samples";
const POLL_MS = 1500;
let mode: "unknown" | "server" | "local" = "unknown";
let server: { seedAt: number; entries: LogEntry[] } | null = null;
let pending: LogEntry[] = []; // written here, not yet seen in the server log
const sent = new Set<string>();
let polling = false;
let flushing = false;

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function rebuild() {
  if (!server) return;
  const seen = new Set(server.entries.map((e) => e.uid));
  pending = pending.filter((p) => !seen.has(p.uid));
  persist(buildSamples(server.seedAt, [...server.entries, ...pending]));
}

async function poll(): Promise<void> {
  if (polling || mode === "local" || (typeof document !== "undefined" && document.hidden && mode === "server")) return;
  polling = true;
  try {
    const since = server?.entries.length ?? 0;
    const res = await fetch(`${SYNC_URL}?since=${since}&seedAt=${server?.seedAt ?? ""}`, { cache: "no-store" });
    if (res.status === 404) {
      mode = "local";
      return;
    }
    if (!res.ok) return;
    const page = (await res.json()) as LogPage;
    if (typeof page?.seedAt !== "number" || !Array.isArray(page.entries)) return;
    mode = "server";
    if (!server || server.seedAt !== page.seedAt) {
      if (server) {
        pending = []; // written against a log that has since been reset
        sent.clear();
      }
      server = { seedAt: page.seedAt, entries: page.entries };
    } else if (page.entries.length > 0 || page.from < server.entries.length) {
      server = { seedAt: server.seedAt, entries: [...server.entries.slice(0, page.from), ...page.entries] };
    } else {
      void flush();
      return;
    }
    rebuild();
    void flush();
  } catch {
    /* offline or not deployed with the API: retry on the next tick */
  } finally {
    polling = false;
  }
}

async function flush(): Promise<void> {
  if (flushing || mode !== "server" || !server) return;
  const batch = pending.filter((p) => !sent.has(p.uid)).slice(0, MAX_ENTRIES_PER_POST);
  if (batch.length === 0) return;
  flushing = true;
  try {
    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedAt: server.seedAt, entries: batch }),
    });
    if (!res.ok) return; // retried on the next poll
    const { status } = (await res.json()) as { status?: string };
    if (status === "ok") batch.forEach((b) => sent.add(b.uid));
    else pending = pending.filter((p) => !batch.includes(p)); // stale or full: drop
  } catch {
    /* retried on the next poll */
  } finally {
    flushing = false;
  }
  void poll();
}

/** Queues events for the shared log; the local state already has them. */
function share(entries: Omit<LogEntry, "uid">[]) {
  if (mode === "local") return;
  pending.push(...entries.map((e) => ({ ...e, uid: uid() })));
  void flush();
}

async function resetShared(): Promise<boolean> {
  if (mode !== "server") return false;
  try {
    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    if (!res.ok) return false;
    const { seedAt } = (await res.json()) as { seedAt?: number };
    if (typeof seedAt !== "number") return false;
    server = { seedAt, entries: [] };
    pending = [];
    sent.clear();
    rebuild();
    return true;
  } catch {
    return false;
  }
}

function subscribe(cb: () => void): () => void {
  wire();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSamples(): {
  samples: Sample[];
  now: number;
  /** `at` defaults to now; a scheduled pickup dispatches its robot at the window's start. */
  add(id: string, e: Omit<SampleEvent, "at"> & { at?: number }): void;
  /** Starts the whole shared demo again, for everyone. */
  reset(): void;
  /** Starts one person again (the phone app's own person) and leaves everyone else as they are. */
  restart(id: string): void;
} {
  const samples = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const add = useCallback((id: string, e: Omit<SampleEvent, "at"> & { at?: number }) => {
    const at = e.at ?? Date.now();
    const events: SampleEvent[] = [{ ...e, at }];
    if (e.type === "pickedUp") events.push({ type: "atLab", at: at + 1 });
    persist(events.reduce((acc, ev) => addEvent(acc, id, ev), getSnapshot()));
    share(events.map((event) => ({ id, event })));
  }, []);

  const reset = useCallback(() => {
    void resetShared().then((ok) => {
      if (!ok) persist(seedSamples(Date.now()));
    });
  }, []);

  const restart = useCallback((id: string) => {
    const entry = { id, event: { type: RESTART, at: Date.now() } } as const;
    persist(applyEntry(getSnapshot(), entry));
    share([entry]);
  }, []);

  return { samples, now, add, reset, restart };
}
