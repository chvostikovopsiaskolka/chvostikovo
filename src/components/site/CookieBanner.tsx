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

    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CONSENT_STORAGE_KEY) : null;
    const saved = readStoredConsent();

    if (saved) {
      setConsent(saved);
      setHasSavedConsent(true);
    } else {
      // Existing visitors with the previous consent format see the new detailed
      // settings automatically once after this consent-policy upgrade.
      setShowDetails(Boolean(raw));
      setOpen(true);
    }

    function handleOpenSettings() {
      const latest = readStoredConsent();
      if (latest) setConsent(latest);
      setShowDetails(true);
      setHasSavedConsent(true);
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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-forest/55 px-2 pb-2 pt-12 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-forest/10 bg-card p-4 text-forest shadow-2xl sm:p-6">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p id="cookie-consent-title" className="font-display text-xl font-bold sm:text-2xl">
              {isEnglish ? "Cookie settings" : "Nastavenie cookies"}
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-forest/75 sm:text-base">
              {isEnglish
                ? "Optional services start only after your consent. You can review the exact services, purpose, processed data and retention below."
                : "Voliteľné služby spúšťame iba po vašom súhlase. Nižšie si môžete pozrieť presné služby, ich účel, spracúvané údaje a dobu uchovávania."}
            </p>
          </div>

          {hasSavedConsent && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isEnglish ? "Close cookie settings" : "Zavrieť nastavenia cookies"}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition hover:bg-coral hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {showDetails ? (
          <div className="mt-5 space-y-4">
            <CategoryToggle
              title={CATEGORY_TEXT.necessary[isEnglish ? "en" : "sk"]}
              description={isEnglish
                ? "Required for remembering your cookie choice and basic website operation."
                : "Potrebné na uloženie vašej voľby a základné fungovanie webu."}
              checked
              disabled
              onChange={() => undefined}
            />
            <CategoryToggle
              title={CATEGORY_TEXT.functional[isEnglish ? "en" : "sk"]}
              description={isEnglish
                ? "Allows optional external functionality such as the Google map."
                : "Umožňujú voliteľné externé funkcie, napríklad Google mapu."}
              checked={consent.functional}
              onChange={(checked) => toggleCategory("functional", checked)}
            />
            <CategoryToggle
              title={CATEGORY_TEXT.analytics[isEnglish ? "en" : "sk"]}
              description={isEnglish
                ? "Help us understand traffic and how visitors use the website."
                : "Pomáhajú nám merať návštevnosť a pochopiť používanie webu."}
              checked={consent.analytics}
              onChange={(checked) => toggleCategory("analytics", checked)}
            />
            <CategoryToggle
              title={CATEGORY_TEXT.marketing[isEnglish ? "en" : "sk"]}
              description={isEnglish
                ? "Measure advertising performance and conversions from Meta/Facebook/Instagram."
                : "Merajú účinnosť reklám a konverzie z Meta/Facebook/Instagram."}
              checked={consent.marketing}
              onChange={(checked) => toggleCategory("marketing", checked)}
            />

            <div className="pt-1">
              <h3 className="font-display text-lg font-bold text-forest">
                {isEnglish ? "Services on this website" : "Služby na tejto webstránke"}
              </h3>
              <p className="mt-1 text-sm text-forest/65">
                {isEnglish
                  ? "Open a service to see what it is used for and what information may be processed."
                  : "Rozbaľte službu a pozrite si, na čo ju používame a aké údaje môže spracúvať."}
              </p>
            </div>

            <div className="space-y-3">
              {SERVICES.map((service) => {
                const active =
                  service.category === "necessary" ||
                  (service.category === "functional" && consent.functional) ||
                  (service.category === "analytics" && consent.analytics) ||
                  (service.category === "marketing" && consent.marketing);
                const expanded = expandedService === service.name;

                return (
                  <div key={service.name} className="rounded-2xl border border-forest/10 bg-secondary/35 p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedService(expanded ? null : service.name)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                    >
                      <div>
                        <p className="font-display font-bold text-forest">{service.name}</p>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-coral">
                          {service.provider}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          active ? "border-forest/15 bg-card text-forest" : "border-forest/10 text-forest/45"
                        }`}>
                          {CATEGORY_TEXT[service.category][isEnglish ? "en" : "sk"]}
                        </span>
                        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="mt-4 space-y-3 text-sm leading-relaxed text-forest/75">
                        <div>
                          <p className="font-bold text-forest">{isEnglish ? "Purpose" : "Účel"}</p>
                          <p>{isEnglish ? service.purposeEn : service.purposeSk}</p>
                        </div>
                        <div>
                          <p className="font-bold text-forest">{isEnglish ? "Processed data" : "Spracúvané údaje"}</p>
                          <p>{isEnglish ? service.dataEn : service.dataSk}</p>
                        </div>
                        <div>
                          <p className="font-bold text-forest">{isEnglish ? "Retention" : "Uchovávanie"}</p>
                          <p>{isEnglish ? service.retentionEn : service.retentionSk}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-forest/70">
            {isEnglish
              ? "Necessary storage is always enabled. Functional, analytics and marketing services remain off until you allow them."
              : "Nevyhnutné uloženie voľby je vždy zapnuté. Funkčné, analytické a marketingové služby ostávajú vypnuté, kým ich nepovolíte."}
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-full border border-forest/25 bg-card px-5 py-3 font-display text-sm font-semibold text-forest transition hover:bg-secondary sm:text-base"
          >
            {isEnglish ? "Reject all" : "Odmietnuť všetko"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showDetails) savePreferences();
              else setShowDetails(true);
            }}
            className="rounded-full border border-forest/25 bg-secondary px-5 py-3 font-display text-sm font-semibold text-forest transition hover:bg-coral-soft sm:text-base"
          >
            {showDetails
              ? isEnglish ? "Save settings" : "Uložiť nastavenia"
              : isEnglish ? "Customize" : "Prispôsobiť"}
          </button>

          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-coral px-5 py-3 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-coral-dark sm:text-base"
          >
            {isEnglish ? "Accept all" : "Prijať všetko"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-forest/55">
          {isEnglish ? "You can change your choice at any time in the footer under Cookie settings." : "Svoju voľbu môžete kedykoľvek zmeniť v pätičke cez Nastavenia cookies."}
        </p>
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-secondary/45 p-4">
      <div>
        <p className="font-display font-bold text-forest">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-forest/65">{description}</p>
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
