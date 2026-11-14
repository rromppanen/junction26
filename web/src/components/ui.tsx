import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronDown, EqualApproximately, Info, type LucideIcon } from "lucide-react";
import type { GapStatus } from "@/lib/types";
import { Wordmark } from "./Wordmark";

/**
 * Small shared pieces that keep every screen consistent:
 * icons always sit next to a text label, and secondary text lives behind a disclosure.
 */

/** Ahead / level / behind as an icon (up arrow, ≈, down arrow), so status never depends on colour alone. */
export function StatusIcon({ status, className = "" }: { status: GapStatus; className?: string }) {
  const Icon = status === "ahead" ? ArrowUpRight : status === "behind" ? ArrowDownRight : EqualApproximately;
  return <Icon aria-hidden size={16} strokeWidth={2.25} className={`inline-block shrink-0 ${className}`} />;
}

/** A heading with its icon. */
export function IconHeading({
  icon: Icon,
  children,
  as: Tag = "h2",
  id,
  className = "",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}) {
  return (
    <Tag id={id} className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <Icon aria-hidden size={18} strokeWidth={2} className="shrink-0 text-muted" />
      <span>{children}</span>
    </Tag>
  );
}

/**
 * Progressive disclosure: a labelled toggle that opens extra detail in place.
 * Native <details>, so it works without JavaScript, with the keyboard, and prints open (see globals.css).
 */
export function More({
  label,
  icon: Icon = Info,
  children,
  open = false,
  className = "",
}: {
  label: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
  open?: boolean;
  className?: string;
}) {
  return (
    <details open={open} className={`more group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-2 text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <Icon aria-hidden size={15} strokeWidth={2} className="shrink-0" />
        <span>{label}</span>
        <ChevronDown aria-hidden size={14} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

/** The bar at the top of every page: the wordmark left, page actions right. */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule pb-4">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Wordmark />
      {children && <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">{children}</div>}
    </header>
  );
}

/** A compact header action: icon plus a short label, always both (an icon alone is easy to misread). */
export function HeaderLink({
  href,
  icon: Icon,
  label,
  download,
  title,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  download?: boolean;
  /** Longer description shown on hover. */
  title?: string;
}) {
  const cls =
    "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 py-2 text-ink hover:bg-par-soft focus-visible:bg-par-soft";
  const inner = (
    <>
      <Icon aria-hidden size={16} strokeWidth={2} className="shrink-0" />
      <span>{label}</span>
    </>
  );
  return download ? (
    <a href={href} download className={cls} title={title ?? label}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls} title={title ?? label}>
      {inner}
    </Link>
  );
}

/** A big figure with a small label under it. */
export function Stat({ value, label, tone = "" }: { value: React.ReactNode; label: React.ReactNode; tone?: string }) {
  return (
    <div>
      <div className={`text-3xl font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-4xl ${tone}`}>{value}</div>
      <div className="mt-1.5 text-sm text-muted">{label}</div>
    </div>
  );
}
