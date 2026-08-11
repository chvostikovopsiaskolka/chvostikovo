import { useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/content/site";
import { useIsMobile } from "@/hooks/use-mobile";
import skolkariVideo from "@/assets/skolkari.mp4.asset.json";

const LIMIT = 180;

function ReviewCard({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LIMIT;
  return (
    <figure className="flex h-full w-[85%] shrink-0 flex-col items-center rounded-3xl bg-card p-6 text-center shadow-card sm:w-[46%] lg:w-[31%]">
      <div className="flex items-center justify-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-forest">
          {name.charAt(0)}
        </span>
        <div className="text-left">
          <figcaption className="font-display text-sm font-bold text-forest">{name}</figcaption>
          <span className="text-sm tracking-tight text-[#F5B301]">★★★★★</span>
        </div>
      </div>
      <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-forest/85">
        „{long && !open ? `${text.slice(0, LIMIT).trimEnd()}…` : text}“
      </blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 font-display text-sm font-semibold text-coral underline underline-offset-4"
        >
          {open ? "Zobraziť menej" : "Prečítaj si viac"}
        </button>
      )}
    </figure>
  );
}

function ReviewCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const speed = isMobile ? 18 : 35; // px / s
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft = el.scrollLeft >= half ? el.scrollLeft - half : el.scrollLeft + speed * dt;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  return (
    <div
      ref={track}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className="mt-10 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[...REVIEWS, ...REVIEWS].map((r, i) => (
        <ReviewCard key={`${r.name}-${i}`} name={r.name} text={r.text} />
      ))}
    </div>
  );
}

export function Reviews() {
  return (
    <section id="recenzie" className="scroll-mt-24 bg-secondary/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
          Recenzie klientov
        </span>
        <h2 className="section-title mt-2 text-3xl sm:text-4xl">100+ spokojných psíkov</h2>
        <p className="mt-3 text-forest/80">⭐ 5.0 z 5 na Google</p>

        <ReviewCarousel />


        <div className="mt-14 sm:mt-16">
          <h3 className="section-title text-2xl sm:text-3xl">
            Ako sa naši škôlkári tešia do škôlky
          </h3>
          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-[320px] overflow-hidden rounded-3xl bg-card shadow-card">
              <video
                src={skolkariVideo.url}
                className="aspect-[9/16] w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="Video zo psiej škôlky Chvostíkovo – škôlkári sa tešia do škôlky"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
