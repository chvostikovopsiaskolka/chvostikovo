import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DAYCARE_GALLERY_EXTRAS } from "@/content/site";
import newPhoto01 from "@/assets/skolkari-novi-01.avif";
import newPhoto02 from "@/assets/skolkari-novi-02.avif";
import newPhoto03 from "@/assets/skolkari-novi-03.avif";
import newPhoto04 from "@/assets/skolkari-novi-04.avif";
import photo13 from "@/assets/daycare-carousel-13.avif";
import photo14 from "@/assets/daycare-carousel-14.avif";
import photo15 from "@/assets/daycare-carousel-15.avif";
import photo16 from "@/assets/daycare-carousel-16.avif";
import photo17 from "@/assets/daycare-carousel-17.avif";
import photo18 from "@/assets/daycare-carousel-18.avif";
import photo19 from "@/assets/daycare-carousel-19.avif";
import photo20 from "@/assets/daycare-carousel-20.avif";
import photo21 from "@/assets/daycare-carousel-21.avif";
import photo22 from "@/assets/daycare-carousel-22.avif";

const PHOTOS = [
  { src: newPhoto01, alt: "Usmiaty husky a chrtík v psiej škôlke Chvostíkovo" },
  { src: newPhoto02, alt: "Pudel a ďalší veselý psí kamarát v škôlke Chvostíkovo" },
  { src: newPhoto03, alt: "Dalmatín a ďalší psí kamaráti v škôlke Chvostíkovo" },
  { src: newPhoto04, alt: "Zlatý retriever a psí kamaráti v škôlke Chvostíkovo" },
  { src: photo13, alt: "Psí škôlkari v Chvostíkove – fotografia 1" },
  { src: photo14, alt: "Psí škôlkari v Chvostíkove – fotografia 2" },
  { src: photo15, alt: "Psí škôlkari v Chvostíkove – fotografia 3" },
  { src: photo16, alt: "Psí škôlkari v Chvostíkove – fotografia 4" },
  { src: photo17, alt: "Psí škôlkari v Chvostíkove – fotografia 5" },
  { src: photo18, alt: "Psí škôlkari v Chvostíkove – fotografia 6" },
  { src: photo19, alt: "Psí škôlkari v Chvostíkove – fotografia 7" },
  { src: photo20, alt: "Psí škôlkari v Chvostíkove – fotografia 8" },
  { src: photo21, alt: "Psí škôlkari v Chvostíkove – fotografia 9" },
  { src: photo22, alt: "Psí škôlkari v Chvostíkove – fotografia 10" },
  ...DAYCARE_GALLERY_EXTRAS,
];

const RESUME_DELAY = 2800;

