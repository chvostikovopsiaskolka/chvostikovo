import { PRICING } from "@/content/site";

/** Small mobile-only price reference on conversion landings. Canonical prices
 * stay in content/site.ts and desktop SEO layouts are left untouched. */
export function LandingMobilePricing({ id, onInterest }: {
  id: string;
  onInterest: () => void;
}) {
  return (
    <section id={id} className="scroll-mt-4 bg-secondary/35 px-4 py-9 lg:hidden">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="font-display text-2xl font-bold text-forest">Cenník škôlky</h2>
        <p className="mt-2 text-sm text-forest/75">Starostlivosť, pohyb, hry aj oddych sú zahrnuté v každom vstupe.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {PRICING.map((item) => (
            <article key={item.name} className="rounded-2xl bg-card px-3 py-5 shadow-card">
              <h3 className="font-display text-sm font-bold text-forest">{item.name}</h3>
              <p className="mt-2 font-display text-2xl font-bold text-coral-dark">{item.price}</p>
              {item.note && <p className="mt-1 text-xs text-forest/75">{item.note}</p>}
            </article>
          ))}
        </div>
        <button type="button" className="btn-coral mt-5" onClick={onInterest}>
          Chcem sa informovať
        </button>
      </div>
    </section>
  );
}
