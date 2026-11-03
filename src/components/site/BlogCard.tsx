import { ArrowUpRight } from "lucide-react";
import type { BlogCardData } from "@/content/blog";

export function BlogCard({ card }: { card: BlogCardData }) {
  return (
    <a
      href={card.href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-forest/10 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
    >
      <img src={card.image.src} alt={card.image.alt} loading="lazy" decoding="async"
        className="aspect-[4/3] w-full object-cover" style={{ objectPosition: card.image.position ?? "center" }} width={card.image.width ?? 640} height={card.image.height ?? 480} />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <p className="text-xs font-semibold text-forest/60">{card.eyebrow}</p>
        <h3 className="font-display text-xl leading-tight text-forest sm:text-2xl">{card.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-forest/75">{card.summary}</p>
        <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-coral">
          {card.ctaLabel} <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
