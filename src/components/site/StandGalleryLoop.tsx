import { useEffect, useRef } from "react";
import standMia from "@/assets/products/stand-mia.avif";
import standCori from "@/assets/products/stand-cori.avif";
import standWoody from "@/assets/products/stand-woody.avif";

const STANDS = [
  { src: standMia, alt: "Ručne vyrábaný drevený stojan MIA s menom psíka" },
  { src: standCori, alt: "Tmavý drevený stojan CORI s nerezovými miskami" },
  { src: standWoody, alt: "Biely drevený stojan WOODY s nerezovými miskami" },
];

/** Pokojná automatická slučka realizácií, rovnaký princíp ako galéria targetov. */
export function StandGalleryLoop() {
  const track = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const visible = useRef(false);
  const resumeTimer = useRef<number | null>(null);

  function clearResumeTimer() {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }
  function pause() {
    paused.current = true;
    clearResumeTimer();
  }
  function resume() {
    paused.current = false;
    clearResumeTimer();
  }
  function resumeAfterInteraction() {
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
      resumeTimer.current = null;
    }, 2600);
  }

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = Boolean(entry?.isIntersecting);
    }, { rootMargin: "160px" });
    observer.observe(el);

    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const speed = window.matchMedia("(max-width: 639px)").matches ? 20 : 25;
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (visible.current && !document.hidden && !prefersReducedMotion.matches && !paused.current) {
        carry += speed * dt;
        const pixels = Math.floor(carry);
        if (pixels > 0) {
          carry -= pixels;
          const width = firstSet.current?.scrollWidth ?? 0;
          const next = el.scrollLeft + pixels;
          el.scrollLeft = width > 0 && next >= width ? next - width : next;
        }
      } else {
        carry = 0;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      clearResumeTimer();
    };
  }, []);

  return (
    <div
      ref={track}
      data-stand-gallery="autoplay"
      role="region"
      aria-label="Automatická galéria vyhotovení drevených stojanov na misky"
      tabIndex={0}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onPointerDown={pause}
      onPointerUp={resumeAfterInteraction}
      onPointerCancel={resumeAfterInteraction}
      onFocusCapture={pause}
      onBlurCapture={resumeAfterInteraction}
      className="flex w-full max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [touch-action:pan-x] [will-change:scroll-position] [&::-webkit-scrollbar]:hidden"
    >
      {[0, 1].map(set => (
        <div
          key={set}
          ref={set === 0 ? firstSet : undefined}
          aria-hidden={set === 1}
          className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
        >
          {STANDS.map(image => (
            <figure key={`${set}-${image.alt}`}
              className="h-60 w-[74vw] max-w-[350px] shrink-0 overflow-hidden rounded-3xl bg-secondary shadow-card sm:h-72 sm:w-[38vw] sm:max-w-[360px]"
            >
              <img src={image.src} alt={set === 0 ? image.alt : ""}
                loading="lazy" decoding="async" draggable={false}
                className="size-full select-none object-contain" />
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
