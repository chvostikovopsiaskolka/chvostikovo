const ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/website-landing-event";

export type CookielessInteractionName =
  | "phone_click"
  | "explore_daycare"
  | "inquiry_cta"
  | "form_start"
  | "form_submit"
  | "success_conditions_click"
  | "success_pricing_click";

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

async function sha256Hex(value: string) {
  if (!value || !globalThis.crypto?.subtle) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeUtm(value: string) {
  const plusNormalized = value.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusNormalized).replace(/\+/g, " ");
  } catch {
    return plusNormalized;
  }
}

function claimSessionGuard(key: string) {
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

function releaseSessionGuard(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Tracking must never affect the page.
  }
}

export async function trackCookielessInteraction(
  eventName: CookielessInteractionName,
  eventSource: string,
) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (url.pathname !== "/psia-skolka-kosice" && url.pathname !== "/psia-skolka-kosice/") return;

  const params = url.searchParams;
  const fbclid = params.get("fbclid") || "";
  const metaClickHash = fbclid ? await sha256Hex(fbclid) : "";
  const source = eventSource.slice(0, 200);
  const guardKey = metaClickHash
    ? `chvostikovo:interaction:meta:${metaClickHash}:${eventName}:${source}`
    : `chvostikovo:interaction:session:${url.pathname}:${eventName}:${source}`;

  if (!claimSessionGuard(guardKey)) return;

  const payload = {
    path: `${url.pathname}${url.hash || ""}`.slice(0, 500),
    event_name: eventName,
    event_source: source,
    language: "sk",
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: normalizeUtm(params.get("utm_campaign") || ""),
    utm_content: normalizeUtm(params.get("utm_content") || ""),
    utm_term: normalizeUtm(params.get("utm_term") || ""),
    utm_id: params.get("utm_id") || "",
    has_fbclid: Boolean(fbclid),
    meta_click_hash: metaClickHash || null,
    referrer_host: safeReferrerHost(),
    navigation_type: navigationType(),
  };

  try {
    const result = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!result.ok) releaseSessionGuard(guardKey);
  } catch {
    releaseSessionGuard(guardKey);
  }
}
