import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { clearAnalyticsCookies, hasAnalyticsConsent } from "@/lib/consent";

const GA_ID = "G-0VM48RXZV9";

type GtagWindow = Window & {
  dataLayer?: IArguments[] | unknown[];
  gtag?: (...args: unknown[]) => void;
  _chvGaLoaded?: boolean;
  [key: `ga-disable-${string}`]: boolean | IArguments[] | unknown[] | ((...args: unknown[]) => void) | undefined;
};

function ensureGtag(): (...args: unknown[]) => void {
  const w = window as unknown as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      (w.dataLayer as unknown[]).push(arguments);
    } as (...args: unknown[]) => void;
  }
  return w.gtag;
}

function sendPageView() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  const w = window as unknown as GtagWindow;
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
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${GA_ID}`] = false;

  const gtag = ensureGtag();

  if (!w._chvGaLoaded) {
    if (!document.getElementById("ga4-script")) {
      const script = document.createElement("script");
      script.id = "ga4-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    }

    gtag("js", new Date());
    gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });
    w._chvGaLoaded = true;
  }

  gtag("consent", "update", { analytics_storage: "granted" });
  sendPageView();
}

function revokeGA() {
  if (typeof window === "undefined") return;
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${GA_ID}`] = true;
  w.gtag?.("consent", "update", { analytics_storage: "denied" });
  clearAnalyticsCookies();
}

export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.href });
  const firstRun = useRef(true);

  useEffect(() => {
    function applyConsent() {
      if (hasAnalyticsConsent()) loadGA();
      else revokeGA();
    }

    applyConsent();
    window.addEventListener("chvostikovo-consent-changed", applyConsent);
    return () => window.removeEventListener("chvostikovo-consent-changed", applyConsent);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    sendPageView();
  }, [pathname]);

  return null;
}
