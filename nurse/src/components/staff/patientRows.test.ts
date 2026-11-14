import { describe, expect, it } from "vitest";
import { tripsOf } from "@/lib/robots/fleet";
import { flagsOf, type Sample } from "@/lib/sample/model";
import { patientRows } from "./patientRows";

const start = 1_800_000_000_000;
function stop(id: string, compartment: number): Sample {
  return {
    id,
    person: {
      id,
      name: id,
      age: 60,
      municipality: "Helsinki",
      area: "Kallio",
      lang: "en",
    },
    events: [
      { type: "sampleTaken", at: start - 1000 },
      {
        type: "pickupBooked",
        at: start,
        run: "shared",
        compartment,
        travelMs: 20_000,
        ...(compartment === 2 ? { after: "first" } : {}),
      },
    ],
  };
}

describe("nurse actions for shared robot runs", () => {
  it("withholds lab registration while the robot is collecting its later stops", () => {
    const first = stop("first", 1);
    first.events.push({ type: "pickedUp", at: start + 30_000 });
    const second = stop("second", 2);
    expect(
      flagsOf(first, start + 90_000).some(
        (flag) => flag.kind === "awaitingIntake",
      ),
    ).toBe(true);
    expect(
      patientRows([first, second], start + 90_000).some((row) =>
        row.flags.some((flag) => flag.kind === "awaitingIntake"),
      ),
    ).toBe(false);
    second.events.push(
      { type: "robotDispatched", at: start + 30_000 },
      { type: "pickedUp", at: start + 100_000 },
    );
    const backAt = tripsOf([first, second])[1].backAt!;
    expect(
      patientRows([first, second], backAt - 1).every((row) =>
        row.flags.every((flag) => flag.kind !== "awaitingIntake"),
      ),
    ).toBe(true);
    expect(
      patientRows([first, second], backAt).every((row) =>
        row.flags.some((flag) => flag.kind === "awaitingIntake"),
      ),
    ).toBe(true);
  });
});
