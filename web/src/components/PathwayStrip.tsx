import type { PathwayStage } from "@/lib/types";
import { PATHWAY_STAGES } from "@/lib/types";
import { STAGE_LABEL } from "./format";

const NO_DATA: PathwayStage[] = ["referral", "diagnosis"];

export function PathwayStrip({ active }: { active: PathwayStage | null }) {
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Cancer care pathway">
      {PATHWAY_STAGES.map((s, i) => {
        const gap = NO_DATA.includes(s);
        const on = s === active;
        return (
          <li
            key={s}
            className={`relative rounded-md border px-2 py-2 text-xs sm:text-sm ${
              on
                ? "border-nordic bg-nordic text-white"
                : gap
                  ? "border-dashed border-rule bg-transparent text-muted"
                  : "border-rule bg-surface text-ink"
            }`}
            aria-current={on ? "step" : undefined}
          >
            <span className="block font-semibold">
              <span className="mr-1 opacity-60">{i + 1}</span>
              {STAGE_LABEL[s]}
            </span>
            {gap && (
              <span className="mt-1 block text-[10px] leading-snug sm:text-[11px]">
                No public county data — data gap (roadmap action 3.1.2)
              </span>
            )}
            {on && <span className="mt-1 block text-[10px] sm:text-[11px] opacity-90">Selected indicator</span>}
          </li>
        );
      })}
    </ol>
  );
}
