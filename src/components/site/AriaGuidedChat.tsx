import { useEffect, useId, useRef, useState } from "react";
import { ChvostikovoPaw } from "./ChvostikovoPaw";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "./AriaPreviewText";
import { ADDRESS, PHONE, PHONE_PRETTY, PRICING } from "@/content/site";
import { ShortForm, HomeFaqContactForm } from "./Forms";
import { LeadStepForm } from "./LeadStepForm";
import { AriaPuppyChecker } from "./AriaPuppyChecker";
import type { PuppyCheckInput } from "@/lib/inquiry";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackCookielessInteraction, trackAriaChatAction } from "@/lib/cookieless-interactions";
import { hasAnalyticsConsent } from "@/lib/consent";

type ChatMessage = { id: number; side: "person" | "aria"; text: string; questionId?: string; widget?: "puppy" | "puppy_contact" | "interest" | "other" };
type Question = { id: string; title: string; answer: string };

// Display emphasis without showing formatting markers during typewriter animation.
const plainChatText = (value: string) => value.replace(/\*\*/g, "");
function renderChatText(value: string, visibleLength = Number.POSITIVE_INFINITY) {
  let remaining = visibleLength;
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const bold = part.startsWith("**") && part.endsWith("**");
    const text = bold ? part.slice(2, -2) : part;
    const visible = text.slice(0, Math.max(0, remaining));
    remaining -= visible.length;
    if (!visible) return null;
    return bold ? <strong key={index} className="font-extrabold">{visible}</strong> : visible;
  });
}

