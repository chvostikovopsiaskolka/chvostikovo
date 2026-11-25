import { Fragment, useRef, useState } from "react";
import { Car, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoLightbox } from "./PhotoLightbox";
import { GALLERY, MAP_LINK } from "@/content/site";
import { highQualityMosaicSrc } from "./AriaMosaicGallery";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

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

export function Gallery({ language = "sk", homeMosaic = false }: { language?: "sk" | "en"; homeMosaic?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const isEnglish = language === "en";
  const hygiene = isEnglish ? HYGIENE_EN : HYGIENE_SK;
  const photos = GALLERY.map(photo => ({ ...photo, src: homeMosaic ? highQualityMosaicSrc(photo.src) : photo.src }));

  function slide(dir: -1 | 1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  }

  return (
    <section id={isEnglish ? "spaces" : "priestory"} className="relative scroll-mt-24 overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
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
          <div className="flex flex-nowrap items-center gap-1.5 self-start whitespace-nowrap sm:justify-end sm:gap-2">
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-forest min-[390px]:px-3 min-[390px]:text-xs sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <MapPin className="size-4" /> Poľská 6, Košice
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-forest min-[390px]:px-3 min-[390px]:text-xs sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <Car className="size-4 text-coral" /> {isEnglish ? "Free parking by the daycare" : "Bezplatné parkovanie pri škôlke"}
            </span>
          </div>
        </div>

        {homeMosaic ? (
          <div data-home-spaces-mosaic className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            {photos.map((photo, i) => (
              <Fragment key={photo.src}>
                <button data-home-space-photo type="button" onClick={() => setActive(i)}
                  aria-label={isEnglish ? "Open daycare photo" : "Otvoriť fotografiu: " + photo.alt}
                  className={"group relative block w-full overflow-hidden rounded-3xl bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral aspect-[5/4]"}>
                  <img src={photo.src} srcSet={GALLERY[i]!.src + " 900w, " + photo.src + " 1600w"}
                    sizes="(min-width: 1152px) 362px, (min-width: 1024px) 31vw, 46vw" width={1600} height={1600}
                    alt={photo.alt} loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-deep/85 to-transparent p-3 text-left text-xs font-semibold text-cream sm:text-sm">{photo.caption}</span>
                </button>
                {i % 2 === 1 && i < 6 && (() => { const h = hygiene[(i - 1) / 2]!; return (
                  <article data-home-mosaic-hygiene aria-label={(isEnglish ? "Daycare cleaning – " : "Čistota priestorov – ") + h.title}
                    className="col-span-2 rounded-3xl border border-forest/10 bg-card p-5 shadow-card lg:hidden">
                    <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-coral">{isEnglish ? "How we keep the daycare clean" : "Ako zabezpečujeme čistotu priestorov"}</p>
                    <div className="flex items-center gap-3"><span aria-hidden="true" className="shrink-0 text-2xl">{h.icon}</span><h3 className="font-display text-lg font-bold leading-snug text-forest">{h.title}</h3></div>
                    <p className="mt-3 text-sm leading-relaxed text-forest/80">{h.text}</p>
                  </article>
                ); })()}
              </Fragment>
            ))}
          </div>
        ) : (
        <div className="relative left-1/2 mt-8 w-[calc(100vw-24px)] -translate-x-1/2 sm:w-[calc(100vw-48px)]">
          <div
            ref={track}
            className="flex w-full touch-auto snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {GALLERY.map((item, i) => (
              <Fragment key={item.src}>
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
              {i < hygiene.length && (
                <article
                  aria-label={isEnglish ? `Daycare cleaning – ${hygiene[i]!.title}` : `Čistota priestorov – ${hygiene[i]!.title}`}
                  className="flex min-h-64 w-[82vw] shrink-0 snap-start flex-col justify-center rounded-4xl border border-forest/10 bg-card p-5 text-left shadow-card sm:hidden"
                >
                  <p className="mb-4 font-display text-xs font-bold tracking-wide text-coral uppercase">
                    {isEnglish ? "How we keep the daycare clean" : "Ako zabezpečujeme čistotu priestorov"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-2xl leading-none" aria-hidden="true">{hygiene[i]!.icon}</span>
                    <h3 className="min-w-0 font-display text-lg font-bold leading-snug text-forest">{hygiene[i]!.title}</h3>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-forest/80 min-[390px]:text-sm">{hygiene[i]!.text}</p>
                </article>
              )}
              </Fragment>
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
        )}

        {/* On desktop retain the three hygiene cards, now readable without an extra click. */}
        <div data-spaces-hygiene className={homeMosaic ? "mt-10 hidden lg:block" : "mt-10 hidden sm:block"}>
          <h3 className="section-title text-center text-xl sm:text-2xl">
            {isEnglish ? "How do we keep the daycare clean?" : "Ako zabezpečujeme čistotu priestorov?"}
          </h3>
          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-3">
            {hygiene.map((h) => (
              <article key={h.title} className="rounded-[2rem] bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-2xl leading-none" aria-hidden="true">{h.icon}</span>
                  <h4 className="min-w-0 font-display text-lg font-bold leading-snug text-forest">{h.title}</h4>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-forest/80">{h.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <PhotoLightbox
        photos={photos.map((photo, index) => ({
          src: photo.src,
          alt: isEnglish ? `Chvostíkovo dog daycare in Košice – photo ${index + 1}` : photo.alt,
          caption: isEnglish ? GALLERY_EN[index] : photo.caption,
        }))}
        active={active} onChange={setActive} onClose={() => setActive(null)} language={language}
      />
    </section>
  );
}
