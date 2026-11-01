const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const content = fs.readFileSync(path.join(__dirname, "../src/components/site/Contact.tsx"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf8");
const start=content.indexOf("export function Footer");
const footer=content.slice(start);
assert.ok(start>=0,"Footer component missing");
const nav=footer.slice(footer.indexOf("<nav"),footer.indexOf("</nav>"));
assert.ok(nav.includes("flex-nowrap items-center justify-between"),"Four legal links must remain on one row");
assert.ok(nav.includes("whitespace-nowrap"),"Legal links should not break");
let previous=-1;
for(const x of ['setLegalDialog("cookies")','setLegalDialog("operator")','setLegalDialog("privacy")',"chvostikovo-open-cookie-settings"]){
 const pos=nav.indexOf(x,previous+1);
 assert.ok(pos>previous,"Missing or out of order legal action: "+x);
 previous=pos;
}
assert.ok(nav.includes("Ochrana osobných údajov – GDPR"),"GDPR accessible label absent");
assert.ok(nav.includes(">\n              GDPR\n"),"Visible GDPR link absent");
assert.ok(footer.includes("mt-1 text-center"),"Copyright must be centered");
assert.ok(footer.indexOf("© {new Date().getFullYear()} Chvostíkovo") < footer.indexOf("mt-5 border-t border-cream/25"),"Copyright must precede divider");
assert.ok(footer.includes("footer-bellaris-liquid"),"Original branded Bellaris badge not restored");
assert.ok(footer.includes("bellarisFooterLogo"),"Original Bellaris SVG missing");
assert.ok(styles.includes("oklch(0.2 0.04 222)"),"Petrol brand color missing");
assert.ok(footer.includes("utm_source=chvostikovo&utm_medium=referral&utm_campaign=footer_credit"),"UTM changed");
assert.ok(footer.includes('trackCookielessInteraction("nav_click", "footer_bellaris_credit", language)'),"Attribution event changed");
assert.ok(footer.includes('isEnglish ? "All rights reserved." : "Všetky práva vyhradené."'),"EN footer not preserved");
assert.ok(footer.includes('chvostikovo-open-cookie-settings'),"Cookie settings handler missing");
assert.ok(footer.includes("min-h-11"),"Tap target missing");
console.log("PASS four legal links on one row, GDPR, copyright center, restored Bellaris badge (SK/EN)");
