import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = {
  src: string;
  fullSrc?: string;
  alt: string;
  caption?: string | undefined;
};

/** Shared public-web photo viewer: controls stay beside the image, never at viewport edges. */
export function PhotoLightbox({
  photos, active, onChange, onClose, language = "sk",
}: {
  photos: readonly LightboxPhoto[];
  active: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
  language?: "sk" | "en";
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const activeRef = useRef(active);
  const changeRef = useRef(onChange);
  const closeRef = useRef(onClose);
  activeRef.current = active;
  changeRef.current = onChange;
  closeRef.current = onClose;
  const open = active !== null;
  const en = language === "en";
  const count = photos.length;

  useEffect(() => {
    if (!open) return;
    const focusBefore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      } else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && count > 1) {
        event.preventDefault();
        const current = activeRef.current;
        if (current !== null) changeRef.current((current + (event.key === "ArrowRight" ? 1 : -1) + count) % count);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      focusBefore?.focus({ preventScroll: true });
    };
  }, [open, count]);

  if (active === null || count === 0 || !photos[active]) return null;
  const photo = photos[active]!;
  const imageSrc = photo.fullSrc || photo.src;
  const step = (direction: -1 | 1) => onChange((active + direction + count) % count);
  const start = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) origin.current = { x: touch.clientX, y: touch.clientY };
  };
  const end = (event: TouchEvent<HTMLDivElement>) => {
    const point = origin.current;
    origin.current = null;
    const touch = event.changedTouches[0];
    if (!point || !touch || count < 2) return;
    const dx = touch.clientX - point.x;
    const dy = touch.clientY - point.y;
    // Never hijack a vertical page gesture or a short tap.
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
  };

  return (
    <div data-photo-lightbox role="dialog" aria-modal="true"
      aria-label={en ? `Photo ${active + 1} of ${count}` : `Fotografia ${active + 1} z ${count}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-forest-deep/95 p-2.5 sm:p-6"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div data-photo-lightbox-frame className="relative inline-flex max-h-[calc(100dvh-20px)] max-w-[calc(100vw-20px)] flex-col items-center justify-center"
        onTouchStart={start} onTouchEnd={end} onTouchCancel={() => { origin.current = null; }}
        style={{ touchAction: "pan-y" }}>
        <div data-photo-lightbox-media className="relative inline-flex max-w-full items-center justify-center">
        <img data-photo-lightbox-image src={imageSrc} alt={photo.alt}
          loading="eager" decoding="async" draggable={false}
          onError={() => setFailedSrc(imageSrc)} onLoad={() => setFailedSrc(null)}
          className="block min-h-[160px] min-w-[min(70vw,260px)] max-h-[calc(100dvh-34px)] max-w-[calc(100vw-20px)] select-none rounded-[22px] bg-secondary/20 object-contain shadow-soft sm:max-h-[85dvh] sm:max-w-[88vw]"
        />
        <button ref={closeButton} type="button"
          aria-label={en ? "Close gallery" : "Zavrieť galériu"}
          data-photo-lightbox-close
          className="absolute right-2 top-2 z-30 grid size-9 place-items-center rounded-full bg-cream/95 text-forest shadow-soft focus-visible:outline-2 focus-visible:outline-coral sm:right-3 sm:top-3 sm:size-10"
          onClick={onClose}>
          <X className="size-[18px]" aria-hidden />
        </button>
        {count > 1 && (
          <>
            <button type="button" aria-label={en ? "Previous photo" : "Predchádzajúca fotografia"}
              data-photo-lightbox-prev
              className="absolute left-1.5 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-cream/95 text-forest shadow-soft focus-visible:outline-2 focus-visible:outline-coral sm:left-3 sm:size-10"
              onClick={() => step(-1)}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" aria-label={en ? "Next photo" : "Nasledujúca fotografia"}
              data-photo-lightbox-next
              className="absolute right-1.5 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-cream/95 text-forest shadow-soft focus-visible:outline-2 focus-visible:outline-coral sm:right-3 sm:size-10"
              onClick={() => step(1)}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
        </div>
        {failedSrc === imageSrc
          ? <p role="status" className="mt-2 max-w-[90vw] px-2 text-center text-xs text-cream/90">Fotografiu sa nepodarilo načítať. Skúste ďalšiu.</p>
          : photo.caption && <p className="mt-2 max-w-[90vw] px-2 text-center font-display text-xs font-semibold text-cream sm:text-sm">{photo.caption}</p>}
      </div>
    </div>
  );
}
