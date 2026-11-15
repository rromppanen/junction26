import { expect, it } from "vitest";
import { fleetAt, householdToRecycle, readyForPickup, simStep, tripsOf } from "@/lib/robots/fleet";
import { seedSamples } from "@/lib/sample/seed";
import { addEvent, type Sample } from "@/lib/sample/model";

it("keeps robots on the road for half an hour, without flooding the map", () => {
  const T0 = 1_800_000_000_000;
  let samples: Sample[] = seedSamples(T0);
  const out: number[] = [];
  for (let now = T0; now < T0 + 30 * 60_000; now += 1000) {
    for (const a of simStep(samples, now, "me", "Now", 20)) samples = addEvent(samples, a.sampleId, { ...a.event, at: a.event.type === "pickedUp" ? now : (a.event as { at?: number }).at ?? now } as never);
    const again = householdToRecycle(samples, now, "me");
    if (again) samples = samples.map((s) => (s.id === again ? seedSamples(now).find((x) => x.id === again)! : s));
    if ((now - T0) % 60_000 === 0) out.push(fleetAt(tripsOf(samples), now).filter((v) => v.status.kind !== "idle").length);
  }
  expect(Math.min(...out.slice(5))).toBeGreaterThan(3);
});
