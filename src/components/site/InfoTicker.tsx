import { useEffect, useRef } from "react";

interface InfoTickerProps {
  className?: string;
  compact?: boolean;
  language?: "sk" | "en";
}

const ITEMS = {
  sk: [
    { icon: "★★★★★", text: "5.0 na Google zo 41 hodnotení", accent: true },
    { text: "Viac ako 150 spokojných psíkov" },
    { icon: "🚕", text: "Vyzdvihnutie / dovoz psíka" },
    { icon: "📍", text: "Poľská 6" },
    { icon: "✅", text: "Úvodná návšteva zadarmo" },
    { text: "Aktívny deň" },
    { text: "Celodenný dohľad" },
    { text: "Vlastný výbeh" },
  ],
  en: [
    { icon: "★★★★★", text: "5.0 on Google from 41 reviews", accent: true },
    { text: "More than 150 happy dogs" },
    { icon: "🚕", text: "Dog pick-up / drop-off" },
    { icon: "📍", text: "Poľská 6" },
    { icon: "✅", text: "Free introductory visit" },
    { text: "Active day" },
    { text: "All-day supervision" },
    { text: "Private outdoor run" },
  ],
} as const;

function TickerItems({
  items,
  hidden = false,
  compact = false,
}: {
  items: readonly { icon?: string; text: string; accent?: boolean }[];
  hidden?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <div key={item.text} className="flex shrink-0 items-center">
          <span className="mx-4 text-coral/60" aria-hidden="true">
            •
          </span>
          <span
            className={`flex items-center gap-2 whitespace-nowrap font-display font-bold leading-none ${compact ? "text-[10px]" : "text-xs sm:text-sm"} ${item.accent ? "text-coral-dark" : "text-forest"}`}
          >
            {item.icon ? (
              <span
                className={`leading-none ${item.accent ? "text-[0.65rem] tracking-normal sm:text-xs" : "text-sm sm:text-base"}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            ) : null}
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function InfoTicker({ className = "", compact = false, language = "sk" }: InfoTickerProps) {
  const items = ITEMS[language];
  const ariaLabel = language === "en" ? "Chvostíkovo dog daycare highlights" : "Výhody psej škôlky Chvostíkovo";
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof window === "undefined") return;

    const updateSpeed = () => {
      const loopDistance = track.scrollWidth / 2;
      if (!loopDistance) return;

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pixelsPerSecond = prefersReducedMotion ? 22 : isMobile ? 88 : 30;
      const minimumDuration = prefersReducedMotion ? 24 : isMobile ? 11 : 28;
      const duration = Math.max(loopDistance / pixelsPerSecond, minimumDuration);

      track.style.setProperty("--ticker-duration", `${duration.toFixed(2)}s`);
    };

    updateSpeed();
    window.addEventListener("resize", updateSpeed);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSpeed) : null;
    resizeObserver?.observe(track);

    return () => {
      window.removeEventListener("resize", updateSpeed);
      resizeObserver?.disconnect();
    };
  }, [compact, language]);

  return (
    <section className={`w-full overflow-hidden bg-card ${className}`} aria-label={ariaLabel}>
      <div className={`group flex items-center overflow-hidden border-y border-border bg-card ${compact ? "h-9" : "h-11 sm:h-12"}`}>
        <div
          ref={trackRef}
          className="info-ticker-track flex w-max items-center lg:group-hover:[animation-play-state:paused]"
        >
          <TickerItems items={items} compact={compact} />
          <TickerItems items={items} hidden compact={compact} />
        </div>
      </div>
    </section>
  );
}
