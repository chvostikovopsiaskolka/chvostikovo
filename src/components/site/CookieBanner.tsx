import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
      } catch {
        setOpen(true);
      }
    }

    function handleOpenSettings() {
      setShowDetails(true);
      setOpen(true);
    }

    window.addEventListener("chvostikovo-open-cookie-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("chvostikovo-open-cookie-settings", handleOpenSettings);
  }, []);

  if (!mounted) return null;

  const isEnglish = window.location.pathname.startsWith("/en/");

  function save(next: Consent) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setOpen(false);
    window.dispatchEvent(
      new CustomEvent("chvostikovo-consent-changed", { detail: next })
    );
  }

  function acceptAll() {
    save({ necessary: true, analytics: true, marketing: true });
  }

  function savePreferences() {
    save({ ...consent, necessary: true });
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-2 sm:px-5 sm:pb-6">
      <div className="pointer-events-auto max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-forest/10 bg-card p-4 text-forest shadow-2xl sm:p-6">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold sm:text-xl">
              {isEnglish ? "We use cookies" : "Používame cookies"}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-forest/75 sm:text-base">
              {isEnglish
                ? "We use cookies to keep the website working properly and to improve your experience. "
                : "Používame cookies na správne fungovanie stránky a zlepšenie vašej skúsenosti. "}
              <Link to={isEnglish ? "/en/cookies" : "/cookies"} className="font-semibold text-coral underline underline-offset-2 hover:text-coral-dark">
                {isEnglish ? "Cookie policy" : "Pravidlá používania cookies"}
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={isEnglish ? "Close cookie banner" : "Zavrieť banner"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-forest transition hover:bg-coral hover:text-white sm:size-9"
          >
            <X className="size-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 grid gap-3 rounded-2xl bg-secondary/70 p-3 sm:grid-cols-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-forest">
                  {isEnglish ? "Necessary cookies" : "Nevyhnutné cookies"}
                </p>
                <p className="mt-0.5 text-xs text-forest/65">
                  {isEnglish ? "Required for the basic operation of the website." : "Potrebné na základné fungovanie stránky."}
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
                  {isEnglish ? "Help us understand how visitors use the website." : "Pomáhajú nám pochopiť, ako používate stránku."}
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
                  {isEnglish ? "Used to measure advertising performance and relevant content." : "Na meranie účinnosti reklám a relevantný obsah."}
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

        <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={acceptAll}
            className="order-1 rounded-full bg-coral px-6 py-3 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-coral-dark sm:order-2 sm:min-w-40 sm:text-base"
          >
            {isEnglish ? "Accept all" : "Prijať všetky"}
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
            className="order-2 rounded-full border border-forest/20 bg-card px-6 py-3 font-display text-sm font-semibold text-forest transition hover:bg-secondary sm:order-1 sm:min-w-40 sm:text-base"
          >
            {showDetails
              ? isEnglish ? "Save" : "Uložiť"
              : isEnglish ? "Customize" : "Prispôsobiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
