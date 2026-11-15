"use client";

import { useEffect, useState } from "react";

/**
 * Whether this page may run the household simulation. Only one open robots page may, on any device:
 * two would write the same bookings twice, and robots would jump between runs, vanish and reappear.
 * The page claims a lease from the shared demo log (/api/samples) and renews it every RENEW_MS; it
 * counts as held for TRUST_MS after each answer, a little less than the server keeps it (6 s), so two
 * pages never both simulate. Without the shared log (the nurse app on its own port) the page always
 * simulates, as before.
 */
const RENEW_MS = 2_000;
const TRUST_MS = 4_000;

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

async function post(body: object): Promise<Response> {
  return fetch("/api/samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

export function useSimLease(enabled: boolean): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHeld(false);
      return;
    }
    const id = newId();
    let validUntil = 0;
    let alive = true;
    const refresh = () => alive && setHeld(Date.now() < validUntil);

    async function claim() {
      try {
        const res = await post({ lease: id });
        if (res.status === 404) validUntil = Infinity; // no shared log: this page is the only one
        else if (res.ok) {
          const { holder } = (await res.json()) as { holder?: string };
          validUntil = holder === id ? Date.now() + TRUST_MS : 0;
        }
      } catch {
        /* offline: the lease runs out by itself */
      }
      refresh();
    }

    void claim();
    const renew = setInterval(() => void claim(), RENEW_MS);
    const tick = setInterval(refresh, 500);
    return () => {
      alive = false;
      clearInterval(renew);
      clearInterval(tick);
      // Let another page take over now rather than after the lease runs out.
      if (Number.isFinite(validUntil) && validUntil > Date.now()) void post({ lease: id, release: true }).catch(() => {});
    };
  }, [enabled]);

  return held;
}
