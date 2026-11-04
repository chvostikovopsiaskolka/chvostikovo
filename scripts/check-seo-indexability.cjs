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


// Footer: single-row legal links with GDPR, centered copyright, divider,
// and restored branded Bellaris SVG. Existing cookie/UTM handlers remain unchanged.
const footerSource = fs.readFileSync("src/components/site/Contact.tsx", "utf8");
const footerStart = footerSource.indexOf("export function Footer");
const footerEnd = footerSource.indexOf("</footer>", footerStart);
const footerContent = footerSource.slice(footerStart, footerEnd);
assert(footerStart >= 0 && footerEnd > footerStart, "Footer component missing");
assert(footerContent.includes("flex-nowrap items-center justify-between"), "One-row legal nav missing");
assert(footerContent.includes("whitespace-nowrap"), "Legal nav should not wrap");
assert(footerContent.includes('setLegalDialog("cookies")'), "Cookies dialog missing");
assert(footerContent.includes('setLegalDialog("operator")'), "Operator dialog missing");
assert(footerContent.includes('setLegalDialog("privacy")'), "GDPR dialog missing");
assert(footerContent.includes("Ochrana osobných údajov – GDPR"), "Privacy accessible label missing");
assert(footerContent.includes("chvostikovo-open-cookie-settings"), "Cookie settings must work");
assert(footerContent.includes("mt-1 text-center"), "Copyright must be centered");
assert(footerContent.includes("border-t border-cream/25 pt-3 text-center"), "Badge must be below divider");
assert(footerContent.includes("footer-bellaris-liquid") && footerContent.includes("bellarisFooterLogo"), "Original Bellaris logo badge missing");
assert(footerContent.includes("utm_source=chvostikovo&utm_medium=referral&utm_campaign=footer_credit"), "Bellaris UTM changed");
assert(footerContent.includes("footer_bellaris_credit"), "Bellaris event name changed");
assert(footerContent.includes('isEnglish ? "All rights reserved." : "Všetky práva vyhradené."'), "EN copyright missing");
assert(footerContent.includes("min-h-11"), "Legal links must be touch accessible");
console.log("[seo] PASS: one-row legal GDPR, centered copyright, Bellaris badge and tracking intact");


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


// Retired shop aliases are static, noindex redirects, not checkout pages.
for (const legacy of ["kosik", "objednavka"]) {
  assert(!sitemap.includes("/" + legacy), "Retired shop route must stay outside sitemap");
  const redirectHtml = fs.readFileSync("dist/client/" + legacy + "/index.html", "utf8");
  assert(/http-equiv="refresh"/i.test(redirectHtml) && redirectHtml.includes("0;url=/produkty"), "Missing static products redirect: " + legacy);
  assert(redirectHtml.includes("noindex, follow"), "Retired alias must stay noindex");
  assert(!redirectHtml.includes("Košík je prázdny") && !redirectHtml.includes("Dokončenie objednávky"), "Checkout UI remains in alias HTML");
}
console.log("[seo] PASS: retired cart/checkout redirect aliases");


// New editorial pages must be discoverable, prerendered and have non-duplicated
// metadata and visible CTAs. Do not confuse blog information with service LPs.
for (const slug of [
  "kam-so-psom-pocas-pracovneho-dna",
  "je-psia-skolka-vhodna-pre-kazdeho-psa",
]) {
  const page = "/blog/" + slug;
  const canonical = "https://chvostikovo.sk" + page + "/";
  assert(sitemap.includes("<loc>" + canonical + "</loc>"), "Blog URL missing from sitemap: " + canonical);
  assert(pagesConfig.includes('{ path: "' + page + '" }'), "Blog route missing from prerender config: " + page);
  const file = "dist/client" + page + "/index.html";
  assert(fs.existsSync(file), "Blog prerender HTML missing: " + file);
  const markup = fs.readFileSync(file, "utf8");
  assert(markup.includes(canonical), "Blog canonical missing: " + canonical);
  assert(markup.includes('og:type') && markup.includes("article"), "Article OG metadata missing");
  assert(markup.includes("BlogPosting"), "BlogPosting JSON-LD missing");
  assert(markup.includes("Chvostíkovo"), "Article author/brand missing");
  assert(markup.includes("Chcem sa informovať o škôlke"), "Article inquiry CTA missing");
  assert(markup.includes('href="#zaujem"'), "Inquiry link must target visible inline form");
  assert(markup.includes('id="zaujem"'), "Visible inline form section is missing");
  assert(markup.includes('name="meno"') && markup.includes('name="telefon"'), "Inline inquiry fields missing from prerender");
  assert(markup.includes('href="/#cennik"'), "Pricing button below inquiry form missing");
  assert(markup.includes('href="/#podmienky"'), "Conditions button below inquiry form missing");
  const expectedPhotos = slug === "kam-so-psom-pocas-pracovneho-dna"
    ? ["blog-workday-cover-", "blog-workday-body-"]
    : ["blog-suitability-cover-", "blog-suitability-body-"];
  for (const photo of expectedPhotos) {
    assert(markup.includes(photo), "Missing owner-provided blog photo from prerender: " + photo);
  }
}
assert(sitemap.includes("<loc>https://chvostikovo.sk/blog/</loc>"), "Blog index missing from sitemap");
assert(pagesConfig.includes('{ path: "/blog" }'), "Blog index missing from prerender config");
assert(fs.existsSync("dist/client/blog/index.html"), "Blog index prerender missing");
assert(homeHtml.includes("Kam so psom počas pracovného dňa?"), "Blog carousel absent from homepage");
assert(!homeHtml.includes("Viac o živote v psej škôlke"), "Duplicate information section still visible");
assert(homeHtml.includes("Psia škôlka pre šteniatka"), "Puppy preview card missing from homepage");
assert(homeHtml.includes("blog-puppy-card-"), "Owner-provided puppy photo missing from homepage teaser");
assert(homeHtml.includes("/psia-skolka-pre-steniatka/#puppy-benefits"), "Puppy preview must link below the existing hero");
assert(!homeHtml.includes("Dog daycare in Košice"), "Old EN service card still exposed in homepage article section");
assert(!homeHtml.includes("Psia škôlka a stráženie psov"), "Old dog-sitting service card still exposed in homepage article section");
const blogIndex = fs.readFileSync("dist/client/blog/index.html", "utf8");
assert(blogIndex.includes("/psia-skolka-pre-steniatka/#puppy-benefits"), "Puppy guide missing from blog listing");
assert(!sitemap.includes("/blog/psia-skolka-pre-steniatka/"), "Do not invent a duplicate puppy blog URL");
assert(sitemap.includes("<loc>https://chvostikovo.sk/psia-skolka-pre-steniatka</loc>") ||
       sitemap.includes("<loc>https://chvostikovo.sk/psia-skolka-pre-steniatka/</loc>"), "Existing puppy SEO landing removed");
