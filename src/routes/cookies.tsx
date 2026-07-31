import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Zásady používania cookies | Chvostíkovo";
const description = "Informácie o používaní súborov cookies na stránke psej škôlky Chvostíkovo.";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cookies,
});

function Cookies() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="font-display text-sm font-semibold text-coral">
        ← Späť na hlavnú stránku
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Zásady používania cookies</h1>

      <div className="mt-6 space-y-5 text-forest/85">
        <p>
          Súbory cookies sú malé textové súbory, ktoré sa ukladajú vo vašom prehliadači pri návšteve
          webovej stránky. Pomáhajú nám zabezpečiť správne fungovanie stránky a zlepšovať jej obsah.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Aké cookies používame</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Nevyhnutné cookies</strong> – zabezpečujú základné fungovanie stránky a
            odosielanie formulárov. Bez nich by stránka nefungovala správne.
          </li>
          <li>
            <strong>Analytické cookies</strong> – pomáhajú nám anonymne zisťovať, ako návštevníci
            stránku používajú, aby sme ju mohli vylepšovať. Používame ich len s vaším súhlasom.
          </li>
          <li>
            <strong>Cookies tretích strán</strong> – môžu vzniknúť pri zobrazení vloženej mapy
            Google Maps alebo obsahu zo sociálnych sietí.
          </li>
        </ul>

        <h2 className="pt-2 font-display text-xl font-bold text-forest">Správa cookies</h2>
        <p>
          Používanie cookies môžete kedykoľvek zmeniť alebo zakázať v nastaveniach svojho
          prehliadača. Vymazanie cookies môže ovplyvniť pohodlie používania stránky.
        </p>

        <p>
          V prípade otázok k cookies nás kontaktujte na e-maile {EMAIL}.
        </p>
      </div>
    </main>
  );
}
