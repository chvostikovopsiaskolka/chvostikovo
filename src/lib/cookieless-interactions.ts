const ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/website-landing-event";

export type CookielessInteractionName =
  | "phone_click"
  | "explore_daycare"
  | "inquiry_cta"
  | "form_start"
  | "form_attempt"
  | "form_submit"
  | "form_error"
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

function landingPath(url: URL, metaClickHash: string) {
  const cleanPath = `${url.pathname}${url.hash || ""}`.slice(0, 500);
  if (!metaClickHash) return cleanPath;

  const marker = `|chv2h:${metaClickHash}`;
  return `${cleanPath.slice(0, 500 - marker.length)}${marker}`;
}

function landingGuardKey(url: URL, metaClickHash: string) {
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

function landingConfirmedKey(guardKey: string) {
  return `${guardKey}:confirmed`;
}

function isLandingConfirmed(guardKey: string) {
  try {
    return window.sessionStorage.getItem(landingConfirmedKey(guardKey)) === "1";
  } catch {
    return false;
  }
}

async function ensureLandingRecorded(url: URL, metaClickHash: string, language: "sk" | "en") {
  const guardKey = landingGuardKey(url, metaClickHash);
  if (isLandingConfirmed(guardKey)) return;

  // Give the root landing tracker a brief chance to finish first.
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  if (isLandingConfirmed(guardKey)) return;

  try {
    // If the normal landing tracker is still working, do not race it.
    if (window.sessionStorage.getItem(guardKey)) return;
    window.sessionStorage.setItem(guardKey, "1");
  } catch {
    // If storage is unavailable we can still attempt a best-effort recovery.
  }

  const params = url.searchParams;
  const payload = {
    path: landingPath(url, metaClickHash),
    language,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: normalizeUtm(params.get("utm_campaign") || ""),
    utm_content: normalizeUtm(params.get("utm_content") || ""),
    utm_term: normalizeUtm(params.get("utm_term") || ""),
    utm_id: params.get("utm_id") || "",
    has_fbclid: Boolean(params.get("fbclid")),
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
    if (result.ok) {
      try {
        window.sessionStorage.setItem(landingConfirmedKey(guardKey), "1");
      } catch {
        // Confirmation is optional.
      }
    } else {
      releaseSessionGuard(guardKey);
    }
  } catch {
    releaseSessionGuard(guardKey);
  }
}

export async function trackCookielessInteraction(
  eventName: CookielessInteractionName,
  eventSource: string,
  language: "sk" | "en" = "sk",
  attemptId?: string,
) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const trackedPaths = new Set([
    "/",
    "/psia-skolka-kosice",
    "/psia-skolka-kosice/",
    "/psia-skolka-pre-steniatka",
    "/psia-skolka-pre-steniatka/",
    "/strazenie-psov-kosice",
    "/strazenie-psov-kosice/",
    "/en/dog-daycare-kosice",
    "/en/dog-daycare-kosice/",
  ]);
  if (!trackedPaths.has(url.pathname)) return;

  const params = url.searchParams;
  const fbclid = params.get("fbclid") || "";
  const landingMetaClickHash = fbclid ? await sha256Hex(fbclid) : "";
  await ensureLandingRecorded(url, landingMetaClickHash, language);

  const metaClickHash = !attemptId ? landingMetaClickHash : "";
  const source = eventSource.slice(0, 200);
  // form_start is a page-level funnel step. Ignore placement in the guard so
  // browser autofill cannot count several rendered forms as several visitors.
  const guardSource = eventName === "form_start" ? "any_form" : source;
  const guardKey = metaClickHash
    ? `chvostikovo:interaction:meta:${metaClickHash}:${eventName}:${guardSource}`
    : `chvostikovo:interaction:session:${url.pathname}:${eventName}:${guardSource}`;

  if (!attemptId && !claimSessionGuard(guardKey)) return;

  const payload = {
    path: `${url.pathname}${url.hash || ""}`.slice(0, 500),
    event_name: eventName,
    event_source: source,
    language,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: normalizeUtm(params.get("utm_campaign") || ""),
    utm_content: normalizeUtm(params.get("utm_content") || ""),
    utm_term: normalizeUtm(params.get("utm_term") || ""),
    utm_id: params.get("utm_id") || "",
    has_fbclid: Boolean(fbclid),
    // Form attempts are counted individually, including retries from one ad click.
    meta_click_hash: attemptId ? null : metaClickHash || null,
    ...(attemptId ? { attempt_id: attemptId } : {}),
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

export function startFormAttempt(source: string, language: "sk" | "en" = "sk") {
  // Monitoring is optional: even restricted browser APIs must not block a form.
  try {
    const attemptId = globalThis.crypto.randomUUID();
    void trackCookielessInteraction("form_attempt", source, language, attemptId).catch(() => {});
    return attemptId;
  } catch {
    return undefined;
  }
}
