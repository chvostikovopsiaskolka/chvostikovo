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

for (const value of ["Priestory", "Starostlivosť", "Cenník", "O nás", "Prihláška", "Menu"]) {
  assert(dock.includes(value), "Missing dock item " + value);
}
// The main SK order and route-local landing sequences are intentionally distinct.
const mainDock = dock.slice(dock.indexOf('    : [{ id: "starostlivost", label: "Starostlivosť"'), dock.indexOf("// Return arrow: hide while moving down; show on upward scroll or after stopping."));
assert(mainDock.includes('{ id: "o-nas", label: "O nás"') && !mainDock.includes('{ id: "top", label: "Domov"'), "Main dock should replace Domov with O nás");
assert(mainDock.indexOf('id: "starostlivost"') < mainDock.indexOf('id: "cennik"') && mainDock.indexOf('id: "cennik"') < mainDock.indexOf('id: "priestory"') && mainDock.indexOf('id: "priestory"') < mainDock.indexOf('id: "o-nas"'), "Main nav order must be care, prices, spaces, about");
assert(!dock.includes('{ id: "top", label: "Domov"') && !dock.includes('{ id: "top", label: "Home"'), "Landing docks should use meaningful local sections instead of Domov");
for (const anchor of ["lead-first-visit", "puppy-first-visit", "dog-sitting-first-visit", "en-first-visit"]) assert(dock.includes('id: "' + anchor + '"'), "Missing landing first-visit shortcut: " + anchor);

assert(dock.includes('delta > 0') && dock.includes('setShowBackToTop(false)') && dock.includes('window.setTimeout(() => {') && dock.includes('setShowBackToTop(true)') && dock.includes('}, 350)'), "Back-to-top must hide only during downward scroll and remain available after idle/up");
assert(dock.includes('className="mobile-dock-back-top"') && dock.includes('`mobile_dock_${variant}_back_to_top`'), "Return arrow must support all public variants with separate tracking");
assert(dock.includes('disabled={!hydrated || !showBackToTop || menuOpen}'), "Hidden arrow must not be interactive");
assert(dock.includes('english ? "Back to top" : "Späť hore"') && dock.includes('window.scrollTo({ top: 0'), "Accessible localized return-to-top behavior missing");
assert(dock.includes('`mobile_dock_${variant}_back_to_top`'), "Return clicks must be measured separately per variant from old Domov");
assert(css.includes('bottom: calc(100% + 9px)') && css.includes('border-radius: 999px') && css.includes('border: none;') && css.includes('.mobile-dock-back-top[data-visible="false"]'), "Arrow must be borderless round glass, above dock and hide without shift");

