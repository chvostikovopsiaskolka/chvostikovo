import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4173";
await mkdir("artifacts/mobile-dock", { recursive: true });
const waitForServer = async () => {
  for (let i = 0; i < 45; i++) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Preview server unavailable at " + base);
};
await waitForServer();

const captures = [];
async function run(engine, width, height, suffix) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: width < 1024,
      hasTouch: width < 1024,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.locator("h1:visible").first().waitFor({ timeout: 15000 });
    await page.locator(".mobile-dock[data-hydrated=\"true\"]").waitFor({ state: "attached", timeout: 20000 });
    // Fresh-visitor consent blocks page interaction by design. Choose
    // necessary-only and let the existing confirmation toast disappear.
    const consent = page.getByRole("dialog", { name: /Používame cookies|We use cookies/i });
    if (await consent.isVisible()) {
      await consent.getByRole("button", { name: /Len nevyhnutné|Necessary only/i }).click();
      await page.getByRole("status").waitFor({ state: "hidden", timeout: 10000 });
    }
    await page.waitForTimeout(600);

    const details = await page.evaluate(() => {
      const bar = document.querySelector(".mobile-dock");
      const items = [...document.querySelectorAll(".mobile-dock-item")];
      const visible = bar && getComputedStyle(bar).display !== "none";
      return {
        visible, count: items.length,
        widths: items.map((x) => x.getBoundingClientRect().width),
        heights: items.map((x) => x.getBoundingClientRect().height),
        labelOverflow: items.some((item) => {
          const label = item.querySelector("span");
          const outer = item.getBoundingClientRect();
          const inner = label?.getBoundingClientRect();
          return inner && (inner.left < outer.left - 1 || inner.right > outer.right + 1);
        }),
        overflow: document.documentElement.scrollWidth - innerWidth,
        fixed: bar && getComputedStyle(bar).position === "fixed",
        top: bar?.getBoundingClientRect().top,
      };
    });

    assert(details.overflow <= 1, suffix + " horizontal document overflow " + details.overflow);
    if (width >= 1024) assert(!details.visible, suffix + " desktop should keep old header");
    else {
      assert(details.visible && details.fixed, suffix + " dock must be fixed");
      assert.equal(details.count, 6, suffix + " must show six slots");
      assert(details.widths.every((v) => v >= 44), suffix + " slot under 44 px " + details.widths);
      assert(details.heights.every((v) => v >= 44), suffix + " touch height under 44 px");
      assert(!details.labelOverflow, suffix + " item labels overlap adjacent slots");
    }
    await page.screenshot({ path: "artifacts/mobile-dock/" + suffix + "-hero.png" });

    if (width < 1024) {
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
      await page.waitForTimeout(100);
      const fixedTop = await page.locator(".mobile-dock").boundingBox();
      assert(Math.abs((fixedTop?.y ?? 0) - (details.top ?? 0)) < 3, suffix + " dock must not move on scroll");

      await page.getByRole("button", { name: /otvoriť menu/i }).click();
      await page.locator(".mobile-dock-menu").waitFor({ state: "visible", timeout: 8000 });
      await page.screenshot({ path: "artifacts/mobile-dock/" + suffix + "-menu.png" });
      await page.keyboard.press("Escape");
      await page.locator(".mobile-dock-menu").waitFor({ state: "hidden" });

      await page.locator(".mobile-dock-apply").click();
      await page.locator("[data-form-dialog]").waitFor({ state: "visible" });
      assert(await page.locator(".mobile-dock").isHidden(), suffix + " dock must be hidden behind application");
      await page.screenshot({ path: "artifacts/mobile-dock/" + suffix + "-form.png" });
      await page.keyboard.press("Escape");
      await page.locator("[data-form-dialog]").waitFor({ state: "hidden" });
      assert(await page.locator(".mobile-dock").isVisible(), suffix + " dock must return after form");

      await page.goto(base + "/caste-otazky", { waitUntil: "domcontentloaded" });
      await page.locator('.mobile-dock a[href="/#priestory"]').click();
      await page.waitForURL(/\/#priestory/);
    }
    captures.push({ suffix, width, passed: true });
    await context.close();
  } finally {
    await browser.close();
  }
}

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  await run(chromium, width, width < 1024 ? 740 : 900, "chromium-" + width);
}
await run(webkit, 390, 844, "webkit-390");
// The EN page uses its existing English enquiry form and localized anchors.
{
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(base + "/en/dog-daycare-kosice", { waitUntil: "domcontentloaded" });
    await page.locator(".mobile-dock[data-hydrated=\"true\"]").waitFor();
    const consent = page.getByRole("dialog", { name: /We use cookies/i });
    if (await consent.isVisible()) {
      await consent.getByRole("button", { name: /Necessary only/i }).click();
      await page.getByRole("status").waitFor({ state: "hidden", timeout: 10000 });
    }
    assert.equal(await page.locator(".mobile-dock-item").count(), 6);
    for (const label of ["Home", "Why us?", "Reviews", "Prices", "Enquire", "Menu"]) {
      assert(await page.locator(".mobile-dock-item").filter({ hasText: label }).count() >= 1, "Missing EN dock label: " + label);
    }
    await page.screenshot({ path: "artifacts/mobile-dock/chromium-en-390-hero.png" });
    await page.locator(".mobile-dock-apply").click();
    await page.locator("[data-form-dialog]").waitFor({ state: "visible" });
    assert(await page.locator(".mobile-dock").isHidden(), "EN enquiry must hide dock");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Open menu/i }).click();
    await page.locator(".mobile-dock-menu").waitFor({ state: "visible" });
    assert.equal(await page.locator(".mobile-dock-menu a[lang=sk]").count(), 1, "EN menu missing Slovak return");
    await page.screenshot({ path: "artifacts/mobile-dock/chromium-en-390-menu.png" });
    await context.close();
    captures.push({ suffix: "chromium-en-390", passed: true });
  } finally {
    await browser.close();
  }
}

