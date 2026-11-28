import { useId, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { FAQ, DAYCARE_LOCATION_QUESTION } from "@/content/site";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

// Emphasise only verified words from the canonical FAQ; the underlying answer stays unchanged.
const HIGHLIGHTS: Record<string, string[]> = {
  [DAYCARE_LOCATION_QUESTION]: ["Poľskej 6", "Starou nemocnicou a Verejným cintorínom", "ulice Rastislavova pri autoumyvárke", "bezplatné parkovisko", "zastávka Poľská", "autobusy 12 a 54"],
  "Pre koho je škôlka určená?": ["stredné a veľké psy", "nad 15 kg", "približne od 4 mesiacov", "bezplatnej úvodnej návšteve"],
  "Bude môj psík počas dňa niekedy sám bez dozoru?": ["celodenným dohľadom", "minimálne dvaja skúsení opatrovatelia"],
  "Ako prebieha prvá návšteva psíka v škôlke?": ["vstupnú návštevu", "2–3 kratšie návštevy", "pravdivo všetko", "zoznamovanie prebieha postupne"],
  "Ako zabezpečujete bezpečnosť psíkov v škôlke?": ["Bezpečnosť začína už vstupnou návštevou.", "nie je výcvikové centrum", "neustálym dohľadom", "minimálne dvoch skúsených opatrovateľov", "pravidelný oddych", "konzultujeme situáciu s majiteľom"],
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?": ["vstupná návšteva", "postupne", "individuálne"],
  "Hrajú sa psíkovia v škôlke celý deň?": ["rovnako dôležitý je pre nás oddych", "striedajú aktivity", "prispôsobujeme dĺžku a intenzitu aktivít"],
  "Prijímate aj šteniatka?": ["ukončené kompletné očkovanie", "kotercovému kašľu", "vhodný adaptačný proces"],
  "Musím si rezervovať termín vopred?": ["do nedele 20:00", "individuálne"],
  "Zabezpečujete aj vyzdvihnutie a odvoz psíka?": ["5 € za jednu jazdu", "spolu s rezerváciou"],
  "Zabezpečujete aj stravu?": ["stravu nepodávame", "s dostatočným predstihom", "vlastné maškrty"],
  "Aké sú otváracie hodiny?": ["od 7:00 do 17:00"],
  "Aký je cenník a treba si rezervovať miesto vopred?": ["25 €", "200 €", "10 vstupov", "20 € za deň", "2 mesiace", "do nedele 20:00", "deň vopred do 19:00", "individuálne"],
  "Aké sú otváracie hodiny a ponúkate aj odvoz?": ["od 7:00 do 17:00", "5 € za jednu jazdu", "spolu s rezerváciou"],
};

function withHighlights(text: string, words: string[]): ReactNode[] {
  let pieces: ReactNode[] = [text];
  words.forEach((word, wordIndex) => {
    const next: ReactNode[] = [];
    pieces.forEach((piece, pieceIndex) => {
      if (typeof piece !== "string") {
        next.push(piece);
        return;
      }
      const parts = piece.split(word);
      parts.forEach((part, partIndex) => {
        if (partIndex > 0) {
          next.push(<strong key={`highlight-${wordIndex}-${pieceIndex}-${partIndex}`} className="font-semibold text-forest">{word}</strong>);
        }
        if (part) next.push(part);
      });
    });
    pieces = next;
  });
  return pieces;
}

/** Shared readable FAQ answer, on the homepage and the complete FAQ page. */
export function FaqAnswer({ question, answer, compact = false }: { question: string; answer: string; compact?: boolean }) {
  const paragraphs = answer.replace(/\u00a0/g, " ").split(question === DAYCARE_LOCATION_QUESTION ? /\n{2,}/ : /\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const highlights = HIGHLIGHTS[question] ?? [];
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={question === DAYCARE_LOCATION_QUESTION ? "whitespace-pre-line" : undefined}>{withHighlights(paragraph, highlights)}</p>
      ))}
    </div>
  );
}

export function ContextFaq({
  question,
  source,
  label,
  children,
}: {
  question: string;
  source: string;
  label?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  const item = FAQ.find((entry) => entry.q === question);
  if (!item) return null;

  return (
    <div className="overflow-hidden rounded-[2rem] bg-card text-left shadow-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => {
          if (!open) void trackCookielessInteraction("explore_daycare", `faq_${source}`);
          setOpen((value) => !value);
        }}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-[1.05rem] font-bold leading-snug text-forest sm:px-6 sm:text-lg"
      >
        <span>{label ?? question}</span>
        <span className="flex shrink-0 items-center justify-center text-coral" aria-hidden="true">
          {open ? <Minus className="size-5" /> : <Plus className="size-5" />}
        </span>
      </button>
      {open && (
        <div id={answerId} className="px-5 pb-6 text-[0.95rem] leading-relaxed text-forest/95 sm:px-6">
          <FaqAnswer question={item.q} answer={item.a} />
          {children}
        </div>
      )}
    </div>
  );
}
