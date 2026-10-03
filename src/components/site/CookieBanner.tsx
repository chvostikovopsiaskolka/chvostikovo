import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  CONSENT_STORAGE_KEY,
  emptyConsent,
  readStoredConsent,
  writeStoredConsent,
  type Consent,
} from "@/lib/consent";

type Category = "necessary" | "functional" | "analytics" | "marketing";

type Service = {
  name: string;
  provider: string;
  category: Category;
  purposeSk: string;
  purposeEn: string;
  dataSk: string;
  dataEn: string;
  retentionSk: string;
  retentionEn: string;
};

const SERVICES: Service[] = [
  {
    name: "Chvostíkovo Cookie Consent",
    provider: "Chvostíkovo",
    category: "necessary",
    purposeSk: "Uloženie vašej voľby cookies a opätovné zobrazenie nastavení po zmene pravidiel alebo po uplynutí platnosti súhlasu.",
    purposeEn: "Stores your cookie preferences and asks again after a policy/version change or when consent expires.",
    dataSk: "Zvolené kategórie súhlasu, verzia textov a čas uloženia. Ukladá sa lokálne v prehliadači pod kľúčom chvostikovo-cookies.",
    dataEn: "Selected consent categories, policy version and save time. Stored locally in the browser under chvostikovo-cookies.",
    retentionSk: "Najviac 180 dní; pri zmene verzie pravidiel sa vyžiada nová voľba.",
    retentionEn: "Up to 180 days; a new choice is requested when the policy version changes.",
  },
  {
    name: "Google Maps",
    provider: "Google Ireland Limited",
    category: "functional",
    purposeSk: "Zobrazenie interaktívnej mapy prevádzky Chvostíkovo.",
    purposeEn: "Displays the interactive map for the Chvostíkovo premises.",
    dataSk: "Pri načítaní mapy môže Google spracovať technické údaje prehliadača, IP adresu a vlastné identifikátory/cookies.",
    dataEn: "When the map loads, Google may process browser technical data, IP address and its own identifiers/cookies.",
    retentionSk: "Podľa pravidiel Google. Mapa sa načíta až po povolení funkčných cookies.",
    retentionEn: "According to Google's policies. The map loads only after functional cookies are allowed.",
  },
  {
    name: "Google Analytics 4",
    provider: "Google Ireland Limited",
    category: "analytics",
    purposeSk: "Meranie návštevnosti, zdrojov návštev a správania používateľov na webe, aby sme vedeli web zlepšovať.",
    purposeEn: "Measures traffic, acquisition sources and website usage so we can improve the site.",
    dataSk: "Udalosti a návštevy stránok, technické údaje prehliadača a identifikátory Google Analytics, napr. _ga a _ga_*.",
    dataEn: "Page and event activity, browser technical data and Google Analytics identifiers such as _ga and _ga_*.",
    retentionSk: "Podľa nastavení služby Google Analytics; analytika sa spúšťa iba po vašom súhlase.",
    retentionEn: "According to the Google Analytics configuration; analytics starts only after your consent.",
  },
  {
    name: "Google Tag Manager",
    provider: "Google Ireland Limited",
    category: "analytics",
    purposeSk: "Technická správa meracích tagov a odovzdanie nastavenia súhlasu analytickým a marketingovým nástrojom.",
    purposeEn: "Technical management of measurement tags and distribution of consent settings to analytics/marketing tools.",
    dataSk: "Technické údaje potrebné na spustenie a riadenie tagov; samotný GTM nepoužívame ako samostatný profilovací nástroj.",
    dataEn: "Technical data required to load and manage tags; we do not use GTM as a separate profiling tool.",
    retentionSk: "Aktivuje sa iba vtedy, keď je povolená analytika alebo marketing.",
    retentionEn: "Activated only when analytics or marketing is allowed.",
  },
  {
    name: "Meta Pixel",
    provider: "Meta Platforms Ireland Limited",
    category: "marketing",
    purposeSk: "Meranie návštev a konverzií z reklám na Facebooku a Instagrame a vyhodnocovanie reklamných kampaní.",
    purposeEn: "Measures visits and conversions from Facebook and Instagram ads and evaluates campaign performance.",
    dataSk: "Pixel ID, udalosti ako PageView, Contact, HeroLearnMore, ExploreDaycare, InquiryCTA, Lead a CompleteRegistration, technické identifikátory prehliadača a cookies _fbp/_fbc.",
    dataEn: "Pixel ID, events such as PageView, Contact, HeroLearnMore, ExploreDaycare, InquiryCTA, Lead and CompleteRegistration, browser identifiers and _fbp/_fbc cookies.",
    retentionSk: "Podľa pravidiel Meta; Pixel sa aktivuje až po marketingovom súhlase. Po odvolaní súhlasu marketingové cookies odstránime.",
    retentionEn: "According to Meta's policies; Pixel activates only after marketing consent. Marketing cookies are removed when consent is withdrawn.",
  },
  {
    name: "Meta Conversions API",
    provider: "Meta Platforms Ireland Limited",
    category: "marketing",
    purposeSk: "Serverové meranie konverzií a presnejšie priradenie odoslaného formulára k reklamnej kampani.",
    purposeEn: "Server-side conversion measurement and improved attribution of submitted forms to advertising campaigns.",
    dataSk: "Pri marketingovom súhlase môžeme pri konverzii odoslať hashovaný telefón, IP adresu, user-agent, _fbp/_fbc a ID udalosti na deduplikáciu s Pixelom.",
    dataEn: "With marketing consent, a conversion may include hashed phone number, IP address, user-agent, _fbp/_fbc and an event ID for Pixel deduplication.",
    retentionSk: "Podľa pravidiel Meta. Bez marketingového súhlasu tieto marketingové atribučné údaje cez CAPI neposielame.",
    retentionEn: "According to Meta's policies. Without marketing consent we do not send these marketing attribution details through CAPI.",
  },
];

