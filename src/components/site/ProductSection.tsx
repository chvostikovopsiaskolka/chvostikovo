import { ArrowRight, Paintbrush, Ruler, Sparkles } from "lucide-react";
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
            Okrem starostlivosti o psíkov tvoríme aj vlastné praktické produkty. Každý kus vyrábame ručne a pri výrobe myslíme na konkrétneho psíka aj jeho potreby.
          </p>
        </div>

        <article className="mx-auto mt-9 grid max-w-5xl overflow-hidden rounded-4xl bg-card shadow-soft lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <a href="/stojan-na-misky-pre-psa" className="group block overflow-hidden">
            <img
              src={standAloy}
              alt="Ručne vyrábaný drevený stojan na misky pre psa Aloy"
              loading="lazy"
              className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-88 lg:h-full lg:min-h-96"
            />
          </a>
          <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
            <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Ručná výroba Chvostíkovo</p>
            <h3 className="mt-2 text-2xl text-forest sm:text-3xl">Drevený stojan na misky pre psa</h3>
            <p className="mt-4 leading-relaxed text-forest/80">
              Stabilný stojan s dvoma nerezovými miskami, výškou prispôsobenou psíkovi a možnosťou vlastného farebného prevedenia aj mena.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [Ruler, "Výška na mieru"],
                [Sparkles, "2 misky v cene"],
                [Paintbrush, "Farba a meno podľa dohody"],
              ].map(([Icon, text]) => {
                const ItemIcon = Icon as typeof Ruler;
                return (
                  <span key={String(text)} className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-forest">
                    <ItemIcon className="size-4 text-coral" /> {String(text)}
                  </span>
                );
              })}
            </div>
            <p className="mt-6 font-display text-xl font-bold text-forest">od 35 €</p>
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
