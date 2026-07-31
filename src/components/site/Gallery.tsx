import { useRef, useState } from "react";
import { MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY, MAP_LINK } from "@/content/site";

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);
  const img = active === null ? null : GALLERY[active];
  const track = useRef<HTMLDivElement>(null);

  function slide(dir: -1 | 1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  }

  return (
    <section id="priestory" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title text-3xl sm:text-4xl">Kde bude váš psík počas dňa?</h2>
            <p className="mt-3 max-w-2xl text-forest/80">
              V Chvostíkove má váš psík k dispozícii vykurované vnútorné miestnosti a bezpečný
              vonkajší výbeh s rozlohou približne 80 m² na hry, šantenie a oddych.
            </p>
          </div>
          <a
            href={MAP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-forest"
          >
            <MapPin className="size-4" /> Poľská 6, Košice
          </a>
        </div>

        <div className="relative mt-8">
          <div
            ref={track}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {GALLERY.map((item, i) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setActive(i)}
                className="group relative h-64 w-[78%] shrink-0 snap-start overflow-hidden rounded-4xl shadow-card sm:h-80 sm:w-[46%] lg:w-[31%]"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading={i > 2 ? "lazy" : undefined}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-deep/85 to-transparent p-4 text-left text-sm font-semibold text-cream">
                  {item.caption}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              aria-label="Predchádzajúce fotky"
              onClick={() => slide(-1)}
              className="flex size-11 items-center justify-center rounded-full bg-card text-forest shadow-card transition hover:bg-secondary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Ďalšie fotky"
              onClick={() => slide(1)}
              className="flex size-11 items-center justify-center rounded-full bg-card text-forest shadow-card transition hover:bg-secondary"
            >
              <ChevronRight className="size-5" />
            </button>
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
            aria-label="Zavrieť"
            className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest"
            onClick={() => setActive(null)}
          >
            <X />
          </button>
          <button
            type="button"
            aria-label="Predchádzajúca fotka"
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
              alt={img.alt}
              className="max-h-[80vh] rounded-3xl object-contain shadow-soft"
            />
            <figcaption className="mt-3 font-display text-sm font-semibold text-cream">
              {img.caption}
            </figcaption>
          </figure>
          <button
            type="button"
            aria-label="Nasledujúca fotka"
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
