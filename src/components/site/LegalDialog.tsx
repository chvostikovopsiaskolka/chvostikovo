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
        <li><strong>Nevyhnutné cookies:</strong> sú potrebné na správne a bezpečné fungovanie stránky.</li>
        <li><strong>Analytické cookies:</strong> pomáhajú nám pochopiť používanie stránky a používajú sa iba na základe vášho súhlasu.</li>
        <li><strong>Funkčné cookies:</strong> umožňujú rozšírené funkcie a zapamätanie niektorých nastavení.</li>
        <li><strong>Reklamné cookies:</strong> používajú sa na meranie účinnosti reklamných kampaní a iba na základe vášho súhlasu.</li>
      </ul>
      <p>
        <strong>Služby tretích strán:</strong> využívame najmä Google Analytics a Meta Pixel na
        analýzu návštevnosti a meranie účinnosti reklamných kampaní. Aktivujú sa až po udelení
        príslušného súhlasu.
      </p>

      <H2>3. Súhlas a nastavenie cookies</H2>
      <p>
        Pri prvej návšteve si prostredníctvom cookie lišty môžete zvoliť, ktoré voliteľné cookies
        povolíte. Nevyhnutné cookies sa používajú bez potreby súhlasu, ostatné kategórie iba po jeho
        udelení.
      </p>

      <H2>4. Zmena alebo odvolanie súhlasu</H2>
      <p>
        Svoje nastavenia môžete kedykoľvek zmeniť cez odkaz „Nastavenia cookies“ v pätičke stránky.
        Cookies môžete zároveň spravovať alebo odstrániť aj v nastaveniach svojho prehliadača.
      </p>

      <H2>5. Doba uchovávania cookies</H2>
      <p>
        Doba uchovávania závisí od typu, účelu a poskytovateľa konkrétnej cookie. Niektoré sa odstránia
        po zatvorení prehliadača, iné môžu zostať uložené určitý čas.
      </p>

      <H2>6. Zmeny pravidiel</H2>
      <p>
        Tieto pravidlá môžeme priebežne aktualizovať najmä pri zmene používaných technológií,
        služieb tretích strán alebo právnych požiadaviek.
      </p>

      <H2>7. Kontakt</H2>
      <p>Ak máte otázky týkajúce sa cookies, kontaktujte nás na: {EMAIL}.</p>
    </div>
  );
}

function PrivacyContent({ onSelectCookies }: { onSelectCookies: () => void }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-forest/80 sm:text-base">
      <H2>1. Úvod</H2>
      <p>
        Tieto zásady poskytujú informácie o tom, ako spracovávame osobné údaje, ktoré nám poskytujete
        prostredníctvom webovej stránky www.chvostikovo.sk.
      </p>
      <p>
        Prevádzkovateľom je Marek Leder – Bellaris, Miškovecká 2, Košice, IČO: 56 447 001.
      </p>

      <H2>2. Aké osobné údaje spracovávame</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Kontaktné údaje:</strong> meno, priezvisko, e-mailová adresa a telefónne číslo.</li>
        <li><strong>Údaje o návštevách:</strong> IP adresa, cookies a technické informácie o prehliadači a zariadení.</li>
      </ul>

      <H2>3. Účely spracovania</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Poskytovanie služieb:</strong> vybavenie vašich požiadaviek a komunikácia s vami.</li>
        <li><strong>Marketing:</strong> zasielanie informačných a reklamných správ, ak ste na to udelili súhlas.</li>
        <li><strong>Zlepšenie služieb:</strong> analýza a vylepšovanie našich služieb a webovej stránky.</li>
      </ul>

      <H2>4. Právny základ spracovania</H2>
      <p>Osobné údaje spracovávame najmä na základe súhlasu, plnenia zmluvy alebo oprávneného záujmu podľa konkrétneho účelu.</p>

      <H2>5. Uchovávanie osobných údajov</H2>
      <p>Údaje uchovávame iba po dobu nevyhnutnú na splnenie účelu alebo po dobu požadovanú právnymi predpismi.</p>

      <H2>6. Vaše práva</H2>
      <p>Máte právo na prístup, opravu, vymazanie, obmedzenie spracovania, prenosnosť údajov a v príslušných prípadoch aj právo namietať.</p>
      <p>Svoje práva môžete uplatniť prostredníctvom e-mailu: {EMAIL}.</p>

      <H2>7. Zdieľanie a bezpečnosť údajov</H2>
      <p>
        Údaje zdieľame iba v prípadoch potrebných na plnenie našich povinností alebo ak to vyžaduje
        zákon. Na ich ochranu používame primerané technické a organizačné opatrenia.
      </p>

      <H2>8. Cookies</H2>
      <p>
        Podrobnosti o cookies nájdete v našich{" "}
        <button type="button" onClick={onSelectCookies} className="font-semibold text-coral underline">
          pravidlách používania cookies
        </button>
        .
      </p>

      <H2>9. Kontakt</H2>
      <p>
        Otázky týkajúce sa spracovania osobných údajov môžete poslať na {EMAIL} alebo poštou na
        adresu Miškovecká 2, 040 11 Košice.
      </p>
    </div>
  );
}

function OperatorContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-forest/80 sm:text-base">
      <p>Identifikačné a kontaktné údaje prevádzkovateľa webovej stránky chvostikovo.sk a psej škôlky Chvostíkovo.</p>

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
        <ul className="mt-1 space-y-1">
          <li>E-mail: <a href={`mailto:${EMAIL}`} className="font-semibold text-coral hover:underline">{EMAIL}</a></li>
          <li>Telefón: <a href={`tel:${PHONE}`} className="font-semibold text-coral hover:underline">{PHONE_PRETTY}</a></li>
        </ul>
      </div>
    </div>
  );
}
