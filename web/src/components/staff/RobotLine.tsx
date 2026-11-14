import { activeBooking, robotEta, robotProgress, stageOf, type Sample } from "@/lib/sample/model";
import { clockFmt, mmss } from "./boardShared";

const SOON_MS = 10 * 60_000;

/** Robot progress bar with ETA, for a pickup that is en route or starts within 10 minutes. */
export function RobotLine({ sample, now, className = "" }: { sample: Sample; now: number; className?: string }) {
  const b = activeBooking(sample);
  const stage = stageOf(sample, now);
  if (!b || b.type !== "pickupBooked") return null;
  const startsAt = b.startsAt ?? b.at;
  const eta = robotEta(sample, now);
  if (eta === null) return null;
  if (stage === "booked" && startsAt - now > SOON_MS) return null;
  const pct = Math.round((robotProgress(sample, now) ?? 0) * 100);
  const text = stage === "booked" ? `Leaves at ${clockFmt.format(startsAt)}` : stage === "robotAtDoor" ? "Robot is at the door" : `Arrives in ${mmss(eta)}`;
  return (
    <div className={className}>
      <div className="h-2 overflow-hidden rounded-full bg-rule" role="progressbar" aria-label="Robot progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{text}</p>
    </div>
  );
}
