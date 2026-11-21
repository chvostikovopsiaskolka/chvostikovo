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

const ariaVisit = shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Mám záujem využívať škôlku pravidelne", plemeno: "Írsky vlkodav",
});
const ariaPayload = buildDbPayload(ariaVisit);
assert(ariaPayload.form_type === "lead" && ariaPayload.interest_reason === ariaVisit.zaujem,
  "Preview breed must not change the backend-allowlisted lead interest.");
assert(ariaPayload.raw_payload["Plemeno psíka"] === "Írsky vlkodav" && ariaPayload.dog_breed === "Írsky vlkodav",
  "Optional breed must survive the existing lead's raw payload.");
const ariaInfoPayload = buildDbPayload(shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Chcem sa informovať o škôlke",
}));
assert(!("dog_breed" in ariaInfoPayload) && !("Plemeno psíka" in ariaInfoPayload.raw_payload),
  "An empty information-only enquiry must not fabricate dog breed.");
const ariaInfoWithBreed = buildDbPayload(shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Chcem sa informovať o škôlke", plemeno: "Írsky vlkodav",
}));
assert(ariaInfoWithBreed.interest_reason === "Chcem sa informovať o škôlke" &&
  ariaInfoWithBreed.dog_breed === "Írsky vlkodav" &&
  ariaInfoWithBreed.raw_payload["Plemeno psíka"] === "Írsky vlkodav",
  "Information-only enquiry must persist an optionally provided breed using the current lead contract.");
assert(!shortSchema.safeParse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Mám záujem využívať škôlku občasne", plemeno: "x".repeat(201),
}).success, "Preview breed must respect the 200-character limit.");

// Aria puppy checker: transfer the *answers* into the existing allowlisted
// lead raw_payload, never into the validated interest_reason or ad events.
const puppyAnswers = {
  age_months: 7, dog_name: "Mia", dog_breed: "Doga", dog_weight_kg: 18.5,
  vaccines: { rabies: "yes", dhppi: "no", kennel: "unknown" },
};
const puppyLead = shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Mám záujem o škôlku pre šteniatko", puppy_check: puppyAnswers,
});
const puppyPayload = buildDbPayload(puppyLead);
const revisedPuppy = buildDbPayload(shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Mám záujem o škôlku pre šteniatko", plemeno: "Írsky vlkodav",
  puppy_check: { ...puppyAnswers, dog_breed: "Írsky vlkodav" },
}));
assert(revisedPuppy.dog_breed === "Írsky vlkodav" &&
  revisedPuppy.raw_payload["Plemeno psíka"] === "Írsky vlkodav" &&
  revisedPuppy.raw_payload["Šteniatko – plemeno"] === "Írsky vlkodav",
  "An edited puppy breed must be identical in the contact lead and attached puppy-check summary.");
assert(puppyPayload.form_type === "lead" && puppyPayload.interest_reason === "Mám záujem o škôlku pre šteniatko",
  "Puppy checker must preserve the Edge allowlist interest.");
for (const [key, value] of [
  ["Šteniatko – vek", "7 mesiacov"], ["Šteniatko – meno", "Mia"],
  ["Šteniatko – plemeno", "Doga"], ["Šteniatko – váha", "18.5 kg"],
  ["Šteniatko – besnota", "Áno"], ["Šteniatko – DHPPi+L", "Nie"],
  ["Šteniatko – kotercový kašeľ", "Neviem"],
  ["Šteniatko – výsledok orientačnej kontroly", "Potrebné individuálne posúdenie"],
] as const) assert(puppyPayload.raw_payload[key] === value, "Puppy payload dropped field: " + key);
const eligiblePuppy = buildDbPayload(shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Mám záujem o škôlku pre šteniatko",
  puppy_check: { age_months: 5, vaccines: { rabies: "yes", dhppi: "yes", kennel: "yes" } },
}));
assert(eligiblePuppy.raw_payload["Šteniatko – výsledok orientačnej kontroly"] === "Predbežne splnené",
  "Fully vaccinated puppy must still get an orientational, never final, result.");
