import { runInNewContext } from "node:vm";
import { transpileModule, ScriptTarget, ModuleKind } from "typescript";
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

// APP-01: a free Aria question is an ordinary consented information lead,
// never a second chat backend nor an unvalidated ad attribution string.
const ariaQuestion = buildDbPayload(shortSchema.parse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  email: "test@example.com", zaujem: "Chcem sa informovať o škôlke",
  otazka: "Je škôlka vhodná pre bojazlivejšieho psíka?",
}));
assert(ariaQuestion.interest_reason === "Chcem sa informovať o škôlke" &&
  ariaQuestion.raw_payload["Otázka návštevníka"] === "Je škôlka vhodná pre bojazlivejšieho psíka?",
  "A free-form question must be retained in existing lead raw_payload.");
assert(!shortSchema.safeParse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Chcem sa informovať o škôlke", otazka: "x".repeat(601),
}).success, "An oversized Aria question must never bypass validation.");
assert(!shortSchema.safeParse({
  typ: "informacie", consent: true, meno: "Test", telefon: phone,
  zaujem: "Chcem sa informovať o škôlke", otazka: "x",
}).success, "An empty or too-short question must not create a lead.");
const ariaBackend = readFileSync(new URL("../supabase/functions/web-form-submit/index.ts", import.meta.url), "utf8");
assert(ariaBackend.includes("invalid_aria_question") &&
  ariaBackend.includes("Otázka návštevníka") &&
  ariaBackend.includes("lines.push(`Otázka návštevníka: ${question}`)"),
  "Aria question must be validated on the server and delivered in operator email.");

// A plain question remains a contact, NOT a paid marketing conversion,
// even if the visitor granted GA4/Meta measurement consent.
const ariaFormsSource = readFileSync(new URL("../src/components/site/Forms.tsx", import.meta.url), "utf8");
const ariaAnalyticsSource = readFileSync(new URL("../src/lib/analytics.ts", import.meta.url), "utf8");
assert(ariaAnalyticsSource.includes('pushAnalyticsEvent("aria_question_submit"') &&
  ariaAnalyticsSource.includes('pushAnalyticsEvent("generate_lead"'),
  "Custom Aria contact event and primary GA4 interest event must both exist.");
assert(ariaFormsSource.includes('trackAriaQuestionSubmit(trackingSource') &&
  ariaFormsSource.includes('if (showQuestionField)') &&
  ariaFormsSource.includes('trackMetaFormConversion("informacie"'),
  "An Aria question must not be counted as the normal Meta/GA4 Lead.");
assert(ariaBackend.includes("lead_landing_aria_chat_other") &&
  ariaBackend.includes("if (ARIA_QUESTION_SOURCES.has(text(input.cta_source, 100)) ||") &&
  ariaBackend.includes("text(input.source_ref, 500) === '/test-aria/'"),
  "Aria questions must not trigger backend Meta CAPI Lead, even with marketing consent.");



// Homepage contact: explicit source, mandatory email and question, no dog details or paid conversion.
const faqContactInput = { typ: "informacie" as const, consent: true as const, meno: "Test", telefon: phone, email: "test@example.com", zaujem: "Chcem sa informovať o škôlke", otazka: "Aký je priebeh dňa?", cta_source: "home_faq_contact" };
const faqContact = buildDbPayload(inquirySchema.parse(faqContactInput));
assert(faqContact.cta_source === "home_faq_contact" && faqContact.raw_payload["Otázka návštevníka"] === faqContactInput.otazka && !("dog_breed" in faqContact), "FAQ contact must retain the question and source without dog details.");
for (const patch of [{ email: undefined }, { otazka: undefined }, { meno: " " }, { consent: false }]) assert(!inquirySchema.safeParse({ ...faqContactInput, ...patch }).success, "FAQ contact requires the question, identity and consent.");
const faqFormBlock = ariaFormsSource.slice(ariaFormsSource.indexOf("export function HomeFaqContactForm"), ariaFormsSource.indexOf("/** Inline binary choices"));
assert(faqFormBlock.includes("await submitInquiry(") && faqFormBlock.includes("trackFaqContactSubmit(source)") && !faqFormBlock.includes("trackMetaFormConversion") && !faqFormBlock.includes("trackFormSubmit") && !faqFormBlock.includes('"form_submit"'), "FAQ contact must emit only its own non-conversion success.");
assert(ariaAnalyticsSource.includes('pushAnalyticsEvent("faq_contact_submit"') && ariaBackend.includes("'home_faq_contact',"), "FAQ contact source must be isolated on both analytics and server.");
assert(readFileSync(new URL("../src/lib/submit-inquiry.ts", import.meta.url), "utf8").includes("data.cta_source !== HOME_FAQ_CONTACT_SOURCE"), "Do not attach Meta consent/identifiers to FAQ contact transport.");

