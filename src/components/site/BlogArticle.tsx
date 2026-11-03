import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Contact";
import { FormDialog } from "./FormDialog";
import { ShortForm } from "./Forms";
import { BlogCard } from "./BlogCard";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { blogArticles, blogPath, type BlogArticleData } from "@/content/blog";

const SITE = "https://chvostikovo.sk";
const BRAND = "Chvostíkovo";

export function blogArticleHead(article: BlogArticleData) {
  const url = SITE + blogPath(article.slug);
  return {
    meta: [
      { title: article.seoTitle },
      { name: "description", content: article.description },
      { property: "og:title", content: article.seoTitle },
      { property: "og:description", content: article.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: article.image.src },
      { property: "og:image:alt", content: article.image.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: article.seoTitle },
      { name: "twitter:description", content: article.description },
      { name: "twitter:image", content: article.image.src },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        mainEntityOfPage: url,
        url,
        image: article.image.src,
        inLanguage: "sk",
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        author: { "@type": "Organization", name: BRAND, url: SITE + "/" },
        publisher: { "@type": "Organization", name: BRAND, url: SITE + "/" },
      }),
    }],
  };
}

export function BlogArticle({ article }: { article: BlogArticleData }) {
  const [open, setOpen] = useState(false);
  const trackingSource = "blog_" + article.slug.replaceAll("-", "_") + "_inquiry";
  const related = blogArticles.filter(item => item.slug !== article.slug);

  function openInquiry() {
    trackMarketingInteraction("inquiry_cta", trackingSource);
    void trackCookielessInteraction("inquiry_cta", trackingSource);
    setOpen(true);
  }

  function pricingClick() {
    const source = "blog_" + article.slug.replaceAll("-", "_") + "_pricing";
    trackMarketingInteraction("view_pricing", source);
    void trackCookielessInteraction("nav_click", source, "sk");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <header className="relative overflow-hidden bg-secondary/65 px-4 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:pt-32">
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Drobková navigácia" className="flex flex-wrap items-center gap-2 text-sm text-forest/70">
              <a href="/" className="underline-offset-4 hover:underline">Domov</a><span aria-hidden="true">/</span>
              <a href="/blog/" className="underline-offset-4 hover:underline">Užitočné informácie</a>
            </nav>
            <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight text-forest sm:text-5xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-forest/65">
              <span>Autor: {BRAND}</span><span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>3. novembra 2026</time><span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-4" aria-hidden="true" />{article.readingMinutes} min čítania</span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-forest/85">{article.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={openInquiry} className="btn-coral min-h-11 px-6 py-3 font-display font-semibold">
                Chcem sa informovať o škôlke
              </button>
              <a href="/#cennik" onClick={pricingClick}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-forest/20 bg-card px-5 py-3 font-display font-semibold text-forest transition hover:border-coral">
                Pozrieť cenník <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </header>

        <article className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <figure className="overflow-hidden rounded-3xl bg-secondary shadow-soft">
            <img src={article.image.src} alt={article.image.alt} className="aspect-[16/9] w-full object-cover"
              decoding="async" width={1000} height={563} />
            <figcaption className="px-4 py-2 text-sm text-forest/65">Zo života našej psej škôlky v Košiciach</figcaption>
          </figure>
          <div className="mx-auto mt-10 max-w-3xl space-y-10 sm:mt-14">
            {article.sections.map((section, index) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="font-display text-2xl leading-tight text-forest sm:text-3xl">{section.heading}</h2>
                {section.paragraphs.map(paragraph => (
                  <p key={paragraph} className="text-base leading-8 text-forest/85 sm:text-lg">{paragraph}</p>
                ))}
                {section.points && (
                  <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-forest/85">
                    {section.points.map(point => <li key={point}>{point}</li>)}
                  </ul>
                )}
                {index === 1 && (
                  <figure className="overflow-hidden rounded-3xl bg-secondary">
                    <img src={article.secondImage.src} alt={article.secondImage.alt} loading="lazy" decoding="async"
                      className="aspect-[16/9] w-full object-cover" width={900} height={506} />
                  </figure>
                )}
              </section>
            ))}
            <aside className="rounded-3xl bg-secondary p-6 sm:p-9">
              <h2 className="font-display text-2xl text-forest">Spoznáme sa aj s vaším psíkom?</h2>
              <p className="mt-3 leading-relaxed text-forest/80">
                Úvodná návšteva je zadarmo. Radi s vami preberieme, či bude skupinová starostlivosť vášmu psíkovi vyhovovať.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn-coral min-h-11 px-5 py-3 font-display font-semibold" onClick={openInquiry}>
                  Nezáväzne sa informovať
                </button>
                <a href="/#cennik" onClick={pricingClick}
                  className="inline-flex min-h-11 items-center gap-2 font-display font-semibold text-forest underline-offset-4 hover:underline">
                  Cenník škôlky <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </aside>
            <nav aria-label="Súvisiace stránky" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-forest">
              <a className="underline underline-offset-4" href="/psia-skolka-kosice/">Viac o našej škôlke</a>
              <a className="underline underline-offset-4" href="/#podmienky">Podmienky prijatia</a>
              <a className="underline underline-offset-4" href="/#prva-navsteva">Prvá návšteva v 3 krokoch</a>
            </nav>
          </div>
        </article>
        <section className="border-t border-forest/10 bg-secondary/40 px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <a href="/blog/" className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" /> Všetky články
            </a>
            <h2 className="mt-4 font-display text-2xl text-forest">Mohlo by vás zaujímať</h2>
            <div className="mt-6 grid max-w-xl gap-5">
              {related.map(item => <BlogCard key={item.slug} article={item} />)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FormDialog open={open} onOpenChange={setOpen} title="Informujte sa o psej škôlke" subtitle="Krátky nezáväzný formulár. Radi vám odpovieme.">
        <ShortForm trackingSource={trackingSource} />
      </FormDialog>
    </div>
  );
}