assert(!("Šteniatko – vek" in ariaPayload.raw_payload),
  "Normal regular lead must not invent puppy assessment data.");
assert(!shortSchema.safeParse({ ...puppyLead, puppy_check: { ...puppyAnswers, age_months: 30 } }).success,
  "Puppy age must be within the actual checker range.");
assert(!shortSchema.safeParse({ ...puppyLead, puppy_check: { ...puppyAnswers, dog_weight_kg: 400 } }).success,
  "Puppy weight cannot exceed 150 kg.");
assert(!shortSchema.safeParse({ ...puppyLead, puppy_check: { ...puppyAnswers, vaccines: { ...puppyAnswers.vaccines, rabies: "unconfirmed" } } }).success,
  "Puppy vaccine state must be an explicit yes/no/unknown.");


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
  vek: "2 roky", kastrovana: "Áno", duvod: "Pravidelne – 1× alebo viackrát týždenne",
  alergie: "", povaha: "Priateľský a pokojný.",
  pes2: "Druhý", plemeno2: "Retríver", vaha2: "19,5 kg", pohlavie2: "Fenka",
  vek2: "3 roky", kastrovana2: "Nie",
  alergie2: "Citlivé trávenie", povaha2: "Hravá a spoločenská.",
};
const parsedTwoDogs = inquirySchema.parse(twoDogApplication);
const dualPayload = buildDbPayload(parsedTwoDogs);
assert(dualPayload.dogs?.[1]?.interest_reason === twoDogApplication.duvod, "Both dogs must share the first usage choice.");
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
  customer_location: "Košice, 040 01",
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
  customer_location: "Košice, 040 01",
  source_ref: "/target-na-cvicenie-pre-psov",
  consent: true,
  configuration: {
    size: "small",
    height_cm: 20,
    note: "Test",
  },
});

assert(!standInquirySchema.safeParse({
  client_submission_id: "00000000-0000-4000-8000-000000000001",
  product_type: "stand",
  customer_name: "Test",
  phone,
  email: "test@example.com",
  customer_location: "Košice 04001",
  source_ref: "/stojan-na-misky-pre-psa",
  consent: true,
  configuration: { size: "small", color: "natural", dog_height_cm: 40, name_on_stand: "", letter_color: "dark" },
}).success, "Product city/postcode must be separated by a comma");
const forms = readFileSync(new URL("../src/components/site/Forms.tsx", import.meta.url), "utf8");
assert(!forms.includes('name="duvod2"'), "Second usage selector must not be rendered.");

// v305: shared 1/2-dog application usage is one required radio group with three compact cards.
// Keep backend compatibility for historical submissions and record the broadened regular choice.
const applicationSource = forms.slice(forms.indexOf("export function LongForm"));
assert(applicationSource.includes('name="duvod" value={option.value} aria-label={option.value} required'), "The application requires a native accessible radio choice.");
assert(applicationSource.includes("grid-cols-3") && applicationSource.includes("min-h-20") && applicationSource.includes("peer-checked:border-coral") && applicationSource.includes("peer-focus-visible:outline") && applicationSource.includes("-webkit-tap-highlight-color:transparent"), "Three cards must retain size, selection, focus and mobile touch styling.");
assert(applicationSource.includes('lines: ["Pravidelne", "1× alebo viackrát", "týždenne"]') && applicationSource.includes('lines: ["Občas", "podľa potreby"]') && applicationSource.includes('lines: ["Jednorazové", "stráženie"]'), "Application wording must not limit weekly visits to one or two.");
assert(!applicationSource.includes('<select id={`l-${formId}-duvod`') && !applicationSource.includes("defaultChecked"), "No application usage dropdown or preselected radio.");
assert(applicationSource.includes('duvod: String(fd.get("duvod") ?? "")'), "Do not alter submission mapping.");
assert((applicationSource.match(/name="duvod"/g) || []).length === 1, "Single shared usage field even for two dogs.");
for (const usage of ["Pravidelne – 1× alebo viackrát týždenne", "Občas podľa potreby", "Jednorazové stráženie"]) {
  assert(applicationSource.includes(usage), "Original categories and broadened regular choice must remain visible.");
  const parsed = longSchema.parse({ ...twoDogApplication, dog_count: "1", duvod: usage });
  assert(buildDbPayload(parsed).interest_reason === usage, "One-dog application must preserve the selected usage in CRM.");
  const dual = buildDbPayload(inquirySchema.parse({ ...twoDogApplication, duvod: usage }));
  assert(dual.dogs?.[0]?.interest_reason === usage && dual.dogs?.[1]?.interest_reason === usage, "Both dogs must share the correct usage value.");
}
assert(!longSchema.safeParse({ ...twoDogApplication, duvod: "" }).success, "Unselected application usage must not submit.");
const backendUsageSrc = readFileSync(new URL("../supabase/functions/web-form-submit/index.ts", import.meta.url), "utf8");
for (const usage of ["Pravidelne – 1 až 2× týždenne", "Pravidelne – 1× alebo viackrát týždenne", "Občas podľa potreby", "Jednorazové stráženie"]) {
  assert(backendUsageSrc.includes(`'${usage}'`), "Backend allowlist must keep both the old and the new application usage values.");
}