const CATEGORY_TEXT: Record<Category, { sk: string; en: string }> = {
  necessary: { sk: "Nevyhnutné", en: "Necessary" },
  functional: { sk: "Funkčné", en: "Functional" },
  analytics: { sk: "Analytické", en: "Analytics" },
  marketing: { sk: "Marketingové", en: "Marketing" },
};

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSavedConsent, setHasSavedConsent] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [consent, setConsent] = useState<Consent>(emptyConsent());

  useEffect(() => {
    setMounted(true);

    const saved = readStoredConsent();
    if (saved) {
      setConsent(saved);
      setHasSavedConsent(true);
    } else {
      // First visit (or expired/old consent): show only the simple consent panel.
      setShowDetails(false);
      setOpen(true);
    }

    function handleOpenSettings() {
      const latest = readStoredConsent();
      if (latest) setConsent(latest);
      setShowDetails(true);
      setHasSavedConsent(Boolean(latest));
      setOpen(true);
    }

    window.addEventListener("chvostikovo-open-cookie-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("chvostikovo-open-cookie-settings", handleOpenSettings);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted) return null;

  const isEnglish = window.location.pathname.startsWith("/en/");

  function save(next: Pick<Consent, "functional" | "analytics" | "marketing">) {
    const stored = writeStoredConsent(next);
    if (stored) setConsent(stored);
    setHasSavedConsent(true);
    setOpen(false);
  }

  function acceptAll() {
    save({ functional: true, analytics: true, marketing: true });
  }

  function rejectAll() {
    save({ functional: false, analytics: false, marketing: false });
  }

  function savePreferences() {
    save({
      functional: consent.functional,
      analytics: consent.analytics,
      marketing: consent.marketing,
    });
  }

  function toggleCategory(category: Exclude<Category, "necessary">, checked: boolean) {
    setConsent((current) => ({ ...current, [category]: checked }));
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-forest/50 px-2 pb-2 pt-16 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className={`${showDetails ? "max-w-4xl" : "max-w-2xl"} max-h-[calc(100vh-1rem)] w-full overflow-y-auto rounded-3xl border border-forest/10 bg-card p-4 text-forest shadow-2xl sm:p-6`}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p id="cookie-consent-title" className="font-display text-lg font-bold sm:text-xl">
              {showDetails
                ? isEnglish ? "Cookie settings" : "Nastavenia cookies"
                : isEnglish ? "We use cookies" : "Používame cookies"}
            </p>

            {!showDetails && (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-forest/75 sm:text-base">
                {isEnglish
                  ? "Necessary cookies keep the website working. With your consent, we also use functional, analytics and marketing cookies to improve the website and measure our advertising. "
                  : "Nevyhnutné cookies zabezpečujú fungovanie webu. S vaším súhlasom používame aj funkčné, analytické a marketingové cookies na zlepšovanie webu a meranie reklamy. "}
                <a
                  href={isEnglish ? "/en/cookies" : "/cookies"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-coral underline underline-offset-2 hover:text-coral-dark"
                >
                  {isEnglish ? "Cookie policy" : "Pravidlá používania cookies"}
                </a>
              </p>
            )}

            {showDetails && (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-forest/70">
                {isEnglish
                  ? "Choose which optional cookies you allow. You can also open each service below for more details."
                  : "Vyberte si, ktoré voliteľné cookies povolíte. Nižšie si môžete rozkliknúť aj podrobnosti ku konkrétnym službám."}
              </p>
            )}
          </div>

          {hasSavedConsent && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isEnglish ? "Close cookie settings" : "Zavrieť nastavenia cookies"}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition hover:bg-coral hover:text-white sm:size-9"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CategoryToggle
                title={CATEGORY_TEXT.necessary[isEnglish ? "en" : "sk"]}
                description={isEnglish
                  ? "Required for basic website functions and remembering your choice."
                  : "Potrebné na základné fungovanie webu a uloženie vašej voľby."}
                checked
                disabled
                onChange={() => undefined}
              />
              <CategoryToggle
                title={CATEGORY_TEXT.functional[isEnglish ? "en" : "sk"]}
                description={isEnglish
                  ? "Optional functions such as the Google map."
                  : "Voliteľné funkcie, napríklad Google mapa."}
                checked={consent.functional}
                onChange={(checked) => toggleCategory("functional", checked)}
              />
              <CategoryToggle
                title={CATEGORY_TEXT.analytics[isEnglish ? "en" : "sk"]}
                description={isEnglish
                  ? "Website traffic and usage measurement."
                  : "Meranie návštevnosti a používania webu."}
                checked={consent.analytics}
                onChange={(checked) => toggleCategory("analytics", checked)}
              />
              <CategoryToggle
                title={CATEGORY_TEXT.marketing[isEnglish ? "en" : "sk"]}
                description={isEnglish
                  ? "Advertising performance and conversion measurement."
                  : "Meranie účinnosti reklám a konverzií."}
                checked={consent.marketing}
                onChange={(checked) => toggleCategory("marketing", checked)}
              />
            </div>

            <div className="border-t border-forest/10 pt-4">
              <p className="font-display text-base font-bold text-forest">
                {isEnglish ? "Which services do we use?" : "Aké služby používame?"}
              </p>
              <p className="mt-1 text-sm text-forest/60">
                {isEnglish
                  ? "Tap a service for purpose, processed data and retention information."
                  : "Kliknite na službu a zobrazí sa účel, spracúvané údaje a informácia o uchovávaní."}
              </p>

              <div className="mt-3 space-y-2">
                {SERVICES.map((service) => {
                  const active =
                    service.category === "necessary" ||
                    (service.category === "functional" && consent.functional) ||
                    (service.category === "analytics" && consent.analytics) ||
                    (service.category === "marketing" && consent.marketing);
                  const expanded = expandedService === service.name;

                  return (
                    <div key={service.name} className="rounded-2xl border border-forest/10 bg-secondary/30 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedService(expanded ? null : service.name)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-forest">{service.name}</p>
                          <p className="mt-0.5 text-xs text-forest/55">{service.provider}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            active ? "bg-card text-forest" : "bg-card/60 text-forest/40"
                          }`}>
                            {CATEGORY_TEXT[service.category][isEnglish ? "en" : "sk"]}
                          </span>
                          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-3 space-y-2 border-t border-forest/10 pt-3 text-sm leading-relaxed text-forest/70">
                          <p>
                            <strong className="text-forest">{isEnglish ? "Purpose:" : "Účel:"}</strong>{" "}
                            {isEnglish ? service.purposeEn : service.purposeSk}
                          </p>
                          <p>
                            <strong className="text-forest">{isEnglish ? "Processed data:" : "Spracúvané údaje:"}</strong>{" "}
                            {isEnglish ? service.dataEn : service.dataSk}
                          </p>
                          <p>
                            <strong className="text-forest">{isEnglish ? "Retention:" : "Uchovávanie:"}</strong>{" "}
                            {isEnglish ? service.retentionEn : service.retentionSk}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-coral px-5 py-3 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-coral-dark sm:text-base"
          >
            {isEnglish ? "Accept all" : "Prijať všetky"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showDetails) savePreferences();
              else setShowDetails(true);
            }}
            className="rounded-full border border-forest/25 bg-secondary px-4 py-3 font-display text-sm font-semibold text-forest whitespace-nowrap transition hover:bg-coral-soft sm:text-base"
          >
            {showDetails
              ? isEnglish ? "Save settings" : "Uložiť nastavenia"
              : isEnglish ? "Customize" : "Prispôsobiť"}
          </button>

          <button
            type="button"
            onClick={rejectAll}
            className="rounded-full border border-forest/25 bg-card px-5 py-3 font-display text-sm font-semibold text-forest transition hover:bg-secondary sm:text-base"
          >
            {isEnglish ? "Necessary only" : "Len nevyhnutné"}
          </button>
        </div>

        {showDetails && (
          <p className="mt-3 text-center text-xs text-forest/50">
            {isEnglish
              ? "You can change this choice at any time via Cookie settings in the footer."
              : "Svoju voľbu môžete kedykoľvek zmeniť cez Nastavenia cookies v pätičke."}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryToggle({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-secondary/45 p-3.5">
      <div>
        <p className="font-display text-sm font-bold text-forest">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-forest/60">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-forest" : "bg-forest/20"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
