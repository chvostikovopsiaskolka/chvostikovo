import { z } from "zod";
import { parseDogWeightKg } from "./dog-weight";
import { TRACKING_LIMITS } from "./tracking-sanitization";

/**
 * Zdieľaná (prehliadač + server) definícia formulárových dát a payloadov.
 * Neobsahuje žiadne tajné kľúče ani serverový kód, takže je bezpečná
 * pre statický build (GitHub Pages).
 */

const attributionSchema = z.object({
  landing_page: z.string().max(TRACKING_LIMITS.landing_page).optional(),
  referrer: z.string().max(TRACKING_LIMITS.referrer).optional(),
  traffic_source: z.string().max(TRACKING_LIMITS.traffic_source).optional(),
  traffic_medium: z.string().max(TRACKING_LIMITS.traffic_medium).optional(),
  utm_campaign: z.string().max(TRACKING_LIMITS.utm_campaign).optional(),
  utm_term: z.string().max(TRACKING_LIMITS.utm_term).optional(),
  utm_content: z.string().max(TRACKING_LIMITS.utm_content).optional(),
  cta_source: z.string().max(TRACKING_LIMITS.cta_source).optional(),
});

// Optional answers from Aria's puppy eligibility checker. These are recorded
// only when the owner explicitly submits the subsequent contact form.
export const puppyCheckSchema = z.object({
  age_months: z.number().int().min(1).max(12),
  dog_name: z.string().trim().max(70).optional(),
  dog_breed: z.string().trim().max(80).optional(),
  dog_weight_kg: z.number().min(0.1).max(150).optional(),
  vaccines: z.object({
    rabies: z.enum(["yes", "no", "unknown"]),
    dhppi: z.enum(["yes", "no", "unknown"]),
    kennel: z.enum(["yes", "no", "unknown"]),
  }),
});
export type PuppyCheckInput = z.infer<typeof puppyCheckSchema>;

export const shortSchema = z.object({
  typ: z.literal("informacie"),
  consent: z.literal(true),
  source_ref: z.string().max(TRACKING_LIMITS.source_ref).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().regex(/^\+\d{7,15}$/),
  zaujem: z.string().min(1).max(300),
  plemeno: z.string().trim().max(200).optional(),
  puppy_check: puppyCheckSchema.optional(),
  // One optional free-form question stored only with an explicit lead/contact submit.
  otazka: z.string().trim().min(5).max(600).optional(),
  preferovany_kontakt: z.enum(["telefon", "email"]).optional(),
  email: z.string().trim().email().max(254).optional(),
}).merge(attributionSchema);

export const longSchema = z.object({
  typ: z.literal("prihlaska"),
  consent: z.literal(true),
  source_ref: z.string().max(TRACKING_LIMITS.source_ref).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().regex(/^\+\d{7,15}$/),
  dog_count: z.enum(["1", "2"]).optional(),
  pes2: z.string().trim().max(200).optional(),
  plemeno2: z.string().trim().max(200).optional(),
  vaha2: z.string().optional(),
  pohlavie2: z.string().max(40).optional(),
  vek2: z.string().trim().max(100).optional(),
  kastrovana2: z.string().max(40).optional(),
  duvod2: z.string().max(300).optional(),
  alergie2: z.string().trim().max(3000).optional(),
  povaha2: z.string().trim().max(3000).optional(),
  pes: z.string().min(1).max(200),
  plemeno: z.string().trim().min(1).max(200),
  vaha: z.string().transform(parseDogWeightKg).refine((value): value is number => value !== null, "Zadajte platnú váhu v kilogramoch."),
  pohlavie: z.string().min(1).max(40),
  vek: z.string().min(1).max(100),
  kastrovana: z.string().min(1).max(40),
  duvod: z.string().min(1).max(300),
  // Legacy open tabs retain their original combined field.
  viac: z.string().trim().min(1).max(3000).optional(),
  alergie: z.string().trim().max(3000).optional(),
  povaha: z.string().trim().min(1).max(3000).optional(),
}).merge(attributionSchema);

export const inquirySchema = z.discriminatedUnion("typ", [shortSchema, longSchema]).superRefine((data, ctx) => {
  if (data.typ !== "prihlaska") return;
  if (data.dog_count === "2") {
    const second = [
      ["pes2", data.pes2], ["plemeno2", data.plemeno2], ["pohlavie2", data.pohlavie2],
      ["vek2", data.vek2], ["kastrovana2", data.kastrovana2],
      ["povaha2", data.povaha2],
    ] as const;
    for (const [field, value] of second) {
      if (!String(value || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Vyplňte údaje druhého psíka." });
    }
    if (parseDogWeightKg(data.vaha2 || "") === null) ctx.addIssue({
      code: z.ZodIssueCode.custom, path: ["vaha2"], message: "Zadajte platnú váhu druhého psíka.",
    });
  }
  if (data.alergie !== undefined || data.povaha !== undefined) {
    if (!data.povaha) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["povaha"], message: "Vyplňte toto pole." });
  } else if (!data.viac) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["viac"], message: "Vyplňte informácie o psíkovi." });
  }
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryData = z.output<typeof inquirySchema>;

export const SUPABASE_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";