// The approved puppy wizard asks only age and vaccinations; dog breed is
// collected by the existing shared lead contact (no second dog details step).
const checkerSource = readFileSync(new URL("../src/components/site/AriaPuppyChecker.tsx", import.meta.url), "utf8");
assert(checkerSource.includes('onInterest(snapshot())') &&
  checkerSource.includes('type Step = "age" | "vaccines"') &&
  !checkerSource.includes('data-aria-puppy-step="dog"') &&
  !checkerSource.includes('Plemeno (voliteľné)'),
  "Puppy wizard must pass age and vaccination answers directly to shared contact without duplicate breed collection");
const puppyLandingSource = readFileSync(new URL("../src/routes/psia-skolka-pre-steniatka.tsx", import.meta.url), "utf8");
assert(puppyLandingSource.includes("<AriaLeadAssistant") &&
  puppyLandingSource.includes("<AriaPuppyChecker") &&
  puppyLandingSource.includes("setPuppyCheck(details)") &&
  puppyLandingSource.includes("puppy_landing_checker_eligible"),
  "Puppy landing must track and retain the checker-to-contact handoff");

// Replacing the old mobile dock must not remove its distinct funnel metrics.
const ariaDockTracking = readFileSync(new URL("../src/components/site/AriaLeadAssistant.tsx", import.meta.url), "utf8");
const ariaLandingTracking = readFileSync(new URL("../src/routes/test-aria.tsx", import.meta.url), "utf8");
for (const marker of [
  'trackCookielessInteraction("nav_click", trackingPrefix + "_" + action',
  'trackMarketingInteraction("view_pricing", trackingPrefix + "_pricing")',
  'trackingPrefix + "_first_visit_pricing_details"',
  '"faq_first_visit"',
  'trackCookielessInteraction("explore_daycare", trackingPrefix + "_" + topic)',
]) assert(ariaDockTracking.includes(marker), "Aria navigation/FAQ metrics missing: " + marker);
assert(puppyLandingSource.includes('trackMarketingInteraction("inquiry_cta", source)') &&
  puppyLandingSource.includes('trackCookielessInteraction("inquiry_cta", source)') &&
  puppyLandingSource.includes('"puppy_landing_faq_"'),
  "Puppy CTA/modal and on-page FAQ must retain their distinct click/read events");
assert(ariaLandingTracking.includes('"lead_landing_first_visit_details"') &&
  ariaLandingTracking.includes('"lead_landing_first_visit_steps"'),
  "Campaign first-visit explanation and three-step shortcut must remain tracked");
const guidedLeadTracking = readFileSync(new URL("../src/components/site/LeadStepForm.tsx", import.meta.url), "utf8");
const ariaChatMobile = readFileSync(new URL("../src/components/site/AriaGuidedChat.tsx", import.meta.url), "utf8");
assert(ariaChatMobile.includes('const visibleQuestions = unanswered.slice(0, 4)') &&
  !ariaChatMobile.includes('data-aria-chat-followup-prompt') &&
  ariaChatMobile.includes('compact chatReceipt') &&
  guidedLeadTracking.includes('!chatReceipt && <div data-lead-success-links') &&
  ariaChatMobile.indexOf('data-aria-chat-other-cta') < ariaChatMobile.indexOf('data-aria-chat-interest-cta') &&
  ariaChatMobile.includes('data-aria-chat-inline') &&
  ariaChatMobile.includes('data-aria-chat-message-id') &&
  ariaChatMobile.includes('chatCompact') &&
  ariaChatMobile.includes('data-lead-form-shell') &&
  ariaChatMobile.includes('HomeFaqContactForm source=') &&
  ariaChatMobile.includes('Máš inú otázku?') &&
  ariaChatMobile.includes('dockless = false') &&
  !ariaChatMobile.includes('data-aria-chat-show-questions') &&
  !ariaChatMobile.includes('data-aria-chat-form-scroll'),
  "APP-01: four always-visible choices, inline forms, puppy and mobile typewriter layout must be preserved.");

