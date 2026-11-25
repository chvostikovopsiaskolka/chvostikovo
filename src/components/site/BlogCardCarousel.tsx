import { BlogCard } from "./BlogCard";
import type { BlogCardData } from "@/content/blog";

/** One responsive card layout for homepage, product pages and related blog articles. */
export function BlogCardCarousel({ cards, label, product = false }: { cards: BlogCardData[]; label: string; product?: boolean }) {
  return (
    <div role="region" aria-label={label} tabIndex={0}
      data-blog-card-carousel data-product-article-carousel={product ? "" : undefined}
      className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-auto md:grid md:max-w-6xl md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
      {cards.map(card => (
        <div key={card.id} className="w-[86%] shrink-0 snap-start sm:w-[46%] md:w-auto md:shrink">
          <BlogCard card={card} />
        </div>
      ))}
    </div>
  );
}
