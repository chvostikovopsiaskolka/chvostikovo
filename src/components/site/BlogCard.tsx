import { ArrowUpRight } from "lucide-react";
import { blogPath, type BlogArticleData } from "@/content/blog";

export function BlogCard({ article }: { article: BlogArticleData }) {
  return (
    <a
      href={blogPath(article.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-forest/10 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
    >
      <img src={article.image.src} alt={article.image.alt} loading="lazy" decoding="async"
        className="aspect-[16/9] w-full object-cover" width={640} height={360} />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <p className="text-xs font-semibold text-forest/60">Rady od Chvostíkova · {article.readingMinutes} min čítania</p>
        <h3 className="font-display text-xl leading-tight text-forest sm:text-2xl">{article.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-forest/75">{article.summary}</p>
        <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-coral">
          Prečítať článok <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
