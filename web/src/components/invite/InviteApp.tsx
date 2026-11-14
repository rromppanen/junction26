"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, Check, ChevronDown, MapPin, MessageSquare, Phone } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { slotsAfter, statusOf, type Lang } from "@/lib/invite/model";
import { ME } from "@/lib/invite/seed";
import { useInvitees } from "@/lib/invite/store";
import { LOCALES, RTL, STRINGS } from "./strings";

const LANGS: Lang[] = ["fi", "sv", "en", "ru", "ar"];
const LANG_KEY = "invite.phone.lang";

type View = "main" | "slots" | "elsewhere" | "optOut";

function Primary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-base font-semibold text-white hover:bg-brand-strong">
      {children}
    </button>
  );
}

function Secondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-rule bg-white px-4 text-start text-sm font-medium hover:bg-brand-soft">
      {children}
    </button>
  );
}

export function InviteApp() {
  const { list, now, add } = useInvitees();
  const [mounted, setMounted] = useState(false);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [view, setView] = useState<View>("main");
  const [when, setWhen] = useState(0);
  const [where, setWhere] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const v = window.localStorage.getItem(LANG_KEY) as Lang | null;
      if (v && LANGS.includes(v)) setChosen(v);
    } catch {
      /* storage blocked */
    }
  }, []);

  const me = list.find((i) => i.id === ME);
  const lang: Lang = chosen ?? me?.person.lang ?? "fi";
  const t = STRINGS[lang];
  const fmt = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang], { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
    [lang],
  );
  const short = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang], { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }),
    [lang],
  );
  const slots = useMemo(() => slotsAfter(now, 6, 2), [Math.floor(now / 86_400_000)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the local view when the board (or a reset) changes her state.
  const stageKey = me ? `${statusOf(me).stage}:${me.events.length}` : "";
  useEffect(() => setView("main"), [stageKey]);

  function chooseLang(l: Lang) {
    setChosen(l);
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-dvh bg-paper sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-8">
      <div
        dir={RTL[lang] ? "rtl" : "ltr"}
        lang={LOCALES[lang]}
        className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-surface sm:min-h-[760px] sm:rounded-[2rem] sm:border sm:border-rule sm:shadow-xl"
      >
        {!mounted || !me ? (
          <div className="flex-1 p-5" aria-busy="true"><Wordmark /></div>
        ) : (
          screen()
        )}
      </div>
    </main>
  );

  function screen() {
    if (!me) return null;
    const s = statusOf(me);
    const first = me.person.name.split(" ")[0];
    const lastSms = [...me.events].reverse().find((e) => e.type === "smsSent");
    const showSms = lastSms && s.stage === "booked" && s.appointment !== null && lastSms.at > now - 3 * 86_400_000;

    return (
      <>
        <header className="space-y-3 px-5 pt-5">
          <div className="flex items-center justify-between gap-2">
            <Wordmark />
            <label className="relative flex items-center">
              <span className="sr-only">Language</span>
              <select
                value={lang}
                onChange={(e) => chooseLang(e.target.value as Lang)}
                className="min-h-11 appearance-none rounded-lg border border-rule bg-white pe-8 ps-3 text-sm font-semibold"
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>{STRINGS[l].langName}</option>
                ))}
              </select>
              <ChevronDown aria-hidden size={14} className="pointer-events-none absolute end-2.5 text-muted" />
            </label>
          </div>
          {showSms && s.appointment !== null && (
            <div role="status" className="flex gap-3 rounded-2xl bg-ink p-3 text-sm text-white shadow-lg">
              <MessageSquare aria-hidden size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold opacity-80">{t.smsFrom}</div>
                <p>{t.sms(short.format(s.appointment))}</p>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 space-y-5 px-5 py-6" aria-live="polite">
          <h1 className="text-xl font-semibold leading-snug">{t.appTitle}</h1>

          {view === "slots" && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{t.chooseTime}</h2>
              <ul className="grid gap-2">
                {slots.map((slot) => (
                  <li key={slot}>
                    <Secondary onClick={() => add(ME, { type: s.stage === "missed" ? "secondBooked" : "rebooked", slot })}>
                      <CalendarClock aria-hidden size={18} className="shrink-0 text-brand" />
                      {fmt.format(slot)}
                    </Secondary>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setView("main")} className="min-h-11 text-sm text-muted underline">{t.back}</button>
            </section>
          )}

          {view === "elsewhere" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                add(ME, { type: "elsewhereReported", note: `${STRINGS.en.monthsAgo[when]}${where ? `, ${where}` : ""}` });
              }}
            >
              <h2 className="text-lg font-semibold">{t.elsewhereHeading}</h2>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t.elsewhereWhen}</legend>
                {t.monthsAgo.map((m, i) => (
                  <label key={m} className="flex min-h-11 items-center gap-3 rounded-lg border border-rule bg-white px-3 text-sm">
                    <input type="radio" name="when" checked={when === i} onChange={() => setWhen(i)} className="size-4" />
                    {m}
                  </label>
                ))}
              </fieldset>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">{t.elsewhereWhere}</span>
                <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder={t.elsewhereWherePlaceholder} className="min-h-11 rounded-lg border border-rule bg-white px-3" />
              </label>
              <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 font-semibold text-white hover:bg-brand-strong">{t.send}</button>
              <button type="button" onClick={() => setView("main")} className="min-h-11 text-sm text-muted underline">{t.back}</button>
            </form>
          )}

          {view === "optOut" && (
            <section className="space-y-3">
              <p>{t.optOutAsk}</p>
              <Secondary onClick={() => add(ME, { type: "optedOut" })}>{t.optOutYes}</Secondary>
              <button type="button" onClick={() => setView("main")} className="min-h-11 text-sm text-muted underline">{t.back}</button>
            </section>
          )}

          {view === "main" && main()}
        </div>
        <p className="px-5 pb-4 text-[0.6875rem] text-muted" dir="ltr" lang="en">Demo: invented person. Translations are drafts for review.</p>
      </>
    );

    function main() {
      if (!me) return null;
      switch (s.stage) {
        case "booked":
          return (
            <>
              <p>{t.hello(first)}</p>
              {s.attempt === 1 && <p className="text-sm leading-relaxed text-muted">{t.intro}</p>}
              <section className="space-y-3 rounded-xl border border-rule bg-white p-4">
                <h2 className="font-semibold">{s.attempt > 1 ? t.secondHeading : t.bookedHeading}</h2>
                <div className="flex items-start gap-3">
                  <CalendarCheck aria-hidden size={20} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <div className="text-xs text-muted">{t.when}</div>
                    <div className="font-semibold">{s.appointment !== null ? fmt.format(s.appointment) : ""}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin aria-hidden size={20} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <div className="text-xs text-muted">{t.where}</div>
                    <div>{t.place}</div>
                  </div>
                </div>
                <ul className="space-y-1.5 border-t border-rule pt-3">
                  {t.facts.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check aria-hidden size={16} className="mt-0.5 shrink-0 text-brand" />{f}
                    </li>
                  ))}
                </ul>
              </section>
              {s.confirmed ? (
                <p className="flex items-center gap-2 rounded-xl bg-brand-soft p-3 font-medium text-brand-strong">
                  <Check aria-hidden size={18} /> {t.confirmed}
                </p>
              ) : (
                <Primary onClick={() => add(ME, { type: "confirmed" })}>{t.confirm}</Primary>
              )}
              <div className="grid gap-2">
                <Secondary onClick={() => setView("slots")}><CalendarClock aria-hidden size={18} className="shrink-0 text-brand" />{t.change}</Secondary>
                <Secondary onClick={() => setView("elsewhere")}><Check aria-hidden size={18} className="shrink-0 text-brand" />{t.elsewhere}</Secondary>
                <Secondary onClick={() => add(ME, { type: "callbackRequested" })}><Phone aria-hidden size={18} className="shrink-0 text-brand" />{t.callMe}</Secondary>
              </div>
              <button type="button" onClick={() => setView("optOut")} className="min-h-11 text-sm text-muted underline">{t.optOut}</button>
              <Explainer />
            </>
          );
        case "missed":
          return (
            <>
              <section className="space-y-2 rounded-xl border border-rule bg-white p-4">
                <h2 className="font-semibold">{t.missedHeading}</h2>
                <p className="text-sm text-muted">{t.missedBody}</p>
              </section>
              <Primary onClick={() => setView("slots")}>{t.chooseTime}</Primary>
              <Secondary onClick={() => add(ME, { type: "callbackRequested" })}><Phone aria-hidden size={18} className="shrink-0 text-brand" />{t.callMe}</Secondary>
            </>
          );
        case "call":
          return <Note icon={<Phone aria-hidden size={20} />} text={t.callQueued} />;
        case "elsewherePending":
          return <Note icon={<Check aria-hidden size={20} />} text={t.elsewhereSent} />;
        case "elsewhere":
          return <Note icon={<Check aria-hidden size={20} />} text={t.elsewhereVerified} />;
        case "optedOut":
          return (
            <>
              <Note text={t.optedOut} />
              <Secondary onClick={() => setView("slots")}><CalendarClock aria-hidden size={18} className="shrink-0 text-brand" />{t.chooseTime}</Secondary>
            </>
          );
        case "attended":
          return (
            <>
              <section className="space-y-2 rounded-xl bg-brand-soft p-4">
                <h2 className="text-lg font-semibold text-brand-strong">{t.attendedHeading}</h2>
                <p className="text-sm">{t.attendedBody}</p>
              </section>
            </>
          );
      }
    }

    function Explainer() {
      return (
        <div className="space-y-4 border-t border-rule pt-5 text-sm">
          <section>
            <h2 className="font-semibold">{t.whatHappensHeading}</h2>
            <ol className="mt-2 list-decimal space-y-1 ps-5 text-muted">
              {t.whatHappens.map((w) => <li key={w}>{w}</li>)}
            </ol>
          </section>
          <section>
            <h2 className="font-semibold">{t.resultsHeading}</h2>
            <p className="mt-1 text-muted">{t.results}</p>
          </section>
        </div>
      );
    }
  }
}

function Note({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <section className="flex gap-3 rounded-xl border border-rule bg-white p-4">
      {icon && <span className="mt-0.5 shrink-0 text-brand">{icon}</span>}
      <p>{text}</p>
    </section>
  );
}
