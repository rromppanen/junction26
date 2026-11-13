import { describe, expect, it } from "vitest";
import { countyQuery, getCountyContext, toSnippets } from "./context";

describe("live county context", () => {
  it("builds a Finnish query for the county", () => {
    expect(countyQuery("Lapin hyvinvointialue")).toContain("Lapin hyvinvointialue");
    expect(countyQuery("Lapin hyvinvointialue")).toContain("syöpä");
  });

  it("turns search results into numbered snippets and skips empty ones", () => {
    const s = toSnippets([
      { url: "https://a.fi", title: "A", description: "x".repeat(400) },
      { url: "", title: "no url" },
      { url: "https://b.fi", description: "B only" },
    ]);
    expect(s.map((x) => x.id)).toEqual(["live:1", "live:2"]);
    expect(s[0].text).toHaveLength(300);
    expect(s[1].title).toBe("https://b.fi");
  });

  it("returns nothing without an API key", async () => {
    const prev = process.env.CONTEXT_DEV_API_KEY;
    delete process.env.CONTEXT_DEV_API_KEY;
    expect(await getCountyContext("Lapin hyvinvointialue")).toEqual([]);
    if (prev) process.env.CONTEXT_DEV_API_KEY = prev;
  });
});
