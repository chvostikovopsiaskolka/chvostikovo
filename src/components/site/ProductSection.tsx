import { ArrowRight } from "lucide-react";
import standAloy from "@/assets/products/stand-aloy-dog.webp";

const PRODUCTS = [
  {
    href: "/stojan-na-misky-pre-psa",
    image: standAloy,
    alt: "Drevený stojan na misky pre psa",
    title: "Drevený stojan na misky pre psa",
    description: "Dve nerezové misky, výška podľa psíka a prevedenie s personalizáciou podľa vášho želania.",
    price: "40 €",
    cta: "Pozrieť stojan",
  },
];

export function ProductSection() {
  return (
    <section id="produkty" className="scroll-mt-24 bg-secondary/45 py-9 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">Naše produkty</span>
            <h2 className="section-title mt-1 text-3xl sm:text-4xl">Vyrábame aj pre vašich psíkov</h2>
          </div>
          <a href="/produkty" className="inline-flex w-fit items-center gap-2 font-display text-sm font-semibold text-forest transition-colors hover:text-coral">
            Všetky produkty <ArrowRight className="size-4" />
          </a>
        </div>

        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PRODUCTS.map((product) => (
            <article key={product.href} className="w-[92%] shrink-0 snap-start rounded-4xl bg-card p-4 shadow-card sm:w-[720px] sm:p-5">
              <div className="flex items-start gap-4 sm:items-center sm:gap-5">
                <a href={product.href} className="block size-24 shrink-0 overflow-hidden rounded-3xl bg-secondary sm:size-28">
                  <img src={product.image} alt={product.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <h3 className="text-xl leading-tight text-forest sm:text-2xl">{product.title}</h3>
                    <span className="font-display text-xl font-bold text-forest">{product.price}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-forest/70 sm:text-base">{product.description}</p>
                  <a href={product.href} className="mt-3 inline-flex items-center gap-2 font-display text-sm font-semibold text-coral transition-colors hover:text-coral-dark">
                    {product.cta} <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