function attributionFields(data: InquiryData): Array<{ label: string; value: string }> {
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

export function buildFields(data: InquiryData): Array<{ label: string; value: string }> {
  const attribution = attributionFields(data);

  if (data.typ === "informacie") {
    const vaccineText = { yes: "Áno", no: "Nie", unknown: "Neviem" } as const;
    const puppy = data.puppy_check;
    return [
      { label: "Meno majiteľa", value: data.meno },
      { label: "Telefón", value: data.telefon },
      ...(data.email ? [{ label: "E-mail", value: data.email }] : []),
      { label: "O čo máte záujem?", value: data.zaujem },
      ...(data.otazka ? [{ label: "Otázka návštevníka", value: data.otazka }] : []),
      ...(data.otazka && data.preferovany_kontakt ? [{
        label: "Preferovaný kontakt", value: data.preferovany_kontakt === "email" ? "E-mail" : "Telefón",
      }] : []),
      ...(data.plemeno ? [{ label: "Plemeno psíka", value: data.plemeno }] : []),
      ...(puppy ? [
        { label: "Šteniatko – vek", value: `${puppy.age_months} mesiacov` },
        ...(puppy.dog_name ? [{ label: "Šteniatko – meno", value: puppy.dog_name }] : []),
        ...(puppy.dog_breed ? [{ label: "Šteniatko – plemeno", value: puppy.dog_breed }] : []),
        ...(puppy.dog_weight_kg ? [{ label: "Šteniatko – váha", value: `${puppy.dog_weight_kg} kg` }] : []),
        { label: "Šteniatko – besnota", value: vaccineText[puppy.vaccines.rabies] },
        { label: "Šteniatko – DHPPi+L", value: vaccineText[puppy.vaccines.dhppi] },
        { label: "Šteniatko – kotercový kašeľ", value: vaccineText[puppy.vaccines.kennel] },
        { label: "Šteniatko – výsledok orientačnej kontroly", value: puppy.age_months >= 4 && Object.values(puppy.vaccines).every(v => v === "yes") ? "Predbežne splnené" : "Potrebné individuálne posúdenie" },
      ] : []),
      { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
      ...attribution,
    ];
  }
  return [
    { label: "Meno a priezvisko majiteľa", value: data.meno },
    { label: "Telefón", value: data.telefon },
    { label: "Meno psa", value: data.pes },
    { label: "Plemeno psa", value: data.plemeno },
    { label: "Váha psa", value: `${data.vaha} kg` },
    { label: "Pohlavie psa", value: data.pohlavie },
    { label: "Vek psa", value: data.vek },
    { label: "Kastrovaný / sterilizovaná", value: data.kastrovana },
    { label: "Ako plánujete využívať škôlku?", value: data.duvod },
    ...(data.alergie !== undefined || data.povaha !== undefined
      ? [{ label: "Alergie a zdravotné obmedzenia", value: data.alergie || "" },
        { label: "Povaha a ďalšie informácie", value: data.povaha || "" }]
      : [{ label: "Viac o psíkovi", value: data.viac || "" }]),
    ...(data.dog_count === "2" ? [
      { label: "Počet psíkov", value: "2" },
      { label: "2. psík – meno", value: data.pes2 || "" },
      { label: "2. psík – plemeno", value: data.plemeno2 || "" },
      { label: "2. psík – váha", value: data.vaha2 || "" },
      { label: "2. psík – pohlavie", value: data.pohlavie2 || "" },
      { label: "2. psík – vek", value: data.vek2 || "" },
      { label: "2. psík – kastrácia", value: data.kastrovana2 || "" },
      { label: "2. psík – alergie a zdravotné obmedzenia", value: data.alergie2 || "" },
      { label: "2. psík – povaha a ďalšie informácie", value: data.povaha2 || "" },
    ] : []),
    { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
    ...attribution,
  ];
}

export function buildDbPayload(data: InquiryData) {
  const source_ref = data.source_ref && data.source_ref.length > 0 ? data.source_ref : "/";
  const raw_payload = Object.fromEntries(buildFields(data).map((f) => [f.label, f.value]));

  if (data.typ === "informacie") {
    return {
      form_type: "lead",
      owner_name: data.meno,
      phone: data.telefon,
      ...(data.email ? { email: data.email } : {}),
      interest_reason: data.zaujem,
      ...(data.plemeno ? { dog_breed: data.plemeno } : {}),
      // Existing Edge persists non-column fields only in its raw_payload JSONB.
      // Keep the validated puppy answers structured for CRM/email, never append
      // them to the allowlisted interest_reason or create a second lead.
      ...(data.puppy_check ? { puppy_check: data.puppy_check } : {}),
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
    dog_count: data.dog_count === "2" ? 2 : 1,
    dogs: [
      {
        dog_name: data.pes, dog_breed: data.plemeno, dog_weight_kg: data.vaha,
        dog_sex: data.pohlavie, dog_age_text: data.vek, dog_neutered: data.kastrovana,
        interest_reason: data.duvod, dog_allergies: data.alergie || "",
        dog_temperament: data.povaha || data.viac || "",
      },
      ...(data.dog_count === "2" ? [{
        dog_name: data.pes2 || "", dog_breed: data.plemeno2 || "",
        dog_weight_kg: parseDogWeightKg(data.vaha2 || "") || null,
        dog_sex: data.pohlavie2 || "", dog_age_text: data.vek2 || "",
        dog_neutered: data.kastrovana2 || "", interest_reason: data.duvod,
        dog_allergies: data.alergie2 || "", dog_temperament: data.povaha2 || "",
      }] : []),
    ],
    owner_name: data.meno,
    phone: data.telefon,
    dog_name: data.pes,
    dog_breed: data.plemeno,
    dog_weight_kg: data.vaha,
    dog_sex: data.pohlavie,
    dog_age_text: data.vek,
    dog_neutered: data.kastrovana,
    interest_reason: data.duvod,
    dog_allergies: data.alergie ?? null,
    dog_temperament: data.povaha ?? null,
    dog_info: data.alergie !== undefined || data.povaha !== undefined
      ? `Alergie a zdravotné obmedzenia: ${data.alergie || ""}\n\nPovaha a ďalšie informácie: ${data.povaha || ""}`
      : data.viac || "",
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
