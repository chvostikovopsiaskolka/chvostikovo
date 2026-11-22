import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { ChvostikovoPaw } from "./ChvostikovoPaw";
import { ARIA_HEAD_DATA_URI } from "@/assets/aria-assistant-head";
import { DAYCARE_ELIGIBILITY_ANSWER } from "@/content/daycare-eligibility";
import { EMAIL, FAQ, PRICING } from "@/content/site";
import { ShortForm } from "./Forms";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

type ChatMode = "questions" | "interest" | "other";
type ChatMessage = { id: number; side: "person" | "aria"; text: string };
type Question = { id: string; title: string; answer: string };

const findAnswer = (question: string) => FAQ.find((item) => item.q === question)?.a || "";
const priceOne = PRICING.find((item) => !item.highlight)?.price || "25 €";
const pricePass = PRICING.find((item) => item.highlight)?.price || "200 €";
const firstVisit = findAnswer("Ako prebieha prvá návšteva psíka v škôlke?").split(/\n+/)[0];
const safety = findAnswer("Ako zabezpečujete bezpečnosť psíkov v škôlke?").split(/\n+/);
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
    answer: DAYCARE_ELIGIBILITY_ANSWER +
      "\nKaždý nový psík absolvuje aj bezplatnú úvodnú návštevu. Vhodnosť do kolektívu posudzujeme individuálne.",
  },
  {
    id: "safety",
    title: "Ako zabezpečujete bezpečnosť?",
    answer: (safety[0] || "Bezpečnosť začína vstupnou návštevou.") +
      "\nPočas pobytu psíkov neustále sledujeme, striedame pohyb s oddychom a aktivity prispôsobujeme ich potrebám.",
  },
  {
    id: "supervision",
    title: "Bude môj psík niekedy sám?",
    answer: findAnswer("Bude môj psík počas dňa niekedy sám bez dozoru?"),
  },
  {
    id: "first_visit",
    title: "Ako prebieha prvá návšteva?",
    answer: firstVisit + "\nÚvodná návšteva je zadarmo. Ak psík potrebuje viac času, adaptáciu prispôsobíme jeho tempu.",
  },
  {
    id: "opening",
    title: "Kedy máte otvorené?",
    answer: findAnswer("Aké sú otváracie hodiny?") +
      "\nVyzdvihnutie alebo odvoz psíka ponúkame za 5 € za jednu jazdu.",
  },
];

function track(action: string) {
  // No free-text, name, phone or email enters behavioural event_source.
  void trackCookielessInteraction("explore_daycare", "aria_preview_v3_chat_" + action);
}

function supportHours(): boolean {
  try {
    const hour = Number(new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Bratislava",
    }).format(new Date()));
    return hour >= 8 && hour < 21;
  } catch {
    return false;
  }
}

