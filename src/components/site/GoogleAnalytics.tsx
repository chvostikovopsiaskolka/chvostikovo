import { useEffect } from "react";

const STORAGE_KEY = "chvostikovo-cookies";
const GA_ID = "G-0VM48RXZV9";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function gtag(...args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

function loadGA() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: typeof gtag; _gaLoaded?: boolean };
  if (w._gaLoaded) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true });

  w.gtag = gtag;
  w._gaLoaded = true;
}

export function GoogleAnalytics() {
  useEffect(() => {
    function tryLoad() {
      const consent = getConsent();
      if (consent && consent.analytics) loadGA();
    }

    tryLoad();

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) tryLoad();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("chvostikovo-consent-changed", tryLoad);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("chvostikovo-consent-changed", tryLoad);
    };
  }, []);

  return null;
}
