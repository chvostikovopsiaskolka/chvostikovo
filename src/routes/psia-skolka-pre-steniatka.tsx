import { createFileRoute } from "@tanstack/react-router";
import { Check, Heart, Moon, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { ShortForm } from "@/components/site/Forms";
import { Collapse } from "@/components/site/Collapse";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/psia-skolka-pre-steniatka`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Psia škôlka pre šteniatka v Košiciach | Chvostíkovo";
const description =
  "Psia škôlka pre šteniatka v Košiciach. Postupná adaptácia, socializácia, oddych a individuálny prístup v psej škôlke Chvostíkovo.";

const FAQ = [
  {
    q: "Od akého veku môže šteniatko navštevovať psiu škôlku?",
    a: "Nie je to iba o jednom konkrétnom veku. Dôležité je, aby šteniatko spĺňalo požadované podmienky očkovania a prevencie. Pred prvým pobytom zároveň absolvuje vstupnú návštevu.",
  },
  {
    q: "Musí byť moje šteniatko zvyknuté na iných psov?",
    a: "Nemusí. Práve vstupná návšteva nám pomôže zistiť, ako reaguje na ostatných psov a nové prostredie. Podľa toho nastavíme jeho ďalšie návštevy.",
  },
  {
    q: "Čo ak sa moje šteniatko zo začiatku bojí?",
    a: "Je úplne normálne, že niektoré šteniatka potrebujú viac času. Môžeme odporučiť kratšie návštevy alebo niekoľkohodinový pobyt pred tým, než u nás zostane celý deň.",
  },
  {
    q: "Hrajú sa šteniatka celý deň?",
    a: "Nie. Hra a pohyb sú iba časťou dňa. Rovnako dôležité sú pokojnejšie chvíle a oddych.",
  },
  {
    q: "Pomôže škôlka so separačnou úzkosťou?",
    a: "Psia škôlka nenahrádza tréning ani behaviorálnu terapiu a separačnú úzkosť neliečime. Pre niektoré šteniatka však môže byť postupný pobyt bez majiteľa jednou z užitočných skúseností pri učení sa samostatnosti.",
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

function CtaLink({ className = "" }: { className?: string }) {
  return (
    <a href="#informacie" className={`btn-coral ${className}`}>
      Chcem sa informovať o škôlke
    </a>
  );
}

function PuppyDaycarePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="top" className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/45 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Pre našich najmladších škôlkarov</p>
              <h1 className="mt-3 text-4xl leading-[1.05] text-forest sm:text-5xl lg:text-6xl">
                Psia škôlka pre <span className="text-coral-dark">šteniatka</span> v Košiciach
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-forest/85">
                Prvé mesiace sú plné nových zážitkov. Šteniatko spoznáva ľudí, iných psov, nové prostredie, zvuky aj situácie a postupne zisťuje, ako celý ten veľký svet funguje.
              </p>
              <p className="mt-4 max-w-2xl leading-relaxed text-forest/80">
                Aj preto môže byť psia škôlka pre mladého psíka skvelou skúsenosťou – ak na všetko ide postupne a vlastným tempom. V Chvostíkove prijímame aj šteniatka, ktoré spĺňajú podmienky prijatia, a prvé návštevy nastavujeme podľa toho, ako sa u nás konkrétny psík cíti.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <CtaLink />
                <span className="rounded-full bg-card px-4 py-2 font-display text-sm font-semibold text-forest shadow-card">
                  Bezplatná vstupná návšteva
                </span>
              </div>
            </div>

            <div id="informacie" className="scroll-mt-28 rounded-4xl bg-card p-6 shadow-soft sm:p-8">
              <p className="text-center font-display text-sm font-semibold tracking-wide text-coral uppercase">Nezáväzne</p>
              <h2 className="mt-2 text-center text-2xl text-forest">Je už vaše šteniatko pripravené?</h2>
              <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
                Napíšte nám pár základných informácií. Ozveme sa vám a radi odpovieme na vaše otázky.
              </p>
              <ShortForm />
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Kedy začať?</p>
                <h2 className="section-title mt-2 text-3xl sm:text-4xl">Nie je to iba o veku</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Pred nástupom medzi ostatných psíkov musí mať šteniatko splnené požadované očkovania a prevenciu.
                </p>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Podmienkou prijatia do Chvostíkova je platný očkovací preukaz s požadovanými vakcínami proti besnote, infekčným ochoreniam a kotercovému kašľu. Psík musí byť zároveň pravidelne odčervovaný a chránený proti vonkajším parazitom.
                </p>
                <p className="mt-3 font-semibold text-forest">
                  Ak si nie ste istí, či už môže váš drobec prísť, pokojne nám napíšte. Pozrieme sa na to spolu.
                </p>
                <CtaLink className="mt-6" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [ShieldCheck, "Očkovanie a prevencia", "Pred prvou návštevou skontrolujeme, či šteniatko spĺňa podmienky prijatia."],
                  [Heart, "Individuálne tempo", "Niektorý drobec je hneď doma, iný potrebuje viac času. Obe možnosti sú v poriadku."],
                  [Users, "Postupné zoznámenie", "Sledujeme reakcie na prostredie, ľudí aj ostatných psov a podľa toho volíme ďalší postup."],
                  [Moon, "Čas na oddych", "Dobrý deň v škôlke nie je o ôsmich hodinách nepretržitého behania."],
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
          </div>
        </section>

        <section className="bg-card py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Prvá návšteva</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Najprv sa jednoducho spoznáme</h2>
              <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-forest/80">
                Prvá návšteva neznamená, že nám šteniatko ráno odovzdáte a hneď u nás zostane celý deň. Každý nový psík najskôr absolvuje bezplatnú vstupnú návštevu.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["1", "Zoznámime sa", "Pozrieme sa, ako šteniatko reaguje na nové prostredie, ľudí a ostatných psov."],
                ["2", "Dáme mu čas", "Niektoré šteniatka sú o chvíľu všade doma. Iné si najskôr všetko radšej obzrú. Obe možnosti sú v poriadku."],
                ["3", "Dohodneme ďalší krok", "Ak potrebuje viac času, môžeme odporučiť kratšie návštevy s majiteľom alebo pár hodín bez neho."],
              ].map(([number, heading, text]) => (
                <article key={number} className="relative rounded-4xl bg-background p-7 pt-9 shadow-card">
                  <span className="absolute -top-5 left-7 flex size-11 items-center justify-center rounded-full bg-coral font-display text-lg font-bold text-white shadow-card">
                    {number}
                  </span>
                  <h3 className="text-xl text-forest">{heading}</h3>
                  <p className="mt-2 leading-relaxed text-forest/80">{text}</p>
                </article>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-3xl text-center font-display font-semibold text-forest">
              Nechceme každého psíka natlačiť do rovnakého scenára. Ďalší postup prispôsobujeme tomu, čo vyhovuje práve jemu.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-forest p-7 text-cream shadow-soft sm:p-10">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-cream/10">
                <Sparkles className="size-6 text-coral-soft" />
              </div>
              <h2 className="mt-5 text-3xl text-cream sm:text-4xl">Psia škôlka nie je iba o hraní sa s inými psami</h2>
              <div className="mt-5 grid gap-5 text-cream/85 md:grid-cols-2">
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Keď sa povie socializácia šteniatka, veľa ľudí si predstaví hlavne hru s ďalšími psami. Tá je fajn. Ale správna socializácia je oveľa viac.
                  </p>
                  <p>
                    Šteniatko sa postupne učí fungovať medzi inými psami, ľuďmi a rôznymi podnetmi. Nemusí sa s každým psom hrať a nemusí reagovať na všetko, čo sa okolo neho deje.
                  </p>
                </div>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Preto ani deň v Chvostíkove nevyzerá tak, že otvoríme dvere a psy sa od rána do večera naháňajú.
                  </p>
                  <p className="font-semibold text-cream">
                    Počas dňa sa strieda pohyb, hra, spoločnosť ostatných psov, pokojnejšie chvíle aj oddych.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary/55 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <h2 className="text-2xl text-forest sm:text-3xl">Radšej dobrá skúsenosť ako desať zlých</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Pre malé šteniatko môže byť už samotná návšteva nového miesta veľkým zážitkom. Noví ľudia, cudzie prostredie, viac psov, nové zvuky a k tomu chvíľu bez svojho človeka.
                </p>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Preto nemá zmysel snažiť sa zvládnuť všetko naraz. Sledujeme, ako sa psík cíti, a dávame mu čas. Pre nás je dôležité, aby si Chvostíkovo postupne spojil s miestom, kde sa cíti dobre.
                </p>
              </article>

              <article className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <h2 className="text-2xl text-forest sm:text-3xl">Aj oddych sa treba naučiť</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Šteniatka potrebujú veľa spánku a oddychu. Preto pre nás dobrý deň v škôlke neznamená, že psík osem hodín nepretržite behá.
                </p>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Rovnako dôležité ako hra je aj to, aby sa šteniatko dokázalo upokojiť a oddýchnuť si, aj keď sú okolo neho ďalší psi. Postupne tak zisťuje, že prítomnosť iného psa nemusí vždy znamenať: „Poďme sa naháňať!“
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Krok po kroku</p>
                <h2 className="section-title mt-2 text-3xl sm:text-4xl">Postupne aj bez majiteľa</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Pre niektoré šteniatka môže byť škôlka jednou z prvých skúseností, keď zostanú dlhšie bez svojho majiteľa. Preto nemusíme začínať hneď celým dňom.
                </p>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Niekedy je lepšia kratšia návšteva, potom pár hodín bez majiteľa a až následne celý deň. Záleží od konkrétneho psíka.
                </p>
                <p className="mt-4 rounded-3xl bg-secondary p-5 text-sm leading-relaxed text-forest/85">
                  Psia škôlka nenahrádza tréning ani behaviorálnu terapiu a nelieči separačnú úzkosť. Môže však byť jedným z miest, kde šteniatko postupne získava skúsenosť, že vie stráviť určitý čas aj bez svojho človeka.
                </p>
              </div>

              <div className="rounded-4xl bg-card p-7 shadow-card sm:p-9">
                <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Bezpečie</p>
                <h2 className="mt-2 text-3xl text-forest">Stále na nich dávame pozor</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Šteniatka sú zvedavé, rýchle a občas ešte úplne netušia, kedy už má druhý pes ich hry dosť. Preto sú psíkovia počas pobytu v Chvostíkove pod celodenným dohľadom.
                </p>
                <p className="mt-3 leading-relaxed text-forest/80">
                  Sledujeme ich hru, vzájomné interakcie aj to, kedy už niekto potrebuje pauzu. Ak treba, hru prerušíme a doprajeme psíkovi pokoj.
                </p>
                <p className="mt-4 flex items-start gap-2 font-display font-semibold text-forest">
                  <Check className="mt-0.5 size-5 shrink-0 text-coral" /> Chvostíkovo je zamerané najmä na stredné a veľké plemená.
                </p>
              </div>
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
                ["1", "Napíšete nám", "Vyplníte krátky nezáväzný formulár a napíšete nám základné informácie o vašom šteniatku."],
                ["2", "Stretneme sa", "Na vstupnej návšteve sa zoznámime so psíkom a pozrieme sa, ako sa cíti v novom prostredí a medzi ostatnými psami."],
                ["3", "Dohodneme, čo ďalej", "Ak je pripravený, môže začať chodiť do škôlky. Ak potrebuje viac času, odporučíme postupnejšiu adaptáciu."],
              ].map(([number, heading, text]) => (
                <article key={number} className="rounded-4xl bg-background p-7 shadow-card">
                  <span className="flex size-10 items-center justify-center rounded-full bg-coral font-display font-bold text-white">{number}</span>
                  <h3 className="mt-4 text-xl text-forest">{heading}</h3>
                  <p className="mt-2 leading-relaxed text-forest/80">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <CtaLink />
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Máte otázku?</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Časté otázky</h2>
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
              <h2 className="text-3xl text-forest">Nie ste si istí, či je už vaše šteniatko pripravené?</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/80">
                Nemusíte sa hneď rozhodovať pre celý deň v škôlke. Napíšte nám pár základných informácií a ak bude škôlka pre vášho psíka vhodná, dohodneme si bezplatnú vstupnú návštevu v Chvostíkove v Košiciach.
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
