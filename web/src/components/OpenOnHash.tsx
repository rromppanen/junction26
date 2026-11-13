"use client";

import { useEffect } from "react";

/**
 * When a link jumps to an anchor inside a closed <details> (e.g. a source citation "#src-3"),
 * open the surrounding disclosures so the target is visible. Some browsers do this themselves; this
 * makes it consistent.
 */
export function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      let el = document.getElementById(id)?.parentElement ?? null;
      let changed = false;
      while (el) {
        if (el instanceof HTMLDetailsElement && !el.open) {
          el.open = true;
          changed = true;
        }
        el = el.parentElement;
      }
      if (changed) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    // Printing shows every disclosure (globals.css does this too where ::details-content is supported).
    const openAll = () => document.querySelectorAll<HTMLDetailsElement>("details.more").forEach((d) => (d.open = true));
    open();
    window.addEventListener("hashchange", open);
    window.addEventListener("beforeprint", openAll);
    return () => {
      window.removeEventListener("hashchange", open);
      window.removeEventListener("beforeprint", openAll);
    };
  }, []);
  return null;
}
