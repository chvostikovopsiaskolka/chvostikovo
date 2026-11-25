import { ArrowRight } from "lucide-react";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { BlogCardCarousel } from "./BlogCardCarousel";
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
        <BlogCardCarousel cards={blogCards} label="Články a rady Chvostíkova – na mobile posúvajte do strany" />
        <div className="mt-3 text-center">
          <a href="/blog/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral underline-offset-4 hover:underline">
            Všetky články <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