assert((forms.match(/<LeadPhoneReceipt /g)||[]).length===2, "Lead and application must both offer the same phone receipt.");
const englishForm = readFileSync(new URL("../src/components/site/EnglishInquiryForm.tsx", import.meta.url), "utf8");
const progressSource = readFileSync(new URL("../src/lib/form-progress.ts", import.meta.url), "utf8");
assert(forms.includes("progress.onInvalidCapture") && forms.includes("progress.onBlurCapture"), "SK forms must record browser-native validation and per-field completion.");
assert(englishForm.includes("progress.onInvalidCapture"), "EN enquiry must record native validation.");
 
// v304: English landing and modal share exactly three visible native radio options.
// The display text is compact but the original CRM-compatible English values stay unchanged.
assert(englishForm.includes('type="radio" name="interest" value={option.value} required aria-label={option.value}'), "EN guided interest requires a mandatory accessible native radio group.");
assert(englishForm.includes("grid-cols-3") && englishForm.includes("peer-checked:border-coral") && englishForm.includes("peer-focus-visible:outline") && englishForm.includes("-webkit-tap-highlight-color:transparent"), "EN cards need three columns, clear selection, keyboard focus, and no iOS tap highlight.");
assert(englishForm.includes('lines: ["Learn more", "about daycare"]') && englishForm.includes('lines: ["Regular", "visits"]') && englishForm.includes('lines: ["Occasional", "visits"]'), "EN short labels must preserve the exact three categories.");
assert(!englishForm.includes("One-off daytime care") && !englishForm.includes('<select id={`en-${formId}-interest`'), "Remove the fourth EN option and dropdown only.");
assert(!englishForm.includes("defaultChecked") && !englishForm.includes('checked={'), "Do not preselect EN enquiry radio options.");
assert(englishForm.includes('fd.get("interest")') && englishForm.includes('zaujem: `EN – Dog daycare enquiry | ${interest}`'), "Preserve original EN -> CRM mapping and tracking.");
for (const enInterest of ["I just want more information", "Regular daycare visits", "Occasional daycare"]) {
  assert(englishForm.includes(enInterest), "Original EN CRM values must remain unchanged.");
  const fullInterest = `EN – Dog daycare enquiry | ${enInterest}`;
  const payload = shortSchema.parse({ typ: "informacie", consent: true, meno: "Test", telefon: phone, zaujem: fullInterest });
  assert(buildDbPayload(payload).interest_reason === fullInterest, "Every selected EN interest value must be preserved in CRM.");
}
assert(!shortSchema.safeParse({ typ: "informacie", consent: true, meno: "Test", telefon: phone, zaujem: "" }).success, "Unselected English interest must remain invalid.");

assert(progressSource.includes("hasAnalyticsConsent()"), "Field analytics must require analytics consent.");
assert(!progressSource.includes("JSON.stringify(target.value)") && !progressSource.includes("event.target.value"), "Never transmit form values in diagnostics.");
assert(forms.includes("hideInterest = false"), "Critical form check failed: informational interest selector is not enabled by default.");

