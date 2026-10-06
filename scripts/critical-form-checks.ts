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

longSchema.parse({
  typ: "prihlaska",
  consent: true,
  meno: "Test",
  telefon: phone,
  pes: "Rocky",
  plemeno_vaha: "Labrador, 25 kg",
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
assert(forms.includes("hideInterest = false"), "Critical form check failed: informational interest selector is not enabled by default.");

const backend = readFileSync(new URL("../supabase/functions/web-form-submit/index.ts", import.meta.url), "utf8");
assert(backend.includes("/^\\+\\d{7,15}$/"), "Critical form check failed: web-form-submit phone regex is not the expected E.164 validation.");
assert(backend.includes("input.dry_run === true"), "Critical form check failed: backend dry-run smoke-test support is missing.");

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

await import("./form-autofill-checks");

console.log("Critical form checks passed.");
