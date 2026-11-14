"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { addEvent, type Sample, type SampleEvent } from "./model";
import { seedSamples } from "./seed";

// v3: larger Helsinki-area demo data. A new key makes open browsers reseed instead of keeping the old people.
const KEY = "lapi.demo.v3";
const CHANNEL = "lapi-demo";

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
  add(id: string, e: Omit<SampleEvent, "at">): void;
  reset(): void;
} {
  const samples = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const add = useCallback((id: string, e: Omit<SampleEvent, "at">) => {
    const at = Date.now();
    // Unlike web/, a pickup does not register the sample at the lab by itself:
    // the nurse does that once the robot is back (the "awaitingIntake" flag).
    persist(addEvent(getSnapshot(), id, { ...e, at }));
  }, []);

  const reset = useCallback(() => {
    persist(seedSamples(Date.now()));
  }, []);

  return { samples, now, add, reset };
}
