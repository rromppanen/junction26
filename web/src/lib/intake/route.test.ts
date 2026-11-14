import { describe, expect, it } from "vitest";
import { POST as mapping } from "@/app/api/intake/mapping/route";
import { POST as questions } from "@/app/api/intake/questions/route";

const req = (url: string, body: unknown, raw = false) =>
  new Request(`http://x/${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: raw ? (body as string) : JSON.stringify(body) });
const input = { datasets: [], headers: ["vuosi", "kutsutut", "osallistuneet"], sample: [["2024", "10", "5"]] };
const q = { id: "col:kutsutut", kind: "column", column: "kutsutut", text: "?" };

describe("mapping route validation", () => {
  const bad: [string, unknown][] = [
    ["null question", { input, questions: [null], answers: [] }],
    ["missing id", { input, questions: [{ kind: "audience", text: "x" }], answers: [] }],
    ["bad kind", { input, questions: [{ id: "a", kind: "zzz", text: "x" }], answers: [] }],
    ["non-array answers", { input, questions: [], answers: "x" }],
    ["column not in headers", { input, questions: [{ ...q, column: "nope" }], answers: [] }],
    ["too many questions", { input, questions: Array(6).fill(q), answers: [] }],
    ["long free text", { input, questions: [q], answers: [{ questionId: q.id, text: "x".repeat(501) }] }],
    ["long id", { input, questions: [{ ...q, id: "x".repeat(65) }], answers: [] }],
    ["non-string option", { input, questions: [q], answers: [{ questionId: q.id, option: 5 }] }],
  ];
  for (const [name, body] of bad) {
    it(`400 for ${name}`, async () => { expect((await mapping(req("m", body))).status).toBe(400); });
  }
  it("400 for invalid JSON", async () => { expect((await mapping(req("m", "{nope", true))).status).toBe(400); });
  it("200 for a good body", async () => {
    const res = await mapping(req("m", { input, questions: [q], answers: [{ questionId: q.id, option: "invited" }] }));
    expect(res.status).toBe(200);
  });
});

describe("size bounds", () => {
  it("rejects an oversize body", async () => {
    const big = { ...input, sample: [["x".repeat(70_000)]] };
    expect((await questions(req("q", big))).status).toBe(400);
  });
  it("rejects 31 headers and over-long header names", async () => {
    expect((await questions(req("q", { datasets: [], headers: Array.from({ length: 31 }, (_, i) => `h${i}`), sample: [] }))).status).toBe(400);
    expect((await questions(req("q", { datasets: [], headers: ["x".repeat(101)], sample: [] }))).status).toBe(400);
  });
  it("rejects personal-data headers", async () => {
    expect((await questions(req("q", { datasets: [], headers: ["vuosi", "henkilötunnus"], sample: [] }))).status).toBe(400);
  });
});
