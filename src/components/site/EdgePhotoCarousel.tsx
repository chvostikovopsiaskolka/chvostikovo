import { useEffect, useRef, type CSSProperties } from "react";

export type EdgeCarouselPhoto = {
  src: string;
  alt: string;
  position?: string;
};

type EdgePhotoCarouselProps = {
  photos: readonly EdgeCarouselPhoto[];
  label: string;
  dataName: "stand" | "target";
  className?: string;
};

/**
 * A real edge-to-edge mobile photo track with one instance of each photo.
 * Autoscroll reverses at the ends instead of duplicating slide sets.
 * The user can swipe, hover or focus without losing control.
 */
export function EdgePhotoCarousel({
  photos,
  label,
  dataName,
  className = "",
}: EdgePhotoCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const direction = useRef<1 | -1>(1);
  const paused = useRef(false);
  const inView = useRef(false);
  const resumeTimer = useRef<number | null>(null);

  const clearResumeTimer = () => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };

  const pause = () => {
    clearResumeTimer();
    paused.current = true;
  };

  const resume = () => {
    clearResumeTimer();
    paused.current = false;
  };

  const resumeAfterInteraction = () => {
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
      resumeTimer.current = null;
    }, 3000);
  };

  useEffect(() => {
    const el = track.current;
    if (!el || photos.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = Boolean(entry?.isIntersecting);
    }, { rootMargin: "100px" });
    observer.observe(el);

    let frame = 0;
    let last = performance.now();
    let pixelsPending = 0;
    const speed = window.matchMedia("(max-width: 639px)").matches ? 22 : 28;

    const tick = (now: number) => {
      const seconds = Math.min((now - last) / 1000, 0.1);
      last = now;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

      if (inView.current && !document.hidden && !reducedMotion.matches && !paused.current && maxScroll > 0) {
        pixelsPending += speed * seconds;
        const pixels = Math.floor(pixelsPending);
        if (pixels) {
          pixelsPending -= pixels;
          const next = el.scrollLeft + direction.current * pixels;
          if (next >= maxScroll) {
            el.scrollLeft = maxScroll;
            direction.current = -1;
          } else if (next <= 0) {
            el.scrollLeft = 0;
            direction.current = 1;
          } else {
            el.scrollLeft = next;
          }
        }
      } else {
        pixelsPending = 0;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      clearResumeTimer();
    };
  }, [photos]);

  return (
    <div className={`relative left-1/2 w-screen -translate-x-1/2 sm:left-auto sm:w-full sm:translate-x-0 ${className}`}>
      <div
        ref={track}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-photo-carousel={dataName}
        data-stand-gallery={dataName === "stand" ? "autoplay" : undefined}
        data-carousel-motion="ping-pong"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onPointerDown={pause}
        onPointerUp={resumeAfterInteraction}
        onPointerCancel={resumeAfterInteraction}
        onFocusCapture={pause}
        onBlurCapture={resumeAfterInteraction}
        className="flex w-full gap-3 overflow-x-auto overscroll-x-contain touch-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {photos.map((photo) => (
          <figure
            key={photo.src}
            className="relative h-[310px] w-[85vw] shrink-0 overflow-hidden rounded-3xl shadow-card sm:h-96 sm:w-[44vw] sm:max-w-[420px] lg:w-[31vw] lg:max-w-[360px]"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{ objectPosition: photo.position ?? "50% 54%" } as CSSProperties}
            />
            {dataName === "stand" && (
              <figcaption className="pointer-events-none absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-forest shadow-sm backdrop-blur-sm">
                {photos.indexOf(photo) === 0 ? "MIA" : photos.indexOf(photo) === 1 ? "CORI" : "WOODY"} · Ručná výroba
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
