import { buildDbPayload, inquirySchema, SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";
import { hasMarketingConsent } from "./consent";
import { normalizePhone } from "./phone";
import { InquirySubmissionError } from "./form-errors";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  try {
    const value = document.cookie.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
    return value ? decodeURIComponent(value) : "";
  } catch {
    return "";
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
  const normalized = { ...input, telefon: normalizePhone(input.telefon) };
  const parsed = inquirySchema.safeParse(normalized);
  if (!parsed.success) throw new InquirySubmissionError("zod_validation");
  const data = parsed.data;
  let marketingConsent = false;
  try {
    marketingConsent = hasMarketingConsent();
  } catch {
    // Storage may be unavailable in private/restricted browsers.
  }
  const metaEventId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let dbPayload: ReturnType<typeof buildDbPayload>;
  try {
    dbPayload = buildDbPayload(data);
  } catch {
    throw new InquirySubmissionError("payload");
  }
  const payload = {
    ...dbPayload,
    marketing_consent: marketingConsent,
    meta_event_id: metaEventId,
    meta_fbp: marketingConsent ? getCookie("_fbp") : "",
    meta_fbc: marketingConsent ? getCookie("_fbc") || buildFbcFromCurrentUrl() : "",
  };

  let res: Response;
  try {
    res = await fetch(SUPABASE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new InquirySubmissionError("network");
  }

  if (!res.ok) {
    throw new InquirySubmissionError("backend_http", res.status);
  }

  const result = await res.json().catch(() => null);
  if (result?.ok !== true) throw new InquirySubmissionError("backend_response", res.status);

  return {
    ok: true as const,
    databaseSaved: true,
    metaEventId,
    marketingConsent,
  };
}
