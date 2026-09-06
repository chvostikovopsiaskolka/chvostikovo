import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const STORAGE_KEY = "chvostikovo-cookies";
const GA_ID = "G-0VM48RXZV9";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type GtagWindow = Window & {
  dataLayer?: IArguments[] | unknown[];
  gtag?: (...args: unknown[]) => void;
  _chvGaLoaded?: boolean;
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

function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

/**
 * gtag MUST push the native `arguments` object (not an array) – gtag.js only
 * interprets arguments-shaped entries as commands.
 */
function ensureGtag(): (...args: unknown[]) => void {
  const w = window as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    // eslint-disable-next-line prefer-rest-params
    w.gtag = function gtag() {
      (w.dataLayer as unknown[]).push(arguments);
    } as (...args: unknown[]) => void;
  }
  return w.gtag;
}

function sendPageView() {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  if (!w._chvGaLoaded || !w.gtag) return;
  w.gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
    send_to: GA_ID,
  });
}

function loadGA() {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  if (w._chvGaLoaded) return;

  const gtag = ensureGtag();

  if (!document.getElementById("ga4-script")) {
    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  gtag("js", new Date());
  gtag("consent", "update", { analytics_storage: "granted" });
  // page_view is sent manually so route changes are tracked exactly once
  gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });

  w._chvGaLoaded = true;
  sendPageView();
}

export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    function tryLoad() {
      if (hasAnalyticsConsent()) loadGA();
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

  // Route changes: send an explicit page_view (skips the very first one,
  // which loadGA already sent).
  useEffect(() => {
    const w = window as GtagWindow;
    if (!w._chvGaLoaded) return;
    sendPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