const priceOne = PRICING.find((item) => !item.highlight)?.price || "25 €";
const pricePass = PRICING.find((item) => item.highlight)?.price || "200 €";
// Ordered ten-question catalogue; keep IDs stable for analytics.
const chatQuestions: Question[] = [
  {
    id: "pricing",
    title: "Aký je cenník škôlky?",
    answer: "Haf! 🐾 **Jednorazový celodenný vstup stojí " + priceOne +
      ".**\nSme otvorení od **7:00 do 17:00**, pondelok až piatok.\n\n" +
      "Ak plánuješ pravidelné návštevy, odporúčame **10-vstupovú permanentku**, kde jeden vstup vychádza na **20 €/deň**. " +
      "Oproti jednorazovým vstupom tak **ušetríš 50 €**. Cena permanentky je **" + pricePass + "** a platí **2 mesiace**.\n\n" +
      "**Podmienkou kúpy permanentky je návšteva škôlky minimálne 2× týždenne.**\n\n" +
      "**Ak máš záujem o škôlku pre svojho psíka, vyplň nezáväzný formulár a moji rodičia sa ti ozvú späť.**",
  },
  {
    id: "requirements",
    title: "Aké sú podmienky prijatia?",
    answer: "Haf! 🐾 Toto sú naše hlavné podmienky prijatia:",
  },
  {
    id: "caretakers",
    title: "Kto sa postará o psíka?",
    answer: "Haf! 🐾 O tvojho psíka sa počas celého pobytu postarajú **Adriana a Marek – moji rodičia!** 🐾\n\nSú to skúsení opatrovatelia, ktorí dohliadajú na spoločnú hru, bezpečné interakcie aj oddych. Každému psíkovi prispôsobujú aktivity podľa jeho potrieb a povahy.\n\nObaja absolvovali **kurz prvej pomoci pre psov**. Najdôležitejšia je pre nich bezpečnosť, individuálny prístup a to, aby sa každý škôlkar cítil príjemne a bez zbytočného stresu.",
  },
  {
    id: "puppy",
    title: "Prijímate aj šteniatka?",
    answer: "Haf! 🐾 Áno, prijímame aj očkované šteniatka **približne od 4 mesiacov**.\n\nZáleží na ich veku, kompletnom očkovaní a pripravenosti na kolektív.\n\nPoďme si spolu **orientačne overiť, či tvoje šteniatko spĺňa základné podmienky**. Konečné rozhodnutie o prijatí urobíme až po úvodnej návšteve.",
  },
  {
    id: "eligibility",
    title: "Pre akých psíkov je škôlka určená?",
    answer: "Haf! 🐾 Naša škôlka je určená najmä pre **stredné a veľké psíky, spravidla nad 15 kg**.\n\nPrijímame aj očkované šteniatka približne od 4 mesiacov.\n\nDôležitá je povaha psíka, jeho zdravotný stav a schopnosť fungovať v kolektíve.\n\nTo, či je naša škôlka vhodná aj pre tvojho psíka, spoločne zistíme počas **bezplatnej úvodnej návštevy**.",
  },
  {
    id: "first_visit",
    title: "Ako prebieha prvá návšteva?",
    answer: "Haf! 🐾 Pred nástupom do škôlky absolvuje každý nový psík **bezplatnú úvodnú návštevu**.\n\nPočas nej sa zoznámime so psíkom, sledujeme jeho správanie a reakcie na nové prostredie, ľudí aj ostatných psov. Postupne ho zoznamujeme s kolektívom.\n\n**Nie každý psík si zvykne rovnako rýchlo.** Ak potrebuje viac času, môžeme odporučiť kratšie adaptačné návštevy a postup prispôsobiť jeho tempu.",
  },
  {
    id: "reservation",
    title: "Je potrebné rezervovať miesto vopred?",
    answer: "Haf! 🐾 Áno, **miesto v škôlke je potrebné rezervovať vopred**, pretože máme obmedzenú kapacitu a chceme každému psíkovi zabezpečiť dostatok pozornosti.\n\nNaši škôlkari si rezervujú návštevy jednoducho cez **zákaznícku aplikáciu**, do nedele 20:00 na nasledujúci týždeň.\n\nAk máš nepravidelný pracovný rozvrh, **vieme sa dohodnúť aj individuálne** podľa voľnej kapacity.\n\nAk k nám tvoj psík ešte nechodí, najprv spolu absolvujeme bezplatnú úvodnú návštevu.",
  },
  {
    id: "location",
    title: "Kde sa škôlka nachádza?",
    answer: "Haf! 🐾 Nájdeš nás v **Košiciach na " + (ADDRESS.street === "Poľská 6" ? "Poľskej 6" : ADDRESS.street) + "**.\n\nMáme vlastné vnútorné priestory aj vonkajší výbeh, kde si naši škôlkari môžu užívať deň plný hier, pohybu a oddychu.\n\nNa našej stránke nájdeš aj **mapu a kontakt**, aby si nás jednoducho našiel.",
  },
  {
    id: "space",
    title: "Aké priestory má škôlka?",
    answer: "Haf! 🐾 Naši škôlkari majú k dispozícii **vyhrievané vnútorné priestory** na hru aj oddych a vlastný **vonkajší výbeh s rozlohou približne 80 m²**.\n\nPočas dňa sa striedajú spoločné hry, aktivity a čas na odpočinok. Psíkov nenechávame hrať sa bez prestávky – všetko prispôsobujeme ich potrebám, veku aj aktuálnemu počasiu.",
  },
  {
    id: "taxi",
    title: "Ponúkate aj psie taxi?",
    answer: "Haf! 🐾 Áno! Ak nestíhaš svojho psíka priviezť alebo vyzdvihnúť, moji rodičia ti s tým môžu pomôcť.\n\nPonúkame **vyzdvihnutie aj odvoz psíka za 5 € za jednu jazdu**.\n\nSlužbu si môžeš dohodnúť pri rezervácii návštevy. Podrobnosti doladíme individuálne.",
  },
];