const puppyHtml = fs.readFileSync("dist/client/psia-skolka-pre-steniatka/index.html", "utf8");
assert(puppyHtml.includes('id="puppy-benefits"'), "Target text section under puppy hero missing");
console.log("[seo] PASS: single information carousel, puppy card anchored below hero; original LPs preserved");
console.log("[seo] PASS: blog index and two articles prerendered, canonical, schema, CTAs, homepage links");

// Product guides: unique product intent, canonical HTML, schema, current product
// photography, clear product CTA and reciprocal links to commercial details.
for (const spec of [
  {
    slug: "stojan-na-misky-pre-psa-vyhody-a-vyber",
    product: "stojan-na-misky-pre-psa",
    imageParts: ["stand-small-mia-", "stand-dark-"],
    expectedCopy: ["Poctivá výroba", "vodeodolne ošetrený", "vlkodavom", "barzojom", "refluxom"],
  },
  {
    slug: "target-na-cvicenie-psov-prve-cviky",
    product: "target-na-cvicenie-pre-psov",
    imageParts: ["target-large-dog-", "target-large-detail-"],
    expectedCopy: ["dotyk labkou", "výdrž", "veľkosť"],
  },
]) {
  const page = "/blog/" + spec.slug;
  const canonical = "https://chvostikovo.sk" + page + "/";
  const productPath = "/" + spec.product;
  const productCanonical = "https://chvostikovo.sk" + productPath;

  assert(sitemap.includes("<loc>" + canonical + "</loc>"), "Missing guide in sitemap: " + canonical);
  assert(pagesConfig.includes('{ path: "' + page + '" }'), "Guide missing from prerender: " + page);
  const htmlPath = "dist/client" + page + "/index.html";
  assert(fs.existsSync(htmlPath), "Guide HTML not prerendered: " + htmlPath);
  const markup = fs.readFileSync(htmlPath, "utf8");
  assert(markup.includes(canonical) && markup.includes('rel="canonical"'), "Guide canonical missing: " + page);
  assert(markup.includes("BlogPosting"), "Guide article structured data missing: " + page);
  assert(markup.includes('href="' + productPath + '"'), "Guide must link to correct product: " + page);
  assert(!markup.includes('href="#zaujem"'), "Product guide must not advertise daycare inquiry: " + page);
  for (const imagePart of spec.imageParts) {
    assert(markup.includes(imagePart), "Current real product photo missing: " + imagePart);
  }
  for (const copy of spec.expectedCopy) {
    assert(markup.toLocaleLowerCase("sk").includes(copy.toLocaleLowerCase("sk")), "Guide factual section missing: " + copy);
  }
  const productHtmlPath = "dist/client" + productPath + "/index.html";
  assert(fs.existsSync(productHtmlPath), "Product prerender missing: " + productHtmlPath);
  const productHtml = fs.readFileSync(productHtmlPath, "utf8");
  assert(sitemap.includes("<loc>" + productCanonical + "</loc>"), "Product sitemap canonical changed: " + productPath);
  assert(productHtml.includes("Product"), "Product structured data missing: " + productPath);
  assert(productHtml.includes('href="' + page + '/"'), "Product must link to guide: " + productPath);
  assert(productHtml.includes("Tri praktické"), "Product value cards removed: " + productPath);
}
assert(blogIndex.includes("stojan-na-misky-pre-psa-vyhody-a-vyber/"), "Stand guide missing from blog index");
assert(blogIndex.includes("target-na-cvicenie-psov-prve-cviky/"), "Target guide missing from blog index");
console.log("[seo] PASS: product sitemap + canonical + original photos + reciprocal guides + prerendered blog articles");

