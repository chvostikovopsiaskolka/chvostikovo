import { ArrowRight } from "lucide-react";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import standMia from "@/assets/products/stand-mia.avif";
import targetLargeDog from "@/assets/products/target-large-dog.jpeg";

const PRODUCTS = [
  {
    href: "/stojan-na-misky-pre-psa",
    image: standMia,
    alt: "Drevený stojan na misky pre psa",
    title: "Drevený stojan",
    description: "Vyberte si variant a objednajte si svoj stojan.",
    price: "40 €",
    cta: "Pozrieť stojan",
  },
  {
    href: "/target-na-cvicenie-pre-psov",
    image: targetLargeDog,
    alt: "Pes stojaci na drevenom targete na cvičenie",
    title: "Target na cvičenie pre psov",
    description: "Ručne vyrábaný drevený target s protišmykovým povrchom na tréning správneho postoja, koordinácie a rovnováhy.",
    price: "20 €",
    cta: "Pozrieť target",
  },
];

export function ProductSection() {
  return (
    <section id="produkty" className="relative scroll-mt-24 overflow-hidden bg-secondary/45 py-9 sm:py-12">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Ručne vyrábané pre vašich psíkov</span>
            <h2 className="section-title mt-1 text-3xl sm:text-4xl">Naše produkty</h2>
          </div>
          <a href="/produkty" className="inline-flex w-fit items-center gap-2 font-display text-sm font-semibold text-forest transition-colors hover:text-coral">
            Všetky produkty <ArrowRight className="size-4" />
          </a>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-6">
          {PRODUCTS.map((product) => (
            <article key={product.href} className="min-w-0">
              <a
                href={product.href}
                className="group relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-4xl bg-forest-deep p-5 text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:p-7"
              >
                <img
                  src={product.image}
                  alt={product.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  style={{ objectPosition: "50% 60%" }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep/95 via-forest-deep/45 to-transparent"
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                      {product.title}
                    </h3>
                    <span className="shrink-0 font-display text-lg font-bold text-white sm:text-xl">
                      {product.price}
                    </span>
                  </div>
                  <p className="mt-2 hidden text-sm leading-relaxed text-white/85 sm:line-clamp-2">
                    {product.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-white">
                    {product.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
