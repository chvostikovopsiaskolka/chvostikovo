import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  Car,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ShortForm } from "@/components/site/Forms";
import { FormDialog } from "@/components/site/FormDialog";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Reviews, ReviewReasons, VideoSection } from "@/components/site/Reviews";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { Footer } from "@/components/site/Contact";
import { Header } from "@/components/site/Header";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { FAQ, REVIEWS } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

const BASE_URL = "https://chvostikovo.sk";
const URL = `${BASE_URL}/psia-skolka-kosice`;
const title = "Psia škôlka Košice | Aktívny deň pre vášho psíka | Chvostíkovo";
const description =
  "Kým ste v práci, váš psík môže mať aktívny deň plný pohybu, hier, kamarátov a oddychu. Chvostíkovo – psia škôlka v Košiciach s celodenným dohľadom.";

const LANDING_FAQ_QUESTIONS = new Set([
  "Ako prebieha prvá návšteva psíka v škôlke?",
  "Bude môj psík počas dňa niekedy sám bez dozoru?",
  "Čo ak môj psík ešte nikdy nebol v kolektíve psov?",
  "Prijímate aj šteniatka?",
  "Zabezpečujete aj vyzdvihnutie a odvoz psíka?",
  "Aký je cenník služieb?",
]);

const LANDING_FAQ = FAQ.filter((item) => LANDING_FAQ_QUESTIONS.has(item.q));

const BENEFITS = [
  {
    icon: PawPrint,
    title: "Aktívny deň",
    text: "Pohyb, hry, kamaráti aj oddych v bezpečnom dennom režime.",
  },
  {
    icon: ShieldCheck,
    title: "Celodenný dohľad",
    text: "Psíkovia sú počas pobytu pod dohľadom minimálne dvoch skúsených opatrovateľov.",
  },
  {
    icon: Heart,
    title: "Individuálny prístup",
    text: "Ku každému psíkovi pristupujeme podľa jeho povahy, potrieb a tempa.",
  },
  {
    icon: Sparkles,
    title: "Socializácia",
    text: "Bezpečný kontakt s inými psami, nové podnety a deň plný zážitkov.",
  },
  {
    icon: Car,
    title: "Psí taxík",
    text: "Ak nestíhate dovoz alebo vyzdvihnutie, vieme vám pomôcť s dopravou psíka.",
  },
];

export const Route = createFileRoute("/psia-skolka-kosice")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: `${BASE_URL}/og-image.png` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${BASE_URL}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: LeadLandingPage,
});

