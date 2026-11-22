import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ChvostikovoPaw } from "./ChvostikovoPaw";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { ARIA_PREVIEW_REQUIREMENTS, AriaHighlightedText } from "./AriaPreviewText";
import { ADDRESS, FAQ, PHONE, PHONE_PRETTY, PRICING } from "@/content/site";
import { ShortForm } from "./Forms";
import { LeadStepForm } from "./LeadStepForm";
import { AriaPuppyChecker } from "./AriaPuppyChecker";
import type { PuppyCheckInput } from "@/lib/inquiry";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type ChatMode = "questions" | "interest" | "other" | "puppy" | "puppy_contact";
type ChatMessage = { id: number; side: "person" | "aria"; text: string; questionId?: string };
type Question = { id: string; title: string; answer: string };

const findAnswer = (question: string) => FAQ.find((item) => item.q === question)?.a || "";
const priceOne = PRICING.find((item) => !item.highlight)?.price || "25 €";
const pricePass = PRICING.find((item) => item.highlight)?.price || "200 €";
const firstVisit = findAnswer("Ako prebieha prvá návšteva psíka v škôlke?").split(/\n+/)[0];
const chatQuestions: Question[] = [
  {
    id: "pricing",
    title: "Aký je cenník škôlky?",
    answer: "Haf! 🐾 Jednorazový celodenný vstup stojí " + priceOne +
      ". Sme otvorení od 7:00 do 17:00, pondelok až piatok.\n" +
      "Ak plánuješ pravidelné návštevy, oplatí sa permanentka za " + pricePass +
      ". Má 10 vstupov, platí 2 mesiace a ušetríš 50 € oproti jednorazovým vstupom.",
  },
  {
    id: "requirements",
    title: "Aké sú podmienky prijatia?",
    answer: "Haf! 🐾 Toto sú naše hlavné podmienky prijatia. Každého nového psíka spoznáme aj počas bezplatnej úvodnej návštevy:",
  },
  {
    id: "location",
    title: "Kde sa škôlka nachádza?",
    answer: "Haf! 🐾 Nájdeš nás na adrese " + ADDRESS.street + ", " + ADDRESS.city + ". Na stránke nájdeš aj mapu a kontakt.",
  },
  {
    id: "space",
    title: "Aké priestory má škôlka?",
    answer: "Máme vyhrievané vnútorné priestory na hru aj oddych a vlastný vonkajší výbeh s rozlohou približne 80 m². 🐾 Striedame aktivity s prestávkami.",
  },
  {
    id: "caretakers",
    title: "Kto sa postará o psíkov?",
    answer: "Počas celého pobytu na psíkov dohliadajú minimálne dvaja opatrovatelia. 🐾 Sledujú hru a prispôsobujú aktivity aj oddych potrebám každého psíka.",
  },
  {
    id: "first_visit",
    title: "Ako prebieha prvá návšteva?",
    answer: firstVisit + "\nÚvodná návšteva je zadarmo. Ak psík potrebuje viac času, adaptáciu prispôsobíme jeho tempu.",
  },
  {
    id: "puppy",
    title: "Prijímate aj šteniatka?",
    answer: "Haf! 🐾 Áno, prijímame aj očkované šteniatka približne od 4 mesiacov. Záleží na veku, očkovaniach a pripravenosti na kolektív. Poďme si orientačne overiť, či tvoje šteniatko spĺňa základné podmienky. Konečné rozhodnutie urobíme po úvodnej návšteve.",
  },
];

