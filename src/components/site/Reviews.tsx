import { useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/content/site";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeartHandshake, PawPrint, Sparkles } from "lucide-react";
import skolkariVideo from "@/assets/skolkari.mp4";
import schoolmatesLineup from "@/assets/skolkari-lineup.webp";
import { trackMarketingInteraction } from "@/lib/analytics";

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
    <figure className="flex w-[82%] shrink-0 flex-col items-center justify-start rounded-3xl bg-card px-4 py-3.5 text-center shadow-card sm:w-[46%] sm:px-5 sm:py-4 lg:w-[31%]">
      <div className="text-center">
        <figcaption className="font-display text-sm font-bold text-forest">{name}</figcaption>
        <span className="text-sm tracking-tight text-[#F5B301]">★★★★★</span>
      </div>
      <blockquote
        ref={body}
        className={`mt-2 min-h-[3.75rem] text-[0.88rem] leading-[1.4] text-forest/85 sm:min-h-[4rem] sm:text-[0.93rem] ${open ? "" : "line-clamp-3"}`}
      >
        „{text}“
      </blockquote>
      <div className="min-h-[1.75rem] sm:min-h-[2rem]">
        {(clamped || open) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1 font-display text-sm font-semibold text-coral underline underline-offset-4"
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
  const resumeTimer = useRef<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const speed = isMobile ? 50 : 36; // px / s
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
          const half = el.scrollWidth / 2;
          const next = el.scrollLeft + delta;
          el.scrollLeft = half > 0 && next >= half ? next - half : next;
        }
      } else {
        carry = 0;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, [isMobile]);

  const pause = () => {
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    paused.current = true;
  };

  const resume = () => {
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    paused.current = false;
  };

  const pauseForReading = () => {
    pause();
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
      resumeTimer.current = null;
    }, 8000);
  };

  return (
    <div
      ref={track}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={pauseForReading}
      onTouchCancel={pauseForReading}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className="relative left-1/2 mt-3 flex w-screen max-w-none -translate-x-1/2 items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [touch-action:pan-x] [will-change:scroll-position] sm:gap-5 [&::-webkit-scrollbar]:hidden"
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
    text: "Tešia sa na kamošov, pohyb aj akčný deň v škôlke. Často už cestou do škôlky presne vedia, kam idú a do Chvostíkova sa radi vracajú.",
    icon: PawPrint,
  },
  {
    title: "V dobrých rukách",
    text: "Majitelia oceňujú láskavý prístup, dôveru a pokoj, že je o ich psíka počas celého dňa dobre postarané. Ku každému pristupujeme osobne a podľa jeho potrieb.",
    icon: HeartHandshake,
  },
  {
    title: "Spokojní a príjemne unavení",
    text: "Pohyb, aktivity, kamaráti, oddych aj mojkanie – psíkovia od nás odchádzajú spokojní, vybehaní a príjemne unavení, pripravení doma oddychovať so svojimi rodičmi.",
    icon: Sparkles,
  },
];

export function ReviewReasons({
  ctaLabel = "Pozrite si, ako to u nás vyzerá",
  onCtaClick,
}: {
  ctaLabel?: string;
  onCtaClick?: () => void;
} = {}) {
  return (
    <section id="preco-chvostikovo" className="relative scroll-mt-24 overflow-hidden bg-forest pt-10 pb-0 text-cream sm:pt-12 sm:pb-0">
      <PawPrint aria-hidden="true" className="pointer-events-none absolute top-8 left-[6%] size-9 -rotate-12 text-cream/10 sm:size-12" />
      <PawPrint aria-hidden="true" className="pointer-events-none absolute top-[34%] right-[8%] size-7 rotate-[20deg] text-cream/10 sm:size-10" />
      <PawPrint aria-hidden="true" className="pointer-events-none absolute bottom-24 left-[14%] size-8 rotate-12 text-cream/10 sm:size-11" />
      <PawPrint aria-hidden="true" className="pointer-events-none absolute right-[18%] bottom-8 size-6 -rotate-[18deg] text-cream/10 sm:size-9" />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl text-cream sm:text-4xl">Prečo si vybrať Chvostíkovo?</h2>
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

        <div className="relative z-20 mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (onCtaClick) {
                onCtaClick();
                return;
              }
              trackMarketingInteraction("explore_daycare", "why_chvostikovo");
              document.getElementById("priestory")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="btn-coral inline-flex w-auto max-w-[340px] items-center justify-center whitespace-nowrap px-6 py-3.5 text-center text-[15px] leading-none sm:min-w-[360px] sm:max-w-none sm:px-10 sm:py-4 sm:text-lg"
          >
            {ctaLabel}
          </button>
        </div>

        <div className="mx-auto -mt-1 h-[138px] w-full max-w-[820px] overflow-hidden sm:mt-2 sm:h-[225px]" aria-hidden="true">
          <img
            src={schoolmatesLineup}
            alt=""
            loading="lazy"
            decoding="async"
            width={1200}
            height={630}
            className="block h-full w-full scale-[1.08] object-cover object-bottom sm:scale-[1.04]"
          />
        </div>
      </div>

    </section>
  );
}

export function Reviews() {
  return (
    <section id="recenzie" className="scroll-mt-24 bg-secondary/50 pt-3 pb-9 sm:pt-8 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="section-title text-[27px] leading-tight sm:text-4xl">100+ spokojných psíkov</h2>
        <p className="mt-0.5 text-sm text-forest/80 sm:text-base">⭐ 5.0 z 5 na Google</p>

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
    <section className="scroll-mt-24 bg-card pt-6 pb-8 sm:pt-10 sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h3 className="section-title whitespace-nowrap text-[18px] sm:text-3xl">
          Ako sa naši škôlkári tešia do škôlky
        </h3>
        <div className="mt-4 flex justify-center sm:mt-6">
          <div className="relative w-full max-w-[250px] overflow-hidden rounded-3xl bg-card shadow-card sm:max-w-[300px] lg:max-w-[320px]">
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
