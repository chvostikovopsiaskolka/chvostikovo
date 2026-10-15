import { readFileSync } from "node:fs";
import { shortSchema, longSchema, inquirySchema, buildDbPayload } from "../src/lib/inquiry";
import { standInquirySchema, targetInquirySchema } from "../src/lib/product-inquiry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const phone = "+421915349028";

shortSchema.parse({
  typ: "informacie",
  consent: true,
  meno: "Test",
  telefon: phone,
  zaujem: "Mám záujem o pravidelné návštevy",
});

shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  email: "test@example.com", zaujem: "Mám záujem o pravidelné návštevy",
});
assert(!shortSchema.safeParse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  email: "nesprávny-adresát", zaujem: "Mám záujem o pravidelné návštevy",
}).success, "Invalid optional email should be rejected.");

longSchema.parse({
  typ: "prihlaska",
  consent: true,
  meno: "Test",
  telefon: phone,
  pes: "Rocky",
  plemeno: "Labrador",
  vaha: "25 kg",
  pohlavie: "Pes",
  vek: "2 roky",
  kastrovana: "Áno",
  duvod: "Pravidelne – 1 až 2× týždenne",
  viac: "Test validácie formulára.",
});


const twoDogApplication = {
  typ: "prihlaska" as const, consent: true as const, meno: "Test", telefon: phone,
  dog_count: "2" as const,
  pes: "Prvý", plemeno: "Labrador", vaha: "25 kg", pohlavie: "Pes",
  vek: "2 roky", kastrovana: "Áno", duvod: "Pravidelne – 1 až 2× týždenne",
  alergie: "", povaha: "Priateľský a pokojný.",
  pes2: "Druhý", plemeno2: "Retríver", vaha2: "19,5 kg", pohlavie2: "Fenka",
  vek2: "3 roky", kastrovana2: "Nie", duvod2: "Občas podľa potreby",
  alergie2: "Citlivé trávenie", povaha2: "Hravá a spoločenská.",
};
const parsedTwoDogs = inquirySchema.parse(twoDogApplication);
const dualPayload = buildDbPayload(parsedTwoDogs);
assert(dualPayload.form_type === "application" && "dogs" in dualPayload, "Two-dog form must remain one application.");
assert(dualPayload.dog_count === 2 && dualPayload.dogs.length === 2, "Application must include exactly two dog objects.");
assert(dualPayload.dogs[0].dog_name === "Prvý" && dualPayload.dogs[1].dog_name === "Druhý", "The dogs must retain their separate identities.");
assert(dualPayload.dogs[1].dog_weight_kg === 19.5 && dualPayload.dogs[1].dog_allergies === "Citlivé trávenie", "Second dog weight/health fields were lost.");
assert(dualPayload.owner_name === "Test" && dualPayload.phone === phone, "Both dogs must belong to the one submitted owner.");
assert(!inquirySchema.safeParse({ ...twoDogApplication, pes2: "" }).success, "Missing second dog's name must fail validation.");
assert(!inquirySchema.safeParse({ ...twoDogApplication, vaha2: "invalid" }).success, "Invalid second dog's weight must fail validation.");
assert(!inquirySchema.safeParse({ ...twoDogApplication, povaha2: "" }).success, "Missing second dog's temperament must fail validation.");
const oneDogPayload = buildDbPayload(inquirySchema.parse({ ...twoDogApplication, dog_count: "1" }));
assert(oneDogPayload.form_type === "application" && "dogs" in oneDogPayload && oneDogPayload.dog_count === 1 && oneDogPayload.dogs.length === 1, "Switching back to one dog must keep the old payload shape.");


standInquirySchema.parse({
  client_submission_id: "00000000-0000-4000-8000-000000000001",
  product_type: "stand",
  customer_name: "Test",
  phone,
  email: "test@example.com",
  source_ref: "/stojan-na-misky-pre-psa",
  consent: true,
  configuration: {
    size: "small",
    color: "natural",
    dog_height_cm: 40,
    name_on_stand: "TEST",
    letter_color: "dark",
  },
});

