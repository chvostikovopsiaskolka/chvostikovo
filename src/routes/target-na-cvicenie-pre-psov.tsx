import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { ProductRelatedArticles } from "@/components/site/ProductRelatedArticles";
import { Footer } from "@/components/site/Contact";
import { EdgePhotoCarousel } from "@/components/site/EdgePhotoCarousel";
import { FormDialog } from "@/components/site/FormDialog";
import { TargetVariantCards } from "@/components/site/TargetVariantCards";
import { useTargetInquiry } from "@/components/site/TargetInquiry";
import targetLargeDog from "@/assets/products/target-large-dog.jpeg";
import targetLargeDetail from "@/assets/products/target-large-detail.jpeg";
import targetLargeProduct from "@/assets/products/target-large-product.jpeg";
import targetLargeConstruction from "@/assets/products/target-large-construction.jpeg";
import targetCustomHeight from "@/assets/products/target-custom-height.jpeg";
import targetSmallDog from "@/assets/products/target-small-dog.jpeg";
import targetSmallDetail from "@/assets/products/target-small-detail.jpeg";
import targetSmallProduct from "@/assets/products/target-small-product.jpeg";
import targetMediumSide from "@/assets/products/target-medium-side.jpg";
import targetMediumDetail from "@/assets/products/target-medium-detail.jpg";
import targetSizes from "@/assets/products/target-sizes.jpeg";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/target-na-cvicenie-pre-psov/`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Target na cvičenie pre psov | Ručná výroba | Chvostíkovo";
const description =
  "Ručne vyrábaný drevený target s protišmykovým povrchom na tréning správneho postoja, koordinácie a rovnováhy. Veľký 40 × 20 cm, stredný 30 × 15 cm alebo malý 25 × 25 cm, cena 20 €.";

const INSPIRATION = [
  { src: targetMediumSide, alt: "Stredný target 30 × 15 cm – protišmykový povrch" },
  { src: targetMediumDetail, alt: "Detail konštrukcie stredného dreveného targetu" },
  { src: targetSmallDog, alt: "Pes pri tréningu na malom targete" },
  { src: targetSizes, alt: "Veľký a malý target na cvičenie pre psov" },
  { src: targetLargeProduct, alt: "Veľký drevený target s protišmykovým povrchom" },
  { src: targetSmallProduct, alt: "Malý štvorcový target na cvičenie" },
  { src: targetLargeDetail, alt: "Detail labiek psa na veľkom targete" },
  { src: targetSmallDetail, alt: "Detail labiek psa na malom targete" },
  { src: targetLargeConstruction, alt: "Detail konštrukcie veľkého targetu" },
  { src: targetCustomHeight, alt: "Target vyrobený s vyššími nohami podľa dohody" },
];

export const Route = createFileRoute("/target-na-cvicenie-pre-psov")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Target na cvičenie pre psov od Chvostíkova" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: PAGE_URL },
      { rel: "preload", as: "image", href: targetLargeDog },
      { rel: "preload", as: "image", href: targetSmallDog },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Target na cvičenie pre psov",
          description,
          url: PAGE_URL,
          image: [targetLargeDog, targetSmallDog, targetLargeProduct, targetSmallProduct].map(
            (src) => (src.startsWith("http") ? src : `${BASE_URL}${src}`),
          ),
          brand: { "@type": "Brand", name: "Chvostíkovo" },
          material: "Drevo a protišmykový gumový povrch",
          offers: {
            "@type": "Offer",
            url: PAGE_URL,
            priceCurrency: "EUR",
            price: "20",
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ],
  }),
  component: TargetPage,
});

function TargetGalleryLoop() {
  return (
    <EdgePhotoCarousel
      photos={INSPIRATION}
      label="Fotogaléria targetov na cvičenie – posúvajte fotografie do strán"
      dataName="target"
      className="mt-9"
    />
  );
}

function TargetPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { form, step, isSubmitted, setSize, setStep, setFormError } = useTargetInquiry({sourceRef:"/target-na-cvicenie-pre-psov",phoneId:"target-phone"});

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section data-target-product-intro className="relative overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pt-32">
          <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4">
            <a href="/produkty"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral">
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-[clamp(1.65rem,8.4vw,2.25rem)] leading-[1.06] text-forest sm:text-5xl">
                Target na cvičenie <span className="block text-coral-dark sm:inline">pre psov</span>
              </h1>
              <p className="mt-4 leading-relaxed text-forest/80 sm:text-lg">
                Vyberte si variant a objednajte si target pre svojho psíka.
              </p>
              <p className="mt-3 leading-relaxed text-forest/80">
                Každý psík má iné potreby. Naše targety vyrábame ručne a po dohode vieme prispôsobiť ich výšku aj rozmery podľa vašich požiadaviek.
              </p>
            </div>
            <TargetVariantCards onInterest={(nextSize) => {
              setSize(nextSize);
              setStep(1);
              setFormError("");
              setModalOpen(true);
            }} />
          </div>
        </section>

        <section className="bg-secondary/45 py-12 sm:py-16" aria-labelledby="target-value-heading">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Cvičenie v praxi
              </p>
              <h2 id="target-value-heading" className="section-title mt-2 text-3xl sm:text-4xl">
                Čo môžete s targetom trénovať?
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [
                  ShieldCheck,
                  "Presný dotyk labkou",
                  "Psík má jasne určené miesto, kam položiť labku. Môžete tak trénovať cielený dotyk namiesto náhodného kroku.",
                ],
                [
                  Check,
                  "Rehabilitácia a fyzioterapia",
                  "Pod vedením odborníka sa target môže využiť na kontrolované postavenie labiek, prácu s držaním tela a cviky podporujúce stabilitu či posilňovanie svalstva. Nenahrádza rehabilitačný plán.",
                ],
                [
                  Sparkles,
                  "Poslušnosť a zotrvanie na mieste",
                  "V bežnom tréningu môže target označovať miesto pre labky. Psík sa učí prísť na pokyn, pokojne zotrvať a odísť až po uvoľnení.",
                ],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof Check;
                return (
                  <article key={String(heading)} className="rounded-3xl bg-card p-6 shadow-card">
                    <CardIcon aria-hidden="true" className="size-5 text-coral" />
                    <h3 className="mt-3 text-lg text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/70">{String(text)}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-7 text-center">
              <a href="/blog/target-na-cvicenie-psov-prve-cviky/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral-dark underline underline-offset-4 hover:text-forest">
                Ako začať s targetom? Prvé cviky krok za krokom
                <ChevronRight aria-hidden="true" className="size-4" />
              </a>
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="section-title text-3xl sm:text-4xl">
                Targety, ktoré už pomáhajú psíkom pri tréningu
              </h2>
            </div>

          </div>
          <TargetGalleryLoop />
        </section>

        <ProductRelatedArticles />

        <section className="bg-forest py-12 text-cream sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl text-cream sm:text-4xl">Máte záujem o target?</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-cream/80">
              Vyberte si veľký, stredný alebo malý variant. Ak potrebujete inú výšku než bežných 5 cm,
              uveďte ju do formulára a dohodneme sa podľa možností výroby.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-coral mt-6 inline-flex items-center gap-2"
            >
              Mám záujem o target <ChevronRight className="size-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />

      <FormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        hideHeader={step > 1 || isSubmitted}
        title="Mám záujem o target"
        subtitle="Vyberte veľkosť targetu a pošlite nám kontakt. Ak chcete inú výšku ako približne 5 cm, môžete ju uviesť nižšie."
      >
        {form}
      </FormDialog>
    </div>
  );
}
