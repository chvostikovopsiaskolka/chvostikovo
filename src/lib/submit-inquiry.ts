import { buildDbPayload, inquirySchema, SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";

const COOKIE_CONSENT_KEY = "chvostikovo-cookies";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const item = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

function hasMarketingConsent() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw) as { marketing?: boolean };
    return consent.marketing === true;
  } catch {
    return false;
  }
}

function buildFbcFromCurrentUrl() {
  if (typeof window === "undefined") return "";
  try {
    const fbclid = new URL(window.location.href).searchParams.get("fbclid");
    if (!fbclid) return "";
    return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    return "";
  }
}

/**
 * Odoslanie formulára priamo z prehliadača do Supabase Edge Function
 * `web-form-submit`, ktorá zapíše dáta do DB a odošle e-mailovú notifikáciu.
 * Pri marketingovom súhlase posielame aj Meta attribution údaje pre CAPI.
 */
export async function submitInquiry(input: InquiryInput) {
  const data = inquirySchema.parse(input);
  const marketingConsent = hasMarketingConsent();
  const metaEventId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const payload = {
    ...buildDbPayload(data),
    marketing_consent: marketingConsent,
    meta_event_id: metaEventId,
    meta_fbp: marketingConsent ? getCookie("_fbp") : "",
    meta_fbc: marketingConsent ? getCookie("_fbc") || buildFbcFromCurrentUrl() : "",
  };

  const res = await fetch(SUPABASE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Supabase submit failed [${res.status}]`);
  }

  return {
    ok: true as const,
    databaseSaved: true,
    emailSent: true,
    metaEventId,
    marketingConsent,
  };
}
