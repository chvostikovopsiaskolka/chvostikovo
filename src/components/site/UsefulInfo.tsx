import { ArrowRight } from "lucide-react";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { BlogCard } from "./BlogCard";
import { blogCards } from "@/content/blog";

export function UsefulInfo() {
  return (
    <section id="uzitocne-informacie" className="relative scroll-mt-24 overflow-hidden bg-secondary/45 py-16 sm:py-20">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="section-title text-3xl sm:text-4xl">Užitočné informácie</h2>
          <p className="mx-auto mt-3 max-w-2xl text-forest/80">
            Rady z našich skúseností a otázky, ktoré majiteľov psíkov zaujímajú.
          </p>
        </div>
        <div role="region" aria-label="Články a rady Chvostíkova – na mobile posúvajte do strany" tabIndex={0}
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-auto md:grid md:max-w-6xl md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {blogCards.map(card => (
            <div key={card.id} className="w-[86%] shrink-0 snap-start sm:w-[46%] md:w-auto md:shrink">
              <BlogCard card={card} />
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <a href="/blog/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral underline-offset-4 hover:underline">
            Všetky články <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
