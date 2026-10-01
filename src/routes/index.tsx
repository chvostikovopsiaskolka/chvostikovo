import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Gallery } from "@/components/site/Gallery";
import { ReviewReasons, Reviews, VideoSection } from "@/components/site/Reviews";
import { Care, Why, About, Partners } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq } from "@/components/site/Info";
import { UsefulInfo } from "@/components/site/UsefulInfo";
import { ProductSection } from "@/components/site/ProductSection";
import { InstagramFeed } from "@/components/site/InstagramFeed";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";
import { InquirySection } from "@/components/site/InquirySection";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { FAQ } from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Psia škôlka Košice | Denné stráženie psov | Chvostíkovo";
const description =
  "Psia škôlka Chvostíkovo v Košiciach – denné stráženie psov s individuálnym prístupom, bezpečným výbehom a celodenným dohľadom.";

const HOME_FAQ_QUESTIONS = new Set([
  "Bude môj psík počas dňa niekedy sám bez dozoru?",
  "Ako prebieha prvá návšteva psíka v škôlke?",
  "Ako zabezpečujete bezpečnosť psíkov v škôlke?",
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
  "Prijímate aj šteniatka?",
  "Hrajú sa psíkovia v škôlke celý deň?",
]);

const HOME_FAQ = FAQ.filter((item) => HOME_FAQ_QUESTIONS.has(item.q));

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
          mainEntity: HOME_FAQ.map((f) => ({
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
        <Reviews />
        <ReviewReasons />
        <DaycarePhotoCarousel />
        <Gallery />
        <VideoSection />
        <Care />
        <InquirySection />
        <Why />
        <Faq />
        <FirstVisit />
        <Requirements />
        <Pricing />
        <About />
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
