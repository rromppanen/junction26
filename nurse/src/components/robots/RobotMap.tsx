"use client";

import type { Sample } from "@/lib/sample/model";
import { DEPOTS, INSET, MAP, PLACES, homeOf, routePath, type RobotView } from "@/lib/robots/fleet";

function colour(v: RobotView): string {
  const s = v.status;
  if (s.kind === "atDoor") return s.flagged ? "var(--behind)" : "var(--ahead)";
  if (s.kind === "outbound") return "var(--brand)";
  if (s.kind === "returning") return "var(--par)";
  return "var(--surface)";
}

function summary(fleet: RobotView[], ready: Sample[]): string {
  const active = fleet.filter((v) => v.status.kind !== "idle").length;
  return `Map of the pickup robots: ${active} of ${fleet.length} out on trips, ${ready.length} samples waiting for a pickup booking. The fleet list beside the map gives each robot's status.`;
}

/**
 * A schematic map of Päijät-Häme with a Helsinki inset: depots, homes, routes and robots.
 * The fleet list next to it carries the same information for keyboard and screen reader users.
 */
export function RobotMap({ fleet, ready, selected, onSelect }: {
  fleet: RobotView[];
  ready: Sample[];
  selected: string | null;
  onSelect: (robotId: string) => void;
}) {
  const active = fleet.filter((v) => v.status.kind !== "idle");
  return (
    // Below 600px the map scrolls sideways instead of shrinking its labels out of reach.
    <div className="overflow-x-auto rounded-xl border border-rule bg-white">
    <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} role="img" aria-label={summary(fleet, ready)}
      className="block w-full min-w-[600px]">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="var(--rule)" strokeWidth="0.6" opacity="0.6" />
        </pattern>
      </defs>
      <rect width={MAP.width} height={MAP.height} fill="var(--paper)" />
      <rect width={MAP.width} height={MAP.height} fill="url(#grid)" />
      <text x="24" y="38" fontSize="15" fontWeight="600" fill="var(--muted)">Päijät-Häme</text>

      {/* Helsinki inset */}
      <g>
        <rect x={INSET.x} y={INSET.y} width={INSET.width} height={INSET.height} rx="10" fill="var(--surface)" stroke="var(--rule)" strokeWidth="1.5" />
        <text x={INSET.x + 10} y={INSET.y + 20} fontSize="11" fill="var(--muted)">{INSET.label}</text>
      </g>

      {/* Municipalities */}
      {Object.entries(PLACES).map(([name, p]) => (
        <g key={name}>
          <circle cx={p.at.x} cy={p.at.y} r="3" fill="var(--par)" />
          <text x={p.at.x} y={p.at.y - (p.depot === "helsinki" ? 24 : 34)} textAnchor="middle" fontSize="13" fill="var(--muted)">{name}</text>
        </g>
      ))}

      {/* Routes of robots on a trip */}
      {active.map((v) => {
        if (v.status.kind === "idle") return null;
        const on = selected === v.robot.id;
        const returning = v.status.kind === "returning";
        return (
          <path key={`route-${v.robot.id}`} d={routePath(v.status.trip.route)} fill="none"
            stroke={returning ? "var(--par)" : colour(v)} strokeWidth={on ? 5 : 3}
            strokeDasharray={returning ? "4 8" : "10 6"} strokeLinecap="round"
            opacity={selected && !on ? 0.3 : 0.85} />
        );
      })}

      {/* Homes with a sample ready but no robot booked */}
      {ready.map((s) => {
        const h = homeOf(s.person);
        return <circle key={`ready-${s.id}`} cx={h.x} cy={h.y} r="7" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />;
      })}

      {/* Homes robots are heading to or waiting at */}
      {active.map((v) => {
        if (v.status.kind === "idle") return null;
        const { home, person } = v.status.trip;
        const flagged = v.status.kind === "atDoor" && v.status.flagged;
        return (
          <g key={`home-${v.robot.id}`}>
            {flagged && <circle cx={home.x} cy={home.y} r="22" fill="var(--behind)" opacity="0.18" className="motion-safe:animate-pulse" />}
            <rect x={home.x - 6} y={home.y - 6} width="12" height="12" rx="2" fill={flagged ? "var(--behind)" : "var(--ink)"} />
            <text x={home.x + 14} y={home.y + 4} fontSize="12" fontWeight="600" fill="var(--ink)">{person.name}</text>
          </g>
        );
      })}

      {/* Depots */}
      {Object.values(DEPOTS).map((d) => (
        <g key={d.id}>
          <rect x={d.at.x - 10} y={d.at.y - 10} width="20" height="20" rx="4" fill="var(--brand-strong)" />
          <text x={d.id === "helsinki" ? d.at.x : d.at.x - 18} y={d.id === "helsinki" ? d.at.y + 32 : d.at.y + 5}
            textAnchor={d.id === "helsinki" ? "middle" : "end"} fontSize="13" fontWeight="700" fill="var(--brand-strong)">{d.name}</text>
        </g>
      ))}

      {/* Robots */}
      {fleet.map((v) => {
        const idle = v.status.kind === "idle";
        const on = selected === v.robot.id;
        const r = idle ? 8 : 13;
        return (
          <g key={v.robot.id} aria-hidden onClick={() => onSelect(v.robot.id)}
            className="cursor-pointer motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-linear"
            style={{ transform: `translate(${v.at.x}px, ${v.at.y}px)` }}>
            {on && <circle r={r + 7} fill="none" stroke="var(--ink)" strokeWidth="2" />}
            <circle r={r} fill={colour(v)} stroke={idle ? "var(--par)" : "var(--surface)"} strokeWidth="2" />
            <text y={idle ? 3.5 : 4.5} textAnchor="middle" fontSize={idle ? 9 : 12} fontWeight="700"
              fill={idle ? "var(--ink)" : "var(--surface)"}>
              {v.robot.id.slice(1)}
            </text>
          </g>
        );
      })}
    </svg>
    </div>
  );
}
