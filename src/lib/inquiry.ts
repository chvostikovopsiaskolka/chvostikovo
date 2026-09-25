import { z } from "zod";

/**
 * Zdieľaná (prehliadač + server) definícia formulárových dát a payloadov.
 * Neobsahuje žiadne tajné kľúče ani serverový kód, takže je bezpečná
 * pre statický build (GitHub Pages).
 */

const attributionSchema = z.object({
  landing_page: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
  traffic_source: z.string().max(200).optional(),
  traffic_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(300).optional(),
  utm_term: z.string().max(300).optional(),
  utm_content: z.string().max(300).optional(),
  cta_source: z.string().max(200).optional(),
});

export const shortSchema = z.object({
  typ: z.literal("informacie"),
  consent: z.literal(true),
  source_ref: z.string().max(300).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().min(7).max(60),
  zaujem: z.string().min(1).max(300),
}).merge(attributionSchema);

export const longSchema = z.object({
  typ: z.literal("prihlaska"),
  consent: z.literal(true),
  source_ref: z.string().max(300).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().min(7).max(60),
  pes: z.string().min(1).max(200),
  plemeno_vaha: z.string().min(1).max(300),
  pohlavie: z.string().min(1).max(40),
  vek: z.string().min(1).max(100),
  kastrovana: z.string().min(1).max(40),
  duvod: z.string().min(1).max(300),
  viac: z.string().min(1).max(3000),
}).merge(attributionSchema);

export const inquirySchema = z.discriminatedUnion("typ", [shortSchema, longSchema]);

export type InquiryInput = z.infer<typeof inquirySchema>;

export const SUPABASE_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";

function attributionFields(data: InquiryInput): Array<{ label: string; value: string }> {
  return [
    { label: "Landing page", value: data.landing_page || "" },
    { label: "Referrer", value: data.referrer || "" },
    { label: "Traffic source", value: data.traffic_source || "" },
    { label: "Traffic medium", value: data.traffic_medium || "" },
    { label: "UTM campaign", value: data.utm_campaign || "" },
    { label: "UTM term", value: data.utm_term || "" },
    { label: "UTM content", value: data.utm_content || "" },
    { label: "CTA source", value: data.cta_source || "" },
  ];
}

export function buildFields(data: InquiryInput): Array<{ label: string; value: string }> {
  const attribution = attributionFields(data);

  if (data.typ === "informacie") {
    return [
      { label: "Meno majiteľa", value: data.meno },
      { label: "Telefón", value: data.telefon },
      { label: "O čo máte záujem?", value: data.zaujem },
      { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
      ...attribution,
    ];
  }
  return [
    { label: "Meno a priezvisko majiteľa", value: data.meno },
    { label: "Telefón", value: data.telefon },
    { label: "Meno psa", value: data.pes },
    { label: "Plemeno a váha psa", value: data.plemeno_vaha },
    { label: "Pohlavie psa", value: data.pohlavie },
    { label: "Vek psa", value: data.vek },
    { label: "Kastrovaný / sterilizovaná", value: data.kastrovana },
    { label: "Ako plánujete využívať škôlku?", value: data.duvod },
    { label: "Viac o psíkovi", value: data.viac },
    { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
    ...attribution,
  ];
}

export function buildDbPayload(data: InquiryInput) {
  const source_ref = data.source_ref && data.source_ref.length > 0 ? data.source_ref : "/";
  const raw_payload = Object.fromEntries(buildFields(data).map((f) => [f.label, f.value]));

  if (data.typ === "informacie") {
    return {
      form_type: "lead",
      owner_name: data.meno,
      phone: data.telefon,
      interest_reason: data.zaujem,
      consent: true,
      source_ref,
      landing_page: data.landing_page || "",
      referrer: data.referrer || "",
      traffic_source: data.traffic_source || "",
      traffic_medium: data.traffic_medium || "",
      utm_campaign: data.utm_campaign || "",
      utm_term: data.utm_term || "",
      utm_content: data.utm_content || "",
      cta_source: data.cta_source || "",
      raw_payload,
    };
  }

  return {
    form_type: "application",
    owner_name: data.meno,
    phone: data.telefon,
    dog_name: data.pes,
    dog_breed_weight: data.plemeno_vaha,
    dog_sex: data.pohlavie,
    dog_age_text: data.vek,
    dog_neutered: data.kastrovana,
    interest_reason: data.duvod,
    dog_info: data.viac,
    consent: true,
    source_ref,
    raw_payload,
  };
}
