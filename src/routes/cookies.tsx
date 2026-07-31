import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Pravidlá používania cookies | Chvostíkovo";
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

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function Cookies() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="font-display text-sm font-semibold text-coral">
        ← Späť na hlavnú stránku
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Pravidlá používania cookies</h1>

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. Čo sú cookies?</H2>
        <p>
          Cookies sú malé textové súbory, ktoré sa ukladajú do vášho zariadenia pri návšteve našej
          webovej stránky. Pomáhajú nám zabezpečiť jej správne fungovanie a zlepšovať vaše
          používateľské skúsenosti.
        </p>

        <H2>2. Druhy cookies, ktoré používame</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Nevyhnutné cookies:</strong> Tieto cookies sú potrebné na správne fungovanie
            stránky a nemožno ich vypnúť v našich systémoch.
          </li>
          <li>
            <strong>Analytické cookies:</strong> Pomáhajú nám pochopiť, ako návštevníci používajú
            našu stránku, čo nám umožňuje zlepšovať jej výkon.
          </li>
          <li>
            <strong>Funkčné cookies:</strong> Umožňujú stránke poskytovať vylepšené funkcie a
            personalizáciu.
          </li>
          <li>
            <strong>Reklamné cookies:</strong> Používajú sa na meranie úspešnosti reklám a
            zobrazovanie relevantného obsahu.
          </li>
        </ul>
        <p>
          <strong>Služby tretích strán:</strong> Na našej webovej stránke môžeme využívať služby
          tretích strán, ako napríklad Google Analytics alebo Meta Pixel, ktoré používajú cookies na
          analýzu návštevnosti webu a meranie účinnosti reklamných kampaní.
        </p>

        <H2>3. Správa cookies</H2>
        <p>
          Používanie cookies môžete kontrolovať alebo zmeniť prostredníctvom nastavení vo vašom
          prehliadači. Môžete ich vypnúť alebo zmazať, avšak niektoré funkcie našej stránky nemusia
          fungovať správne.
        </p>

        <H2>4. Súhlas s používaním cookies</H2>
        <p>
          Pri prvej návšteve si môžete zvoliť, s ktorými typmi cookies súhlasíte. Svoj súhlas môžete
          kedykoľvek zmeniť prostredníctvom nastavení cookies. Ak s používaním cookies nesúhlasíte,
          môžete ich deaktivovať v nastaveniach vášho prehliadača.
        </p>

        <H2>5. Zmeny v pravidlách používania cookies</H2>
        <p>
          Tieto pravidlá môžeme časom aktualizovať, aby odrážali zmeny v našom používaní cookies
          alebo zmeny právnych požiadaviek. Všetky zmeny budú zverejnené na tejto stránke.
        </p>

        <H2>6. Kontakt</H2>
        <p>Ak máte otázky týkajúce sa používania cookies, kontaktujte nás na: {EMAIL}.</p>
      </div>
    </main>
  );
}
