import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY, MAP_LINK } from "@/content/site";

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);
  const img = active === null ? null : GALLERY[active];

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

        <div className="mt-8 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GALLERY.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActive(i)}
              className={`group relative overflow-hidden rounded-3xl ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading={i > 3 ? "lazy" : undefined}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-deep/85 to-transparent p-3 text-left text-xs font-semibold text-cream">
                {item.caption}
              </span>
            </button>
          ))}
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
