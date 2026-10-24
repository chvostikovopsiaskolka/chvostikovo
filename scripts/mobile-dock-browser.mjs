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
    await page.locator(".mobile-dock[data-hydrated=\"true\"]").waitFor({ timeout: 20000 });
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
console.log("Browser visual / navigation assertions PASS:", JSON.stringify(captures));
