"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { addEvent, type InviteEvent, type Invitee } from "./model";
import { seedInvitees } from "./seed";

/**
 * The invitation round shared by the phone and the board: localStorage plus a BroadcastChannel, so a change in one
 * tab or iframe shows in the other at once. Same pattern as lib/sample/store.ts, with its own key.
 */
const KEY = "invite.demo.v1";
const CHANNEL = "invite-demo";

const EMPTY: Invitee[] = [];
let cache: { raw: string | null; list: Invitee[] } | null = null;
let memory: Invitee[] | null = null;
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

function writeRaw(raw: string) {
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* blocked: memory holds the state */
  }
}

function persist(list: Invitee[]) {
  const raw = JSON.stringify(list);
  memory = list;
  cache = { raw, list };
  writeRaw(raw);
  try {
    channel?.postMessage("changed");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function getSnapshot(): Invitee[] {
  const raw = readRaw();
  if (raw !== null) {
    if (cache && cache.raw === raw) return cache.list;
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) {
        cache = { raw, list: v as Invitee[] };
        memory = cache.list;
        return cache.list;
      }
    } catch {
      /* fall through to seed */
    }
  }
  if (!memory) {
    memory = seedInvitees(Date.now());
    const raw2 = JSON.stringify(memory);
    cache = { raw: raw2, list: memory };
    writeRaw(raw2);
  }
  return memory;
}

function subscribe(cb: () => void) {
  if (!wired && typeof window !== "undefined") {
    wired = true;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = () => listeners.forEach((l) => l());
    } catch {
      channel = null;
    }
    window.addEventListener("storage", (e) => {
      if (e.key === null || e.key === KEY) listeners.forEach((l) => l());
    });
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useInvitees() {
  const list = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const add = useCallback((id: string, e: Omit<InviteEvent, "at">) => {
    persist(addEvent(getSnapshot(), id, { ...e, at: Date.now() }));
  }, []);

  const addMany = useCallback((items: { id: string; e: Omit<InviteEvent, "at"> }[]) => {
    const at = Date.now();
    persist(items.reduce((acc, { id, e }) => addEvent(acc, id, { ...e, at }), getSnapshot()));
  }, []);

  const reset = useCallback(() => persist(seedInvitees(Date.now())), []);

  return { list, now, add, addMany, reset };
}
