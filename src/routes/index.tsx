import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { InfoTicker } from "@/components/site/InfoTicker";
import { EnrollBanner } from "@/components/site/EnrollBanner";
import { Gallery } from "@/components/site/Gallery";
import { Reviews } from "@/components/site/Reviews";
import { Care, Why, About, Partners } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq } from "@/components/site/Info";
import { InstagramFeed } from "@/components/site/InstagramFeed";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";
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
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
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
        <InfoTicker />
        <Reviews />
        <EnrollBanner />
        <Gallery />
        <Care />
        <Why />
        <FirstVisit />
        <Requirements />
        <About />
        <Partners />
        <PhotoStrip />
        <Pricing />
        <InstagramFeed />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
