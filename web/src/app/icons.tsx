import type { CSSProperties } from "react";
const paths: Record<string, React.ReactNode> = {
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  data: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0"/></>,
  chart: <><path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/></>,
  route: <><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/></>,
  book: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1ZM12 5v15"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  activity: <path d="M2 12h5l3-8 4 16 3-8h5"/>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></>,
  download: <><path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
  spark: <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3ZM20 2v4m-2-2h4"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/></>,
  file: <><path d="M14 2H5v20h14V7ZM14 2v5h5M8 12h8M8 16h6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
};
export function Icon({ name, size = 20, style }: { name: string; size?: number; style?: CSSProperties }) { return <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.info}</svg>; }
