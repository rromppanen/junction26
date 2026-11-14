"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stageOf } from "@/lib/sample/model";
import { useSamples } from "@/lib/sample/store";

const ME = "me";
const ROBOT_TIMEOUT_MS = 40_000;

class Cancelled extends Error {}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Cancelled());
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Cancelled());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function colonoscopySlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const wd = d.toLocaleDateString("en-GB", { weekday: "short" });
  const day = d.toLocaleDateString("en-GB", { day: "numeric" });
  const mon = d.toLocaleDateString("en-GB", { month: "short" });
  return `${wd} ${day} ${mon} 9:00`;
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
}

export function Autopilot() {
  const { samples, add, reset } = useSamples();
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [caption, setCaption] = useState("");

  const samplesRef = useRef(samples);
  samplesRef.current = samples;
  const addRef = useRef(add);
  addRef.current = add;
  const resetRef = useRef(reset);
  resetRef.current = reset;
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    runningRef.current = false;
    setRunning(false);
    setCaption("");
  }, []);

  const play = useCallback(async () => {
    if (runningRef.current) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;
    abortRef.current = ctrl;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);

    const waitRobot = async () => {
      const start = Date.now();
      for (;;) {
        const me = samplesRef.current.find((s) => s.id === ME);
        if (me && stageOf(me, Date.now()) === "robotAtDoor") return;
        if (Date.now() - start > ROBOT_TIMEOUT_MS) throw new Error("robot timeout");
        await sleep(250, signal);
      }
    };

    try {
      setCaption("Resetting the demo");
      resetRef.current();
      await sleep(2000, signal);
      setCaption("Aino opens her kit");
      addRef.current(ME, { type: "kitOpened" });
      await sleep(3000, signal);
      setCaption("Aino takes the sample at home");
      addRef.current(ME, { type: "sampleTaken" });
      await sleep(3000, signal);
      setCaption("Aino books a robot pickup");
      addRef.current(ME, { type: "pickupBooked", slot: "Now (demo)" });
      setCaption("The robot is on its way");
      await waitRobot();
      await sleep(2000, signal);
      setCaption("Aino puts the sample in the robot");
      addRef.current(ME, { type: "pickedUp" });
      await sleep(4000, signal);
      setCaption("The lab finds blood: the nurse sees it at once");
      addRef.current(ME, { type: "resultPositive", note: "Lab result (demo)" });
      await sleep(4000, signal);
      setCaption("Aino books a colonoscopy with an interpreter");
      addRef.current(ME, { type: "colonoscopyBooked", slot: colonoscopySlot(), note: "Interpreter needed" });
      await sleep(3000, signal);
      setCaption("Done: every step visible to Aino and the nurse");
      setFinished(true);
    } catch (err) {
      if (!(err instanceof Cancelled)) setCaption("");
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        runningRef.current = false;
        setRunning(false);
      }
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest("button, a, summary")) return;
      e.preventDefault();
      if (!runningRef.current) void play();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      {running ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rule bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-soft"
        >
          Stop
        </button>
      ) : (
        <button type="button" onClick={() => void play()} className="primary-action">
          {finished ? "Play again" : "Play the story"}
        </button>
      )}
      <p aria-live="polite" className="min-h-6 text-sm font-medium text-ink">
        {caption}
      </p>
    </div>
  );
}
