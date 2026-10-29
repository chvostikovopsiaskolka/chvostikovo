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
