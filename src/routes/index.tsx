import { createFileRoute } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Gallery } from "@/components/site/Gallery";
import { ReviewReasons, Reviews, VideoSection } from "@/components/site/Reviews";
import { Care, Why, About, Partners } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq, PracticalFaq } from "@/components/site/Info";
import { UsefulInfo } from "@/components/site/UsefulInfo";
import { ProductSection } from "@/components/site/ProductSection";
import { InstagramFeed } from "@/components/site/InstagramFeed";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";
import { InquirySection } from "@/components/site/InquirySection";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import schoolmatesCta from "@/assets/skolkari-web-4.png";
import { FAQ } from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Psia škôlka Košice | Denné stráženie psov | Chvostíkovo";
const description =
  "Psia škôlka Chvostíkovo v Košiciach – denné stráženie psov s individuálnym prístupom, bezpečným výbehom a celodenným dohľadom.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Chvostíkovo - psia škôlka Košice" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <div className="hidden lg:block">
          <InfoTicker />
        </div>
        <ReviewReasons />
        <Reviews />
        <Faq />
        <div className="bg-card">
          <div className="mx-auto h-[150px] max-w-[820px] overflow-hidden sm:h-[230px]" aria-hidden="true">
            <img
              src={schoolmatesCta}
              alt=""
              loading="lazy"
              decoding="async"
              width={1200}
              height={630}
              className="block h-full w-full object-cover object-bottom"
            />
          </div>
        </div>
        <section className="relative mb-7 overflow-hidden bg-forest py-4 text-cream sm:mb-8 sm:py-5">
          <PawPrint
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-[8%] size-7 -rotate-12 text-cream/10 sm:size-8"
          />
          <PawPrint
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1 left-[34%] size-6 rotate-12 text-cream/10 sm:size-7"
          />
          <PawPrint
            aria-hidden="true"
            className="pointer-events-none absolute top-1 right-[28%] size-5 rotate-[24deg] text-cream/10 sm:size-6"
          />
          <PawPrint
            aria-hidden="true"
            className="pointer-events-none absolute right-[6%] bottom-1 size-7 -rotate-[20deg] text-cream/10 sm:size-8"
          />
          <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 text-left sm:gap-5 lg:justify-center lg:gap-10">
            <h2 className="min-w-0 font-display text-lg leading-tight text-cream sm:text-xl lg:text-2xl">
              Prečo využiť psiu škôlku?
            </h2>
            <a
              href="#preco"
              className="btn-coral shrink-0 px-4 py-2.5 text-sm sm:px-5 sm:text-base"
            >
              Zisti viac
            </a>
          </div>
        </section>
        <DaycarePhotoCarousel />
        <VideoSection />
        <InquirySection />
        <Gallery />
        <Care />
        <Why />
        <PracticalFaq />
        <FirstVisit />
        <Requirements />
        <About />
        <Pricing />
        <InstagramFeed />
        <Partners />
        <ProductSection />
        <UsefulInfo />
        <PhotoStrip />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
