import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Pravidlá používania cookies | Chvostíkovo";
const description =
  "Pravidlá používania cookies na stránke psej škôlky Chvostíkovo v Košiciach. Denné stráženie psov s individuálnym prístupom a celodenným dohľadom.";

const BASE_URL = "https://chvostikovo.sk";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/cookies` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/cookies` }],
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
          webovej stránky. Pomáhajú nám zabezpečiť jej správne fungovanie, analyzovať návštevnosť a
          zlepšovať vaše používateľské skúsenosti.
        </p>

        <H2>2. Druhy cookies, ktoré používame</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Nevyhnutné cookies:</strong> Tieto cookies sú potrebné na správne a bezpečné
            fungovanie stránky. Nie je možné ich vypnúť prostredníctvom nastavení cookies, pretože sú
            nevyhnutné na poskytovanie základných funkcií webovej stránky.
          </li>
          <li>
            <strong>Analytické cookies:</strong> Pomáhajú nám pochopiť, ako návštevníci používajú našu
            stránku, a umožňujú nám analyzovať jej návštevnosť a zlepšovať jej fungovanie. Používajú
            sa iba na základe vášho súhlasu.
          </li>
          <li>
            <strong>Funkčné cookies:</strong> Umožňujú stránke poskytovať rozšírené funkcie a zapamätať
            si niektoré používateľské nastavenia. Ak je na ich použitie potrebný súhlas, používajú sa
            až po jeho udelení.
          </li>
          <li>
            <strong>Reklamné cookies:</strong> Používajú sa na meranie účinnosti reklamných kampaní a
            zobrazovanie relevantnejšieho reklamného obsahu. Používajú sa iba na základe vášho
            súhlasu.
          </li>
        </ul>
        <p>
          <strong>Služby tretích strán:</strong> Na našej webovej stránke využívame služby tretích
          strán, najmä Google Analytics a Meta Pixel, ktoré používame na analýzu návštevnosti webu a
          meranie účinnosti reklamných kampaní. Tieto služby sa aktivujú až po udelení príslušného
          súhlasu používateľa.
        </p>

        <H2>3. Súhlas a nastavenie cookies</H2>
        <p>
          Pri prvej návšteve našej webovej stránky si môžete prostredníctvom cookie lišty zvoliť, ktoré
          voliteľné cookies povolíte.
        </p>
        <p>
          Nevyhnutné cookies sú potrebné na správne fungovanie stránky a používajú sa bez potreby
          vášho súhlasu. Analytické, funkčné a reklamné cookies, pri ktorých je súhlas potrebný, sa
          používajú až po jeho udelení.
        </p>
        <p>
          Používanie voliteľných cookies môžete odmietnuť bez toho, aby to ovplyvnilo základné
          používanie našej webovej stránky.
        </p>

        <H2>4. Zmena alebo odvolanie súhlasu</H2>
        <p>
          Svoje nastavenia cookies môžete kedykoľvek zmeniť alebo svoj súhlas odvolať priamo na našej
          webovej stránke.
        </p>
        <p>
          Stačí kliknúť na odkaz „Nastavenia cookies“ v pätičke stránky. Následne môžete jednotlivé
          kategórie cookies povoliť alebo zakázať a uložiť svoje nové nastavenia.
        </p>
        <p>Súhlas môžete kedykoľvek odvolať rovnako jednoducho, ako ste ho udelili.</p>
        <p>
          Cookies môžete zároveň spravovať alebo odstrániť aj prostredníctvom nastavení svojho
          internetového prehliadača.
        </p>

        <H2>5. Doba uchovávania cookies</H2>
        <p>
          Doba uchovávania jednotlivých cookies závisí od ich typu, účelu a poskytovateľa. Niektoré
          cookies sa odstránia po zatvorení prehliadača, iné môžu zostať uložené vo vašom zariadení
          počas určitého obdobia.
        </p>

        <H2>6. Zmeny pravidiel používania cookies</H2>
        <p>
          Tieto pravidlá môžeme priebežne aktualizovať, najmä v prípade zmeny používaných technológií,
          služieb tretích strán alebo právnych požiadaviek. Aktuálna verzia pravidiel bude vždy
          dostupná na tejto webovej stránke.
        </p>

        <H2>7. Kontakt</H2>
        <p>Ak máte otázky týkajúce sa používania cookies, kontaktujte nás na: {EMAIL}.</p>
      </div>
    </main>
  );
}
