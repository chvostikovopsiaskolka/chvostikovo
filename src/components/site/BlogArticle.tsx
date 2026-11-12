import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Contact";
import { LeadStepForm } from "./LeadStepForm";
import { BlogCard } from "./BlogCard";
import { StandGalleryLoop } from "./StandGalleryLoop";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import { blogCards, blogPath, type BlogArticleData } from "@/content/blog";

const SITE = "https://chvostikovo.sk";
const BRAND = "Chvostíkovo";

export function blogArticleHead(article: BlogArticleData) {
  const url = SITE + blogPath(article.slug);
  const socialImage = new URL(article.image.src, SITE).href;
  return {
    meta: [
      { title: article.seoTitle },
      { name: "description", content: article.description },
      { property: "og:title", content: article.seoTitle },
      { property: "og:description", content: article.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: socialImage },
      { property: "og:image:alt", content: article.image.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: article.seoTitle },
      { name: "twitter:description", content: article.description },
      { name: "twitter:image", content: socialImage },
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
        image: socialImage,
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
  const trackingSource = "blog_" + article.slug.replaceAll("-", "_") + "_inquiry";
  const related = blogCards.filter(card => card.id !== article.slug).slice(0, 3);
  const productGuide = Boolean(article.productPage);
  const standGuide = article.slug === "stojan-na-misky-pre-psa-vyhody-a-vyber";
  const workdayGuide = article.slug === "kam-so-psom-pocas-pracovneho-dna";
  const publishedLabel = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(article.publishedAt + "T12:00:00Z"));

  function trackInquiryClick() {
    trackMarketingInteraction("inquiry_cta", trackingSource);
    void trackCookielessInteraction("inquiry_cta", trackingSource);
  }

  function trackProductClick() {
    void trackCookielessInteraction("nav_click", "blog_" + article.slug.replaceAll("-", "_") + "_product", "sk");
  }

  function conditionsClick() {
    const source = "blog_" + article.slug.replaceAll("-", "_") + "_conditions";
    void trackCookielessInteraction("nav_click", source, "sk");
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
              <time dateTime={article.publishedAt}>{publishedLabel}</time><span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-4" aria-hidden="true" />{article.readingMinutes} min čítania</span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-forest/85">{article.intro}</p>
            <div className="mt-7">
              {article.productPage ? (
                <a href={article.productPage.href} onClick={trackProductClick}
                  className="btn-coral inline-flex min-h-11 items-center justify-center px-6 py-3 font-display font-semibold">
                  {article.productPage.label}
                </a>
              ) : (
                <a href="#zaujem" onClick={trackInquiryClick}
                  className="btn-coral inline-flex min-h-11 items-center justify-center px-6 py-3 font-display font-semibold">
                  Chcem sa informovať o škôlke
                </a>
              )}
            </div>
          </div>
        </header>

        <article className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-3xl space-y-10">
            {article.sections.map((section, index) => (
              <section key={section.heading} className="flow-root">
                <h2 className="mb-4 font-display text-2xl leading-tight text-forest sm:text-3xl">{section.heading}</h2>
                {index === 0 && (
                  <figure className="mb-6 sm:float-right sm:mb-4 sm:ml-7 sm:w-[42%]">
                    <img src={article.image.src} alt={article.image.alt} decoding="async"
                      className={standGuide ? "block h-[260px] w-full rounded-2xl object-cover sm:h-auto" : "block h-auto w-full rounded-2xl"} style={{ objectPosition: article.image.position ?? "center" }} width={article.image.width ?? 1000} height={article.image.height ?? 750} />
                    <figcaption className="mt-2 text-xs leading-relaxed text-forest/65">{article.imageCaption ?? "Zo života našej psej škôlky v Košiciach"}</figcaption>
                  </figure>
                )}
                {index === 1 && !workdayGuide && (
                  <figure className="mb-6 sm:float-left sm:mb-4 sm:mr-7 sm:w-[42%]">
                    <img src={article.secondImage.src} alt={article.secondImage.alt} loading="lazy" decoding="async"
                      className="block h-auto w-full rounded-2xl" width={article.secondImage.width ?? 900} height={article.secondImage.height ?? 675} />
                  </figure>
                )}
                <div className={index === 1 && workdayGuide ? "sm:grid sm:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] sm:items-start sm:gap-7" : ""}>
                  {index === 1 && workdayGuide && (
                    <figure className="mb-6 sm:mb-0">
                      <img src={article.secondImage.src} alt={article.secondImage.alt} loading="lazy" decoding="async"
                        className="block h-auto w-full rounded-2xl" width={article.secondImage.width ?? 900} height={article.secondImage.height ?? 675} />
                    </figure>
                  )}
                  <div className="min-w-0 space-y-4">
                    {section.paragraphs.map(paragraph => (
                      <p key={paragraph} className="text-base leading-8 text-forest/85 sm:text-lg">{paragraph}</p>
                    ))}
                    {section.points && (
                      <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-forest/85">
                        {section.points.map(point => <li key={point}>{point}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
            {productGuide && article.productPage ? (
              <>
                {article.sources && article.sources.length > 0 && (
                  <aside aria-label="Odborné zdroje" className="rounded-2xl border border-forest/10 bg-card p-5">
                    <h2 className="font-display text-lg text-forest">Odborné zdroje k zdravotným tvrdeniam</h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-forest/75">
                      {article.sources.map(source => (
                        <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer"
                          className="text-coral-dark underline underline-offset-2 hover:text-forest">{source.label}</a></li>
                      ))}
                    </ul>
                  </aside>
                )}
                {standGuide && (
                  <section aria-label="Ďalšie ručne vyrábané stojany" className="space-y-4">
                    <h2 className="font-display text-2xl text-forest sm:text-3xl">Naše realizácie stojanov</h2>
                    <StandGalleryLoop />
                  </section>
                )}
                <section id="produkt" aria-labelledby="blog-product-heading"
                  className="scroll-mt-24 rounded-3xl bg-secondary p-6 shadow-soft sm:p-9">
                  <h2 id="blog-product-heading" className="font-display text-2xl text-forest sm:text-3xl">{standGuide ? "Pozrite si naše vyhotovenia" : "Pozrite si naše vyhotovenie"}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-forest/80">{article.productPage.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={article.productPage.href} onClick={trackProductClick}
                      className="btn-coral inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 font-display font-semibold">
                      {article.productPage.label} <ArrowRight aria-hidden="true" className="size-4" />
                    </a>
                    {!standGuide && (
                      <a href="/produkty" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-card px-5 py-3 font-display font-semibold text-forest shadow-sm transition hover:border-coral">
                        Všetky produkty <ArrowRight aria-hidden="true" className="size-4" />
                      </a>
                    )}
                  </div>
                  {!standGuide && <p className="mt-4 text-sm text-forest/65">Ide o nezáväzný dopyt priamo na produktovej stránke, nie o platbu cez košík.</p>}
                </section>
              </>
            ) : (
              <section id="zaujem" aria-labelledby="blog-inquiry-heading"
                className="scroll-mt-24 rounded-3xl bg-secondary p-6 shadow-soft sm:p-9">
                <h2 id="blog-inquiry-heading" className="font-display text-2xl text-forest sm:text-3xl">Spoznáme sa aj s vaším psíkom?</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-forest/80">
                  Úvodná návšteva je zadarmo. Vyplňte krátky nezáväzný formulár a radi s vami preberieme,
                  či bude skupinová starostlivosť vášmu psíkovi vyhovovať.
                </p>
                <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-forest/10 sm:p-6">
                  <LeadStepForm trackingSource={trackingSource} />
                </div>
                <nav aria-label="Ďalšie informácie o škôlke" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <a href="/#cennik" onClick={pricingClick}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-card px-5 py-3 font-display font-semibold text-forest shadow-sm transition hover:border-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">
                    Cenník <ArrowRight aria-hidden="true" className="size-4" />
                  </a>
                  <a href="/#podmienky" onClick={conditionsClick}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-card px-5 py-3 font-display font-semibold text-forest shadow-sm transition hover:border-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">
                    Podmienky škôlky <ArrowRight aria-hidden="true" className="size-4" />
                  </a>
                </nav>
              </section>
            )}
          </div>
        </article>
        <section className="border-t border-forest/10 bg-secondary/40 px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <a href="/blog/" className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" /> Všetky články
            </a>
            <h2 className="mt-4 font-display text-2xl text-forest">Mohlo by vás zaujímať</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(card => <BlogCard key={card.id} card={card} />)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
