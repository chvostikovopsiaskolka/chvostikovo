const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// Run in CI, without submitting forms or emitting analytics traffic.
const bellaris = process.env.WEB_SITE === 'bellaris';
const base = process.env.WEB_BASE_URL || (bellaris ? 'https://bellaris.sk' : 'https://chvostikovo.sk');
const urls = (bellaris ? ['/', '/cennik/', '/postup/'] : ['/', '/psia-skolka-kosice/', '/en/dog-daycare-kosice/']).map(route => new URL(route, base));
const out = process.env.RUNTIME_REPORT_DIR || 'runtime-report';
fs.mkdirSync(out, { recursive: true });
const results = [];
const failures = [];

(async () => {
  for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await browserType.launch();
    for (const restricted of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      // Each URL must start without a saved choice from the preceding URL.
      if (!restricted) await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
      await context.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        // No production submissions or measurement writes, including same-origin POSTs.
        if (!['GET', 'HEAD'].includes(request.method()) || !urls.some(target => target.origin === url.origin)) return route.abort();
        return route.continue();
      });
      if (restricted) await context.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage blocked by privacy settings', 'SecurityError'); } });
      });
      for (const url of urls) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const label = `${engine}-${restricted ? 'blocked-storage' : 'fresh'}-${url.pathname.replaceAll('/', '_')}`;
        try {
          const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 40000 });
          if (response?.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
          // The server HTML is visible before effects run; wait for client hydration.
          await page.waitForTimeout(3000);
          const text = await page.locator('body').innerText();
          if (/This page didn.t load|Stránku sa nepodarilo načítať|Something went wrong on our end/i.test(text)) throw new Error('Root error boundary replaced the website');
          if (!await page.locator('h1').count()) throw new Error('Missing page heading');
          // Cookie preferences are installed by a client effect, so this also verifies hydration.
          const cookieButton = page.getByRole('button', { name: /Odmietnuť|Reject|Reject all|Len nevyhnutné|Necessary only/i }).first();
          await cookieButton.waitFor({ timeout: 10000 });
          await cookieButton.click();
          await page.waitForTimeout(300);
          if (/This page didn.t load|Stránku sa nepodarilo načítať/i.test(await page.locator('body').innerText())) throw new Error('Cookie selection crashed the page');
          // Real browser-level regression: wheel over moving carousels must
          // continue page scrolling, and their computed touch-action must not
          // reserve gestures for horizontal panning only.
          if (!bellaris && !restricted) {
            const tracks = page.locator('[data-gesture-track]');
            const count = await tracks.count();
            if (url.pathname === '/' && count < 2) throw new Error('Missing homepage carousel tracks');
            for (let i = 0; i < count; i++) {
              const carousel = tracks.nth(i);
              const touchAction = await carousel.evaluate(el => getComputedStyle(el).touchAction);
              if (touchAction !== 'auto') throw new Error('Carousel blocks vertical touch panning: ' + touchAction);
              await carousel.scrollIntoViewIfNeeded();
              const box = await carousel.boundingBox();
              if (!box) throw new Error('Invisible carousel track');
              if (engine === 'chromium') {
                const before = await page.evaluate(() => window.scrollY);
                // Chromium can simulate wheel input; verify actual scroll chaining.
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.wheel(0, 330);
                await page.waitForTimeout(320);
                const after = await page.evaluate(() => window.scrollY);
                if (after <= before + 15)
                  throw new Error('Vertical page scroll blocked on carousel ' + i + ': ' + before + ' -> ' + after);
              } else {
                // Mobile WebKit cannot dispatch an actual mouse wheel. Programmatic
                // scrollBy in this carousel is altered by scroll anchoring and can
                // return near-identical positions even when touch panning is allowed.
                // Guard scrollability and touch-action without treating synthetic
                // window scrolling as a real iOS swipe.
                const gate = await page.evaluate(() => {
                  const root = document.scrollingElement;
                  const overflow = getComputedStyle(document.documentElement).overflowY;
                  return { scrollable: !!root && root.scrollHeight > root.clientHeight + 20,
                    overflow };
                });
                if (!gate.scrollable || gate.overflow === 'hidden' || gate.overflow === 'clip')
                  throw new Error('WebKit page is not vertically scrollable over carousel ' + i);
              }
            }
          }
          if (errors.length) throw new Error(errors.join('; '));
          results.push({ engine, restricted, route: url.pathname, status: 'PASS' });
          console.log(`PASS ${label}`);
        } catch (error) {
          const failure = { engine, restricted, route: url.pathname, status: 'FAIL', error: error.message, runtimeErrors: errors };
          results.push(failure); failures.push(failure);
          await page.screenshot({ path: path.join(out, `${label}.png`), fullPage: true }).catch(() => {});
          console.error(`FAIL ${label}: ${error.message}`, errors);
        } finally { await page.close(); }
      }
      if (!bellaris && !restricted) {
        // Retired checkout addresses must never show a cart. Test both viewport sizes.
        for (const width of [390, 1440]) {
          const productPage = await context.newPage();
          await productPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
          try {
            for (const [route, action] of [['/stojan-na-misky-pre-psa', 'Mám záujem o stojan'], ['/target-na-cvicenie-pre-psov', 'Mám záujem o target']]) {
              await productPage.goto(new URL(route, base).href);
              await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});
              const consent = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
              if (await consent.isVisible()) await consent.click();
              const heroTitle = productPage.getByRole('heading', { level: 1 });
              const heroPhoto = productPage.locator('img[fetchpriority="high"]').first();
              const sizeLabel = productPage.getByText(route.includes('stojan') ? 'Vyberte veľkosť stojana' : 'Vyberte veľkosť', { exact: true });
              const [titleBox, photoBox, selectorBox] = await Promise.all([heroTitle.boundingBox(), heroPhoto.boundingBox(), sizeLabel.boundingBox()]);
              if (!titleBox || !photoBox || !selectorBox) throw new Error('Product detail desktop/mobile regions missing');
              if (width === 1440 && !(photoBox.x + photoBox.width <= titleBox.x + 8 && selectorBox.x >= titleBox.x - 8)) {
                throw new Error('Desktop product image must be left of title and size selection');
              }
              if (width === 390 && !(titleBox.y < photoBox.y && photoBox.y < selectorBox.y)) {
                throw new Error('Mobile product image must follow heading and precede size selection');
              }
              if (route.includes('stojan')) {
                if (!await heroPhoto.getAttribute('alt').then(alt => alt?.includes('MIA'))) throw new Error('Small stand must show Mia by default');
                await productPage.getByRole('button', { name: /^Väčší/ }).first().click();
                if (!await heroPhoto.getAttribute('alt').then(alt => alt?.includes('CORI'))) throw new Error('Large stand must show CORI');
                await productPage.getByRole('button', { name: /^Menší/ }).first().click();
                if (!await heroPhoto.getAttribute('alt').then(alt => alt?.includes('MIA'))) throw new Error('Returning to small stand must show Mia');
              } else {
                await productPage.getByRole('button', { name: /^Malý/ }).first().click();
                if (!await heroPhoto.getAttribute('alt').then(alt => alt?.includes('malom targete'))) throw new Error('Small target image missing');
                await productPage.getByRole('button', { name: /^Veľký/ }).first().click();
                if (!await heroPhoto.getAttribute('alt').then(alt => alt?.includes('veľkom targete'))) throw new Error('Large target image missing');
              }
              const reviewTeaser = productPage.getByText('Recenzie spokojných zákazníkov čoskoro', { exact: true });
              if (!await reviewTeaser.isVisible()) throw new Error('Product review teaser missing');
              await productPage.getByRole('button', { name: 'Ako je to s doručením?' }).click();
              const deliveryDialog = productPage.getByRole('dialog', { name: 'Doprava a doručenie' });
              await deliveryDialog.waitFor();
              for (const label of ['Košice', 'Zadarmo', 'Okolie Košíc a Prešov', '5 €', 'Vzdialenejšie lokality', 'Individuálne']) {
                if (!await deliveryDialog.getByText(label, { exact: true }).isVisible()) throw new Error('Product delivery information missing: ' + label);
              }
              await productPage.keyboard.press('Escape');
              await deliveryDialog.waitFor({ state: 'hidden' });
              await productPage.getByRole('button', { name: action }).first().click();
              await productPage.locator('input[name="customer_name"]:visible').waitFor();
              if (!await productPage.locator('input[name="email"]:visible').count()) throw new Error('Product inquiry contact missing');
              if (await productPage.locator('a[href="/kosik"], a[href="/objednavka"]').count()) throw new Error('Product inquiry points to retired checkout');
            }
            await productPage.goto(new URL('/', base).href);
            await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
            const homeConsent = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
            if (await homeConsent.isVisible()) await homeConsent.click();
            if (await productPage.getByRole('heading', { name: 'Zo života v škôlke' }).count()) {
              throw new Error('Standalone Instagram follow section still exists');
            }
            const footerSocial = productPage.locator('footer [data-social-links="footer"]:visible');
            await footerSocial.waitFor({ state: 'visible' });
            const footerLinks = footerSocial.locator('a');
            if (await footerLinks.count() !== 2) throw new Error('Footer must expose exactly two social buttons');
            const [instaHref, fbHref] = await Promise.all([footerLinks.nth(0).getAttribute('href'), footerLinks.nth(1).getAttribute('href')]);
            if (!instaHref?.startsWith('https://www.instagram.com/') || !fbHref?.startsWith('https://www.facebook.com/')) {
              throw new Error('Footer social links do not have the correct destinations');
            }
            const [instagramBox, facebookBox] = await Promise.all([footerLinks.nth(0).boundingBox(), footerLinks.nth(1).boundingBox()]);
            if (!instagramBox || !facebookBox || Math.abs(instagramBox.y - facebookBox.y) > 6 ||
              instagramBox.x + instagramBox.width > facebookBox.x + 5 ||
              Math.abs(instagramBox.width - facebookBox.width) > 6) {
              throw new Error('Footer social links must be wide and side by side');
            }
            if (width === 1440) {
              const hoursBox = await productPage.getByText('Pondelok – piatok, 7:00 – 17:00', { exact: true }).boundingBox();
              if (!hoursBox || instagramBox.y <= hoursBox.y) throw new Error('Desktop footer socials must be below opening hours');
            }
            if (width === 390) {
              await productPage.locator('.mobile-dock').getByRole('button', { name: 'Otvoriť menu' }).click();
              const menu = productPage.locator('.mobile-dock-menu');
              await menu.waitFor({ state: 'visible' });
              const actions = menu.locator('.mobile-dock-menu-actions a');
              if (await actions.count() !== 4) throw new Error('Mobile menu must have exactly four icon actions');
              const hrefs = await Promise.all([0, 1, 2, 3].map(index => actions.nth(index).getAttribute('href')));
              if (!hrefs[0]?.startsWith('tel:') || hrefs[1] !== '/en/dog-daycare-kosice' ||
                !hrefs[2]?.startsWith('https://www.instagram.com/') || !hrefs[3]?.startsWith('https://www.facebook.com/')) {
                throw new Error('Mobile menu phone, EN, Instagram and Facebook destinations incorrect');
              }
              if (!await actions.nth(0).getAttribute('aria-label') || !await actions.nth(2).getAttribute('aria-label')) {
                throw new Error('Mobile icon links require accessible names');
              }
              const actionBoxes = await Promise.all([0, 1, 2, 3].map(index => actions.nth(index).boundingBox()));
              if (actionBoxes.some(box => !box || box.width < 40 || box.height < 44) ||
                actionBoxes.some(box => Math.abs(box.y - actionBoxes[0].y) > 5)) {
                throw new Error('Mobile menu four icon actions must fit in one tappable row');
              }
              await menu.getByRole('button', { name: 'Zavrieť menu' }).click();
              await menu.waitFor({ state: 'hidden' });
            }
            for (const route of ['/stojan-na-misky-pre-psa', '/target-na-cvicenie-pre-psov']) {
              const card = productPage.locator('#produkty article a').filter({ has: productPage.locator('h3') }).filter({ has: productPage.locator('img') }).filter({ hasText: route.includes('stojan') ? 'Drevený stojan' : 'Target na cvičenie' }).first();
              const box = await card.boundingBox();
              if (!box || Math.abs(box.width - box.height) > 3) throw new Error('Homepage product card must be square: ' + route);
            }
            if (width === 390) {
              await productPage.goto(new URL('/en/dog-daycare-kosice', base).href);
              await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
              const englishConsent = productPage.getByRole('button', { name: /Necessary only|Reject all/i }).first();
              if (await englishConsent.isVisible()) await englishConsent.click();
              const englishFooterSocial = productPage.locator('footer [data-social-links="footer"]:visible');
              await englishFooterSocial.waitFor({ state: 'visible' });
              if (await englishFooterSocial.locator('a').count() !== 2) throw new Error('English footer social buttons missing');
              await productPage.locator('.mobile-dock').getByRole('button', { name: 'Open menu' }).click();
              const englishActions = productPage.locator('.mobile-dock-menu-actions a');
              if (await englishActions.count() !== 4 || await englishActions.nth(1).getAttribute('href') !== '/') {
                throw new Error('English mobile menu must retain the SK language switch and four icon actions');
              }
            }
            for (const legacy of ['/kosik/', '/objednavka/']) {
              // Meta refresh and hydrated location.replace can interrupt navigation to a retired alias.
              // Accept only that precise interruption; still require the actual /produkty URL and heading.
              try {
                await productPage.goto(new URL(legacy, base).href, { waitUntil: 'commit' });
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (!/is interrupted by another navigation/i.test(message) || !message.includes('/produkty')) throw error;
              }
              // Locator polling survives the refresh/replace document handoff better than waitForURL.
              await productPage.getByRole('heading', { name: 'Naše produkty pre psov', exact: true }).waitFor({ state: 'visible' });
              if (!['/produkty', '/produkty/'].includes(new URL(productPage.url()).pathname)) {
                throw new Error('Retired shop alias did not resolve to products: ' + legacy);
              }
              if (await productPage.getByRole('heading', { name: /Košík|Dokončenie objednávky/ }).count()) throw new Error('Retired cart UI is still exposed');
            }
            results.push({engine, restricted:false, route:'product-inquiries-' + width, status:'PASS'});
            console.log('PASS product inquiries and retired shop redirects ' + engine + ' ' + width);
          } catch (error) {
            const failure = {engine, width, route:'product-inquiries', status:'FAIL', error:error.message};
            failures.push(failure);
            results.push(failure);
            console.error('FAIL product inquiries and redirects ' + engine + ' ' + width + ': ' + error.message);
            await productPage.screenshot({path:path.join(out, 'products-' + engine + '-' + width + '.png'), fullPage:true}).catch(()=>{});
          } finally { await productPage.close(); }
        }
      }
      await context.close();
    }
    await browser.close();
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), base, results }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
