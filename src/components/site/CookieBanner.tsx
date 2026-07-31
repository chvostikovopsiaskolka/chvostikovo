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
  }, []);

  if (!mounted) return null;

  function save(next: Consent) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setOpen(false);
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
    <div className="fixed inset-x-0 bottom-0 z-50 p-2 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-cream/20 bg-forest p-4 text-cream shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-display text-base font-semibold sm:text-lg">Používame cookies</p>
            <p className="mt-1 text-sm text-cream/80">
              Na našej stránke používame cookies, aby sme zabezpečili jej správne fungovanie a
              mohli zlepšovať vašu skúsenosť.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Zavrieť banner"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral"
          >
            <X className="size-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 space-y-2 rounded-xl bg-cream/10 p-3 sm:mt-4 sm:space-y-3 sm:rounded-2xl sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Nevyhnutné cookies</p>
                <p className="text-xs text-cream/70">Potrebné na základné fungovanie stránky.</p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                aria-label="Nevyhnutné cookies – vždy zapnuté"
                className="size-5 accent-coral"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Analytické cookies</p>
                <p className="text-xs text-cream/70">
                  Pomáhajú nám pochopiť, ako používate našu stránku.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent((c) => ({ ...c, analytics: e.target.checked }))}
                aria-label="Analytické cookies"
                className="size-5 accent-coral"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Marketingové cookies</p>
                <p className="text-xs text-cream/70">
                  Používajú sa na meranie účinnosti reklám a relevantný obsah.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent((c) => ({ ...c, marketing: e.target.checked }))}
                aria-label="Marketingové cookies"
                className="size-5 accent-coral"
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-coral px-4 py-2 font-display text-sm font-semibold text-primary-foreground transition hover:bg-coral/90 sm:px-5 sm:py-2.5"
          >
            Súhlasím so všetkými
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-full border border-cream/30 px-4 py-2 font-display text-sm font-semibold text-cream transition hover:bg-cream/10 sm:px-5 sm:py-2.5"
          >
            Odmietnuť voliteľné
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
            className="rounded-full px-3 py-2 text-sm font-semibold text-cream underline underline-offset-2 transition hover:text-coral sm:py-2.5"
          >
            {showDetails ? "Uložiť nastavenia" : "Upraviť nastavenia"}
          </button>
        </div>
      </div>
    </div>
  );
}
