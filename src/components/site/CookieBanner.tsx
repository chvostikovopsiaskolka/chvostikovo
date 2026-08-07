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
    <div className="fixed right-0 bottom-0 z-50 p-2 sm:p-4">
      <div className="w-[calc(100vw-1rem)] max-w-xs rounded-2xl border border-cream/20 bg-forest p-3 text-cream shadow-2xl sm:max-w-sm sm:rounded-3xl sm:p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="font-display text-sm font-semibold sm:text-base">Používame cookies</p>
            <p className="mt-0.5 text-xs text-cream/80 sm:text-sm">
              Používame cookies na správne fungovanie stránky a zlepšenie vašej skúsenosti.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Zavrieť banner"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral sm:size-8"
          >
            <X className="size-3 sm:size-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mt-2 space-y-2 rounded-xl bg-cream/10 p-2 sm:mt-3 sm:space-y-3 sm:rounded-2xl sm:p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold sm:text-sm">Nevyhnutné cookies</p>
                <p className="text-[0.65rem] text-cream/70 sm:text-xs">Potrebné na základné fungovanie stránky.</p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                aria-label="Nevyhnutné cookies – vždy zapnuté"
                className="size-4 accent-coral sm:size-5"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold sm:text-sm">Analytické cookies</p>
                <p className="text-[0.65rem] text-cream/70 sm:text-xs">Pomáhajú nám pochopiť, ako používate stránku.</p>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent((c) => ({ ...c, analytics: e.target.checked }))}
                aria-label="Analytické cookies"
                className="size-4 accent-coral sm:size-5"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold sm:text-sm">Marketingové cookies</p>
                <p className="text-[0.65rem] text-cream/70 sm:text-xs">Na meranie účinnosti reklám a relevantný obsah.</p>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent((c) => ({ ...c, marketing: e.target.checked }))}
                aria-label="Marketingové cookies"
                className="size-4 accent-coral sm:size-5"
              />
            </div>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-coral px-3 py-1.5 font-display text-xs font-semibold text-primary-foreground transition hover:bg-coral/90 sm:px-4 sm:py-2 sm:text-sm"
          >
            Prijať všetky
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
            className="rounded-full px-2 py-1 text-xs font-semibold text-cream underline underline-offset-2 transition hover:text-coral sm:py-2 sm:text-sm"
          >
            {showDetails ? "Uložiť" : "Prispôsobiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
