import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Hammer, Paintbrush, Ruler, Sparkles } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import standAloy from "@/assets/products/stand-aloy-dog.webp";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/produkty`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Produkty pre psov | Ručná výroba | Chvostíkovo";
const description =
  "Ručne vyrábané produkty pre psov od Chvostíkova. Drevené stojany na misky na mieru s dvoma miskami a personalizáciou.";

export const Route = createFileRoute("/produkty")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Ručne vyrábané produkty pre psov Chvostíkovo" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/45 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl px-4 text-center">
            <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Vyrobené u nás</p>
            <h1 className="mx-auto mt-3 max-w-4xl text-4xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
              Naše <span className="text-coral-dark">produkty pre psov</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-forest/80">
              Praktické veci, ktoré vznikajú priamo v Chvostíkove. Vyrábame ich ručne, s dôrazom na funkčnosť, kvalitné spracovanie a možnosť prispôsobiť ich konkrétnemu psíkovi.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-forest shadow-card"><Hammer className="size-4 text-coral" /> Ručná výroba</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-forest shadow-card"><Ruler className="size-4 text-coral" /> Rozmery na mieru</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-forest shadow-card"><Paintbrush className="size-4 text-coral" /> Vlastné prevedenie</span>
            </div>
          </div>
        </section>

        <section className="bg-secondary/45 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Aktuálna ponuka</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Vyberte si produkt</h2>
            </div>

            <article className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-4xl bg-card shadow-soft lg:grid-cols-[1.08fr_0.92fr]">
              <a href="/stojan-na-misky-pre-psa" className="group block overflow-hidden">
                <img
                  src={standAloy}
                  alt="Drevený stojan na misky pre psa s personalizáciou"
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-96 lg:h-full"
                />
              </a>
              <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
                <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Stojany na misky</p>
                <h2 className="mt-2 text-2xl text-forest sm:text-3xl">Drevený stojan na misky pre psa</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Stabilný stojan na dve nerezové misky. Vyberiete si veľkosť a farebné prevedenie, výšku prispôsobíme psíkovi a stojan môžeme doplniť jeho menom.
                </p>
                <div className="mt-5 grid gap-2 text-sm text-forest/80 sm:grid-cols-2">
                  <span className="rounded-2xl bg-secondary px-4 py-3">✓ 2 nerezové misky v cene</span>
                  <span className="rounded-2xl bg-secondary px-4 py-3">✓ Výška podľa psíka</span>
                  <span className="rounded-2xl bg-secondary px-4 py-3">✓ Menšia aj väčšia verzia</span>
                  <span className="rounded-2xl bg-secondary px-4 py-3">✓ Meno a farba podľa dohody</span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-forest/60">Cena</p>
                    <p className="font-display text-2xl font-bold text-forest">od 35 €</p>
                  </div>
                  <a href="/stojan-na-misky-pre-psa" className="btn-coral inline-flex items-center gap-2">
                    Detail produktu <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </article>

            <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-card p-6 text-center shadow-card">
              <Sparkles className="mx-auto size-6 text-coral" />
              <p className="mt-3 leading-relaxed text-forest/75">
                Ponuku budeme postupne rozširovať o ďalšie produkty z našej výroby.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
