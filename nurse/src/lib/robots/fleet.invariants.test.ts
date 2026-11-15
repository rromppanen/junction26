import { describe, expect, it } from "vitest";
import { addEvent, type Sample, type SampleEvent } from "@/lib/sample/model";
import { seedSamples } from "@/lib/sample/seed";
import { fleetAt, simStep, tripsOf } from "./fleet";

const T0 = 1_800_000_000_000;

/**
 * Replays the household simulation second by second, as the one page holding the simulation lease
 * runs it, with a phone booking part-way, and collects every break of what the map promises:
 * a run keeps its robot, a robot has one run at a time, a robot that has set off stays on the map
 * until it is back, and no sample is booked twice. (With two simulators every one of these broke:
 * that is why only the lease holder simulates.)
 */
function replay(minutes: number, phoneAt: number): string[] {
  let samples: Sample[] = seedSamples(T0);
  const add = (id: string, e: SampleEvent) => (samples = addEvent(samples, id, e));
  const problems = new Set<string>();
  const robotOfRun = new Map<string, string>();
  for (let t = T0; t < T0 + minutes * 60_000; t += 1000) {
    if (t === T0 + phoneAt) {
      add("me", { type: "sampleTaken", at: t - 500 });
      add("me", { type: "pickupBooked", at: t, travelMs: 15_000 });
      add("me", { type: "robotDispatched", at: t });
    }
    if (t === T0 + phoneAt + 40_000) add("me", { type: "pickedUp", at: t });
    for (const a of simStep(samples, t, "me", "Now", 20)) add(a.sampleId, { at: t, ...a.event } as SampleEvent);

    const trips = tripsOf(samples);
    const onMap = new Set(fleetAt(trips, t).flatMap((v) => (v.status.kind === "idle" ? [] : [v.status.trip.run])));
    const runs = new Map<string, typeof trips>();
    for (const tr of trips) runs.set(tr.run, [...(runs.get(tr.run) ?? []), tr]);
    const busy = new Map<string, number>();
    for (const [id, stops] of runs) {
      const first = stops.find((s) => s.compartment === 1) ?? stops[0];
      const was = robotOfRun.get(id);
      if (was && was !== first.robotId) problems.add(`run ${id} changed robot`);
      robotOfRun.set(id, first.robotId);
      const back = stops.find((s) => s.last)?.backAt ?? Infinity;
      if (!(first.bookedAt <= t && t < back)) continue;
      busy.set(first.robotId, (busy.get(first.robotId) ?? 0) + 1);
      if (!onMap.has(id)) problems.add(`run ${id} out but not on the map`);
    }
    for (const [robot, n] of busy) if (n > 1) problems.add(`robot ${robot} on ${n} runs`);
    for (const s of samples) if (s.events.filter((e) => e.type === "pickupBooked").length > 1) problems.add(`sample ${s.id} booked twice`);
  }
  return [...problems];
}

describe("one simulator keeps the robots consistent", () => {
  it("over 12 minutes at 20× speed, with a phone booking", () => {
    expect(replay(12, 45_000)).toEqual([]);
  });
});
