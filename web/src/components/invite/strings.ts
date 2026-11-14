import type { Lang } from "@/lib/invite/model";

/**
 * What the woman reads, in her registered language. Demo drafts: a professional medical translator must check
 * the Russian and Arabic, and the Finnish and Swedish, before real use.
 */
export type InviteStrings = {
  langName: string;
  appTitle: string;
  hello: (name: string) => string;
  intro: string;
  bookedHeading: string;
  when: string;
  where: string;
  place: string;
  facts: string[];
  confirm: string;
  change: string;
  elsewhere: string;
  callMe: string;
  optOut: string;
  confirmed: string;
  chooseTime: string;
  back: string;
  newTime: string;
  elsewhereHeading: string;
  elsewhereWhen: string;
  elsewhereWhere: string;
  elsewhereWherePlaceholder: string;
  send: string;
  elsewhereSent: string;
  elsewhereVerified: string;
  callQueued: string;
  optOutAsk: string;
  optOutYes: string;
  optedOut: string;
  missedHeading: string;
  missedBody: string;
  secondHeading: string;
  attendedHeading: string;
  attendedBody: string;
  whatHappensHeading: string;
  whatHappens: string[];
  resultsHeading: string;
  results: string;
  smsFrom: string;
  sms: (when: string) => string;
  months: string;
  monthsAgo: string[];
};

export const LOCALES: Record<Lang, string> = { fi: "fi-FI", sv: "sv-FI", en: "en-GB", ru: "ru-RU", ar: "ar" };
export const RTL: Record<Lang, boolean> = { fi: false, sv: false, en: false, ru: false, ar: true };

