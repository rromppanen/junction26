"use client";

import { useEffect, useRef, useState } from "react";
import { RobotIllustration } from "./Illustrations";

const ROUTE = "M34 156 C 100 156, 70 66, 140 82 S 236 148, 288 96 S 318 52, 326 44";

/** A fixed route from the lab to the home, with the robot dot at `progress` (0..1). */
export function RobotMap({ progress, labLabel, homeLabel, to }: { progress: number; labLabel: string; homeLabel: string; to: string }) {
  const path = useRef<SVGPathElement>(null);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const p = path.current;
    if (!p) return;
    const at = p.getPointAtLength(p.getTotalLength() * Math.min(1, Math.max(0, progress)));
    setPt({ x: at.x, y: at.y });
  }, [progress]);

  return (
    <svg viewBox="0 0 360 200" role="img" aria-label={`${labLabel} ${to} ${homeLabel}`} className="w-full rounded-xl border border-rule bg-brand-soft">
      <path ref={path} d={ROUTE} fill="none" stroke="var(--brand)" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity="0.55" />
      <g>
        <circle cx="34" cy="156" r="7" fill="var(--brand-strong)" />
        <text x="34" y="182" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">{labLabel}</text>
      </g>
      <g>
        <circle cx="326" cy="44" r="7" fill="var(--brand-strong)" />
        <text x="326" y="30" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">{homeLabel}</text>
      </g>
      {pt && (
        <g
          className="motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-linear"
          style={{ transform: `translate(${pt.x}px, ${pt.y}px)` }}
        >
          <circle r="18" fill="var(--brand)" opacity="0.18" />
          <RobotIllustration x={-14} y={-14} width={28} height={28} className="text-ink" />
        </g>
      )}
    </svg>
  );
}