export function AriaGuidedChat({ open, onClose, initialQuestionId, trackingPrefix, formPrefix, dockless = false, portraitSrc = ARIA_HEAD_DATA_URI }: {
  open: boolean; onClose: () => void; initialQuestionId: "pricing" | "requirements" | null;
  trackingPrefix: string; formPrefix: string; dockless?: boolean; portraitSrc?: string;
}) {
  function track(action: string) {
    // Never send free-text, names, phone numbers or emails in behavioural events.
    void trackCookielessInteraction("explore_daycare", trackingPrefix + "_" + action);
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [typedLength, setTypedLength] = useState(0);
  const introText = dockless ? "Ahoj, volám sa Aria. Čo ťa zaujíma o našej škôlke?" : "Ahoj, volám sa Aria. Čo ťa zaujíma o našej škôlke? Haf! 🐾";
  const [introLength, setIntroLength] = useState(0);
  const [introComposing, setIntroComposing] = useState(true);
  useEffect(() => {
    if (!open) { setIntroLength(0); setIntroComposing(true); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !dockless;
    setIntroLength(0); setIntroComposing(true);
    let interval: number | undefined;
    // The direct pricing CTA gives the full greeting briefly before Aria
    // types the selected answer. Regular portrait-open keeps the original pace.
    const preselected = initialQuestionId !== null;
    if (dockless && preselected) {
      setIntroComposing(false);
      setIntroLength(introText.length);
      return;
    }
    const delay = window.setTimeout(() => {
      setIntroComposing(false);
      if (reduced) { setIntroLength(introText.length); return; }
      interval = window.setInterval(() => {
        setIntroLength(n => {
          const next = n + (preselected ? 3 : 2);
          if (next >= introText.length) { window.clearInterval(interval); return introText.length; }
          return next;
        });
      }, preselected ? 18 : 36);
    }, preselected ? 260 : 950);
    return () => { window.clearTimeout(delay); if (interval !== undefined) window.clearInterval(interval); };
  }, [open, initialQuestionId, dockless]);

  const [puppyCheck, setPuppyCheck] = useState<PuppyCheckInput | null>(null);
  const [puppyContactIsEligible, setPuppyContactIsEligible] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const chatId = useId();
  const unanswered = chatQuestions.filter(question => !answered.includes(question.id));
  // Always offer the next four unanswered FAQ choices in the approved order.
  const visibleQuestions = unanswered.slice(0, 4);
  const introFinished = !introComposing && introLength >= introText.length;
  const menuReady = introFinished && typingId === null &&
    !(initialQuestionId && !answered.includes(initialQuestionId));

  // A rendered menu offer is not an answer or a CTA click. Only with analytics consent.
  useEffect(() => {
    if (!open || !menuReady || trackingPrefix !== "lead_landing_aria_chat" || !hasAnalyticsConsent()) return;
    for (const question of visibleQuestions) trackAriaChatAction("question_offer", question.id);
  }, [open, menuReady, answered, trackingPrefix]);

  // Typewriter animation is visual only. Screen readers receive a complete
  // response in a single accessible text node; respect reduced motion.
  useEffect(() => {
    if (typingId === null) return;
    const text = messages.find(item => item.id === typingId)?.text;
    if (!text) { setTypingId(null); return; }
    const visibleTextLength = plainChatText(text).length;
    // Lead reveals words without spatial movement; reduced motion softens its dots in CSS.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !dockless;
    const words = plainChatText(text).match(/\S+\s*|\s+/g) ?? [];
    // Aria first pauses as if composing, then reveals the answer gradually.
    // One timer per active message; cleanup prevents late updates after closing.
    let count = 0;
    let wordIndex = 0;
    let interval: number | undefined;
    const delay = window.setTimeout(() => {
      if (reduced) { setTypedLength(visibleTextLength); setTypingId(null); return; }
      interval = window.setInterval(() => {
        count = Math.min(visibleTextLength, count + (words[wordIndex++]?.length ?? visibleTextLength));
        setTypedLength(count);
        if (count >= visibleTextLength) {
          window.clearInterval(interval);
          setTypingId(null);
        }
      }, 95);
    }, 1000);
    return () => {
      window.clearTimeout(delay);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [typingId, messages, dockless]);

  // On mobile, never pin the viewport to scrollHeight during each typewriter
  // tick: that hid the progressively written reply until animation completed.
  // Pin its TOP near the scrollport top, even if the answer grows downward.
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    const history = scrollRef.current;
    const activeReply = typingId === null ? null
      : history.querySelector<HTMLElement>('[data-aria-chat-message-id="' + typingId + '"]');
    if (activeReply) {
      history.scrollTop += activeReply.getBoundingClientRect().top -
        history.getBoundingClientRect().top - 12;
      return;
    }
    const last = messages[messages.length - 1];
    if (!last) {
      history.scrollTop = history.scrollHeight;
      return;
    }
    const lastReply = [...messages].reverse().find(item => item.side === "aria" && !item.widget);
    if (!lastReply) return;
    const element = history.querySelector<HTMLElement>('[data-aria-chat-message-id="' + lastReply.id + '"]');
    const firstCard = lastReply.questionId === "requirements"
      ? element?.querySelector<HTMLElement>('[data-aria-chat-requirements] article')
      : null;
    const target = firstCard || element;
    if (!target) return;
    const availableTop = history.clientHeight - target.getBoundingClientRect().height - 12;
    const topGap = firstCard ? Math.max(8, Math.min(42, availableTop)) : 12;
    history.scrollTop += target.getBoundingClientRect().top -
      history.getBoundingClientRect().top - topGap;
  }, [open, messages.length, typedLength, typingId]);

  const observedForms = useRef(new Set<number>());
  useEffect(() => {
    if (!open || trackingPrefix !== "lead_landing_aria_chat") return;
    for (const message of messages) {
      if (message.widget !== "interest" && message.widget !== "other" && message.widget !== "puppy_contact") continue;
      if (typingId !== null && message.id > typingId) continue;
      if (observedForms.current.has(message.id)) continue;
      observedForms.current.add(message.id);
      trackAriaChatAction("form_open", message.widget);
    }
  }, [open, messages, typingId, trackingPrefix]);

  function closeChat() {
    if (!engaged && messages.length === 0) track("closed_without_selection");
    onClose();
  }

  function ask(question: Question, origin: "manual" | "automatic" = "manual") {
    if (typingId !== null || answered.includes(question.id)) return;
    if (trackingPrefix === "lead_landing_aria_chat") trackAriaChatAction(origin === "manual" ? "question" : "auto_question", question.id);
    track("question_" + question.id);
    if (question.id === "puppy") track("puppy_check_open");
    if (question.id === "puppy" && trackingPrefix === "lead_landing_aria_chat") trackAriaChatAction("puppy_check_open");
    setEngaged(true);
    setAnswered(current => [...current, question.id]);
    const id = nextId.current;
    const isPuppy = question.id === "puppy";
    nextId.current += isPuppy ? 3 : 2;
    setTypedLength(0);
    setMessages(current => [...current,
      { id, side: "person", text: question.title },
      { id: id + 1, side: "aria", text: question.answer, questionId: question.id },
      ...(isPuppy ? [{ id: id + 2, side: "aria" as const, text: "", widget: "puppy" as const }] : []),
    ]);
    if (isPuppy) setPuppyCheck(null);
    setTypingId(id + 1);
  }

  useEffect(() => {
    if (!open || !initialQuestionId ||
        introComposing || introLength < introText.length ||
        answered.includes(initialQuestionId) || typingId !== null) return;
    const timer = window.setTimeout(() => {
      const question = chatQuestions.find(item => item.id === initialQuestionId);
      // A direct launcher button is a real visitor selection, not a bot-generated question.
      if (question) ask(question, dockless ? "manual" : "automatic");
    }, 240);
    return () => window.clearTimeout(timer);
    // ask() only appends a deterministic catalogue question; the stable state
    // guards above prevent a second answer on re-open.
  }, [open, initialQuestionId, introComposing, introLength, answered, typingId]);

  function showInterest() {
    if (typingId !== null || messages[messages.length - 1]?.widget === "interest") return;
    track("interest_open");
    if (trackingPrefix === "lead_landing_aria_chat") trackAriaChatAction("interest_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 3;
    setTypedLength(0);
    setMessages(current => [...current,
      { id, side: "person", text: "Mám záujem o škôlku." },
      { id: id + 1, side: "aria", text: "Haf, jasné! 🐾 Vyplň krátky nezáväzný formulár priamo tu v chate a moji rodičia sa ti ozvú." },
      { id: id + 2, side: "aria", text: "", widget: "interest" },
    ]);
    setTypingId(id + 1);
  }

  function finishPuppyCheck(details: PuppyCheckInput, eligible: boolean) {
    if (puppyCheck) return;
    track(eligible ? "puppy_precheck_passed" : "puppy_precheck_info");
    if (trackingPrefix === "lead_landing_aria_chat") trackAriaChatAction(eligible ? "puppy_precheck_passed" : "puppy_precheck_info");
    setPuppyCheck(details);
    setPuppyContactIsEligible(eligible);
    const id = nextId.current++;
    setMessages(current => [...current, { id, side: "aria", text: "", widget: "puppy_contact" }]);
  }

  function showOther() {
    if (typingId !== null || messages[messages.length - 1]?.widget === "other") return;
    track("other_open");
    if (trackingPrefix === "lead_landing_aria_chat") trackAriaChatAction("other_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 3;
    setTypedLength(0);
    setMessages(current => [...current,
      { id, side: "person", text: "Mám inú otázku." },
      { id: id + 1, side: "aria", text: "Haf! 🐾 Napíš mi najprv svoju otázku. V druhom kroku necháš kontakt a moji rodičia ti odpovedia." },
      { id: id + 2, side: "aria", text: "", widget: "other" },
    ]);
    setTypingId(id + 1);
  }


  return (
    <Dialog open={open} onOpenChange={value => { if (!value) closeChat(); }}>
      <DialogContent positioning="form" data-aria-chat data-aria-chat-lead={dockless || undefined} aria-describedby={chatId + "-intro"} overlayClassName={dockless ? "!bg-forest-deep/10 !backdrop-blur-[2px]" : "!bg-forest-deep/25 !backdrop-blur-[12px]"}
        className={"aria-brand-experiment !fixed !flex !gap-0 left-2 right-2 top-auto z-50 min-h-0 w-auto max-w-none flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/80 backdrop-blur-3xl p-0 text-forest shadow-[0_24px_70px_rgba(25,48,37,.2)] sm:left-1/2 sm:right-auto sm:top-[54%] sm:bottom-auto sm:h-[min(85dvh,750px)] sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 " +
          (dockless ? "bottom-[max(8px,env(safe-area-inset-bottom))] h-[min(94dvh,800px)]" :
            "bottom-[max(70px,calc(env(safe-area-inset-bottom)+60px))] h-[min(81dvh,720px)]")}>
        <header className="flex shrink-0 items-center gap-3 border-b border-white/60 bg-white/45 backdrop-blur-2xl px-4 py-3 pr-12">
          <img src={portraitSrc} alt="" width={48} height={48} className="size-12 shrink-0 object-contain drop-shadow-sm" />
          <div className="min-w-0">
            <DialogTitle className="font-display text-base font-extrabold text-forest sm:text-lg">Aria z Chvostíkova</DialogTitle>
            {dockless && <p data-aria-chat-status title="Automatická sprievodkyňa" className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-forest/80">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-emerald-500" /> Labky na klávesnici
            </p>}
          </div>
        </header>

        <div ref={scrollRef} role="log" aria-label="Konverzácia s Ariou" aria-live="polite"
          data-aria-chat-history className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [overflow-anchor:none] bg-[linear-gradient(145deg,rgba(255,240,213,.68),rgba(247,233,241,.55),rgba(237,248,240,.7))] backdrop-blur-xl px-3 py-4 sm:px-5">
          <div className="flex items-end gap-2">
            <img src={portraitSrc} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
            <div id={chatId + "-intro"} className="max-w-[87%] rounded-[20px_20px_20px_6px] bg-white px-3 py-3 text-[13px] leading-relaxed text-[#26322b] shadow-sm sm:text-sm">
              <span className="sr-only">{introText}</span>
              <span aria-hidden="true">{introComposing ? <span data-aria-intro-composing className="inline-flex items-center gap-1"><span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f]"} /><span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f] [animation-delay:160ms]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f] [animation-delay:120ms]"} /><span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f] [animation-delay:320ms]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f] [animation-delay:240ms]"} /></span> : dockless ? renderChatText("Ahoj, volám sa **Aria.** **Čo ťa zaujíma o našej škôlke?**", introLength) : introText.slice(0, introLength)}</span>
            </div>
          </div>

          {messages.map(message => {
            if (message.widget) {
              // Mount inline only AFTER Aria finishes composing its preceding answer.
              // Keep historical widgets in the log as the conversation grows.
              if (typingId !== null && message.id > typingId) return null;
              return (
                <section key={message.id} data-aria-chat-inline={message.widget}
                  className="ml-11 min-w-0 space-y-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm sm:p-4">
                  {message.widget === "puppy" && (
                    <div data-aria-chat-puppy-check aria-label="Orientačná kontrola šteniatka">
                      <AriaPuppyChecker embedded chatCompact trackingSource={trackingPrefix + "_puppy"}
                        onInterest={details => finishPuppyCheck(details, true)}
                        onInfo={details => finishPuppyCheck(details, false)} />
                    </div>
                  )}
                  {message.widget === "puppy_contact" && puppyCheck && (
                    <div data-aria-chat-puppy-contact className="space-y-3">
                      <p role="status" className="rounded-xl bg-secondary/50 p-2 text-xs leading-relaxed text-forest">
                        {puppyContactIsEligible
                          ? "Vek a očkovania orientačne spĺňajú podmienky. Vyplň kontakt a ozveme sa ti ohľadom bezplatnej úvodnej návštevy."
                          : "Tvoje šteniatko zatiaľ nespĺňa všetky orientačné podmienky alebo si nie si istý očkovaním. Nechaj kontakt a individuálne sa poradíme."}
                        <span className="mt-1 block">Vek: {puppyCheck.age_months} mesiacov · očkovania: besnota, DHPPi+L, kotercový kašeľ –
                          {Object.values(puppyCheck.vaccines).every(value => value === "yes") ? " všetky potvrdené" : " nie všetky potvrdené"}.</span>
                      </p>
                      <ShortForm hideInterest showChatDogFields trackingSource={formPrefix + "_puppy_contact"}
                        puppyCheck={puppyCheck}
                        interestValue={puppyContactIsEligible ? "Mám záujem o škôlku pre šteniatko" : "Chcem sa informovať o škôlke"}
                        onSent={() => track("puppy_contact_submitted")} />
                    </div>
                  )}
                  {message.widget === "interest" && (
                    <div data-aria-chat-interest data-lead-form-shell className="space-y-2">
                      <LeadStepForm trackingSource={formPrefix + "_interest"} compact chatReceipt
                        onSent={() => track("interest_submitted")} />
                    </div>
                  )}
                  {message.widget === "other" && (
                    <div data-aria-chat-other className="space-y-2">
                      <HomeFaqContactForm source={formPrefix === "lead_landing_aria_chat"
                        ? "lead_landing_aria_chat_other" : "aria_preview_chat_other"} compact
                        onStarted={() => track("other_question_started")}
                        onSent={() => track("other_question_submitted")} />
                      <a href={"tel:" + PHONE} className="flex min-h-11 items-center justify-center rounded-xl border border-[#9e336f]/30 px-3 text-xs font-bold text-[#9e336f]">
                        Alebo nám zavolaj na {PHONE_PRETTY}
                      </a>
                    </div>
                  )}
                </section>
              );
            }
            const isTyping = message.id === typingId;
            return (
              <div key={message.id} data-aria-chat-turn={message.side} data-aria-chat-message-id={message.id}
                className={"flex items-end gap-2 " + (message.side === "person" ? "justify-end" : "")}>
                {message.side === "aria" && <img src={portraitSrc} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />}
                <div data-aria-typing={isTyping ? "true" : undefined}
                  className={"whitespace-pre-line px-3 py-3 text-[13px] leading-relaxed shadow-sm sm:text-sm " +
                    (message.questionId === "requirements" ? "min-w-0 w-[calc(100%-44px)] max-w-[calc(100%-44px)] " : "max-w-[85%] ") +
                    (message.side === "person" ? "rounded-[20px_20px_6px_20px] bg-[#9e336f] text-white" :
                    "rounded-[20px_20px_20px_6px] bg-white text-[#26322b]")}>
                  {isTyping ? (
                    <>
                      {typedLength === 0 ? (
                        <span aria-hidden="true" className="inline-flex items-center gap-1" data-aria-composing>
                          <span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f]"} />
                          <span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f] [animation-delay:160ms]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f] [animation-delay:120ms]"} />
                          <span className={dockless ? "aria-composing-dot size-1.5 rounded-full bg-[#9e336f] [animation-delay:320ms]" : "size-1.5 motion-safe:animate-bounce rounded-full bg-[#9e336f] [animation-delay:240ms]"} />
                        </span>
                      ) : <span aria-hidden="true">{renderChatText(message.text, typedLength)}</span>}
                      <span className="sr-only">{plainChatText(message.text)}</span>
                      {typedLength > 0 && <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 motion-safe:animate-pulse bg-[#9e336f] align-middle" />}
                    </>
                  ) : renderChatText(message.text)}
                  {!isTyping && message.questionId === "requirements" && (
                    <div data-aria-chat-requirements className="mt-3 space-y-2 whitespace-normal">
                      {ARIA_PREVIEW_REQUIREMENTS.map((item, index) => (
                        <article key={item.title} className="rounded-2xl border border-forest/10 bg-[#f9f8f3] px-3 py-3">
                          <div className="flex items-start gap-2">
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-forest">{index + 1}</span>
                            <div className="min-w-0">
                              <h3 className="font-display text-xs font-bold text-forest">{item.title}</h3>
                              <p className="mt-1 text-xs leading-relaxed text-forest/75"><AriaHighlightedText text={item.text} /></p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                {message.side === "person" && (
                  <span aria-label="Návštevník" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6d8e9] text-[#9e336f]">
                    <ChvostikovoPaw className="size-5" />
                  </span>
                )}
              </div>
            );
          })}

          {menuReady && visibleQuestions.length > 0 && (
            <div data-aria-chat-questions aria-label="Vyber si otázku"
              className="grid w-full grid-cols-2 gap-2" role="group">
              {visibleQuestions.map(question => (
                <button key={question.id} type="button" data-aria-chat-question={question.id}
                  onClick={() => ask(question)}
                  className={"min-h-11 min-w-0 rounded-xl border px-2 py-2.5 text-center text-xs font-semibold leading-snug shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#9e336f] " +
                    (question.id === "requirements" ? "max-[350px]:col-span-2 whitespace-nowrap " : "") +
                    (question.id === "puppy"
                      ? "border-[#9e336f]/30 bg-[#f9e5ee] font-extrabold text-[#873063] hover:bg-[#f5d6e5]"
                      : "border-[#e4d9cb] bg-white text-[#26322b] hover:border-[#aa4b00]")}>
                  {question.title}
                </button>
              ))}
            </div>
          )}

        </div>

        {menuReady && (
          <nav data-aria-chat-action-panel
            data-aria-chat-followup={messages.length > 0 ? "true" : undefined}
            aria-label="Možnosti pokračovania"
            className="flex shrink-0 items-stretch gap-2 border-t border-white/60 bg-white/80 px-2.5 py-2.5 backdrop-blur-2xl sm:px-5">
            <button type="button" data-aria-chat-other-cta onClick={showOther}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#ffa414]/55 bg-[#fff0d5] px-2 py-2 text-[11px] font-extrabold leading-tight text-[#26322b] shadow-sm transition-colors hover:border-[#ffa414] hover:bg-[#ffe3b2] focus-visible:outline-2 focus-visible:outline-[#9e336f]">
              Máš inú otázku?
            </button>
            <button type="button" data-aria-chat-interest-cta onClick={showInterest}
              className="min-h-11 min-w-0 flex-[1.6] rounded-xl bg-[#9e336f] px-2 py-2 text-xs font-extrabold leading-tight text-white shadow-sm focus-visible:outline-2 focus-visible:outline-[#9e336f]">
              Mám záujem o škôlku
            </button>
          </nav>
        )}
      </DialogContent>
    </Dialog>
  );
}