// v303: three visible Slovak ShortForm choices; same required field and CRM contract.
// Guided LEAD pilot: exact new UI choices must persist as exact CRM interest_reason values.
const stagedLeadSource = readFileSync(new URL("../src/components/site/LeadStepForm.tsx", import.meta.url), "utf8");
const stagedLeadLanding = readFileSync(new URL("../src/routes/psia-skolka-kosice.tsx", import.meta.url), "utf8");
const allowedStagedInterests = [
  "Chcem sa informovať o škôlke",
  "Mám záujem využívať škôlku pravidelne",
  "Mám záujem využívať škôlku občasne",
];
for (const value of allowedStagedInterests) {
  assert(stagedLeadSource.includes(`value: "${value}"`), "Guided lead choice missing from UI: " + value);
  assert(backendUsageSrc.includes(`'${value}'`), "Guided lead choice missing from backend allowlist: " + value);
  const payload = buildDbPayload(shortSchema.parse({ typ: "informacie", consent: true, meno: "Test", telefon: phone, zaujem: value }));
  assert(payload.interest_reason === value, "New interest must be stored verbatim");
}
assert(stagedLeadSource.includes('const [breed, setBreed] = useState(puppyCheck?.dog_breed ?? "")') &&
  stagedLeadSource.includes('name="plemeno"') &&
  stagedLeadSource.includes("dog_breed: breedValue || undefined") &&
  !stagedLeadSource.includes("showBreed") && !stagedLeadSource.includes("ariaPreview && selectedInterest"),
  "One optional, editable breed field must appear in every SK enquiry including puppy contact, keeping the attached puppy breed in sync.");
const releasedLeadRoute = readFileSync(new URL("../src/routes/psia-skolka-kosice.tsx", import.meta.url), "utf8");
const approvedLeadAria = readFileSync(new URL("../src/routes/test-aria.tsx", import.meta.url), "utf8");
assert(releasedLeadRoute.includes('component: AriaPreviewPage') &&
  releasedLeadRoute.includes('content: "noindex, follow"') &&
  approvedLeadAria.includes('isLiveLead') &&
  approvedLeadAria.includes('lead_landing_aria_info') &&
  approvedLeadAria.includes('lead_landing_aria_hero_inline') &&
  approvedLeadAria.includes("<AriaLeadAssistant") &&
  approvedLeadAria.includes('<LeadStepForm key={leadModalSource}'),
  "Approved paid LEAD Aria must preserve campaign SEO, consent-aware analytics, inline and modal form contracts");
const ariaDock = readFileSync(new URL("../src/components/site/AriaLeadAssistant.tsx", import.meta.url), "utf8");
const liveAnalytics = readFileSync(new URL("../src/lib/analytics.ts", import.meta.url), "utf8");
assert(approvedLeadAria.includes('onOpenDockInterest={() => isLiveLead ? openLeadModal("lead_landing_mobile_dock")') &&
  approvedLeadAria.includes('lead_landing_aria_first_visit_inline') &&
  approvedLeadAria.includes('trackMarketingInteraction("inquiry_cta", source)') &&
  approvedLeadAria.includes('trackCookielessInteraction("inquiry_cta", source)'),
  "Live Aria dock, first-visit form and all CTA entry points must retain conversion attribution");
assert(ariaDock.includes('trackMarketingInteraction("view_pricing", source)') &&
  ariaDock.includes('mobile_dock_lead_lead-pricing') &&
  ariaDock.includes('mobile_dock_lead_menu_open') &&
  ariaDock.includes('mobile_menu_lead_lead-first-visit') &&
  ariaDock.includes('trackCookielessInteraction("nav_click", source, "sk")'),
  "Aria navigation, pricing and first-visit actions must retain cookieless plus consented GA4/Meta measurement");
assert(stagedLeadSource.indexOf('const result = await submitInquiry(') <
  stagedLeadSource.indexOf('trackMetaFormConversion("informacie"') &&
  stagedLeadSource.indexOf('const result = await submitInquiry(') <
  stagedLeadSource.indexOf('trackCookielessInteraction("form_submit"') &&
  liveAnalytics.includes('pushAnalyticsEvent("generate_lead"') &&
  liveAnalytics.includes('trackMetaStandard("Lead", params, eventId)'),
  "Only successful inquiry submission can generate a GA4 generate_lead or Meta Lead conversion");
