import { useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/content/site";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeartHandshake, PawPrint, Sparkles } from "lucide-react";
import skolkariVideo from "@/assets/skolkari.mp4";
import schoolmatesLineup from "@/assets/skolkari-lineup.webp";

function ReviewCard({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLQuoteElement>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    setClamped(el.scrollHeight - el.clientHeight > 2);
  }, [text]);

  return (
    <figure className="flex w-[82%] shrink-0 flex-col items-center justify-start rounded-3xl bg-card p-5 text-center shadow-card sm:w-[46%] sm:p-6 lg:w-[31%]">
      <div className="text-center">
        <figcaption className="font-display text-sm font-bold text-forest">{name}</figcaption>
        <span className="text-sm tracking-tight text-[#F5B301]">★★★★★</span>
      </div>
      <blockquote
        ref={body}
        className={`mt-3 min-h-[4.5rem] text-[0.9rem] leading-relaxed text-forest/85 sm:min-h-[4.75rem] sm:text-[0.95rem] ${open ? "" : "line-clamp-3"}`}
      >
        „{text}“
      </blockquote>
      <div className="min-h-[2.25rem] sm:min-h-[2.5rem]">
        {(clamped || open) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 font-display text-sm font-semibold text-coral underline underline-offset-4"
          >
            {open ? "Zobraziť menej" : "Prečítaj si viac"}
          </button>
        )}
      </div>
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
    const speed = 30; // px / s
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
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
      onTouchCancel={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className="mt-10 flex w-full max-w-full items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [touch-action:pan-x] sm:gap-5 [&::-webkit-scrollbar]:hidden"
    >
      {[...REVIEWS, ...REVIEWS].map((r, i) => (
        <ReviewCard key={`${r.name}-${i}`} name={r.name} text={r.text} />
      ))}
    </div>
  );
}

const REVIEW_REASONS = [
  {
    title: "Psíkovia sa k nám tešia",
    text: "Tešia sa na kamarátov a do škôlky sa radi vracajú. Často presne vedia, kam idú, ešte skôr než vojdú dnu.",
    icon: PawPrint,
  },
  {
    title: "V dobrých rukách",
    text: "Majitelia oceňujú láskavý prístup a pokoj, že je o ich psíka dobre postarané. Dôvera a osobná starostlivosť sa v recenziách opakujú veľmi často.",
    icon: HeartHandshake,
  },
  {
    title: "Spokojní a príjemne unavení",
    text: "Pohyb, aktivity, kamaráti, oddych aj mojkanie – domov sa psíkovia vracajú po dobre strávenom dni spokojní, vybehaní a pripravení na oddych a čas s majiteľom.",
    icon: Sparkles,
  },
];

export function ReviewReasons() {
  return (
    <section className="bg-forest pt-10 pb-0 text-cream sm:pt-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl text-cream sm:text-4xl">Prečo si vybrať Chvostíkovo?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">
            Najlepšie o nás hovoria samotní majitelia psíkov. Toto sa v ich recenziách opakuje najčastejšie.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3 md:gap-5">
          {REVIEW_REASONS.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="flex items-start gap-3 rounded-2xl bg-cream/10 px-4 py-4 ring-1 ring-cream/15 md:block md:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coral text-primary-foreground md:size-11">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 md:mt-3">
                <h3 className="font-display text-base font-bold text-cream md:text-lg">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cream/80">{text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="-mx-4 mt-5 overflow-hidden sm:mx-auto sm:mt-7 sm:h-[230px] sm:max-w-[820px] h-[150px]" aria-hidden="true">
          <img
            src={schoolmatesLineup}
            alt=""
            loading="lazy"
            decoding="async"
            width={1200}
            height={630}
            className="block h-full w-full object-cover object-bottom"
          />
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section id="recenzie" className="scroll-mt-24 bg-secondary/50 pt-4 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
          Recenzie klientov
        </span>
        <h2 className="section-title mt-2 text-3xl sm:text-4xl">100+ spokojných psíkov</h2>
        <p className="mt-3 text-forest/80">⭐ 5.0 z 5 na Google</p>

        <ReviewCarousel />
      </div>
    </section>
  );
}

export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="scroll-mt-24 bg-card pt-8 pb-12 sm:pt-10 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h3 className="section-title text-2xl sm:text-3xl">
          Ako sa naši škôlkári tešia do škôlky
        </h3>
        <div className="mt-6 flex justify-center">
          <div className="relative w-full max-w-[320px] overflow-hidden rounded-3xl bg-card shadow-card">
            <video
              ref={videoRef}
              src={skolkariVideo}
              className="aspect-[9/16] w-full object-cover"
              muted
              loop
              playsInline
              controls
              preload="none"
              aria-label="Video zo psiej škôlky Chvostíkovo – škôlkári sa tešia do škôlky"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
