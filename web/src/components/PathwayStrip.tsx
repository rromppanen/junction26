import type { PathwayStage } from "@/lib/types";
import { PATHWAY_STAGES } from "@/lib/types";
import { STAGE_LABEL } from "./format";

const NO_DATA: PathwayStage[] = ["referral", "diagnosis"];

/**
 * The care pathway drawn as a route: one line, five stops.
 * Stops with public county data are solid rings joined by a solid line. Referral and diagnosis have
 * no public county figures, so the same line turns into a row of grey dots there: the route continues,
 * nobody has measured it. The stop being discussed is filled and set in bold.
 *
 * Geometry: every stop is centred 13px below the top of its column and 9px in from its left edge;
 * segments run from one centre to the next and sit under the stops.
 */
export function PathwayStrip({ active, note }: { active: PathwayStage | null; note?: string }) {
  return (
    <div>
      <ol className="grid grid-cols-5" aria-label="Cancer care pathway, in order">
        {PATHWAY_STAGES.map((s, i) => {
          const gap = NO_DATA.includes(s);
          const on = s === active;
          const last = i === PATHWAY_STAGES.length - 1;
          const nextGap = !last && (gap || NO_DATA.includes(PATHWAY_STAGES[i + 1]));
          return (
            <li key={s} className="relative pt-7" aria-current={on ? "step" : undefined}>
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[9px] right-[-9px] top-[11.5px] h-[3px] ${
                    nextGap ? "border-t-[3px] border-dotted border-par" : "bg-ink"
                  }`}
                />
              )}
              <span
                aria-hidden
                className={`absolute top-1 left-0 block h-[18px] w-[18px] rounded-full ${
                  on
                    ? "border-[3px] border-ink bg-behind ring-[3px] ring-paper"
                    : gap
                      ? "border-2 border-dashed border-par bg-paper"
                      : "border-[3px] border-ink bg-paper"
                }`}
              />
              <span
                className={`block pr-1.5 text-[13px] leading-tight [font-stretch:84%] sm:pr-3 sm:text-base sm:[font-stretch:100%] ${
                  on ? "font-semibold" : gap ? "text-muted" : ""
                }`}
              >
                {STAGE_LABEL[s]}
              </span>
              {gap && (
                <span className="mt-1 block pr-1.5 text-[11px] leading-snug text-muted sm:pr-3 sm:text-xs">
                  no public county figures
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {note && <p className="mt-4 max-w-prose text-sm text-muted">{note}</p>}
    </div>
  );
}
