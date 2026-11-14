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
  it("keeps a quoted ; inside a semicolon file", () => {
    expect(parseCSV('a;b\n"x;y";2').rows).toEqual([["x;y", "2"]]);
  });
  it("keeps a quoted comma inside a comma file", () => {
    expect(parseCSV('a,b\n"x,y",2').rows).toEqual([["x,y", "2"]]);
  });
  it("unescapes doubled quotes", () => {
    expect(parseCSV('a,b\n"say ""hi""",2').rows).toEqual([['say "hi"', "2"]]);
  });
  it("accepts CRLF and bare CR line endings", () => {
    expect(parseCSV("a,b\r\n1,2\r\n3,4").rows).toEqual([["1", "2"], ["3", "4"]]);
    expect(parseCSV("a,b\r1,2\r3,4").rows).toEqual([["1", "2"], ["3", "4"]]);
  });
  it("rejects over 1 MB", () => {
    expect(() => parseCSV("a\n" + "x".repeat(1_000_001))).toThrow(/under 1 MB/);
  });
  it("rejects 31 columns", () => {
    const wide = Array.from({ length: 31 }, (_, i) => `h${i}`);
    expect(() => parseCSV(wide.join(",") + "\n" + wide.map(() => "1").join(","))).toThrow(/at most 30 columns/);
  });
  it("accepts exactly 30 columns", () => {
    const cols = Array.from({ length: 30 }, (_, i) => `h${i}`);
    expect(parseCSV(cols.join(",") + "\n" + cols.map(() => "1").join(",")).headers).toHaveLength(30);
  });
  it("rejects 5,001 rows", () => {
    expect(() => parseCSV("a\n" + Array.from({ length: 5001 }, () => "1").join("\n"))).toThrow(/5,000 rows/);
  });
  it("accepts exactly 5,000 rows", () => {
    expect(parseCSV("a\n" + Array.from({ length: 5000 }, () => "1").join("\n")).rows).toHaveLength(5000);
  });
  it("rejects duplicate headers and ragged rows", () => {
    expect(() => parseCSV("a,a\n1,2")).toThrow(/unique/);
    expect(() => parseCSV("a,b\n1")).toThrow(/consistent column counts/);
  });
});

describe("suggestMapping", () => {
  it("maps Finnish headers and ignores unknown", () => {
    expect(suggestMapping(["vuosi", "kutsutut", "osallistuneet", "foo"]))
      .toEqual({ vuosi: "year", kutsutut: "invited", osallistuneet: "attended", foo: "ignore" });
  });
  it("assigns a field to the first matching header only", () => {
    expect(suggestMapping(["kunta", "alue"])).toEqual({ kunta: "region", alue: "ignore" });
  });
  it("matches decomposed (NFD) unicode headers", () => {
    expect(suggestMapping(["ryhma\u0308"])).toEqual({ "ryhma\u0308": "group" });
  });
  it("is safe for a __proto__ header", () => {
    const m = suggestMapping(["__proto__", "vuosi"]);
    expect(Object.keys(m)).toEqual(["__proto__", "vuosi"]);
    expect(Object.getPrototypeOf(m)).toBe(Object.prototype);
  });
});

