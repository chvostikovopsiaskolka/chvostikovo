import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL, PHONE, PHONE_PRETTY } from "@/content/site";

const title = "Údaje prevádzkovateľa | Chvostíkovo";
const description =
  "Identifikačné a kontaktné údaje prevádzkovateľa webovej stránky chvostikovo.sk a psej škôlky Chvostíkovo.";

const BASE_URL = "https://chvostikovo.sk";

export const Route = createFileRoute("/udaje-prevadzkovatela")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/udaje-prevadzkovatela` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/udaje-prevadzkovatela` }],
  }),
  component: OperatorDetails,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function OperatorDetails() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="font-display text-sm font-semibold text-coral">
        ← Späť na hlavnú stránku
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Údaje prevádzkovateľa</h1>

      <p className="mt-4 text-forest/85">
        Identifikačné a kontaktné údaje prevádzkovateľa webovej stránky chvostikovo.sk a psej
        škôlky Chvostíkovo.
      </p>

      <div className="mt-6 space-y-4 text-forest/85">
        <div>
          <H2>Prevádzkovateľ</H2>
          <p className="mt-1">Marek Leder – Bellaris</p>
        </div>

        <div>
          <H2>IČO</H2>
          <p className="mt-1">56447001</p>
        </div>

        <div>
          <H2>Miesto podnikania</H2>
          <p className="mt-1">Miškovecká 1023/2, 040 11 Košice-Juh</p>
        </div>

        <div>
          <H2>Prevádzkareň Chvostíkovo</H2>
          <p className="mt-1">Poľská 2207/6, 040 01 Košice-Juh</p>
        </div>

        <div>
          <H2>Živnostenský register</H2>
          <p className="mt-1">
            Zapísaný v Živnostenskom registri Okresného úradu Košice, č. 820-106266.
          </p>
        </div>

        <div>
          <H2>Kontakt</H2>
          <ul className="mt-1 list-none space-y-1">
            <li>
              E-mail:{" "}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-coral hover:underline">
                {EMAIL}
              </a>
            </li>
            <li>
              Telefón:{" "}
              <a href={`tel:${PHONE}`} className="font-semibold text-coral hover:underline">
                {PHONE_PRETTY}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
