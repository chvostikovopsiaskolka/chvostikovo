import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, PawPrint, Send } from "lucide-react";
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

export function AriaGuidedChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ChatMode>("questions");
  const [dogName, setDogName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherQuestion, setOtherQuestion] = useState("");
  const [engaged, setEngaged] = useState(false);
  const chatId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const isDaytime = supportHours();

  useEffect(() => {
    if (!open) return;
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [open, messages.length, mode]);

  function closeChat() {
    if (!engaged && messages.length === 0) track("closed_without_selection");
    onClose();
  }

  function ask(question: Question) {
    setEngaged(true);
    track("question_" + question.id);
    const start = nextId.current;
    nextId.current += 2;
    setMessages((prior) => prior.concat([
      { id: start, side: "person", text: question.title },
      { id: start + 1, side: "aria", text: question.answer },
    ]));
    setMode("questions");
  }

  function showInterest() {
    track("interest_open");
    setEngaged(true);
    setMode("interest");
  }

  function showOther() {
    track("other_open");
    setEngaged(true);
    setMode("other");
  }

  const mailSubject = "Otázka cez Ariu – Chvostíkovo";
  const mailBody = (dogName.trim() ? "Meno psíka: " + dogName.trim() + "\n\n" : "") +
    otherQuestion.trim() + "\n\nOdoslané z kontaktného náhľadu Aria na chvostikovo.sk.";
  const mailHref = "mailto:" + EMAIL +
    "?subject=" + encodeURIComponent(mailSubject) + "&body=" + encodeURIComponent(mailBody);

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) closeChat(); }}>
      <DialogContent
        positioning="form"
        data-aria-chat
        aria-describedby={chatId + "-intro"}
        className="aria-brand-experiment !fixed inset-x-2 bottom-[max(8px,env(safe-area-inset-bottom))] z-50 flex h-[min(90dvh,730px)] min-h-0 w-auto max-w-[460px] flex-col gap-0 overflow-hidden rounded-[26px] border border-forest/15 bg-card p-0 text-forest shadow-[0_24px_70px_rgba(25,48,37,.3)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[460px]"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-forest/10 bg-secondary/50 px-4 py-3 pr-12">
          <img src={ARIA_HEAD_DATA_URI} alt="" width={48} height={48}
            className="size-12 shrink-0 object-contain drop-shadow-sm" />
          <div className="min-w-0">
            <DialogTitle className="font-display text-base font-extrabold text-forest">Aria z Chvostíkova</DialogTitle>
            <p className="text-[11px] text-forest/70">Virtuálna pomocníčka · pripravené odpovede</p>
          </div>
        </header>

        <div ref={scrollRef} data-aria-chat-history role="log" aria-label="Konverzácia s Ariou" aria-live="polite"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#f3f8ef] px-3 py-4 sm:px-4">
          <div className="flex items-end gap-2">
            <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
            <div id={chatId + "-intro"} className="max-w-[86%] rounded-[20px_20px_20px_6px] bg-white px-3 py-3 text-[13px] leading-relaxed text-[#26322b] shadow-sm">
              Haf! 🐾 Ahoj, som Aria. Čo ťa zaujíma o našej škôlke?
              {dogName.trim() && <span className="mt-1 block font-semibold">Rada pomôžem aj psíkovi {dogName.trim()}.</span>}
            </div>
          </div>
          {messages.map((message) => (
            <div key={message.id} data-aria-chat-turn={message.side}
              className={"flex items-end gap-2 " + (message.side === "person" ? "justify-end" : "")}>
              {message.side === "aria" && <img src={ARIA_HEAD_DATA_URI} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />}
              <div className={"max-w-[82%] whitespace-pre-line px-3 py-3 text-[13px] leading-relaxed shadow-sm " +
                (message.side === "person"
                  ? "rounded-[20px_20px_6px_20px] bg-[#9e336f] text-white"
                  : "rounded-[20px_20px_20px_6px] bg-white text-[#26322b]")}>
                {message.text}
              </div>
              {message.side === "person" && (
                <span aria-label="Návštevník" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6d8e9] text-[#9e336f]">
                  <PawPrint size={18} aria-hidden />
                </span>
              )}
            </div>
          ))}
          {messages.length > 0 && mode === "questions" && (
            <p data-aria-chat-followup className="pl-11 text-xs font-semibold text-[#26322b]">
              Pomohla ti odpoveď? Môžeš sa spýtať ďalšiu otázku alebo nám nechať kontakt.
            </p>
          )}
        </div>

        <div className="max-h-[50%] shrink-0 overflow-y-auto overscroll-contain border-t border-forest/10 bg-white p-3 sm:p-4">
          {mode === "questions" && (
            <div className="space-y-2">
              {messages.length === 0 && (
                <label className="block text-xs font-semibold text-forest">
                  Ako sa volá tvoj psík? <span className="font-normal text-forest/60">(nepovinné)</span>
                  <input type="text" maxLength={70} autoComplete="off" value={dogName}
                    onChange={(event) => setDogName(event.target.value)}
                    placeholder="Napríklad Bella" className="field mt-1.5 h-10 w-full text-sm" />
                </label>
              )}
              <p className="font-display text-xs font-bold text-forest">
                {messages.length ? "Čo ťa ešte zaujíma?" : "Vyber si otázku"}
              </p>
              <div data-aria-chat-questions className="grid grid-cols-1 gap-1.5 min-[390px]:grid-cols-2">
                {chatQuestions.map((question) => (
                  <button key={question.id} type="button" data-aria-chat-question={question.id}
                    onClick={() => ask(question)}
                    className="min-h-10 rounded-xl border border-[#e4d9cb] bg-[#fbf7f0] px-2.5 py-2 text-left text-[11px] font-semibold leading-snug text-[#26322b] transition hover:border-[#aa4b00] focus-visible:outline-2 focus-visible:outline-[#9e336f]">
                    {question.title}
                  </button>
                ))}
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={() => { track("answer_sufficient"); setEngaged(true); onClose(); }}
                  className="flex min-h-9 w-full items-center justify-center rounded-xl border border-[#2d764b]/25 bg-[#edf3e9] text-xs font-bold text-[#26322b]">
                  Odpoveď mi stačí, ďakujem ✓
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={showInterest}
                  className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-[#9e336f] px-2 text-xs font-bold text-white">
                  Mám záujem <ArrowRight size={15} aria-hidden />
                </button>
                <button type="button" onClick={showOther}
                  className="min-h-11 rounded-xl border border-[#9e336f]/30 px-2 text-xs font-bold text-[#9e336f]">
                  Iná otázka
                </button>
              </div>
            </div>
          )}

          {mode === "interest" && (
            <section aria-label="Nezáväzný záujem v chate" className="space-y-2" data-aria-chat-interest>
              <button type="button" onClick={() => setMode("questions")}
                className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                <ArrowLeft size={15} aria-hidden /> Späť k otázkam
              </button>
              <h3 className="font-display text-sm font-bold text-forest">Nechaj nám kontakt 🐾</h3>
              <p className="text-xs text-forest/70">Tento formulár skutočne odošle nezáväzný záujem. Nie je to živý chat.</p>
              <ShortForm hideInterest trackingSource="aria_preview_chat_interest"
                interestValue={"Záujem cez chat Aria" + (dogName.trim() ? " – psík " + dogName.trim() : "")}
                onSent={() => track("interest_submitted")} />
            </section>
          )}

          {mode === "other" && (
            <section aria-label="Iná otázka" className="space-y-2" data-aria-chat-other>
              <button type="button" onClick={() => setMode("questions")}
                className="flex min-h-9 items-center gap-1 text-xs font-semibold text-[#9e336f]">
                <ArrowLeft size={15} aria-hidden /> Späť k otázkam
              </button>
              <div className="rounded-xl bg-[#f3f8ef] p-3 text-xs leading-relaxed text-forest">
                {isDaytime
                  ? "Haf! Jasné, zavolám panička k notebooku. Živé správy ešte pripravujeme, otázku mu zatiaľ môžeš poslať e-mailom."
                  : "Haf! Paniček už možno spí. Keď ráno doplní moju misku, rád si prečíta tvoj e-mail. 🐾"}
              </div>
              <label htmlFor={chatId + "-other"} className="block text-xs font-semibold text-forest">Čo by si sa chcel/a spýtať?</label>
              <textarea id={chatId + "-other"} rows={3} maxLength={600}
                value={otherQuestion} onChange={(event) => setOtherQuestion(event.target.value)}
                placeholder="Napíš svoju otázku…" className="field w-full resize-y text-sm" />
              <p className="text-[11px] text-forest/65">Otvoríme e-mailovú aplikáciu s pripravenou správou. Odošleš ju až tam; nič sa neposiela automaticky.</p>
              {otherQuestion.trim() ? (
                <a href={mailHref} onClick={() => track("other_email_open")}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#9e336f] px-3 text-xs font-bold text-white">
                  <Mail size={16} aria-hidden /> Otvoriť e-mail <Send size={14} aria-hidden />
                </a>
              ) : (
                <span className="flex min-h-11 items-center justify-center rounded-xl bg-[#e4e4e4] text-xs font-semibold text-forest/60">
                  Najprv napíš otázku
                </span>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
