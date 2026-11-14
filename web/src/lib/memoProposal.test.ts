import { describe, expect, it } from "vitest";
import { parseProposal } from "@/components/MemoProposal";

describe("parseProposal", () => {
  it("reads the option, target and the costs that option uses", () => {
    expect(parseProposal({ option: "service", target: "82.9", col: "614", contact: "100", reminder: "5", test: "" })).toEqual({
      option: "service", target: 82.9, costs: { perColonoscopy: 614, perContact: 100, perTest: null },
    });
    expect(parseProposal({ option: "access", target: "80", col: "614", contact: "100", reminder: "5" })?.costs.perContact).toBe(5);
  });
  it("ignores a missing or malformed proposal", () => {
    expect(parseProposal({})).toBeNull();
    expect(parseProposal({ option: "other", target: "80" })).toBeNull();
    expect(parseProposal({ option: "service", target: "abc" })).toBeNull();
    expect(parseProposal({ option: "service", target: "180" })).toBeNull();
  });
  it("treats negative or non-numeric costs as not entered", () => {
    expect(parseProposal({ option: "service", target: "80", col: "-5", contact: "x" })?.costs).toEqual({ perColonoscopy: null, perContact: null, perTest: null });
  });
});