// Approved 4 + 4 content stays confined to the TEST Aria chatbot. The
// question IDs are also stable analytics event suffixes.
const approvedTitles = [
  "Aký je cenník škôlky?", "Aké sú podmienky prijatia?",
  "Kto sa postará o psíka?", "Prijímate aj šteniatka?",
  "Kde sa škôlka nachádza?", "Aké priestory má škôlka?",
  "Ako prebieha prvá návšteva?", "Ako si rezervujem miesto v škôlke?",
];
assert(approvedTitles.every(title => ariaChatMobile.includes('title: "' + title + '"')) &&
  ariaChatMobile.includes('id: "reservation"') &&
  ariaChatMobile.includes("**do nedele 20:00**") &&
  ariaChatMobile.includes("**vieme sa dohodnúť aj individuálne**") &&
  !ariaChatMobile.includes("deň vopred do 19:00") &&
  ariaChatMobile.includes('if (question.id === "puppy") track("puppy_check_open")') &&
  ariaChatMobile.includes('track("question_" + question.id)') &&
  ariaChatMobile.includes('unanswered.slice(0, 4)'),
  "APP-01 TEST Aria must preserve ordered FAQ catalogue, refreshed choices and analytics.");

const puppyChatSource = readFileSync(new URL("../src/components/site/AriaPuppyChecker.tsx", import.meta.url), "utf8");
assert(puppyChatSource.includes('if (chatCompact) return (') &&
  puppyChatSource.includes('data-aria-puppy-step="single"') &&
  puppyChatSource.includes('Zistite, či vaše šteniatko spĺňa podmienky prijatia') &&
  puppyChatSource.includes('onInterest(snapshot())'),
  "APP-01 chat-only puppy checker must reuse existing age and vaccine snapshot.");
const sharedFaqForm = readFileSync(new URL("../src/components/site/Forms.tsx", import.meta.url), "utf8");
assert(sharedFaqForm.includes('source = HOME_FAQ_CONTACT_SOURCE') &&
  sharedFaqForm.includes('data-aria-contact-wizard') &&
  sharedFaqForm.includes('trackAriaQuestionSubmit(source)'),
  "APP-01 Aria contact must reuse homepage question-first form with own analytics.");

const successBoundary = guidedLeadTracking.indexOf("const result = await submitInquiry(");
const conversionBoundaries = [
  guidedLeadTracking.indexOf('trackCookielessInteraction("form_submit"'),
  guidedLeadTracking.indexOf('trackFormSubmit({'),
  guidedLeadTracking.indexOf('trackMetaFormConversion("informacie"'),
];
assert(successBoundary > 0 && conversionBoundaries.every(position => position > successBoundary),
  "Cookieless/GA4/Meta lead conversion must happen only after the backend acknowledges success");
assert(guidedLeadTracking.includes('cta_source: trackingSource') &&
  guidedLeadTracking.includes('trackCookielessInteraction("form_error"'),
  "Lead receipt must preserve CTA attribution and record failures separately from success");

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
    size: "medium",
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