function scrollToBenefits(source: string) {
  trackMarketingInteraction("explore_daycare", source);
  void trackCookielessInteraction("explore_daycare", source);

  const target = document.getElementById("lead-benefits");
  if (!target) return;

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function LeadLandingPage() {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalSource, setLeadModalSource] = useState("lead_landing_modal");

  function openLeadModal(source: string) {
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setLeadModalSource(source);
    setLeadModalOpen(true);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Header landingMinimal landingTrackingSource="lead_landing_header_phone" />

      <main>
        <section className="relative overflow-hidden pt-20 sm:pt-24">
          <PawTrailBackground landingBottomPaws />

          <div className="relative z-10 mx-auto grid min-h-[425px] max-w-6xl items-center gap-5 px-4 py-0 sm:min-h-[535px] sm:pt-7 sm:pb-4 lg:min-h-[600px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:py-14">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="whitespace-nowrap font-display text-[9px] font-bold uppercase tracking-[0.09em] text-coral-dark min-[390px]:text-[9.5px] min-[390px]:tracking-[0.11em] sm:text-sm sm:tracking-[0.16em]">
                Denné stráženie stredných a veľkých psíkov
              </p>
              <h1 className="mt-2 text-[38px] leading-[1.07] tracking-[-0.03em] text-forest sm:text-5xl sm:leading-[1.06] lg:text-[58px] lg:leading-[1.05]">
                Miesto, kam sa psíkovia
                <span className="block text-coral-dark">radi vracajú</span>
              </h1>

              <p className="mx-auto mt-2.5 max-w-xl text-base font-semibold leading-relaxed text-forest/85 sm:mt-5 sm:text-lg lg:mx-0">
                Váš psík si môže užiť aktívny deň s kamošmi, kým vy pracujete. Pohyb, hry, socializácia, oddych a celodenný dohľad v psej škôlke Chvostíkovo v Košiciach.
              </p>

              <div className="mx-auto mt-2.5 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 sm:mt-5 lg:mx-0 lg:max-w-none lg:justify-start lg:gap-2">
                {["Celodenný dohľad", "Vlastný výbeh", "Úvodná návšteva zadarmo"].map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-forest px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-white shadow-card min-[350px]:px-2 min-[350px]:text-[8.5px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9.5px] lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs"
                  >
                    <CheckCircle2 className="size-3 shrink-0 text-white min-[390px]:size-3.5 lg:size-4" />
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollToBenefits("lead_landing_hero")}
                className="btn-coral mt-3 inline-flex min-w-[270px] items-center justify-center gap-2 px-7 py-3 text-[15px] sm:mt-6 sm:min-w-[330px] sm:px-9 sm:py-4 sm:text-lg"
              >
                Zistiť viac
                <ArrowDown className="size-5" />
              </button>

              <div className="mt-2.5 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm font-semibold text-forest/80 sm:mt-5 lg:justify-start">
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-coral" /> Poľská 6, Košice</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-coral" /> Po–Pia 7:00–17:00</span>
              </div>
            </div>

            <div id="lead-form" className="mx-auto hidden w-full max-w-md scroll-mt-24 lg:mx-0 lg:block">
              <SchoolmatesFormCrown compact />
              <div className="rounded-4xl border border-white/70 bg-white/75 px-5 pt-9 pb-5 shadow-soft ring-1 ring-forest/8 backdrop-blur-sm lg:px-7 lg:pb-7">
                <p className="mb-4 text-center font-display text-2xl font-bold text-forest">
                  Zistite, či je Chvostíkovo vhodné aj pre vášho psíka
                </p>
                <ShortForm trackingSource="lead_landing_top" />
              </div>
            </div>
          </div>
        </section>

        <InfoTicker />

        <section className="bg-card px-4 pt-2 pb-5 sm:pt-4 sm:pb-7 lg:hidden">
          <SchoolmatesFormCrown />
          <div className="mx-auto max-w-md rounded-3xl bg-secondary/55 px-3.5 pt-12 pb-3.5 shadow-card ring-1 ring-forest/8 sm:px-5 sm:pt-14 sm:pb-5">
            <div className="mb-4 text-center">
              <p className="font-display text-xl font-bold text-forest">
                Chcete sa informovať o škôlke?
              </p>
            </div>
            <ShortForm trackingSource="lead_landing_mobile_below_hero" />
          </div>
        </section>

        <section className="bg-card py-10 sm:py-14">
          <div id="lead-benefits" className="mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Prečo Chvostíkovo
            </p>
            <h2 className="section-title mx-auto mt-2 max-w-3xl text-3xl sm:text-4xl">
              5 dôvodov, prečo si psíčkari vyberajú našu škôlku
            </h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {BENEFITS.map(({ icon: Icon, title: benefitTitle, text }) => (
                <article key={benefitTitle} className="flex h-full flex-col rounded-3xl bg-secondary/55 p-4 text-left ring-1 ring-forest/8 sm:p-5">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-coral text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-forest">{benefitTitle}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-forest/70">{text}</p>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openLeadModal("lead_landing_benefits")}
              className="btn-coral mt-7 inline-flex min-w-[270px] justify-center px-7 py-3.5 text-[15px] sm:min-w-[330px] sm:text-lg"
            >
              Chcem to pre svojho psíka
            </button>
          </div>
        </section>

        <section className="bg-secondary/35 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="section-title text-3xl sm:text-4xl">Majitelia nám zverujú to najcennejšie</h2>
            <p className="mt-2 text-sm font-semibold text-forest/70 sm:text-base">
              ⭐ 5.0 z 5 na Google · 43 hodnotení
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {REVIEWS.slice(0, 3).map((review) => (
                <figure key={review.name} className="rounded-3xl bg-card p-5 text-left shadow-card sm:p-6">
                  <div className="text-[#F5B301]">★★★★★</div>
                  <blockquote className="mt-3 text-sm leading-relaxed text-forest/80">
                    „{review.text}“
                  </blockquote>
                  <figcaption className="mt-4 font-display text-sm font-bold text-forest">
                    {review.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <Reviews />
        <ReviewReasons
          ctaLabel="Toto chcem pre môjho psíka"
          onCtaClick={() => openLeadModal("lead_landing_why_chvostikovo")}
        />

        <section className="bg-card pt-8 text-center sm:pt-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title text-3xl sm:text-4xl">Pozrite si zopár fotiek zo škôlky</h2>
          </div>
        </section>

        <DaycarePhotoCarousel />
        <VideoSection />

        <section className="bg-forest py-10 text-cream sm:py-14">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-soft">
              Ako to funguje
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Od prvého kliknutia po prvý deň v škôlke</h2>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["1", "Vyplníte krátky formulár", "Necháte nám meno a telefónny kontakt."],
                ["2", "Ozveme sa vám", "Preberieme vášho psíka, vaše potreby a odpovieme na otázky."],
                ["3", "Dohodneme úvodnú návštevu", "Psík sa zoznámi s prostredím, nami aj kolektívom. Úvodná návšteva je zadarmo."],
              ].map(([number, stepTitle, text]) => (
                <article key={number} className="rounded-3xl bg-cream/10 p-5 text-left ring-1 ring-cream/15">
                  <span className="flex size-10 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-white">
                    {number}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-cream">{stepTitle}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream/75">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/40 py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <h2 className="section-title text-3xl sm:text-4xl">Najčastejšie otázky</h2>
              <p className="mt-2 text-sm text-forest/65 sm:text-base">
                Najdôležitejšie informácie pred prvou návštevou.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {LANDING_FAQ.map((item) => (
                <details key={item.q} className="group rounded-3xl bg-card px-5 py-4 shadow-card sm:px-6">
                  <summary className="cursor-pointer list-none font-display text-base font-bold text-forest marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-xl text-coral transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-forest/75">
                    {item.q === "Aký je cenník služieb?" ? (
                      <p>
                        Viac o cenníku za služby psej škôlky nájdete v sekcii{" "}
                        <a href="/#cennik" className="font-semibold text-coral underline underline-offset-2">
                          Cenník
                        </a>
                        {" "}na hlavnom webe.
                      </p>
                    ) : (
                      item.a
                        .split(/\n+/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => <p key={index}>{paragraph}</p>)
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-10 sm:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-4xl bg-secondary/55 p-5 shadow-soft sm:p-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="section-title text-3xl sm:text-4xl">Chcete to dopriať aj svojmu psíkovi?</h2>
                <p className="mt-2 text-sm leading-relaxed text-forest/70 sm:text-base">
                  Vyplňte nezáväzný formulár. Ozveme sa vám späť a zistíme spolu, či je Chvostíkovo vhodné aj pre vášho psíka.
                </p>
              </div>

              <div className="mx-auto mt-6 max-w-md rounded-3xl bg-card p-5 shadow-card sm:p-6">
                <ShortForm trackingSource="lead_landing_bottom" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <FormDialog
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        title="Zistite, či je Chvostíkovo vhodné aj pre vášho psíka"
      >
        <ShortForm trackingSource={leadModalSource} />
      </FormDialog>
    </div>
  );
}
