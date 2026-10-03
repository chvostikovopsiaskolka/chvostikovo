export const CONSENT_STORAGE_KEY = "chvostikovo-cookies";
export const CONSENT_VERSION = "2026-10-03-v2";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type Consent = {
  version: string;
  savedAt: string;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function emptyConsent(): Consent {
  return {
    version: CONSENT_VERSION,
    savedAt: "",
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };
}

export function readStoredConsent(): Consent | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.version !== CONSENT_VERSION || !parsed.savedAt) return null;

    const savedAt = Date.parse(parsed.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > CONSENT_MAX_AGE_MS) return null;

    return {
      version: CONSENT_VERSION,
      savedAt: parsed.savedAt,
      necessary: true,
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function writeStoredConsent(input: Omit<Consent, "version" | "savedAt" | "necessary"> & { necessary?: true }) {
  if (typeof window === "undefined") return;

  const next: Consent = {
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
    necessary: true,
    functional: input.functional === true,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("chvostikovo-consent-changed", { detail: next }));
  return next;
}

export function hasFunctionalConsent() {
  return readStoredConsent()?.functional === true;
}

export function hasAnalyticsConsent() {
  return readStoredConsent()?.analytics === true;
}

export function hasMarketingConsent() {
  return readStoredConsent()?.marketing === true;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const domains = ["", host, host ? `.${host}` : ""];

  for (const domain of domains) {
    document.cookie =
      `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ""} SameSite=Lax`;
  }
}

export function clearAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0] || "")
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  for (const name of names) deleteCookie(name);
}

export function clearMarketingCookies() {
  deleteCookie("_fbp");
  deleteCookie("_fbc");
}
