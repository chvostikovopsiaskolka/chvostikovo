import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { HomeAriaDock } from "@/components/site/HomeAriaDock";
import { HomeCareFaq } from "@/components/site/HomeCareFaq";
import { Hero } from "@/components/site/Hero";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Gallery } from "@/components/site/Gallery";
import { ReviewReasons, Reviews } from "@/components/site/Reviews";
import { Care, Why, About, Partners, FriendshipInterest } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq } from "@/components/site/Info";
import { UsefulInfo } from "@/components/site/UsefulInfo";
import { ProductSection } from "@/components/site/ProductSection";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";
import { InquirySection } from "@/components/site/InquirySection";
import { HomePuppyChecker } from "@/components/site/HomePuppyChecker";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { FAQ } from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Psia škôlka Košice | Denná starostlivosť pre psov – Chvostíkovo";
const description =
  "Psia škôlka v Košiciach pre stredné a veľké psy. Po–Pi 7:00–17:00. Celodenný dohľad, vlastný výbeh, možnosť vyzdvihnutia a úvodná návšteva zadarmo.";

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
      <Header hideMobileDock />
      <HomeAriaDock />
      {/* A single copy of every section: mobile order is CSS-only, desktop order
          and desktop section markup remain the original published sequence. */}
      <main className="flex flex-col lg:block">
        <div className="order-0 lg:contents"><Hero homepageMobile /></div>
        <div className="hidden lg:block"><InfoTicker /></div>
        <div className="order-1 lg:contents"><Reviews variant="home" /></div>
        <div className="order-2 lg:contents"><ReviewReasons variant="home" withVideo /></div>
        <div className="order-4 lg:contents"><DaycarePhotoCarousel /></div>
        <div className="order-5 lg:contents"><Care showEmbeddedFriendship={false} showInterest={false} /></div>
        <div className="order-6 lg:hidden"><HomeCareFaq /></div>
        <div className="order-7 lg:contents"><Pricing interestMode homeMobile /></div>
        <div className="order-9 lg:contents"><FriendshipInterest /></div>
        <div className="order-11 lg:contents"><Gallery mobileMosaic /></div>
        <div className="order-12 lg:contents"><FirstVisit /></div>
        <div className="order-14 lg:contents"><Why /></div>
        <div className="order-10 lg:contents"><InquirySection /></div>
        <div className="order-8 lg:contents"><Requirements showContextFaq /></div>
        <div id="home-puppy-section" className="order-13 lg:contents"><HomePuppyChecker /></div>
        <div className="order-15 lg:contents"><Faq /></div>
        <div className="order-16 lg:contents"><ProductSection /></div>
        <div className="order-3 lg:contents"><About homeMobile /></div>
        <div className="order-17 lg:contents"><Partners /></div>
        <div className="order-18 lg:contents"><UsefulInfo /></div>
        <div className="order-19 lg:contents"><PhotoStrip /></div>
        <div className="order-20 lg:contents"><Contact /></div>
      </main>
      <Footer />
    </div>
  );
}
