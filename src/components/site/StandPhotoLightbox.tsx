import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Photo = { src: string; alt: string; caption?: string; fullSrc?: string };

export function StandPhotoLightbox({
  photos,
  index,
  onSelect,
  onClose,
}: {
  photos: readonly Photo[];
  index: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const photo = photos[index];
  if (!photo) return null;
  const navigate = (step: number) => {
    onSelect((index + step + photos.length) % photos.length);
    setZoom(1);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        data-stand-lightbox
        className="flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-3 overflow-hidden rounded-2xl border-0 bg-forest p-3 text-cream shadow-xl sm:max-w-5xl sm:p-5 [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:size-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card [&>button]:text-forest [&>button]:opacity-100"
      >
        <div className="min-w-0 pr-12">
          <DialogTitle className="font-display text-lg font-bold leading-snug text-cream">
            Fotografia stojana {photo.caption ?? ""}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-cream/70 sm:text-sm">
            Detail ručne vyrábaného stojana. Priblížte si fotografiu tlačidlom + alebo dvojklikom.
          </DialogDescription>
        </div>
        <div
          data-stand-photo-viewport
          data-zoom={zoom}
          className="relative h-[min(70dvh,720px)] min-h-0 w-full overflow-auto overscroll-contain rounded-xl bg-black/25 touch-pan-x touch-pan-y"
          onDoubleClick={() => setZoom((value) => value === 1 ? 2 : 1)}
        >
          <img
            key={photo.src}
            src={photo.fullSrc ?? photo.src}
            alt={photo.alt}
            draggable={false}
            className="block h-full w-full max-w-none select-none object-contain"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label="Predchádzajúca fotografia"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-card/15 text-cream hover:bg-card/25 focus-visible:outline-2 focus-visible:outline-coral">
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-cream/80">{index + 1} / {photos.length}</span>
            <button type="button" onClick={() => navigate(1)} aria-label="Ďalšia fotografia"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-card/15 text-cream hover:bg-card/25 focus-visible:outline-2 focus-visible:outline-coral">
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div role="group" aria-label="Priblíženie fotografie" className="flex items-center gap-2">
            <button type="button" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
              aria-label="Oddialiť fotografiu"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-card/15 text-cream hover:bg-card/25 disabled:opacity-35">
              <ZoomOut aria-hidden="true" className="size-5" />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-cream/80">{Math.round(zoom * 100)} %</span>
            <button type="button" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
              aria-label="Priblížiť fotografiu"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-card/15 text-cream hover:bg-card/25 disabled:opacity-35">
              <ZoomIn aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