targetInquirySchema.parse({
  client_submission_id: "00000000-0000-4000-8000-000000000002",
  product_type: "target",
  customer_name: "Test",
  phone,
  email: "test@example.com",
  source_ref: "/target-na-cvicenie-pre-psov",
  consent: true,
  configuration: {
    size: "small",
    height_cm: 20,
    note: "Test",
  },
});

const forms = readFileSync(new URL("../src/components/site/Forms.tsx", import.meta.url), "utf8");
const englishForm = readFileSync(new URL("../src/components/site/EnglishInquiryForm.tsx", import.meta.url), "utf8");
const progressSource = readFileSync(new URL("../src/lib/form-progress.ts", import.meta.url), "utf8");
assert(forms.includes("progress.onInvalidCapture") && forms.includes("progress.onBlurCapture"), "SK forms must record browser-native validation and per-field completion.");
assert(englishForm.includes("progress.onInvalidCapture"), "EN enquiry must record native validation.");
assert(progressSource.includes("hasAnalyticsConsent()"), "Field analytics must require analytics consent.");
assert(!progressSource.includes("JSON.stringify(target.value)") && !progressSource.includes("event.target.value"), "Never transmit form values in diagnostics.");
assert(forms.includes("hideInterest = false"), "Critical form check failed: informational interest selector is not enabled by default.");
assert(forms.includes('name="email"') && englishForm.includes('name="email"'), "Enquiry forms must offer optional email.");
assert(forms.includes('LeadPhoneReceipt') && englishForm.includes('LeadPhoneReceipt'), "Receipts must display a submitted phone.");
const receiptSource = readFileSync(new URL("../src/components/site/LeadPhoneReceipt.tsx", import.meta.url), "utf8");
const smsDelayMigration = readFileSync(new URL("../supabase/migrations/20261013_lead_sms_two_minute_delay.sql", import.meta.url), "utf8");
assert(receiptSource.includes("smsQueued") && receiptSource.includes("SMS bude odoslaná na aktualizované číslo."), "Phone correction must confirm queued SMS or explain a previously sent SMS.");
assert(forms.includes("približne o 2 minúty") && englishForm.includes("about 2 minutes"), "Receipt copy must describe the deferred SMS.");
assert(smsDelayMigration.includes("new.created_at + interval '2 minutes'") && smsDelayMigration.includes("greatest(available_at,v_created_at+interval '2 minutes')"), "Queued lead SMS must retain the two-minute delay even after correction.");
assert(smsDelayMigration.includes("new.form_type='lead'") && smsDelayMigration.includes("ELSE now()"), "Application SMS must not be delayed.");

const backend = readFileSync(new URL("../supabase/functions/web-form-submit/index.ts", import.meta.url), "utf8");
assert(backend.includes("/^\\+\\d{7,15}$/"), "Critical form check failed: web-form-submit phone regex is not the expected E.164 validation.");
assert(backend.includes("input.dry_run === true"), "Critical form check failed: backend dry-run smoke-test support is missing.");
assert(backend.includes("correct_web_lead_phone_once") && backend.includes("phone_edit_token"), "Backend must implement the one-time phone correction.");

for (const interest of [
  "Chcem sa dozvedieť viac o psej škôlke",
  "Mám záujem o pravidelné návštevy",
  "Potrebujem škôlku občas",
  "Potrebujem jednorazové stráženie",
  "Mám záujem o škôlku pre šteniatko",
]) {
  assert(backend.includes(interest), `Critical form check failed: backend does not accept interest option: ${interest}`);
}

const productBackend = readFileSync(new URL("../supabase/functions/product-inquiry-submit/index.ts", import.meta.url), "utf8");
assert(productBackend.includes("/^\\+\\d{7,15}$/"), "Critical form check failed: product inquiry phone regex is not the expected E.164 validation.");

await import("./tracking-form-checks");
await import("./form-autofill-checks");
await import("./form-alert-checks");
await import("./application-dog-details-checks");
await import("./application-health-fields-checks");

console.log("Critical form checks passed.");
