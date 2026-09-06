const ITEMS = [
  { icon: "★★★★★", text: "5.0 na Google z 41 hodnotení", accent: true },
  { text: "Viac ako 150 spokojných psíkov" },
  { icon: "🚕", text: "Vyzdvihnutie / dovoz psíka" },
  { icon: "📍", text: "Poľská 6" },
  { text: "Aktívny deň" },
  { text: "Celodenný dohľad" },
  { text: "Vlastný výbeh" },
];

function TickerItems({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <div key={item.text} className="flex shrink-0 items-center">
          <span className="mx-4 text-coral/60" aria-hidden="true">
            •
          </span>
          <span
            className={`flex items-center gap-2 whitespace-nowrap font-display text-xs font-bold sm:text-sm ${item.accent ? "text-coral-dark" : "text-forest"}`}
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

export function InfoTicker() {
  return (
    <section className="bg-card" aria-label="Výhody psej škôlky Chvostíkovo">
      <div className="group overflow-hidden border-y border-border bg-card py-3 shadow-card sm:py-4">
        <div className="info-ticker-track w-max group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]">
          <TickerItems />
          <TickerItems hidden />
        </div>
      </div>
    </section>
  );
}