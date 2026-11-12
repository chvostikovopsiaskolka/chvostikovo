import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  Car,
  CheckCircle2,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { LeadStepForm } from "@/components/site/LeadStepForm";
import { FormDialog } from "@/components/site/FormDialog";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Reviews, VideoSection } from "@/components/site/Reviews";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { FriendshipFeature } from "@/components/site/FriendshipFeature";
import { FirstVisitPhoto } from "@/components/site/FirstVisitPhoto";
import { EditorialBenefits } from "@/components/site/EditorialBenefits";
import { Requirements } from "@/components/site/Info";
import { Footer } from "@/components/site/Contact";
import { Header } from "@/components/site/Header";
import { MobileDock } from "@/components/site/MobileDock";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { DAYCARE_GALLERY_EXTRAS, GALLERY, FAQ, PRICING } from "@/content/site";
import teamPhoto from "@/assets/team-dogs.jpg";
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
    title: "Spoločnosť namiesto čakania",
    text: "Váš psík má počas dňa kamošov, pozornosť a príležitosti na hru. Vy sa môžete venovať práci alebo svojim povinnostiam.",
  },
  {
    icon: PawPrint,
    title: "Pohyb aj čas vydýchnuť si",
    text: "Vo výbehu je priestor na hry a šantenie, vo vnútri na pokoj a oddych. Deň prispôsobujeme aj tomu, koľko aktivity jednotliví psíkovia potrebujú.",
  },
  {
    icon: ShieldCheck,
    title: "Ľudia, ktorí ho spoznajú",
    text: "Zaujíma nás jeho povaha, zvyky aj to, čo mu vyhovuje. Počas celého pobytu na psíkov dohliadajú minimálne dvaja opatrovatelia.",
  },
];

export const Route = createFileRoute("/psia-skolka-kosice")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
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

