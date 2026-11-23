import { z } from "zod";

export const PRODUCT_INQUIRY_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/product-inquiry-submit";

/** UI accepts address, city, postal code in ONE original field.
 * The deployed legacy product endpoint accepts exactly one comma:
 * "street city, postal". Normalize only the payload, not the user's input.
 * No Supabase schema/function change or marketing processing. */
export function normalizeProductLocation(input: string): string {
  const compact = input.trim().replace(/\s+/g, " ");
  const match = compact.match(/^(.+?)[, ]+([0-9]{3} ?[0-9]{2})$/u);
  const placePart = match?.[1];
  const postcode = match?.[2];
  if (!placePart || !postcode) return compact;
  const place = placePart.replace(/\s*,\s*/g, " ").trim();
  return `${place}, ${postcode}`;
}

export const standInquirySchema = z.object({
  client_submission_id: z.string().uuid(),
  product_type: z.literal("stand"),
  customer_name: z.string().trim().min(2).max(160),
  phone: z.string().trim().regex(/^\+\d{7,15}$/),
  email: z.string().trim().email().max(200),
  customer_location: z.string().trim().max(120).regex(/^[^,]{2,80},\s*.{2,20}$/u),
  source_ref: z.string().max(500),
  consent: z.literal(true),
  company: z.string().max(200).optional(),
  configuration: z.object({
    size: z.enum(["small", "large", "extra_large"]),
    color: z.enum(["natural", "dark", "white", "custom"]),
    dog_height_cm: z.number().min(10).max(120),
    name_on_stand: z.string().trim().max(40),
    letter_color: z.enum(["light", "dark", "black", "custom"]),
  }),
});

export const targetInquirySchema = z.object({
  client_submission_id: z.string().uuid(),
  product_type: z.literal("target"),
  customer_name: z.string().trim().min(2).max(160),
  phone: z.string().trim().regex(/^\+\d{7,15}$/),
  email: z.string().trim().email().max(200),
  customer_location: z.string().trim().max(120).regex(/^[^,]{2,80},\s*.{2,20}$/u),
  source_ref: z.string().max(500),
  consent: z.literal(true),
  company: z.string().max(200).optional(),
  configuration: z.object({
    size: z.enum(["small", "large"]),
    height_cm: z.number().min(3).max(60).nullable(),
    note: z.string().trim().max(1000),
  }),
});

export const productInquirySchema = z.discriminatedUnion("product_type", [
  standInquirySchema,
  targetInquirySchema,
]);

export type StandInquiryInput = z.infer<typeof standInquirySchema>;
export type TargetInquiryInput = z.infer<typeof targetInquirySchema>;
export type ProductInquiryInput = z.infer<typeof productInquirySchema>;

export async function submitProductInquiry(input: ProductInquiryInput) {
  const payload = productInquirySchema.parse({
    ...input,
    customer_location: normalizeProductLocation(input.customer_location),
  });
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
