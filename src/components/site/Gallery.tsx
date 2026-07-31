import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { GALLERY, MAP_LINK } from "@/content/site";

export function Gallery() {
  const [index, setIndex] = useState(0);

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

        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GALLERY.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              className={`group relative overflow-hidden rounded-3xl ${
                i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading={i > 3 ? "lazy" : undefined}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  i === 0 ? "h-64 sm:h-full sm:min-h-[22rem]" : "h-44"
                }`}
              />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-deep/80 to-transparent p-3 text-left text-xs font-semibold text-cream">
                {img.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      {index >= 0 && (
        <Lightbox index={index} setIndex={setIndex} />
      )}
    </section>
  );
}

function Lightbox({
  index,
  setIndex,
}: {
  index: number;
  setIndex: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  // open lightbox whenever index changes via click
  const img = GALLERY[index];

  return (
    <>
      {open && img && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-forest-deep/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Predchádzajúca"
            className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index - 1 + GALLERY.length) % GALLERY.length);
            }}
          >
            <ChevronLeft />
          </button>
          <img src={img.src} alt={img.alt} className="max-h-[85vh] rounded-3xl object-contain" />
          <button
            type="button"
            aria-label="Nasledujúca"
            className="absolute right-4 flex size-11 items-center justify-center rounded-full bg-cream/90 text-forest"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index + 1) % GALLERY.length);
            }}
          >
            <ChevronRight />
          </button>
        </div>
      )}
      <span className="hidden" onClick={() => setOpen(true)} />
    </>
  );
}
