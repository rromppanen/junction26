import { describe, expect, it } from "vitest";
import { claimLease, LEASE_MS } from "./sync-log";

// Without Redis credentials the lease lives in memory; the rules are the same.
describe("simulation lease", () => {
  it("lets one page simulate at a time, hands over when it lapses or is released", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    const t = 1_900_000_000_000;
    expect(await claimLease("a", false, t)).toBe("a");
    expect(await claimLease("b", false, t + 1000)).toBe("a"); // a still holds it
    expect(await claimLease("a", false, t + 2000)).toBe("a"); // a renews
    expect(await claimLease("b", false, t + 2000 + LEASE_MS - 1)).toBe("a");
    expect(await claimLease("b", false, t + 2000 + LEASE_MS)).toBe("b"); // a stopped renewing
    await claimLease("b", true, t + 9000); // b closes its page
    expect(await claimLease("c", false, t + 9001)).toBe("c");
  });
});
