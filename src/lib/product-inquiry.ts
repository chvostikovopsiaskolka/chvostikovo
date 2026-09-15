import { z } from "zod";

export const PRODUCT_INQUIRY_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/product-inquiry-submit";

export const standInquirySchema = z.object({
  client_submission_id: z.string().uuid(),
  product_type: z.literal("stand"),
  customer_name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(200),
  source_ref: z.string().max(500),
  company: z.string().max(200).optional(),
  configuration: z.object({
    size: z.enum(["small", "large"]),
    color: z.enum(["natural", "dark", "white", "custom"]),
    dog_height_cm: z.number().min(10).max(120),
    name_on_stand: z.string().trim().max(40),
    letter_color: z.enum(["light", "dark", "black", "custom"]),
  }),
});

export type StandInquiryInput = z.infer<typeof standInquirySchema>;

export async function submitProductInquiry(input: StandInquiryInput) {
  const payload = standInquirySchema.parse(input);
  const response = await fetch(PRODUCT_INQUIRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = typeof body?.error === "string" ? body.error : `submit_failed_${response.status}`;
    throw new Error(code);
  }

  return body as { ok: true; inquiry_id: number; duplicate?: boolean };
}
