import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { Reviews } from "@/components/site/Reviews";
import { Care, Why, About, Partners } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq } from "@/components/site/Info";
import { InstagramFeed } from "@/components/site/InstagramFeed";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";

const title = "Chvostíkovo – psia škôlka v Košiciach pre stredné a veľké psy";
const description =
  "Denná psia škôlka v Košiciach pre stredné a veľké plemená. Celodenný dohľad, výbeh 80 m², individuálny prístup. Hodnotenie 5.0 na Google a 100+ spokojných psíkov.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <Gallery />
        <Reviews />
        <Care />
        <Why />
        <About />
        <Partners />
        <PhotoStrip />
        <Requirements />

        <FirstVisit />
        <Pricing />
        <InstagramFeed />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
