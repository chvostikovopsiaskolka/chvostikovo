import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Photo = { src: string; alt: string; caption?: string; fullSrc?: string };

type Transform = { scale: number; x: number; y: number };
type Gesture =
  | { kind: "none" }
  | { kind: "pan"; atX: number; atY: number; x: number; y: number }
  | { kind: "pinch"; distance: number; scale: number; anchorX: number; anchorY: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Genuine two-finger pinch and one-finger pan after zooming, without zoom buttons. */
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const photo = photos[index];

  useEffect(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image) return;

    const transform: Transform = { scale: 1, x: 0, y: 0 };
    let gesture: Gesture = { kind: "none" };
    const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

    const apply = (scale: number, x: number, y: number) => {
      const rect = viewport.getBoundingClientRect();
      const nextScale = clamp(scale, MIN_ZOOM, MAX_ZOOM);
      const horizontal = rect.width * (nextScale - 1) / 2;
      const vertical = rect.height * (nextScale - 1) / 2;
      transform.scale = nextScale;
      transform.x = nextScale === 1 ? 0 : clamp(x, -horizontal, horizontal);
      transform.y = nextScale === 1 ? 0 : clamp(y, -vertical, vertical);
      image.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
      viewport.dataset.zoom = String(transform.scale);
    };

    const pinchPoints = (touches: TouchList) => {
      const first = touches.item(0)!;
      const second = touches.item(1)!;
      return {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2,
        distance: Math.max(1, Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)),
      };
    };

    const beginPinch = (touches: TouchList) => {
      const points = pinchPoints(touches);
      const rect = viewport.getBoundingClientRect();
      gesture = {
        kind: "pinch",
        distance: points.distance,
        scale: transform.scale,
        anchorX: (points.x - rect.left - rect.width / 2 - transform.x) / transform.scale,
        anchorY: (points.y - rect.top - rect.height / 2 - transform.y) / transform.scale,
      };
    };

    const beginPan = (touch: Touch) => {
      gesture = { kind: "pan", atX: touch.clientX, atY: touch.clientY, x: transform.x, y: transform.y };
    };

    const touchStart = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        event.preventDefault();
        beginPinch(event.touches);
      } else if (event.touches.length === 1 && transform.scale > 1) {
        beginPan(event.touches.item(0)!);
      }
    };

    const touchMove = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        event.preventDefault();
        if (gesture.kind !== "pinch") beginPinch(event.touches);
        if (gesture.kind !== "pinch") return;
        const points = pinchPoints(event.touches);
        const rect = viewport.getBoundingClientRect();
        const scale = clamp(gesture.scale * points.distance / gesture.distance, MIN_ZOOM, MAX_ZOOM);
        apply(scale,
          points.x - rect.left - rect.width / 2 - gesture.anchorX * scale,
          points.y - rect.top - rect.height / 2 - gesture.anchorY * scale);
      } else if (event.touches.length === 1 && transform.scale > 1) {
        event.preventDefault();
        if (gesture.kind !== "pan") beginPan(event.touches.item(0)!);
        if (gesture.kind !== "pan") return;
        const touch = event.touches.item(0)!;
        apply(transform.scale,
          gesture.x + touch.clientX - gesture.atX,
          gesture.y + touch.clientY - gesture.atY);
      }
    };

    const touchEnd = (event: TouchEvent) => {
      if (event.touches.length >= 2) beginPinch(event.touches);
      else if (event.touches.length === 1 && transform.scale > 1) beginPan(event.touches.item(0)!);
      else gesture = { kind: "none" };
    };

    // Trackpads generate ctrl+wheel for pinch; keep zoom centered on the fingers/cursor.
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const nextScale = clamp(transform.scale * Math.exp(-event.deltaY * 0.01), MIN_ZOOM, MAX_ZOOM);
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;
      const factor = nextScale / transform.scale;
      apply(nextScale,
        offsetX - (offsetX - transform.x) * factor,
        offsetY - (offsetY - transform.y) * factor);
    };
    const preventNativeGesture = (event: Event) => event.preventDefault();

    viewport.addEventListener("touchstart", touchStart, { passive: false });
    viewport.addEventListener("touchmove", touchMove, { passive: false });
    viewport.addEventListener("touchend", touchEnd, { passive: false });
    viewport.addEventListener("touchcancel", touchEnd, { passive: false });
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("gesturestart", preventNativeGesture, { passive: false });
    viewport.addEventListener("gesturechange", preventNativeGesture, { passive: false });
    viewport.addEventListener("gestureend", preventNativeGesture, { passive: false });
    apply(1, 0, 0);

    return () => {
      viewport.removeEventListener("touchstart", touchStart);
      viewport.removeEventListener("touchmove", touchMove);
      viewport.removeEventListener("touchend", touchEnd);
      viewport.removeEventListener("touchcancel", touchEnd);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("gesturestart", preventNativeGesture);
      viewport.removeEventListener("gesturechange", preventNativeGesture);
      viewport.removeEventListener("gestureend", preventNativeGesture);
    };
  }, [index, photo?.src]);

  if (!photo) return null;
  const navigate = (step: number) => onSelect((index + step + photos.length) % photos.length);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        data-stand-lightbox
        className="z-[120] flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-3 overflow-hidden rounded-2xl border-0 bg-forest p-3 text-cream shadow-xl sm:max-w-5xl sm:p-5 [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:size-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card [&>button]:text-forest [&>button]:opacity-100"
      >
        <div className="min-w-0 pr-12">
          <DialogTitle className="font-display text-lg font-bold leading-snug text-cream">
            Fotografia stojana {photo.caption ?? ""}
          </DialogTitle>
          <DialogDescription className="sr-only">Detail ručne vyrábaného stojana.</DialogDescription>
        </div>
        <div
          ref={viewportRef}
          data-stand-photo-viewport
          data-pinch-enabled="true"
          data-zoom="1"
          className="relative h-[min(70dvh,720px)] min-h-0 w-full overflow-hidden overscroll-contain rounded-xl bg-black/25 touch-none"
        >
          <img
            ref={imageRef}
            key={photo.src}
            src={photo.fullSrc ?? photo.src}
            alt={photo.alt}
            draggable={false}
            className="block h-full w-full max-w-none select-none object-contain"
            style={{ transformOrigin: "center center", willChange: "transform" }}
          />
        </div>
        <div className="flex items-center justify-center gap-3 pb-1">
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
      </DialogContent>
    </Dialog>
  );
}
