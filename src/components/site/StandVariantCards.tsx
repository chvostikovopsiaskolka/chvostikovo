import { ChevronRight, Ruler, Sparkles, Type } from "lucide-react";
import type { StandSize } from "@/lib/shop";
import standMia from "@/assets/products/stand-mia.avif";
import standCori from "@/assets/products/stand-cori.avif";
import standWhite from "@/assets/products/stand-woody.avif";

const VARIANTS: Array<{
  value: StandSize;
  label: string;
  dimension: string;
  height: string;
  price: string;
  image: string;
  alt: string;
}> = [
  { value: "small", label: "S verzia", dimension: "cca 40 × 20 cm",
    height: "Výšku nôh prispôsobujeme konkrétnemu psíkovi, maximálne do 15 cm.",
    price: "40 €", image: standMia, alt: "Drevený stojan MIA – malý variant S" },
  { value: "large", label: "M verzia", dimension: "cca 60 × 30 cm",
    height: "Väčšie nerezové misky a výška nôh od 20 do 35 cm.",
    price: "45 €", image: standCori, alt: "Drevený stojan CORI – stredný variant M" },
  { value: "extra_large", label: "L verzia", dimension: "Rozmery na mieru",
    height: "Pre najväčšie plemená. Presné rozmery, výšku a cenu doladíme individuálne.",
    price: "Na vyžiadanie", image: standWhite, alt: "Biely stojan WOODY – ilustrácia svetlého prevedenia pre variant L" },
];

const FEATURES = [
  { icon: Sparkles, label: "2 misky v cene" },
  { icon: Type, label: "Personalizácia" },
  { icon: Ruler, label: "Výška na mieru" },
] as const;

export function StandVariantCards({ onInterest }: { onInterest: (size: StandSize) => void }) {
  return (
    <div data-stand-sizes="carousel" data-product-stand-cards
      role="region" aria-label="Varianty stojana – na mobile posúvajte do strany" tabIndex={0}
      className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 touch-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
      {VARIANTS.map((variant) => (
        <article key={variant.value} data-stand-size={variant.value}
          className="flex w-[87vw] max-w-[420px] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-4xl bg-card shadow-soft sm:w-[58vw] md:w-auto md:max-w-none md:shrink">
          <div className="relative isolate overflow-hidden">
            <img src={variant.image} alt={variant.alt} loading="eager" decoding="async"
              className="h-56 w-full object-cover sm:h-64 lg:h-64"
              style={{ objectPosition: "50% 56%" }} />
            <div aria-label="Vlastnosti stojana"
              className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex items-stretch gap-1 sm:inset-x-3 sm:bottom-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex min-w-0 flex-1 items-center justify-center gap-0.5 whitespace-nowrap rounded-xl border border-white/75 bg-[#fffaf1]/90 px-1 py-2 font-display text-[clamp(8px,2.2vw,11px)] font-semibold leading-none tracking-tight text-coral-dark shadow-[0_3px_12px_rgba(25,46,37,0.12)] backdrop-blur-md sm:gap-1 sm:px-1.5 sm:text-[10px]">
                  <Icon aria-hidden="true" className="size-3 shrink-0 text-coral-dark" />{label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <p className="font-display text-xs font-bold tracking-widest text-coral uppercase">{variant.label}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-forest">{variant.dimension}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-forest/75">{variant.height}</p>
            <div className="mt-6 flex items-center justify-between gap-2">
              <button type="button" onClick={() => onInterest(variant.value)}
                aria-label={`Mám záujem o ${variant.label.toUpperCase()}`}
                className="btn-coral inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-3 py-2 font-display text-xs font-bold sm:px-4 sm:text-sm">
                Mám záujem <ChevronRight aria-hidden="true" className="size-4" />
              </button>
              <span className="min-w-0 text-right">
                <span className="block text-[11px] text-forest/60">Cena</span>
                <span className={`block font-display font-bold text-forest ${variant.value === "extra_large" ? "text-sm" : "text-2xl"}`}>{variant.price}</span>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
