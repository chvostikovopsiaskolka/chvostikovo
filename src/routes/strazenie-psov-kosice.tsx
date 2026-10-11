import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Reviews } from "@/components/site/Reviews";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { ShortForm } from "@/components/site/Forms";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/strazenie-psov-kosice`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Stráženie psov Košice | Denná psia škôlka Chvostíkovo";
const description =
  "Denné stráženie psov v Košiciach. V Chvostíkove si psík počas vašej práce užije pohyb, hry, kamarátov aj oddych pod celodenným dohľadom.";

export const Route = createFileRoute("/strazenie-psov-kosice")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Chvostíkovo – denné stráženie psov v Košiciach" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Denné stráženie psov v Košiciach",
          serviceType: "Denná psia škôlka – stráženie psov počas dňa",
          url: PAGE_URL,
          provider: {
            "@type": "LocalBusiness",
            name: "Chvostíkovo psia škôlka",
            url: BASE_URL,
            address: {
              "@type": "PostalAddress",
              streetAddress: "Poľská 6",
              addressLocality: "Košice",
              postalCode: "040 01",
              addressCountry: "SK",
            },
          },
          areaServed: { "@type": "City", name: "Košice" },
        }),
      },
    ],
  }),
  component: DogSittingPage,
});

const MORE_LINKS = [
  { href: "/#starostlivost", title: "Ako sa staráme o psíkov", detail: "Hry, kamaráti a oddych" },
  { href: "/#cennik", title: "Cenník škôlky", detail: "Jednorazové vstupy a permanentky" },
  { href: "/#podmienky", title: "Podmienky prijatia", detail: "Čo vedieť pred prvou návštevou" },
];

function DogSittingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="top" className="relative overflow-hidden pt-20 sm:pt-24">
          <PawTrailBackground landingBottomPaws />
          <div className="relative z-10 mx-auto grid min-h-[425px] max-w-6xl items-center gap-5 px-4 py-5 sm:min-h-[535px] sm:gap-8 sm:py-7 lg:min-h-[570px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:py-12">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="font-display text-xs font-bold uppercase tracking-[0.1em] text-coral-dark sm:text-sm">
                Denná starostlivosť o stredných a veľkých psíkov
              </p>
              <h1 className="mt-3 text-[38px] leading-[1.07] tracking-[-0.03em] text-forest sm:text-5xl lg:text-[58px]">
                Stráženie psov <span className="text-coral-dark">v Košiciach</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-forest/85 sm:text-lg lg:mx-0">
                Kým ste v práci, váš psík si v našej dennej škôlke užije pohyb,
                hry s kamarátmi aj oddych. A to všetko pod naším celodenným dohľadom.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold sm:text-sm lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-white shadow-card">
                  <MapPin className="size-4" aria-hidden="true" /> Košice
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-white shadow-card">
                  <Clock3 className="size-4" aria-hidden="true" /> Po–Pia 7:00–17:00
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href="#informacie"
                  data-marketing-event="inquiry_cta"
                  data-tracking-source="dog_sitting_page_cta"
                  className="btn-coral"
                >
                  Chcem sa informovať
                </a>
                <a href="/#starostlivost" className="inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-4 hover:underline">
                  Zistiť viac o škôlke <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div id="informacie" className="mx-auto w-full max-w-md scroll-mt-24 lg:mx-0">
              <SchoolmatesFormCrown compact />
              <div className="rounded-4xl border border-white/50 bg-white/20 px-5 pt-9 pb-5 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px] lg:px-7 lg:pb-7">
                <h2 className="text-center font-display text-xl font-bold text-forest sm:text-2xl">
                  Chcete psíkovi dopriať deň s kamarátmi?
                </h2>
                <p className="mt-2 mb-4 text-center text-sm leading-relaxed text-forest/70">
                  Vyplňte krátky formulár, ozveme sa späť a radi s vami preberieme detaily.
                </p>
                <ShortForm trackingSource="dog_sitting_page_inline" />
              </div>
            </div>
          </div>
        </section>

        <InfoTicker />
        <Reviews />
        <DaycarePhotoCarousel />

        <section className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <h2 className="section-title text-3xl sm:text-4xl">
              Jeden deň v škôlke. Veľa radosti pre psíka.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-forest/80">
              Stráženie psov je u nás denná psia škôlka – bezpečný priestor
              na hry, socializáciu a oddych. Nových psíkov najprv spoznáme
              na úvodnej návšteve.
            </p>
            <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
              {MORE_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-forest/10 bg-background px-4 py-4 shadow-sm transition-colors hover:border-coral/50 hover:bg-secondary/35"
                >
                  <span className="min-w-0">
                    <span className="block font-display font-semibold text-forest">{link.title}</span>
                    <span className="mt-1 block text-xs text-forest/70">{link.detail}</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-coral transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
