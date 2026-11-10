import { useId, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { FAQ } from "@/content/site";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

// Emphasise only verified words from the canonical FAQ; the underlying answer stays unchanged.
const HIGHLIGHTS: Record<string, string[]> = {
  "Bude môj psík počas dňa niekedy sám bez dozoru?": ["celodenným dohľadom", "minimálne dvaja skúsení opatrovatelia"],
  "Ako prebieha prvá návšteva psíka v škôlke?": ["vstupnú návštevu", "2–3 kratšie návštevy", "pravdivo všetko"],
  "Ako zabezpečujete bezpečnosť psíkov v škôlke?": ["Bezpečnosť začína už vstupnou návštevou.", "nie je výcvikové centrum", "neustálym dohľadom", "pravidelný oddych"],
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?": ["vstupná návšteva", "postupne", "individuálne"],
  "Hrajú sa psíkovia v škôlke celý deň?": ["rovnako dôležitý je pre nás oddych", "striedajú aktivity", "prispôsobujeme dĺžku a intenzitu aktivít"],
  "Prijímate aj šteniatka?": ["ukončené kompletné očkovanie", "kotercovému kašľu", "vhodný adaptačný proces"],
  "Musím si rezervovať termín vopred?": ["do nedele 20:00", "individuálne"],
  "Zabezpečujete aj vyzdvihnutie a odvoz psíka?": ["5 € za jednu jazdu", "spolu s rezerváciou"],
  "Zabezpečujete aj stravu?": ["stravu nepodávame", "s dostatočným predstihom", "vlastné maškrty"],
  "Aké sú otváracie hodiny?": ["od 7:00 do 17:00"],
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
export function FaqAnswer({ question, answer }: { question: string; answer: string }) {
  const paragraphs = answer.replace(/\u00a0/g, " ").split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const highlights = HIGHLIGHTS[question] ?? [];
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{withHighlights(paragraph, highlights)}</p>
      ))}
    </div>
  );
}

export function ContextFaq({
  question,
  source,
  label,
}: {
  question: string;
  source: string;
  label?: string;
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
        </div>
      )}
    </div>
  );
}
