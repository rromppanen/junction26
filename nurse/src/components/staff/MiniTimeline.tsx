import { STAGES_FOR_BOARD } from "@/lib/sample/model";

export function MiniTimeline({ step, flagged }: { step: number; flagged: boolean }) {
  const total = STAGES_FOR_BOARD.length;
  return (
    <span className="inline-flex items-center">
      <span className="sr-only">{`Step ${step + 1} of ${total}: ${STAGES_FOR_BOARD[step].label}`}</span>
      {STAGES_FOR_BOARD.map((c, i) => {
        const cur = i === step;
        return (
          <span key={c.label} aria-hidden className="inline-flex items-center">
            {i > 0 && <span className={`h-px w-2 ${i <= step ? "bg-brand" : "bg-rule"}`} />}
            <span
              className={`inline-block shrink-0 rounded-full ${i <= step ? "bg-brand" : "bg-rule"} ${cur ? "size-2.5" : "size-2"} ${
                cur && flagged ? "ring-2 ring-behind ring-offset-1" : ""
              }`}
            />
          </span>
        );
      })}
    </span>
  );
}
