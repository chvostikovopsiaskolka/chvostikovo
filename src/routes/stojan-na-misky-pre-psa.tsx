import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Droplets,
  Hammer,
  Mail,
  Paintbrush,
  Phone,
  Ruler,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { Collapse } from "@/components/site/Collapse";
import { EMAIL, PHONE, PHONE_PRETTY } from "@/content/site";
import standAloy from "@/assets/products/stand-aloy-dog.webp";
import standMia from "@/assets/products/stand-mia.webp";
import standWoody from "@/assets/products/stand-woody-white.webp";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/stojan-na-misky-pre-psa`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Stojan na misky pre psa | Drevený stojan na mieru | Chvostíkovo";
const description =
  "Ručne vyrábaný drevený stojan na misky pre psa. Výška na mieru, dve nerezové misky v cene, farebné prevedenia a personalizácia menom.";

const FAQ = [
  {
    q: "Ako vybrať správnu výšku stojana?",
    a: "Pri objednávke nám stačí uviesť výšku psíka v kohútiku. Podľa nej zvolíme vhodnú výšku stojana tak, aby bol prispôsobený konkrétnemu psíkovi.",
  },
  {
    q: "Sú misky súčasťou stojana?",
    a: "Áno. Každý stojan dodávame s dvoma nerezovými miskami. Menšia verzia má menšie misky, väčšia verzia väčšie misky.",
  },
  {
    q: "Aké veľkosti vyrábate?",
    a: "Vyrábame menšiu verziu približne 40 × 20 cm a väčšiu verziu približne 60 × 30 cm. Výšku prispôsobujeme psíkovi individuálne.",
  },
  {
    q: "Môžem si vybrať farbu a meno na stojane?",
    a: "Áno. Farebné prevedenie stojana, meno psíka aj farbu písmen vieme dohodnúť individuálne podľa možností konkrétnej výroby.",
  },
  {
    q: "Ako sa stojan udržiava?",
    a: "Povrch je ošetrený pre jednoduchšiu údržbu a bežnú vlhkosť okolo misiek. Stojan stačí utrieť vlhkou handričkou a nerezové misky sa dajú jednoducho vybrať a umyť.",
  },
  {
    q: "Ako dlho trvá výroba?",
    a: "Každý stojan vyrábame ručne a často na mieru, preto termín výroby potvrdíme individuálne pri objednávke podľa aktuálnej vyťaženosti a zvoleného prevedenia.",
  },
];

const GALLERY = [
  {
    src: standAloy,
    alt: "Veľký drevený stojan na misky pre psa Aloy pri používaní",
    label: "Aloy – väčšia verzia",
  },
  {
    src: standMia,
    alt: "Menší drevený stojan na misky pre psa Mia",
    label: "Mia – menšia verzia",
  },
  {
    src: standWoody,
    alt: "Biely drevený stojan na misky s menom Woody",
    label: "Woody – biele prevedenie",
  },
];

export const Route = createFileRoute("/stojan-na-misky-pre-psa")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Drevený stojan na misky pre psa od Chvostíkova" },
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
              "@type": "Product",
              name: "Drevený stojan na misky pre psa",
              description,
              url: PAGE_URL,
              brand: { "@type": "Brand", name: "Chvostíkovo" },
              material: "Drevo",
              offers: {
                "@type": "Offer",
                url: PAGE_URL,
                priceCurrency: "EUR",
                price: "35",
                availability: "https://schema.org/InStock",
              },
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
  component: BowlStandPage,
});

function ProductGallery() {
  const [active, setActive] = useState(0);
  const current = GALLERY[active]!;

  return (
    <div>
      <div className="overflow-hidden rounded-4xl bg-secondary shadow-soft">
        <img
          src={current.src}
          alt={current.alt}
          className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]"
          fetchPriority="high"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {GALLERY.map((image, index) => (
          <button
            key={image.label}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Zobraziť: ${image.label}`}
            aria-pressed={active === index}
            className={`overflow-hidden rounded-2xl border-2 bg-card transition ${
              active === index ? "border-coral shadow-card" : "border-transparent opacity-75 hover:opacity-100"
            }`}
          >
            <img src={image.src} alt="" className="aspect-[4/3] w-full object-cover" />
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-forest/65">{current.label}</p>
    </div>
  );
}

function BowlStandPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4">
            <a href="/produkty" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral">
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>
            <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
              <ProductGallery />

              <div className="lg:pt-3">
                <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Ručná výroba Chvostíkovo</p>
                <h1 className="mt-2 text-4xl leading-[1.06] text-forest sm:text-5xl">
                  Drevený stojan na <span className="text-coral-dark">misky pre psa</span>
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-forest/80">
                  Stabilný stojan na dve nerezové misky, ktorý vyrábame ručne a prispôsobujeme konkrétnemu psíkovi. Vyberiete si veľkosť, farebné prevedenie a meno – výšku nastavíme podľa výšky psa v kohútiku.
                </p>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-sm text-forest/60">Cena od</span>
                  <span className="font-display text-4xl font-bold text-forest">35 €</span>
                </div>
                <p className="mt-1 text-sm text-forest/60">Konečná cena závisí od veľkosti a zvoleného prevedenia.</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    [Ruler, "Rozmery", "Menší cca 40 × 20 cm · väčší cca 60 × 30 cm"],
                    [Sparkles, "Misky", "2 nerezové misky sú v cene"],
                    [Paintbrush, "Prevedenie", "Farba stojana aj písmen podľa dohody"],
                    [Hammer, "Výška", "Na mieru podľa výšky psa v kohútiku"],
                  ].map(([Icon, heading, text]) => {
                    const CardIcon = Icon as typeof Ruler;
                    return (
                      <div key={String(heading)} className="rounded-3xl bg-card p-5 shadow-card">
                        <CardIcon className="size-5 text-coral" />
                        <h2 className="mt-3 text-base text-forest">{String(heading)}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-forest/70">{String(text)}</p>
                      </div>
                    );
                  })}
                </div>

                <a href="#objednat" className="btn-coral mt-7 inline-flex items-center gap-2">
                  Mám záujem o stojan <ChevronRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary/50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Dve veľkosti</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Pre menších aj väčších psíkov</h2>
              <p className="mt-4 leading-relaxed text-forest/80">
                Nechceme jednou univerzálnou veľkosťou riešiť každého psa. Vyberieme vhodný pôdorys a samotnú výšku stojana potom prispôsobíme podľa psíka.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-4xl bg-card shadow-card">
                <img src={standMia} alt="Mia - menšia verzia stojana na misky" loading="lazy" className="h-72 w-full object-cover" />
                <div className="p-7">
                  <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Menšia verzia</p>
                  <h3 className="mt-2 text-2xl text-forest">Mia · cca 40 × 20 cm</h3>
                  <p className="mt-3 leading-relaxed text-forest/75">
                    Menší stojan s menšími nerezovými miskami. Výšku nôh prispôsobujeme konkrétnemu psíkovi.
                  </p>
                </div>
              </article>
              <article className="overflow-hidden rounded-4xl bg-card shadow-card">
                <img src={standAloy} alt="Aloy - väčšia verzia stojana na misky" loading="lazy" className="h-72 w-full object-cover" />
                <div className="p-7">
                  <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Väčšia verzia</p>
                  <h3 className="mt-2 text-2xl text-forest">Aloy · cca 60 × 30 cm</h3>
                  <p className="mt-3 leading-relaxed text-forest/75">
                    Väčší pôdorys a väčšie nerezové misky pre stredné a veľké plemená. Aj tu je výška individuálna.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
              <div>
                <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Praktický každý deň</p>
                <h2 className="section-title mt-2 text-3xl sm:text-4xl">Prečo stojan na misky?</h2>
                <p className="mt-4 leading-relaxed text-forest/80">
                  Stojan drží misky stabilne na jednom mieste a pomáha udržať kŕmny kút prehľadnejší. Výška sa dá prispôsobiť konkrétnemu psíkovi a vyberateľné nerezové misky sa jednoducho čistia.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [Check, "Stabilné misky", "Pevná drevená konštrukcia obmedzuje posúvanie misiek pri jedení a pití."],
                  [Droplets, "Jednoduchšia údržba", "Povrch je ošetrený pre jednoduchšie utieranie bežnej vody a nečistôt okolo misiek."],
                  [Ruler, "Výška podľa psa", "Pri výrobe vychádzame z výšky psíka v kohútiku, nie z jedného univerzálneho rozmeru."],
                  [Sparkles, "Vlastný originál", "Farbu stojana, meno aj farbu písmen vieme zladiť podľa dohody."],
                ].map(([Icon, heading, text]) => {
                  const CardIcon = Icon as typeof Check;
                  return (
                    <article key={String(heading)} className="rounded-3xl bg-card p-6 shadow-card">
                      <CardIcon className="size-5 text-coral" />
                      <h3 className="mt-3 text-lg text-forest">{String(heading)}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-forest/75">{String(text)}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-forest py-14 text-cream sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-12">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral-soft uppercase">Ručná výroba</p>
              <h2 className="mt-2 text-3xl text-cream sm:text-4xl">Každý stojan prejde našimi rukami</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-cream/85">
                <p>
                  Stojany nevyrábame ako anonymný sériový produkt. Každý kus skladáme a dokončujeme ručne, preto vieme upraviť jeho výšku, farebné prevedenie aj personalizáciu.
                </p>
                <p>
                  Používame drevo a povrch stojana ošetrujeme tak, aby sa dal jednoducho udržiavať pri bežnom používaní okolo vody a krmiva. Dve nerezové misky sú súčasťou stojana.
                </p>
              </div>
            </div>
            <img src={standWoody} alt="Biely ručne vyrábaný stojan na misky Woody" loading="lazy" className="h-80 w-full rounded-4xl object-cover shadow-soft" />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Naše realizácie</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Spokojní štvornohí klienti</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">
                Niekoľko hotových prevedení. Ďalšie farby a realizácie budeme postupne dopĺňať.
              </p>
            </div>
            <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GALLERY.map((image) => (
                <figure key={image.label} className="w-[82%] shrink-0 snap-center overflow-hidden rounded-4xl bg-card shadow-card sm:w-[46%] lg:w-[31.5%]">
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-72 w-full object-cover" />
                  <figcaption className="p-5 font-display font-semibold text-forest">{image.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="objednat" className="scroll-mt-28 bg-secondary/55 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-4xl bg-card p-7 shadow-soft sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Máte záujem?</p>
                  <h2 className="section-title mt-2 text-3xl sm:text-4xl">Stojan vyrobíme pre vášho psíka</h2>
                  <p className="mt-4 leading-relaxed text-forest/80">
                    Pri objednávke nám napíšte, o akú veľkosť máte záujem, výšku psíka v kohútiku, želanú farbu stojana, meno a prípadne farbu písmen. Prevedenie a termín si spolu potvrdíme pred výrobou.
                  </p>
                  <div className="mt-5 grid gap-2 text-sm text-forest/75 sm:grid-cols-2">
                    {[
                      "Výška psa v kohútiku",
                      "Menšia alebo väčšia verzia",
                      "Farba stojana",
                      "Meno a farba písmen",
                    ].map((item) => (
                      <span key={item} className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
                        <Check className="size-4 shrink-0 text-coral" /> {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-4xl bg-background p-6 text-center shadow-card sm:p-8">
                  <p className="font-display text-lg font-bold text-forest">Objednávku zatiaľ dohodneme osobne</p>
                  <p className="mt-2 text-sm leading-relaxed text-forest/65">
                    Napíšte nám e-mail alebo zavolajte. Následne si potvrdíme všetky rozmery a prevedenie.
                  </p>
                  <div className="mt-5 space-y-3">
                    <a href={`mailto:${EMAIL}?subject=Stojan%20na%20misky`} className="btn-coral flex w-full items-center justify-center gap-2">
                      <Mail className="size-4" /> Napísať e-mail
                    </a>
                    <a href={`tel:${PHONE}`} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-forest/15 px-5 py-3 font-display text-sm font-semibold text-forest transition-colors hover:border-coral hover:text-coral">
                      <Phone className="size-4" /> {PHONE_PRETTY}
                    </a>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-forest/55">
                    Vlastný objednávkový systém s konfiguráciou produktu pripravujeme ako ďalší krok.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Máte otázku?</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Časté otázky o stojanoch</h2>
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
      </main>
      <Footer />
    </div>
  );
}
