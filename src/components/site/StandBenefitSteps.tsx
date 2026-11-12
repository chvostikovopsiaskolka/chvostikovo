import standMia from "@/assets/products/stand-mia.avif";
import standRose from "@/assets/products/stand-rose-hq.webp";
import standArcanaAiden from "@/assets/products/stand-arcana-aiden-hq.webp";

const BENEFITS = [
  {
    title: "Misky majú svoje miesto",
    description: "Stojan drží obe misky pohromade, aby sa pri kŕmení neposúvali samostatne po podlahe.",
    image: standMia,
    alt: "Stojan MIA s dvoma nerezovými miskami na jednom mieste",
  },
  {
    title: "Jednoduché čistenie",
    description: "Neporiadok okolo misiek nemusíte zložito riešiť. Misku vyberiete, umyjete a povrch stojana stačí utrieť.",
    image: standRose,
    alt: "Biely drevený stojan ROSE s vyberateľnými miskami",
  },
  {
    title: "Výška podľa psíka",
    description: "Stačí nám výška psíka v kohútiku. Výšku nôh prispôsobíme konkrétnemu psíkovi.",
    image: standArcanaAiden,
    alt: "Írsky vlkodav so stojanom ARCANA a AIDEN na mieru",
  },
] as const;

/** Mobile uses the proven first-visit photo circles, desktop retains the three numbered steps. */
export function StandBenefitSteps() {
  return (
    <div data-stand-benefit-steps className="relative mt-8 rounded-[1.75rem] border border-forest/15 bg-[#e2f0eb] px-4 py-7 sm:mt-10 sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute top-[59px] right-[16%] left-[16%] hidden h-[2px] bg-forest/25 md:block" />
      <ol className="relative grid grid-cols-1 gap-9 md:grid-cols-3 md:gap-6">
        {BENEFITS.map((benefit, index) => (
          <li key={benefit.title} data-stand-benefit-step className="min-w-0 text-center">
            <div className="relative mx-auto mb-5 w-fit md:mb-4">
              <img src={benefit.image} alt={benefit.alt} loading="lazy" decoding="async"
                className="size-36 rounded-full object-cover shadow-card ring-4 ring-card sm:size-40 md:hidden"
                style={{ objectPosition: index === 2 ? "50% 44%" : "50% 52%" }} />
              <span aria-hidden="true"
                className="absolute -top-3 -left-3 grid size-12 place-items-center rounded-full bg-coral font-display text-lg font-bold text-white shadow-card md:relative md:top-auto md:left-auto md:mx-auto md:size-12 md:border-[3px] md:border-white md:bg-forest md:text-sm md:text-lime-200 sm:size-14">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mx-auto max-w-[17rem] font-display text-lg font-bold leading-snug text-forest md:text-base">
              {benefit.title}
            </h3>
            <p className="mx-auto mt-3 max-w-[23rem] text-[0.95rem] leading-relaxed text-forest/80 md:max-w-[16rem] md:text-sm">
              {benefit.description}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
