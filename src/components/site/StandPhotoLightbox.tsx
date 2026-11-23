import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Photo = { src: string; alt: string; caption?: string; fullSrc?: string };

type Transform = { scale: number; x: number; y: number };
type Gesture =
  | { kind: "none" }
  | { kind: "swipe"; atX: number; atY: number }
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
  // Radix Portal may mount after the parent effect. A callback ref ensures
  // listeners attach only once the actual zoom viewport exists.
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const photo = photos[index];

  useEffect(() => {
    const viewport = viewportNode;
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
      viewport.dataset["zoom"] = String(transform.scale);
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
      } else if (event.touches.length === 1) {
        const touch = event.touches.item(0)!;
        gesture = { kind: "swipe", atX: touch.clientX, atY: touch.clientY };
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
      else {
        const finger = event.changedTouches?.item(0) ?? null;
        if (gesture.kind === "swipe" && transform.scale === 1 && finger) {
          const dx = finger.clientX - gesture.atX;
          const dy = finger.clientY - gesture.atY;
          if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            onSelect((index + (dx < 0 ? 1 : photos.length - 1)) % photos.length);
          }
        }
        gesture = { kind: "none" };
      }
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
    viewport.dataset["pinchReady"] = "true";

    return () => {
      delete viewport.dataset["pinchReady"];
      viewport.removeEventListener("touchstart", touchStart);
      viewport.removeEventListener("touchmove", touchMove);
      viewport.removeEventListener("touchend", touchEnd);
      viewport.removeEventListener("touchcancel", touchEnd);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("gesturestart", preventNativeGesture);
      viewport.removeEventListener("gesturechange", preventNativeGesture);
      viewport.removeEventListener("gestureend", preventNativeGesture);
    };
  }, [viewportNode, index, photo?.src]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        onSelect((index + (event.key === "ArrowLeft" ? photos.length - 1 : 1)) % photos.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onSelect, photos.length]);

  if (!photo) return null;
  const navigate = (step: number) => onSelect((index + step + photos.length) % photos.length);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        data-stand-lightbox
        className="z-[120] flex max-h-[96dvh] w-max max-w-[calc(100vw-16px)] flex-col items-center gap-2 overflow-hidden rounded-2xl border-0 bg-forest p-2.5 pb-3 text-cream shadow-xl sm:p-3 sm:pb-4 [&>button]:right-2.5 [&>button]:top-2.5 [&>button]:z-20 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button]:rounded-none [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-orange-400 [&>button]:opacity-100 [&>button]:shadow-none [&>button]:hover:bg-transparent [&>button]:hover:opacity-100 [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-orange-500 [&>button>svg]:size-6"
      >
        <DialogTitle className="sr-only">Fotografia stojana {photo.caption ?? ""}</DialogTitle>
        <DialogDescription className="sr-only">Detail ručne vyrábaného stojana. Fotografie môžete listovať šípkami alebo potiahnutím.</DialogDescription>
        <div
          ref={setViewportNode}
          data-stand-photo-viewport
          data-pinch-enabled="true"
          data-zoom="1"
          className="relative inline-flex h-auto w-fit max-h-[calc(100dvh-104px)] max-w-full overflow-hidden overscroll-contain rounded-xl bg-black/25 touch-none"
        >
          <img
            ref={imageRef}
            key={photo.src}
            src={photo.fullSrc ?? photo.src}
            alt={photo.alt}
            draggable={false}
            className="block h-auto w-auto max-h-[min(76dvh,760px)] max-w-[calc(100vw-36px)] select-none object-contain sm:max-w-[min(1100px,calc(100vw-48px))]"
            style={{ transformOrigin: "center center", willChange: "transform" }}
          />
          <button type="button" onClick={() => navigate(-1)} aria-label="Predchádzajúca fotografia"
            data-stand-photo-previous
            className="absolute left-0 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-none bg-transparent text-orange-400 shadow-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,.8))] hover:text-pink-500 focus-visible:outline-2 focus-visible:outline-orange-500 sm:left-1">
            <ChevronLeft aria-hidden="true" className="size-8 stroke-[3]" />
          </button>
          <button type="button" onClick={() => navigate(1)} aria-label="Ďalšia fotografia"
            data-stand-photo-next
            className="absolute right-0 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-none bg-transparent text-orange-400 shadow-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,.8))] hover:text-pink-500 focus-visible:outline-2 focus-visible:outline-orange-500 sm:right-1">
            <ChevronRight aria-hidden="true" className="size-8 stroke-[3]" />
          </button>
        </div>
        <p data-stand-photo-caption className="text-center text-xs tabular-nums text-cream/80">{index + 1} / {photos.length}{photo.caption ? ` · ${photo.caption}` : ""}</p>
      </DialogContent>
    </Dialog>
  );
}
