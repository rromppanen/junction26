import { isOtherLanguage, slotsAfter, type Invitee, type InviteEvent, type Lang } from "./model";

/** The woman on the phone in the demo. */
export const ME = "me";

const DAY = 86_400_000;

/**
 * Attendance at the first booked time, by language group. Helsinki's 2024 split as estimated by the invitation
 * designer (77% and 56%); used only to make the invented round look like a real one.
 */
const FIRST_TIME_RATE = { native: 0.77, other: 0.56 } as const;

const NAMES: Record<Lang, { first: string[]; last: string[] }> = {
  fi: { first: ["Aino", "Leena", "Marja", "Tuula", "Riitta", "Sari", "Päivi", "Anne", "Eeva", "Hannele", "Kirsi", "Satu"], last: ["Virtanen", "Korhonen", "Nieminen", "Mäkinen", "Hämäläinen", "Laine", "Heikkinen", "Koskinen", "Järvinen", "Lehtonen"] },
  sv: { first: ["Anna", "Karin", "Margareta", "Birgitta", "Ulla"], last: ["Lindholm", "Nyström", "Sjöberg", "Westerlund"] },
  en: { first: ["Mary", "Linda", "Grace", "Joy"], last: ["Okafor", "Smith", "Mensah", "Brown"] },
  ru: { first: ["Olga", "Irina", "Natalia", "Svetlana", "Tatiana"], last: ["Ivanova", "Smirnova", "Petrova", "Volkova"] },
  ar: { first: ["Fatima", "Layla", "Huda", "Samira", "Nadia"], last: ["Al-Sayed", "Karim", "Haddad", "Mansour"] },
};

const DISTRICTS = ["Itäkeskus", "Kontula", "Mellunmäki", "Vuosaari", "Herttoniemi", "Myllypuro"];

/** Small seeded generator so the round is the same on every reset and in tests. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickLang(r: number): Lang {
  // About one in six invited women in eastern Helsinki has another mother tongue.
  if (r < 0.78) return "fi";
  if (r < 0.84) return "sv";
  if (r < 0.92) return "ru";
  if (r < 0.97) return "ar";
  return "en";
}

/** An invented round: appointments from four weeks ago to three weeks ahead, plus the demo woman. */
export function seedInvitees(now: number, count = 72, seed = 2026): Invitee[] {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const list: Invitee[] = [];

  for (let i = 0; i < count; i++) {
    const lang = pickLang(rand());
    const other = isOtherLanguage(lang);
    const n = NAMES[lang];
    const person = {
      id: `HEL-${String(1000 + i * 7).padStart(4, "0")}`,
      name: `${pick(n.first)} ${pick(n.last)[0]}.`,
      age: 50 + Math.floor(rand() * 20),
      district: pick(DISTRICTS),
      lang,
    };
    const dayOffset = Math.floor(rand() * 49) - 28; // −28 … +20 days
    const slot = slotsAfter(now + dayOffset * DAY - 2 * DAY, 1)[0];
    const events: InviteEvent[] = [{ type: "invited", at: slot - 28 * DAY, slot }];
    const sentAt = slot - 2 * DAY;
    if (sentAt < now) events.push({ type: "smsSent", at: sentAt });

    let appointment = slot;
    if (rand() < 0.1 && slot - 10 * DAY < now) {
      appointment = slotsAfter(slot, 1, 5)[0];
      events.push({ type: "rebooked", at: slot - 10 * DAY, slot: appointment });
      if (appointment - 2 * DAY < now) events.push({ type: "smsSent", at: appointment - 2 * DAY });
    }

    if (appointment < now) {
      if (rand() < FIRST_TIME_RATE[other ? "other" : "native"]) {
        events.push({ type: "attended", at: appointment + 15 * 60_000 });
      } else if (rand() < 0.2) {
        events.push({ type: "elsewhereReported", at: appointment - DAY, note: "Private clinic, spring 2026" });
        if (appointment + 3 * DAY < now) events.push({ type: "elsewhereVerified", at: appointment + 3 * DAY });
      } else {
        events.push({ type: "missed", at: appointment + 60 * 60_000 });
        const resend = appointment + 3 * DAY;
        if (resend < now && rand() < 0.75) {
          const second = slotsAfter(resend, 1, 14)[0];
          events.push({ type: "secondBooked", at: resend, slot: second });
          if (second < now) {
            if (rand() < 0.3) events.push({ type: "attended", at: second + 15 * 60_000 });
            else {
              events.push({ type: "missed", at: second + 60 * 60_000 });
              if (other && second + DAY < now) events.push({ type: "callQueued", at: second + DAY });
            }
          }
        }
      }
    }
    list.push({ id: person.id, person, events });
  }

  const mine = slotsAfter(now, 1, 5)[0];
  list.unshift({
    id: ME,
    person: { id: ME, name: "Samira H.", age: 52, district: "Itäkeskus", lang: "ar" },
    events: [{ type: "invited", at: now - 21 * DAY, slot: mine }],
  });
  return list;
}
