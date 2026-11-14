"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Participants" },
  { href: "/robots", label: "Robots" },
];

/** Switches between the nurse app's views. */
export function NurseNav() {
  const path = usePathname();
  return (
    <nav aria-label="Nurse views" className="flex flex-wrap gap-1">
      {ITEMS.map((i) => {
        const on = path === i.href;
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium ${on ? "border-brand text-brand" : "border-transparent text-muted hover:bg-brand-soft"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
