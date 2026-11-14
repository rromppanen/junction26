import { describe, expect, it } from "vitest";
import { addEvent } from "./model";
import { seedSamples } from "./seed";
import { buildSamples, MAX_ENTRIES_PER_POST, parseEntries, RESTART, type LogEntry } from "./sync-core";

const seedAt = 1_800_000_000_000;

describe("buildSamples", () => {
  it("is the seed when the log is empty", () => {
    expect(buildSamples(seedAt, [])).toEqual(seedSamples(seedAt));
  });

  it("applies entries in order, the same on every device", () => {
    const id = seedSamples(seedAt)[0].id;
    const log: LogEntry[] = [
      { uid: "a", id, event: { type: "sampleTaken", at: seedAt + 1 } },
      { uid: "b", id, event: { type: "pickupBooked", at: seedAt + 2 } },
    ];
    const expected = addEvent(addEvent(seedSamples(seedAt), id, log[0].event), id, log[1].event);
    expect(buildSamples(seedAt, log)).toEqual(expected);
  });

  it("restarts only the named person, from the restart time", () => {
    const later = seedAt + 3_600_000;
    const log: LogEntry[] = [
      { uid: "a", id: "me", event: { type: "sampleTaken", at: seedAt + 1 } },
      { uid: "b", id: "p12", event: { type: "reminderSent", at: seedAt + 2 } },
      { uid: "c", id: "me", event: { type: RESTART, at: later } },
    ];
    const out = buildSamples(seedAt, log);
    expect(out.find((s) => s.id === "me")).toEqual(seedSamples(later).find((s) => s.id === "me"));
    expect(out.find((s) => s.id === "p12")?.events.at(-1)?.type).toBe("reminderSent");
  });

  it("keeps events written after a restart", () => {
    const log: LogEntry[] = [
      { uid: "a", id: "me", event: { type: RESTART, at: seedAt + 10 } },
      { uid: "b", id: "me", event: { type: "kitOpened", at: seedAt + 20 } },
    ];
    const me = buildSamples(seedAt, log).find((s) => s.id === "me");
    expect(me?.events.map((e) => e.type)).toEqual(["invited", "kitOpened"]);
  });

  it("ignores entries for unknown people", () => {
    const log: LogEntry[] = [{ uid: "a", id: "nobody", event: { type: "sampleTaken", at: seedAt } }];
    expect(buildSamples(seedAt, log)).toEqual(seedSamples(seedAt));
  });
});

describe("parseEntries", () => {
  const ok = { uid: "u1", id: "me", event: { type: "sampleTaken", at: 5 } };

  it("accepts well-formed entries", () => {
    expect(parseEntries([ok])).toEqual([ok]);
  });

  it.each([
    ["not an array", ok],
    ["empty", []],
    ["missing uid", [{ ...ok, uid: "" }]],
    ["bad time", [{ ...ok, event: { type: "sampleTaken", at: "now" } }]],
    ["huge event", [{ ...ok, event: { type: "sampleTaken", at: 1, note: "x".repeat(2_000) } }]],
    ["too many", Array.from({ length: MAX_ENTRIES_PER_POST + 1 }, () => ok)],
  ])("rejects %s", (_, input) => {
    expect(parseEntries(input)).toBeNull();
  });
});
