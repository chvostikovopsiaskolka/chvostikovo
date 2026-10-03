import { useRef, useState } from "react";
import { Car, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY, MAP_LINK } from "@/content/site";
import { Collapse } from "./Collapse";

const HYGIENE_SK = [
  {
    icon: "🧼",
    title: "Pravidelná dezinfekcia",
    text: "Naše priestory pravidelne dezinfikujeme, aby boli pre psíkov vždy čisté a bezpečné.",
  },
  {
    icon: "💡",
    title: "Germicídna lampa s ozónom",
    text: "Pravidelne využívame germicídnu lampu s ozónom na dezinfekciu priestorov, hračiek a pomôcok, čím znižujeme množstvo baktérií a vírusov a udržiavame zdravé prostredie.",
  },
  {
    icon: "🐾",
    title: "Každodenná čistota",
    text: "Po každom dni priestory dôkladne upratujeme a pripravujeme na ďalší deň, aby sa u nás psíkovia cítili príjemne a bezpečne.",
  },
];

const HYGIENE_EN = [
  {
    icon: "🧼",
    title: "Regular disinfection",
    text: "We regularly disinfect our spaces so they stay clean and safe for the dogs in our care.",
  },
  {
    icon: "💡",
    title: "Germicidal ozone lamp",
    text: "We regularly use a germicidal ozone lamp to disinfect rooms, toys and equipment, helping reduce bacteria and viruses and maintain a healthy environment.",
  },
  {
    icon: "🐾",
    title: "Cleaned every day",
    text: "At the end of each day we thoroughly clean and prepare the daycare for the next day so dogs can enjoy a pleasant, safe environment.",
  },
];

const GALLERY_EN = [
  "Indoor spaces",
  "Outdoor run",
  "Daycare dogs during the day",
  "Playtime in the outdoor run",
  "Our pack",
  "Rest during the day",
  "80 m² outdoor run",
  "Secure outdoor run",
];

export function Gallery({ language = "sk" }: { language?: "sk" | "en" }) {
  const [active, setActive] = useState<number | null>(null);
  const img = active === null ? null : GALLERY[active];
  const track = useRef<HTMLDivElement>(null);
  const isEnglish = language === "en";
  const hygiene = isEnglish ? HYGIENE_EN : HYGIENE_SK;

  function slide(dir: -1 | 1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  }

  return (
    <section id={isEnglish ? "spaces" : "priestory"} className="scroll-mt-24 overflow-x-clip pt-8 pb-14 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title text-3xl sm:text-4xl">
              {isEnglish ? "Where will your dog spend the day?" : "Kde bude váš psík počas dňa?"}
            </h2>
            <p className="mt-3 max-w-2xl text-forest/80">
              {isEnglish
                ? "At Chvostíkovo your dog has heated indoor rooms and a secure outdoor run of approximately 80 m² for movement, play and rest."
                : "V Chvostíkove má váš psík k dispozícii vykurované vnútorné miestnosti a bezpečný vonkajší výbeh s rozlohou približne 80 m² na hry, šantenie a oddych."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-forest"
            >
              <MapPin className="size-4" /> Poľská 6, Košice
            </a>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-forest">
              <Car className="size-4 text-coral" /> {isEnglish ? "Free parking by the daycare" : "Bezplatné parkovanie pri škôlke"}
            </span>
          </div>
        </div>

        <div className="relative left-1/2 mt-8 w-[calc(100vw-24px)] -translate-x-1/2 sm:w-[calc(100vw-48px)]">
          <div
            ref={track}
            className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {GALLERY.map((item, i) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setActive(i)}
                className="group relative h-64 w-[82vw] shrink-0 snap-start overflow-hidden rounded-4xl shadow-card sm:h-80 sm:w-[46vw] lg:w-[31vw]"
              >
                <img
                  src={item.src}
                  alt={isEnglish ? `Chvostíkovo dog daycare in Košice – photo ${i + 1}` : item.alt}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-deep/85 to-transparent p-4 text-left text-sm font-semibold text-cream">
                  {isEnglish ? GALLERY_EN[i] : item.caption}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              aria-label={isEnglish ? "Previous photos" : "Predchádzajúce fotky"}
              onClick={() => slide(-1)}
              className="flex size-11 items-center justify-center rounded-full bg-card text-forest shadow-card transition hover:bg-secondary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label={isEnglish ? "Next photos" : "Ďalšie fotky"}
              onClick={() => slide(1)}
              className="flex size-11 items-center justify-center rounded-full bg-card text-forest shadow-card transition hover:bg-secondary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="section-title text-center text-xl sm:text-2xl">
            {isEnglish ? "How do we keep the daycare clean?" : "Ako zabezpečujeme čistotu priestorov?"}
          </h3>
          <div className="mt-6 grid items-start gap-4 sm:grid-cols-3">
            {hygiene.map((h) => (
              <Collapse
                key={h.title}
                title={h.title}
                icon={
                  <span className="text-xl" aria-hidden>
                    {h.icon}
                  </span>
                }
              >
                {h.text}
              </Collapse>
            ))}
          </div>
        </div>
      </div>

      {img && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-forest-deep/90 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label={isEnglish ? "Close" : "Zavrieť"}
            className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest"
            onClick={() => setActive(null)}
          >
            <X />
          </button>
          <button
            type="button"
            aria-label={isEnglish ? "Previous photo" : "Predchádzajúca fotka"}
            className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest sm:left-8"
            onClick={(e) => {
              e.stopPropagation();
              setActive(((active as number) - 1 + GALLERY.length) % GALLERY.length);
            }}
          >
            <ChevronLeft />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="text-center">
            <img
              src={img.src}
              alt={isEnglish ? `Chvostíkovo dog daycare in Košice – photo ${(active as number) + 1}` : img.alt}
              decoding="async"
              className="max-h-[80vh] rounded-3xl object-contain shadow-soft"
            />
            <figcaption className="mt-3 font-display text-sm font-semibold text-cream">
              {isEnglish ? GALLERY_EN[active as number] : img.caption}
            </figcaption>
          </figure>
          <button
            type="button"
            aria-label={isEnglish ? "Next photo" : "Nasledujúca fotka"}
            className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest sm:right-8"
            onClick={(e) => {
              e.stopPropagation();
              setActive(((active as number) + 1) % GALLERY.length);
            }}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
