import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  CheckCircle2,
  Heart,
  MapPin,
  Moon,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import heroDogs from "@/assets/puppy-hero.webp";
import { Footer } from "@/components/site/Contact";
import { Header } from "@/components/site/Header";
import { ShortForm } from "@/components/site/Forms";
import { FormDialog } from "@/components/site/FormDialog";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = BASE_URL + "/psia-skolka-pre-steniatka";
const OG_IMAGE = BASE_URL + "/og-image.png";
const title = "Psia škôlka pre šteniatka v Košiciach | Chvostíkovo";
const description =
  "Psia škôlka pre šteniatka v Košiciach. Postupná socializácia, kontakt so psami a ľuďmi, pohyb aj oddych. Zistite, či je Chvostíkovo vhodné pre vaše šteniatko.";

const FAQ = [
  {
    q: "Od akého veku môže šteniatko navštevovať psiu škôlku?",
    a: "Nejde iba o konkrétny vek. Šteniatko musí mať splnené požadované očkovania a pred prvým pobytom absolvuje bezplatnú úvodnú návštevu, na ktorej sa pozrieme, ako sa cíti v novom prostredí a medzi psami.",
  },
  {
    q: "Aké očkovania musí mať šteniatko?",
    a: "Podmienkou sú platné očkovania proti besnote, infekčným ochoreniam DHPPi+L a kotercovému kašľu. Ak si nie ste istí, pokojne nám napíšte a prejdeme to spolu.",
  },
  {
    q: "Musí byť moje šteniatko zvyknuté na iných psov?",
    a: "Nemusí. Práve úvodná návšteva nám pomôže zistiť, ako reaguje na ostatných psov, ľudí a nové prostredie. Ďalší postup prispôsobíme konkrétnemu šteniatku.",
  },
  {
    q: "Hrajú sa šteniatka celý deň?",
    a: "Nie. Pohyb a hra sú iba časť dňa. Rovnako dôležité je, aby sa šteniatko vedelo pri ostatných psoch upokojiť a oddýchnuť si.",
  },
  {
    q: "Ako často odporúčate škôlku pre šteniatko?",
    a: "Ak šteniatku kolektív vyhovuje, často dáva zmysel pravidelnosť približne 1–2× týždenne. Nie je to však univerzálne pravidlo – frekvenciu prispôsobujeme povahe, veku a tomu, ako psík pobyt zvláda.",
  },
];

const BENEFITS = [
  {
    icon: Users,
    title: "Kontakt so psami",
    text: "Šteniatko sa učí čítať ostatných psov a fungovať v kolektíve bez toho, aby sa muselo s každým hrať.",
  },
  {
    icon: Heart,
    title: "Ľudia a nové podnety",
    text: "Postupne si zvyká na nových ľudí, prostredie, zvuky a bežné situácie mimo domova.",
  },
  {
    icon: PawPrint,
    title: "Pohyb a hra",
    text: "Má priestor vyblázniť sa, hrať sa a prirodzene využiť energiu v priebehu aktívneho dňa.",
  },
  {
    icon: Moon,
    title: "Pokoj a oddych",
    text: "Učí sa, že prítomnosť ďalších psov neznamená neustálu akciu a že je úplne v poriadku aj oddychovať.",
  },
  {
    icon: ShieldCheck,
    title: "Postupná adaptácia",
    text: "Prvé návštevy nastavujeme podľa toho, ako sa konkrétne šteniatko cíti a čo je preň zvládnuteľné.",
  },
];

export const Route = createFileRoute("/psia-skolka-pre-steniatka")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Chvostíkovo - psia škôlka pre šteniatka v Košiciach" },
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
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: PuppyDaycarePage,
});

