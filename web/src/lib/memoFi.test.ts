import { describe, expect, it } from "vitest";
import { describeFingerprintFi, fmtFi, whatItTakesFi } from "./memoFi";

describe("memoFi", () => {
  it("formats with a decimal comma", () => {
    expect(fmtFi(74.34, "%")).toBe("74,3 %");
    expect(fmtFi(null)).toBe("–");
  });
  it("describes the fingerprint in Finnish", () => {
    const s = describeFingerprintFi({ pattern: "detection", detectionBehind: 2, detectionTotal: 3, outcomeBehind: 0, outcomeTotal: 1 });
    expect(s).toMatch(/Seulontaosallistumisessa/);
    expect(s).toMatch(/2\/3/);
  });
  it("phrases what it takes", () => {
    expect(whatItTakesFi(74.3, 80)).toEqual({ full: 57, half: 29 });
    expect(whatItTakesFi(85, 80)).toEqual({ full: 0, half: 0 });
    expect(whatItTakesFi(null, 80)).toBeNull();
  });
});
