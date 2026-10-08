import assert from "node:assert/strict";

let handler: (request: Request) => Promise<Response>;
const originalFetch = globalThis.fetch;
const originalDeno = (globalThis as any).Deno;
const alerts = new Map<string, string>();
const emails: any[] = [];
const receipts: any[] = [];
let rateLimited = false;
let mailFailure = false;
(globalThis as any).Deno = {
  env: { get: (name: string) => ({ SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-only", RESEND_API_KEY: "test-only" })[name] },
  serve: (callback: typeof handler) => { handler = callback; },
};
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).includes("web_form_submissions?")) return Response.json([]);
  const body = JSON.parse(init.body);
  if (String(url).includes("reserve_website_form_error_alert")) {
    const state = alerts.has(body.p_attempt_id) ? "duplicate" : rateLimited ? "rate_limited" : "reserved";
    alerts.set(body.p_attempt_id, state);
    return Response.json(state);
  }
  if (String(url) === "https://api.resend.com/emails") {
    emails.push(body);
    return Response.json(mailFailure ? { error: "private backend message" } : { id: "test-mail-id" }, { status: mailFailure ? 500 : 200 });
  }
  if (String(url).includes("website_form_error_alerts?")) receipts.push(body);
  return new Response(null, { status: 201 });
}) as typeof fetch;

async function send(input: object, origin = "https://chvostikovo.sk") {
  return handler!(new Request("https://test.invalid", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(input) }));
}
try {
  await import("../supabase/functions/website-landing-event/index");
  const base = { path: "/", language: "sk", event_source: "application_form", attempt_id: crypto.randomUUID() };
  assert.equal((await send({ ...base, event_name: "form_attempt" })).status, 201);
  assert.equal((await send({ ...base, event_name: "form_submit" })).status, 201);
  assert.equal(emails.length, 0);
  const failed = { ...base, event_name: "form_error", event_source: "application_form:backend_http:500", owner_name: "PRIVATE NAME", phone: "+421915349028" };
  assert.equal((await (await send(failed)).json()).alert_status, "sent");
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to[0], "chvostikovo.psiaskolka@gmail.com");
  assert(emails[0].text.includes("backend_http"));
  assert(emails[0].text.includes("HTTP stav: 500"));
  assert(emails[0].text.includes("V čase kontroly v DB nebol záznam"));
  assert(!JSON.stringify(emails).includes("PRIVATE NAME"));
  assert(!JSON.stringify(emails).includes("915349028"));
  assert.equal(receipts[0].delivery_status, "sent");
  assert.equal((await (await send(failed)).json()).alert_status, "duplicate");
  assert.equal(emails.length, 1);
  assert.equal((await send(failed, "https://untrusted.invalid")).status, 403);
  assert.equal((await send({ ...failed, attempt_id: "not-a-uuid" })).status, 400);
  assert.equal((await (await send({ ...failed, attempt_id: crypto.randomUUID(), event_source: "Name +421915349028" })).json()).alert_status, "invalid_diagnostic");
  const zodFailure = { ...base, attempt_id: crypto.randomUUID(), event_name: "form_error", event_source: "application_form:zod_validation::source_ref=too_big,landing_page=too_big,PRIVATE=NAME" };
  assert.equal((await (await send(zodFailure)).json()).alert_status, "sent");
  assert(emails.at(-1).text.includes("source_ref=too_big"));
  assert(emails.at(-1).text.includes("landing_page=too_big"));
  assert(!emails.at(-1).text.includes("PRIVATE"));
  rateLimited = true;
  assert.equal((await (await send({ ...failed, attempt_id: crypto.randomUUID() })).json()).alert_status, "rate_limited");
  assert.equal(emails.length, 2);
  rateLimited = false;
  mailFailure = true;
  const consoleError = console.error;
  console.error = () => {};
  try {
    const result = await send({ ...failed, attempt_id: crypto.randomUUID() });
    assert.equal(result.status, 201, "Email errors must not break saved tracking");
    assert.equal((await result.json()).alert_status, "failed");
    assert.equal(receipts.at(-1).delivery_status, "failed");
  } finally { console.error = consoleError; }
  // QA conversions are skipped on the server; real conversions keep working.
  const calls: string[] = [];
  const databasePayloads: any[] = [];
  (globalThis as any).Deno.env.get = (name: string) => ({ SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-only", RESEND_API_KEY: "test-only", META_CAPI_ACCESS_TOKEN: "test-only" })[name];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push(String(url));
    if (String(url).includes("web_form_submissions?")) return Response.json([]);
    if (String(url).includes("graph.facebook.com")) return Response.json({ events_received: 1 });
    if (String(url).endsWith("/rest/v1/web_form_submissions") && init?.method === "POST") databasePayloads.push(JSON.parse(init.body));
    return Response.json({ id: "test-only", ok: true }, { status: 201 });
  }) as typeof fetch;
  await import("../supabase/functions/web-form-submit/index");
  const lead = { form_type: "lead", owner_name: "TEST", phone: "+421915349028", consent: true, marketing_consent: true, meta_event_id: "test-only", interest_reason: "Chcem sa dozvedieť viac o psej škôlke" };
  assert.equal((await send({ ...lead, source_ref: "/?utm_source=qa&utm_campaign=test" })).status, 201);
  assert(!calls.some((url) => url.includes("graph.facebook.com")), "QA must never reach Meta CAPI");
  calls.length = 0;
  assert.equal((await send({ ...lead, source_ref: "/" })).status, 201);
  assert(calls.some((url) => url.includes("graph.facebook.com")), "Real Meta conversions must remain enabled");
  const application = { ...lead, form_type: "application", marketing_consent: false, source_ref: "/?utm_source=qa", dog_name: "TEST DOG", dog_sex: "Pes", dog_age_text: "2 roky", dog_neutered: "Nie", interest_reason: "Občas podľa potreby", dog_info: "TEST" };
  for (const details of [{ dog_breed: "Labrador", dog_weight_kg: 25.5 }, { dog_breed: "Labrador", dog_weight_kg: "25,5 kg" }, { dog_breed_weight: "Labrador, cca 25,5 kg" }]) {
    assert.equal((await send({ ...application, ...details })).status, 201);
    assert.equal(databasePayloads.at(-1).dog_breed, "Labrador");
    assert.equal(databasePayloads.at(-1).dog_weight_kg, 25.5);
  }
  for (const weight of [0, -25, 151, "invalid", ""]) assert.equal((await send({ ...application, dog_breed: "Labrador", dog_weight_kg: weight })).status, 400);
  console.log("Form alert checks passed: CORS, per-attempt deduplication, mail delivery receipts, safe diagnostics, rate limiting, and isolated notification failure.");
} finally {
  globalThis.fetch = originalFetch;
  (globalThis as any).Deno = originalDeno;
}