function scrollToBenefits() {
  trackMarketingInteraction("explore_daycare", "puppy_landing_hero");
  void trackCookielessInteraction("explore_daycare", "puppy_landing_hero");

  const target = document.getElementById("puppy-benefits");
  if (!target) return;

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function PuppyForm({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ShortForm
        trackingSource={source}
        hideInterest
        interestValue="Mám záujem o škôlku pre šteniatko"
      />
    </div>
  );
}

function PuppyDaycarePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [formSource, setFormSource] = useState("puppy_landing_modal");

  function openForm(source: string) {
    trackMarketingInteraction("inquiry_cta", source);
    void trackCookielessInteraction("inquiry_cta", source);
    setFormSource(source);
    setFormOpen(true);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Header homeSectionLinks />

      <main>
        <section className="relative overflow-hidden pt-20 sm:pt-24">
          <div className="absolute inset-0">
            <img
              src={heroDogs}
              alt="Psíky v psej škôlke Chvostíkovo"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="size-full scale-[1.14] object-cover object-[54%_50%] sm:scale-[1.08] lg:scale-100 lg:object-[52%_38%]"
            />
            <div className="absolute inset-0 bg-cream/35" />
            <div className="absolute inset-0 bg-linear-to-r from-cream/98 via-cream/82 via-50% to-cream/28" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-cream to-transparent" />
          </div>

          <div className="relative mx-auto grid min-h-[470px] max-w-6xl items-center gap-5 px-4 py-0 sm:min-h-[540px] sm:py-0 lg:min-h-[600px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:py-14">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-coral-dark sm:text-sm">
                Psia škôlka pre šteniatka v Košiciach
              </p>
              <h1 className="mt-2 text-[37px] leading-[1.06] tracking-[-0.03em] text-forest sm:text-5xl lg:text-[58px]">
                Vaše šteniatko si môže
                <span className="block text-coral-dark">škôlku zamilovať</span>
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-relaxed text-forest/85 sm:mt-5 sm:text-lg lg:mx-0">
                Bezpečne spoznáva psov, ľudí a nové prostredie, vyblázni sa a zároveň sa učí aj oddychovať.
              </p>

              <div className="mx-auto mt-3 flex w-full max-w-[410px] flex-nowrap justify-center gap-1 sm:mt-5 lg:mx-0 lg:max-w-none lg:justify-start lg:gap-2">
                {["Postupná socializácia", "Hra aj oddych", "Úvodná návšteva zadarmo"].map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-1 text-[8px] font-bold tracking-[-0.01em] text-forest shadow-card min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[9px] lg:px-3 lg:py-1.5 lg:text-xs"
                  >
                    <CheckCircle2 className="size-3 shrink-0 text-coral min-[390px]:size-3.5 lg:size-4" />
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={scrollToBenefits}
                className="btn-coral mt-4 inline-flex min-w-[270px] items-center justify-center gap-2 px-7 py-3 text-[15px] sm:mt-6 sm:min-w-[330px] sm:px-9 sm:py-4 sm:text-lg"
              >
                Zistiť viac
                <ArrowDown className="size-5" />
              </button>

              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm font-semibold text-forest/80 sm:mt-5 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-coral" />
                  Poľská 6, Košice
                </span>
              </div>
            </div>

            <div className="mx-auto hidden w-full max-w-md rounded-4xl border border-white/60 bg-white/95 p-5 shadow-soft backdrop-blur lg:mx-0 lg:block lg:p-7">
              <p className="text-center font-display text-2xl font-bold text-forest">
                Je Chvostíkovo vhodné pre vaše šteniatko?
              </p>
              <p className="mx-auto mt-2 mb-5 max-w-sm text-center text-sm leading-relaxed text-forest/65">
                Nechajte nám meno a telefón. Ozveme sa vám a prejdeme spolu vek, očkovania aj prvú návštevu.
              </p>
              <PuppyForm source="puppy_landing_top" />
            </div>
          </div>
        </section>

        <section className="bg-card px-4 pt-2 pb-6 lg:hidden">
          <div className="mx-auto max-w-md rounded-3xl bg-secondary/55 p-4 shadow-card ring-1 ring-forest/8">
            <div className="mb-4 text-center">
              <p className="font-display text-xl font-bold text-forest">Chcete sa informovať o škôlke pre šteniatko?</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-forest/65">
                Stačí meno a telefón. Ozveme sa a povieme vám, či už môže prísť na úvodnú návštevu.
              </p>
            </div>
            <PuppyForm source="puppy_landing_mobile_below_hero" />
          </div>
        </section>

        <section id="puppy-benefits" className="scroll-mt-20 bg-card py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
              Prečo šteniatku prospieva
            </p>
            <h2 className="section-title mx-auto mt-2 max-w-3xl text-3xl sm:text-4xl">
              5 dôvodov, prečo si môže škôlku zamilovať
            </h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {BENEFITS.map(({ icon: Icon, title: benefitTitle, text }) => (
                <article
                  key={benefitTitle}
                  className="flex h-full flex-col rounded-3xl bg-secondary/55 p-4 text-left ring-1 ring-forest/8 sm:p-5"
                >
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
              onClick={() => openForm("puppy_landing_benefits")}
              className="btn-coral mt-7 inline-flex min-w-[270px] justify-center px-7 py-3.5 text-[15px] sm:min-w-[330px] sm:text-lg"
            >
              Chcem sa informovať o škôlke
            </button>
          </div>
        </section>

        <section className="bg-secondary/35 py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
                Čo sa učí
              </p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">
                Psia škôlka je viac než len hranie
              </h2>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
                <Sparkles className="size-6 text-coral" />
                <h3 className="mt-3 font-display text-lg font-bold text-forest">Socializácia bez nátlaku</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest/75">
                  Učí sa fungovať medzi inými psami a ľuďmi. Cieľom nie je hrať sa s každým, ale zvládať ich prítomnosť pokojnejšie a prirodzene.
                </p>
              </article>

              <article className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
                <Moon className="size-6 text-coral" />
                <h3 className="mt-3 font-display text-lg font-bold text-forest">Aktivita aj vypnutie</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest/75">
                  Po hre prichádza oddych. Šteniatko si postupne zvyká, že aj v kolektíve môže ležať, pozorovať a nemusí byť stále v pohybe.
                </p>
              </article>

              <article className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
                <Heart className="size-6 text-coral" />
                <h3 className="mt-3 font-display text-lg font-bold text-forest">Čas bez svojho človeka</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest/75">
                  Získava skúsenosť, že môže príjemne stráviť čas aj mimo domova. Škôlka však nenahrádza tréning samostatnosti ani prácu doma.
                </p>
              </article>
            </div>

            <div className="mx-auto mt-7 max-w-3xl rounded-3xl bg-forest p-5 text-center text-cream sm:p-7">
              <p className="font-display text-lg font-bold">Škôlka je iba jedna časť života šteniatka.</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/80 sm:text-base">
                Najlepšie výsledky prináša spolu s bežným životom, prechádzkami, tréningom, odpočinkom a skúsenosťami s vami. Ak šteniatku kolektív vyhovuje, často odporúčame približne 1–2 návštevy týždenne.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card py-10 sm:py-14">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-coral-dark">
                Kedy môže začať?
              </p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Keď má splnené očkovania a je pripravené na prvú návštevu</h2>
              <p className="mt-4 leading-relaxed text-forest/75">
                Pred pobytom v kolektíve musí mať šteniatko platné požadované očkovania: besnota, infekčné ochorenia DHPPi+L a kotercový kašeľ.
              </p>
              <p className="mt-3 leading-relaxed text-forest/75">
                Potom sa najprv stretneme na bezplatnej úvodnej návšteve. Pozrieme sa, ako reaguje na prostredie, nás aj ostatných psov a podľa toho nastavíme ďalší postup.
              </p>
              <button
                type="button"
                onClick={() => openForm("puppy_landing_eligibility")}
                className="btn-coral mt-6 inline-flex"
              >
                Zistiť, či už môže prísť
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["1", "Platné očkovania", "Skontrolujeme požadované vakcíny pred prvým pobytom."],
                ["2", "Úvodná návšteva", "Bezplatne sa zoznámime so šteniatkom a prostredím."],
                ["3", "Postupná adaptácia", "Ak potrebuje viac času, prvé návštevy nastavíme citlivejšie."],
                ["4", "Pravidelnosť", "Ak mu kolektív vyhovuje, často funguje približne 1–2× týždenne."],
              ].map(([number, heading, text]) => (
                <article key={number} className="rounded-3xl bg-secondary/55 p-5 ring-1 ring-forest/8">
                  <span className="flex size-9 items-center justify-center rounded-full bg-coral font-display font-bold text-white">
                    {number}
                  </span>
                  <h3 className="mt-3 font-display font-bold text-forest">{heading}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-forest/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/40 py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <h2 className="section-title text-3xl sm:text-4xl">Najčastejšie otázky o šteniatkach</h2>
              <p className="mt-2 text-sm text-forest/65 sm:text-base">
                To najdôležitejšie pred prvou návštevou.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-3xl bg-card px-5 py-4 shadow-card sm:px-6">
                  <summary className="cursor-pointer list-none font-display text-base font-bold text-forest marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-xl text-coral transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-forest/75">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-10 sm:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-4xl bg-secondary/55 p-5 shadow-soft sm:p-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="section-title text-3xl sm:text-4xl">
                  Je už vaše šteniatko pripravené na škôlku?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-forest/70 sm:text-base">
                  Nechajte nám kontakt. Ozveme sa vám a prejdeme spolu vek, očkovania a prvú návštevu.
                </p>
              </div>

              <PuppyForm
                source="puppy_landing_bottom"
                className="mx-auto mt-6 max-w-md rounded-3xl bg-card p-5 shadow-card sm:p-6"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Je Chvostíkovo vhodné pre vaše šteniatko?"
        subtitle="Nechajte nám meno a telefón. Ozveme sa vám a prejdeme spolu ďalší postup."
      >
        <PuppyForm source={formSource} />
      </FormDialog>
    </div>
  );
}
