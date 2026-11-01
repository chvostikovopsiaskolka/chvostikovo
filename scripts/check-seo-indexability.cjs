// Regression guard for the public lead landing: discovery + prerender + canonical.
// Run after "bun run build:pages". No network or customer data required.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const url = "https://chvostikovo.sk/psia-skolka-kosice/";
const route = "/psia-skolka-kosice";
const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
const pagesConfig = fs.readFileSync("vite.config.pages.ts", "utf8");
const normalizer = fs.readFileSync("scripts/finalize-pages.mjs", "utf8");
assert(sitemap.includes("<loc>" + url + "</loc>"), "Lead page missing from sitemap");
assert(pagesConfig.includes('{ path: "' + route + '" }'), "Lead page missing from prerender routes");
assert(normalizer.includes('"https://chvostikovo.sk' + route + '"'), "Missing GitHub Pages canonical normalization");
const output = "dist/client/psia-skolka-kosice/index.html";
assert(fs.existsSync(output), "Pre-rendered lead HTML missing: " + output);
const html = fs.readFileSync(output, "utf8");
assert(html.includes("Psia škôlka Košice"), "Pre-rendered HTML missing landing title/content");
assert(html.includes(url), "Pre-rendered HTML missing normalized canonical URL");
console.log("[seo] PASS: sitemap + prerender + canonical for " + route);

// Credit is a genuine outbound reference and should not alter existing SEO routes.
const homeHtml = fs.readFileSync("dist/client/index.html", "utf8");
assert(homeHtml.includes("utm_source=chvostikovo"), "Bellaris credit missing UTM source");
assert(homeHtml.includes("utm_medium=referral"), "Bellaris credit missing UTM medium");
assert(homeHtml.includes("utm_campaign=footer_credit"), "Bellaris credit missing UTM campaign");
assert(homeHtml.includes("Web vytvoril"), "Footer credit not rendered in home HTML");
assert(homeHtml.includes("Bellaris"), "Original Bellaris wordmark must retain alt text");
console.log("[seo] PASS: Bellaris footer credit and outbound attribution");

// The map widget itself contains the Google Maps opening action. Keep its
// original iframe/consent flow and linked address, not a duplicate CTA above.
const contactSource = fs.readFileSync("src/components/site/Contact.tsx", "utf8");
const mapMarkup = contactSource.slice(contactSource.indexOf("function ContactDetails("), contactSource.indexOf("function ContactRow("));
assert(mapMarkup.includes("<FunctionalMap language={language} />"), "Contact map widget missing");
assert(mapMarkup.includes("<iframe") && mapMarkup.includes("output=embed"), "Google Maps embed removed");
assert(mapMarkup.includes("href={MAP_LINK}"), "Contact address map link removed");
assert(!mapMarkup.includes("Otvoriť v Google Mapách") && !mapMarkup.includes("Open in Google Maps"), "Duplicate map CTA restored");
console.log("[seo] PASS: contact map retained without redundant Google Maps CTA");


// Footer: 2x2 legal links left + copyright right, then a divider and centered,
// understated Bellaris attribution (SK/EN). Cookies and analytics handlers unchanged.
const footerSource = fs.readFileSync("src/components/site/Contact.tsx", "utf8");
const footerStart = footerSource.indexOf("export function Footer");
const footerEnd = footerSource.indexOf("</footer>", footerStart);
const footerContent = footerSource.slice(footerStart, footerEnd);
assert(footerStart >= 0 && footerEnd > footerStart, "Footer component missing");
assert(footerContent.includes("grid-cols-[minmax(0,1fr)_minmax(6rem,auto)]"), "Footer right copyright column missing");
assert(footerContent.includes("max-w-[26rem] grid-cols-2"), "Legal 2x2 layout missing");
assert(footerContent.includes("justify-self-end text-right"), "Copyright must be right aligned");
assert(footerContent.includes("border-t border-cream/25 pt-3 text-center"), "Creator credit must be centered below divider");
assert(footerContent.includes('setLegalDialog("cookies")'), "Cookies legal dialog must work");
assert(footerContent.includes('setLegalDialog("operator")'), "Operator legal dialog must work");
assert(footerContent.includes('setLegalDialog("privacy")'), "GDPR legal dialog must work");
assert(footerContent.includes("chvostikovo-open-cookie-settings"), "Cookie settings must work");
assert(footerContent.includes("utm_source=chvostikovo&utm_medium=referral&utm_campaign=footer_credit"), "Footer attribution UTM changed");
assert(footerContent.includes("footer_bellaris_credit"), "Footer event name changed");
assert(footerContent.includes('isEnglish ? "Website by" : "Web vytvoril"'), "English credit missing");
assert(footerContent.includes('isEnglish ? "All rights reserved." : "Všetky práva vyhradené."'), "Localized copyright missing");
assert(footerContent.includes("min-h-11"), "Footer touch targets too small");
assert(!footerContent.includes("footer-bellaris-liquid"), "Large decorative badge must not return");
console.log("[seo] PASS: legal links left, copyright right, subtle centered Bellaris credit, UTM and handlers intact");


// FAQ route must be crawlable from initial HTML (not only from the SPA 404 fallback).
// Keep this isolated from the homepage and conversion/marketing flows.
const faqRoute = "/caste-otazky";
const faqUrl = "https://chvostikovo.sk/caste-otazky/";
assert(sitemap.includes("<loc>" + faqUrl + "</loc>"), "FAQ page missing from sitemap");
assert(pagesConfig.includes('{ path: "' + faqRoute + '" }'), "FAQ page missing from prerender routes");
const faqOutput = "dist/client/caste-otazky/index.html";
assert(fs.existsSync(faqOutput), "Pre-rendered FAQ HTML missing: " + faqOutput);
const faqHtml = fs.readFileSync(faqOutput, "utf8");
assert(faqHtml.includes("Časté otázky | Psia škôlka"), "FAQ HTML missing its unique SEO title");
assert(faqHtml.includes("Odpovede na časté otázky"), "FAQ HTML missing its unique description");
assert(faqHtml.includes('rel="canonical"') && faqHtml.includes(faqUrl), "FAQ HTML missing its canonical URL");
assert(faqHtml.includes("FAQPage"), "FAQ HTML missing structured FAQ data");
console.log("[seo] PASS: sitemap + prerender + title + description + canonical + FAQPage for " + faqRoute);
