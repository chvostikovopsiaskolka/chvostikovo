import { ArrowRight, Paintbrush, Ruler, Sparkles, Type } from "lucide-react";
import standAloy from "@/assets/products/stand-aloy-dog.webp";

export function ProductSection() {
  return (
    <section id="produkty" className="scroll-mt-24 bg-secondary/45 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Naše produkty
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Ručná výroba pre štvornohých parťákov</h2>
          <p className="mt-4 leading-relaxed text-forest/80">
            Okrem starostlivosti o psíkov tvoríme aj vlastné praktické produkty. Každý kus vyrábame ručne a prispôsobujeme ho konkrétnemu psíkovi, aby bol výsledok funkčný aj osobný.
          </p>
        </div>

        <article className="mx-auto mt-9 grid max-w-4xl overflow-hidden rounded-4xl bg-card shadow-soft lg:grid-cols-[1fr_0.95fr] lg:items-stretch">
          <a href="/stojan-na-misky-pre-psa" className="group block overflow-hidden">
            <img
              src={standAloy}
              alt="Ručne vyrábaný drevený stojan na misky pre psa"
              loading="lazy"
              className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-80 lg:h-full lg:min-h-80"
            />
          </a>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <h3 className="text-2xl text-forest sm:text-3xl">Drevený stojan na misky pre psa</h3>
            <p className="mt-3 leading-relaxed text-forest/80">
              Stabilný stojan s dvoma nerezovými miskami, výškou prispôsobenou psíkovi a prevedením podľa vášho želania. Každý kus môže byť originál.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                [Sparkles, "2 nerezové misky v cene"],
                [Ruler, "Výška na mieru podľa psíka"],
                [Paintbrush, "Farba podľa želania"],
                [Type, "Personalizácia menom"],
              ].map(([Icon, text]) => {
                const ItemIcon = Icon as typeof Ruler;
                return (
                  <span key={String(text)} className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5 text-xs font-semibold text-forest">
                    <ItemIcon className="size-4 shrink-0 text-coral" /> {String(text)}
                  </span>
                );
              })}
            </div>
            <p className="mt-5 font-display text-2xl font-bold text-forest">40 €</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/stojan-na-misky-pre-psa" className="btn-coral inline-flex items-center gap-2">
                Pozrieť stojan <ArrowRight className="size-4" />
              </a>
              <a
                href="/produkty"
                className="inline-flex items-center justify-center rounded-full border-2 border-forest/15 px-5 py-3 font-display text-sm font-semibold text-forest transition-colors hover:border-coral hover:text-coral"
              >
                Všetky produkty
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
