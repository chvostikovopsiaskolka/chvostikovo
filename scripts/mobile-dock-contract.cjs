/** Static release guard: run before review. Browser/device E2E is a separate gate. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = (path) => fs.readFileSync(path, "utf8");

const dock = read("src/components/site/MobileDock.tsx");
const header = read("src/components/site/Header.tsx");
const english = read("src/routes/en.dog-daycare-kosice.tsx");
const css = read("src/styles.css");
const hero = read("src/components/site/Hero.tsx");
const form = read("src/components/site/FormDialog.tsx");
const forms = read("src/components/site/Forms.tsx");

for (const value of ["Domov", "Priestory", "Starostlivosť", "Cenník", "Prihláška", "Menu"]) {
  assert(dock.includes(value), "Missing dock item " + value);
}
for (const value of ["Home", "Spaces", "Care", "Prices", "Enquire", "SK"]) {
  assert(dock.includes(value), "Missing EN item " + value);
}
for (const anchor of ["priestory", "starostlivost", "cennik", "spaces", "care", "pricing"]) {
  assert(dock.includes(anchor), "Missing valid anchor " + anchor);
}
assert(dock.includes("onApplicationOpen()"), "Dock must use existing modal opener");
assert(!/submitInquiry|fetch\(|createClient|supabase/i.test(dock), "Dock must not own network/form submission");
assert(dock.includes("window.requestAnimationFrame(() => window.requestAnimationFrame(execute))"), "Close sheet before routing");
assert(dock.includes("DialogPrimitive.Overlay") && dock.includes("DialogPrimitive.Content"), "Accessible menu required");
assert(dock.includes("menuEntries.map"), "Menu must preserve other links");
assert(dock.includes("PHONE") && dock.includes('lang={english ? "sk" : "en"}'), "Contacts and language required");
assert(header.includes("<MobileDock onApplicationOpen="), "Common SK header must expose dock");
assert(header.includes("<LongForm onSent=") && header.includes("<FormDialog open={open}"), "Use existing application form");
assert(english.includes('language="en" onApplicationOpen='), "EN uses its existing enquiry");
assert(css.includes("max-width: 1023px") && css.includes("min-width: 1024px"), "Mobile/desktop separation");
assert(css.includes("env(safe-area-inset-bottom") && css.includes("grid-template-columns: repeat(4"), "Safe area and six columns");
assert(css.includes("body:has([data-form-dialog]) .mobile-dock"), "Hide dock for every existing FormDialog");
assert(css.includes(".mobile-dock-menu") && css.includes("overflow-y: auto"), "Small-screen sheet scrolling");
assert(hero.includes("pt-4 pb-0 sm:pt-6 lg:pt-24"), "Hero should not reserve removed mobile header");
assert(form.includes('data-form-dialog="simple-v300"'), "Existing FormDialog mount contract");
assert(forms.includes("submitInquiry"), "Shared form logic retained");
console.log("Mobile dock structural regression guards: PASS");
