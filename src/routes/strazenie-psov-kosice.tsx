import { createFileRoute } from "@tanstack/react-router";
import { Check, HeartHandshake, Moon, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { ShortForm } from "@/components/site/Forms";
import { Collapse } from "@/components/site/Collapse";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/strazenie-psov-kosice`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Stráženie psov Košice | Psia škôlka Chvostíkovo";
const description =
  "Denné stráženie psov v Košiciach v psej škôlke Chvostíkovo. Celodenný dohľad, bezpečné prostredie, rodinná atmosféra, pohyb aj oddych.";

const FAQ = [
  {
    q: "Je Chvostíkovo psia škôlka alebo stráženie psov?",
    a: "Oboje pomenúva tú istú dennú službu. Psíka ráno privediete do Chvostíkova, počas dňa má pohyb, spoločnosť, oddych a celodenný dohľad a popoludní si ho vyzdvihnete. Nejde o pobytové stráženie cez noc.",
  },
  {
    q: "Je môj psík počas dňa stále pod dohľadom?",
    a: "Áno. Počas celého dňa sú so psíkmi minimálne dvaja skúsení opatrovatelia. Sledujeme hru, vzájomné interakcie, únavu aj to, kedy niektorý psík potrebuje pokoj alebo prestávku.",
  },
  {
    q: "Hrajú sa psy v škôlke celý deň?",
    a: "Nie. Pohyb a hra sú dôležitou súčasťou dňa, ale rovnako dôležitý je oddych. Aktivitu regulujeme a psy nenechávame hrať sa bez prestávky až do vyčerpania.",
  },
  {
    q: "Môžem využiť stráženie iba občas?",
    a: "Áno. Chvostíkovo môžete využívať pravidelne aj podľa potreby. Keďže máme obmedzenú kapacitu, miesto je potrebné rezervovať vopred.",
  },
  {
    q: "Ako prebieha prvá návšteva?",
    a: "Každý nový psík najskôr absolvuje bezplatnú vstupnú návštevu. Zoznámime sa s ním, sledujeme jeho reakcie na nové prostredie, ľudí a ostatných psov a podľa toho nastavíme ďalší postup.",
  },
  {
    q: "Aké sú otváracie hodiny?",
    a: "Chvostíkovo je otvorené od pondelka do piatka od 7:00 do 17:00.",
  },
  {
    q: "Ponúkate aj stráženie psov cez noc?",
    a: "Nie. Chvostíkovo funguje ako denná psia škôlka a denné stráženie psov. Psík sa po skončení dňa vracia domov so svojím majiteľom.",
  },
];

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
      { property: "og:image:alt", content: "Chvostíkovo - psia škôlka a stráženie psov v Košiciach" },
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
          "@graph": [
            {
              "@type": "Service",
              name: "Psia škôlka a denné stráženie psov v Košiciach",
              serviceType: "Denné stráženie psov a psia škôlka",
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
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: DogDaycarePage,
});

function CtaLink({ className = "" }: { className?: string }) {
  return (
    <a href="#informacie" className={`btn-coral ${className}`}>
      Chcem sa informovať o škôlke
    </a>
  );
}

function DogDaycarePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="top" className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/45 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Psia škôlka & denné stráženie</p>
              <h1 className="mt-3 text-4xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
                Psia škôlka a <span className="text-coral-dark">stráženie psov</span> v Košiciach
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-forest/85">
                Hľadáte spoľahlivé stráženie psa v Košiciach počas práce, povinností alebo dňa, keď nechcete nechať psíka samého doma?
              </p>
              <p className="mt-4 max-w-2xl leading-relaxed text-forest/80">
                Chvostíkovo spája denné stráženie psov s režimom psej škôlky. Psík má počas dňa pohyb, spoločnosť, pokojnejšie chvíle aj oddych – a po celý čas je pod dohľadom ľudí, ktorí poznajú jeho potreby.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <CtaLink />
                <span className="rounded-full bg-card px-4 py-2 font-display text-sm font-semibold text-forest shadow-card">
                  Pondelok – piatok · 7:00 – 17:00
                </span>
              </div>
            </div>

            <div id="informacie" className="scroll-mt-28 rounded-4xl bg-card p-6 shadow-soft sm:p-8">
              <h2 className="text-center text-2xl text-forest">Chcete vedieť, či je škôlka vhodná pre vášho psíka?</h2>
              <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií.
              </p>
              <ShortForm />
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Viac než iba postrážiť</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Keď nemá byť deň len o čakaní doma</h2>
              <p className="mt-4 leading-relaxed text-forest/80">
                Pre nás stráženie psa neznamená iba to, že naňho niekto občas pozrie. Chceme, aby mal počas dňa zmysluplný režim, kontakt s ľuďmi, možnosť pohybu, spoločnosť ďalších psov aj priestor vypnúť a oddýchnuť si.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [ShieldCheck, "Celodenný dohľad", "Počas celého dňa sú so psíkmi minimálne dvaja skúsení opatrovatelia."],
                [Users, "Bezpečné interakcie", "Sledujeme hru a komunikáciu medzi psami a zasahujeme skôr, než vznikne zbytočný konflikt."],
                [HeartHandshake, "Rodinné prostredie", "Psík nie je anonymnou položkou v poradovníku. Poznáme našich škôlkarov a ich povahy."],
                [Moon, "Pohyb aj oddych", "Dobrý deň nie je o nepretržitom behaní. Aktivitu striedame s pokojom a odpočinkom."],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof ShieldCheck;
                return (
                  <article key={String(heading)} className="rounded-4xl bg-card p-6 shadow-card">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-forest">
                      <CardIcon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-lg text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/75">{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-forest p-7 text-cream shadow-soft sm:p-10">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-cream/10">
                <ShieldCheck className="size-6 text-coral-soft" />
              </div>
              <h2 className="mt-5 text-3xl text-cream sm:text-4xl">Bezpečie nie je detail. Je to základ celého dňa.</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-cream/85">
                <p>
                  Bezpečnosť začína ešte pred prvým dňom v škôlke. Každý nový psík absolvuje vstupnú návštevu, počas ktorej sledujeme jeho reakcie na nové prostredie, ľudí a ostatných psov. Potrebujeme vedieť, či sa v kolektíve cíti dobre a či je preňho takýto typ dennej starostlivosti vhodný.
                </p>
                <p>
                  Počas pobytu sledujeme vzájomné interakcie, únavu, náladu aj potrebu oddychu. Psy nenechávame hrať sa bez prestávky až do vyčerpania. Ak niekto potrebuje pauzu, doprajeme mu ju. Ak sa situácia začína zbytočne vyhrocovať, zasiahne človek – nie až druhý pes.
                </p>
                <p className="font-semibold text-cream">
                  Súčasťou prijatia sú aj podmienky očkovania, ochrany proti parazitom a dobrý zdravotný stav psíka.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary/55 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Deň v Chvostíkove</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Pohyb, spoločnosť aj pokojnejšie chvíle</h2>
              <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-forest/80">
                Psia škôlka nie je miesto, kde otvoríme dvere a necháme psy od rána do večera naháňať sa. Režim prispôsobujeme skupine aj konkrétnym psíkom.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Sparkles className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Pohyb a hra</h3>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Psíkovia majú priestor na pohyb, hry a spoločné aktivity. Intenzitu vždy prispôsobujeme tomu, kto je práve v skupine a ako sa cíti.
                </p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Users className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Psia spoločnosť</h3>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Kontakt s ostatnými psami je prirodzenou súčasťou dňa. Nemusí však znamenať neustálu hru – dôležité je vedieť fungovať spolu aj pokojne.
                </p>
              </article>
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <Moon className="size-6 text-coral" />
                <h3 className="mt-4 text-2xl text-forest">Oddych a upokojenie</h3>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Oddych je rovnako dôležitý ako aktivita. Psíkom dávame priestor spomaliť, upokojiť sa a načerpať energiu na ďalšiu časť dňa.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Rodinné prostredie</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Chceme poznať psíka, nie iba jeho meno v rezervácii</h2>
              <p className="mt-4 leading-relaxed text-forest/80">
                Chvostíkovo sme postavili na prostredí, v ktorom sa psík môže cítiť prirodzene a bezpečne. Každý má inú povahu, iné tempo a iné potreby. Niekto je prvý pri hre, ďalší potrebuje najskôr všetko pozorovať a až potom sa zapojiť.
              </p>
              <p className="mt-3 leading-relaxed text-forest/80">
                Preto ku každému pristupujeme individuálne a s rešpektom. Ak vieme, čo má rád, čo mu prekáža alebo kedy potrebuje pokoj, vieme mu deň nastaviť oveľa lepšie.
              </p>
            </div>
            <div className="rounded-4xl bg-card p-7 shadow-soft sm:p-9">
              <h3 className="text-2xl text-forest">Kedy sa denné stráženie hodí?</h3>
              <ul className="mt-5 space-y-4 text-forest/80">
                {[
                  "Keď ste v práci alebo vás čaká dlhší deň mimo domu.",
                  "Keď nechcete, aby psík trávil celý deň sám doma a chcete mu dopriať deň s psími kamarátmi.",
                  "Keď sa doma nudí, kňučí, vyje alebo ničí veci a počas dňa mu chýba pohyb či podnety.",
                  "Keď ťažko znáša samotu alebo má separačnú úzkosť – škôlka mu môže zabezpečiť dohľad počas dňa, nenahrádza však individuálnu prácu s odborníkom.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-coral" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-3xl bg-secondary p-5 text-sm leading-relaxed text-forest/85">
                Chvostíkovo je zamerané najmä na stredné a veľké plemená. Vhodnosť pobytu vždy posudzujeme individuálne počas vstupnej návštevy.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-forest/75">
                Máte doma šteniatko?
                <a
                  href="/psia-skolka-pre-steniatka"
                  className="mt-1 block font-display font-semibold text-coral underline-offset-4 hover:underline"
                >
                  Pozrite si, ako nastavujeme prvé návštevy a škôlku pre šteniatka →
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Ako začať?</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Stačia tri jednoduché kroky</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["1", "Napíšete nám", "Vyplníte krátky nezáväzný formulár a dáte nám vedieť, čo od stráženia alebo škôlky potrebujete."],
                ["2", "Stretneme sa", "Na bezplatnej vstupnej návšteve sa zoznámime so psíkom a pozrieme sa, ako reaguje na prostredie a kolektív."],
                ["3", "Dohodneme ďalší postup", "Ak je škôlka pre psíka vhodná, dohodneme prvý deň a ďalšie návštevy podľa vašich potrieb."],
              ].map(([number, heading, text]) => (
                <article key={number} className="rounded-4xl bg-background p-7 shadow-card">
                  <span className="flex size-10 items-center justify-center rounded-full bg-coral font-display font-bold text-white">{number}</span>
                  <h3 className="mt-4 text-xl text-forest">{heading}</h3>
                  <p className="mt-2 leading-relaxed text-forest/80">{text}</p>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center font-display font-semibold text-forest">
              Nechceme každého psíka natlačiť do rovnakého scenára. Ďalší postup prispôsobujeme tomu, čo vyhovuje práve jemu.
            </p>
            <div className="mt-7 flex justify-center">
              <CtaLink />
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Máte otázku?</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Časté otázky o strážení psov v Košiciach</h2>
            </div>
            <div className="mt-9 space-y-3">
              {FAQ.map((item) => (
                <Collapse key={item.q} title={item.q}>
                  <p>{item.a}</p>
                </Collapse>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-4xl bg-secondary p-7 text-center shadow-card sm:p-10">
              <h2 className="text-3xl text-forest">Hľadáte stráženie psa v Košiciach?</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/80">
                Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme, či je Chvostíkovo vhodné práve pre vášho psíka.
              </p>
              <CtaLink className="mt-6" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
