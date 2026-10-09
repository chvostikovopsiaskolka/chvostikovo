import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Window } from "happy-dom";
import { inquirySchema, buildDbPayload } from "../src/lib/inquiry";

const base = { typ: "prihlaska", consent: true, meno: "TEST", telefon: "+421900000401", pes: "TEST DOG", plemeno: "Labrador", vaha: "25,5 kg", pohlavie: "Pes", vek: "2 roky", kastrovana: "Nie", duvod: "Občas podľa potreby" };
const care = { alergie: "Alergia na kuracie; lieky podľa dohody.", povaha: "Priateľský; s mačkami nemá skúsenosti." };
const parsed = inquirySchema.parse({ ...base, ...care });
const payload = buildDbPayload(parsed);
assert.equal(payload.dog_allergies, care.alergie);
assert.equal(payload.dog_temperament, care.povaha);
assert.equal(payload.raw_payload["Alergie a zdravotné obmedzenia"], care.alergie);
assert.equal(payload.raw_payload["Povaha a ďalšie informácie"], care.povaha);
assert(inquirySchema.safeParse({ ...base, viac: "Pôvodný zmiešaný text" }).success);
assert(inquirySchema.safeParse({ ...base, povaha: care.povaha }).success);
assert(inquirySchema.safeParse({ ...base, alergie: "", povaha: care.povaha }).success);
for (const invalid of [{}, { alergie: "Nemá" }, { ...care, povaha: "" }, { ...care, alergie: "x".repeat(3001) }]) assert(!inquirySchema.safeParse({ ...base, ...invalid }).success);

const html = readFileSync(new URL("../system/admin-health-fields.html", import.meta.url), "utf8");
const transpiler = new Bun.Transpiler({ loader: "js" });
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (script[1]?.trim()) transpiler.transformSync(script[1]);
const dom = new Window();
dom.document.body.innerHTML = html.slice(0, html.indexOf("<script"));
const inserted: Array<{ table: string; payload: any }> = [];
const state = { webSubmissions: [{ id: 1, ...payload, dog_sex: "male", dog_neutered: false, dog_weight_kg: 25.5 }], introVisits: [], convertingSubmissionId: null, convertingIntroId: null } as any;
const context = vm.createContext({
  state, $: (id: string) => dom.document.getElementById(id), console, Number, String,
  setTimeout: () => {}, phoneLocalPart: () => "900000401", phoneWithPrefix: () => "+421900000401",
  esc: (v: unknown) => String(v ?? "").replaceAll("<", "&lt;"), alert: () => { throw Error("Unexpected alert"); },
  withJwtRetry: (callback: any) => callback(),
  supabase: { from: (table: string) => ({
    update: () => ({ eq: async () => ({ error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
    insert: (value: any) => { inserted.push({ table, payload: value }); return { select: () => ({ single: async () => ({ data: { id: table === "dogs" ? 100 : 200, ...value }, error: null }) }) }; },
  }) },
  sendMetaCrmStage: async () => {}, loadData: async () => {}, openDog: async () => {},
  renderIntroVisits: () => {}, renderWeek: () => {}, switchTab: () => {}, queueAdminLive: () => {},
});
const names = ["parseAdminDogWeightKg", "parseAdminBreedWeight", "showDogCreateMode", "openDogCreate", "webSubmissionCareHtml", "webSubmissionIntroNotes", "prefillSubmissionDog", "prefillSubmissionIntroVisit", "closeDogCreate", "createDog", "createIntroVisit"];
for (const name of names) {
  const match = new RegExp(`(?:async )?function ${name}\\(`).exec(html)!;
  assert(match, `Missing production function ${name}`);
  const remaining = html.slice(match.index), next = /\n(?:async )?function \w+\(/.exec(remaining);
  vm.runInContext(next ? remaining.slice(0, next.index) : remaining, context);
}
await vm.runInContext("prefillSubmissionDog(1)", context);
await vm.runInContext("createDog({preventDefault(){}})", context);
let dog = inserted.filter(r => r.table === "dogs").at(-1)!.payload;
assert.equal(dog.allergies, care.alergie); assert.equal(dog.temperament, care.povaha); assert.equal(dog.notes, null);
await vm.runInContext("prefillSubmissionIntroVisit(1)", context);
(dom.document.getElementById("introVisitDate") as any).value = "2026-10-12";
await vm.runInContext("createIntroVisit({preventDefault(){}})", context);
const intro = inserted.find(r => r.table === "intro_visits")!.payload;
assert.equal(intro.allergies, care.alergie); assert.equal(intro.temperament, care.povaha);
assert(!intro.notes.includes(care.alergie));
state.introFixture = { id: 200, ...intro, allergies: "Upravené pri návšteve", temperament: "" };
vm.runInContext("openDogCreate('application',state.introFixture)", context);
await vm.runInContext("createDog({preventDefault(){}})", context);
dog = inserted.filter(r => r.table === "dogs").at(-1)!.payload;
assert.equal(dog.allergies, "Upravené pri návšteve"); assert.equal(dog.temperament, null);
state.webSubmissions[0] = { ...state.webSubmissions[0], dog_allergies: null, dog_temperament: null, dog_info: "Starý spoločný text" };
await vm.runInContext("prefillSubmissionDog(1)", context);
await vm.runInContext("createDog({preventDefault(){}})", context);
dog = inserted.filter(r => r.table === "dogs").at(-1)!.payload;
assert.equal(dog.allergies, null); assert.equal(dog.temperament, null); assert.equal(dog.notes, "Starý spoločný text");
assert(vm.runInContext("webSubmissionCareHtml({dog_allergies:'<script>',dog_temperament:'priateľský'})", context).includes("&lt;script>"));
await dom.happyDOM.abort();
console.log("Application care fields passed: separate payload, required fields, full admin syntax, direct conversion, intro conversion, edited values, safe display, and preserved legacy notes.");