// Legacy LeadLandingPage remains in the module only as a revert fallback;
// enforce the actual live route separately rather than counting legacy forms.
assert(stagedLeadSource.includes("zaujem: selectedInterest") && stagedLeadSource.includes("name=\"zaujem\"") && stagedLeadSource.includes("PrivacyConsentCheckbox"), "Guided form must preserve interest, consent and submission");
assert(stagedLeadSource.includes('name="meno"') && stagedLeadSource.includes('name="email"') && stagedLeadSource.includes('<PhoneField'), "Guided form must preserve contact fields and autofill");
assert(stagedLeadSource.includes('startFormAttempt(trackingSource)') && stagedLeadSource.includes('trackMetaFormConversion("informacie"') && stagedLeadSource.includes('LeadPhoneReceipt'), "Guided form must retain conversion idempotency, receipt and phone correction");
assert((stagedLeadLanding.match(/<LeadStepForm /g) || []).length === 6, "LEAD must reuse the guided form in mobile/desktop hero, benefits, after requirements, footer and modal");
assert(stagedLeadLanding.indexOf("<Reviews />") < stagedLeadLanding.indexOf('id="lead-form"'), "Reviews must precede the first mobile lead form");
assert(stagedLeadLanding.indexOf('id="lead-pricing"') < stagedLeadLanding.indexOf('<Requirements id="lead-requirements" />') && stagedLeadLanding.indexOf('<Requirements id="lead-requirements" />') < stagedLeadLanding.indexOf('id="lead-form-pricing"'), "Pricing must go directly to conditions then an open form");
assert(stagedLeadLanding.includes('trackingSource="lead_landing_benefits_inline"'), "Why Chvostikovo must offer an open guided form");
assert(stagedLeadLanding.indexOf('id="lead-form"') < stagedLeadLanding.indexOf('id="lead-benefits"'), "Mobile form must precede Why Chvostikovo");
assert(stagedLeadLanding.indexOf('id="lead-pricing"') < stagedLeadLanding.indexOf('id="lead-form-pricing"'), "Pricing form must follow pricing");
assert(stagedLeadLanding.includes('scrollToLeadForm("lead_landing_hero_interest")') && stagedLeadLanding.includes('openLeadModal("lead_landing_mobile_dock")'), "Lead hero CTA must scroll while the mobile dock opens the enquiry modal");
assert(stagedLeadLanding.includes('openLeadModal("lead_landing_friendship_20261028")'), "Friendship CTA modal must remain");
assert(!stagedLeadLanding.includes("ContactRevealButton"), "Inline lead forms must not be hidden behind reveal controls");

const shortFormSource = forms.slice(forms.indexOf("export function ShortForm"), forms.indexOf("/** Inline binary choices"));
assert(shortFormSource.includes("!hideInterest") && shortFormSource.includes('name="zaujem"'), "Hidden-interest variants and the existing zaujem name must remain.");
assert(shortFormSource.includes('type="radio" name="zaujem" value={option.value} aria-label={option.value} required'), "Visible short-form interest must use a mandatory native radio group.");
assert(shortFormSource.includes("grid-cols-3") && shortFormSource.includes("peer-checked:border-coral") && shortFormSource.includes("peer-focus-visible:outline") && shortFormSource.includes("-webkit-tap-highlight-color:transparent"), "Three responsive choices must retain selected and keyboard focus states without a touch highlight.");
assert(!shortFormSource.includes('name="zaujem" required className="field"'), "Remove only the original short-form native dropdown.");
assert(shortFormSource.includes("Potrebujem škôlku občas") && !shortFormSource.includes("Potrebujem jednorazové stráženie"), "Only the one-off-sitting option must remain hidden in the short-form UI.");
assert(shortFormSource.includes("Chcem zistiť") && shortFormSource.includes("viac o škôlke"), "First option must show the shortened two-line label.");
assert(!shortFormSource.includes("defaultChecked") && !shortFormSource.includes('checked={'), "No radio option may start selected.");
for (const interest of ["Chcem sa dozvedieť viac o psej škôlke", "Mám záujem o pravidelné návštevy", "Potrebujem škôlku občas"]) {
  assert(shortFormSource.includes(interest), "All three original Slovak values must remain unmodified.");
  const parsed = shortSchema.parse({ typ: "informacie", consent: true, meno: "Test", telefon: phone, zaujem: interest });
  assert(buildDbPayload(parsed).interest_reason === interest, "Selected interest text must arrive unchanged in the CRM payload.");
}
assert(!shortSchema.safeParse({ typ: "informacie", consent: true, meno: "Test", telefon: phone, zaujem: "" }).success, "Blank interest must remain invalid.");

