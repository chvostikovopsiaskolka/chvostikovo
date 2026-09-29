import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "chvostikovo-cookies";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSavedConsent, setHasSavedConsent] = useState(false);
  const [consent, setConsent] = useState<Consent>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) {
      setOpen(true);
    } else {
      try {
        setConsent(JSON.parse(saved));
        setHasSavedConsent(true);
      } catch {
        setOpen(true);
      }
    }

    function handleOpenSettings() {
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

  function save(next: Consent) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setHasSavedConsent(true);
    setOpen(false);
    window.dispatchEvent(
      new CustomEvent("chvostikovo-consent-changed", { detail: next })
    );
  }

  function acceptAll() {
    save({ necessary: true, analytics: true, marketing: true });
  }

  function rejectAll() {
    save({ necessary: true, analytics: false, marketing: false });
  }

  function savePreferences() {
    save({ ...consent, necessary: true });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-forest/45 px-2 pb-2 pt-16 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-forest/10 bg-card p-4 text-forest shadow-2xl sm:p-6">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p id="cookie-consent-title" className="font-display text-lg font-bold sm:text-xl">
              {isEnglish ? "We use cookies" : "Používame cookies"}
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-forest/75 sm:text-base">
              {isEnglish
                ? "Necessary cookies keep the website working properly. Analytics and marketing cookies are used only with your consent. They help us improve the website and measure the effectiveness of our advertising. "
                : "Nevyhnutné cookies zabezpečujú správne fungovanie stránky. Analytické a marketingové cookies používame iba s vaším súhlasom. Pomáhajú nám zlepšovať web a vyhodnocovať účinnosť našej reklamy. "}
              <a
                href={isEnglish ? "/en/cookies" : "/cookies"}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-coral underline underline-offset-2 hover:text-coral-dark"
              >
                {isEnglish ? "Cookie policy" : "Pravidlá používania cookies"}
              </a>
            </p>
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
          <div className="mt-4 grid gap-3 rounded-2xl bg-secondary/70 p-3 sm:grid-cols-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-forest">
                  {isEnglish ? "Necessary cookies" : "Nevyhnutné cookies"}
                </p>
                <p className="mt-0.5 text-xs text-forest/65">
                  {isEnglish
                    ? "Required for basic website functions and to remember your cookie choice."
                    : "Potrebné na základné fungovanie webu a uloženie vašej voľby cookies."}
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                aria-label={isEnglish ? "Necessary cookies – always enabled" : "Nevyhnutné cookies – vždy zapnuté"}
                className="size-4 accent-coral sm:size-5"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-forest">
                  {isEnglish ? "Analytics cookies" : "Analytické cookies"}
                </p>
                <p className="mt-0.5 text-xs text-forest/65">
                  {isEnglish
                    ? "Help us understand website traffic and how visitors use the site."
                    : "Pomáhajú nám merať návštevnosť a pochopiť, ako návštevníci používajú web."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent((c) => ({ ...c, analytics: e.target.checked }))}
                aria-label={isEnglish ? "Analytics cookies" : "Analytické cookies"}
                className="size-4 accent-coral sm:size-5"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-forest">
                  {isEnglish ? "Marketing cookies" : "Marketingové cookies"}
                </p>
                <p className="mt-0.5 text-xs text-forest/65">
                  {isEnglish
                    ? "Help us measure advertising performance and marketing conversions."
                    : "Pomáhajú nám merať účinnosť reklám a marketingové konverzie."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent((c) => ({ ...c, marketing: e.target.checked }))}
                aria-label={isEnglish ? "Marketing cookies" : "Marketingové cookies"}
                className="size-4 accent-coral sm:size-5"
              />
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
            onClick={rejectAll}
            className="rounded-full border border-forest/25 bg-card px-5 py-3 font-display text-sm font-semibold text-forest transition hover:bg-secondary sm:text-base"
          >
            {isEnglish ? "Reject all" : "Odmietnuť všetky"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showDetails) {
                savePreferences();
              } else {
                setShowDetails(true);
              }
            }}
            className="rounded-full border border-forest/25 bg-secondary px-5 py-3 font-display text-sm font-semibold text-forest transition hover:bg-coral-soft sm:text-base"
          >
            {showDetails
              ? isEnglish ? "Save preferences" : "Uložiť nastavenia"
              : isEnglish ? "Customize" : "Prispôsobiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
