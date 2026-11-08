import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { ProductCatalogCarousel } from "@/components/site/ProductCatalogCarousel";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/produkty/`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Produkty pre psov | Ručná výroba | Chvostíkovo";
const description =
  "Ručne vyrábané produkty pre psov od Chvostíkova. Drevené stojany na misky a tréningové targety v praktickom prevedení.";

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
        <section className="bg-background pt-5 pb-5 sm:pt-10 sm:pb-10 lg:pt-32">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h1 className="mx-auto max-w-4xl text-[1.7rem] leading-[1.07] text-forest sm:text-5xl lg:text-6xl">
              Naše <span className="text-coral-dark">produkty pre psov</span>
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-6 text-forest/80 sm:mt-5 sm:text-lg sm:leading-relaxed">
              Praktické produkty, ktoré ručne vyrábame. S dôrazom na funkčnosť,
              kvalitné spracovanie a individuálne prevedenie.
            </p>
          </div>
        </section>
        <section className="bg-secondary/45 pt-5 pb-10 sm:py-12" aria-labelledby="products-selection-title">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="products-selection-title" className="section-title text-center text-2xl sm:text-4xl">
              Vyberte si produkt
            </h2>
            <ProductCatalogCarousel />
            <div className="mx-auto mt-5 max-w-2xl rounded-3xl bg-card p-4 text-center shadow-card sm:mt-8 sm:p-5">
              <p className="text-sm leading-relaxed text-forest/75 sm:text-base">
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
