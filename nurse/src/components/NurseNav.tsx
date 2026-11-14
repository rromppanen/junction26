"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Board" },
  { href: "/robots", label: "Robots" },
];

/** Switches between the nurse app's views. */
export function NurseNav() {
  const path = usePathname();
  return (
    <nav aria-label="Nurse views" className="flex gap-1 rounded-full border border-rule bg-white p-1">
      {ITEMS.map((i) => {
        const on = path === i.href;
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium ${on ? "bg-brand text-white" : "hover:bg-brand-soft"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
