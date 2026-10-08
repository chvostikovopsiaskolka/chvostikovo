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

function landingPath(url: URL, metaClickHash: string) {
  const cleanPath = `${url.pathname}${url.hash || ""}`.slice(0, 500);
  if (!metaClickHash) return cleanPath;

  const marker = `|chv2h:${metaClickHash}`;
  return `${cleanPath.slice(0, 500 - marker.length)}${marker}`;
}

function sessionGuardKey(url: URL, metaClickHash: string) {
  if (metaClickHash) return `chvostikovo:landing:meta-click:${metaClickHash}`;

  const params = url.searchParams;
  const safeParts = [
    url.pathname,
    url.hash,
    params.get("utm_source") || "",
    params.get("utm_medium") || "",
    params.get("utm_campaign") || "",
    params.get("utm_content") || "",
    params.get("utm_term") || "",
    params.get("utm_id") || "",
  ];
  return `chvostikovo:landing:session:${safeParts.join("|")}`;
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
    // Ignore storage failures; tracking must never affect the page.
  }
}

function landingConfirmedKey(guardKey: string) {
  return `${guardKey}:confirmed`;
}

function confirmLanding(guardKey: string) {
  try {
    window.sessionStorage.setItem(landingConfirmedKey(guardKey), "1");
  } catch {
    // Confirmation is only a resilience hint for later interaction tracking.
  }
}

export function CookielessLandingTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const send = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const fbclid = params.get("fbclid") || "";
      const metaClickHash = fbclid ? await sha256Hex(fbclid) : "";

      if (cancelled) return;

      const guardKey = sessionGuardKey(url, metaClickHash);
      if (!claimSessionGuard(guardKey)) return;

      const payload = {
        path: landingPath(url, metaClickHash),
        language: url.pathname.startsWith("/en/") ? "en" : "sk",
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: normalizeUtm(params.get("utm_campaign") || ""),
        utm_content: normalizeUtm(params.get("utm_content") || ""),
        utm_term: normalizeUtm(params.get("utm_term") || ""),
        utm_id: params.get("utm_id") || "",
        has_fbclid: Boolean(fbclid),
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
        else confirmLanding(guardKey);
      } catch {
        releaseSessionGuard(guardKey);
      }
    };

    void send();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