export function AriaGuidedChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<ChatMode>("questions");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [showChoices, setShowChoices] = useState(true);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [typedLength, setTypedLength] = useState(0);
  const [otherQuestion, setOtherQuestion] = useState("");
  const [engaged, setEngaged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);
  const chatId = useId();
  const isDaytime = supportHours();
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
    let count = 0;
    const timer = window.setInterval(() => {
      count = Math.min(text.length, count + 4);
      setTypedLength(count);
      if (count >= text.length) {
        window.clearInterval(timer);
        setTypingId(null);
      }
    }, 22);
    return () => window.clearInterval(timer);
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
      { id: id + 1, side: "aria", text: question.answer },
    ]);
    setTypingId(id + 1);
  }

  function showInterest() {
    track("interest_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 2;
    setMessages(current => [...current,
      { id, side: "person", text: "Mám záujem o škôlku." },
      { id: id + 1, side: "aria", text: "To ma teší! 🐾 Nechaj nám kontakt a paniček sa ti ozve. Plemeno a meno psíka môžeš doplniť nepovinne." },
    ]);
    setMode("interest");
  }

  function showOther() {
    track("other_open");
    setEngaged(true);
    const id = nextId.current;
    nextId.current += 2;
    setMessages(current => [...current,
      { id, side: "person", text: "Chcem sa spýtať niečo iné." },
      { id: id + 1, side: "aria", text: isDaytime
        ? "Haf! Jasné, zavolám panička k notebooku. Živé správy ešte pripravujeme, ale e-mail mu môžeš poslať hneď."
        : "Haf! Paniček už možno spí. Keď ráno doplní moju misku, rád si prečíta tvoj e-mail. 🐾" },
    ]);
    setMode("other");
  }

  function finish() {
    track("answer_sufficient");
    setEngaged(true);
    onClose();
  }

  function backToQuestions() {
    setMode("questions");
    setShowChoices(unanswered.length > 0);
  }

  const emailLink = "mailto:" + EMAIL + "?subject=" +
    encodeURIComponent("Otázka cez Ariu – Chvostíkovo") + "&body=" +
    encodeURIComponent(otherQuestion.trim() + "\n\nOdoslané cez Ariu na chvostikovo.sk.");

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) closeChat(); }}>
      <DialogContent positioning="form" data-aria-chat aria-describedby={chatId + "-intro"} overlayClassName="!bg-forest-deep/25 !backdrop-blur-[12px]"
        className="aria-brand-experiment !fixed !flex !gap-0 left-2 right-2 bottom-[max(8px,env(safe-area-inset-bottom))] top-auto z-50 h-[min(90dvh,730px)] min-h-0 w-auto max-w-none flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/80 backdrop-blur-3xl p-0 text-forest shadow-[0_24px_70px_rgba(25,48,37,.2)] sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[min(85dvh,750px)] sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/60 bg-white/45 backdrop-blur-2xl px-4 py-3 pr-12">
          <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48} className="size-12 shrink-0 object-contain drop-shadow-sm" />
          <DialogTitle className="font-display text-base font-extrabold text-forest sm:text-lg">Aria z Chvostíkova</DialogTitle>
        </header>

        <div ref={scrollRef} role="log" aria-label="Konverzácia s Ariou" aria-live="polite"
          data-aria-chat-history className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[linear-gradient(145deg,rgba(255,240,213,.68),rgba(247,233,241,.55),rgba(237,248,240,.7))] backdrop-blur-xl px-3 py-4 sm:px-5">
          <div className="flex items-end gap-2">
            <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
            <div id={chatId + "-intro"} className="max-w-[87%] rounded-[20px_20px_20px_6px] bg-white px-3 py-3 text-[13px] leading-relaxed text-[#26322b] shadow-sm sm:text-sm">
              Haf! 🐾 Ahoj, ja som Aria. Čo ťa zaujíma o našej škôlke?
            </div>
          </div>

          {messages.map(message => {
            const isTyping = message.id === typingId;
            return (
              <div key={message.id} data-aria-chat-turn={message.side}
                className={"flex items-end gap-2 " + (message.side === "person" ? "justify-end" : "")}>
                {message.side === "aria" && <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />}
                <div data-aria-typing={isTyping ? "true" : undefined}
                  className={"max-w-[85%] whitespace-pre-line px-3 py-3 text-[13px] leading-relaxed shadow-sm sm:text-sm " +
                    (message.side === "person" ? "rounded-[20px_20px_6px_20px] bg-[#9e336f] text-white" :
                    "rounded-[20px_20px_20px_6px] bg-white text-[#26322b]")}>
                  {isTyping ? (
                    <>
                      <span aria-hidden="true">{message.text.slice(0, typedLength)}</span>
                      <span className="sr-only">{message.text}</span>
                      <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[#9e336f] align-middle" />
                    </>
                  ) : message.text}
                </div>
                {message.side === "person" && (
                  <span aria-label="Návštevník" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6d8e9] text-[#9e336f]">
                    <ChvostikovoPaw className="size-5" />
                  </span>
                )}
              </div>
            );
          })}

          {mode === "questions" && showChoices && typingId === null && unanswered.length > 0 && (
            <div className="pl-11">
              {messages.length > 0 && <p className="mb-2 text-xs font-bold text-[#26322b]">Čo ťa ešte zaujíma?</p>}
              <div data-aria-chat-questions className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                {unanswered.map(question => (
                  <button key={question.id} type="button" data-aria-chat-question={question.id}
                    onClick={() => ask(question)}
                    className="min-h-11 rounded-xl border border-[#e4d9cb] bg-white px-3 py-2.5 text-left text-xs font-semibold leading-snug text-[#26322b] shadow-sm transition hover:border-[#aa4b00] focus-visible:outline-2 focus-visible:outline-[#9e336f]">
                    {question.title}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={showInterest} className="min-h-10 rounded-xl bg-[#9e336f] px-4 text-xs font-bold text-white">Mám záujem o škôlku</button>
                  <button type="button" onClick={showOther} className="min-h-10 rounded-xl border border-[#9e336f]/30 px-4 text-xs font-bold text-[#9e336f]">Iná otázka</button>
                </div>
            </div>
          )}

          {mode === "questions" && messages.length > 0 && !showChoices && typingId === null && (
            <div data-aria-chat-followup className="space-y-3 pl-11">
              <p className="text-xs font-semibold leading-relaxed text-[#26322b]">
                Pomohla ti odpoveď? Ak máš záujem o psiu škôlku pre svojho psíka, môžeš nám nechať kontakt.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button ref={actionRef} type="button" onClick={showInterest} className="min-h-11 rounded-xl bg-[#9e336f] px-2 text-xs font-bold text-white">Mám záujem</button>
                {unanswered.length ? (
                  <button type="button" onClick={() => { track("more_questions"); setShowChoices(true); }}
                    className="min-h-11 rounded-xl border border-[#9e336f]/30 bg-white px-2 text-xs font-bold text-[#9e336f]">
                    Ďalšia otázka ({unanswered.length})
                  </button>
                ) : (
                  <button type="button" onClick={showOther} className="min-h-11 rounded-xl border border-[#9e336f]/30 bg-white px-2 text-xs font-bold text-[#9e336f]">Iná otázka</button>
                )}
              </div>
              {unanswered.length > 0 && (
                <button type="button" onClick={showOther} className="min-h-10 w-full rounded-xl border border-[#9e336f]/20 bg-white text-xs font-semibold text-[#9e336f]">Chcem sa spýtať niečo iné</button>
              )}
              <button type="button" onClick={finish} className="min-h-10 w-full rounded-xl border border-[#2d764b]/25 bg-[#edf3e9] text-xs font-bold text-[#26322b]">
                Odpoveď mi stačí, ďakujem ✓
              </button>
            </div>
          )}

          {mode === "questions" && showChoices && unanswered.length === 0 && typingId === null && (
            <div data-aria-chat-followup className="space-y-2 pl-11">
              <p className="text-xs font-semibold text-[#26322b]">Prešli sme všetky pripravené otázky. Chceš nám nechať kontakt?</p>
              <button type="button" onClick={showInterest} className="min-h-11 w-full rounded-xl bg-[#9e336f] text-xs font-bold text-white">Mám záujem</button>
              <button type="button" onClick={showOther} className="min-h-10 w-full rounded-xl border border-[#9e336f]/25 bg-white text-xs font-bold text-[#9e336f]">Iná otázka</button>
              <button type="button" onClick={finish} className="min-h-10 w-full rounded-xl bg-[#edf3e9] text-xs font-bold text-[#26322b]">Odpoveď mi stačí, ďakujem</button>
            </div>
          )}
        </div>

        {mode !== "questions" && (
          <div className="max-h-[61%] shrink-0 overflow-y-auto overscroll-contain border-t border-white/60 bg-white/65 backdrop-blur-2xl p-3 sm:p-4">
            {mode === "interest" && (
              <section aria-label="Nezáväzný záujem v chate" data-aria-chat-interest className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <h3 className="font-display text-sm font-bold text-forest">Nechaj nám kontakt 🐾</h3>
                <ShortForm hideInterest showChatDogFields trackingSource="aria_preview_chat_interest"
                  interestValue="Záujem cez chat Aria" onSent={() => track("interest_submitted")} />
              </section>
            )}
            {mode === "other" && (
              <section aria-label="Iná otázka" data-aria-chat-other className="space-y-2">
                <button type="button" onClick={backToQuestions} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                  <ArrowLeft size={15} aria-hidden /> Späť k otázkam
                </button>
                <label htmlFor={chatId + "-other"} className="block text-xs font-semibold text-forest">Čo by si sa chcel/a spýtať?</label>
                <textarea id={chatId + "-other"} rows={3} maxLength={600}
                  value={otherQuestion} onChange={event => setOtherQuestion(event.target.value)}
                  placeholder="Napíš svoju otázku…" className="field w-full resize-y text-sm" />
                <p className="text-[11px] text-forest/65">Otvoríme e-mailovú aplikáciu s pripravenou správou. Odošleš ju až tam; nič sa neposiela automaticky.</p>
                {otherQuestion.trim() ? (
                  <a href={emailLink} onClick={() => track("other_email_open")}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#9e336f] px-3 text-xs font-bold text-white">
                    <Mail size={16} aria-hidden /> Otvoriť e-mail <Send size={14} aria-hidden />
                  </a>
                ) : <span className="flex min-h-11 items-center justify-center rounded-xl bg-[#e4e4e4] text-xs font-semibold text-forest/60">Najprv napíš otázku</span>}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
