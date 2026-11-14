import { describe, expect, it } from "vitest";
import { KIT_LANGS, ROBOT_ANIMS, STEP_ANIMS, TEST_KINDS, TEXT } from "./content";

describe("kit text", () => {
  it("has a file for every language in the picker", () => {
    expect(Object.keys(TEXT).sort()).toEqual(KIT_LANGS.map((l) => l.code).sort());
  });
  for (const { code } of KIT_LANGS) {
    it(`${code}: one step text per animation, for every test and the robot`, () => {
      for (const kind of TEST_KINDS) {
        expect(TEXT[code].tests[kind].steps).toHaveLength(STEP_ANIMS[kind].length);
      }
      expect(TEXT[code].robot).toHaveLength(ROBOT_ANIMS.length);
    });
    it(`${code}: no empty strings`, () => {
      const strings: string[] = [];
      const walk = (v: unknown) => {
        if (typeof v === "string") strings.push(v);
        else if (v && typeof v === "object") Object.values(v).forEach(walk);
      };
      walk(TEXT[code]);
      expect(strings.filter((s) => s.trim() === "")).toEqual([]);
    });
  }
});