// v306: typography-only changes in the three option groups; input value attributes are unchanged.
assert(applicationSource.includes('option.value === "Občas podľa potreby"') && applicationSource.includes("text-xs font-bold sm:text-[13px]") && applicationSource.includes("text-[10px] font-normal sm:text-[11px]"), "Application choice titles must be bold and descriptions smaller; occasional full title bold.");
assert(shortFormSource.includes('option.value === "Potrebujem škôlku občas"') && shortFormSource.includes("text-xs font-bold sm:text-[13px]") && shortFormSource.includes("text-[10px] font-normal sm:text-[11px]"), "SK enquiry choice titles must stand out without changing option values.");
assert(englishForm.includes('i === 0 ? "font-bold" : "font-medium"') && englishForm.includes("peer-checked:border-coral"), "EN guided enquiry cards must preserve accessible visual hierarchy.");
assert(applicationSource.includes("min-h-20") && !applicationSource.includes("min-h-24"), "Only application usage cards should be more compact.");


assert(forms.includes('name="email"') && englishForm.includes('name="email"'), "Enquiry forms must offer optional email.");
assert(forms.includes('LeadPhoneReceipt') && englishForm.includes('LeadPhoneReceipt'), "Receipts must display a submitted phone.");
const receiptSource = readFileSync(new URL("../src/components/site/LeadPhoneReceipt.tsx", import.meta.url), "utf8");
const smsDelayMigration = readFileSync(new URL("../supabase/migrations/20261013_lead_sms_two_minute_delay.sql", import.meta.url), "utf8");
assert(receiptSource.includes("smsQueued") && receiptSource.includes("SMS bude odoslaná na aktualizované číslo."), "Phone correction must confirm queued SMS or explain a previously sent SMS.");
assert(stagedLeadSource.includes("Príde vám SMS potvrdenie o prijatí záujmu") && forms.includes("Príde vám SMS potvrdenie o prijatí záujmu") && englishForm.includes("You will receive an SMS confirmation") && !receiptSource.includes("približne o 2 minúty"), "Success copy must promise SMS receipt without timing.");
assert(smsDelayMigration.includes("new.created_at + interval '2 minutes'") && smsDelayMigration.includes("greatest(available_at,v_created_at+interval '2 minutes')"), "Queued lead SMS must retain the two-minute delay even after correction.");
assert(smsDelayMigration.includes("new.form_type='lead'") && smsDelayMigration.includes("ELSE now()"), "Application SMS must not be delayed.");

const backend = readFileSync(new URL("../supabase/functions/web-form-submit/index.ts", import.meta.url), "utf8");
assert(backend.includes('securityLimitV336') && backend.includes('securityAccessV336'),
  "Production Edge security additions must be retained when adding puppy notification fields.");
assert(backend.includes('--- KONTROLA ŠTENIATKA (ÚDAJE OD MAJITEĽA) ---') &&
  backend.includes("input.raw_payload") && backend.includes("'Šteniatko – kotercový kašeľ'"),
  "Operator notification must include the submitted puppy-check fields, not just the lead interest.");
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
assert(productBackend.includes("customer_location") && productBackend.includes("securityLimitV336"), "Location persistence must retain LIVE product rate limiting");

await import("./tracking-form-checks");
await import("./form-autofill-checks");
await import("./form-alert-checks");
await import("./application-dog-details-checks");
await import("./application-health-fields-checks");

console.log("Critical form checks passed.");
