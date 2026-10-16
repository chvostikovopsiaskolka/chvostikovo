import { preserveFailedContact, clearRecoveredContact, stageContactDraft } from "./form-recovery";
import { buildDbPayload, inquirySchema, SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";
import { hasMarketingConsent } from "./consent";
import { normalizePhone } from "./phone";
import { InquirySubmissionError } from "./form-errors";
import { sanitizeTracking } from "./tracking-sanitization";

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
async function submitInquiryCore(input: InquiryInput, attemptId?: string) {
  const normalized = { ...sanitizeTracking(input), telefon: normalizePhone(input.telefon) };
  const parsed = inquirySchema.safeParse(normalized);
  if (!parsed.success) throw new InquirySubmissionError("zod_validation", undefined,
    parsed.error.issues.map((issue) => ({ field: String(issue.path[0] || "typ"), code: issue.code })));
  const data = parsed.data;
  let marketingConsent = false;
  try {
    marketingConsent = hasMarketingConsent();
  } catch {
    // Storage may be unavailable in private/restricted browsers.
  }
  let metaEventId = `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) metaEventId = crypto.randomUUID();
  } catch { /* An unavailable tracking ID API must not block the contact. */ }

  let dbPayload: ReturnType<typeof buildDbPayload>;
  try {
    dbPayload = buildDbPayload(data);
  } catch {
    throw new InquirySubmissionError("payload");
  }
  const payload = {
    ...dbPayload,
    ...(attemptId ? { form_attempt_id: attemptId } : {}),
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
    const body=await res.json().catch(()=>null);
    const error=new InquirySubmissionError("backend_http",res.status);
    error.recoverySaved=body?.recovery_saved===true;throw error;
  }

  const result = await res.json().catch(() => null);
  if (result?.ok !== true) throw new InquirySubmissionError("backend_response", res.status);

  return {
    ok: true as const,
    databaseSaved: true,
    metaEventId,
    marketingConsent,
    phoneCorrection: result?.submission_id && result?.phone_edit_token
      ? { id: Number(result.submission_id), token: String(result.phone_edit_token) } : null,
  };
}

export async function submitInquiry(input: InquiryInput, attemptId?: string) {
  if(!attemptId){try{attemptId=crypto.randomUUID()}catch{attemptId="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return (c==="x"?r:(r&3)|8).toString(16)})}}
  stageContactDraft(input,attemptId);
  try{const result=await submitInquiryCore(input,attemptId);clearRecoveredContact();return result}
  catch(error){
    if(error instanceof InquirySubmissionError&&!error.recoverySaved)error.recoverySaved=await preserveFailedContact(input,attemptId);
    throw error;
  }
}

export async function correctInquiryPhone(auth: { id: number; token: string }, newPhone: string) {
  const phone = normalizePhone(newPhone);
  const response = await fetch(SUPABASE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "correct_lead_phone", submission_id: auth.id, edit_token: auth.token, phone }),
  });
  if (!response.ok) throw new InquirySubmissionError("backend_http", response.status);
  const result = await response.json().catch(() => null);
  if (result?.ok !== true) throw new InquirySubmissionError("backend_response", response.status);
  return { phone, smsQueued: result.sms_queued === true };
}
