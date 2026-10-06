import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Window } from "happy-dom";
import { parseDogWeightKg } from "../src/lib/dog-weight";
import { longSchema, buildDbPayload } from "../src/lib/inquiry";

for (const [value, expected] of [["25", 25], ["25kg", 25], ["25 kg", 25], ["25,5 kg", 25.5], ["25.5", 25.5], [" 60 KG ", 60]] as const) assert.equal(parseDogWeightKg(value), expected);
for (const value of ["", "kg", "-25", "0", "151", "1e2", "25 psov", "NaN"]) assert.equal(parseDogWeightKg(value), null);
const application = longSchema.parse({ typ: "prihlaska", consent: true, meno: "TEST", telefon: "+421900000401", pes: "TEST DOG", plemeno: "Labrador", vaha: "25,5 kg", pohlavie: "Pes", vek: "2 roky", kastrovana: "Nie", duvod: "Občas podľa potreby", viac: "TEST" });
const payload = buildDbPayload(application);
assert.equal(payload.dog_breed, "Labrador");
assert.equal(payload.dog_weight_kg, 25.5);
assert(!("dog_breed_weight" in payload));

const html = readFileSync(new URL("../system/admin-application-fields.html", import.meta.url), "utf8");
// Parse every script in the complete production snapshot, without running it.
const transpiler = new Bun.Transpiler({ loader: "js" });
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (script[1]?.trim()) transpiler.transformSync(script[1]);
const dom = new Window();
dom.document.body.innerHTML = html.slice(0, html.indexOf("<script"));
const inserted: Array<{ table: string; payload: any }> = [];
const state = { webSubmissions: [{ id: 1, dog_breed: "Labrador", dog_weight_kg: 25.5, dog_name: "TEST DOG", owner_name: "TEST", phone: "+421900000401", dog_sex: "male", dog_age_text: "2 roky", dog_neutered: false, dog_info: "TEST" }], introVisits: [], convertingSubmissionId: null, convertingIntroId: null } as any;
const context = vm.createContext({
  state, $: (id: string) => dom.document.getElementById(id), console, Number, String,
  setTimeout: () => {}, phoneLocalPart: () => "900000401", phoneWithPrefix: () => "+421900000401",
  esc: (v: unknown) => String(v ?? ""), alert: () => { throw Error("Unexpected alert"); },
  withJwtRetry: (callback: any) => callback(),
  supabase: { from: (table: string) => ({
    update: () => ({ eq: async () => ({ error: null }) }),
    insert: (value: any) => { inserted.push({ table, payload: value }); return { select: () => ({ single: async () => ({ data: { id: table === "dogs" ? 100 : 200, ...value }, error: null }) }) }; },
  }) },
  sendMetaCrmStage: async () => {}, loadData: async () => {}, openDog: async () => {},
  webSubmissionIntroNotes: () => "TEST", renderIntroVisits: () => {}, renderWeek: () => {}, switchTab: () => {}, queueAdminLive: () => {},
});
const names = ["parseAdminDogWeightKg", "parseAdminBreedWeight", "showDogCreateMode", "openDogCreate", "prefillSubmissionDog", "prefillSubmissionIntroVisit", "closeDogCreate", "createDog", "createIntroVisit"];
for (const name of names) {
  const match = new RegExp(`(?:async )?function ${name}\\(`).exec(html)!;
  assert(match, `Missing production function ${name}`);
  const remaining = html.slice(match.index);
  const next = /\n(?:async )?function \w+\(/.exec(remaining);
  vm.runInContext(next ? remaining.slice(0, next.index) : remaining, context);
}
for (const value of ["Labrador, 25 kg", "Labrador, cca 25 kg", "Labrador 25,5 kg"]) {
  const details = vm.runInContext(`parseAdminBreedWeight(${JSON.stringify(value)})`, context);
  assert.equal(details.breed, "Labrador");
  assert.equal(details.weight_kg, value.includes("25,5") ? 25.5 : 25);
}
await vm.runInContext("prefillSubmissionDog(1)", context);
assert.equal((dom.document.getElementById("newDogBreed") as any).value, "Labrador");
assert.equal((dom.document.getElementById("newDogWeightKg") as any).value, "25.5");
await vm.runInContext("createDog({preventDefault(){}})", context);
assert.equal(inserted.find((row) => row.table === "dogs")!.payload.weight_kg, 25.5);
assert.equal(inserted.find((row) => row.table === "dogs")!.payload.breed, "Labrador");
await vm.runInContext("prefillSubmissionIntroVisit(1)", context);
(dom.document.getElementById("introVisitDate") as any).value = "2026-10-07";
await vm.runInContext("createIntroVisit({preventDefault(){}})", context);
const intro = inserted.find((row) => row.table === "intro_visits")!.payload;
assert.equal(intro.weight_kg, 25.5);
state.introFixture = { id: 200, ...intro };
vm.runInContext("openDogCreate('application',state.introFixture)", context);
assert.equal((dom.document.getElementById("newDogBreed") as any).value, "Labrador");
assert.equal((dom.document.getElementById("newDogWeightKg") as any).value, "25.5");
await dom.happyDOM.abort();
console.log("Application dog details checks passed: decimal/kg input, separate payload fields, full admin script syntax, direct conversion, introduction conversion, and legacy applications.");
