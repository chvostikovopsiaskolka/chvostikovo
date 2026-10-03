import { useEffect } from "react";

const ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/website-landing-event";

function safeReferrerHost() {
  if (typeof document === "undefined" || !document.referrer) return "";
  try {
    return new URL(document.referrer).hostname.slice(0, 253);
  } catch {
    return "";
  }
}

function navigationType() {
  if (typeof performance === "undefined") return "other";
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type || "other";
}

export function CookielessLandingTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const params = url.searchParams;

    const payload = {
      path: `${url.pathname}${url.hash || ""}`.slice(0, 500),
      language: url.pathname.startsWith("/en/") ? "en" : "sk",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
      utm_id: params.get("utm_id") || "",
      has_fbclid: params.has("fbclid"),
      referrer_host: safeReferrerHost(),
      navigation_type: navigationType(),
    };

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
