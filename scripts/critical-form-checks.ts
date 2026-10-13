import { readFileSync } from "node:fs";
import { shortSchema, longSchema } from "../src/lib/inquiry";
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
