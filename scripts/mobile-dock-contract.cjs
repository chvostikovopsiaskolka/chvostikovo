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

for (const value of ["Produkty", "Podmienky", "Cenník", "O nás", "Prihláška", "Menu"]) {
  assert(dock.includes(value), "Missing dock item " + value);
}
// The main SK order and route-local landing sequences are intentionally distinct.
const mainDock = dock.slice(dock.indexOf('    : [{ id: "o-nas", label: "O nás"'), dock.indexOf("// Return arrow: hide while moving down; show on upward scroll or after stopping."));
assert(mainDock.includes('{ id: "o-nas", label: "O nás"') && !mainDock.includes('{ id: "top", label: "Domov"'), "Main dock should replace Domov with O nás");
assert(mainDock.indexOf('id: "o-nas"') < mainDock.indexOf('id: "cennik"') && mainDock.indexOf('id: "cennik"') < mainDock.indexOf('id: "podmienky"') && mainDock.indexOf('id: "podmienky"') < mainDock.indexOf('id: "produkty"'), "Main nav order must be about, prices, requirements, products");
assert(!dock.includes('{ id: "top", label: "Domov"') && !dock.includes('{ id: "top", label: "Home"'), "Landing docks should use meaningful local sections instead of Domov");
assert(mainDock.includes('{ id: "produkty", label: "Produkty"') && !mainDock.includes('{ id: "priestory"'), "Main dock must replace Spaces with Products");
assert(dock.includes('id === "produkty" && !marketing ? "/produkty"'), "Products dock item must navigate to the actual catalogue, not a stale anchor");

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
for (const anchor of ["produkty", "starostlivost", "cennik", "lead-benefits", "lead-pricing", "puppy-benefits", "puppy-pricing", "dog-sitting-why", "dog-sitting-pricing", "en-benefits", "pricing"]) {
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
assert(css.includes('top: 50% !important;') && css.includes('transform: translate(-50%, -50%) !important;') && css.includes('.form-dialog[data-state]'), "Mobile form dialogs must be vertically centered");
assert(css.includes('max-height: calc(100svh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))') && css.includes('.form-dialog-scroll'), "Long form dialogs must retain a scrollable content panel below safe-area bounds");
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
for (const route of ["src/routes/psia-skolka-pre-steniatka.tsx", "src/routes/strazenie-psov-kosice.tsx", "src/routes/en.dog-daycare-kosice.tsx"]) {
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


// Conversion CTA structure: main Why explicitly starts the full dog application;
// First Visit and interest pricing remain short enquiries.
const story = read("src/components/site/Story.tsx");
const info = read("src/components/site/Info.tsx");
const why = story.slice(story.indexOf("export function Why()"), story.indexOf("export function About("));
const first = info.slice(info.indexOf("export function FirstVisit("), info.indexOf("export function Pricing("));
const pricing = info.slice(info.indexOf("export function Pricing("), info.indexOf("const PRIMARY_FAQ"));
assert(why.includes("Chcem prihlásiť psíka") && why.includes('<LongForm onSent={() => setApplicationSent(true)} />') && why.includes('title={applicationSent ? "Prihláška odoslaná" : "Prihlás svojho psíka ešte dnes"}'), "Why registration CTA must open full dog application with correct success header");
assert(!why.includes("<LeadStepForm"), "Why registration CTA must not open short inquiry");
assert(first.includes("Dohodnúť úvodnú návštevu") && first.includes('trackingSource="home_first_visit_interest"') && !first.includes("hideInterest") && !first.includes("interestValue"), "Intro visit CTA must show the ordinary required interest options");
assert(!first.includes("<LongForm"), "Intro visit should not present a full application");
const reviewHomepage = read("src/routes/index.tsx");
assert(reviewHomepage.includes('<FirstVisit inlineForm leadStyle />') && first.includes('id="prva-navsteva-form"') && first.includes('trackingSource="home_first_visit_interest"'), "Homepage first visit must expose the ordinary inline inquiry with its original tracking source");
assert(reviewHomepage.includes('<Pricing interestMode homeLayout />') && pricing.includes('data-home-pricing-columns') && pricing.includes('grid-cols-2'), "Homepage pricing must preserve two columns including narrow phones");
assert(info.includes('flex-nowrap items-center') && info.includes('sm:gap-2') && info.includes('Odvoz / vyzdvihnutie: 5 € / jazda'), "Taxi note must stay one-line and preserve 5 euro fare");
assert(info.includes('!text-[clamp(10px,2.75vw,14px)] !leading-tight whitespace-nowrap'), "Homepage inquiry CTA must stay one line on narrow phones");
assert(pricing.includes("Prihláška do škôlky") && pricing.includes("<LongForm />") && pricing.includes("<FormDialog") && pricing.includes('interestMode ? <LeadStepForm questionInHeading trackingSource="home_pricing_interest_20261028" />'), "Pricing must preserve canonical full-form mode and approved homepage short enquiry");
assert(!pricing.includes('href="#kontakt"'), "Pricing CTA must not misroute to generic contact");
assert(css.includes("margin-inline-start: 4px") && css.includes("margin-inline: 2px"), "Active dock and orange CTA must not touch");
assert(forms.includes("typ: \"prihlaska\"") && forms.includes("typ: \"informacie\""), "Preserve distinct lead and application types");

console.log("Mobile dock structural regression guards: PASS");

for (const [route, variant, marker] of [
  ["src/routes/strazenie-psov-kosice.tsx", "dog-sitting", "openInterest"],
]) {
  const source = read(route);
  assert(source.includes('hideMobileDock'), route + " must not render the normal shared mobile dock");
  assert(source.includes('variant="' + variant + '" onInterestOpen='), route + " must use route-local interest CTA");
  assert(source.includes(marker), route + " must call existing interest form logic");
}
const puppyAria = read("src/routes/psia-skolka-pre-steniatka.tsx");
assert(puppyAria.includes("<AriaLeadAssistant") &&
  puppyAria.includes('requirementsSectionId="puppy-first-visit"') &&
  puppyAria.includes("<AriaPuppyChecker") &&
  puppyAria.includes("puppy_landing_aria_interest") &&
  !puppyAria.includes("<MobileDock"),
  "Approved puppy landing must use Aria navigation and an accessible puppy-check/contact handoff, not two competing mobile docks");
const liveLead = read("src/routes/psia-skolka-kosice.tsx");
const ariaLead = read("src/routes/test-aria.tsx");
assert(liveLead.includes("component: AriaPreviewPage") && !liveLead.includes("component: LeadLandingPage") &&
  liveLead.includes('content: "noindex, follow"') && liveLead.includes('rel: "canonical"') &&
  ariaLead.includes("<AriaLeadAssistant") && !ariaLead.includes("<Header landingMinimal") &&
  ariaLead.includes("<LeadStepForm") && ariaLead.includes("<AriaPuppyChecker"),
  "Approved Aria must render on the paid campaign lead route with preserved canonical/noindex and a single stable dock");
const homepage = read("src/routes/index.tsx");
const homeChecker = read("src/components/site/HomePuppyChecker.tsx");
assert(homepage.includes("<HomePuppyChecker />") &&
  homeChecker.includes("<AriaPuppyChecker") &&
  homeChecker.includes("<LeadStepForm") &&
  homeChecker.includes("home_puppy_checker_eligible") &&
  homeChecker.includes("home_puppy_checker_info"),
  "Homepage puppy checker must retain shared contact, sourced submissions and no duplicate dock");
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
// Menu now exposes four compact icon-only actions, with localized accessible
// names and full-size touch targets (the visible language icon is EN/SK).
const menuActions = dock.slice(dock.indexOf('className="mobile-dock-menu-actions"'), dock.indexOf('className="mobile-dock-menu-logo"'));
assert(menuActions.includes('href={"tel:" + PHONE}') && menuActions.includes('href={english ? "/" : "/en/dog-daycare-kosice"}'), "Mobile phone and language actions required");
assert(menuActions.includes("href={INSTAGRAM}") && menuActions.includes("href={FACEBOOK}"), "Mobile social icons must use the canonical destinations");
assert(menuActions.includes("aria-label={english ?") && menuActions.includes("<Phone aria-hidden=") && menuActions.includes("<Instagram aria-hidden=") && menuActions.includes("<Facebook aria-hidden="), "Icon actions need accessible labels");
assert(css.includes("grid-template-columns: repeat(4, minmax(0, 1fr))") && css.includes("min-height: 50px;") && css.includes("border-radius: 14px;"), "Four equally sized rounded icon actions must fit mobile screens");


/* 23 Nov approved web finish gate: reusable soft shadow and unique first visit. */
const reviewComponent = read("src/components/site/Reviews.tsx");
const firstVisitComponent = read("src/components/site/Info.tsx");
const aboutComponent = read("src/components/site/Story.tsx");
const paidLeadRoute = read("src/routes/test-aria.tsx");
assert(reviewComponent.includes('data-home-video-layout={homeMobileLayout || undefined}') &&
       reviewComponent.includes('data-video-reasons-copy') &&
       reviewComponent.includes('font-extrabold text-cream'),
       "Homepage Why mobile must use portrait left + emphasized three-point right column");
assert(reviewComponent.includes('data-review-card') &&
       css.includes("Soft review card shadow contract") &&
       css.includes("padding-bottom: 3.75rem"),
       "Review cards must have a shared soft-edged shadow and enough scrollport room to fade");
assert(firstVisitComponent.includes("export const FIRST_VISIT_STEPS") &&
       paidLeadRoute.includes("FIRST_VISIT_STEPS.map") &&
       firstVisitComponent.includes("FIRST_VISIT_STEPS.map") &&
       !firstVisitComponent.includes('source="home_first_visit"'),
       "Home/paid first visit must reuse one three-step explanation without duplicate accordion");
assert(paidLeadRoute.includes("!isLiveLead && <details data-aria-visit-details"),
       "Paid LEAD must show the free-visit note without long duplicate accordion");
assert(firstVisitComponent.includes('text-[#ffa414]'),
       "Homepage requirements headings must use the approved orange, not the pink taxi accent");
assert(aboutComponent.includes('max-w-[680px]') &&
       aboutComponent.includes('data-safety-heading') &&
       aboutComponent.includes('size-7 shrink-0'),
       "About copy must be narrower and first-aid heading compact with a visible green check");


/* APP-01: physical narrow Android + product inquiry delivery after 23 Nov. */
const reviewReasons = read("src/components/site/Reviews.tsx");
const catalog = read("src/components/site/ProductCatalogCarousel.tsx");
const productContact = read("src/components/site/ProductInquiryContact.tsx");
const productSchema = read("src/lib/product-inquiry.ts");
const productEdge = read("supabase/functions/product-inquiry-submit/index.ts");
assert(reviewReasons.includes('data-home-video-layout={homeMobileLayout || undefined}') &&
       reviewReasons.includes('data-video-reasons-copy className="contents sm:flex') &&
       reviewReasons.includes('"grid-cols-2"'),
       "Mobile video layout must remain responsive and keep the 3 reasons");
assert(css.includes("real 320–379px Android") &&
       css.includes('min-height: 48px; padding: 3px 0; gap: 2px') &&
       css.includes('#top > div.relative.z-10.mt-11'),
       "Narrow Android should compress Hero and main dock without moving review carousel out of flow");
assert(catalog.includes('data-product-actions className="mt-auto') &&
       catalog.includes('pt-4 sm:pt-6'),
       "Product cards must bottom-align target and stand price/CTA rows");
assert(productContact.includes('Odkiaľ ste? (adresa, mesto, PSČ)') &&
       productContact.includes('name="customer_location"') &&
       productContact.includes('Hlavná 12, Košice, 040 01') &&
       !productContact.includes('name="delivery_mode"') &&
       !productContact.includes('name="delivery_street"'),
       "Keep one original location input with street, city and postcode; no extra delivery form");
const leadContact = read("src/components/site/LeadStepForm.tsx");
assert(productContact.includes('<PrivacyConsentCheckbox />') &&
       leadContact.includes('<PrivacyConsentCheckbox />'),
       "Both daycare and product inquiries must reuse exactly the same privacy notice");
assert(productSchema.includes("normalizeProductLocation(input.customer_location)") &&
       productSchema.includes('placePart.replace(/\\s*,\\s*/g, " ")') &&
       productEdge.includes('const customerLocation = text(input.customer_location, 120)') &&
       !productEdge.includes("Ulica a číslo, PSČ, Mesto"),
       "Normalize the original field to legacy endpoint format without Supabase changes");
assert(!productContact.includes('trackMarketingInteraction') &&
       !productContact.includes('MetaPixel') &&
       !productContact.includes('custom_audience'),
       "Product delivery contact information must not be copied to advertising audiences");

// Paid LEAD contract: orange editorial box stays. Muted amber glass CTA
// reveals the very SAME liquid/crown card as the lower visit form; the
// gallery stays directly below Hero until the hidden inline form is opened.
const paidLeadCurrent = read("src/routes/test-aria.tsx");
const ariaGuideCurrent = read("src/components/site/AriaLeadAssistant.tsx");
const storyCurrent = read("src/components/site/Story.tsx");
assert(paidLeadCurrent.includes('data-aria-lead-hero-cta') &&
       paidLeadCurrent.includes('aria-expanded={leadHeroFormOpen}') &&
       paidLeadCurrent.includes('hidden={isLiveLead && !leadHeroFormOpen}') &&
       paidLeadCurrent.includes('lead_landing_hero_orange_cta') &&
       paidLeadCurrent.includes('data-lead-inline-card') &&
       paidLeadCurrent.includes('data-aria-hero-form-dogs') &&
       paidLeadCurrent.includes('max-w-[294px]') &&
       paidLeadCurrent.includes('ariaPreview={!isLiveLead}') &&
       paidLeadCurrent.includes('space-y-4 text-left') &&
       paidLeadCurrent.includes('<SafetyCertificates homeLayout />') &&
       ariaGuideCurrent.includes('onRevealInlineForm') &&
       css.includes('.lead-brand-live [data-aria-lead-hero-cta]') &&
       css.includes('.lead-brand-live [data-aria-dock]') &&
       css.includes('.lead-brand-live [data-aria-service-badge]') &&
       !css.includes('.lead-brand-live #aria-hero-form [data-lead-inline-card]'),
       "Paid lead must reuse the same lower liquid form and crown, with narrow amber CTA and frosted Aria dock");
assert(storyCurrent.includes('max-w-[810px]') &&
       storyCurrent.includes('sm:h-72 lg:h-80') &&
       storyCurrent.includes('lg:px-4 lg:text-xs'),
       "Home desktop team image and all three green badges must share a wider row");
// Scope this assertion to the BOTTOM visit form: the hero now intentionally
// uses the SAME form-liquid-surface class before it. A global indexOf would
// confuse the two approved, independent form sections.
const lowerVisitForm = paidLeadCurrent.slice(paidLeadCurrent.indexOf('<section id="aria-first-visit-form"'));
const crownIndex = lowerVisitForm.indexOf('data-aria-first-visit-dogs');
const visitCardIndex = lowerVisitForm.indexOf('<div data-lead-form-shell={isLiveLead || undefined} className="form-liquid-surface');
const visitIntroIndex = lowerVisitForm.indexOf('{isLiveLead && visitFormIntro}');
assert(crownIndex >= 0 && visitCardIndex > crownIndex && visitIntroIndex > visitCardIndex &&
       visitIntroIndex < lowerVisitForm.indexOf('<LeadStepForm') &&
       paidLeadCurrent.includes('{isLiveLead && heroFormIntro}') &&
       paidLeadCurrent.includes('data-lead-pricing-extras={isLiveLead || undefined}'),
       "Paid lead headings belong inside both form cards below their crowns; pricing extras share a row");

// APP-01 responsive-mosaic restoration: reuse existing AriaMosaicGallery,
// the original eight GALLERY Wix asset IDs and matching 1600px/92Q CDN
// variants; never duplicate the moving carousel or alter preview's order.
const ariaMosaicCurrent = read("src/components/site/AriaMosaicGallery.tsx");
assert(paidLeadCurrent.includes('{isLiveLead && <AriaMosaicGallery paidLead />}') &&
       paidLeadCurrent.indexOf('{isLiveLead && benefitsSection}') <
         paidLeadCurrent.indexOf('{isLiveLead && <AriaMosaicGallery paidLead />}') &&
       paidLeadCurrent.indexOf('{isLiveLead && <AriaMosaicGallery paidLead />}') <
         paidLeadCurrent.indexOf('<section id="lead-faq"') &&
       ariaMosaicCurrent.includes('GALLERY.slice(0, 8)') &&
       ariaMosaicCurrent.includes('w_1600,h_1600,al_c,q_92,enc_auto') &&
       ariaMosaicCurrent.includes('w_900,h_900,al_c,q_85,enc_auto') &&
       ariaMosaicCurrent.includes('srcSet=') &&
       ariaMosaicCurrent.includes('Kde bude váš psík počas dňa?') &&
       ariaMosaicCurrent.includes('<PhotoLightbox photos={photos}'),
       "Paid LEAD must reuse the approved eight-photo mosaic below reasons, from higher-quality versions of the same originals");

/* APP-01 23.11: explicitly test reordered LEAD, mobile inline and narrow widths. */
const paid = read("src/routes/test-aria.tsx");
const ariaAssistant = read("src/components/site/AriaLeadAssistant.tsx");
assert(paid.indexOf('<section id="aria-hero-form"') < paid.indexOf('id="lead-photo-carousel"') &&
       paid.indexOf('id="lead-photo-carousel"') < paid.indexOf('<section id="aria-caretakers"'),
       "Paid LEAD must swap existing inline form and moving gallery without duplicates");
assert(hero.includes('data-home-hero-photos') &&
       hero.includes('data-home-hero-interest-cta') &&
       hero.includes('LEAD_REVIEW_GAP_PHOTOS') &&
       !hero.includes('data-home-hero-inline-mobile') &&
       read('src/routes/index.tsx').includes('data-home-hero-revealed-form') &&
       read('src/routes/index.tsx').includes('trackingSource="home_hero_interest_mobile" questionInHeading compact'),
       "Mobile home Hero must show two approved photos and reveal the shared 2-step form after reviews");
assert(leadContact.includes("compact = false") && leadContact.includes('min-h-[72px] py-2 sm:min-h-24'),
       "Only explicitly compact forms may shorten choices, without changing transport");
assert(ariaAssistant.includes('data-aria-interest-cta') && ariaAssistant.includes('aria-label="Mám záujem o škôlku"') &&
       css.includes('.lead-brand-live [data-aria-section-navigation] [data-aria-interest-cta]'),
       "Orange lead dock must open existing inline form, without changing preview docks");
assert(css.includes('@media (max-width: 359px)') && css.includes('#top h1 span { white-space: normal; }'),
       "320px Hero must allow title wrapping without horizontal overflow");
assert(reviewReasons.includes('row-span-2 min-w-0 self-stretch') &&
       reviewReasons.includes('data-home-reason-photo') && reviewReasons.includes('col-start-2 row-start-3'),
       "Three reasons stay in one column beside natural video and matching happy-dog photo");

// 23 Nov refined mobile composition: no marketing box or inline form before CTA.
assert(!hero.includes('home-hero-copy mx-auto mt-5 max-w-xl') && hero.includes('data-home-mobile-orange-phrase'),
  "Mobile hero must skip sales box and highlight the whole 'váš psík zamiluje' phrase");
for (const path of ["src/components/site/Hero.tsx","src/components/site/InquirySection.tsx","src/components/site/Contact.tsx","src/components/site/FormDialog.tsx","src/routes/test-aria.tsx"]) {
  assert(read(path).includes("form-liquid-surface"), path+" must use the liquid form panel");
}

// APP-01 mobile Hero media/CTA/review order + existing liquid panels.
assert(hero.includes('data-home-hero-photo={index + 1}') &&
       hero.includes('onMobileInquiryOpen()') &&
       read('src/routes/index.tsx').indexOf('data-home-hero-revealed-form') <
       read('src/routes/index.tsx').indexOf('<ReviewReasons variant="home"') &&
       css.includes('.site-brand #top [data-home-hero-photos]') &&
       css.includes('border: 2px solid rgb(184 46 127 / 32%)'),
       'Home mobile photo pair, CTA-to-inline-form and liquid border contract');


// APP-01 23 Nov: small mobile-only Hero spacing, one thinner CTA, and
// the existing gallery immediately after Why Chvostikovo + About.
const homePage = read("src/routes/index.tsx");
assert(homePage.indexOf('<About homeLayout />') < homePage.indexOf('<DaycarePhotoCarousel />') &&
       homePage.indexOf('<DaycarePhotoCarousel />') < homePage.indexOf('<Pricing interestMode homeLayout />') &&
       homePage.split('<DaycarePhotoCarousel />').length === 2,
       "Existing carousel belongs just below the Home Why/About sequence, once only");
assert(hero.includes('hero-cta-primary min-h-[46px]') &&
       css.includes('--hero-content-top: 2.25rem; /* mobile home Hero') &&
       css.includes('[data-home-hero-interest-cta] { min-height: 46px; padding-block: 0.5rem; }') &&
       css.includes('margin-top: clamp(1.75rem, 6.5vw, 2.25rem)'),
       "Mobile Hero needs a smaller CTA and real-flow spacing without changing desktop");