// Route-local marketing dock: no button navigates unexpectedly to the homepage.
for (const { route, why, price, first } of [
  { route: "/psia-skolka-kosice", why: "lead-benefits", price: "lead-pricing", first: "lead-first-visit" },
  { route: "/psia-skolka-pre-steniatka", why: "puppy-benefits", price: "puppy-pricing", first: "puppy-first-visit" },
  { route: "/strazenie-psov-kosice", why: "dog-sitting-why", price: "dog-sitting-pricing", first: "dog-sitting-first-visit" },
]) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    await page.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: "attached" });
    const consent = page.getByRole("dialog", { name: /Používame cookies/i });
    if (await consent.isVisible()) {
      await consent.getByRole("button", { name: /Len nevyhnutné/i }).click();
      await page.getByRole("status").waitFor({ state: "hidden", timeout: 10000 });
    }
    assert.equal(await page.locator(".mobile-dock-item").count(), 6, route + " must have six buttons");
    assert.equal(await page.locator('.mobile-dock-apply').innerText(), "Záujem");
    const expected = [route, route + "#" + why, route + "#recenzie", route + "#" + price];
    const destinations = await page.locator(".mobile-dock-item[href]").evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    assert.deepEqual(destinations, expected, route + " must use local section URLs");
    await page.screenshot({ path: "artifacts/mobile-dock/landing-" + route.slice(1) + "-hero.png" });
    await page.getByRole("button", { name: /otvoriť menu/i }).click();
    const menu = page.locator(".mobile-dock-menu");
    await menu.waitFor({ state: "visible" });
    const logo = await menu.locator(".mobile-dock-menu-logo img").boundingBox();
    const panel = await menu.boundingBox();
    assert(logo && panel && logo.y >= panel.y - 2 && logo.y + logo.height <= panel.y + panel.height + 2,
      route + " menu logo must be visible without scrolling");
    assert.equal(await menu.locator('a[href="' + route + '#' + first + '"]').count(), 1);
    await page.screenshot({ path: "artifacts/mobile-dock/landing-" + route.slice(1) + "-menu.png" });
    await page.keyboard.press("Escape");
    await page.locator(".mobile-dock-apply").click();
    await page.locator("[data-form-dialog]").waitFor({ state: "visible" });
    assert(await page.locator(".mobile-dock").isHidden(), route + " interest dialog must hide dock");
    await page.screenshot({ path: "artifacts/mobile-dock/landing-" + route.slice(1) + "-interest.png" });
    await page.keyboard.press("Escape");
    await page.locator("[data-form-dialog]").waitFor({ state: "hidden" });
    await page.locator('.mobile-dock-item[href="' + route + '#' + why + '"]').click();
    await page.waitForFunction((hash) => location.hash === hash, "#" + why);
    assert.equal(new URL(page.url()).pathname, route, route + " Why us must stay on landing");
    await page.locator('.mobile-dock-item[href="' + route + '#recenzie"]').click();
    await page.waitForFunction(() => location.hash === "#recenzie");
    await page.locator('.mobile-dock-item[href="' + route + '#' + price + '"]').click();
    await page.waitForFunction((hash) => location.hash === hash, "#" + price);
    assert.equal(new URL(page.url()).pathname, route, route + " pricing must stay on landing");
    await context.close();
    captures.push({ suffix: "landing-" + route.slice(1), passed: true });
  } finally {
    await browser.close();
  }
}

console.log("Browser visual / navigation assertions PASS:", JSON.stringify(captures));
