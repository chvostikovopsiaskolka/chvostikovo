interface InfoTickerProps {
  className?: string;
  compact?: boolean;
}

const ITEMS = [
  { icon: "★★★★★", text: "5.0 na Google z 41 hodnotení", accent: true },
  { text: "Viac ako 150 spokojných psíkov" },
  { icon: "🚕", text: "Vyzdvihnutie / dovoz psíka" },
  { icon: "📍", text: "Poľská 6" },
  { icon: "✅", text: "Úvodná návšteva zadarmo" },
  { text: "Aktívny deň" },
  { text: "Celodenný dohľad" },
  { text: "Vlastný výbeh" },
];

function TickerItems({ hidden = false, compact = false }: { hidden?: boolean; compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <div key={item.text} className="flex shrink-0 items-center">
          <span className="mx-4 text-coral/60" aria-hidden="true">
            •
          </span>
          <span
            className={`flex items-center gap-2 whitespace-nowrap font-display font-bold ${compact ? "text-[10px]" : "text-xs sm:text-sm"} ${item.accent ? "text-coral-dark" : "text-forest"}`}
          >
            {item.icon ? (
              <span
                className={item.accent ? "text-[0.65rem] tracking-normal sm:text-xs" : "text-sm sm:text-base"}
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

export function InfoTicker({ className = "", compact = false }: InfoTickerProps) {
  return (
    <section className={`bg-card ${className}`} aria-label="Výhody psej škôlky Chvostíkovo">
      <div className={`group overflow-hidden border-y border-border bg-card ${compact ? "py-2" : "py-3 sm:py-4"}`}>
        <div className="info-ticker-track w-max group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]">
          <TickerItems compact={compact} />
          <TickerItems hidden compact={compact} />
        </div>
      </div>
    </section>
  );
}
