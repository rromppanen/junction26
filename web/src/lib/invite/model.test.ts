import { describe, expect, it } from "vitest";
import { addEvent, isOverdue, slotsAfter, statusOf, summarize, type Invitee } from "./model";
import { ME, seedInvitees } from "./seed";

const NOW = new Date("2026-11-16T09:00:00").getTime();
const DAY = 86_400_000;

const woman = (events: Invitee["events"], lang: Invitee["person"]["lang"] = "fi"): Invitee => ({
  id: "x",
  person: { id: "x", name: "Test", age: 55, district: "Kontula", lang },
  events,
});

describe("statusOf", () => {
  it("starts booked at the time in the letter", () => {
    const s = statusOf(woman([{ type: "invited", at: 0, slot: NOW + DAY }]));
    expect(s).toMatchObject({ stage: "booked", appointment: NOW + DAY, attempt: 1 });
  });

  it("follows a miss, a second booked time and a call", () => {
    const ev: Invitee["events"] = [
      { type: "invited", at: 1, slot: 10 },
      { type: "missed", at: 11 },
      { type: "secondBooked", at: 12, slot: 20 },
      { type: "missed", at: 21 },
      { type: "callQueued", at: 22 },
      { type: "called", at: 23, outcome: "noAnswer" },
    ];
    expect(statusOf(woman(ev))).toMatchObject({ stage: "call", noAnswer: 1, attempt: 2 });
    const booked = statusOf(woman([...ev, { type: "called", at: 24, outcome: "booked", slot: 40 }]));
    expect(booked).toMatchObject({ stage: "booked", appointment: 40, attempt: 3, confirmed: true });
  });

  it("sends a woman not found in Kanta back to the missed list", () => {
    const s = statusOf(woman([
      { type: "invited", at: 1, slot: 10 },
      { type: "elsewhereReported", at: 2 },
      { type: "elsewhereNotFound", at: 3 },
    ]));
    expect(s.stage).toBe("missed");
  });

  it("reads events in time order, whatever order they were stored in", () => {
    const s = statusOf(woman([{ type: "attended", at: 20 }, { type: "invited", at: 1, slot: 10 }]));
    expect(s.stage).toBe("attended");
  });
});

describe("isOverdue", () => {
  it("flags a booked time that passed without a mark", () => {
    expect(isOverdue(woman([{ type: "invited", at: 0, slot: NOW - DAY }]), NOW)).toBe(true);
    expect(isOverdue(woman([{ type: "invited", at: 0, slot: NOW + DAY }]), NOW)).toBe(false);
  });
});

describe("seedInvitees and summarize", () => {
  it("is the same on every run", () => {
    expect(seedInvitees(NOW)).toEqual(seedInvitees(NOW));
  });

  it("puts the demo woman first, booked in the future, in Arabic", () => {
    const [me] = seedInvitees(NOW);
    expect(me.id).toBe(ME);
    expect(me.person.lang).toBe("ar");
    expect(statusOf(me).appointment!).toBeGreaterThan(NOW);
  });

  it("gives a plausible round: a gap between language groups and work to do", () => {
    const sum = summarize(seedInvitees(NOW), NOW);
    expect(sum.invited).toBe(73);
    expect(sum.due).toBeGreaterThan(20);
    expect(sum.upcoming).toBeGreaterThan(5);
    expect(sum.attendance!).toBeGreaterThan(0.5);
    expect(sum.attendance!).toBeLessThan(0.95);
    expect(sum.needsAction.missed + sum.needsAction.call).toBeGreaterThan(0);
    expect(sum.layers.sms).toBeGreaterThan(0);
  });

  it("counts a woman screened after a second booked time as brought back", () => {
    let list = [woman([{ type: "invited", at: 1, slot: NOW - 20 * DAY }])];
    list = addEvent(list, "x", { type: "missed", at: NOW - 19 * DAY });
    list = addEvent(list, "x", { type: "secondBooked", at: NOW - 18 * DAY, slot: NOW - DAY });
    list = addEvent(list, "x", { type: "attended", at: NOW - DAY + 1 });
    const sum = summarize(list, NOW);
    expect(sum.broughtBack).toBe(1);
    expect(sum.attendance).toBe(1);
  });
});

describe("slotsAfter", () => {
  it("skips weekends", () => {
    for (const s of slotsAfter(NOW, 10)) {
      const d = new Date(s).getDay();
      expect(d === 0 || d === 6).toBe(false);
    }
  });
});
