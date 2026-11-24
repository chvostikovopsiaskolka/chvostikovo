import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ChvostikovoPaw } from "./ChvostikovoPaw";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "./AriaPreviewText";
import { ADDRESS, PHONE, PHONE_PRETTY, PRICING } from "@/content/site";
import { ShortForm } from "./Forms";
import { LeadStepForm } from "./LeadStepForm";
import { AriaPuppyChecker } from "./AriaPuppyChecker";
import type { PuppyCheckInput } from "@/lib/inquiry";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type ChatMode = "questions" | "interest" | "other" | "puppy" | "puppy_contact";
type ChatMessage = { id: number; side: "person" | "aria"; text: string; questionId?: string };
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
// Two approved 4-question waves; keep IDs stable for cookieless analytics.
const chatQuestions: Question[] = [
  {
    id: "pricing",
    title: "Aký je cenník škôlky?",
    answer: "Haf! 🐾 **Jednorazový celodenný vstup stojí " + priceOne +
      ".**\nSme otvorení od 7:00 do 17:00, pondelok až piatok.\n\n" +
      "Ak plánuješ pravidelné návštevy, oplatí sa **permanentka za " + pricePass +
      "**. Má **10 vstupov**, platí 2 mesiace a **ušetríš 50 €** oproti jednorazovým vstupom.\n\n" +
      "**Ak máš záujem o škôlku pre svojho psíka, vyplň nezáväzný formulár a my sa ti ozveme späť.**",
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
    answer: "Haf! 🐾 Áno, prijímame aj očkované šteniatka približne od 4 mesiacov. Záleží na veku, očkovaniach a pripravenosti na kolektív. Poďme si orientačne overiť, či tvoje šteniatko spĺňa základné podmienky. Konečné rozhodnutie urobíme po úvodnej návšteve.",
  },
  {
    id: "location",
    title: "Kde sa škôlka nachádza?",
    answer: "Haf! 🐾 Nájdeš nás v **Košiciach na Poľskej 6**.\n\nMáme vlastné vnútorné priestory aj vonkajší výbeh, kde si naši škôlkari môžu užívať deň plný hier, pohybu a oddychu.\n\nNa našej stránke nájdeš aj **mapu a kontakt**, aby si nás jednoducho našiel.",
  },
  {
    id: "space",
    title: "Aké priestory má škôlka?",
    answer: "Haf! 🐾 Naši škôlkari majú k dispozícii **vyhrievané vnútorné priestory** na hru aj oddych a vlastný **vonkajší výbeh s rozlohou približne 80 m²**.\n\nPočas dňa sa striedajú spoločné hry, aktivity a čas na odpočinok. Psíkov nenechávame hrať sa bez prestávky – všetko prispôsobujeme ich potrebám, veku aj aktuálnemu počasiu.",
  },
  {
    id: "first_visit",
    title: "Ako prebieha prvá návšteva?",
    answer: "Haf! 🐾 Pred nástupom do škôlky absolvuje každý nový psík **bezplatnú úvodnú návštevu**.\n\nPočas nej sa zoznámime so psíkom, sledujeme jeho správanie a reakcie na nové prostredie, ľudí aj ostatných psov. Postupne ho zoznamujeme s kolektívom.\n\n**Nie každý psík si zvykne rovnako rýchlo.** Ak potrebuje viac času, môžeme odporučiť kratšie adaptačné návštevy a postup prispôsobiť jeho tempu.",
  },
  {
    id: "reservation",
    title: "Ako si rezervujem miesto v škôlke?",
    answer: "Haf! 🐾 Miesto v škôlke si rezervuješ vopred prostredníctvom našej **zákazníckej aplikácie**.\n\nRezervácie na nasledujúci týždeň je potrebné vytvoriť **do nedele 20:00**, aby sme vedeli naplánovať počet psíkov a zabezpečiť im bezpečný a príjemný pobyt.\n\nAk si však kvôli práci alebo iným povinnostiam nevieš naplánovať návštevy na celý týždeň dopredu, **vieme sa dohodnúť aj individuálne**, podľa voľnej kapacity. Stačí nám napísať alebo zavolať.\n\nAk ešte nie si naším škôlkarom, najprv spolu absolvujeme **bezplatnú úvodnú návštevu**.",
  },
];

