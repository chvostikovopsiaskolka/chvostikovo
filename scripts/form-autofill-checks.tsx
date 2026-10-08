import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { normalizePhone, phoneFromForm } from "../src/lib/phone";
import { InquirySubmissionError, reportInquiryError } from "../src/lib/form-errors";
import { buildDbPayload, inquirySchema } from "../src/lib/inquiry";

const dom = new Window({ url: "https://chvostikovo.sk/" });
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "HTMLFormElement", "FormData", "Event", "CustomEvent", "MutationObserver", "Node"] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom : (dom as any)[key] });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { ShortForm, LongForm } = await import("../src/components/site/Forms");
const { EnglishInquiryForm } = await import("../src/components/site/EnglishInquiryForm");
const { PhoneField } = await import("../src/components/site/PhoneField");
const { submitInquiry } = await import("../src/lib/submit-inquiry");
const { CONSENT_STORAGE_KEY, CONSENT_VERSION } = await import("../src/lib/consent");
(dom as any).fbq = () => {};
(dom as any).gtag = () => {};
const formats = ["0915349028", "915349028", "+421915349028", "+421 915 349 028", "00421 915 349 028"];
const foreign: Array<[string, string, string]> = [
  ["+420 777 123 456", "+421", "+420777123456"],
  ["0044 7700 900123", "+421", "+447700900123"],
  ["07700 900123", "+44", "+447700900123"],
  ["777123456", "+420", "+420777123456"],
  ["420123456", "+420", "+420420123456"],
  ["0151 23456789", "+49", "+4915123456789"],
  ["06 20 123 4567", "+36", "+36201234567"],
  ["+1 202 555 0100", "+421", "+12025550100"],
];
for (const raw of formats) assert.equal(normalizePhone(raw), "+421915349028");
for (const [raw, prefix, expected] of foreign) assert.equal(normalizePhone(raw, prefix), expected);
for (const raw of ["", "+421", "abc", "++421915349028", "+000000000", "+42191534902800000"]) assert.throws(() => normalizePhone(raw), InquirySubmissionError);

