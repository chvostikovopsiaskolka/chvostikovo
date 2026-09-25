import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { Collapse } from "@/components/site/Collapse";
import { FAQ, PHONE, PHONE_PRETTY } from "@/content/site";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/caste-otazky`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Časté otázky | Psia škôlka Chvostíkovo Košice";
const description =
  "Odpovede na časté otázky o psej škôlke Chvostíkovo v Košiciach – prvá návšteva, bezpečnosť, šteniatka, rezervácie, cenník, odvoz, strava a otváracie hodiny.";

export const Route = createFileRoute("/caste-otazky")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Chvostíkovo - časté otázky o psej škôlke" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: FrequentlyAskedQuestionsPage,
});

function FrequentlyAskedQuestionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="top" className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/45 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Chvostíkovo
              </p>
              <h1 className="mt-3 text-4xl leading-tight text-forest sm:text-5xl">Časté otázky</h1>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/80 sm:text-lg">
                Všetky najčastejšie otázky o fungovaní psej škôlky, prvej návšteve, bezpečnosti,
                rezerváciách aj praktických veciach na jednom mieste.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {FAQ.map((item, index) => (
                <Collapse key={item.q} title={item.q} defaultOpen={index === 0}>
                  <p className="whitespace-pre-line">{item.a}</p>

                  {item.q === "Prijímate aj šteniatka?" && (
                    <a
                      href="/psia-skolka-pre-steniatka"
                      className="mt-4 inline-flex font-display text-sm font-semibold text-coral underline-offset-4 hover:underline"
                    >
                      Viac o psej škôlke pre šteniatka →
                    </a>
                  )}

                  {item.q === "Aký je cenník služieb?" && (
                    <a
                      href="/#cennik"
                      className="mt-4 inline-flex font-display text-sm font-semibold text-coral underline-offset-4 hover:underline"
                    >
                      Prejsť na cenník →
                    </a>
                  )}
                </Collapse>
              ))}
            </div>

            <div className="mt-10 rounded-4xl bg-forest p-7 text-center text-cream shadow-soft sm:p-9">
              <h2 className="text-2xl text-cream sm:text-3xl">Nenašli ste odpoveď?</h2>
              <p className="mx-auto mt-3 max-w-xl text-cream/85">
                Pokojne nám zavolajte alebo sa vráťte na hlavnú stránku a pošlite nám nezáväznú
                prihlášku do škôlky.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href={`tel:${PHONE}`} data-tracking-source="faq_page" className="btn-coral">
                  {PHONE_PRETTY}
                </a>
                <a
                  href="/#kontakt"
                  data-marketing-event="inquiry_cta"
                  data-tracking-source="faq_page_contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-cream/60 px-6 py-3 font-display font-semibold text-cream transition-colors hover:bg-cream hover:text-forest"
                >
                  Kontaktovať nás
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
