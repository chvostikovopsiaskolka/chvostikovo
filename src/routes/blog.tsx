import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { BlogCard } from "@/components/site/BlogCard";
import { blogArticles, blogCards } from "@/content/blog";

const PAGE_URL = "https://chvostikovo.sk/blog/";
const title = "Užitočné informácie o psoch a psej škôlke | Chvostíkovo";
const description = "Praktické rady od Chvostíkova: ako zabezpečiť starostlivosť o psa počas práce a ako zistiť, či mu bude vyhovovať psia škôlka v Košiciach.";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: new URL(blogArticles[0]!.image.src, "https://chvostikovo.sk").href },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section className="bg-secondary/50 px-4 pb-12 pt-10 sm:pt-14 lg:pt-32">
          <div className="mx-auto max-w-6xl">
            <nav className="text-sm text-forest/70"><a href="/" className="hover:underline">Domov</a> / Užitočné informácie</nav>
            <h1 className="mt-6 font-display text-4xl text-forest sm:text-5xl">Užitočné informácie</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest/80">
              Skúsenosti, rady a odpovede na otázky, ktoré si majitelia kladú pred návštevou psej škôlky.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-label="Články Chvostíkova">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogCards.map(card => <BlogCard key={card.id} card={card} />)}
          </div>
          <p className="mt-10 text-sm text-forest/65">
            Hľadáte skôr podmienky prijatia alebo ceny? <a className="text-coral underline underline-offset-4" href="/#cennik">Pozrite si cenník a ponuku škôlky.</a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
