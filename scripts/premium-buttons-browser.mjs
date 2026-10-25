import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4173";
await mkdir("artifacts/mobile-dock", { recursive: true });
for (let trial = 0; trial < 30; trial++) {
  try {
    const res = await fetch(base);
    if (res.ok) break;
  } catch {}
  if (trial === 29) throw Error("Preview server unavailable");
  await new Promise((resolve) => setTimeout(resolve, 500));
}

const cases = [
  ["chromium", chromium, 320, 740],
  ["chromium", chromium, 390, 844],
  ["webkit", webkit, 390, 844],
  ["chromium", chromium, 1024, 768],
  ["chromium", chromium, 1440, 900],
];

for (const [name, engine, width, height] of cases) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width, height }, isMobile: width < 1024,
      hasTouch: width < 1024, reducedMotion: "reduce",
    });
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.locator("#top .btn-coral:visible").first().waitFor();
    const dialog = page.getByRole("dialog", { name: /Používame cookies|We use cookies/i });
    if (await dialog.isVisible()) {
      await dialog.getByRole("button", { name: /Len nevyhnutné|Necessary only/i }).click();
      await page.getByRole("status").waitFor({ state: "hidden", timeout: 10000 });
    }
    const light = await page.evaluate(() => {
      const hero = [...document.querySelectorAll("#top .btn-coral")].find(el => el.getBoundingClientRect().width > 40);
      const dock = document.querySelector(".mobile-dock-apply");
      // Test the reusable green utility independently even when not present
      // inside this specific above-the-fold viewport.
      const probe = document.createElement("button");
      probe.className = "btn-forest";
      probe.textContent = "Test";
      probe.style.position = "fixed";
      probe.style.visibility = "hidden";
      document.body.appendChild(probe);
      const sample = (element) => {
        if (!element) return null;
        const css = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { shadow: css.boxShadow, gradient: css.backgroundImage,
          fill: css.backgroundColor, width: rect.width, height: rect.height };
      };
      const data = { hero: sample(hero), dock: sample(dock), green: sample(probe),
        overflow: document.documentElement.scrollWidth - innerWidth };
      probe.remove();
      return data;
    });
    assert(light.hero, name + width + ": missing Hero CTA");
    assert(light.hero.shadow.includes("inset") && light.hero.gradient.includes("linear-gradient"), "Hero CTA light absent");
    assert(light.hero.width >= 44 && light.hero.height >= (width < 1024 ? 44 : 38), "Hero CTA dimensions unexpected");
    assert(light.green.shadow.includes("inset") && light.green.gradient.includes("linear-gradient"), "Green CTA light absent");
    if (width < 1024) {
      assert(light.dock.shadow.includes("inset") && light.dock.gradient.includes("linear-gradient"), "Orange dock CTA light absent");
      assert(light.dock.height >= 44, "Dock CTA touch target regressed");
    }
    assert(light.overflow <= 1, "Horizontal overflow at " + width);
    await page.screenshot({ path: "artifacts/mobile-dock/premium-" + name + "-" + width + ".png" });
    await browser.close();
    console.log("Premium button PASS", name, width, JSON.stringify({
      hero: light.hero.height, dock: light.dock?.height, green: light.green.height,
    }));
  } finally {
    if (browser.isConnected()) await browser.close();
  }
}
