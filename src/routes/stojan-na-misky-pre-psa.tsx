import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  Ruler,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { Collapse } from "@/components/site/Collapse";
import { CartDrawer } from "@/components/site/CartDrawer";
import { addToCart, type LetterColor, type StandColor, type StandSize } from "@/lib/shop";
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
  { src: standAloy, alt: "Väčší drevený stojan na misky pre psa pri používaní" },
  { src: standMia, alt: "Menší drevený stojan na misky pre psa" },
  { src: standWoody, alt: "Biely drevený stojan na misky s personalizáciou" },
];

const SIZE_OPTIONS: Array<{ value: StandSize; label: string; detail: string }> = [
  { value: "small", label: "Menší", detail: "cca 40 × 20 cm · menšie misky" },
  { value: "large", label: "Väčší", detail: "cca 60 × 30 cm · väčšie misky" },
];

const COLOR_OPTIONS: Array<{ value: StandColor; label: string }> = [
  { value: "natural", label: "Prírodné drevo" },
  { value: "dark", label: "Tmavé drevo" },
  { value: "white", label: "Biela" },
  { value: "custom", label: "Iná podľa dohody" },
];

const LETTER_OPTIONS: Array<{ value: LetterColor; label: string }> = [
  { value: "light", label: "Svetlé drevo" },
  { value: "black", label: "Čierna" },
  { value: "white", label: "Biela" },
  { value: "custom", label: "Iná podľa dohody" },
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
                price: "40",
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
      <div className="aspect-[4/3] overflow-hidden rounded-4xl bg-secondary shadow-soft">
        <img
          src={current.src}
          alt={current.alt}
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {GALLERY.map((image, index) => (
          <button
            key={image.alt}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Zobraziť fotografiu ${index + 1}`}
            aria-pressed={active === index}
            className={`aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-card transition ${
              active === index ? "border-coral shadow-card" : "border-transparent opacity-75 hover:opacity-100"
            }`}
          >
            <img src={image.src} alt="" className="h-full w-full object-cover object-center" />
          </button>
        ))}
      </div>
    </div>
  );
}

function BowlStandPage() {
  const [size, setSize] = useState<StandSize>("small");
  const [color, setColor] = useState<StandColor>("dark");
  const [dogHeight, setDogHeight] = useState("");
  const [nameOnStand, setNameOnStand] = useState("");
  const [letterColor, setLetterColor] = useState<LetterColor>("light");
  const [orderOpen, setOrderOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [configError, setConfigError] = useState("");

  const sizeOption = SIZE_OPTIONS.find((option) => option.value === size)!;
  const colorOption = COLOR_OPTIONS.find((option) => option.value === color)!;
  const letterOption = LETTER_OPTIONS.find((option) => option.value === letterColor)!;

  function orderStand() {
    const height = Number(dogHeight.replace(",", "."));
    if (!Number.isFinite(height) || height < 10 || height > 120) {
      setConfigError("Zadajte, prosím, výšku psíka v kohútiku v centimetroch.");
      return;
    }

    setConfigError("");
    addToCart({
      product_slug: "stojan-na-misky-pre-psa",
      product_name: "Drevený stojan na misky pre psa",
      unit_price_eur: 40,
      quantity: 1,
      configuration: {
        size,
        size_label: `${sizeOption.label} · ${sizeOption.detail}`,
        color,
        color_label: colorOption.label,
        dog_height_cm: height,
        name_on_stand: nameOnStand.trim(),
        letter_color: letterColor,
        letter_color_label: letterOption.label,
      },
    });
    setCartOpen(true);
  }

  function openOrderOptions() {
    setOrderOpen(true);
    window.setTimeout(() => {
      document.getElementById("objednavka-stojana")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="konfigurator" className="scroll-mt-24 relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4">
            <a href="/produkty" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral">
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>

            <div className="grid gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12">
              <ProductGallery />

              <div>
                <h1 className="text-4xl leading-[1.06] text-forest sm:text-5xl">
                  Drevený stojan na <span className="text-coral-dark">misky pre psa</span>
                </h1>
                <p className="mt-4 leading-relaxed text-forest/80 sm:text-lg">
                  Dve nerezové misky, výška prispôsobená psíkovi a prevedenie podľa vášho želania. Vyberte si variant a objednajte si vlastný stojan.
                </p>
                <div className="mt-5 flex items-end gap-3">
                  <span className="text-sm text-forest/60">Cena</span>
                  <span className="font-display text-4xl font-bold text-forest">40 €</span>
                </div>

                <div id="objednavka-stojana" className="mt-7 scroll-mt-28">
                  <button
                    type="button"
                    onClick={() => setOrderOpen((open) => !open)}
                    aria-expanded={orderOpen}
                    aria-controls="moznosti-objednavky-stojana"
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-card px-5 py-4 text-left shadow-card transition hover:bg-secondary/40"
                  >
                    <span>
                      <span className="block font-display font-bold text-forest">Chcem si objednať stojan</span>
                      <span className="mt-0.5 block text-xs text-forest/55">Vyberte rozmer, farbu, výšku a personalizáciu</span>
                    </span>
                    <ChevronDown className={`size-5 shrink-0 text-forest/65 transition-transform ${orderOpen ? "rotate-180" : ""}`} />
                  </button>

                  {orderOpen && (
                    <div id="moznosti-objednavky-stojana" className="mt-3 rounded-4xl bg-card p-5 shadow-soft sm:p-6">
                      <div>
                        <p className="font-display text-sm font-bold text-forest">1. Rozmer stojana</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {SIZE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSize(option.value)}
                              className={`rounded-2xl border-2 p-3 text-left transition ${
                                size === option.value ? "border-coral bg-coral-soft/25" : "border-forest/10 bg-background"
                              }`}
                            >
                              <span className="font-display text-sm font-bold text-forest">{option.label}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-forest/60">{option.detail}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="font-display text-sm font-bold text-forest">2. Farba stojana</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setColor(option.value)}
                              className={`rounded-full border-2 px-3 py-2 text-xs font-semibold transition ${
                                color === option.value
                                  ? "border-coral bg-coral-soft/25 text-forest"
                                  : "border-forest/10 bg-background text-forest/70"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="mt-5 block font-display text-sm font-bold text-forest">
                        3. Výška psíka v kohútiku *
                        <div className="relative mt-2">
                          <input
                            value={dogHeight}
                            onChange={(event) => setDogHeight(event.target.value)}
                            inputMode="decimal"
                            placeholder="napr. 58"
                            className="w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 pr-12 font-sans font-normal outline-none focus:border-coral"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-forest/50">cm</span>
                        </div>
                      </label>

                      <label className="mt-5 block font-display text-sm font-bold text-forest">
                        4. Meno na stojane
                        <input
                          value={nameOnStand}
                          onChange={(event) => setNameOnStand(event.target.value.slice(0, 24))}
                          placeholder="napr. Bella"
                          className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
                        />
                        <span className="mt-1 block font-sans text-xs font-normal text-forest/50">Ak personalizáciu nechcete, nechajte pole prázdne.</span>
                      </label>

                      <div className="mt-5">
                        <p className="font-display text-sm font-bold text-forest">5. Farba písmen</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {LETTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setLetterColor(option.value)}
                              className={`rounded-full border-2 px-3 py-2 text-xs font-semibold transition ${
                                letterColor === option.value
                                  ? "border-coral bg-coral-soft/25 text-forest"
                                  : "border-forest/10 bg-background text-forest/70"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {configError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{configError}</p>}

                      <button type="button" onClick={orderStand} className="btn-coral mt-6 flex w-full items-center justify-center gap-2">
                        <ShoppingBag className="size-4" /> Objednať stojan
                      </button>
                    </div>
                  )}
                </div>
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
                Nechceme jednou univerzálnou veľkosťou riešiť každého psa. Vyberiete vhodný pôdorys a samotnú výšku stojana prispôsobíme podľa psíka.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-4xl bg-card shadow-card">
                <img src={standMia} alt="Menšia verzia dreveného stojana na misky" loading="lazy" className="h-72 w-full object-cover object-center" />
                <div className="p-7">
                  <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Menšia verzia</p>
                  <h3 className="mt-2 text-2xl text-forest">cca 40 × 20 cm</h3>
                  <p className="mt-3 leading-relaxed text-forest/75">Menší stojan s menšími nerezovými miskami. Výšku nôh prispôsobujeme konkrétnemu psíkovi.</p>
                </div>
              </article>

              <article className="overflow-hidden rounded-4xl bg-card shadow-card">
                <img src={standAloy} alt="Väčšia verzia dreveného stojana na misky" loading="lazy" className="h-72 w-full object-cover object-center" />
                <div className="p-7">
                  <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">Väčšia verzia</p>
                  <h3 className="mt-2 text-2xl text-forest">cca 60 × 30 cm</h3>
                  <p className="mt-3 leading-relaxed text-forest/75">Väčší pôdorys a väčšie nerezové misky pre stredné a veľké plemená. Aj tu je výška individuálna.</p>
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
                  [Sparkles, "Vlastný originál", "Farbu stojana, meno aj farbu písmen vieme zladiť podľa vášho želania."],
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
                <p>Stojany nevyrábame ako anonymný sériový produkt. Každý kus skladáme a dokončujeme ručne, preto vieme upraviť jeho výšku, farebné prevedenie aj personalizáciu.</p>
                <p>Používame drevo a povrch stojana ošetrujeme tak, aby sa dal jednoducho udržiavať pri bežnom používaní okolo vody a krmiva. Dve nerezové misky sú súčasťou stojana.</p>
              </div>
            </div>
            <img src={standWoody} alt="Biely ručne vyrábaný stojan na misky" loading="lazy" className="h-80 w-full rounded-4xl object-cover object-center shadow-soft" />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Naše realizácie</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Spokojní štvornohí klienti</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">Niekoľko hotových prevedení. Ďalšie farby a realizácie budeme postupne dopĺňať.</p>
            </div>
            <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GALLERY.map((image) => (
                <figure key={image.alt} className="w-[82%] shrink-0 snap-center overflow-hidden rounded-4xl bg-card shadow-card sm:w-[46%] lg:w-[31.5%]">
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-72 w-full object-cover object-center" />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/55 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Vytvorte si svoj stojan</p>
            <h2 className="section-title mt-2 text-3xl sm:text-4xl">Vyberte si prevedenie a objednajte</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">Rozmer, farbu, výšku psíka aj personalizáciu si nastavíte priamo hore pri produkte.</p>
            <button type="button" onClick={openOrderOptions} className="btn-coral mt-6 inline-flex items-center gap-2">
              Objednať <ChevronRight className="size-4" />
            </button>
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
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
