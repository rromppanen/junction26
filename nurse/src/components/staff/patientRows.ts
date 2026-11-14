import { awaitingIntake } from "@/lib/robots/fleet";
import { flagsOf, stageOf, type Sample } from "@/lib/sample/model";
import type { Row } from "./boardShared";

/** A collected sample becomes actionable only after its entire robot run returns. */
export function patientRows(samples: Sample[], now: number): Row[] {
  const atHub = new Set(
    awaitingIntake(samples, now).flatMap((group) =>
      group.samples.map((sample) => sample.id),
    ),
  );
  return samples.map((s) => {
    const flags = flagsOf(s, now).filter(
      (flag) => flag.kind !== "awaitingIntake",
    );
    if (atHub.has(s.id))
      flags.push({
        kind: "awaitingIntake",
        label:
          "Sample has arrived: collect it from the robot and register it at the lab",
      });
    return { s, stage: stageOf(s, now), flags };
  });
}
