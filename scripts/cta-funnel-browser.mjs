import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4173";
await mkdir("artifacts/mobile-dock", { recursive: true });
for (let n = 0; n < 45; n++) {
  try {
    const response = await fetch(base);
    if (response.ok) break;
  } catch {}
  if (n === 44) throw Error("Preview Vite server unavailable");
  await new Promise(resolve => setTimeout(resolve, 400));
}

for (const { engine, type, width, height } of [
  { engine: chromium, type: "chromium", width: 320, height: 740 },
  { engine: chromium, type: "chromium", width: 390, height: 844 },
  { engine: webkit, type: "webkit", width: 390, height: 844 },
  { engine: chromium, type: "chromium", width: 1024, height: 768 },
  { engine: chromium, type: "chromium", width: 1440, height: 900 },
]) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 1024,
      hasTouch: width < 1024,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    // No test event may reach the production analytics or lead endpoints.
    await page.route("**/*supabase.co/**", route => route.fulfill({ status: 204, body: "" }));

    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.locator("h1:visible").first().waitFor({ timeout: 20000 });
    const consent = page.getByRole("dialog", { name: /Používame cookies|We use cookies/i });
    if (await consent.isVisible()) {
      await consent.getByRole("button", { name: /Len nevyhnutné|Necessary only/i }).click();
      await page.getByRole("status").waitFor({ state: "hidden", timeout: 12000 });
    }

    const pairs = [
      { id: "prva-navsteva", name: "Dohodnúť úvodnú návštevu", title: /Dohodnúť bezplatnú úvodnú návštevu/, kind: "short" },
      { id: "preco", name: "Hľadám škôlku pre psíka", title: /Máte záujem o škôlku/, kind: "short" },
      { id: "cennik", name: "Prihláška do škôlky", title: /Prihláška do škôlky/, kind: "long" },
    ];
    for (const choice of pairs) {
      const section = page.locator("#" + choice.id);
      const button = section.getByRole("button", { name: choice.name, exact: true });
      await button.scrollIntoViewIfNeeded();
      await button.click();
      const dialog = page.locator("[data-form-dialog]");
      await dialog.waitFor({ state: "visible" });
      const actualTitle = dialog.getByRole("heading", { name: choice.title });
      assert(await actualTitle.count() > 0, type + width + " wrong dialog title " + choice.id);
      assert(await dialog.locator('input[name="meno"]').count() > 0, "Missing contact name input");
      assert(await dialog.locator('input[name="telefon"]').count() > 0, "Missing contact phone input");
      if (choice.kind === "short") {
        assert.equal(await dialog.locator('input[name="pes"]').count(), 0, "Full application incorrectly opened");
        if (choice.id === "prva-navsteva")
          assert.equal(await dialog.locator('input[name="zaujem"]').count(), 0, "Intro visit should keep its explicit interest");
        else
          assert(await dialog.locator('input[name="zaujem"]').count() > 0, "Why should show short-form interest options");
      } else {
        assert(await dialog.locator('input[name="pes"]').count() > 0, "Pricing must open LongForm");
      }
      // Never fill in or submit customer details.
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    }

    if (width < 1024) {
      const pricingTab = page.locator('.mobile-dock-item[href="/#cennik"]');
      await pricingTab.click();
      await page.waitForFunction(() => location.hash === "#cennik", null, { timeout: 12000 });
      await page.locator('.mobile-dock-item[href="/#cennik"].is-active').waitFor({ state: "attached", timeout: 12000 });
      const boxes = await page.evaluate(() => {
        const pricing = document.querySelector('.mobile-dock-item[href="/#cennik"]')?.getBoundingClientRect();
        const apply = document.querySelector(".mobile-dock-apply")?.getBoundingClientRect();
        return { gap: pricing && apply ? apply.left - pricing.right : -1,
          tabWidth: pricing?.width ?? 0, ctaWidth: apply?.width ?? 0,
          overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert(boxes.gap >= 4, type + width + " active pricing overlaps orange CTA: " + JSON.stringify(boxes));
      assert(boxes.tabWidth >= 44 && boxes.ctaWidth >= 44, type + width + " touch target shrank");
      assert(boxes.overflow <= 1, type + width + " horizontal overflow");
      await page.screenshot({ path: "artifacts/mobile-dock/cta-" + type + "-" + width + "-active-pricing.png" });
    }
    await context.close();
    console.log("CTA funnel PASS", type, width);
  } finally {
    await browser.close();
  }
}
