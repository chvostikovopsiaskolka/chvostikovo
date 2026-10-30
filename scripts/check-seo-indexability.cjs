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

// Footer: original credit on the left, two-line copyright center, legal links right.
const footerSource = fs.readFileSync("src/components/site/Contact.tsx", "utf8");
const footerStyles = fs.readFileSync("src/styles.css", "utf8");
const footerStart = footerSource.indexOf("export function Footer");
const rowStart = footerSource.indexOf('className="mt-6 grid grid-cols-1', footerStart);
const rowEnd = footerSource.indexOf("</footer>", rowStart);
const lowerFooter = footerSource.slice(rowStart, rowEnd);
assert(rowStart > footerStart, "Shared footer layout row missing");
assert(lowerFooter.includes("lg:grid-cols-[auto_minmax(0,1fr)_auto]"), "Desktop must place credit, copyright and legal links in 3 columns");
assert(lowerFooter.includes("xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"), "Wide desktop must center the copyright between equal side columns");
assert(lowerFooter.indexOf("footer_bellaris_credit") < lowerFooter.indexOf("© {new Date().getFullYear()} Chvostíkovo"), "Bellaris original logo must be on the left");
assert(lowerFooter.indexOf("© {new Date().getFullYear()} Chvostíkovo") < lowerFooter.indexOf('aria-label={isEnglish ? "Legal information"'), "Copyright must precede right legal links");
assert(lowerFooter.includes('<span className="block">© {new Date().getFullYear()} Chvostíkovo</span>'), "Copyright must be on a separate centered line");
assert(lowerFooter.includes('<span className="block">{isEnglish ? "All rights reserved." : "Všetky práva vyhradené."}</span>'), "Rights notice must be on the following line");
assert(lowerFooter.includes("justify-self-center text-center"), "Copyright and rights must be centered");
assert(lowerFooter.includes("flex-nowrap") && lowerFooter.includes("whitespace-nowrap"), "Legal actions must never wrap into multiple lines");
assert(lowerFooter.includes("overflow-x-auto") && lowerFooter.includes("lg:overflow-visible"), "Mobile legal row must scroll within its container, not overflow page");
assert(lowerFooter.includes("lg:justify-self-end lg:justify-end"), "Legal links must stay aligned right");
assert(lowerFooter.includes("footer-bellaris-liquid") && footerStyles.includes("var(--forest-deep)"), "Badge must use existing deep forest color");
assert(lowerFooter.includes("width={84} height={32}"), "Original Bellaris wordmark size changed unexpectedly");
assert(lowerFooter.includes("min-h-11"), "Footer link touch target must remain at least 44px");
assert(lowerFooter.includes("utm_source=chvostikovo&utm_medium=referral&utm_campaign=footer_credit"), "Footer UTM attribution changed unexpectedly");
assert(lowerFooter.includes("footer_bellaris_credit"), "Footer outbound event name changed unexpectedly");
assert(footerStyles.includes(".footer-bellaris-liquid::before") && footerStyles.includes(".footer-bellaris-liquid::after"), "Liquid surface must retain scoped decorative layers");
assert(footerStyles.includes("@media (prefers-reduced-motion: reduce)"), "Reduced-motion treatment missing");
console.log("[seo] PASS: Bellaris left, two-line copyright centered, legal row single-line right, original UTM untouched");


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
