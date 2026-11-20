import { useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GALLERY } from "@/content/site";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

/** Preview-only: four visual rows in two columns; lower existing carousel retains other schoolmate photos. */
export function AriaMosaicGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const photos = GALLERY.slice(0, 8);
  const left = photos.filter((_, i) => i % 2 === 0);
  const right = photos.filter((_, i) => i % 2 === 1);
  const heights = ["h-36 sm:h-52", "h-44 sm:h-60", "h-36 sm:h-52", "h-40 sm:h-52"];
  function onStart(event: TouchEvent<HTMLDivElement>) {
    const finger = event.touches[0];
    if (finger) touchStart.current = { x: finger.clientX, y: finger.clientY };
  }
  function onFinish(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    const finger = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !finger || selected === null) return;
    const dx = finger.clientX - start.x;
    const dy = finger.clientY - start.y;
    // Respect vertical scrolling; navigate only on an intentional horizontal swipe.
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
    setSelected((current) => current === null ? null : (current + (dx < 0 ? 1 : photos.length - 1)) % photos.length);
  }
  function tile(photo: (typeof photos)[number], index: number, row: number) {
    return (
      <button key={photo.src} type="button" onClick={() => setSelected(index)}
        aria-label={"Otvoriť fotografiu: " + photo.alt}
        className={"group relative block w-full overflow-hidden rounded-[20px] bg-forest/10 shadow-card transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral " + heights[row]}>
        <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" width={900} height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/30 via-transparent to-transparent" />
        {photo.caption && <span className="absolute bottom-2 left-2 rounded-full bg-card/85 px-2 py-1 text-[10px] font-semibold text-forest backdrop-blur-sm">{photo.caption}</span>}
      </button>
    );
  }
  return (
    <section id="aria-mosaic" className="relative scroll-mt-24 overflow-hidden bg-card py-9 sm:py-14" aria-labelledby="aria-mosaic-heading">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <p className="text-center font-display text-sm font-bold uppercase tracking-widest text-coral-dark">Nahliadnite k nám</p>
        <h2 id="aria-mosaic-heading" className="section-title mt-2 text-center text-3xl sm:text-4xl">Takto vyzerá deň v Chvostíkove</h2>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="grid gap-2.5 sm:gap-4">{left.map((photo, i) => tile(photo, i * 2, i))}</div>
          <div className="grid gap-2.5 pt-5 sm:gap-4 sm:pt-9">{right.map((photo, i) => tile(photo, i * 2 + 1, i))}</div>
        </div>
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg border-none bg-forest px-3 pb-4 pt-12 text-white [&>button]:right-3 [&>button]:top-2 [&>button]:rounded-full [&>button]:bg-white/15 [&>button]:p-2" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Galéria Chvostíkova</DialogTitle>
          {selected !== null && photos[selected] && (
            <div onTouchStart={onStart} onTouchEnd={onFinish} className="touch-pan-y">
              <img src={photos[selected].src} alt={photos[selected].alt} className="mx-auto max-h-[70dvh] w-full rounded-xl object-contain" />
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setSelected((selected - 1 + photos.length) % photos.length)} className="grid size-11 place-items-center rounded-full bg-white/15" aria-label="Predchádzajúca fotografia"><ChevronLeft aria-hidden /></button>
                <span className="text-sm">{selected + 1} / {photos.length}</span>
                <button type="button" onClick={() => setSelected((selected + 1) % photos.length)} className="grid size-11 place-items-center rounded-full bg-white/15" aria-label="Nasledujúca fotografia"><ChevronRight aria-hidden /></button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
