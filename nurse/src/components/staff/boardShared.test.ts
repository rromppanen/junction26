import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { seedSamples } from "@/lib/sample/seed";
import { addEvent, stageOf } from "@/lib/sample/model";
import { EVENT_LABEL } from "./boardShared";

// The phone app (web/) writes events into the same shared log. Every type it can write needs a
// label here, or the board shows a blank "Latest:" line and blank history rows.
function webEventTypes(): string[] {
  const src = readFileSync(path.resolve(__dirname, "../../../../web/src/lib/sample/model.ts"), "utf8");
  const union = src.match(/export type EventType =([\s\S]*?);/)?.[1] ?? "";
  return [...union.matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);
}

describe("EVENT_LABEL", () => {
  it("labels every event type the phone app writes", () => {
    const types = webEventTypes();
    expect(types).toContain("robotDispatched");
    for (const t of types) expect(EVENT_LABEL[t as keyof typeof EVENT_LABEL], t).toBeTruthy();
  });

  it("keeps the stage from the booking when the phone adds robotDispatched", () => {
    const now = 1_800_000_000_000;
    const booked = addEvent(seedSamples(now), "me", { type: "pickupBooked", at: now });
    const dispatched = addEvent(booked, "me", { type: "robotDispatched", at: now + 1 });
    const me = (xs: typeof booked) => xs.find((s) => s.id === "me")!;
    expect(stageOf(me(dispatched), now + 2)).toBe(stageOf(me(booked), now + 2));
  });
});
