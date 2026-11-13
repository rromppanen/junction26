import type { PathwayStage } from "@/lib/types";
import { PATHWAY_STAGES } from "@/lib/types";
import { STAGE_LABEL } from "./format";

const NO_DATA: PathwayStage[] = ["referral", "diagnosis"];

/**
 * The care pathway drawn as a route: one line, five stops.
 * Stops with public county data are solid; referral and diagnosis have none, so the line
 * goes dashed there. The stop being discussed is filled and named underneath.
 */
export function PathwayStrip({ active, note }: { active: PathwayStage | null; note?: string }) {
  return (
    <div>
      <ol className="grid grid-cols-5" aria-label="Cancer care pathway, in order">
        {PATHWAY_STAGES.map((s, i) => {
          const gap = NO_DATA.includes(s);
          const on = s === active;
          const nextGap = i < PATHWAY_STAGES.length - 1 && (gap || NO_DATA.includes(PATHWAY_STAGES[i + 1]));
          return (
            <li key={s} className="relative pt-7" aria-current={on ? "step" : undefined}>
              {/* segment to the next stop */}
              {i < PATHWAY_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[9px] right-[-9px] top-[13px] ${
                    nextGap ? "border-t-2 border-dashed border-par" : "h-[3px] -translate-y-px bg-ink"
                  }`}
                />
              )}
              {/* the stop */}
              <span
                aria-hidden
                className={`absolute left-0 top-1 block rounded-full ${
                  on
                    ? "h-5 w-5 -translate-x-[1px] -translate-y-[1px] border-[3px] border-ink bg-behind"
                    : gap
                      ? "h-[18px] w-[18px] border-2 border-dashed border-par bg-paper"
                      : "h-[18px] w-[18px] border-[3px] border-ink bg-paper"
                }`}
              />
              <span className={`block pr-1.5 text-[13px] leading-tight sm:pr-2 sm:text-base ${on ? "font-semibold" : gap ? "text-muted" : ""}`}>
                {STAGE_LABEL[s]}
              </span>
              {gap && <span className="mt-0.5 block pr-2 text-[11px] leading-snug text-muted">no public county figures</span>}
            </li>
          );
        })}
      </ol>
      {note && <p className="mt-3 max-w-prose text-sm text-muted">{note}</p>}
    </div>
  );
}
