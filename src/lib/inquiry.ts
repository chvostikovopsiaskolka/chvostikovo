import { z } from "zod";

/**
 * Zdieľaná (prehliadač + server) definícia formulárových dát a payloadov.
 * Neobsahuje žiadne tajné kľúče ani serverový kód, takže je bezpečná
 * pre statický build (GitHub Pages).
 */

export const shortSchema = z.object({
  typ: z.literal("informacie"),
  consent: z.literal(true),
  source_ref: z.string().max(300).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().min(7).max(60),
  zaujem: z.string().min(1).max(300),
});

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
});

export const inquirySchema = z.discriminatedUnion("typ", [shortSchema, longSchema]);

export type InquiryInput = z.infer<typeof inquirySchema>;

export const SUPABASE_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";

export function buildFields(data: InquiryInput): Array<{ label: string; value: string }> {
  if (data.typ === "informacie") {
    return [
      { label: "Meno majiteľa", value: data.meno },
      { label: "Telefón", value: data.telefon },
      { label: "O čo máte záujem?", value: data.zaujem },
      { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
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
