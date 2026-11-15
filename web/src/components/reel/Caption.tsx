"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CaptionItem } from "./captions";

/** How long a caption takes to leave (reel-slot-out in reel.css, with its stagger); the next one waits for it. */
export const CAPTION_LEAVE_MS = 750;

const wordCount = (item: CaptionItem) => item.text.split(/\s+/).length;

/** How long a caption takes to arrive: the words roll in one after another, then the source fades in. */
export const arrivingMs = (item: CaptionItem) => Math.min(wordCount(item), 34) * 30 + 900;

/** How long a caption stays once it has arrived: a moment to notice it, then about six words a second (the voice-over carries the rest). */
export const readingMs = (item: CaptionItem) => 600 + wordCount(item) * 150;

type Shown = { key: number; item: CaptionItem; leaving: boolean };

/**
 * The reel's big on-screen text. Changing `item` cycles it: each word sits in a band that clips it, the
 * old words roll up out of their bands, and only once they are gone do the new ones roll up in, followed
 * by the source. null clears it. Only one caption is ever on screen, so the layout never changes under
 * visible text. With `panel` it sits on a white card (over the map), anchored at its top, that eases to
 * each caption's height.
 */
export function Caption({ item, panel, style }: { item: CaptionItem | null; panel?: boolean; style?: React.CSSProperties }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const nextKey = useRef(0);
  const wanted = useRef<CaptionItem | null>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wanted.current = item;
    if (!shown) {
      if (item) setShown({ key: nextKey.current++, item, leaving: false });
      return;
    }
    if (shown.item === item && !shown.leaving) return;
    if (!shown.leaving) setShown({ ...shown, leaving: true });
    // Once the old caption is gone, show whatever is wanted by then.
    const t = setTimeout(() => {
      const next = wanted.current;
      setShown(next ? { key: nextKey.current++, item: next, leaving: false } : null);
    }, CAPTION_LEAVE_MS);
    return () => clearTimeout(t);
    // Only a new item starts a change; `shown` is read as it is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // The card takes each new caption's height before it is painted, and eases there.
  useLayoutEffect(() => {
    if (shown && !shown.leaving && content.current) setHeight(content.current.offsetHeight);
  }, [shown]);

  const on = Boolean(item) || Boolean(shown && !shown.leaving);
  return (
    <div aria-live="polite"
      className={`reel-caption pointer-events-none fixed z-50 ${panel ? "reel-caption-panel" : "-translate-y-1/2"} ${on ? "reel-caption-on" : ""}`}
      style={style}>
      <div className="reel-caption-box" style={panel && height !== null ? { height } : undefined}>
        <div ref={content} className="reel-caption-pad">
          {shown && <Lines key={shown.key} item={shown.item} leaving={shown.leaving} />}
        </div>
      </div>
    </div>
  );
}

type Word = { w: string; hl: "" | "hl" | "big"; space: boolean };

/** **bold** marks a highlight and ##hashes## a larger one. `space` is whether a space follows the word: none between a highlight and the punctuation after it ("24%."). */
function parse(text: string): Word[] {
  const words: Word[] = [];
  let joined = false; // the previous part ended in the middle of a word
  for (const part of text.split(/(\*\*[^*]+\*\*|##[^#]+##)/)) {
    if (!part) continue;
    const hl = part.startsWith("**") ? "hl" : part.startsWith("##") ? "big" : "";
    const t = part.replace(/\*\*|##/g, "");
    if (joined && words.length && !/^\s/.test(t)) words[words.length - 1].space = false;
    for (const w of t.split(/\s+/)) if (w) words.push({ w, hl, space: true });
    joined = !/\s$/.test(t);
  }
  return words;
}

function Lines({ item, leaving }: { item: CaptionItem; leaving: boolean }) {
  const words = parse(item.text);
  return (
    <div className={leaving ? "reel-caption-leaving" : ""} aria-hidden={leaving || undefined}
      style={{ "--wn": words.length } as React.CSSProperties}>
      <p className="font-heading text-[length:var(--reel-caption-size)] font-semibold leading-[1.18] tracking-[-0.015em] text-ink">
        {words.map(({ w, hl, space }, i) => (
          <span key={i} className={`reel-mask ${hl ? "text-brand" : ""} ${hl === "big" ? "reel-word-big" : ""}`}>
            <span className="reel-slot" style={{ "--i": i } as React.CSSProperties}>{w}</span>{space ? " " : ""}
          </span>
        ))}
      </p>
      {item.source && (
        <p className="reel-source mt-5 text-[length:var(--reel-source-size)] lowercase leading-snug text-muted">{item.source}</p>
      )}
    </div>
  );
}
