import { ChevronRight, Ruler, Sparkles, Star, Type } from "lucide-react";
import { useEffect, useState } from "react";
import type { StandSize } from "@/lib/shop";
import standMia from "@/assets/products/stand-mia.avif";
import standCori from "@/assets/products/stand-cori.avif";
import standRose from "@/assets/products/stand-rose-hq.webp";

export const STAND_VARIANTS: Array<{
  value: StandSize;
  label: string;
  dimension: string;
  height: string;
  breed: string;
  bowls: string;
  note: string;
  price: string;
  image: string;
  alt: string;
}> = [
  { value: "small", label: "S verzia", dimension: "cca 40 × 20 cm",
    height: "do 15 cm", breed: "Pre malé plemená", bowls: "Malé nerezové misky.", note: "Výšku nôh prispôsobujeme konkrétnemu psíkovi.",
    price: "40 €", image: standMia, alt: "Drevený stojan MIA – malý variant S" },
  { value: "large", label: "M verzia", dimension: "cca 60 × 30 cm",
    height: "20–35 cm", breed: "Pre stredné plemená", bowls: "Väčšie nerezové misky.", note: "",
    price: "45 €", image: standCori, alt: "Drevený stojan CORI – stredný variant M" },
  { value: "extra_large", label: "L verzia", dimension: "cca 60 × 30 cm",
    height: "od 40 cm", breed: "Pre veľké plemená", bowls: "Nerezové misky.", note: "Rozmery na mieru podľa psíka.",
    price: "50 €", image: standRose, alt: "Biely drevený stojan ROSE – veľký variant L" },
];

const FEATURES = [
  { icon: Sparkles, label: "2 misky v cene" },
  { icon: Type, label: "Personalizácia" },
  { icon: Ruler, label: "Výška na mieru" },
] as const;

export function StandVariantCards({ onInterest }: { onInterest: (size: StandSize) => void }) {
  // SSR markup is visible before React handlers are attached. Mark only after
  // hydration so browser tests cannot click an inert pre-hydration CTA.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <div data-stand-sizes="carousel" data-product-stand-cards data-stand-cards-hydrated={hydrated ? "true" : "false"}
      role="region" aria-label="Varianty stojana – na mobile posúvajte do strany" tabIndex={0}
      className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 touch-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
      {STAND_VARIANTS.map((variant) => (
        <article key={variant.value} data-stand-size={variant.value}
          className="flex w-[87vw] max-w-[420px] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-4xl bg-card shadow-soft sm:w-[58vw] md:w-auto md:max-w-none md:shrink">
          <div className="relative isolate overflow-hidden">
            <img src={variant.image} alt={variant.alt} loading="eager" decoding="async"
              className="h-80 w-full object-cover sm:h-[23rem] lg:h-[24rem]"
              style={{ objectPosition: variant.value === "extra_large" ? "50% 57%" : "50% 52%" }} />
            <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 sm:inset-x-3 sm:bottom-3">
              <div aria-label="Vlastnosti stojana" className="flex items-stretch gap-1">
              {FEATURES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex min-w-0 flex-1 items-center justify-center gap-0.5 whitespace-nowrap rounded-xl border border-white/75 bg-[#fffaf1]/90 px-1 py-2 font-display text-[clamp(8px,2.2vw,11px)] font-semibold leading-none tracking-tight text-coral-dark shadow-[0_3px_12px_rgba(25,46,37,0.12)] backdrop-blur-md sm:gap-1 sm:px-1.5 sm:text-[10px]">
                  <Icon aria-hidden="true" className="size-3 shrink-0 text-coral-dark" />{label}
                </span>
              ))}
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2" data-stand-card-heading>
              <p className="min-w-0 font-display text-xs font-bold tracking-wider uppercase">
                <span className="text-coral">„{variant.label.charAt(0)}“</span>{" "}
                <span className="text-[#181818]">verzia</span>
              </p>
              <span aria-hidden="true" data-stand-decorative-stars
                className="flex shrink-0 items-center gap-0.5 text-[#e9b600]">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="size-3.5 fill-current sm:size-4" strokeWidth={1.5} />
                ))}
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-forest">{variant.dimension}</h2>
            <div className="mt-3 flex-1 space-y-1 text-sm leading-relaxed text-forest/75">
              <p><strong className="text-forest">{variant.breed}</strong></p>
              <p className="whitespace-nowrap text-[clamp(11px,3.3vw,14px)]">Výška nôh <strong className="text-forest">{variant.height}</strong></p>
              <p>{variant.bowls} {variant.note}</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-2">
              <button type="button" onClick={() => onInterest(variant.value)}
                aria-label={`Mám záujem o ${variant.label.toUpperCase()}`}
                className="btn-coral inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-3 py-2 font-display text-xs font-bold sm:px-4 sm:text-sm">
                Mám záujem <ChevronRight aria-hidden="true" className="size-4" />
              </button>
              <span className="min-w-0 text-right">
                <span className="block text-[11px] text-forest/60">Cena</span>
                <span className="block font-display text-2xl font-bold text-forest">{variant.price}</span>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
