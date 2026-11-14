import { describe, expect, it } from "vitest";
import { KIT_LANGS, ROBOT_ANIMS, STEP_ANIMS, TEXT } from "./content";

describe("kit text", () => {
  it("has a file for every language in the picker", () => {
    expect(Object.keys(TEXT).sort()).toEqual(KIT_LANGS.map((l) => l.code).sort());
  });
  for (const { code } of KIT_LANGS) {
    it(`${code}: one step text per animation, for the sample and the robot`, () => {
      expect(TEXT[code].test.steps).toHaveLength(STEP_ANIMS.length);
      expect(TEXT[code].robot).toHaveLength(ROBOT_ANIMS.length);
    });
    it(`${code}: the steps carry HUS's specifics (seula.hus.fi, H-number, 2–3 strokes)`, () => {
      const all = TEXT[code].test.steps.map((s) => `${s.title} ${s.body ?? ""}`).join(" ");
      expect(all).toContain("seula.hus.fi");
      expect(all).toMatch(/\bH\b/);
      expect(all).toMatch(/2–3|۲ تا ۳/);
      expect(all.toLowerCase()).not.toContain("fimlab");
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
