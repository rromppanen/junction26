const nf = (decimals: number) =>
  new Intl.NumberFormat("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function num(v: number, decimals = 0): string {
  return Number.isFinite(v) ? nf(decimals).format(v) : "–";
}

/** €1,234 or −€1,234. */
export function eur(v: number): string {
  if (!Number.isFinite(v)) return "–";
  return `${v < 0 ? "−" : ""}€${nf(0).format(Math.abs(v))}`;
}

/** €1.23m, €45k or €780, for tight spaces. */
export function eurShort(v: number): string {
  if (!Number.isFinite(v)) return "–";
  const a = Math.abs(v);
  const s = v < 0 ? "−€" : "€";
  if (a >= 1e6) return `${s}${nf(2).format(a / 1e6)}m`;
  if (a >= 1e4) return `${s}${nf(0).format(a / 1e3)}k`;
  return `${s}${nf(0).format(a)}`;
}

/** A round step for axis ticks: 1, 2 or 5 times a power of ten. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}
