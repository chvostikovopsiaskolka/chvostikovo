import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Ruler, ShieldCheck, Sparkles, Type, Hammer } from "lucide-react";
import standMia from "@/assets/products/stand-mia.avif";
import targetLargeDog from "@/assets/products/target-large-dog.jpeg";

const PRODUCTS = [
  {
    href: "/stojan-na-misky-pre-psa",
    image: standMia,
    alt: "Drevený stojan MIA s dvoma nerezovými miskami",
    eyebrow: "Stojany na misky",
    name: "Drevený stojan na misky pre psa",
    description: "Stabilný ručne vyrábaný stojan s dvoma miskami. Výšku, farbu aj meno prispôsobíme vášmu psíkovi.",
    price: "40 €",
    features: [
      { icon: Sparkles, label: "2 misky v cene" },
      { icon: Type, label: "Personalizácia" },
      { icon: Ruler, label: "Výška na mieru" },
    ],
  },
  {
    href: "/target-na-cvicenie-pre-psov",
    image: targetLargeDog,
    alt: "Pes na drevenom tréningovom targete",
    eyebrow: "Tréningové pomôcky",
    name: "Target na cvičenie pre psov",
    description: "Drevený target s protišmykovým povrchom na tréning postoja, koordinácie a rovnováhy.",
    price: "20 €",
    features: [
      { icon: ShieldCheck, label: "Protišmyk" },
      { icon: Hammer, label: "Ručná výroba" },
      { icon: Ruler, label: "2 veľkosti" },
    ],
  },
] as const;

export function ProductCatalogCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function moveTo(index: number) {
    const root = track.current;
    const card = root?.querySelectorAll<HTMLElement>("article")[index];
    const first = root?.querySelector<HTMLElement>("article");
    if (!root || !card || !first) return;
    // Keep the carousel arrow and position synchronized on mobile browsers.
    root.scrollLeft = card.offsetLeft - first.offsetLeft;
    setActive(index);
  }

  return (
    <div className="mt-4 sm:mt-7" data-product-list="catalog">
      <div
        ref={track}
        data-products-carousel
        role="region"
        aria-label="Katalóg produktov – na mobile posúvajte do strany"
        tabIndex={0}
        onScroll={(event) => {
          const root = event.currentTarget;
          const first = root.querySelector<HTMLElement>("article");
          if (first && root.clientWidth && window.innerWidth < 768) {
            setActive(Math.min(PRODUCTS.length - 1, Math.round(root.scrollLeft / (first.offsetWidth + 12))));
          }
        }}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
      >
        {PRODUCTS.map((product) => (
          <article key={product.href} data-product-card className="flex w-[89%] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-card shadow-soft md:w-auto md:shrink md:rounded-4xl">
            <a href={product.href} data-product-photo className="group relative block isolate overflow-hidden" aria-label={"Pozrieť produkt: " + product.name}>
              <img
                src={product.image}
                alt={product.alt}
                loading="eager"
                decoding="async"
                className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-72 lg:h-80"
                style={{ objectPosition: "50% 56%" }}
              />
              <div data-product-photo-features aria-label="Vlastnosti produktu"
                className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex flex-nowrap items-stretch gap-1.5 sm:inset-x-3 sm:bottom-3 sm:gap-2">
                {product.features.map(({ icon: Icon, label }) => (
                  <span key={label}
                    className="flex min-w-0 flex-1 items-center justify-center gap-0.5 whitespace-nowrap rounded-xl border border-white/75 bg-[#fffaf1]/85 px-1 py-2 font-display text-[clamp(8px,2.2vw,11px)] font-semibold leading-none tracking-tight text-coral-dark shadow-[0_3px_12px_rgba(25,46,37,0.12)] backdrop-blur-md sm:gap-1 sm:px-2 sm:text-xs"
                  >
                    <Icon aria-hidden="true" className="size-3 shrink-0 text-coral-dark sm:size-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </a>
            <div className="flex flex-1 flex-col p-4 sm:p-6">
              <p className="font-display text-[10px] font-bold tracking-widest text-coral uppercase sm:text-xs">{product.eyebrow}</p>
              <h3 className="mt-1 font-display text-lg font-bold leading-tight text-forest sm:mt-2 sm:text-2xl">{product.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-snug text-forest/75 sm:line-clamp-3 sm:leading-relaxed">{product.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2 sm:mt-6">
                <div className="shrink-0">
                  <span className="block text-[11px] text-forest/60">Cena</span>
                  <span className="font-display text-xl font-bold leading-none text-forest sm:text-2xl">{product.price}</span>
                </div>
                <a href={product.href} className="btn-coral inline-flex min-h-10 items-center justify-center gap-1 px-3 py-2 text-xs font-bold sm:min-h-11 sm:gap-2 sm:px-5 sm:text-sm">
                  Detail produktu <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-center gap-5 md:hidden" aria-label="Ovládanie karuselu produktov">
        <button type="button" aria-label="Predchádzajúci produkt" disabled={active === 0}
          onClick={() => moveTo(Math.max(0, active - 1))}
          className="inline-flex size-9 items-center justify-center rounded-full bg-card text-forest disabled:opacity-30">
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <span className="font-display text-xs tabular-nums text-forest/70">{active + 1} / {PRODUCTS.length}</span>
        <button type="button" aria-label="Ďalší produkt" disabled={active === PRODUCTS.length - 1}
          onClick={() => moveTo(Math.min(PRODUCTS.length - 1, active + 1))}
          className="inline-flex size-9 items-center justify-center rounded-full bg-card text-forest disabled:opacity-30">
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