export function AriaGuidedChat({ open, onClose, initialQuestionId, trackingPrefix, formPrefix, dockless = false }: {
  open: boolean; onClose: () => void; initialQuestionId: "pricing" | null;
  trackingPrefix: string; formPrefix: string; dockless?: boolean;
}) {
  function track(action: string) {
    // Never send free-text, names, phone numbers or emails in behavioural events.
    void trackCookielessInteraction("explore_daycare", trackingPrefix + "_" + action);
  }
  const [mode, setMode] = useState<ChatMode>("questions");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [showChoices, setShowChoices] = useState(true);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [typedLength, setTypedLength] = useState(0);
  const introText = "Haf! 🐾 Ahoj, ja som Aria. Čo ťa zaujíma o našej škôlke?";
  const [introLength, setIntroLength] = useState(0);
  const [introComposing, setIntroComposing] = useState(true);
  const autoPricingAsked = useRef(false);
  useEffect(() => {
    if (!open) { setIntroLength(0); setIntroComposing(true); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroLength(introText.length); setIntroComposing(false); return;
    }
    setIntroLength(0); setIntroComposing(true);
    let interval: number | undefined;
    // The direct pricing CTA gives the full greeting briefly before Aria
    // types the selected answer. Regular portrait-open keeps the original pace.
    const preselected = initialQuestionId === "pricing";
    const delay = window.setTimeout(() => {
      setIntroComposing(false);
      interval = window.setInterval(() => {
        setIntroLength(n => {
          const next = n + (preselected ? 3 : 2);
          if (next >= introText.length) { window.clearInterval(interval); return introText.length; }
          return next;
        });
      }, preselected ? 18 : 36);
    }, preselected ? 260 : 950);
    return () => { window.clearTimeout(delay); if (interval !== undefined) window.clearInterval(interval); };
  }, [open, initialQuestionId]);

  const [puppyCheck, setPuppyCheck] = useState<PuppyCheckInput | null>(null);
  const [puppyContactIsEligible, setPuppyContactIsEligible] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);
  const chatId = useId();
  const unanswered = chatQuestions.filter(question => !answered.includes(question.id));
  // Approved four + four progressive FAQs; reveal the second wave only
  // when every first-wave question has been selected.
  const primaryQuestionIds: readonly string[] = ["pricing", "requirements", "caretakers", "puppy"];
  const primaryUnanswered = unanswered.filter(question => primaryQuestionIds.includes(question.id));
  const visibleQuestions = primaryUnanswered.length ? primaryUnanswered : unanswered;
  const introFinished = !introComposing && introLength >= introText.length;
  const menuReady = introFinished && typingId === null &&
    !(initialQuestionId === "pricing" && !autoPricingAsked.current && !answered.includes("pricing"));

  // Typewriter animation is visual only. Screen readers receive a complete
  // response in a single accessible text node; respect reduced motion.
  useEffect(() => {
    if (typingId === null) return;
    const text = messages.find(item => item.id === typingId)?.text;
    if (!text) { setTypingId(null); return; }
    const visibleTextLength = plainChatText(text).length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedLength(visibleTextLength);
      setTypingId(null);
      return;
    }
    // Aria first pauses as if composing, then reveals the answer gradually.
    // One timer per active message; cleanup prevents late updates after closing.
    let count = 0;
    let interval: number | undefined;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        count = Math.min(visibleTextLength, count + (mobile ? 3 : 2));
        setTypedLength(count);
        if (count >= visibleTextLength) {
          window.clearInterval(interval);
          setTypingId(null);
        }
      }, mobile ? 28 : 32);
    }, mobile ? 600 : 1100);
    return () => {
      window.clearTimeout(delay);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [typingId, messages]);

  useEffect(() => {
    if (!open || mode !== "questions" || !scrollRef.current) return;
    const history = scrollRef.current;
    const lastReply = messages[messages.length - 1];
    if (lastReply?.side === "aria" && typingId === null && !showChoices) {
      const replies = history.querySelectorAll<HTMLElement>('[data-aria-chat-turn="aria"]');
      const latestReply = replies[replies.length - 1];
      const firstCard = lastReply.questionId === "requirements"
        ? latestReply?.querySelector<HTMLElement>("[data-aria-chat-requirements] article")
        : null;
      const target = firstCard || latestReply;
      if (target) {
        // APP-01: after the typewriter completes, place the beginning of the
        // new reply (or the first requirements card) at the TOP, not the bottom.
        // The compact action row stays outside the history's scroll owner.
        const offset = target.getBoundingClientRect().top - history.getBoundingClientRect().top;
        const availableTop = history.clientHeight - target.getBoundingClientRect().height - 12;
        const topGap = firstCard ? Math.max(8, Math.min(42, availableTop)) : 12;
        history.scrollTop += offset - topGap;
        return;
      }
    }
    history.scrollTop = history.scrollHeight;
  }, [open, messages.length, typedLength, mode, typingId, showChoices]);

  useEffect(() => {
    if (open && mode === "questions" && messages.length && !showChoices && typingId === null) {
      actionRef.current?.focus({ preventScroll: true });
    }
  }, [open, mode, messages.length, showChoices, typingId]);

  function closeChat() {
    if (!engaged && messages.length === 0) track("closed_without_selection");
    onClose();
  }

  function ask(question: Question) {
    if (typingId !== null || answered.includes(question.id)) return;
    track("question_" + question.id);
    setEngaged(true);
    setAnswered(current => [...current, question.id]);
    setShowChoices(false);
    const id = nextId.current;
    nextId.current += 2;
    setTypedLength(0);
    setMessages(current => [...current,
      { id, side: "person", text: question.title },
      { id: id + 1, side: "aria", text: question.answer, questionId: question.id },
    ]);
    setTypingId(id + 1);
  }

  useEffect(() => {
    if (!open || initialQuestionId !== "pricing" || autoPricingAsked.current ||
        introComposing || introLength < introText.length ||
        answered.includes("pricing") || typingId !== null) return;
    const timer = window.setTimeout(() => {
      if (autoPricingAsked.current) return;
      autoPricingAsked.current = true;
      const question = chatQuestions.find(item => item.id === "pricing");
      if (question) ask(question);
    }, 240);
    return () => window.clearTimeout(timer);
    // ask() only appends a deterministic catalogue question; the stable state
    // guards above prevent a second answer on re-open.
  }, [open, initialQuestionId, introComposing, introLength, answered, typingId]);

  function showInterest() {
    track("interest_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 2;
    setMessages(current => [...current,
      { id, side: "person", text: "Mám záujem o škôlku." },
      { id: id + 1, side: "aria", text: "Haf, jasné! 🐾 Stačí vyplniť krátky nezáväzný formulár. Príde môjmu paničkovi a radi sa ti ozvú." },
    ]);
    setMode("interest");
  }

  function showPuppy() {
    track("question_puppy");
    track("puppy_check_open");
    setEngaged(true);
    setAnswered(current => current.includes("puppy") ? current : [...current, "puppy"]);
    setShowChoices(false);
    setMode("puppy");
    setPuppyCheck(null);
    const id = nextId.current;
    nextId.current += 2;
    setMessages(current => [...current,
      { id, side: "person", text: "Mám šteniatko. Spĺňa podmienky škôlky?" },
      { id: id + 1, side: "aria", text: chatQuestions.find(question => question.id === "puppy")!.answer, questionId: "puppy" },
    ]);
  }

  function finishPuppyCheck(details: PuppyCheckInput, eligible: boolean) {
    track(eligible ? "puppy_precheck_passed" : "puppy_precheck_info");
    setPuppyCheck(details);
    setPuppyContactIsEligible(eligible);
    setMode("puppy_contact");
  }

  function showOther() {
    track("other_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 2;
    setMessages(current => [...current,
      { id, side: "person", text: "Chcem sa spýtať niečo iné." },
      { id: id + 1, side: "aria", text: "Jasné! 🐾 Cez kontaktný formulár napíš správu mojim majiteľom. Radi sa ti ozvú hneď, ako to bude možné." },
    ]);
    setMode("other");
  }

  function backToQuestions() {
    setMode("questions");
    setShowChoices(unanswered.length > 0);
  }


  return (
    <Dialog open={open} onOpenChange={value => { if (!value) closeChat(); }}>
      <DialogContent positioning="form" data-aria-chat aria-describedby={chatId + "-intro"} overlayClassName="!bg-forest-deep/25 !backdrop-blur-[12px]"
        className={"aria-brand-experiment !fixed !flex !gap-0 left-2 right-2 top-auto z-50 min-h-0 w-auto max-w-none flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/80 backdrop-blur-3xl p-0 text-forest shadow-[0_24px_70px_rgba(25,48,37,.2)] sm:left-1/2 sm:right-auto sm:top-[54%] sm:bottom-auto sm:h-[min(85dvh,750px)] sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 " +
          (dockless ? "bottom-[max(8px,env(safe-area-inset-bottom))] h-[min(94dvh,800px)]" :
            "bottom-[max(70px,calc(env(safe-area-inset-bottom)+60px))] h-[min(81dvh,720px)]")}>
        <header className="flex shrink-0 items-center gap-3 border-b border-white/60 bg-white/45 backdrop-blur-2xl px-4 py-3 pr-12">
          <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48} className="size-12 shrink-0 object-contain drop-shadow-sm" />
          <DialogTitle className="font-display text-base font-extrabold text-forest sm:text-lg">Aria z Chvostíkova</DialogTitle>
        </header>

        <div ref={scrollRef} role="log" aria-label="Konverzácia s Ariou" aria-live="polite"
          data-aria-chat-history className={(mode === "questions" ? "min-h-0 flex-1 space-y-3 overflow-y-auto " : "hidden ") +
            "overscroll-contain bg-[linear-gradient(145deg,rgba(255,240,213,.68),rgba(247,233,241,.55),rgba(237,248,240,.7))] backdrop-blur-xl px-3 py-4 sm:px-5"}>
          <div className="flex items-end gap-2">
            <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
            <div id={chatId + "-intro"} className="max-w-[87%] rounded-[20px_20px_20px_6px] bg-white px-3 py-3 text-[13px] leading-relaxed text-[#26322b] shadow-sm sm:text-sm">
              <span className="sr-only">{introText}</span>
              <span aria-hidden="true">{introComposing ? <span data-aria-intro-composing className="inline-flex items-center gap-1"><span className="size-1.5 animate-bounce rounded-full bg-[#9e336f]" /><span className="size-1.5 animate-bounce rounded-full bg-[#9e336f] [animation-delay:120ms]" /><span className="size-1.5 animate-bounce rounded-full bg-[#9e336f] [animation-delay:240ms]" /></span> : introText.slice(0, introLength)}</span>
            </div>
          </div>

          {messages.map(message => {
            const isTyping = message.id === typingId;
            return (
              <div key={message.id} data-aria-chat-turn={message.side}
                className={"flex items-end gap-2 " + (message.side === "person" ? "justify-end" : "")}>
                {message.side === "aria" && <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />}
                <div data-aria-typing={isTyping ? "true" : undefined}
                  className={"whitespace-pre-line px-3 py-3 text-[13px] leading-relaxed shadow-sm sm:text-sm " +
                    (message.questionId === "requirements" ? "min-w-0 w-[calc(100%-44px)] max-w-[calc(100%-44px)] " : "max-w-[85%] ") +
                    (message.side === "person" ? "rounded-[20px_20px_6px_20px] bg-[#9e336f] text-white" :
                    "rounded-[20px_20px_20px_6px] bg-white text-[#26322b]")}>
                  {isTyping ? (
                    <>
                      {typedLength === 0 ? (
                        <span aria-hidden="true" className="inline-flex items-center gap-1" data-aria-composing>
                          <span className="size-1.5 animate-bounce rounded-full bg-[#9e336f]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-[#9e336f] [animation-delay:120ms]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-[#9e336f] [animation-delay:240ms]" />
                        </span>
                      ) : <span aria-hidden="true">{renderChatText(message.text, typedLength)}</span>}
                      <span className="sr-only">{plainChatText(message.text)}</span>
                      {typedLength > 0 && <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[#9e336f] align-middle" />}
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

          {mode === "questions" && menuReady && showChoices && visibleQuestions.length > 0 && (
            <div data-aria-chat-questions aria-label="Vyber si otázku"
              className="ml-11 grid grid-cols-2 gap-2" role="group">
              {visibleQuestions.map(question => (
                <button key={question.id} type="button" data-aria-chat-question={question.id}
                  onClick={() => question.id === "puppy" ? showPuppy() : ask(question)}
                  className={"min-h-11 min-w-0 rounded-xl border px-2.5 py-2.5 text-left text-xs font-semibold leading-snug shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#9e336f] " +
                    (question.id === "puppy"
                      ? "border-[#9e336f]/30 bg-[#f9e5ee] font-extrabold text-[#873063] hover:bg-[#f5d6e5]"
                      : "border-[#e4d9cb] bg-white text-[#26322b] hover:border-[#aa4b00]")}>
                  {question.title}
                </button>
              ))}
            </div>
          )}

        </div>

        {mode === "questions" && menuReady && (
          <nav data-aria-chat-action-panel
            data-aria-chat-followup={messages.length > 0 ? "true" : undefined}
            aria-label="Možnosti pokračovania"
            className="flex shrink-0 items-stretch gap-2 border-t border-white/60 bg-white/80 px-2.5 py-2.5 backdrop-blur-2xl sm:px-5">
            {messages.length > 0 && visibleQuestions.length > 0 && (
              <button type="button" ref={actionRef} data-aria-chat-show-questions
                onClick={() => setShowChoices(current => !current)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#9e336f]/25 bg-white px-1.5 py-2 text-[11px] font-bold leading-tight text-[#873063] focus-visible:outline-2 focus-visible:outline-[#9e336f]">
                {showChoices ? "Skryť otázky" : "Ďalšie otázky"}
              </button>
            )}
            <button type="button" data-aria-chat-interest-cta onClick={showInterest}
              className="min-h-11 min-w-0 flex-1 rounded-xl bg-[#9e336f] px-1.5 py-2 text-xs font-extrabold leading-tight text-white shadow-sm focus-visible:outline-2 focus-visible:outline-[#9e336f]">
              Mám záujem
            </button>
            <button type="button" data-aria-chat-other-cta onClick={showOther}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#ffa414]/55 bg-[#fff0d5] px-1.5 py-2 text-[11px] font-extrabold leading-tight text-[#26322b] shadow-sm transition-colors hover:border-[#ffa414] hover:bg-[#ffe3b2] focus-visible:outline-2 focus-visible:outline-[#9e336f]">
              Mám inú otázku?
            </button>
          </nav>
        )}

        {mode !== "questions" && (
          <div data-aria-chat-form-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/60 bg-white/65 backdrop-blur-2xl p-3 sm:p-4">
            {mode === "puppy" && (
              <section data-aria-chat-puppy-check aria-label="Orientačná kontrola šteniatka" className="space-y-3">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <AriaPuppyChecker embedded trackingSource={trackingPrefix + "_puppy"} {...(puppyCheck ? { initialAnswers: puppyCheck } : {})}
                  onInterest={details => finishPuppyCheck(details, true)}
                  onInfo={details => finishPuppyCheck(details, false)} />
                <p className="text-xs font-semibold leading-relaxed text-[#26322b]">
                  Pomohla ti odpoveď? Ak máš záujem o škôlku pre svojho psíka, vyplň nezáväzný formulár a my sa ti ozveme späť.
                </p>
                <button type="button" data-aria-chat-interest-cta onClick={showInterest}
                  className="min-h-12 w-full rounded-xl bg-[#9e336f] px-4 py-2.5 text-sm font-extrabold text-white">Mám záujem</button>
              </section>
            )}
            {mode === "puppy_contact" && puppyCheck && (
              <section data-aria-chat-puppy-contact aria-label="Kontakt po kontrole šteniatka" className="space-y-3">
                <button type="button" onClick={() => setMode("puppy")} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť ku kontrole
                </button>
                <p role="status" className="rounded-2xl bg-white p-3 text-xs leading-relaxed text-[#26322b]">
                  {puppyContactIsEligible
                    ? "Vek a očkovania orientačne spĺňajú podmienky. Vyplňte kontakt a ozveme sa vám ohľadom bezplatnej úvodnej návštevy."
                    : "Vaše šteniatko zatiaľ nespĺňa všetky orientačné podmienky alebo si nie ste istí očkovaním. Môžete nám nechať kontakt a individuálne sa poradíme."}
                  <span className="mt-1 block">Vek: {puppyCheck.age_months} mesiacov · očkovania: besnota, DHPPi+L, kotercový kašeľ – {Object.values(puppyCheck.vaccines).every(value => value === "yes") ? "všetky potvrdené" : "nie všetky potvrdené"}.</span>
                </p>
                <ShortForm hideInterest showChatDogFields trackingSource={formPrefix + "_puppy_contact"}
                  puppyCheck={puppyCheck}
                  interestValue={puppyContactIsEligible ? "Mám záujem o škôlku pre šteniatko" : "Chcem sa informovať o škôlke"}
                  onSent={() => track("puppy_contact_submitted")} />
              </section>
            )}
            {mode === "interest" && (
              <section data-lead-form-shell aria-label="Nezáväzný záujem v chate" data-aria-chat-interest className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <p data-lead-form-intro data-aria-form-prompt className="rounded-xl bg-white/75 px-3 py-2 text-xs leading-relaxed text-forest">
                  {messages[messages.length - 1]?.text}
                </p>
                <LeadStepForm trackingSource={formPrefix + "_interest"} compact
                  onSent={() => track("interest_submitted")} />
              </section>
            )}
            {mode === "other" && (
              <section aria-label="Iná otázka" data-aria-chat-other className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <p data-aria-form-prompt className="rounded-xl bg-white/75 px-3 py-2 text-xs leading-relaxed text-forest">
                  {messages[messages.length - 1]?.text}
                </p>
                <ShortForm hideInterest showQuestionField trackingSource={formPrefix + "_other"}
                  interestValue="Chcem sa informovať o škôlke"
                  onSent={() => track("other_question_submitted")} />
                <a href={"tel:" + PHONE} className="flex min-h-11 items-center justify-center rounded-xl border border-[#9e336f]/30 px-3 text-xs font-bold text-[#9e336f]">
                  Alebo nám zavolaj na {PHONE_PRETTY}
                </a>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
