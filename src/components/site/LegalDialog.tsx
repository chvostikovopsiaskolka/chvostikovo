import { EMAIL, PHONE, PHONE_PRETTY } from "@/content/site";
import { ContentDialog } from "./ContentDialog";

export type LegalDialogType = "cookies" | "privacy" | "operator";

const TITLES: Record<LegalDialogType, string> = {
  cookies: "Pravidlá používania cookies",
  privacy: "Ochrana osobných údajov",
  operator: "Údaje prevádzkovateľa",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 font-display text-lg font-bold text-forest sm:text-xl">{children}</h2>;
}

export function LegalDialog({
  kind,
  open,
  onOpenChange,
  onSelect,
}: {
  kind: LegalDialogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (kind: LegalDialogType) => void;
}) {
  return (
    <ContentDialog open={open} onOpenChange={onOpenChange} title={TITLES[kind]}>
      {kind === "cookies" && <CookiesContent />}
      {kind === "privacy" && <PrivacyContent onSelectCookies={() => onSelect?.("cookies")} />}
      {kind === "operator" && <OperatorContent />}
    </ContentDialog>
  );
}

function CookiesContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-forest/80 sm:text-base">
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
  );
}

function PrivacyContent({ onSelectCookies }: { onSelectCookies: () => void }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-forest/80 sm:text-base">
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
        <li><strong>Kontaktné údaje:</strong> meno, priezvisko, e-mailová adresa, telefónne číslo.</li>
        <li>
          <strong>Údaje o návštevách:</strong> IP adresa, údaje o vašich aktivitách na našej webovej
          stránke, cookies, informácie o prehliadači a zariadení.
        </li>
      </ul>

      <H2>3. Účely spracovania osobných údajov</H2>
      <p>Vaše osobné údaje spracovávame na tieto účely:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Poskytovanie služieb:</strong> Aby sme mohli vybaviť vaše požiadavky, komunikovať s vami a zabezpečiť funkčnosť webovej stránky.</li>
        <li><strong>Marketing a obchodné oznámenia:</strong> Na zasielanie informačných a reklamných správ, ak ste na to udelili súhlas.</li>
        <li><strong>Zlepšenie našich služieb:</strong> Na analýzu a vylepšenie našich produktov a služieb.</li>
      </ul>

      <H2>4. Právny základ spracovania</H2>
      <p>Osobné údaje spracovávame na základe:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Súhlasu:</strong> Ak ste nám udelili súhlas na spracovanie osobných údajov na konkrétny účel (napr. zasielanie newsletterov).</li>
        <li><strong>Plnenia zmluvy:</strong> Ak je spracovanie potrebné na plnenie zmluvy, ktorú ste s nami uzatvorili.</li>
        <li><strong>Oprávneného záujmu:</strong> Na zabezpečenie bezpečnosti našich systémov a zlepšovanie našich služieb.</li>
      </ul>

      <H2>5. Uchovávanie osobných údajov</H2>
      <p>
        Vaše osobné údaje uchovávame po dobu nevyhnutnú na splnenie účelov, na ktoré boli získané,
        alebo po dobu požadovanú príslušnými právnymi predpismi.
      </p>

      <H2>6. Práva dotknutých osôb</H2>
      <p>V súlade s platnými právnymi predpismi máte právo:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Na prístup:</strong> Požadovať potvrdenie, či spracovávame vaše osobné údaje, a získať kópiu týchto údajov.</li>
        <li><strong>Na opravu:</strong> Požadovať opravu nesprávnych alebo neaktuálnych údajov.</li>
        <li><strong>Na vymazanie:</strong> Požadovať vymazanie osobných údajov, ak nie sú potrebné na účely, na ktoré boli získané, alebo ak ste odvolali svoj súhlas.</li>
        <li><strong>Na obmedzenie spracovania:</strong> Požadovať obmedzenie spracovania vašich údajov.</li>
        <li><strong>Na prenosnosť:</strong> Získať osobné údaje, ktoré ste nám poskytli, v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte.</li>
        <li><strong>Namietať:</strong> Namietať proti spracovaniu vašich osobných údajov na základe oprávneného záujmu.</li>
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
        <button type="button" onClick={onSelectCookies} className="font-semibold text-coral underline">
          Pravidlách používania cookies
        </button>
        .
      </p>

      <H2>10. Kontakt</H2>
      <p>
        Ak máte otázky týkajúce sa spracovania osobných údajov, môžete nás kontaktovať na
        e-mailovej adrese: {EMAIL}, alebo poštou na adrese: Miškovecká 2, 04011 Košice.
      </p>
    </div>
  );
}

function OperatorContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-forest/80 sm:text-base">
      <p>
        Identifikačné a kontaktné údaje prevádzkovateľa webovej stránky chvostikovo.sk a psej
        škôlky Chvostíkovo.
      </p>
      <div><H2>Prevádzkovateľ</H2><p className="mt-1">Marek Leder – Bellaris</p></div>
      <div><H2>IČO</H2><p className="mt-1">56447001</p></div>
      <div><H2>Miesto podnikania</H2><p className="mt-1">Miškovecká 1023/2, 040 11 Košice-Juh</p></div>
      <div><H2>Prevádzkareň Chvostíkovo</H2><p className="mt-1">Poľská 2207/6, 040 01 Košice-Juh</p></div>
      <div>
        <H2>Živnostenský register</H2>
        <p className="mt-1">Zapísaný v Živnostenskom registri Okresného úradu Košice, č. 820-106266.</p>
      </div>
      <div>
        <H2>Kontakt</H2>
        <ul className="mt-1 list-none space-y-1">
          <li>E-mail: <a href={`mailto:${EMAIL}`} className="font-semibold text-coral hover:underline">{EMAIL}</a></li>
          <li>Telefón: <a href={`tel:${PHONE}`} className="font-semibold text-coral hover:underline">{PHONE_PRETTY}</a></li>
        </ul>
      </div>
    </div>
  );
}
