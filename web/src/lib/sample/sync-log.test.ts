import { describe, expect, it } from "vitest";
import { appendLog, readLog, resetLog } from "./sync-log";

// Without Redis credentials the log is in memory; this tests the cursor and reset rules.
describe("in-memory demo log", () => {
  it("pages from a cursor and drops writes made before a reset", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    const seedAt = await resetLog();
    const e = (uid: string) => ({ uid, id: "me", event: { type: "sampleTaken" as const, at: 1 } });

    expect(await appendLog(seedAt, [e("a"), e("b")])).toBe("ok");
    expect((await readLog(1, seedAt)).entries.map((x) => x.uid)).toEqual(["b"]);

    // A client with an old seed gets the whole log from 0.
    const fresh = await readLog(5, seedAt - 1);
    expect(fresh.from).toBe(0);
    expect(fresh.entries).toHaveLength(2);

    const next = await resetLog();
    expect(await appendLog(seedAt, [e("c")])).toBe("stale");
    expect((await readLog(0, next)).entries).toEqual([]);
  });
});
