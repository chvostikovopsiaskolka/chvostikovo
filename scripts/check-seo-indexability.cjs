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
