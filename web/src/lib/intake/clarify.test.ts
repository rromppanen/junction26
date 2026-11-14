import { afterEach, describe, expect, it, vi } from "vitest";
import { answersToSetup, getQuestions, type Generator, type Question } from "./clarify";

const input = { datasets: ["registry-pathway" as const], headers: ["vuosi", "kutsutut", "osallistuneet", "foo", "bar", "baz"], sample: [["2024", "10", "5", "x", "y", "z"]] };
const noAi: Generator = async () => { throw new Error("no key"); };

afterEach(() => vi.restoreAllMocks());

describe("getQuestions", () => {
  it("falls back: audience, level, county plus questions for unmapped headers, max 5", async () => {
    const r = await getQuestions(input, noAi);
    expect(r.status).toBe("fallback");
    const kinds = r.questions.map((q) => q.kind);
    expect(kinds).toEqual(expect.arrayContaining(["audience", "level", "county"]));
    expect(r.questions.filter((q) => q.kind === "column").map((q) => q.column)).toEqual(["foo", "bar"]);
    expect(r.questions.length).toBeLessThanOrEqual(5);
    expect(r.questions.find((q) => q.kind === "county")!.options).toHaveLength(23);
    expect(r.suggested).toMatchObject({ vuosi: "year", foo: "ignore" });
  });
  it("public-only input has no column questions", async () => {
    const r = await getQuestions({ datasets: ["mortality"], headers: null, sample: null }, noAi);
    expect(r.questions.map((q) => q.kind).sort()).toEqual(["audience", "county", "level"]);
    expect(r.suggested).toBeNull();
  });
  it("uses Gemini questions when valid, ignoring unknown columns", async () => {
    const gen: Generator = async () => ({ questions: [{ column: "foo", text: "What is foo?" }, { column: "nope", text: "x" }] });
    const r = await getQuestions(input, gen);
    expect(r.status).toBe("ai");
    expect(r.questions.filter((q) => q.kind === "column")).toMatchObject([{ column: "foo", text: "What is foo?" }, { column: "bar" }]);
  });
  it("AI path still asks about unmapped headers Gemini did not mention", async () => {
    const r = await getQuestions(input, async () => ({ questions: [] }));
    expect(r.status).toBe("ai");
    expect(r.questions.filter((q) => q.kind === "column").map((q) => q.column)).toEqual(["foo", "bar"]);
  });
  it("AI path merges unmapped first, then Gemini extras, capped at 2", async () => {
    const r = await getQuestions({ ...input, headers: ["vuosi", "kutsutut", "osallistuneet", "foo"], sample: [["2024", "1", "1", "x"]] },
      async () => ({ questions: [{ column: "kutsutut", text: "q?" }, { column: "foo", text: "foo text" }] }));
    expect(r.questions.filter((q) => q.kind === "column").map((q) => [q.column, q.text])).toEqual([["foo", "foo text"], ["kutsutut", "q?"]]);
    expect(r.questions).toHaveLength(5);
  });
  it("junk from Gemini falls back", async () => {
    const r = await getQuestions(input, async () => ({ questions: "oops" }));
    expect(r.status).toBe("fallback");
    expect(r.questions.some((q) => q.kind === "column")).toBe(true);
  });
  it("sends the generator only headers and at most 5 sample rows", async () => {
    const gen = vi.fn<Generator>(async () => ({ questions: [] }));
    await getQuestions({ ...input, sample: Array.from({ length: 9 }, () => ["1"]) }, gen);
    expect(JSON.stringify(gen.mock.calls[0][0]).match(/\["1"\]/g)).toHaveLength(5);
  });
  it("rejects personal-data headers", async () => {
    await expect(getQuestions({ ...input, headers: ["vuosi", "henkilötunnus"] }, noAi)).rejects.toThrow(/personal/i);
  });
});