export function DaycarePhotoCarousel({ language = "sk" }: { language?: "sk" | "en" }) {
  const isEnglish = language === "en";
  const track = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);
  const gesturePaused = useRef(false);
  const dragged = useRef(false);
  const [active, setActive] = useState<number | null>(null);

  const clearHoldTimer = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

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
    let last = 0;
    let carry = 0;
    let nearViewport = false;

    const step = (now: number) => {
      raf = 0;
      // Stop DOM scroll writes while off-screen or in background tabs.
      if (!nearViewport || document.hidden) return;
      const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 0.1);
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

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      carry = 0;
    };

    const start = () => {
      if (!raf && nearViewport && !document.hidden) {
        last = 0; // Do not fast-forward the gallery after returning to the tab.
        raf = requestAnimationFrame(step);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    // Keep the same visual motion when the gallery is visible.
    // A small root margin starts it before scrolling into view.
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            nearViewport = Boolean(entry?.isIntersecting);
            if (nearViewport) start();
            else stop();
          },
          { rootMargin: "160px 0px" },
        );

    if (observer) observer.observe(el);
    else {
      nearViewport = true;
      start();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
      clearResumeTimer();
      clearHoldTimer();
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
    <section className="overflow-x-clip bg-card pt-6 pb-8 sm:pt-8 sm:pb-12" aria-label={isEnglish ? "Photo gallery from Chvostíkovo dog daycare" : "Fotogaléria zo psiej škôlky Chvostíkovo"}>
      <div className="w-full">
        <div
          ref={track}
          data-gesture-track="photos"
          onMouseEnter={pause}
          onMouseLeave={() => {
            if (active === null) resume();
          }}
          onPointerDown={(event) => {
            clearHoldTimer();
            pointerStartX.current = event.clientX;
            pointerStartY.current = event.clientY;
            dragged.current = false;
            held.current = false;
            gesturePaused.current = false;
            if (event.pointerType === "touch" && event.isPrimary) {
              holdTimer.current = window.setTimeout(() => {
                holdTimer.current = null;
                held.current = true;
                gesturePaused.current = true;
                pause();
              }, 500);
            } else {
              pause();
            }
          }}
          onPointerMove={(event) => {
            if (pointerStartX.current === null || pointerStartY.current === null) return;
            const dx = Math.abs(event.clientX - pointerStartX.current);
            const dy = Math.abs(event.clientY - pointerStartY.current);
            if (Math.max(dx, dy) <= 8) return;
            clearHoldTimer();
            dragged.current = true;
            if (dx > dy) {
              gesturePaused.current = true;
              pause();
            } else if (event.pointerType === "touch" && !held.current && active === null) {
              resume();
            }
          }}
          onPointerUp={(event) => {
            clearHoldTimer();
            pointerStartX.current = null;
            pointerStartY.current = null;
            if (held.current) dragged.current = true; // long hold must not open lightbox
            const shouldPause = held.current || gesturePaused.current || event.pointerType !== "touch";
            held.current = false;
            gesturePaused.current = false;
            if (active === null) {
              if (shouldPause) resumeAfterPause();
              else resume();
            }
          }}
          onPointerCancel={() => {
            clearHoldTimer();
            pointerStartX.current = null;
            pointerStartY.current = null;
            dragged.current = true;
            held.current = false;
            gesturePaused.current = false;
            if (active === null) resume();
          }}
          onFocusCapture={pause}
          onBlurCapture={() => {
            if (active === null) resumeAfterPause();
          }}
          className="flex w-screen max-w-none overflow-x-auto overscroll-x-contain [scrollbar-width:none] [touch-action:auto] [will-change:scroll-position] [&::-webkit-scrollbar]:hidden"
        >
          {[0, 1].map((setIndex) => (
            <div
              key={setIndex}
              ref={setIndex === 0 ? firstSet : undefined}
              className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
              aria-hidden={setIndex === 1}
            >
              {PHOTOS.map((photo, index) => (
                <button
                  key={`${setIndex}-${photo.src}`}
                  type="button"
                  tabIndex={setIndex === 1 ? -1 : 0}
                  onClick={() => openPhoto(index)}
                  className="group h-[320px] w-[78vw] max-w-[390px] shrink-0 overflow-hidden rounded-4xl bg-secondary/30 shadow-card sm:h-[360px] sm:w-[46vw] sm:max-w-[430px] lg:h-[390px] lg:w-[31vw] lg:max-w-[350px]"
                  aria-label={isEnglish ? `Open photo ${index + 1}` : `Otvoriť fotografiu ${index + 1}`}
                >
                  <img
                    src={photo.src}
                    alt={setIndex === 0 ? (isEnglish ? `Dogs at Chvostíkovo daycare – photo ${index + 1}` : photo.alt) : ""}
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
          aria-label={isEnglish ? `Photo ${active + 1} of ${PHOTOS.length}` : `Fotografia ${active + 1} z ${PHOTOS.length}`}
          onClick={closePhoto}
        >
          <button
            type="button"
            aria-label={isEnglish ? "Close gallery" : "Zavrieť galériu"}
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
            aria-label={isEnglish ? "Previous photo" : "Predchádzajúca fotografia"}
            className="absolute left-2 z-10 flex size-12 items-center justify-center rounded-full bg-cream/95 text-forest shadow-soft sm:left-6"
            onClick={(event) => {
              event.stopPropagation();
              setActive((active - 1 + PHOTOS.length) % PHOTOS.length);
            }}
          >
            <ChevronLeft className="size-7" />
          </button>

          <img
            src={PHOTOS[active]!.src}
            alt={isEnglish ? `Dogs at Chvostíkovo daycare – photo ${active + 1}` : PHOTOS[active]!.alt}
            decoding="async"
            className="max-h-[88vh] max-w-[92vw] rounded-3xl object-contain shadow-soft sm:max-w-[86vw]"
            onClick={(event) => event.stopPropagation()}
          />

          <button
            type="button"
            aria-label={isEnglish ? "Next photo" : "Nasledujúca fotografia"}
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
