import { ArrowRight } from "lucide-react";
import { BlogCard } from "./BlogCard";
import { blogArticles, blogCards } from "@/content/blog";

export function ProductRelatedArticles() {
  const slugs = new Set(blogArticles.filter(article => article.productPage).map(article => article.slug));
  const cards = blogCards.filter(card => slugs.has(card.id));
  if (!cards.length) return null;

  return (
    <section data-product-related-articles className="bg-secondary/45 py-12 sm:py-16" aria-labelledby="product-related-heading">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="product-related-heading" className="section-title text-center text-3xl sm:text-4xl">Užitočné články</h2>
        <div role="region" aria-label="Súvisiace články – na mobile posúvajte do strany" tabIndex={0}
          data-product-article-carousel
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-auto md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {cards.map(card => (
            <div key={card.id} className="w-[86%] shrink-0 snap-start sm:w-[46%] md:w-auto md:shrink">
              <BlogCard card={card} />
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <a href="/blog/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral underline-offset-4 hover:underline">
            Všetky články <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
