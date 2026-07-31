import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Zásady ochrany osobných údajov | Chvostíkovo";
const description = "Zásady ochrany osobných údajov psej škôlky Chvostíkovo v Košiciach.";

const BASE_URL = "https://chvostikovo.sk";

export const Route = createFileRoute("/ochrana-osobnych-udajov")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/ochrana-osobnych-udajov` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/ochrana-osobnych-udajov` }],
  }),
  component: Privacy,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="font-display text-sm font-semibold text-coral">
        ← Späť na hlavnú stránku
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Zásady ochrany osobných údajov</h1>

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. Úvod</H2>
        <p>
          Tieto Zásady ochrany osobných údajov poskytujú informácie o tom, ako spracovávame osobné
          údaje, ktoré nám poskytujete prostredníctvom webovej stránky www.chvostikovo.sk.
        </p>
        <p>
          Prevádzkovateľom tejto stránky je Marek Leder - Bellaris so sídlom Miškovecká 2 Košice,
          IČO: 56 447 001 (ďalej len „Prevádzkovateľ“).
        </p>

        <H2>2. Aké osobné údaje spracovávame</H2>
        <p>Spracovávame nasledujúce kategórie osobných údajov:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Kontaktné údaje:</strong> meno, priezvisko, e-mailová adresa, telefónne číslo.
          </li>
          <li>
            <strong>Údaje o návštevách:</strong> IP adresa, údaje o vašich aktivitách na našej
            webovej stránke, cookies, informácie o prehliadači a zariadení.
          </li>
        </ul>

        <H2>3. Účely spracovania osobných údajov</H2>
        <p>Vaše osobné údaje spracovávame na tieto účely:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Poskytovanie služieb:</strong> Aby sme mohli vybaviť vaše požiadavky,
            komunikovať s vami a zabezpečiť funkčnosť webovej stránky.
          </li>
          <li>
            <strong>Marketing a obchodné oznámenia:</strong> Na zasielanie informačných a reklamných
            správ, ak ste na to udelili súhlas.
          </li>
          <li>
            <strong>Zlepšenie našich služieb:</strong> Na analýzu a vylepšenie našich produktov a
            služieb.
          </li>
        </ul>

        <H2>4. Právny základ spracovania</H2>
        <p>Osobné údaje spracovávame na základe:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Súhlasu:</strong> Ak ste nám udelili súhlas na spracovanie osobných údajov na
            konkrétny účel (napr. zasielanie newsletterov).
          </li>
          <li>
            <strong>Plnenia zmluvy:</strong> Ak je spracovanie potrebné na plnenie zmluvy, ktorú ste
            s nami uzatvorili.
          </li>
          <li>
            <strong>Oprávneného záujmu:</strong> Na zabezpečenie bezpečnosti našich systémov a
            zlepšovanie našich služieb.
          </li>
        </ul>

        <H2>5. Uchovávanie osobných údajov</H2>
        <p>
          Vaše osobné údaje uchovávame po dobu nevyhnutnú na splnenie účelov, na ktoré boli získané,
          alebo po dobu požadovanú príslušnými právnymi predpismi.
        </p>

        <H2>6. Práva dotknutých osôb</H2>
        <p>V súlade s platnými právnymi predpismi máte právo:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Na prístup:</strong> Požadovať potvrdenie, či spracovávame vaše osobné údaje, a
            získať kópiu týchto údajov.
          </li>
          <li>
            <strong>Na opravu:</strong> Požadovať opravu nesprávnych alebo neaktuálnych údajov.
          </li>
          <li>
            <strong>Na vymazanie:</strong> Požadovať vymazanie osobných údajov, ak nie sú potrebné
            na účely, na ktoré boli získané, alebo ak ste odvolali svoj súhlas.
          </li>
          <li>
            <strong>Na obmedzenie spracovania:</strong> Požadovať obmedzenie spracovania vašich
            údajov.
          </li>
          <li>
            <strong>Na prenosnosť:</strong> Získať osobné údaje, ktoré ste nám poskytli, v
            štruktúrovanom, bežne používanom a strojovo čitateľnom formáte.
          </li>
          <li>
            <strong>Namietať:</strong> Namietať proti spracovaniu vašich osobných údajov na základe
            oprávneného záujmu.
          </li>
        </ul>
        <p>Svoje práva môžete uplatniť prostredníctvom e-mailu: {EMAIL}.</p>

        <H2>7. Zdieľanie osobných údajov</H2>
        <p>
          Vaše údaje nezdieľame s tretími stranami, okrem prípadov, keď je to nevyhnutné na plnenie
          našich povinností alebo ak to vyžaduje zákon.
        </p>

        <H2>8. Bezpečnosť údajov</H2>
        <p>
          Na ochranu vašich osobných údajov používame primerané technické a organizačné opatrenia v
          súlade s príslušnými právnymi predpismi.
        </p>

        <H2>9. Cookies</H2>
        <p>
          Používame cookies na zlepšenie vašej používateľskej skúsenosti a analýzu návštevnosti.
          Podrobné informácie o používaní cookies nájdete v našich{" "}
          <Link to="/cookies" className="font-semibold text-coral underline">
            Pravidlách používania cookies
          </Link>
          .
        </p>

        <H2>10. Kontakt</H2>
        <p>
          Ak máte otázky týkajúce sa spracovania osobných údajov, môžete nás kontaktovať na
          e-mailovej adrese: {EMAIL}, alebo poštou na adrese: Miškovecká 2, 04011 Košice.
        </p>
      </div>
    </main>
  );
}
