import { buildDbPayload, inquirySchema, SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";

/**
 * Odoslanie formulára priamo z prehliadača — bez Lovable server runtime,
 * takže funguje aj na statickom hostingu (GitHub Pages).
 *
 * 1. Zápis do Supabase Edge Function `web-form-submit` (hlavná cesta).
 * 2. Best-effort e-mailové upozornenie cez `/api/public/notify-inquiry`
 *    (existuje iba pokiaľ web beží na Lovable hostingu; na statickom
 *    hostingu jednoducho zlyhá a ticho sa ignoruje).
 */

async function saveToDatabase(data: InquiryInput): Promise<boolean> {
  const res = await fetch(SUPABASE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDbPayload(data)),
  });
  if (!res.ok) {
    throw new Error(`Supabase submit failed [${res.status}]`);
  }
  return true;
}

async function notifyByEmail(data: InquiryInput): Promise<boolean> {
  const res = await fetch("/api/public/notify-inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Email notify failed [${res.status}]`);
  return true;
}

export async function submitInquiry(input: InquiryInput) {
  const data = inquirySchema.parse(input);

  const [dbResult, mailResult] = await Promise.allSettled([
    saveToDatabase(data),
    notifyByEmail(data),
  ]);

  const databaseSaved = dbResult.status === "fulfilled";
  const emailSent = mailResult.status === "fulfilled";

  if (!databaseSaved) console.error("DB save failed:", dbResult.reason);
  if (!emailSent) console.error("Email notify failed:", mailResult.reason);

  if (!databaseSaved && !emailSent) {
    throw new Error("Odoslanie zlyhalo.");
  }

  return { ok: true as const, databaseSaved, emailSent };
}
