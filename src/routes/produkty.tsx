import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Hammer, Paintbrush, Ruler, Sparkles, Type } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import standMia from "@/assets/products/stand-small-mia.webp";

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
        <section className="bg-background pt-28 pb-12 sm:pt-32 sm:pb-16">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h1 className="mx-auto max-w-4xl text-4xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
              Naše <span className="text-coral-dark">produkty pre psov</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-forest/80">
              Praktické produkty, ktoré vznikajú priamo v Chvostíkove. Vyrábame ich ručne, s dôrazom
              na funkčnosť, kvalitné spracovanie a individuálne prevedenie.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:gap-2">
              <span className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-card px-1.5 py-2 text-[9px] font-semibold text-forest shadow-card sm:gap-2 sm:px-4 sm:text-sm">
                <Hammer className="size-3 shrink-0 text-coral sm:size-4" /> Ručná výroba
              </span>
              <span className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-card px-1.5 py-2 text-[9px] font-semibold text-forest shadow-card sm:gap-2 sm:px-4 sm:text-sm">
                <Ruler className="size-3 shrink-0 text-coral sm:size-4" /> Výška na mieru
              </span>
              <span className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-card px-1 py-2 text-[8px] font-semibold text-forest shadow-card sm:gap-2 sm:px-4 sm:text-sm">
                <Paintbrush className="size-3 shrink-0 text-coral sm:size-4" /> Individuálne
                prevedenie
              </span>
            </div>
          </div>
        </section>

        <section className="bg-secondary/45 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="section-title text-3xl sm:text-4xl">Vyberte si produkt</h2>
            </div>

            <article className="mx-auto mt-9 grid max-w-4xl overflow-hidden rounded-4xl bg-card shadow-soft lg:grid-cols-[1fr_0.95fr]">
              <a href="/stojan-na-misky-pre-psa" className="group block overflow-hidden">
                <img
                  src={standMia}
                  alt="Drevený stojan na misky pre psa s personalizáciou"
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-80 lg:h-full"
                  style={{ objectPosition: "50% 63%" }}
                />
              </a>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">
                  Stojany na misky
                </p>
                <h2 className="mt-2 text-2xl text-forest sm:text-3xl">
                  Drevený stojan na misky pre psa
                </h2>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Stabilný stojan na dve nerezové misky. Výšku prispôsobíme psíkovi a farebné
                  prevedenie aj meno doladíme podľa vášho želania, aby mal každý psík svoj originál.
                </p>
                <div className="mt-5 grid gap-2 text-sm text-forest/80 sm:grid-cols-2">
                  <span className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5">
                    <Sparkles className="size-4 shrink-0 text-coral" /> 2 nerezové misky v cene
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5">
                    <Ruler className="size-4 shrink-0 text-coral" /> Výška na mieru podľa psíka
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5">
                    <Paintbrush className="size-4 shrink-0 text-coral" /> Farba podľa želania
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5">
                    <Type className="size-4 shrink-0 text-coral" /> Personalizácia menom
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-forest/60">Cena</p>
                    <p className="font-display text-2xl font-bold text-forest">40 €</p>
                  </div>
                  <a
                    href="/stojan-na-misky-pre-psa"
                    className="btn-coral inline-flex items-center gap-2"
                  >
                    Detail produktu <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </article>

            <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-card p-5 text-center shadow-card">
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
