"use client";

import { useState } from "react";
import { Autopilot } from "./Autopilot";

type Who = "me" | "me-cx";

const OPTIONS: { who: Who; label: string }[] = [
  { who: "me", label: "Aino (bowel)" },
  { who: "me-cx", label: "Sanna (cervical)" },
];

export function DemoStage() {
  const [who, setWho] = useState<Who>("me");
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Autopilot onWho={setWho} />
        <div role="group" aria-label="Phone shows" className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Phone shows:</span>
          {OPTIONS.map((o) => (
            <button
              key={o.who}
              type="button"
              aria-pressed={who === o.who}
              onClick={() => setWho(o.who)}
              className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1 text-sm font-medium ${
                who === o.who ? "border-brand bg-brand text-white" : "border-rule bg-white hover:bg-brand-soft"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-brand-soft p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-center gap-8 min-[1100px]:flex-nowrap">
          <figure className="flex shrink-0 flex-col items-center gap-3">
            <div className="rounded-[2.75rem] bg-ink p-2.5 shadow-[0_24px_60px_-20px_rgba(18,39,46,0.35)]">
              <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
                <div aria-hidden className="absolute left-1/2 top-2 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-ink" />
                <iframe src={`/kit?embed=1&who=${who}`} title="Phone app" className="block h-[760px] w-[375px] max-w-full border-0 bg-white" />
              </div>
            </div>
            <figcaption className="text-xs text-muted">The person (phone)</figcaption>
          </figure>
          <figure className="flex min-w-0 flex-1 basis-[28rem] flex-col gap-3">
            <iframe src="/staff?embed=1" title="Nurse board" className="block h-[800px] w-full rounded-xl border border-rule bg-white" />
            <figcaption className="text-xs text-muted">The screening nurse</figcaption>
          </figure>
        </div>
      </div>
    </>
  );
}
