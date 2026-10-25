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
for (const value of ["Home", "Why us?", "Reviews", "Prices", "Enquire", "Slovak version"]) {
  assert(dock.includes(value), "Missing EN item " + value);
}
for (const anchor of ["priestory", "starostlivost", "cennik", "lead-benefits", "lead-pricing", "puppy-benefits", "puppy-pricing", "dog-sitting-why", "dog-sitting-pricing", "why-daycare", "pricing"]) {
  assert(dock.includes(anchor), "Missing valid anchor " + anchor);
}
assert(dock.includes("onApplicationOpen?.()") && dock.includes("onInterestOpen?.()"), "Dock must delegate to existing modal openers");
assert(!/submitInquiry|fetch\(|createClient|supabase/i.test(dock), "Dock must not own network/form submission");
assert(dock.includes("window.requestAnimationFrame(() => window.requestAnimationFrame(execute))"), "Close sheet before routing");
assert(dock.includes("DialogPrimitive.Overlay") && dock.includes("DialogPrimitive.Content"), "Accessible menu required");
assert(dock.includes("menuEntries.map"), "Menu must preserve other links");
assert(dock.includes("PHONE") && dock.includes('lang={english ? "sk" : "en"}'), "Contacts and language required");
assert(header.includes("<MobileDock onApplicationOpen="), "Common SK header must expose dock");
assert(header.includes("<LongForm onSent=") && header.includes("<FormDialog open={open}"), "Use existing application form");
assert(english.includes('language="en" variant="en" onInterestOpen='), "EN uses its existing enquiry");
assert(css.includes("max-width: 1023px") && css.includes("min-width: 1024px"), "Mobile/desktop separation");
assert(css.includes("env(safe-area-inset-bottom") && css.includes("grid-template-columns: repeat(4"), "Safe area and six columns");
assert(css.includes("body:has([data-form-dialog]) .mobile-dock"), "Hide dock for every existing FormDialog");
assert(css.includes(".mobile-dock-menu") && css.includes("overflow-y: auto"), "Small-screen sheet scrolling");
assert(hero.includes("pt-7 pb-0 sm:pt-9 lg:pt-24"), "Mobile Hero spacing must be updated without touching desktop");
assert(form.includes('data-form-dialog="simple-v300"'), "Existing FormDialog mount contract");
assert(forms.includes("submitInquiry"), "Shared form logic retained");

/* iPhone Dynamic Island / Android cutout must not leave an unpainted Hero band.
   Preserve safe spacing for actual interactive text, never cover the notch. */
const root = read("src/routes/__root.tsx");
const pawCss = read("src/components/site/paw-trail-background.css");
assert(root.includes("viewport-fit=cover"), "Full-bleed viewport required for iOS status bar");
assert(css.includes("padding-top: env(safe-area-inset-top, 0px)"), "Non-Hero routes need safe top");
assert(css.includes("margin-top: calc(0px - env(safe-area-inset-top, 0px))"), "Hero backdrop must extend up behind status bar");
assert(css.includes("padding-top: calc(var(--hero-content-top) + env(safe-area-inset-top, 0px))"), "Hero text must stay below notch");
assert(hero.includes('className="hero-safe-top hero-safe-top-main'), "Main Hero full-bleed class");
for (const route of ["src/routes/psia-skolka-kosice.tsx", "src/routes/psia-skolka-pre-steniatka.tsx", "src/routes/strazenie-psov-kosice.tsx", "src/routes/en.dog-daycare-kosice.tsx"]) {
  assert(read(route).includes('className="hero-safe-top relative overflow-hidden'), "Landing full-bleed class missing: " + route);
}
assert(pawCss.includes("inset: 0;") && pawCss.includes("position: absolute;"), "Decorative paws must follow Hero bounds");

console.log("Mobile dock structural regression guards: PASS");

for (const [route, variant, marker] of [
  ["src/routes/psia-skolka-kosice.tsx", "lead", "openLeadModal"],
  ["src/routes/psia-skolka-pre-steniatka.tsx", "puppy", "openForm"],
  ["src/routes/strazenie-psov-kosice.tsx", "dog-sitting", "openInterest"],
]) {
  const source = read(route);
  assert(source.includes('hideMobileDock'), route + " must not render the normal shared mobile dock");
  assert(source.includes('variant="' + variant + '" onInterestOpen='), route + " must use route-local interest CTA");
  assert(source.includes(marker), route + " must call existing interest form logic");
}
assert(dock.includes("marketing ? \"Záujem\""), "Landing CTA must say Záujem");
assert(dock.includes("marketingExtra"), "Local first visit menu links required");
assert(dock.includes("homePath + \"#lead-first-visit\""), "Local lead visit link");
assert(dock.includes("homePath + \"#puppy-first-visit\""), "Local puppy visit link");
assert(dock.includes("homePath + \"#dog-sitting-first-visit\""), "Local dog visit link");
assert(read("src/components/site/LandingMobilePricing.tsx").includes("PRICING"), "Reuse current prices");

assert(dock.includes('className="mobile-dock-menu-title'), "Menu title must be visible");
assert(dock.includes('English version') && dock.includes('Slovak version'), "Menu languages must be spelled out");
assert(!dock.includes('{ label: "Stráženie psov"') && !dock.includes('{ label: "Dog sitting"'), "Dog-sitting link removed from menu");
assert(css.includes("min-height: 61px") && css.includes("padding: 16px 5px 2px"), "Logo needs separation from footer actions");
assert(css.includes("font-size: clamp(10.5px, 3vw, 12px)"), "Language buttons must fit narrow phones");
