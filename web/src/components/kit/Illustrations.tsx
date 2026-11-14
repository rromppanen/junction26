import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, className = "", ...rest }: P) {
  return (
    <svg
      viewBox="0 0 72 72"
      width={72}
      height={72}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** A folded leaflet with text lines. */
export function LeafletIllustration(props: P) {
  return (
    <Base {...props}>
      <path d="M18 10h30l8 8v44H18z" />
      <path d="M48 10v8h8" />
      <path d="M26 30h22M26 40h22M26 50h14" stroke="var(--brand)" />
    </Base>
  );
}

/** A tube with a date label. */
export function TubeIllustration(props: P) {
  return (
    <Base {...props}>
      <path d="M28 12h16M30 12v6h12v-6" />
      <path d="M30 18v36a6 6 0 0 0 12 0V18" />
      <rect x="29" y="30" width="14" height="14" rx="2" fill="var(--brand-soft)" stroke="var(--brand)" />
      <path d="M33 36h6M33 40h4" stroke="var(--brand)" />
    </Base>
  );
}

/** A tube lying in a zip bag. */
export function BagIllustration(props: P) {
  return (
    <Base {...props}>
      <path d="M12 20h48v40a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" />
      <path d="M12 28h48" stroke="var(--brand)" />
      <path d="M26 46h20a4 4 0 0 1 0 8H26a4 4 0 0 1 0-8z" />
      <path d="M32 46v8" stroke="var(--brand)" />
    </Base>
  );
}

/** A friendly delivery robot: a rounded box on wheels with a lid. */
export function RobotIllustration(props: P) {
  return (
    <Base {...props}>
      <path d="M14 30h44v20a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="var(--brand-soft)" />
      <path d="M12 30h48M36 24v6" />
      <circle cx="36" cy="22" r="2.5" stroke="var(--brand)" />
      <circle cx="28" cy="40" r="2" fill="currentColor" />
      <circle cx="44" cy="40" r="2" fill="currentColor" />
      <path d="M31 46q5 3 10 0" stroke="var(--brand)" />
      <circle cx="22" cy="60" r="5" />
      <circle cx="50" cy="60" r="5" />
    </Base>
  );
}

/** A check mark that draws itself in (the `draw-check` class animates stroke-dashoffset). */
export function CheckIllustration({ animate, ...props }: P & { animate?: boolean }) {
  return (
    <Base {...props}>
      <circle cx="36" cy="36" r="26" stroke="var(--brand)" />
      <path
        d="M24 37l8 8 17-19"
        stroke="var(--brand)"
        strokeWidth={4}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={0}
        className={animate ? "draw-check" : undefined}
      />
    </Base>
  );
}

/** A clinic building with a cross. */
export function ClinicIllustration(props: P) {
  return (
    <Base {...props}>
      <path d="M12 62V24l24-12 24 12v38z" />
      <path d="M36 28v14M29 35h14" />
      <path d="M30 62V52h12v10" />
    </Base>
  );
}