describe("answersToSetup", () => {
  const questions: Question[] = [
    { id: "audience", kind: "audience", text: "", options: [{ value: "national", label: "N" }, { value: "county-board", label: "C" }] },
    { id: "level", kind: "level", text: "", options: [{ value: "county", label: "C" }, { value: "municipality", label: "M" }] },
    { id: "county", kind: "county", text: "", options: [{ value: "7", label: "Kainuu" }] },
    { id: "col:foo", kind: "column", column: "foo", text: "foo?", options: [{ value: "positive", label: "P" }, { value: "ignore", label: "I" }] },
    { id: "col:bar", kind: "column", column: "bar", text: "bar?", options: [{ value: "positive", label: "P" }] },
  ];
  const inp = { datasets: [], headers: ["vuosi", "kutsutut", "osallistuneet", "foo", "bar"], sample: [["2024", "10", "5", "2", "x"]] };

  it("applies picked options without calling the generator", async () => {
    const gen = vi.fn<Generator>();
    const r = await answersToSetup(inp, questions, [
      { questionId: "audience", option: "national" }, { questionId: "level", option: "municipality" },
      { questionId: "county", option: "977" }, { questionId: "col:foo", option: "positive" },
    ], gen);
    expect(gen).not.toHaveBeenCalled();
    expect(r).toMatchObject({ status: "fallback", audience: "national", level: "municipality", countyId: 977 });
    expect(r.mapping!.foo).toBe("positive");
  });
  it("rejects a generator value that is not a Field id, keeping the suggested value", async () => {
    const h = ["vuosi", "kutsutut", "osallistuneet"];
    const gen: Generator = async () => ({ answers: [{ questionId: "col:kutsutut", value: "bogus" }] });
    const r = await answersToSetup({ datasets: [], headers: h, sample: [["2024", "10", "5"]] },
      [{ id: "col:kutsutut", kind: "column", column: "kutsutut", text: "?", options: [] }],
      [{ questionId: "col:kutsutut", text: "whatever" }], gen);
    expect(r.mapping!.kutsutut).toBe("invited"); // suggested, not overwritten
    expect(r.notes.join(" ")).toMatch(/kutsutut/);
  });
  it("gives the generator the option labels for a county question", async () => {
    const qs: Question[] = [{ id: "county", kind: "county", text: "Which county?", options: [{ value: "7", label: "Länsi-Uusimaa" }] }];
    const gen = vi.fn<Generator>(async () => ({ answers: [] }));
    await answersToSetup(inp, qs, [{ questionId: "county", text: "Espoo" }], gen);
    const task = gen.mock.calls[0][0];
    expect(JSON.stringify(task)).toContain("Länsi-Uusimaa");
  });
  it("maps free text via the generator and reports ai", async () => {
    const gen: Generator = async () => ({ answers: [{ questionId: "col:foo", value: "positive" }] });
    const r = await answersToSetup({ ...inp, headers: ["vuosi", "kutsutut", "osallistuneet", "foo"], sample: [["2024", "10", "5", "2"]] }, questions,
      [{ questionId: "col:foo", text: "positive results" }], gen);
    expect(r.status).toBe("ai");
    expect(r.mapping!.foo).toBe("positive");
  });
  it("ignores options a client smuggled into the question", async () => {
    const qs: Question[] = [{ id: "col:foo", kind: "column", column: "foo", text: "?", options: [{ value: "__evil__", label: "x" }] }];
    const r = await answersToSetup({ datasets: [], headers: ["vuosi", "kutsutut", "osallistuneet", "foo"], sample: [["2024", "10", "5", "2"]] }, qs,
      [{ questionId: "col:foo", option: "__evil__" }], noAi);
    expect(r.mapping!.foo).toBe("ignore");
    expect(r.notes.join(" ")).toMatch(/not one of the offered/);
  });
  it("rejects a county that is not in the dataset", async () => {
    for (const bad of ["abc", "999999"]) {
      const r = await answersToSetup(inp, questions, [{ questionId: "county", option: bad }], noAi);
      expect(r.countyId).toBeNull();
      expect(r.notes.join(" ")).toMatch(/county/);
    }
  });
  it("maps kutsutut free text onto invited when allowed", async () => {
    const qs: Question[] = [{ id: "col:kutsutut", kind: "column", column: "kutsutut", text: "?", options: [{ value: "invited", label: "I" }] }];
    const gen: Generator = async () => ({ answers: [{ questionId: "col:kutsutut", value: "invited" }] });
    const r = await answersToSetup({ datasets: [], headers: ["vuosi", "kutsutut", "osallistuneet"], sample: [["2024", "10", "5"]] }, qs,
      [{ questionId: "col:kutsutut", text: "kutsutut tarkoittaa kutsuttuja" }], gen);
    expect(r.mapping!.kutsutut).toBe("invited");
  });
  it("generator failure keeps suggestions and notes it", async () => {
    const r = await answersToSetup(inp, questions, [{ questionId: "col:foo", text: "something" }], noAi);
    expect(r.status).toBe("fallback");
    expect(r.mapping!.foo).toBe("ignore");
    expect(r.notes.length).toBeGreaterThan(0);
  });
  it("returns validateMapping errors as notes", async () => {
    const r = await answersToSetup({ datasets: [], headers: ["a"], sample: [["1"]] }, [], [], noAi);
    expect(r.notes.join(" ")).toMatch(/Year/);
  });
  it("ignores options that are not offered", async () => {
    const r = await answersToSetup(inp, questions, [{ questionId: "audience", option: "bogus" }], noAi);
    expect(r.audience).toBe("county-board");
    expect(r.notes.join(" ")).toMatch(/audience/i);
  });
});