export function AriaGuidedChat({ open, onClose, initialQuestionId, trackingPrefix, formPrefix }: {
  open: boolean; onClose: () => void; initialQuestionId: "pricing" | null;
  trackingPrefix: string; formPrefix: string;
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

  // Typewriter animation is visual only. Screen readers receive a complete
  // response in a single accessible text node; respect reduced motion.
  useEffect(() => {
    if (typingId === null) return;
    const text = messages.find(item => item.id === typingId)?.text;
    if (!text) { setTypingId(null); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedLength(text.length);
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
        count = Math.min(text.length, count + (mobile ? 3 : 2));
        setTypedLength(count);
        if (count >= text.length) {
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
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, messages.length, typedLength, showChoices, mode]);

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
      { id: id + 1, side: "aria", text: "Haf! 🐾 Kľudne sa opýtaj môjho panička cez tento krátky formulár. Radi ti odpovieme na e-mail alebo zavoláme." },
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
        className="aria-brand-experiment !fixed !flex !gap-0 left-2 right-2 bottom-[max(70px,calc(env(safe-area-inset-bottom)+60px))] top-auto z-50 h-[min(73dvh,680px)] min-h-0 w-auto max-w-none flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/80 backdrop-blur-3xl p-0 text-forest shadow-[0_24px_70px_rgba(25,48,37,.2)] sm:left-1/2 sm:right-auto sm:top-[54%] sm:bottom-auto sm:h-[min(85dvh,750px)] sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/60 bg-white/45 backdrop-blur-2xl px-4 py-3 pr-12">
          <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48} className="size-12 shrink-0 object-contain drop-shadow-sm" />
          <DialogTitle className="font-display text-base font-extrabold text-forest sm:text-lg">Aria z Chvostíkova</DialogTitle>
        </header>

        <div ref={scrollRef} role="log" aria-label="Konverzácia s Ariou" aria-live="polite"
          data-aria-chat-history className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[linear-gradient(145deg,rgba(255,240,213,.68),rgba(247,233,241,.55),rgba(237,248,240,.7))] backdrop-blur-xl px-3 py-4 sm:px-5">
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
                      ) : <span aria-hidden="true">{message.text.slice(0, typedLength)}</span>}
                      <span className="sr-only">{message.text}</span>
                      {typedLength > 0 && <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[#9e336f] align-middle" />}
                    </>
                  ) : message.text}
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

          {mode === "questions" && showChoices && typingId === null && unanswered.length > 0 &&
            !(initialQuestionId === "pricing" && !autoPricingAsked.current && !answered.includes("pricing")) && (
            <div className="pl-11">
              {messages.length > 0 && <p className="mb-2 text-xs font-bold text-[#26322b]">Čo ťa ešte zaujíma?</p>}
              <div data-aria-chat-questions className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                {unanswered.map(question => (
                  <button key={question.id} type="button" data-aria-chat-question={question.id}
                    onClick={() => question.id === "puppy" ? showPuppy() : ask(question)}
                    className={"min-h-11 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold leading-snug shadow-sm transition focus-visible:outline-2 focus-visible:outline-[#9e336f] " +
                      (question.id === "puppy"
                        ? "border-[#9e336f]/30 bg-[#f9e5ee] font-extrabold text-[#873063] hover:bg-[#f5d6e5]"
                        : "border-[#e4d9cb] bg-white text-[#26322b] hover:border-[#aa4b00]")}>
                    {question.title}
                  </button>
                ))}
                <button type="button" data-aria-chat-other-cta onClick={showOther}
                  className="col-span-full min-h-12 w-full rounded-xl bg-[#ffa414] px-3 py-2.5 text-xs font-extrabold text-[#26322b]">
                  Zaujíma ma niečo iné?
                </button>
              </div>
            </div>
          )}

          {mode === "questions" && messages.length > 0 && !showChoices && typingId === null && (
            <div data-aria-chat-followup className="space-y-3 pl-11">
              <p className="text-xs font-semibold leading-relaxed text-[#26322b]">
                Pomohla ti odpoveď? Ak máš záujem o škôlku pre svojho psíka, vyplň nezáväzný formulár a my sa ti ozveme späť.
              </p>
              <button ref={actionRef} type="button" data-aria-chat-interest-cta onClick={showInterest}
                className="min-h-12 w-full rounded-xl bg-[#9e336f] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm">
                Mám záujem
              </button>
              <p className="text-xs font-semibold leading-relaxed text-[#26322b]">
                Ak ťa ešte zaujíma niečo viac, vyber si ďalšiu otázku:
              </p>
              <div data-aria-chat-questions className="grid grid-cols-2 gap-2">
                {unanswered.map(question => (
                  <button key={question.id} type="button" data-aria-chat-question={question.id}
                    onClick={() => question.id === "puppy" ? showPuppy() : ask(question)}
                    className={"min-h-12 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold leading-snug focus-visible:outline-2 focus-visible:outline-[#9e336f] " +
                      (question.id === "puppy"
                        ? "border-[#9e336f]/30 bg-[#f9e5ee] font-extrabold text-[#873063]"
                        : "border-[#e4d9cb] bg-white text-[#26322b]")}>
                    {question.title}
                  </button>
                ))}
                <button type="button" data-aria-chat-other-cta onClick={showOther}
                  className="col-span-2 min-h-12 rounded-xl bg-[#ffa414] px-2.5 py-2 text-center text-xs font-extrabold text-[#26322b] shadow-sm focus-visible:outline-2 focus-visible:outline-[#9e336f]">
                  Zaujíma ma niečo iné?
                </button>
              </div>
            </div>
          )}

          {mode === "questions" && showChoices && unanswered.length === 0 && typingId === null && (
            <div data-aria-chat-followup className="space-y-2 pl-11">
              <p className="text-xs font-semibold text-[#26322b]">Prešli sme všetky pripravené otázky. Chceš nám nechať kontakt?</p>
              <button type="button" onClick={showInterest} className="min-h-11 w-full rounded-xl bg-[#9e336f] text-xs font-bold text-white">Mám záujem</button>
              <div data-aria-chat-questions className="grid grid-cols-2 gap-2">
                <button type="button" data-aria-chat-other-cta onClick={showOther}
                  className="col-span-full min-h-12 rounded-xl bg-[#ffa414] px-3 text-xs font-extrabold text-[#26322b]">Zaujíma ma niečo iné?</button>
              </div>
            </div>
          )}
        </div>

        {mode !== "questions" && (
          <div className="max-h-[61%] shrink-0 overflow-y-auto overscroll-contain border-t border-white/60 bg-white/65 backdrop-blur-2xl p-3 sm:p-4">
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
              <section aria-label="Nezáväzný záujem v chate" data-aria-chat-interest className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <h3 className="font-display text-sm font-bold text-forest">Krátky nezáväzný formulár 🐾</h3>
                <LeadStepForm trackingSource={formPrefix + "_interest"}
                  onSent={() => track("interest_submitted")} />
              </section>
            )}
            {mode === "other" && (
              <section aria-label="Iná otázka" data-aria-chat-other className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <h3 className="font-display text-sm font-bold text-forest">Napíš nám svoju otázku 🐾</h3>
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
