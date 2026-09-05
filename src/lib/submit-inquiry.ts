import { buildDbPayload, inquirySchema, SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";

/**
 * Odoslanie formulára priamo z prehliadača do Supabase Edge Function
 * `web-form-submit`, ktorá zapíše dáta do DB a odošle e-mailovú notifikáciu.
 * Žiadny Lovable server runtime — funguje aj na statickom hostingu.
 */

export async function submitInquiry(input: InquiryInput) {
  const data = inquirySchema.parse(input);

  const res = await fetch(SUPABASE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDbPayload(data)),
  });

  if (!res.ok) {
    throw new Error(`Supabase submit failed [${res.status}]`);
  }

  return { ok: true as const, databaseSaved: true, emailSent: true };
}
