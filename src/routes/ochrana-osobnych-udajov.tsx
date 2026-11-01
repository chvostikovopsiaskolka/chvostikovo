import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Zásady ochrany osobných údajov | Chvostíkovo";
const description =
  "Zásady ochrany osobných údajov webu a zákazníckej aplikácie Chvostíkovo.";

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
      <p className="mt-2 text-sm text-forest/70">Pre web a zákaznícku aplikáciu Chvostíkovo · aktualizované 1. 11. 2026</p>

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. Úvod</H2>
        <p>
          Tieto zásady vysvetľujú, ako spracúvame osobné údaje pri používaní webu
          chvostikovo.sk, jeho formulárov a zákazníckeho portálu Chvostíkovo na
          app.chvostikovo.sk vrátane mobilnej aplikácie.
        </p>
        <p>
          Prevádzkovateľom je Marek Leder – Bellaris, IČO: 56 447 001,
          miesto podnikania Miškovecká 1023/2, 040 11 Košice-Juh; prevádzkareň Chvostíkovo:
          Poľská 2207/6, 040 01 Košice-Juh (ďalej len „Prevádzkovateľ“).
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

        <p>
          <strong>Zákaznícka aplikácia:</strong> pri registrácii a správe účtu spracúvame meno a
          priezvisko, e-mail, telefón, údaje potrebné na prihlásenie a informácie o schválení účtu.
          Spracúvame aj údaje o psíkovi (napríklad meno, plemeno, vek, váhu, povahu, alergie,
          zdravotné obmedzenia a očkovania), fotografie psíka a očkovacieho preukazu, rezervácie,
          návštevy, permanentky, požiadavky na taxi, správy a oznámenia.
          Pre bezpečnosť a funkčnosť aplikácie sa spracúvajú aj technické údaje, informácie
          o relácii, záznamy o chybách a pri povolení upozornení identifikátory potrebné
          na doručovanie push správ.
        </p>

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

        <p>
          Zákaznícka aplikácia tieto údaje používa na správu účtu, schvaľovanie prístupu,
          organizáciu návštev, rezervácií, permanentiek a taxi služby, bezpečnú starostlivosť
          o psíka a komunikáciu so škôlkou. Dobrovoľné zobrazenie mena a fotografie psíka
          ostatným majiteľom sa riadi samostatnou nastaviteľnou voľbou v aplikácii.
          Údaje z registrácie nepoužívame ako automatický súhlas s reklamnými správami.
        </p>

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

        <p>
          Vybavenie dopytu a kroky pred uzavretím zmluvy alebo poskytovanie dohodnutej služby
          môžu vychádzať z čl. 6 ods. 1 písm. b) GDPR, zákonná evidencia z písm. c)
          a ochrana účtov a právnych nárokov z oprávneného záujmu podľa písm. f),
          ak sú splnené príslušné podmienky. Samostatný súhlas sa používa len na účely,
          ktoré ho vyžadujú. Povinné oboznámenie sa s týmito informáciami nie je
          univerzálnym súhlasom na akékoľvek ďalšie spracovanie.
        </p>

        <H2>5. Uchovávanie osobných údajov</H2>
        <p>
          Údaje uchovávame počas obdobia potrebného na vybavenie dopytu alebo poskytovanie služby;
          po skončení zákazníckeho vzťahu iba po čas potrebný na splnenie zákonných povinností
          a ochranu právnych nárokov. Účtovné záznamy môžu podliehať osobitným lehotám.
          Technické záznamy uchovávame len na nevyhnutný prevádzkový alebo bezpečnostný účel.
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

        <p id="vymazanie-uctu">
          <strong>Vymazanie zákazníckeho účtu:</strong> o zrušenie účtu a vymazanie súvisiacich
          osobných údajov môžete požiadať aj bez prihlásenia, e-mailom na{" "}
          <a href={"mailto:" + EMAIL + "?subject=Ziadost%20o%20vymazanie%20uctu%20Chvostikovo"}
            className="font-semibold text-coral underline">{EMAIL}</a>.
          Po overení žiadosti vymažeme údaje, na ktorých ďalšie uchovanie nemáme
          právny dôvod. Zákonom povinné záznamy uchováme len v nevyhnutnom rozsahu.
          O postupe vás budeme informovať.
        </p>

        <H2>7. Zdieľanie osobných údajov</H2>
        <p>
          Zákaznícke kontakty nepredávame ani ich neposkytujeme iným firmám na ich vlastnú reklamu.
          Na zabezpečenie webu a zákazníckej aplikácie môžu osobné údaje v nevyhnutnom rozsahu
          spracúvať naši poverení poskytovatelia technických služieb: hostingu a prevádzky
          webu či aplikácie, databázovej infraštruktúry, prihlasovania a bezpečnosti účtov,
          ukladania súborov, doručovania e-mailov, SMS a push upozornení a technickej diagnostiky.
          Pri analytických a marketingových technológiách webu môžu údaje spracúvať
          poskytovatelia analytických a reklamných služieb podľa príslušného právneho
          základu a nastavení súkromia. Údaje môžeme poskytnúť aj príslušným orgánom,
          ak to vyžaduje zákon. Ak dochádza k prenosu údajov mimo Európskeho hospodárskeho
          priestoru (EHP), používajú sa zodpovedajúce záruky podľa GDPR.
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

        <p>
          Tieto zásady platia aj pre mobilnú aplikáciu Chvostíkovo. Zákazník môže dokument
          otvoriť bez prihlásenia. Samostatný súhlas so zverejnením mena alebo fotografie
          psíka ostatným zákazníkom možno v aplikácii kedykoľvek zmeniť.
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