// Shared 1/2-dog application usage is one required radio group with two compact cards.
// Keep backend compatibility for historical submissions and record the broadened regular choice.
const applicationSource = forms.slice(forms.indexOf("export function LongForm"));
assert(applicationSource.includes('name="duvod" value={option.value} aria-label={option.value} required'), "The application requires a native accessible radio choice.");
assert(applicationSource.includes("grid grid-cols-2 gap-2") && applicationSource.includes("min-h-20") && applicationSource.includes("peer-checked:border-coral") && applicationSource.includes("peer-focus-visible:outline") && applicationSource.includes("-webkit-tap-highlight-color:transparent"), "Two cards must retain size, selection, focus and mobile touch styling.");
assert(applicationSource.includes('lines: ["Pravidelne", "1× alebo viackrát", "týždenne"]') && applicationSource.includes('lines: ["Občas", "podľa potreby"]') && !applicationSource.includes('value: "Jednorazové stráženie"'), "Application wording must not limit weekly visits to one or two.");
assert(!applicationSource.includes('<select id={`l-${formId}-duvod`') && !applicationSource.includes("defaultChecked"), "No application usage dropdown or preselected radio.");
assert(applicationSource.includes('duvod: String(fd.get("duvod") ?? "")'), "Do not alter submission mapping.");
assert((applicationSource.match(/name="duvod"/g) || []).length === 1, "Single shared usage field even for two dogs.");
for (const row of ["identity", "age-weight", "sex-neuter"]) {
  assert((applicationSource.match(new RegExp(`data-application-dog-row="${row}"`, "g")) || []).length === 2, `Both dogs share the same ${row} layout.`);
}
for (const usage of ["Pravidelne – 1× alebo viackrát týždenne", "Občas podľa potreby", "Jednorazové stráženie"]) {
  assert(applicationSource.includes(usage) === (usage !== "Jednorazové stráženie"), "Only the two requested categories are visible; legacy payload remains valid.");
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
const inquiryDogFields=readFileSync(new URL("../src/components/site/InquiryDogFields.tsx", import.meta.url), "utf8");
assert(stagedLeadSource.includes('const [breed, setBreed] = useState(puppyCheck?.dog_breed ?? "")') &&
  stagedLeadSource.includes('<InquiryDogFields') &&
  stagedLeadSource.includes("dog_breed: breedValue || undefined") &&
  inquiryDogFields.includes('name="plemeno"') && inquiryDogFields.includes('required className="field') &&
  inquiryDogFields.includes('name="pohlavie"') && inquiryDogFields.includes('Sex (optional)') &&
  !stagedLeadSource.includes("showBreed") && !stagedLeadSource.includes("ariaPreview && selectedInterest"),
  "The shared SK/EN short enquiry must require breed, keep optional dog sex and retain the puppy breed handoff.");
const releasedLeadRoute = readFileSync(new URL("../src/routes/psia-skolka-kosice.tsx", import.meta.url), "utf8");
assert(releasedLeadRoute.includes('component: AriaPreviewPage') &&
  !releasedLeadRoute.includes('component: LeadLandingPage') &&
  releasedLeadRoute.includes('content: "noindex, follow"') &&
  releasedLeadRoute.includes('rel: "canonical"'),
  "Paid campaign route must use the approved Aria page and retain original SEO isolation");
assert(ariaLandingTracking.includes('const isLiveLead = useRouterState') &&
  ariaLandingTracking.includes('lead_landing_aria_hero_inline') &&
  ariaLandingTracking.includes('lead_landing_aria_puppy_check') &&
  ariaLandingTracking.includes('lead_landing_aria_first_visit_inline') &&
  ariaLandingTracking.includes('<AriaLeadAssistant trackingPrefix=') &&
  !ariaLandingTracking.includes('<Header landingMinimal') &&
  ariaLandingTracking.includes('setPuppyCheck(details)'),
  "Approved live Aria must have one dock, shared guided lead and puppy-to-contact attribution");
assert(stagedLeadSource.includes("zaujem: selectedInterest") &&
  stagedLeadSource.includes('name="zaujem"') &&
  stagedLeadSource.includes("PrivacyConsentCheckbox") &&
  stagedLeadSource.includes("startFormAttempt(trackingSource)") &&
  stagedLeadSource.includes('trackMetaFormConversion("informacie"') &&
  stagedLeadSource.includes("LeadPhoneReceipt"),
  "All lead routes must preserve consent, CRM interest, successful-conversion tracking and receipt");
assert(stagedLeadSource.includes('name="meno"') &&
  stagedLeadSource.includes('<InquiryDogFields') &&
  inquiryDogFields.includes('name="plemeno"') &&
  inquiryDogFields.includes('name="pohlavie"') &&
  stagedLeadSource.includes('name="email"') &&
  stagedLeadSource.includes("<PhoneField"),
  "Paid and homepage enquiry must expose contact, required breed and optional sex");
assert(stagedLeadSource.includes('value={option.value} required={step === 1}') &&
  !stagedLeadSource.includes('value={option.value} required aria-label'),
  "When puppy eligibility preselects a fourth allowlisted interest, hidden native radio requirements must not block a valid contact submission");

const homePuppy = readFileSync(new URL("../src/components/site/HomePuppyChecker.tsx", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
assert(homePage.includes("<HomePuppyChecker />") &&
  homePuppy.includes("<AriaPuppyChecker") &&
  homePuppy.includes("<LeadStepForm") &&
  homePuppy.includes('trackingSource={source}') &&
  homePuppy.includes('puppyCheck={answers}') &&
  homePuppy.includes('home_puppy_checker_eligible') &&
  homePuppy.includes('home_puppy_checker_info'),
  "Homepage must pass age/vaccines to the existing consented lead form and retain CTA attribution");
assert(!releasedLeadRoute.includes("submitInquiry(") &&
  !homePuppy.includes("submitInquiry("),
  "Routes/checker must not bypass the single existing backend submission gate");
assert(stagedLeadSource.includes('dog_breed: breedValue || undefined') &&
  stagedLeadSource.includes("cta_source: trackingSource") &&
  stagedLeadSource.includes('trackCookielessInteraction("form_submit"'),
  "Breed, source and successful conversion must be retained inside shared LeadStepForm");
assert(backendUsageSrc.includes("if (leadBreed) payload.dog_breed = leadBreed;") &&
  backendUsageSrc.includes('text(input.dog_breed ?? input.plemeno, 80)') &&
  backendUsageSrc.includes('Plemeno psíka: ${text(payload.dog_breed, 80)}') &&
  backendUsageSrc.indexOf("if (!LEAD_INTERESTS.has(rawInterest))") <
    backendUsageSrc.indexOf("if (leadBreed) payload.dog_breed = leadBreed;"),
  "Live lead receiver must persist optional breed as a normal CRM column and send it to operator email after allowlist validation");

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


// PRODUCT_BACKEND_REGRESSION_START: actual handler with isolated DB/email transports.
for (const chosenSize of ["small", "medium", "large", "invalid"]) {
  let handler: (request: Request) => Promise<Response> = async () => new Response(null, { status: 500 });
  let stored: any = null;
  let sentEmail: any = null;
  let networkCalls = 0;
  const env: Record<string, string> = { SUPABASE_URL: "https://fixture.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture", RESEND_API_KEY: "fixture", NOTIFY_TO: "fixture@example.invalid" };
  const program = transpileModule(productBackend.replace(/^import[^\n]+\n/, ""), { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.CommonJS } }).outputText;
  runInNewContext(program, {
    Request, Response, Intl, Date, console,
    securityLimitV336: async () => null,
    securityAccessV336: async () => null,
    Deno: { env: { get: (name: string) => env[name] }, serve: (fn: typeof handler) => { handler = fn; } },
    fetch: async (url: string, init: RequestInit = {}) => {
      networkCalls++;
      if (url === "https://api.resend.com/emails") { sentEmail = JSON.parse(String(init.body)); return Response.json({ id: "fixture-email" }); }
      if (init.method === "POST") { stored = { ...JSON.parse(String(init.body)), id: "fixture-inquiry", created_at: "2026-11-24T12:00:00Z" }; return Response.json([stored]); }
      if (init.method === "PATCH") return new Response(null, { status: 204 });
      return Response.json([]);
    },
  });
  const response = await handler(new Request("https://fixture.invalid/functions/v1/product-inquiry-submit", { method: "POST", headers: { origin: "https://chvostikovo.sk" }, body: JSON.stringify({
    client_submission_id: "00000000-0000-4000-8000-000000000003", product_type: "target", customer_name: "Fixture", phone: "+421900000000", email: "fixture@example.invalid", customer_location: "Košice, 040 01", consent: true, configuration: { size: chosenSize, height_cm: 5, note: "" },
  }) }));
  if (chosenSize === "invalid") {
    assert(response.status === 400 && networkCalls === 0, "Unknown target size must fail before DB/email access");
  } else {
    assert(response.status === 201 && stored?.configuration.size === chosenSize && !!sentEmail, "Target size must survive actual handler persistence and notification");
    if (chosenSize === "medium") assert(sentEmail.text.includes("Veľkosť: Stredný 30 × 15 cm"), "Medium target notification must name its size and dimensions");
  }
}
// PRODUCT_BACKEND_REGRESSION_END

await import("./tracking-form-checks");
await import("./form-autofill-checks");
await import("./form-alert-checks");
await import("./application-dog-details-checks");
await import("./application-health-fields-checks");

console.log("Critical form checks passed.");

const leadWithSex=buildDbPayload(shortSchema.parse({
 typ:"informacie",consent:true,meno:"Test",telefon:phone,
 zaujem:"Mám záujem využívať škôlku pravidelne",plemeno:"Labrador",pohlavie:"female",
}));
assert(leadWithSex.dog_breed==="Labrador" && leadWithSex.dog_sex==="female" &&
 leadWithSex.raw_payload["Pohlavie psíka"]==="Suka",
 "Optional dog sex must be saved as a CRM column and human-readable history.");
const leadWithoutSex=buildDbPayload(shortSchema.parse({
 typ:"informacie",consent:true,meno:"Test",telefon:phone,
 zaujem:"Chcem sa informovať o škôlke",plemeno:"Vlkodav",
}));
assert(!("dog_sex" in leadWithoutSex),"Unselected sex must remain optional.");

const currentBackend=readFileSync(new URL("../supabase/functions/web-form-submit/index.ts",import.meta.url),"utf8");
assert(currentBackend.includes("const leadSex = sex(input.dog_sex ?? input.pohlavie)") &&
 currentBackend.includes("if (leadSex) payload.dog_sex = leadSex") &&
 currentBackend.includes("payload.dog_sex === 'male' ? 'Pes' : 'Suka'"),
 "Backend must normalize and store optional enquiry sex with operator notification without widening interest allowlist.");

assert(ariaLandingTracking.includes("leadChat={isLiveLead}") && ariaDockTracking.includes("dockless={leadChat}") && ariaDockTracking.includes("{!leadChat && <div data-aria-section-navigation="), "Paid lead must reuse the existing dockless chat without rendering the old navigation");
