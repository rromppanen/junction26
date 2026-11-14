import { describe, expect, it } from "vitest";
import { parseCSV } from "./csv";
import { suggestMapping, validateMapping, type Mapping } from "./fields";
import { personalDataHeaders } from "./privacy";
import { PUBLIC_DATASETS } from "./setup";

describe("parseCSV", () => {
  it("handles BOM, semicolons and quoted commas", () => {
    const t = parseCSV('﻿vuosi;alue;kutsutut\r\n2024;"Pirkanmaa, etelä";100\r\n');
    expect(t.headers).toEqual(["vuosi", "alue", "kutsutut"]);
    expect(t.rows).toEqual([["2024", "Pirkanmaa, etelä", "100"]]);
  });
  it("enforces limits and header rules", () => {
    expect(() => parseCSV("a\n" + "x".repeat(1_000_001))).toThrow();
    const wide = Array.from({ length: 31 }, (_, i) => `h${i}`);
    expect(() => parseCSV(wide.join(",") + "\n" + wide.map(() => "1").join(","))).toThrow();
    expect(() => parseCSV("a\n" + Array.from({ length: 5001 }, () => "1").join("\n"))).toThrow();
    expect(() => parseCSV("a,a\n1,2")).toThrow();
    expect(() => parseCSV("a,b\n1")).toThrow();
  });
});

describe("suggestMapping", () => {
  it("maps Finnish headers and ignores unknown", () => {
    const m = suggestMapping(["vuosi", "kutsutut", "osallistuneet", "foo"]);
    expect(m).toEqual({ vuosi: "year", kutsutut: "invited", osallistuneet: "attended", foo: "ignore" });
  });
});

describe("validateMapping", () => {
  const good: Mapping = { y: "year", i: "invited", a: "attended" };
  const t = (rows: string[][]) => ({ headers: ["y", "i", "a"], rows });
  it("accepts valid data", () => expect(validateMapping(t([["2024", "10", "5"]]), good)).toEqual([]));
  it("catches missing required", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { y: "year", i: "invited", a: "ignore" }).length).toBeGreaterThan(0);
  });
  it("catches duplicate field", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { y: "year", i: "invited", a: "invited" }).length).toBeGreaterThan(0);
  });
  it("catches non-integer count", () => {
    expect(validateMapping(t([["2024", "10", "5.5"]]), good).length).toBeGreaterThan(0);
  });
  it("catches attended > invited and bad year", () => {
    expect(validateMapping(t([["2024", "10", "11"]]), good).length).toBeGreaterThan(0);
    expect(validateMapping(t([["1999", "10", "5"]]), good).length).toBeGreaterThan(0);
  });
  it("checks examined <= positive <= attended", () => {
    const h = { headers: ["y", "i", "a", "p", "e"], rows: [["2024", "10", "5", "2", "3"]] };
    expect(validateMapping(h, { y: "year", i: "invited", a: "attended", p: "positive", e: "examined" }).length).toBeGreaterThan(0);
  });
});

describe("personalDataHeaders", () => {
  it("flags personal headers only", () => {
    expect(personalDataHeaders(["henkilötunnus", "Name", "syntymäaika", "kunta", "alue", "Sähköposti"]))
      .toEqual(["henkilötunnus", "Name", "syntymäaika", "Sähköposti"]);
  });
});

describe("PUBLIC_DATASETS", () => {
  it("lists four datasets", () => expect(PUBLIC_DATASETS).toHaveLength(4));
});
