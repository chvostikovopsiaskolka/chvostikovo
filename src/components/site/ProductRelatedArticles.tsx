import { ArrowRight } from "lucide-react";
import { BlogCardCarousel } from "./BlogCardCarousel";
import { blogArticles, blogCards } from "@/content/blog";

export function ProductRelatedArticles() {
  const slugs = new Set(blogArticles.filter(article => article.productPage).map(article => article.slug));
  const cards = blogCards.filter(card => slugs.has(card.id));
  if (!cards.length) return null;

  return (
    <section data-product-related-articles className="bg-secondary/45 py-12 sm:py-16" aria-labelledby="product-related-heading">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="product-related-heading" className="section-title text-center text-3xl sm:text-4xl">Užitočné články</h2>
        <BlogCardCarousel cards={cards} label="Súvisiace články – na mobile posúvajte do strany" product />
        <div className="mt-3 text-center">
          <a href="/blog/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral underline-offset-4 hover:underline">
            Všetky články <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
