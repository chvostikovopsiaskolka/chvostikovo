import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import photo01 from "@/assets/daycare-carousel-01.avif";
import photo02 from "@/assets/daycare-carousel-02.avif";
import photo03 from "@/assets/daycare-carousel-03.avif";
import photo04 from "@/assets/daycare-carousel-04.avif";
import photo05 from "@/assets/daycare-carousel-05.avif";
import photo06 from "@/assets/daycare-carousel-06.avif";
import photo07 from "@/assets/daycare-carousel-07.avif";
import photo08 from "@/assets/daycare-carousel-08.avif";
import photo09 from "@/assets/daycare-carousel-09.avif";
import photo10 from "@/assets/daycare-carousel-10.avif";
import photo11 from "@/assets/daycare-carousel-11.avif";
import photo12 from "@/assets/daycare-carousel-12.avif";

const PHOTOS = [
  photo01,
  photo02,
  photo03,
  photo04,
  photo05,
  photo06,
  photo07,
  photo08,
  photo09,
  photo10,
  photo11,
  photo12,
];

const RESUME_DELAY = 2800;

export function DaycarePhotoCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const dragged = useRef(false);
  const [active, setActive] = useState<number | null>(null);

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

  const resumeAfterPause = () => {
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
      resumeTimer.current = null;
    }, RESUME_DELAY);
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    const speed = window.matchMedia("(max-width: 639px)").matches ? 22 : 28;
    let raf = 0;
    let last = performance.now();
    let carry = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!paused.current) {
        carry += speed * dt;
        const delta = Math.floor(carry);

        if (delta > 0) {
          carry -= delta;
          const loopWidth = firstSet.current?.scrollWidth ?? 0;
          const next = el.scrollLeft + delta;
          el.scrollLeft = loopWidth > 0 && next >= loopWidth ? next - loopWidth : next;
        }
      } else {
        carry = 0;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      clearResumeTimer();
    };
  }, []);

  useEffect(() => {
    if (active === null) return;

    pause();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(null);
        resumeAfterPause();
      } else if (event.key === "ArrowLeft") {
        setActive((current) =>
          current === null ? null : (current - 1 + PHOTOS.length) % PHOTOS.length,
        );
      } else if (event.key === "ArrowRight") {
        setActive((current) => (current === null ? null : (current + 1) % PHOTOS.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  const openPhoto = (index: number) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    pause();
    setActive(index);
  };

  const closePhoto = () => {
    setActive(null);
    resumeAfterPause();
  };

  return (
    <section className="bg-card pb-8 sm:pb-12" aria-label="Fotogaléria zo psiej škôlky Chvostíkovo">
      <div className="mx-auto max-w-6xl px-4">
        <div
          ref={track}
          onMouseEnter={pause}
          onMouseLeave={() => {
            if (active === null) resume();
          }}
          onPointerDown={(event) => {
            pause();
            pointerStartX.current = event.clientX;
            dragged.current = false;
          }}
          onPointerMove={(event) => {
            if (pointerStartX.current === null) return;
            if (Math.abs(event.clientX - pointerStartX.current) > 8) dragged.current = true;
          }}
          onPointerUp={() => {
            pointerStartX.current = null;
            if (active === null) resumeAfterPause();
          }}
          onPointerCancel={() => {
            pointerStartX.current = null;
            if (active === null) resumeAfterPause();
          }}
          onFocusCapture={pause}
          onBlurCapture={() => {
            if (active === null) resumeAfterPause();
          }}
          className="flex w-full max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [touch-action:pan-x] [will-change:scroll-position] [&::-webkit-scrollbar]:hidden"
        >
          {[0, 1].map((setIndex) => (
            <div
              key={setIndex}
              ref={setIndex === 0 ? firstSet : undefined}
              className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
              aria-hidden={setIndex === 1}
            >
              {PHOTOS.map((src, index) => (
                <button
                  key={`${setIndex}-${src}`}
                  type="button"
                  tabIndex={setIndex === 1 ? -1 : 0}
                  onClick={() => openPhoto(index)}
                  className="group h-[320px] w-[78vw] max-w-[390px] shrink-0 overflow-hidden rounded-4xl bg-secondary/30 shadow-card sm:h-[360px] sm:w-[46vw] sm:max-w-[430px] lg:h-[390px] lg:w-[31vw] lg:max-w-[350px]"
                  aria-label={`Otvoriť fotografiu ${index + 1}`}
                >
                  <img
                    src={src}
                    alt={setIndex === 0 ? `Psí škôlkari v Chvostíkove – fotografia ${index + 1}` : ""}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="size-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-forest-deep/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Fotografia ${active + 1} z ${PHOTOS.length}`}
          onClick={closePhoto}
        >
          <button
            type="button"
            aria-label="Zavrieť galériu"
            className="absolute top-4 right-4 z-10 flex size-12 items-center justify-center rounded-full bg-cream/95 text-forest shadow-soft sm:top-6 sm:right-6"
            onClick={(event) => {
              event.stopPropagation();
              closePhoto();
            }}
          >
            <X className="size-6" />
          </button>

          <button
            type="button"
            aria-label="Predchádzajúca fotografia"
            className="absolute left-2 z-10 flex size-12 items-center justify-center rounded-full bg-cream/95 text-forest shadow-soft sm:left-6"
            onClick={(event) => {
              event.stopPropagation();
              setActive((active - 1 + PHOTOS.length) % PHOTOS.length);
            }}
          >
            <ChevronLeft className="size-7" />
          </button>

          <img
            src={PHOTOS[active]}
            alt={`Psí škôlkari v Chvostíkove – fotografia ${active + 1}`}
            decoding="async"
            className="max-h-[88vh] max-w-[92vw] rounded-3xl object-contain shadow-soft sm:max-w-[86vw]"
            onClick={(event) => event.stopPropagation()}
          />

          <button
            type="button"
            aria-label="Nasledujúca fotografia"
            className="absolute right-2 z-10 flex size-12 items-center justify-center rounded-full bg-cream/95 text-forest shadow-soft sm:right-6"
            onClick={(event) => {
              event.stopPropagation();
              setActive((active + 1) % PHOTOS.length);
            }}
          >
            <ChevronRight className="size-7" />
          </button>
        </div>
      )}
    </section>
  );
}