for (const value of ["First visit", "Why us?", "Interested in daycare", "Prices", "Slovak version"]) {
  assert(dock.includes(value), "Missing EN item " + value);
}
for (const anchor of ["priestory", "starostlivost", "cennik", "lead-benefits", "lead-pricing", "puppy-benefits", "puppy-pricing", "dog-sitting-why", "dog-sitting-pricing", "en-benefits", "pricing"]) {
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
assert(css.includes("body:has(.hero-safe-top)") && css.includes("padding-top: 0"), "Hero routes must not inherit the body safe-area blank strip");
assert(css.includes("margin-top: 0;") && css.includes("--hero-safe-inset: env(safe-area-inset-top"), "Hero must handle safe area without a collapsing negative margin");
assert(root.includes('name="theme-color"') && root.includes("whiteHeroPaths.has(pathname)"), "Match initial Safari top-bar colour to the Hero");
assert(css.includes("padding-top: calc(var(--hero-content-top) + var(--hero-safe-inset))"), "Hero text must stay below notch");
assert(hero.includes('className="hero-safe-top hero-safe-top-main'), "Main Hero full-bleed class");
for (const route of ["src/routes/psia-skolka-kosice.tsx", "src/routes/psia-skolka-pre-steniatka.tsx", "src/routes/strazenie-psov-kosice.tsx", "src/routes/en.dog-daycare-kosice.tsx"]) {
  assert(read(route).includes('className="hero-safe-top relative overflow-hidden'), "Landing full-bleed class missing: " + route);
}
assert(pawCss.includes("inset: 0;") && pawCss.includes("position: absolute;"), "Decorative paws must follow Hero bounds");

// Top static paw trial: only Hero decoration, no separate overlay or fixed
// positioning that would follow the user into other sections.
const pawComponent = read("src/components/site/PawTrailBackground.tsx");
assert(pawComponent.includes("const TOP_EDGE_PAWS = ["), "Top static paws source missing");
assert(pawComponent.includes('className={`paw-top-edge-print'), "Top static paws not rendered");
assert(pawCss.includes(".paw-top-edge-print { display: none; }"), "Static paws must stay hidden on desktop");
assert(pawCss.includes(".paw-top-edge-print { display: block; opacity: 0.22; }"), "Top paws must appear softly on mobile");

// Premium CTA top-light contract: unchanged controls with additive surface depth.
for (const selector of [
  ".btn-coral,",
  ".btn-forest,",
  ".mobile-dock-item.mobile-dock-apply,",
  ".mobile-dock-menu-actions a:first-child {",
]) {
  assert(css.includes(selector), "Premium lighting selector missing: " + selector);
}
assert(css.includes("inset 0 1px 0 rgba(255, 255, 255, 0.48)"), "Top bevel light missing");
assert(css.includes("inset 0 -2px 0 var(--cta-lower-edge)"), "Bottom inner shadow missing");
assert(css.includes("0 9px 21px -6px var(--cta-drop-shadow)"), "Soft drop shadow missing");
assert(css.includes("@media (hover: hover) and (pointer: fine)"), "Hover glow must not affect touch");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion preference required");
assert(!css.includes("transform: scale("), "CTA must not scale on touch and shift adjacent labels");


// Conversion CTA structure: Why and First Visit remain enquiries; homepage Pricing
// now opens a tracked short enquiry while preserving the full-form alternate mode.
const story = read("src/components/site/Story.tsx");
const info = read("src/components/site/Info.tsx");
const why = story.slice(story.indexOf("export function Why()"), story.indexOf("export function About("));
const first = info.slice(info.indexOf("export function FirstVisit()"), info.indexOf("export function Pricing("));
const pricing = info.slice(info.indexOf("export function Pricing("), info.indexOf("const PRIMARY_FAQ"));
assert(why.includes("Hľadám škôlku pre psíka") && why.includes('<ShortForm trackingSource="home_why_interest" />'), "Why CTA must open tracked short enquiry");
assert(!why.includes("<LongForm"), "Why should not duplicate full registration");
assert(first.includes("Dohodnúť úvodnú návštevu") && first.includes('trackingSource="home_first_visit_interest"') && !first.includes("hideInterest") && !first.includes("interestValue"), "Intro visit CTA must show the ordinary required interest options");
assert(!first.includes("<LongForm"), "Intro visit should not present a full application");
assert(info.includes('flex-nowrap items-center') && info.includes('sm:gap-2') && info.includes('Odvoz / vyzdvihnutie: 5 € / jazda'), "Taxi note must stay one-line and preserve 5 euro fare");
assert(info.includes('!text-[clamp(10px,2.75vw,14px)] !leading-tight whitespace-nowrap'), "Homepage inquiry CTA must stay one line on narrow phones");
assert(pricing.includes("Prihláška do škôlky") && pricing.includes("<LongForm />") && pricing.includes("<FormDialog") && pricing.includes('interestMode ? <ShortForm trackingSource="home_pricing_interest_20261028" />'), "Pricing must preserve canonical full-form mode and approved homepage short enquiry");
assert(!pricing.includes('href="#kontakt"'), "Pricing CTA must not misroute to generic contact");
assert(css.includes("margin-inline-start: 4px") && css.includes("margin-inline: 2px"), "Active dock and orange CTA must not touch");
assert(forms.includes("typ: \"prihlaska\"") && forms.includes("typ: \"informacie\""), "Preserve distinct lead and application types");

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
assert(dock.includes('label: "Mám záujem o škôlku"') && dock.includes('label: "Interested in daycare"'), "Landing CTA must have full SK/EN label");
assert(dock.includes("marketingExtra"), "Local first visit menu links required");
assert((dock.match(/id: "interest", label:/g) || []).length === 4, "Four marketing routes must have one prominent interest CTA");
assert(!dock.includes('{ id: "recenzie", label: "Recenzie", icon: ImageIcon }'), "Reviews must leave marketing docks");
assert(!dock.includes('{ id: "reviews", label: "Reviews", icon: ImageIcon }'), "Reviews must leave EN dock");
assert(dock.includes('id === "interest" ? (') && dock.includes('{!marketing && ('), "Interest must sit between Why and Pricing, with main site unchanged");
assert(dock.includes('trackCookielessInteraction("nav_click", source, language)'), "Navigation must use dedicated cookieless events");
assert(dock.includes('trackCookielessInteraction("inquiry_cta", "en_mobile_dock", "en")'), "EN interest CTA tracking required");
assert(dock.includes('trackMarketingInteraction("view_pricing", source)'), "Dock pricing should preserve consented Pixel interest");
assert(dock.includes('trackMarketingInteraction("view_care", source)'), "Main dock care should be consented Pixel interest");
assert(css.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(100px, 1.9fr)'), "Wide centered CTA must only apply to marketing docks");
const cookieless = read("src/lib/cookieless-interactions.ts");
const analytics = read("src/lib/analytics.ts");
const trackingEdge = read("supabase/functions/website-landing-event/index.ts");
assert(cookieless.includes('  | "nav_click"'), "Client event type nav_click missing");
assert(trackingEdge.includes('  "nav_click",'), "Active tracking allowlist source must accept nav_click");
assert(analytics.includes('trackMetaCustom("ViewCare"'), "Care Pixel event missing");
assert(!dock.includes('onClick={() => trackMarketingInteraction("phone_click"'), "Phone tracking must not be double-sent");

assert(dock.includes("homePath + \"#lead-first-visit\""), "Local lead visit link");
assert(dock.includes("homePath + \"#puppy-first-visit\""), "Local puppy visit link");
assert(dock.includes("homePath + \"#dog-sitting-first-visit\""), "Local dog visit link");
assert(read("src/components/site/LandingMobilePricing.tsx").includes("PRICING"), "Reuse current prices");

assert(dock.includes('className="mobile-dock-menu-title'), "Menu title must be visible");
assert(dock.includes('English version') && dock.includes('Slovak version'), "Menu languages must be spelled out");
assert(!dock.includes('{ label: "Stráženie psov"') && !dock.includes('{ label: "Dog sitting"'), "Dog-sitting link removed from menu");
assert(css.includes("min-height: 61px") && css.includes("padding: 16px 5px 2px"), "Logo needs separation from footer actions");
assert(css.includes("font-size: clamp(10.5px, 3vw, 12px)"), "Language buttons must fit narrow phones");