function scrollToLeadForm(source: string) {
  trackMarketingInteraction("inquiry_cta", source);
  void trackCookielessInteraction("inquiry_cta", source);
  const target = document.getElementById(window.innerWidth >= 1024 ? "lead-form-desktop" : "lead-form");
  if (!target) return;
  window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 12), behavior: "smooth" });
}
function scrollToBenefits(source: string) {
  trackMarketingInteraction("explore_daycare", source);
  void trackCookielessInteraction("explore_daycare", source);

  const target = document.getElementById("lead-benefits");
  if (!target) return;

  const top = window.scrollY + target.getBoundingClientRect().top;
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
      <Header landingMinimal hideMobileDock landingTrackingSource="lead_landing_header_phone" />
      <MobileDock variant="lead" onInterestOpen={() => openLeadModal("lead_landing_mobile_dock")} />

      <main>
        <section className="hero-safe-top relative overflow-hidden pt-4 sm:pt-6 lg:pt-24">
          <PawTrailBackground landingBottomPaws />

          <div className="relative z-10 mx-auto grid min-h-[425px] max-w-6xl items-center gap-8 px-4 pb-8 pt-0 sm:min-h-[465px] sm:pt-7 sm:pb-10 lg:min-h-[510px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-10">
            <div className="w-full min-w-0 text-center lg:text-left">
              <p className="whitespace-nowrap font-display text-[9.5px] font-bold uppercase tracking-[0.07em] text-coral-dark min-[390px]:text-[11px] min-[390px]:tracking-[0.08em] sm:text-sm sm:tracking-[0.16em]">
                Denné stráženie stredných a veľkých psíkov
              </p>
              <h1 className="mt-3 text-[38px] leading-[1.07] tracking-[-0.03em] text-forest sm:text-5xl sm:leading-[1.06] lg:text-[58px] lg:leading-[1.05]">
                Miesto, kam sa psíkovia
                <span className="block text-coral-dark">radi vracajú</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-relaxed text-forest/85 sm:mt-5 sm:text-lg">
                Kým vy pracujete, váš psík môže tráviť deň s kamošmi, užije pohyb, hry, oddych aj pozornosť pod celodenným dohľadom.
              </p>

              <div className="mx-auto mt-4 flex w-full max-w-[390px] flex-nowrap justify-center gap-1 sm:mt-5 sm:max-w-xl sm:gap-2 lg:ml-auto lg:mr-0 lg:justify-end">
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

              <div className="hero-cta-pair mx-auto mt-5 sm:mt-6 lg:hidden">
                <button
                  type="button"
                  onClick={() => scrollToLeadForm("lead_landing_hero_interest")}
                  className="hero-cta-primary"
                >
                  Mám záujem
                </button>
                <button
                  type="button"
                  onClick={() => scrollToBenefits("lead_landing_hero_more")}
                  className="hero-cta-secondary"
                >
                  <span>Viac o škôlke</span>
                  <ArrowDown className="hero-cta-icon" aria-hidden="true" />
                </button>
              </div>
              <button type="button" onClick={() => scrollToBenefits("lead_landing_hero_more_desktop")}
                className="hero-cta-primary mt-5 hidden w-full max-w-[440px] gap-2 lg:inline-flex">
                Viac o škôlke
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div id="lead-form-desktop" className="hidden min-w-0 lg:block">
              <SchoolmatesFormCrown compact />
              <div className="rounded-3xl border border-coral/15 bg-secondary/55 px-5 pb-6 pt-8 shadow-soft">
                <h2 className="mb-5 text-center font-display text-xl font-bold text-forest">Čo hľadáte pre svojho psíka?</h2>
                <LeadStepForm questionInHeading trackingSource="lead_landing_hero_desktop_inline" />
              </div>
            </div>
          </div>
        </section>

        <InfoTicker />

        <section id="lead-form" className="bg-card px-4 pb-8 pt-8 sm:pb-12 lg:hidden">
          <div className="mx-auto max-w-xl">
            <SchoolmatesFormCrown />
            <div className="rounded-3xl bg-secondary/55 px-4 pb-6 pt-12 shadow-card ring-1 ring-forest/8 sm:px-6 sm:pt-14">
              <h2 className="mb-5 text-center font-display text-xl font-bold text-forest sm:text-2xl">Čo hľadáte pre svojho psíka?</h2>
              <LeadStepForm questionInHeading trackingSource="lead_landing_hero_mobile_inline" />
            </div>
          </div>
        </section>

        <section id="lead-benefits" className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Prečo Chvostíkovo
            </p>
            <h2 className="section-title mx-auto mt-2 max-w-3xl text-3xl sm:text-4xl">
              Pekný deň pre psíka. Pokojnejšia hlava pre vás.
            </h2>

            {/* Mobile: one real photo paired with each benefit, with no overlapping rows. */}
            <div className="mt-7 space-y-5 sm:hidden">
              {BENEFITS.map(({ title: benefitTitle, text }, i) => {
                const photo = [DAYCARE_GALLERY_EXTRAS[2]!, DAYCARE_GALLERY_EXTRAS[1]!, DAYCARE_GALLERY_EXTRAS[0]!][i]!;
                return (
                  <div key={benefitTitle} className="grid grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] items-stretch gap-3">
                    <figure className="relative min-h-40 min-w-0 overflow-hidden rounded-[20px] bg-secondary shadow-card">
                      <img src={photo.src} alt={photo.alt} width={720} height={720} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                    </figure>
                    <article className="min-w-0 py-1 text-left">
                      <h3 className="font-display text-[14px] font-bold leading-snug text-forest min-[390px]:text-[16px]">{benefitTitle}</h3>
                      <p className="mt-2 text-[12px] leading-[1.55] text-forest/80 min-[390px]:text-[13px]">{text}</p>
                    </article>
                  </div>
                );
              })}
            </div>

            {/* Desktop/tablet: retain the established editorial composition. */}
            <div className="mt-7 hidden sm:block">
              <EditorialBenefits image={DAYCARE_GALLERY_EXTRAS[2]!.src} alt={DAYCARE_GALLERY_EXTRAS[2]!.alt} secondImage={DAYCARE_GALLERY_EXTRAS[1]!.src} secondAlt={DAYCARE_GALLERY_EXTRAS[1]!.alt}>
                {BENEFITS.map(({ icon: Icon, title: benefitTitle, text }, i) => (
                  <article key={benefitTitle} className={`py-3 first:pt-0 last:pb-0 sm:py-5 ${i ? "border-t border-forest/15" : ""}`}>
                    <Icon className="mb-2 hidden size-7 text-coral sm:block" aria-hidden />
                    <h3 className="font-display text-[14px] font-bold leading-snug text-forest min-[390px]:text-[16px] sm:text-xl">{benefitTitle}</h3>
                    <p className="mt-1 text-[12px] leading-[1.5] text-forest/80 min-[390px]:text-[13px] sm:text-base sm:leading-relaxed">{text}</p>
                  </article>
                ))}
              </EditorialBenefits>
            </div>

            <button
              type="button"
              onClick={() => openLeadModal("lead_landing_benefits")}
              className="btn-coral mt-7 inline-flex min-w-[270px] justify-center px-7 py-3.5 text-[15px] sm:min-w-[330px] sm:text-lg"
            >
              Toto hľadám pre svojho psíka
            </button>
          </div>
        </section>

        <Reviews />

        <section id="lead-pricing" className="relative scroll-mt-24 overflow-hidden bg-secondary/35 py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 className="section-title text-3xl sm:text-4xl">Koľko stojí deň v škôlke?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-forest/75 sm:text-base">
              Pohyb, hry, oddych aj celodenný dohľad sú súčasťou každého vstupu. Pri pravidelných návštevách môžete využiť výhodnejšiu permanentku.
            </p>
            <div className="mx-auto mt-7 grid max-w-2xl gap-4 sm:grid-cols-2">
              {PRICING.map((item) => (
                <article key={item.name} className={`rounded-3xl p-6 shadow-card ${item.highlight ? "bg-forest text-cream" : "bg-card text-forest"}`}>
                  <h3 className="font-display text-xl font-bold">{item.name}</h3>
                  <p className={`mt-3 font-display text-4xl font-bold ${item.highlight ? "text-cream" : "text-coral-dark"}`}>{item.price}</p>
                  {item.highlight && (
                    <>
                      <p className="mt-3 text-sm leading-relaxed text-cream/85">
                        {(item.note?.split("Permanentka platí")[0] ?? "").trim()}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-cream/75">
                        Permanentka platí 2 mesiace.
                      </p>
                    </>
                  )}
                </article>
              ))}
            </div>
            <div className="mx-auto mt-6 flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl border border-coral/50 bg-coral/10 px-5 py-3 text-center shadow-card sm:px-7">
              <CheckCircle2 className="size-5 shrink-0 text-coral-dark" aria-hidden="true" />
              <p className="font-display text-base font-bold text-forest sm:text-lg">
                Úvodná návšteva zadarmo
              </p>
            </div>
            <p className="mx-auto mt-5 flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-3 py-3 text-center font-display text-xs font-semibold leading-tight text-forest sm:rounded-full sm:px-5 sm:text-sm">
              <Car className="size-4 shrink-0 text-coral-dark sm:size-5" aria-hidden="true" />
              <span>Odvoz / vyzdvihnutie: <strong>5 € / jazda</strong></span>
            </p>

            <a href="#lead-requirements" className="mt-4 block font-display text-sm font-semibold text-forest underline underline-offset-4 hover:text-coral focus-visible:text-coral">
              Pozrieť podmienky prijatia
            </a>
          </div>
        </section>

        <section id="lead-form-pricing" className="bg-card px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-xl rounded-3xl bg-secondary/55 p-5 shadow-card ring-1 ring-coral/15 sm:p-8">
            <h2 className="mb-5 text-center font-display text-2xl font-bold text-forest">Čo hľadáte pre svojho psíka?</h2>
            <LeadStepForm questionInHeading trackingSource="lead_landing_pricing_inline" />
          </div>
        </section>

        <Requirements id="lead-requirements" />

        <FriendshipFeature ctaLabel="Toto hľadám pre svojho psíka" onCtaClick={() => openLeadModal("lead_landing_friendship_20261028")} />

        <DaycarePhotoCarousel />
        <VideoSection />

        <section id="lead-first-visit" className="relative scroll-mt-24 overflow-hidden bg-forest py-10 text-cream sm:py-14">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-soft">
              Ako to funguje
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Prvá návšteva v 3 krokoch</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">
              Najprv sa spoznáme a spolu zistíme, či sa váš psík bude u nás cítiť dobre.
            </p>

<p className="mx-auto mt-4 w-fit rounded-full border border-coral-soft/40 bg-cream/15 px-5 py-2 font-display text-base font-bold text-cream shadow-sm sm:text-lg">Úvodná návšteva zadarmo</p>

                        <div className="mt-10 grid gap-9 text-center md:grid-cols-3 md:gap-8">
              {[
                ["1", "Porozprávame sa o vašom psíkovi", "Zavolajte nám alebo nechajte kontakt vo formulári. Preberieme jeho povahu, potreby aj vaše otázky a dohodneme termín úvodnej návštevy."],
                ["2", "Prídete nás spoznať", "Ukážeme vám priestory a zoznámime sa s vaším psíkom. Pozrieme sa, ako reaguje na nové prostredie a ostatných psov, a spolu sa dohodneme na ďalšom postupe.", "Úvodná návšteva je zadarmo."],
                ["3", "Doprajete mu prvý deň v škôlke", "Ak mu kolektív vyhovuje, dohodneme jeho prvý pobyt. Počas dňa sa oňho postaráme a pošleme vám fotky či videá, aby ste videli, ako sa u nás má."],
              ].map(([number, stepTitle, text, note], i) => (
                <article key={number} className="min-w-0">
                  <FirstVisitPhoto number={number ?? i + 1} image={GALLERY[[2, 0, 5][i]!]!.src} alt={GALLERY[[2, 0, 5][i]!]!.alt} />
                  <h3 className="font-display text-lg font-bold text-cream">{stepTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/85">{text}</p>
                  {note && <p className="mt-3 text-sm font-bold text-cream">{note}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-6 px-4 md:grid-cols-2 md:gap-10">
            <img
              src={teamPhoto}
              alt="Majitelia psej škôlky Chvostíkovo so svojimi psíkmi"
              loading="lazy"
              className="h-60 w-full rounded-3xl object-cover shadow-card sm:h-72"
            />
            <div>
              <h2 className="section-title text-3xl sm:text-4xl">Kto sa bude starať o vášho psíka?</h2>
              <p className="mt-4 text-sm leading-relaxed text-forest/75 sm:text-base">
                Aj my sme majitelia veľkých psíkov, a preto poznáme ten pocit, keď ich máte zveriť niekomu inému. Aj preto vzniklo Chvostíkovo — miesto, kde psíkov spoznávame, rešpektujeme ich potreby a staráme sa o nich tak, ako by sme chceli pre svojich vlastných.
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-secondary/40 py-10 sm:py-14">
          <SectionAmbientPaws />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
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
                        Aktuálne ceny nájdete vyššie v sekcii{" "}
                        <a href="#lead-pricing" className="font-semibold text-coral underline underline-offset-2">
                          Cenník
                        </a>
                        {" "}na tejto stránke.
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
                  Radi vám odpovieme na otázky o škôlke.
                </p>
              </div>

              <div className="mx-auto mt-6 max-w-xl rounded-3xl bg-card p-5 shadow-card sm:p-6">
                <LeadStepForm questionInHeading trackingSource="lead_landing_bottom_inline" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <FormDialog
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        title="Čo hľadáte pre svojho psíka?"
        subtitle="Vyplňte krátky nezáväzný formulár. Ozveme sa vám."
      >
        <LeadStepForm questionInHeading trackingSource={leadModalSource} />
      </FormDialog>
    </div>
  );
}
