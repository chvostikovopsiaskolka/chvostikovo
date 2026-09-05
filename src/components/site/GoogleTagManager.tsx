import { useEffect } from "react";

const STORAGE_KEY = "chvostikovo-cookies";
const GTM_ID = "GTM-WDMHSCZD";

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

function pushConsentToDataLayer(consent: Consent) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "consent_update",
    consent: {
      ad_storage: consent.marketing ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
    },
  });
}

function loadGTM() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; google_tag_manager?: unknown };
  if (w.google_tag_manager) return;

  const consent = getConsent();

  // Initialize dataLayer with default consent before GTM loads
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "consent_default",
    consent: {
      ad_storage: consent?.marketing ? "granted" : "denied",
      analytics_storage: consent?.analytics ? "granted" : "denied",
      ad_user_data: consent?.marketing ? "granted" : "denied",
      ad_personalization: consent?.marketing ? "granted" : "denied",
    },
  });
  w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  // Noscript iframe fallback for users without JavaScript
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";

  const noscript = document.createElement("noscript");
  noscript.appendChild(iframe);
  document.body.appendChild(noscript);
}

export function GoogleTagManager() {
  useEffect(() => {
    function tryLoad() {
      const consent = getConsent();
      if (consent && (consent.analytics || consent.marketing)) {
        loadGTM();
        pushConsentToDataLayer(consent);
      }
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
