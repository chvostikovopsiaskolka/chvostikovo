import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  Paintbrush,
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
            key={image.alt}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Zobraziť fotografiu ${index + 1}`}
            aria-pressed={active === index}
            className={`overflow-hidden rounded-2xl border-2 bg-card transition ${
              active === index
                ? "border-coral shadow-card"
                : "border-transparent opacity-75 hover:opacity-100"
            }`}
          >
            <img src={image.src} alt="" className="aspect-[4/3] w-full object-cover" />
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
      document
        .getElementById("objednavka-stojana")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="konfigurator" className="scroll