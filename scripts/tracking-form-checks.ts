import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { inquirySchema, type InquiryInput } from "../src/lib/inquiry";
import { sanitizeTracking, safeTrackingString, TRACKING_LIMITS } from "../src/lib/tracking-sanitization";
import { submitInquiry } from "../src/lib/submit-inquiry";
import { getTrafficAttribution } from "../src/lib/traffic-source";

const dom = new Window({ url: "https://chvostikovo.sk/psia-skolka-kosice" });
Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: dom });
Object.defineProperty(globalThis, "document", { configurable: true, writable: true, value: dom.document });
const lead: InquiryInput = { typ: "informacie", consent: true, meno: "Test", telefon: "+421912345678", zaujem: "Mám záujem o pravidelné návštevy" };
const instagram = "/psia-skolka-kosice?utm_source=ig&utm_medium=social&utm_campaign=test&fbclid=" + "x".repeat(600);
const application: InquiryInput = { typ: "prihlaska", consent: true, meno: "Test", telefon: lead.telefon, pes: "Rocky", plemeno: "Labrador", vaha: "25 kg", pohlavie: "Pes", vek: "2 roky", kastrovana: "Áno", duvod: "Pravidelne – 1 až 2× týždenne", viac: "Test validácie." };
const originalFetch = globalThis.fetch;
let payload: any;
globalThis.fetch = (async (_url: any, options: any) => {
  payload = JSON.parse(options.body);
  return new Response(JSON.stringify({ ok: true }), { status: 201 });
}) as typeof fetch;
try {
  for (const input of [
    { ...lead, source_ref: "/psia-skolka-kosice?utm_source=ig" },
    { ...lead, source_ref: "/" + "x".repeat(1000) },
    { ...lead, source_ref: instagram },
    { ...lead, landing_page: instagram + "x".repeat(1000) },
    { ...lead, telefon: "+421 912 345 678" },
    { ...application, source_ref: instagram, landing_page: instagram },
  ]) {
    await submitInquiry(input);
    assert.equal(payload.phone, lead.telefon);
    assert(!payload.source_ref.includes("fbclid"));
    assert(payload.source_ref.length <= 300);
  }
  const { CONSENT_STORAGE_KEY, CONSENT_VERSION } = await import("../src/lib/consent");
  dom.happyDOM.setURL("https://chvostikovo.sk" + instagram);
  dom.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, savedAt: new Date().toISOString(), necessary: true, marketing: true, analytics: false, functional: false }));
  await submitInquiry({ ...lead, source_ref: instagram });
  assert(payload.meta_fbc.endsWith("." + "x".repeat(600)), "Original fbclid must remain available to CAPI");
  assert(!payload.source_ref.includes("fbclid"));
  dom.localStorage.clear();
  const broken = Object.fromEntries(Object.keys(TRACKING_LIMITS).map((key) => [key, { unexpected: true }]));
  await submitInquiry({ ...lead, ...broken } as InquiryInput);
  const huge = Object.fromEntries(Object.keys(TRACKING_LIMITS).map((key) => [key, "x".repeat(5000)]));
  assert(inquirySchema.safeParse(sanitizeTracking({ ...lead, ...huge })).success);
  assert.equal(safeTrackingString(null, 300), "");
  await assert.rejects(() => submitInquiry({ ...lead, telefon: "bad" }));
  await assert.rejects(() => submitInquiry({ ...lead, meno: "" }), (error: any) => {
    assert.deepEqual(error.issues, [{ field: "meno", code: "too_small" }]);
    return error.stage === "zod_validation";
  });
  assert(!inquirySchema.safeParse(sanitizeTracking({ ...application, consent: false })).success);
  for (const stored of ["{invalid", "null", "[]", JSON.stringify({ landing_page: instagram, source: {}, campaign: "x".repeat(5000) })]) {
    dom.sessionStorage.setItem("chvostikovo_traffic_attribution", stored);
    const attribution = getTrafficAttribution();
    assert(!attribution.landing_page.includes("fbclid"));
    assert(attribution.landing_page.length <= 500);
    assert(attribution.campaign.length <= 300);
  }
  dom.happyDOM.setURL("https://chvostikovo.sk" + instagram);
  Object.defineProperty(dom, "sessionStorage", { configurable: true, get() { throw new Error("blocked storage"); } });
  const attribution = getTrafficAttribution();
  assert.equal(attribution.source, "ig");
  assert.equal(attribution.medium, "social");
  assert.equal(attribution.campaign, "test");
  assert(!attribution.landing_page.includes("fbclid"));
  await submitInquiry({ ...lead, landing_page: attribution.landing_page });
  console.log("Attribution regression A–H passed; corrupt/blocked storage, oversized and wrong-type metadata, strict consent and private diagnostics passed.");
} finally {
  globalThis.fetch = originalFetch;
  await dom.happyDOM.abort();
}