export const STRINGS: Record<Lang, InviteStrings> = {
  fi: {
    langName: "Suomi",
    appTitle: "Kutsu rintasyöpäseulontaan",
    hello: (n) => `Hei ${n},`,
    intro: "Sinut kutsutaan maksuttomaan mammografiaan. Se löytää rintasyövän varhain, ennen kuin sitä voi tuntea. Kaikki 50–69-vuotiaat naiset kutsutaan kahden vuoden välein.",
    bookedHeading: "Olemme varanneet sinulle ajan",
    when: "Aika",
    where: "Paikka",
    place: "Seulontayksikkö, Itäkeskus, Turunlinnantie 8",
    facts: ["Käynti kestää noin 10 minuuttia.", "Tutkimus on maksuton.", "Tutkimuksen tekee naisröntgenhoitaja.", "Ota mukaan henkilöllisyystodistus."],
    confirm: "Aika sopii minulle",
    change: "Vaihda aikaa",
    elsewhere: "Minulta on otettu mammografia muualla",
    callMe: "Soittakaa minulle, minulla on kysyttävää",
    optOut: "En halua osallistua",
    confirmed: "Kiitos! Nähdään vastaanotolla.",
    chooseTime: "Valitse uusi aika",
    back: "Takaisin",
    newTime: "Uusi aikasi",
    elsewhereHeading: "Missä ja milloin?",
    elsewhereWhen: "Milloin",
    elsewhereWhere: "Missä",
    elsewhereWherePlaceholder: "esim. työterveys tai yksityinen klinikka",
    send: "Lähetä",
    elsewhereSent: "Kiitos. Tarkistamme tuloksen Omakannasta. Et saa muistutuksia tällä kierroksella.",
    elsewhereVerified: "Tulos löytyi. Seuraava kutsu tulee noin kahden vuoden päästä.",
    callQueued: "Hoitaja soittaa sinulle kahden arkipäivän kuluessa. Voit kysyä mitä tahansa.",
    optOutAsk: "Haluatko varmasti perua? Voit silti tulla myöhemmin tällä kierroksella.",
    optOutYes: "Kyllä, peru",
    optedOut: "Aika on peruttu. Et saa muistutuksia tällä kierroksella. Voit varata ajan myöhemmin.",
    missedHeading: "Et päässyt paikalle",
    missedBody: "Ei haittaa. Valitse uusi aika alta.",
    secondHeading: "Varasimme sinulle uuden ajan",
    attendedHeading: "Kiitos, että kävit!",
    attendedBody: "Saat tuloksen kirjeellä noin kahden viikon kuluessa. Jos tarvitaan lisätutkimuksia, soitamme sinulle. Se ei tarkoita, että sinulla on syöpä.",
    whatHappensHeading: "Mitä käynnillä tapahtuu",
    whatHappens: ["Riisut yläosan pukukopissa.", "Hoitaja asettaa rinnan laitteeseen. Puristus kestää muutaman sekunnin, ja se voi tuntua epämukavalta.", "Kustakin rinnasta otetaan kaksi kuvaa."],
    resultsHeading: "Tulokset",
    results: "Useimmilla tulos on normaali. Jos tarvitsemme tarkemman kuvan, soitamme sinulle. Se ei tarkoita, että sinulla on syöpä.",
    smsFrom: "Seulonta",
    sms: (w) => `Muistutus: mammografia ${w}, Itäkeskus. Vaihda aikaa: seulonta.fi/a/7KQ`,
    months: "kuukautta sitten",
    monthsAgo: ["Alle 6 kk sitten", "6–12 kk sitten", "Yli vuosi sitten"],
  },
  sv: {
    langName: "Svenska",
    appTitle: "Kallelse till screening för bröstcancer",
    hello: (n) => `Hej ${n},`,
    intro: "Du kallas till en avgiftsfri mammografi. Den hittar bröstcancer tidigt, innan den går att känna. Alla kvinnor i åldern 50–69 år kallas vartannat år.",
    bookedHeading: "Vi har bokat en tid åt dig",
    when: "Tid",
    where: "Plats",
    place: "Screeningenheten, Östra centrum, Åbo slottsväg 8",
    facts: ["Besöket tar cirka 10 minuter.", "Undersökningen är avgiftsfri.", "Undersökningen görs av en kvinnlig röntgenskötare.", "Ta med identitetsbevis."],
    confirm: "Tiden passar mig",
    change: "Byt tid",
    elsewhere: "Jag har gjort mammografi någon annanstans",
    callMe: "Ring mig, jag har frågor",
    optOut: "Jag vill inte delta",
    confirmed: "Tack! Vi ses på mottagningen.",
    chooseTime: "Välj en ny tid",
    back: "Tillbaka",
    newTime: "Din nya tid",
    elsewhereHeading: "Var och när?",
    elsewhereWhen: "När",
    elsewhereWhere: "Var",
    elsewhereWherePlaceholder: "t.ex. företagshälsovården eller en privat klinik",
    send: "Skicka",
    elsewhereSent: "Tack. Vi kontrollerar resultatet i Mina Kanta-sidor. Du får inga påminnelser denna omgång.",
    elsewhereVerified: "Resultatet hittades. Nästa kallelse kommer om cirka två år.",
    callQueued: "En skötare ringer dig inom två vardagar. Du kan fråga vad du vill.",
    optOutAsk: "Vill du säkert avboka? Du kan ändå komma senare under denna omgång.",
    optOutYes: "Ja, avboka",
    optedOut: "Tiden är avbokad. Du får inga påminnelser denna omgång. Du kan boka en tid senare.",
    missedHeading: "Du kom inte till din tid",
    missedBody: "Det gör inget. Välj en ny tid nedan.",
    secondHeading: "Vi har bokat en ny tid åt dig",
    attendedHeading: "Tack för att du kom!",
    attendedBody: "Du får resultatet per brev inom cirka två veckor. Om det behövs fler undersökningar ringer vi dig. Det betyder inte att du har cancer.",
    whatHappensHeading: "Vad händer vid besöket",
    whatHappens: ["Du tar av dig på överkroppen i ett omklädningsrum.", "Skötaren placerar bröstet i apparaten. Kompressionen varar några sekunder och kan kännas obehaglig.", "Två bilder tas av varje bröst."],
    resultsHeading: "Resultat",
    results: "De flesta får ett normalt resultat. Om vi behöver en närmare bild ringer vi dig. Det betyder inte att du har cancer.",
    smsFrom: "Screening",
    sms: (w) => `Påminnelse: mammografi ${w}, Östra centrum. Byt tid: seulonta.fi/a/7KQ`,
    months: "månader sedan",
    monthsAgo: ["För under 6 mån sedan", "För 6–12 mån sedan", "För över ett år sedan"],
  },
  en: {
    langName: "English",
    appTitle: "Invitation to breast cancer screening",
    hello: (n) => `Hello ${n},`,
    intro: "You are invited to a free mammogram. It finds breast cancer early, before you can feel it. All women aged 50–69 are invited every two years.",
    bookedHeading: "We have booked a time for you",
    when: "When",
    where: "Where",
    place: "Screening unit, Itäkeskus, Turunlinnantie 8",
    facts: ["The visit takes about 10 minutes.", "It is free.", "A female radiographer does the examination.", "Bring an ID."],
    confirm: "This time suits me",
    change: "Change the time",
    elsewhere: "I had a mammogram somewhere else",
    callMe: "Call me, I have questions",
    optOut: "I do not want to take part",
    confirmed: "Thank you! See you at the appointment.",
    chooseTime: "Choose a new time",
    back: "Back",
    newTime: "Your new time",
    elsewhereHeading: "Where and when?",
    elsewhereWhen: "When",
    elsewhereWhere: "Where",
    elsewhereWherePlaceholder: "e.g. occupational health or a private clinic",
    send: "Send",
    elsewhereSent: "Thank you. We will check the result in Kanta. You will get no reminders this round.",
    elsewhereVerified: "We found the result. Your next invitation comes in about two years.",
    callQueued: "A nurse will call you within two working days. You can ask anything.",
    optOutAsk: "Do you want to cancel? You can still come later this round.",
    optOutYes: "Yes, cancel",
    optedOut: "Your time is cancelled. You will get no reminders this round. You can book a time later.",
    missedHeading: "You missed your time",
    missedBody: "That is fine. Choose a new time below.",
    secondHeading: "We have booked a new time for you",
    attendedHeading: "Thank you for coming!",
    attendedBody: "You will get the result by letter within about two weeks. If we need more tests, we will call you. That does not mean you have cancer.",
    whatHappensHeading: "What happens at the visit",
    whatHappens: ["You undress to the waist in a changing room.", "The radiographer places your breast in the machine. It presses for a few seconds and can feel uncomfortable.", "Two pictures are taken of each breast."],
    resultsHeading: "Results",
    results: "Most women have a normal result. If we need a closer look, we will call you. That does not mean you have cancer.",
    smsFrom: "Screening",
    sms: (w) => `Reminder: mammogram ${w}, Itäkeskus. Change time: seulonta.fi/a/7KQ`,
    months: "months ago",
    monthsAgo: ["Less than 6 months ago", "6–12 months ago", "Over a year ago"],
  },
  ru: {
    langName: "Русский",
    appTitle: "Приглашение на скрининг рака молочной железы",
    hello: (n) => `Здравствуйте, ${n}!`,
    intro: "Приглашаем вас на бесплатную маммографию. Она находит рак молочной железы рано, когда его ещё нельзя нащупать. Всех женщин в возрасте 50–69 лет приглашают раз в два года.",
    bookedHeading: "Мы записали вас на приём",
    when: "Время",
    where: "Место",
    place: "Отделение скрининга, Итякескус, Turunlinnantie 8",
    facts: ["Визит занимает около 10 минут.", "Обследование бесплатное.", "Обследование проводит женщина-рентгенолаборант.", "Возьмите с собой удостоверение личности."],
    confirm: "Это время мне подходит",
    change: "Изменить время",
    elsewhere: "Я уже сделала маммографию в другом месте",
    callMe: "Позвоните мне, у меня есть вопросы",
    optOut: "Я не хочу участвовать",
    confirmed: "Спасибо! Ждём вас на приёме.",
    chooseTime: "Выберите новое время",
    back: "Назад",
    newTime: "Ваше новое время",
    elsewhereHeading: "Где и когда?",
    elsewhereWhen: "Когда",
    elsewhereWhere: "Где",
    elsewhereWherePlaceholder: "например, служба охраны труда или частная клиника",
    send: "Отправить",
    elsewhereSent: "Спасибо. Мы проверим результат в системе Kanta. В этом раунде напоминаний не будет.",
    elsewhereVerified: "Результат найден. Следующее приглашение придёт примерно через два года.",
    callQueued: "Медсестра позвонит вам в течение двух рабочих дней. Вы можете задать любой вопрос.",
    optOutAsk: "Вы точно хотите отменить? Вы всё равно можете прийти позже в этом раунде.",
    optOutYes: "Да, отменить",
    optedOut: "Приём отменён. В этом раунде напоминаний не будет. Вы можете записаться позже.",
    missedHeading: "Вы не пришли на приём",
    missedBody: "Ничего страшного. Выберите новое время ниже.",
    secondHeading: "Мы записали вас на новое время",
    attendedHeading: "Спасибо, что пришли!",
    attendedBody: "Результат придёт письмом примерно через две недели. Если понадобятся дополнительные обследования, мы позвоним. Это не значит, что у вас рак.",
    whatHappensHeading: "Что происходит на приёме",
    whatHappens: ["Вы раздеваетесь до пояса в кабинке.", "Лаборант помещает грудь в аппарат. Сжатие длится несколько секунд и может быть неприятным.", "Делают по два снимка каждой груди."],
    resultsHeading: "Результаты",
    results: "У большинства женщин результат нормальный. Если нужен более точный снимок, мы позвоним. Это не значит, что у вас рак.",
    smsFrom: "Скрининг",
    sms: (w) => `Напоминание: маммография ${w}, Итякескус. Изменить время: seulonta.fi/a/7KQ`,
    months: "месяцев назад",
    monthsAgo: ["Менее 6 месяцев назад", "6–12 месяцев назад", "Более года назад"],
  },
  ar: {
    langName: "العربية",
    appTitle: "دعوة لفحص سرطان الثدي",
    hello: (n) => `مرحبًا ${n}،`,
    intro: "ندعوكِ إلى تصوير الثدي بالأشعة (الماموغرام) مجانًا. يكشف الفحص سرطان الثدي مبكرًا، قبل أن يمكن الإحساس به. تُدعى جميع النساء من عمر 50 إلى 69 عامًا كل سنتين.",
    bookedHeading: "لقد حجزنا لكِ موعدًا",
    when: "الموعد",
    where: "المكان",
    place: "وحدة الفحص، إيتاكيسكوس، Turunlinnantie 8",
    facts: ["تستغرق الزيارة حوالي 10 دقائق.", "الفحص مجاني.", "تُجري الفحص أخصائية أشعة امرأة.", "أحضري بطاقة هوية."],
    confirm: "هذا الموعد يناسبني",
    change: "تغيير الموعد",
    elsewhere: "أجريتُ تصوير الثدي في مكان آخر",
    callMe: "اتصلوا بي، لديّ أسئلة",
    optOut: "لا أريد المشاركة",
    confirmed: "شكرًا لكِ! نراكِ في الموعد.",
    chooseTime: "اختاري موعدًا جديدًا",
    back: "رجوع",
    newTime: "موعدكِ الجديد",
    elsewhereHeading: "أين ومتى؟",
    elsewhereWhen: "متى",
    elsewhereWhere: "أين",
    elsewhereWherePlaceholder: "مثلًا طب العمل أو عيادة خاصة",
    send: "إرسال",
    elsewhereSent: "شكرًا. سنتحقق من النتيجة في نظام Kanta. لن تصلكِ تذكيرات في هذه الجولة.",
    elsewhereVerified: "وجدنا النتيجة. ستصلكِ الدعوة التالية بعد حوالي سنتين.",
    callQueued: "ستتصل بكِ ممرضة تتحدث العربية خلال يومي عمل. يمكنكِ أن تسألي عن أي شيء.",
    optOutAsk: "هل تريدين الإلغاء فعلًا؟ لا يزال بإمكانكِ الحضور لاحقًا في هذه الجولة.",
    optOutYes: "نعم، ألغي الموعد",
    optedOut: "تم إلغاء الموعد. لن تصلكِ تذكيرات في هذه الجولة. يمكنكِ حجز موعد لاحقًا.",
    missedHeading: "فاتكِ الموعد",
    missedBody: "لا بأس. اختاري موعدًا جديدًا أدناه.",
    secondHeading: "حجزنا لكِ موعدًا جديدًا",
    attendedHeading: "شكرًا لحضوركِ!",
    attendedBody: "ستصلكِ النتيجة برسالة خلال أسبوعين تقريبًا. إذا احتجنا إلى فحوصات إضافية فسنتصل بكِ. هذا لا يعني أنكِ مصابة بالسرطان.",
    whatHappensHeading: "ماذا يحدث في الزيارة",
    whatHappens: ["تخلعين ملابسكِ العلوية في غرفة تبديل.", "تضع الأخصائية الثدي في الجهاز. يضغط الجهاز لبضع ثوانٍ وقد يكون ذلك مزعجًا.", "تُلتقط صورتان لكل ثدي."],
    resultsHeading: "النتائج",
    results: "تكون النتيجة طبيعية لدى معظم النساء. إذا احتجنا إلى صورة أدق فسنتصل بكِ. هذا لا يعني أنكِ مصابة بالسرطان.",
    smsFrom: "الفحص",
    sms: (w) => `تذكير: تصوير الثدي ${w}، إيتاكيسكوس. لتغيير الموعد: seulonta.fi/a/7KQ`,
    months: "أشهر مضت",
    monthsAgo: ["منذ أقل من 6 أشهر", "منذ 6 إلى 12 شهرًا", "منذ أكثر من سنة"],
  },
};
