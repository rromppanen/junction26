import { describe, expect, it } from "vitest";
import { BARRIERS, classifyReply } from "./barrier";
import { hasRequiredPlaceholders, templateOutreach } from "./message";
import { DEMO_PATIENTS, isResolved, sortWorklist } from "./patients";

describe("classifyReply", () => {
  it.each([
    ["I can't get time off work", "time_off"],
    ["En pääse töistä", "time_off"],
    ["I'm scared it will hurt", "fear"],
    ["Pelottaa", "fear"],
    ["I had it done at occupational health already", "already_examined"],
    ["Kävin jo työterveydessä", "already_examined"],
    ["I have no car and the bus is far", "transport"],
    ["What does this mean?", "not_understood"],
    ["Kyllä", "agreed"],
    ["yes please book", "agreed"],
    ["Please call me", "wants_call"],
    ["", "unknown"],
    ["hmm", "unknown"],
  ])("%s -> %s", (text, kind) => {
    expect(classifyReply(text).kind).toBe(kind);
  });

  it("does not read 'book' inside other words as agreement", () => {
    expect(classifyReply("facebook").kind).toBe("unknown");
  });
});

describe("closing rules", () => {
  it("no barrier action closes a case: examination needs its own confirmation", () => {
    for (const b of Object.values(BARRIERS)) {
      expect(["examined", "examined_elsewhere"]).not.toContain(b.nextStatus);
    }
  });

  it("a booked case stays open", () => {
    expect(isResolved({ ...DEMO_PATIENTS[0], status: "booked" })).toBe(false);
  });
});

describe("worklist", () => {
  it("puts resolved patients last and overdue ones first", () => {
    const list = sortWorklist(DEMO_PATIENTS);
    expect(isResolved(list[list.length - 1])).toBe(true);
    expect(list[0].daysSincePositive).toBeGreaterThanOrEqual(14);
  });
});

describe("templateOutreach", () => {
  it("keeps the phone placeholder in every template", () => {
    for (const p of DEMO_PATIENTS) expect(hasRequiredPlaceholders(templateOutreach(p).sms)).toBe(true);
  });

  it("offers an interpreter when there is no checked template for the language", () => {
    const ahmed = DEMO_PATIENTS.find((p) => p.language === "ar")!;
    expect(templateOutreach(ahmed).sms).toMatch(/interpreter in Arabic/);
  });
});