const cases = [
  { name: "application_form", component: <LongForm />, path: "/", phoneId: "l-tel" },
  ...["hero_desktop_inline", "care_inline_mobile", "care_modal", "story_modal", "informational_form"].map((name) => ({ name, component: <ShortForm trackingSource={name} />, path: "/", phoneId: "s-tel" })),
  ...["lead_landing_top", "lead_landing_mobile_below_hero", "lead_landing_bottom", "lead_landing_modal"].map((name) => ({ name, component: <ShortForm trackingSource={name} />, path: "/psia-skolka-kosice", phoneId: "s-tel" })),
  { name: "puppy_landing_form", component: <ShortForm trackingSource="puppy_landing_form" hideInterest interestValue="Mám záujem o škôlku pre šteniatko" />, path: "/psia-skolka-pre-steniatka", phoneId: "s-tel" },
  { name: "dog_sitting_page_inline", component: <ShortForm trackingSource="dog_sitting_page_inline" />, path: "/strazenie-psov-kosice", phoneId: "s-tel" },
  { name: "english_page", component: <EnglishInquiryForm />, path: "/en/dog-daycare-kosice", phoneId: "en-phone" },
];
let requests: Array<{ url: string; body: any }> = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init: any) => {
  requests.push({ url: String(url), body: JSON.parse(init.body) });
  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;
function consent(marketing: boolean) {
  dom.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, savedAt: new Date().toISOString(), necessary: true, functional: false, analytics: true, marketing }));
  dom.document.cookie = "_fbp=fb.1.123.test; path=/";
  dom.document.cookie = "_fbc=fb.1.123.test; path=/";
}
let passed = 0;
try {
  for (const test of cases) for (const marketing of [false, true]) for (const raw of formats) for (const mode of ["silent-autofill", "input-event"]) {
    dom.happyDOM.setURL(`https://chvostikovo.sk${test.path}?utm_source=ig&utm_medium=social&fbclid=${"x".repeat(650)}`);
    dom.sessionStorage.clear();
    consent(marketing);
    requests = [];
    const container = dom.document.createElement("div");
    dom.document.body.append(container);
    const root = createRoot(container as any);
    await React.act(async () => root.render(test.component));
    const form = container.querySelector("form")!;
    for (const el of form.querySelectorAll("input, textarea, select")) {
      if (el instanceof dom.HTMLSelectElement) {
        if (!el.hasAttribute("data-phone-prefix")) el.value = el.options[1]!.value;
      } else if (el instanceof dom.HTMLInputElement && el.type === "checkbox") el.checked = true;
      else (el as any).value = "TEST – autofill regression";
    }
    const input = form.querySelector<HTMLInputElement>(`input[type="tel"]`)!;
    const weight = form.querySelector<HTMLInputElement>('input[name="vaha"]');
    if (weight) weight.value = "25,5 kg";
    input.value = raw;
    if (mode === "input-event") await React.act(async () => input.dispatchEvent(new dom.Event("input", { bubbles: true }) as any));
    // Force React to render again after browser-only filling. Its state must not
    // replace the native input value or the silently filled owner's name.
    await React.act(async () => root.render(test.component));
    assert.equal(input.value, raw, `${test.name}: React overwrote autofill`);
    assert.equal(new dom.FormData(form).get(input.name), raw);
    assert.equal(phoneFromForm(form as any, input.id), "+421915349028");
    assert.equal(form.checkValidity(), true);
    await React.act(async () => { form.requestSubmit(); await new Promise((resolve) => setTimeout(resolve, 20)); });
    const submission = requests.filter((r) => r.url.endsWith("/web-form-submit"));
    assert.equal(submission.length, 1, `${test.name}: missing or duplicate browser request`);
    assert(!submission[0]!.body.source_ref.includes("fbclid"));
    assert(!JSON.stringify(submission[0]!.body.raw_payload).includes("fbclid"));
    assert.equal(submission[0]!.body.phone, "+421915349028");
    assert.equal(submission[0]!.body.owner_name, "TEST – autofill regression");
    if (weight) {
      assert.equal(submission[0]!.body.dog_weight_kg, 25.5);
      assert.equal(submission[0]!.body.dog_breed, "TEST – autofill regression");
      assert(!("dog_breed_weight" in submission[0]!.body));
    }
    assert.equal(submission[0]!.body.marketing_consent, marketing);
    assert.equal(submission[0]!.body.meta_fbp, marketing ? "fb.1.123.test" : "");
    const events = requests.filter((r) => r.url.endsWith("/website-landing-event"));
    const attempt = events.find((r) => r.body.event_name === "form_attempt");
    assert(attempt?.body.attempt_id, `${test.name}: submission attempt not recorded`);
    assert.equal(submission[0]!.body.form_attempt_id, attempt.body.attempt_id, "Attempt ID must reach Supabase raw_payload");
    assert(events.some((r) => r.body.event_name === "form_submit"), `${test.name}: form_submit missing`);
    assert.equal(events.find((r) => r.body.event_name === "form_submit")!.body.attempt_id, attempt.body.attempt_id);
    assert(!events.some((r) => r.body.event_name === "form_error"));
    assert(!container.querySelector("form"), `${test.name}: success UI missing`);
    await React.act(async () => root.unmount());
    container.remove();
    passed++;
  }

  // Multiple responsive/modal instances must never share label target IDs.
  {
    const container = dom.document.createElement("div");
    dom.document.body.append(container);
    const root = createRoot(container as any);
    await React.act(async () => root.render(<><ShortForm /><ShortForm /><LongForm /><LongForm /><EnglishInquiryForm /><EnglishInquiryForm /></>));
    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    assert.equal(new Set(ids).size, ids.length, "Duplicate IDs break label/autofill association");
    for (const form of container.querySelectorAll("form")) for (const label of form.querySelectorAll("label[for]")) {
      assert(form.querySelector(`[id="${label.getAttribute("for")}"]`), "A label points outside its form");
    }
    await React.act(async () => root.unmount());
    container.remove();
  }

  // Shared PhoneField callback and selected-prefix changes (product forms).
  for (const [raw, prefix, expected] of foreign) {
    const container = dom.document.createElement("div");
    dom.document.body.append(container);
    let emitted = "";
    const root = createRoot(container as any);
    const component = <form><PhoneField id="product-phone" value="" onChange={(value) => { emitted = value; }} /></form>;
    await React.act(async () => root.render(component));
    const form = container.querySelector("form")!;
    const input = form.querySelector("input")!;
    const select = form.querySelector("select")!;
    input.value = raw;
    select.value = prefix;
    await React.act(async () => select.dispatchEvent(new dom.Event("change", { bubbles: true }) as any));
    assert.equal(emitted, expected);
    assert.equal(input.value, raw);
    await React.act(async () => root.render(component));
    assert.equal(phoneFromForm(form as any, "product-phone"), expected);
    await React.act(async () => root.unmount());
    container.remove();
  }

  // Caught errors, including repeated attempts, must notify without personal data.
  for (const component of [<ShortForm />, <LongForm />, <EnglishInquiryForm />]) {
    dom.happyDOM.setURL("https://chvostikovo.sk/?fbclid=qa-test");
    dom.sessionStorage.clear();
    requests = [];
    globalThis.fetch = (async (url: any, init: any) => {
      requests.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ ok: !String(url).endsWith("/web-form-submit") }), { status: String(url).endsWith("/web-form-submit") ? 500 : 201 });
    }) as typeof fetch;
    const container = dom.document.createElement("div");
    dom.document.body.append(container);
    const root = createRoot(container as any);
    await React.act(async () => root.render(component));
    const form = container.querySelector("form")!;
    for (const el of form.querySelectorAll("input, textarea, select")) {
      if (el instanceof dom.HTMLSelectElement) {
        if (!el.hasAttribute("data-phone-prefix")) el.value = el.options[1]!.value;
      } else if (el instanceof dom.HTMLInputElement && el.type === "checkbox") el.checked = true;
      else (el as any).value = "PRIVATE NAME";
    }
    form.querySelector<HTMLInputElement>('input[type="tel"]')!.value = "+421915349028";
    const weight = form.querySelector<HTMLInputElement>('input[name="vaha"]');
    if (weight) weight.value = "25";
    const consoleError = console.error;
    console.error = () => {};
    try {
      for (let i = 0; i < 2; i++) await React.act(async () => { form.requestSubmit(); await new Promise((resolve) => setTimeout(resolve, 20)); });
    } finally { console.error = consoleError; }
    const events = requests.filter((r) => r.url.endsWith("/website-landing-event"));
    const attempts = events.filter((r) => r.body.event_name === "form_attempt");
    const errors = events.filter((r) => r.body.event_name === "form_error");
    assert.equal(attempts.length, 2);
    assert.equal(errors.length, 2);
    assert.notEqual(attempts[0]!.body.attempt_id, attempts[1]!.body.attempt_id);
    assert.deepEqual(attempts.map((r) => r.body.attempt_id), errors.map((r) => r.body.attempt_id));
    assert(errors.every((r) => r.body.event_source.endsWith(":backend_http:500")));
    assert(!JSON.stringify(events).includes("PRIVATE NAME"));
    assert(!JSON.stringify(events).includes("915349028"));
    assert(!events.some((r) => r.body.event_name === "form_submit"));
    await React.act(async () => root.unmount());
    container.remove();
  }

  const valid = { typ: "informacie" as const, consent: true as const, meno: "TEST", telefon: "+421915349028", zaujem: "Test" };
  assert.equal(buildDbPayload(inquirySchema.parse(valid)).phone, valid.telefon);
  for (const [fetcher, input, stage, status] of [
    [async () => { throw new TypeError("private data must not be logged"); }, valid, "network", undefined],
    [async () => new Response("private backend data", { status: 429 }), valid, "backend_http", 429],
    [async () => new Response("{}", { status: 200 }), valid, "backend_response", 200],
    [async () => new Response("invalid JSON", { status: 200 }), valid, "backend_response", 200],
    [async () => { throw new Error("fetch must not happen"); }, { ...valid, meno: "" }, "zod_validation", undefined],
    [async () => { throw new Error("fetch must not happen"); }, { ...valid, telefon: "bad" }, "phone_normalization", undefined],
  ] as const) {
    globalThis.fetch = fetcher as any;
    await assert.rejects(() => submitInquiry(input), (error: any) => error.stage === stage && error.status === status);
  }
  const errors: unknown[] = [];
  const consoleError = console.error;
  console.error = (...args) => { errors.push(args); };
  reportInquiryError(new InquirySubmissionError("backend_http", 500));
  reportInquiryError(new Error("Sensitive name and phone"));
  console.error = consoleError;
  assert(!JSON.stringify(errors).includes("Sensitive"));
  // Internal QA never emits Google or browser Meta conversion events.
  const analytics = await import("../src/lib/analytics");
  let conversions = 0;
  (dom as any).gtag = () => conversions++;
  (dom as any).fbq = () => conversions++;
  consent(true);
  dom.happyDOM.setURL("https://chvostikovo.sk/?utm_source=qa");
  analytics.trackMetaFormConversion("informacie", "test", "test-only");
  analytics.trackFormSubmit({ formType: "informacie", sourceRef: "/?utm_source=qa" });
  assert.equal(conversions, 0);
  dom.happyDOM.setURL("https://chvostikovo.sk/");
  analytics.trackMetaFormConversion("informacie", "test", "test-only");
  analytics.trackFormSubmit({ formType: "informacie", sourceRef: "/" });
  assert.equal(conversions, 2, "Real conversions must remain enabled");
  console.log(`Autofill regression checks passed: ${passed} complete React form submissions; 8 foreign-prefix cases; normalization and safe error diagnostics.`);
} finally {
  globalThis.fetch = originalFetch;
  await dom.happyDOM.abort();
}
