import assert from "node:assert/strict";

// Simulated consented browser; never sends real forms or network requests.
let analyticsConsent = true;
let marketingConsent = true;
const sent = [];
const meta = [];
const layer = [];
globalThis.window = {
  location: { href: "https://chvostikovo.sk/", pathname: "/", search: "" },
  localStorage: {
    getItem(key) {
      if (key !== "chvostikovo-cookies") return null;
      return JSON.stringify({
        version: "2026-10-03-v2", savedAt: new Date().toISOString(),
        necessary: true, functional: true, analytics: analyticsConsent, marketing: marketingConsent,
      });
    },
  },
  gtag(...args) { sent.push(args); },
  fbq(...args) { meta.push(args); },
  dataLayer: layer,
};
const { trackMarketingInteraction, trackFormSubmit } = await import("../src/lib/analytics.ts");
const events = [
  ["phone_click", "phone_click"],
  ["inquiry_cta", "inquiry_cta_click"],
  ["hero_learn_more", "hero_learn_more"],
  ["explore_daycare", "explore_daycare"],
  ["view_care", "view_care"],
  ["view_pricing", "view_pricing"],
];
for (const [kind, name] of events) {
  trackMarketingInteraction(kind, "hero_mobile");
  const hit = sent.at(-1);
  const data = layer.at(-1);
  assert.equal(hit[1], name);
  assert.equal(hit[2].cta_source, "hero_mobile");
  assert.equal(hit[2].page_path, "/");
  assert.equal(Object.hasOwn(hit[2], "source"), false, "CTA cannot become GA4 traffic source");
  assert.equal(data.cta_source, "hero_mobile");
  assert.equal(Object.hasOwn(data, "source"), false, "GTM dataLayer cannot confuse CTA and source");
}
assert(meta.some((hit) => hit[2]?.source === "hero_mobile"), "Meta existing parameter unchanged");
trackFormSubmit({ formType: "informacie", sourceRef: "/", ctaSource: "lead_landing_benefits", trafficSource: "google", trafficMedium: "organic" });
assert.equal(sent.at(-1)[1], "generate_lead");
assert.equal(sent.at(-1)[2].cta_source, "lead_landing_benefits");
assert.equal(sent.at(-1)[2].traffic_source, "google");
trackFormSubmit({ formType: "prihlaska", sourceRef: "/", ctaSource: "application", trafficSource: "google" });
assert.equal(sent.at(-1)[1], "application_submit");
const before = [sent.length, layer.length, meta.length];
analyticsConsent = false;
marketingConsent = false;
trackMarketingInteraction("hero_learn_more", "hero_mobile");
assert.deepEqual([sent.length, layer.length, meta.length], before, "Consent behavior must remain intact");
console.log("[analytics] PASS: GA4 CTA attribution, Meta parity, consent and lead events");
