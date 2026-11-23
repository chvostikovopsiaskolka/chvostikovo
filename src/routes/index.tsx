import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { ReviewReasons } from "@/components/site/Reviews";
import { Care, Why, About, Partners, FriendshipInterest } from "@/components/site/Story";
import { Requirements, FirstVisit, Pricing, Faq, DaycareEarlyFaq } from "@/components/site/Info";
import { UsefulInfo } from "@/components/site/UsefulInfo";
import { ProductSection } from "@/components/site/ProductSection";
import { PhotoStrip } from "@/components/site/PhotoStrip";
import { Contact, Footer } from "@/components/site/Contact";
import { InquirySection } from "@/components/site/InquirySection";
import { LeadStepForm } from "@/components/site/LeadStepForm";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
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
  const [heroInquiryOpen, setHeroInquiryOpen] = useState(false);
  const heroInquiryRef = useRef<HTMLElement>(null);
  const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!heroInquiryOpen) return;
    const frame = requestAnimationFrame(() => {
      const panel = heroInquiryRef.current;
      panel?.scrollIntoView({ behavior: isReducedMotion() ? "auto" : "smooth", block: "start" });
      panel?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [heroInquiryOpen]);

  function openHeroInquiry() {
    if (heroInquiryOpen) {
      heroInquiryRef.current?.scrollIntoView({
        behavior: isReducedMotion() ? "auto" : "smooth", block: "start",
      });
    } else {
      setHeroInquiryOpen(true);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero onMobileInquiryOpen={openHeroInquiry} mobileInquiryOpen={heroInquiryOpen} />
        {heroInquiryOpen && (
          <section id="home-hero-interest" ref={heroInquiryRef} data-home-hero-revealed-form
            className="relative scroll-mt-20 overflow-hidden bg-card px-4 pb-11 pt-6 lg:hidden">
            <SectionAmbientPaws />
            <div className="form-liquid-surface relative z-10 mx-auto max-w-xl overflow-hidden rounded-[26px] px-4 py-6 min-[390px]:px-6">
              <h2 tabIndex={-1} className="font-display text-center text-lg font-bold text-forest focus:outline-none">
                Chceli by ste sa informovať o škôlke?
              </h2>
              <LeadStepForm trackingSource="home_hero_interest_mobile" questionInHeading compact />
            </div>
          </section>
        )}
        <ReviewReasons variant="home" withVideo showCta={false} />
        <About homeLayout />
        <Pricing interestMode homeLayout />
        <Requirements />
        <DaycareEarlyFaq />
        <DaycarePhotoCarousel />
        <InquirySection allScreens matchHero />
        <Care showEmbeddedFriendship={false} showInterest={false} />
        <Gallery />
        <FriendshipInterest inlineForm />
        <FirstVisit inlineForm leadStyle />
        <Why />
        <HomePuppyChecker />
        <Faq />
        <ProductSection />
        <Partners />
        <UsefulInfo />
        <PhotoStrip />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
