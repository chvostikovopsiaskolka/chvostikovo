import { useEffect } from "react";
import { readStoredConsent, type Consent } from "@/lib/consent";

const GTM_ID = "GTM-WDMHSCZD";

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

function loadGTM(consent: Consent) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; google_tag_manager?: unknown };
  if (w.google_tag_manager) return;

  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "consent_default",
    consent: {
      ad_storage: consent.marketing ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
    },
  });
  w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

export function GoogleTagManager() {
  useEffect(() => {
    function applyConsent() {
      const consent = readStoredConsent();
      if (!consent) return;

      if (consent.analytics || consent.marketing) loadGTM(consent);
      pushConsentToDataLayer(consent);
    }

    applyConsent();
    window.addEventListener("chvostikovo-consent-changed", applyConsent);
    return () => window.removeEventListener("chvostikovo-consent-changed", applyConsent);
  }, []);

  return null;
}
