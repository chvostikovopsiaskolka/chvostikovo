import { useState } from "react";
import { Car, MapPin } from "lucide-react";
import { GALLERY, MAP_LINK } from "@/content/site";
import { LEAD_REVIEW_GAP_PHOTOS } from "./DaycarePhotoCarousel";
import { PhotoLightbox } from "./PhotoLightbox";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

/** Preview-only: four visual rows in two columns; lower existing carousel retains other schoolmate photos. */
export function AriaMosaicGallery({ includeLeadHighlights = false }: { includeLeadHighlights?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  // The two approved lead teaser images are NOT in GALLERY. Move the actual
  // originals into the existing gallery instead of repeating standalone cards.
  const photos = includeLeadHighlights
    ? [...GALLERY.slice(0, 8), ...LEAD_REVIEW_GAP_PHOTOS.map(photo => ({
        ...photo, caption: "Zo života škôlkarov",
      }))]
    : GALLERY.slice(0, 8);
  const left = photos.filter((_, i) => i % 2 === 0);
  const right = photos.filter((_, i) => i % 2 === 1);
  const heights = ["h-36 sm:h-52", "h-44 sm:h-60", "h-36 sm:h-52", "h-40 sm:h-52"];
  function tile(photo: (typeof photos)[number], index: number, row: number) {
    return (
      <button key={photo.src} type="button" onClick={() => setSelected(index)}
        aria-label={"Otvoriť fotografiu: " + photo.alt}
        data-aria-review-photo={includeLeadHighlights && index >= 8 ? index - 7 : undefined}
        className={"group relative block w-full overflow-hidden rounded-[20px] bg-forest/10 shadow-card transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral " + (includeLeadHighlights && index >= 8 ? "h-40 sm:h-[270px]" : heights[row % heights.length])}>
        <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" width={900} height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/30 via-transparent to-transparent" />
        {photo.caption && <span className="absolute bottom-2 left-2 rounded-full bg-card/85 px-2 py-1 text-[10px] font-semibold text-forest backdrop-blur-sm">{photo.caption}</span>}
      </button>
    );
  }
  return (
    <section id="aria-mosaic" data-aria-lead-photos={includeLeadHighlights || undefined}
      data-aria-intro-space={includeLeadHighlights || undefined}
      className="relative scroll-mt-24 overflow-hidden bg-card pb-9 pt-5 sm:pb-12 sm:pt-7" aria-labelledby="aria-mosaic-heading">
      <SectionAmbientPaws />
      <div data-aria-review-gap-photos={includeLeadHighlights || undefined} className="relative z-10 mx-auto max-w-4xl px-4">
        <p className="text-center font-display text-sm font-bold uppercase tracking-widest text-coral-dark">Nahliadnite k nám</p>
        <h2 id="aria-mosaic-heading" className="section-title mt-2 whitespace-nowrap text-center text-[clamp(18px,4.8vw,38px)]">Takto vyzerá Chvostíkovo</h2>
        <div data-aria-location-chips className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 sm:hidden">
          <a href={MAP_LINK} target="_blank" rel="noopener noreferrer"
            onClick={() => void trackCookielessInteraction("nav_click", "lead_aria_location_poljska6", "sk")}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-secondary px-2 py-2 text-center text-[11px] font-semibold text-forest">
            <MapPin className="size-4 shrink-0 text-coral" aria-hidden /> Poľská 6, Košice
          </a>
          <span className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-secondary px-2 py-2 text-center text-[11px] font-semibold text-forest">
            <Car className="size-4 shrink-0 text-coral" aria-hidden /> Bezplatné parkovanie
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="grid gap-2.5 sm:gap-4">{left.map((photo, i) => tile(photo, i * 2, i))}</div>
          <div className="grid gap-2.5 pt-5 sm:gap-4 sm:pt-9">{right.map((photo, i) => tile(photo, i * 2 + 1, i))}</div>
        </div>
      </div>
      <PhotoLightbox photos={photos} active={selected} onChange={setSelected}
        onClose={() => setSelected(null)} />
    </section>
  );
}
