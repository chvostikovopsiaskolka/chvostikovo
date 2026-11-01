const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../src/components/site/Contact.tsx"), "utf8");
const start = source.indexOf("export function Footer");
assert.ok(start >= 0, "Footer component missing");
const footer = source.slice(start);
const navStart = footer.indexOf("<nav");
const navEnd = footer.indexOf("</nav>", navStart);
const nav = footer.slice(navStart, navEnd);

assert.ok(footer.includes("grid-cols-[minmax(0,1fr)_minmax(6rem,auto)]"));
assert.ok(footer.includes("max-w-[26rem] grid-cols-2"), "Legal links must use 2 columns");
assert.ok(footer.includes("justify-self-end text-right"), "Copyright should be aligned right");
assert.ok(footer.includes("mt-5 border-t border-cream/25 pt-3 text-center"), "Divider and centered maker credit missing");

const labels = ['setLegalDialog("cookies")', 'setLegalDialog("operator")', 'setLegalDialog("privacy")', "chvostikovo-open-cookie-settings"];
let previous = -1;
for (const label of labels) {
  const pos = nav.indexOf(label, previous + 1);
  assert.ok(pos > previous, "Missing or incorrectly ordered legal control: " + label);
  previous = pos;
}
assert.ok(nav.includes("isEnglish ?"), "SK/EN legal links must remain");
assert.ok(footer.indexOf("© {new Date().getFullYear()} Chvostíkovo") < footer.indexOf("mt-5 border-t border-cream/25"));
assert.ok(footer.includes("utm_source=chvostikovo&utm_medium=referral&utm_campaign=footer_credit"));
assert.ok(footer.includes('trackCookielessInteraction("nav_click", "footer_bellaris_credit", language)'));
assert.ok(footer.includes('isEnglish ? "All rights reserved." : "Všetky práva vyhradené."'));
assert.ok(footer.includes('isEnglish ? "Website by" : "Web vytvoril"'));
assert.ok(footer.includes("min-h-11"), "Legal links and credit must have touch-sized targets");
assert.ok(!footer.includes("footer-bellaris-liquid"), "Large badge must be replaced by a subtle credit");
console.log("PASS legal links 2x2 left, copyright right, divider and Bellaris center (SK/EN, UTM)");