describe("validateMapping", () => {
  const good: Mapping = { y: "year", i: "invited", a: "attended" };
  const t = (rows: string[][]) => ({ headers: ["y", "i", "a"], rows });
  it("accepts valid data", () => expect(validateMapping(t([["2024", "10", "5"]]), good)).toEqual([]));
  it("catches missing required", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { y: "year", i: "invited", a: "ignore" })).toEqual(["Map a column to Attended."]);
  });
  it("catches duplicate field", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { y: "year", i: "invited", a: "invited" }))
      .toEqual(["Invited is mapped to more than one column (i, a).", "Map a column to Attended."]);
  });
  it("accepts Finnish thousands separators", () => {
    for (const v of ["1 200", "1\u00a0200", "1\u202f200"])
      expect(validateMapping(t([["2024", v, "5"]]), good)).toEqual([]);
  });
  it("rejects malformed thousands groups", () => {
    for (const v of ["1 2", "12 34"])
      expect(validateMapping(t([["2024", v, "5"]]), good)).toEqual(["Row 2: invited must be a whole non-negative number."]);
  });
  it("catches non-integer count", () => {
    expect(validateMapping(t([["2024", "10", "5.5"]]), good)).toEqual(["Row 2: attended must be a whole non-negative number."]);
  });
  it("catches attended > invited", () => {
    expect(validateMapping(t([["2024", "10", "11"]]), good)).toEqual(["Row 2: attended exceeds invited."]);
  });
  it("catches bad year", () => {
    expect(validateMapping(t([["1999", "10", "5"]]), good)).toEqual(["Row 2: year must be between 2000 and 2100."]);
  });
  it("checks examined <= positive <= attended", () => {
    const h = { headers: ["y", "i", "a", "p", "e"], rows: [["2024", "10", "5", "2", "3"], ["2024", "10", "5", "6", "1"]] };
    const m: Mapping = { y: "year", i: "invited", a: "attended", p: "positive", e: "examined" };
    expect(validateMapping(h, m)).toEqual(["Row 2: examined exceeds positive.", "Row 3: positive exceeds attended."]);
  });
  it("rejects invalid field values", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { ...good, y: "bogus" as never })).toEqual(['Column "y" is mapped to an invalid field.']);
  });
  it("rejects keys that are not table headers", () => {
    expect(validateMapping(t([["2024", "10", "5"]]), { ...good, zzz: "group" })).toEqual(['Mapping refers to unknown column "zzz".']);
  });
  it("is safe for a __proto__ header", () => {
    const table = { headers: ["__proto__", "i", "a"], rows: [["2024", "10", "5"]] };
    const m = JSON.parse('{"__proto__":"year","i":"invited","a":"attended"}') as Mapping;
    expect(validateMapping(table, m)).toEqual([]);
    expect(validateMapping(table, { i: "invited", a: "attended" })).toEqual(["Map a column to Year."]);
  });
});

describe("personalDataHeaders", () => {
  it.each([
    "henkilötunnus", "hetu", "HETU", "ssn", "patient_hetu", "patient_ssn", "hetu_hash", "dob_year", "Name", "patient_name",
    "asiakkaan nimi", "henkilön nimi", "etunimi", "syntymäaika", "Birth date", "address", "osoite", "Phone", "puhelin",
    "email", "Sähköposti", "personal id", "henkilotunnus",
    "hospital_patient_name", "county_patient_name", "unit_patient_name", "alue_patient_name", "kunta_asiakas_nimi", "ohjelma_henkilön_nimi",
    "kunta_asiakkaan_nimi", "alue_potilaan_nimi", "sairaala_potilaan_nimi", "asukkaan nimi", "kunnan_asukkaan_nimi",
    "kuntalaisen nimi", "kuntalaisten nimi", "lapsen nimi", "opiskelijan nimi", "nimi", "name",
    // fail closed: two qualifier tokens are not on the place/organisation allow-list
    "residential_area_name",
  ])("flags %s", h => expect(personalDataHeaders([h])).toEqual([h]));
  it("flags NFD-encoded Finnish headers", () => {
    const h = "henkilo\u0308tunnus";
    expect(personalDataHeaders([h])).toEqual([h]);
  });
  it.each(["kunta", "alue", "area name", "kuntanimi", "programme_name", "region_name", "municipality name", "county name", "vuosi",
    "hyvinvointialueen nimi", "maakunnan nimi", "sairaanhoitopiirin nimi", "kuntayhtymän nimi", "alueen nimi", "unit_name", "hospital_name"])(
    "does not flag %s", h => expect(personalDataHeaders([h])).toEqual([]));
});

describe("PUBLIC_DATASETS", () => {
  it("lists four datasets", () => expect(PUBLIC_DATASETS).toHaveLength(4));
});
