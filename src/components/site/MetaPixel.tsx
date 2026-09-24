import { useEffect, useRef } from "react";
import { trackMarketingInteraction } from "@/lib/analytics";

const STORAGE_KEY = "chvostikovo-cookies";
const PIXEL_ID = "1592305991362085";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const consent = JSON.parse(raw) as Consent;
    return consent.marketing === true;
  } catch {
    return false;
  }
}

function loadPixelBaseCode(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const w = window as unknown as Record<string, unknown>;
  if (w["fbq"] && document.getElementById("facebook-pixel-script")) {
    return true;
  }

  const existing = document.getElementById("facebook-pixel-script");
  if (existing) return true;

  const script = document.createElement("script");
  script.id = "facebook-pixel-script";
  script.async = true;
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
  return true;
}

function initPixel() {
  if (typeof window === "undefined") return;

  loadPixelBaseCode();

  const w = window as unknown as Record<string, unknown>;
  // fbq might not be ready immediately after script injection, so retry briefly
  const tryInit = (attempts = 0) => {
    const fbq = w["fbq"] as ((...args: unknown[]) => void) | undefined;
    if (fbq) {
      fbq("init", PIXEL_ID);
      // We track meaningful actions explicitly in our own code.
      // Disable Meta's automatic/codeless button events (e.g. SubscribedButtonClick)
      // so they do not pollute Events Manager or duplicate our Contact/CTA events.
      fbq("set", "autoConfig", false, PIXEL_ID);
      fbq("track", "PageView");
      return;
    }
    if (attempts < 10) {
      setTimeout(() => tryInit(attempts + 1), 100);
    }
  };
  tryInit();
}

function clickSource(anchor: HTMLAnchorElement) {
  if (anchor.closest("#informujte-sa")) return "inquiry_section";
  if (anchor.closest("#top")) return "hero";
  if (anchor.closest("#prva-navsteva")) return "first_visit";
  if (anchor.closest("#preco")) return "why_daycare";
  if (anchor.closest("#kontakt")) return "contact";
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  return "site";
}

function handleTrackedClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return;

  const href = anchor.getAttribute("href") ?? "";

  if (href.startsWith("tel:")) {
    trackMarketingInteraction("phone_click", clickSource(anchor));
    return;
  }

  if (href === "#informujte-sa" || href === "/#informujte-sa") {
    trackMarketingInteraction("inquiry_cta", clickSource(anchor));
    return;
  }

  if ((href === "#cennik" || href === "/#cennik") && anchor.closest("header")) {
    trackMarketingInteraction("view_pricing", "header_menu");
  }
}

export function MetaPixel() {
  const initializedRef = useRef(false);

  useEffect(() => {
    function tryInit() {
      if (hasMarketingConsent() && !initializedRef.current) {
        initPixel();
        initializedRef.current = true;
      }
    }

    tryInit();

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) tryInit();
    }

    function handleConsentChanged() {
      tryInit();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("chvostikovo-consent-changed", handleConsentChanged);
    document.addEventListener("click", handleTrackedClick);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("chvostikovo-consent-changed", handleConsentChanged);
      document.removeEventListener("click", handleTrackedClick);
    };
  }, []);

  return null;
}
