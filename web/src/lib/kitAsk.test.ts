import { afterEach, describe, expect, it, vi } from "vitest";
import { askKit, FALLBACK_TEXT } from "./kitAsk";

const gen = (v: unknown) => async () => v;

describe("askKit", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns an AI answer that cites known facts", async () => {
    const r = await askKit("Is it free?", gen({ answer: "Yes, it is free of charge.", factIds: ["free"], answerable: true }));
    expect(r).toEqual({ status: "ai", answer: "Yes, it is free of charge.", factIds: ["free"] });
  });

  it("allows numbers that appear in the cited facts", async () => {
    const r = await askKit("Who?", gen({ answer: "People aged 56–74, every two years. About 4 in 100 samples show blood.", factIds: ["ages-56-74-every-2y", "blood-4-in-100"], answerable: true }));
    expect(r.status).toBe("ai");
  });

  it("falls back on an unknown fact id", async () => {
    const r = await askKit("q", gen({ answer: "Yes.", factIds: ["made-up"], answerable: true }));
    expect(r.status).toBe("fallback");
  });

  it("falls back when no fact is cited", async () => {
    expect((await askKit("q", gen({ answer: "Yes.", factIds: [], answerable: true }))).status).toBe("fallback");
  });

  it("falls back on an invented number", async () => {
    const r = await askKit("q", gen({ answer: "Please take 3 samples.", factIds: ["home-sample"], answerable: true }));
    expect(r.status).toBe("fallback");
  });

  it("falls back on an over-long answer", async () => {
    const r = await askKit("q", gen({ answer: "a".repeat(601), factIds: ["free"], answerable: true }));
    expect(r.status).toBe("fallback");
  });

  it("falls back when not answerable, in the UI language", async () => {
    const r = await askKit("q", gen({ answer: "", factIds: [], answerable: false }), "fi");
    expect(r).toEqual({ status: "fallback", answer: FALLBACK_TEXT.fi, factIds: [] });
  });

  it("falls back when the generator throws", async () => {
    const r = await askKit("q", async () => { throw new Error("boom"); }, "sv");
    expect(r.answer).toBe(FALLBACK_TEXT.sv);
  });

  it("falls back without a generator and without a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const r = await askKit("q");
    expect(r.status).toBe("fallback");
    expect(r.answer).toBe(FALLBACK_TEXT.en);
  });
});
