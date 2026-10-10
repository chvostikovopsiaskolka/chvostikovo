import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { ShortForm } from "@/components/site/Forms";
import { FormDialog } from "@/components/site/FormDialog";
import { InfoTicker } from "@/components/site/InfoTicker";
import { Reviews, VideoSection } from "@/components/site/Reviews";
import { DaycarePhotoCarousel } from "@/components/site/DaycarePhotoCarousel";
import { FriendshipFeature } from "@/components/site/FriendshipFeature";
import { Footer } from "@/components/site/Contact";
import { Header } from "@/components/site/Header";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";
import { SchoolmatesFormCrown } from "@/components/site/SchoolmatesFormCrown";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { FAQ, PRICING } from "@/content/site";
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
              <p className="whitespace-nowrap font-display text-[9.5px] font-bold uppercase tracking-[0.07em] text-coral-dark min-[390px]:text-[11px] min-[390px]:tracking-[0.08em] sm:text-sm sm:tracking-[0.16em]">
                Denné stráženie stredných a veľkých psíkov
              </p>
              <h1 className="mt-2 text-[38px] leading-[1.07] tracking-[-0.03em] text-forest sm:text-5xl sm:leading-[1.06] lg:text-[58px] lg:leading-[1.05]">
                Miesto, kam sa psíkovia
                <span className="block text-coral-dark">radi vracajú</span>
              </h1>

              <p className="mx-auto mt-2.5 max-w-xl text-base font-semibold leading-relaxed text-forest/85 sm:mt-5 sm:text-lg lg:mx-0">
                Kým vy pracujete, váš psík môže tráviť deň s kamošmi namiesto čakania doma. V Chvostíkove v Košiciach si užije pohyb, hry, oddych aj pozornosť pod celodenným dohľadom.
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
                className="btn-coral mt-4 inline-flex min-w-[270px] items-center justify-center gap-2 px-7 py-3 text-[15px] sm:mt-6 sm:min-w-[330px] sm:px-9 sm:py-4 sm:text-lg"
              >
                Zistiť viac
                <ArrowDown className="size-5" />
              </button>

              <div className="mt-3 flex flex-wrap justify-center gap-2 text-[12px] font-semibold sm:mt-5 sm:text-sm lg:justify-start">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-coral px-3 py-1.5 text-white shadow-card"><MapPin className="size-4 shrink-0 text-white" /> Poľská 6, Košice</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-coral px-3 py-1.5 text-white shadow-card"><Clock3 className="size-4 shrink-0 text-white" /> Po–Pia 7:00–17:00</span>
              </div>
            </div>

            <div id="lead-form" className="mx-auto hidden w-full max-w-md scroll-mt-24 lg:mx-0 lg:block">
              <SchoolmatesFormCrown compact />
              <div className="rounded-4xl border border-white/50 bg-white/20 px-5 pt-9 pb-5 shadow-soft ring-1 ring-forest/8 backdrop-blur-[1px] lg:px-7 lg:pb-7">
                <p className="text-center font-display text-2xl font-bold text-forest">
                  Doprajte svojmu psíkovi deň plný hier a kamarátov
                </p>
                <p className="mx-auto mt-2 mb-4 max-w-sm text-center text-sm leading-relaxed text-forest/65">
                  Nechajte nám kontakt. Ozveme sa vám, porozprávame sa o vašom psíkovi a odpovieme na vaše otázky. Ak budete mať záujem, dohodneme bezplatnú úvodnú návštevu.
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
                Doprajte svojmu psíkovi deň plný hier a kamarátov
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-forest/65">
                Nechajte nám kontakt. Ozveme sa vám, porozprávame sa o vašom psíkovi a odpovieme na vaše otázky. Ak budete mať záujem, dohodneme bezplatnú úvodnú návštevu.
              </p>
            </div>
            <ShortForm trackingSource="lead_landing_mobile_below_hero" />
          </div>
        </section>

        <section className="relative overflow-hidden bg-card py-10 sm:py-14">
          <SectionAmbientPaws />
          <div id="lead-benefits" className="relative z-10 mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Prečo Chvostíkovo
            </p>
            <h2 className="section-title mx-auto mt-2 max-w-3xl text-3xl sm:text-4xl">
              Pekný deň pre psíka. Pokojnejšia hlava pre vás.
            </h2>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
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

        <Reviews />

        <FriendshipFeature />

        <DaycarePhotoCarousel />
        <VideoSection />

        <section className="relative overflow-hidden bg-forest py-10 text-cream sm:py-14">
          <SectionAmbientPaws tone="dark" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-soft">
              Ako to funguje
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Prvá návšteva v 3 krokoch</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">
              Najprv sa spoznáme a spolu zistíme, či sa váš psík bude u nás cítiť dobre.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["1", "Porozprávame sa o vašom psíkovi", "Zavolajte nám alebo nechajte kontakt vo formulári. Preberieme jeho povahu, potreby aj vaše otázky a dohodneme termín úvodnej návštevy."],
                ["2", "Prídete nás spoznať", "Ukážeme vám priestory a zoznámime sa s vaším psíkom. Pozrieme sa, ako reaguje na nové prostredie a ostatných psov, a spolu sa dohodneme na ďalšom postupe.", "Úvodná návšteva je zadarmo."],
                ["3", "Doprajete mu prvý deň v škôlke", "Ak mu kolektív vyhovuje, dohodneme jeho prvý pobyt. Počas dňa sa oňho postaráme a pošleme vám fotky či videá, aby ste videli, ako sa u nás má."],
              ].map(([number, stepTitle, text, note]) => (
                <article key={number} className="rounded-3xl bg-cream/10 p-5 text-left ring-1 ring-cream/15">
                  <span className="flex size-10 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-white">
                    {number}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-cream">{stepTitle}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream/75">{text}</p>
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
                  {item.highlight && <p className="mt-3 text-sm leading-relaxed text-cream/85">{item.note}</p>}
                </article>
              ))}
            </div>
            <p className="mt-5 font-display font-bold text-forest">Úvodná návšteva je zadarmo.</p>
            <p className="mx-auto mt-4 flex max-w-2xl items-start justify-center gap-2 text-sm leading-relaxed text-forest/75">
              <Car className="mt-0.5 size-5 shrink-0 text-coral-dark" />
              <span>Pomôžeme vám aj s vyzdvihnutím a odvozom psíka v Košiciach — 5 € za jednu jazdu.</span>
            </p>
            <button type="button" onClick={() => openLeadModal("lead_landing_pricing")} className="btn-coral mt-6 inline-flex">
              Chcem sa informovať
            </button>
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
                  Nechajte nám kontakt. Ozveme sa vám, porozprávame sa o vašom psíkovi a odpovieme na vaše otázky. Ak budete mať záujem, dohodneme bezplatnú úvodnú návštevu.
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
        title="Doprajte svojmu psíkovi deň plný hier a kamarátov"
        subtitle="Nechajte nám kontakt. Ozveme sa vám, porozprávame sa o vašom psíkovi a odpovieme na vaše otázky. Ak budete mať záujem, dohodneme bezplatnú úvodnú návštevu."
      >
        <ShortForm trackingSource={leadModalSource} />
      </FormDialog>
    </div>
  );
}
