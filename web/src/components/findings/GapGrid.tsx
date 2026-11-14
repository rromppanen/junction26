"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusIcon } from "@/components/ui";
import { FadeIn } from "@/components/intake/fade";
import { METRIC_LABEL, gapId, impactOf, type Finding } from "@/lib/gaps";
import { KIND_ICON, groupPhrase, impactText } from "./groupWords";

/** Boxes arrive one after another, but a long list must not keep the reader waiting. */
const STAGGER_MS = 90;
const MAX_DELAY_MS = 1100;

const pct = (v: number | null) => (v === null ? "–" : `${v.toFixed(0)}%`);

/** Every gap found, as a grid of boxes ranked by what closing it would be worth. Each opens its own dashboard. */
export function GapGrid({ findings, delay = 0 }: { findings: Finding[]; delay?: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {findings.map((f, i) => {
        const Icon = KIND_ICON[f.dimension.kind];
        const wait = f.metric === "wait";
        const g = f.group;
        return (
          <li key={gapId(f)}>
            <FadeIn delay={delay + Math.min(i * STAGGER_MS, MAX_DELAY_MS)} className="h-full">
              <Link
                href={`/findings/${encodeURIComponent(gapId(f))}`}
                className="group flex h-full flex-col rounded-[6px] border border-rule bg-surface p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_6px_20px_-12px_rgba(23,34,38,0.35)] focus-visible:border-ink"
              >
                <div className="flex items-center justify-between gap-2 text-caption text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon aria-hidden size={14} />
                    {f.dimension.label}
                  </span>
                  <span className="tabular-nums">#{i + 1}</span>
                </div>
                <p className="mt-3 font-semibold leading-snug">{groupPhrase(f.dimension.kind, f.dimension.label, g.value)}</p>
                <p className="text-small text-muted">{METRIC_LABEL[f.metric]}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="text-behind">
                    <span className="inline-flex items-center gap-1 text-title font-semibold leading-none tabular-nums">
                      <StatusIcon status="behind" />
                      {wait ? `+${g.gap!.toFixed(0)}` : `−${Math.abs(g.gap!).toFixed(0)}`}
                    </span>
                    <span className="ml-1 text-caption">{wait ? "days" : "points"}</span>
                  </div>
                  <span className="text-small tabular-nums text-muted">
                    {wait ? `${g.figure!.toFixed(0)} vs ${g.rest!.toFixed(0)} days` : `${pct(g.figure)} vs ${pct(g.rest)}`}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-rule pt-3 text-small">
                  <span className="font-medium">{impactText(f.metric, impactOf(f))}</span>
                  <ArrowRight aria-hidden size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
              </Link>
            </FadeIn>
          </li>
        );
      })}
    </ol>
  );
}
