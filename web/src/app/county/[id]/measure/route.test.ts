import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { MEASURES } from "@/data/measureKit";

const call = (id: string) =>
  GET(new Request(`http://localhost/county/${id}/measure`), { params: Promise.resolve({ id }) });

describe("GET /county/[id]/measure", () => {
  it("returns the CSV template for a county", async () => {
    const res = await call("960");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/csv/);
    expect(res.headers.get("content-disposition")).toContain("gap-radar-mittarit-960.csv");
    const lines = (await res.text()).trim().split(/\r?\n/);
    expect(lines[0]).toBe("kuukausi,syopa,mittari,mediaani_vrk,potilaita");
    expect(lines).toHaveLength(2);
  });

  it("404s for an unknown id", async () => {
    expect((await call("999999")).status).toBe(404);
    expect((await call("abc")).status).toBe(404);
  });
});

describe("MEASURES", () => {
  it("has exactly three measures citing the Goal 3 evidence", () => {
    expect(MEASURES).toHaveLength(3);
    for (const m of MEASURES) expect(m.evidenceId).toBe("strategy-goal3-headline");
  });
});
