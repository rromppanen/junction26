import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as answerRoute } from "@/app/api/intake/answer/route";
import { CONFIDENT, interpretAnswer, understandData, type UnderstandGenerator } from "./understand";

const noAi: UnderstandGenerator = async () => { throw new Error("no key"); };
const file = {
  datasets: ["registry-pathway" as const],
  headers: ["vuosi", "kunta", "kutsutut", "osallistuneet", "pos_n", "huom"],
  sample: [["2024", "Tampere", "1200", "900", "40", ""], ["2024", "Nokia", "300", "210", "9", "x"]],
};

afterEach(() => vi.restoreAllMocks());

describe("understandData", () => {
  it("without AI asks only about columns it cannot name, and infers the county from the region values", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const u = await understandData(file, noAi);
    expect(u.status).toBe("fallback");
    expect(u.questions.map((q) => q.column ?? q.kind)).toEqual(["pos_n", "huom"]);
    expect(u.mapping).toMatchObject({ vuosi: "year", kunta: "region", kutsutut: "invited", osallistuneet: "attended", pos_n: "ignore" });
    expect(u.place.countyId).not.toBeNull();
    expect(u.place.level).toBe("municipality");
    expect(u.places.find((p) => p.value === String(u.place.countyId))?.label).toBe("Pirkanmaa");
  });

  it("uses confident AI guesses without asking and asks about unsure ones with the AI's guess", async () => {
    const gen: UnderstandGenerator = async () => ({
      columns: [
        { column: "pos_n", field: "positive", meaning: "Positive results", confidence: 0.92, question: "q1" },
        { column: "huom", field: "ignore", meaning: "Free-text notes", confidence: 0.6, question: "Is huom just notes?" },
      ],
    });
    const u = await understandData(file, gen);
    expect(u.status).toBe("ai");
    expect(u.mapping!.pos_n).toBe("positive");
    expect(u.questions).toHaveLength(1);
    expect(u.questions[0]).toMatchObject({ column: "huom", text: "Is huom just notes?", guess: { value: "ignore" } });
    expect(u.questions[0].confidence).toBeLessThan(CONFIDENT);
  });

  it("asks again when the AI gives one field to two columns", async () => {
    const gen: UnderstandGenerator = async () => ({
      columns: [
        { column: "pos_n", field: "invited", meaning: "", confidence: 0.9, question: "" },
        { column: "huom", field: "ignore", meaning: "", confidence: 0.9, question: "" },
      ],
    });
    const u = await understandData(file, gen);
    expect(u.mapping!.kutsutut).toBe("invited");
    expect(u.questions.map((q) => q.column)).toEqual(["pos_n"]);
  });

  it("public data only: one question, the place", async () => {
    const u = await understandData({ datasets: ["mortality"], headers: null, sample: null }, noAi);
    expect(u.questions.map((q) => q.kind)).toEqual(["county"]);
    expect(u.mapping).toBeNull();
  });

  it("refuses personal data", async () => {
    await expect(understandData({ datasets: [], headers: ["hetu"], sample: [["x"]] }, noAi)).rejects.toThrow(/personal data/);
  });
});

describe("interpretAnswer", () => {
  const col = { kind: "column" as const, text: "What is pos_n?" };
  const county = { kind: "county" as const, text: "Which county?" };
  const input = { datasets: [], headers: file.headers, sample: file.sample };

  it("maps a free-text answer with local matching when AI is unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await interpretAnswer(input, col, "number referred onwards after a positive result", null, noAi)).toMatchObject({ result: "matched", value: "positive" });
    expect(await interpretAnswer(input, county, "Olen Tampereella", null, noAi)).toMatchObject({ result: "matched", label: "Pirkanmaa" });
    expect(await interpretAnswer(input, county, "koko maa", null, noAi)).toMatchObject({ result: "matched", value: "national" });
    expect(await interpretAnswer(input, col, "hmm", null, noAi)).toEqual({ result: "unclear" });
  });

  it("treats yes as accepting the guess and don't know as a skip", async () => {
    expect(await interpretAnswer(input, col, "Yes", "positive", noAi)).toMatchObject({ result: "matched", value: "positive" });
    expect(await interpretAnswer(input, col, "I don't know", "positive", noAi)).toEqual({ result: "skip" });
  });

  it("only accepts AI values that are allowed for the question", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await interpretAnswer(input, col, "abc", null, async () => ({ value: "examined" }))).toMatchObject({ result: "matched", value: "examined" });
    expect(await interpretAnswer(input, col, "abc", null, async () => ({ value: "999" }))).toEqual({ result: "unclear" });
  });
});

describe("answer route", () => {
  const req = (body: unknown) =>
    new Request("http://x/a", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const input = { datasets: [], headers: ["vuosi", "pos_n"], sample: [["2024", "4"]] };
  it("400 for a question kind other than column or county", async () => {
    expect((await answerRoute(req({ input, question: { id: "a", kind: "audience", text: "x" }, text: "y" }))).status).toBe(400);
  });
  it("400 for a column not in the headers", async () => {
    expect((await answerRoute(req({ input, question: { id: "c", kind: "column", column: "nope", text: "x" }, text: "y" }))).status).toBe(400);
  });
  it("200 for a good body", async () => {
    const res = await answerRoute(req({ input, question: { id: "col:pos_n", kind: "column", column: "pos_n", text: "x" }, text: "yes", guess: "positive" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "matched", value: "positive" });
  });
});
