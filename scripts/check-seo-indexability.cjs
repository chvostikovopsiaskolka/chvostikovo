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

// Keep the original small logo in the SAME footer row as copyright/legal links.
const footerSource = fs.readFileSync("src/components/site/Contact.tsx", "utf8");
const footerStart = footerSource.indexOf('export function Footer');
const rowStart = footerSource.indexOf('className="mt-6 flex flex-wrap items-center', footerStart);
const rowEnd = footerSource.indexOf('</footer>', rowStart);
const lowerFooter = footerSource.slice(rowStart, rowEnd);
assert(rowStart > footerStart, "Footer copyright/legal layout row missing");
assert(lowerFooter.includes('footer_bellaris_credit'), "Bellaris link must share copyright/legal row");
assert(lowerFooter.includes('width={84} height={32}'), "Bellaris wordmark must use the compact size");
assert(lowerFooter.includes('className="h-7 w-auto object-contain"'), "Compact wordmark height missing");
assert(!lowerFooter.includes('border-t border-cream/15'), "Credit must not occupy a separate bordered row");
console.log("[seo] PASS: compact Bellaris credit shares copyright/legal row");



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
