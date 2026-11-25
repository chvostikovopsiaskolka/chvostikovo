import { EMAIL, PHONE, PHONE_PRETTY } from "@/content/site";
import { ContentDialog } from "./ContentDialog";

export type LegalDialogType = "cookies" | "operator";
type Language = "sk" | "en";

const TITLES: Record<Language, Record<LegalDialogType, string>> = {
  sk: {
    cookies: "Pravidlá používania cookies",
    operator: "Údaje prevádzkovateľa",
  },
  en: {
    cookies: "Cookie Policy",
    operator: "Operator details",
  },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 font-display text-lg font-bold text-[#26322b] sm:text-xl">{children}</h2>;
}

export function LegalDialog({
  kind,
  open,
  onOpenChange,
  language = "sk",
}: {
  kind: LegalDialogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language;
}) {
  return (
    <ContentDialog open={open} onOpenChange={onOpenChange} title={TITLES[language][kind]}>
      {kind === "cookies" && <CookiesContent language={language} />}
      {kind === "operator" && <OperatorContent language={language} />}
    </ContentDialog>
  );
}

function CookiesContent({ language }: { language: Language }) {
  if (language === "en") {
    return (
      <div className="space-y-4 text-sm leading-relaxed text-[#26322b] sm:text-base">
        <H2>1. What are cookies?</H2>
        <p>
          Cookies are small text files stored on your device when you visit our website. They help us
          keep the website working properly, understand traffic and improve the user experience.
        </p>

        <H2>2. Types of cookies we use</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Necessary cookies:</strong> required for the basic and secure operation of the website. They cannot be disabled through our cookie settings because they are needed for essential website functions.</li>
          <li><strong>Analytics cookies:</strong> help us understand how visitors use the website and measure traffic. We use them only with your consent.</li>
          <li><strong>Functional cookies:</strong> can provide additional features and remember selected preferences. Where consent is required, they are used only after consent has been given.</li>
          <li><strong>Marketing cookies:</strong> are used to measure advertising performance and marketing conversions. We use them only with your consent.</li>
        </ul>
        <p>
          <strong>Services used on this website:</strong> necessary consent storage by Chvostíkovo;
          Google Maps as an optional functional service; Google Analytics 4 and Google Tag Manager
          for analytics; and Meta Pixel together with Meta Conversions API for marketing
          measurement. Optional services are activated only after the relevant consent has been
          given. Detailed purpose, processed data and retention information is available directly
          in Cookie settings.
        </p>

        <H2>3. Consent and cookie settings</H2>
        <p>
          On your first visit you can choose which optional cookies you allow. Necessary cookies are
          used without consent because they are required for the website to function. You may reject
          optional cookies without losing access to the basic website.
        </p>

        <H2>4. Changing or withdrawing consent</H2>
        <p>
          You can change your cookie preferences or withdraw consent at any time by selecting
          “Cookie settings” in the website footer. You can also manage or delete cookies in your
          browser settings.
        </p>

        <H2>5. Cookie retention</H2>
        <p>
          Retention depends on the cookie, its purpose and provider. Some cookies are removed when
          the browser is closed, while others may remain on your device for a defined period.
        </p>

        <H2>6. Changes to this policy</H2>
        <p>
          We may update this policy when technologies, third-party services or legal requirements
          change. The current version will remain available on this website.
        </p>

        <H2>7. Contact</H2>
        <p>If you have questions about our use of cookies, contact us at: {EMAIL}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm leading-relaxed text-[#26322b] sm:text-base">
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
        <strong>Služby používané na webe:</strong> nevyhnutné uloženie cookie voľby Chvostíkovo;
        Google Maps ako voliteľná funkčná služba; Google Analytics 4 a Google Tag Manager pre
        analytiku; Meta Pixel spolu s Meta Conversions API pre marketingové meranie. Voliteľné
        služby sa aktivujú až po udelení príslušného súhlasu. Podrobný účel, spracúvané údaje a
        informácie o uchovávaní nájdete priamo v Nastaveniach cookies.
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

function OperatorContent({ language }: { language: Language }) {
  if (language === "en") {
    return (
      <div className="space-y-5 text-sm leading-relaxed text-[#26322b] sm:text-base">
        <p>Identification and contact details of the operator of chvostikovo.sk and Chvostíkovo dog daycare.</p>
        <div><H2>Operator</H2><p className="mt-1">Marek Leder – Bellaris</p></div>
        <div><H2>Company ID</H2><p className="mt-1">56447001</p></div>
        <div><H2>Registered place of business</H2><p className="mt-1">Miškovecká 1023/2, 040 11 Košice-Juh, Slovakia</p></div>
        <div><H2>Chvostíkovo premises</H2><p className="mt-1">Poľská 2207/6, 040 01 Košice-Juh, Slovakia</p></div>
        <div>
          <H2>Trade register</H2>
          <p className="mt-1">Registered in the Trade Register of the District Office Košice, no. 820-106266.</p>
        </div>
        <div>
          <H2>Contact</H2>
          <ul className="mt-1 list-none space-y-1">
            <li>Email: <a href={`mailto:${EMAIL}`} className="font-semibold text-[#a95400] hover:underline">{EMAIL}</a></li>
            <li>Phone: <a href={`tel:${PHONE}`} className="font-semibold text-[#a95400] hover:underline">{PHONE_PRETTY}</a></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm leading-relaxed text-[#26322b] sm:text-base">
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
          <li>E-mail: <a href={`mailto:${EMAIL}`} className="font-semibold text-[#a95400] hover:underline">{EMAIL}</a></li>
          <li>Telefón: <a href={`tel:${PHONE}`} className="font-semibold text-[#a95400] hover:underline">{PHONE_PRETTY}</a></li>
        </ul>
      </div>
    </div>
  );
}
