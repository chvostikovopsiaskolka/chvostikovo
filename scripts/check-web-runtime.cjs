const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// Run in CI, without submitting forms or emitting analytics traffic.
const bellaris = process.env.WEB_SITE === 'bellaris';
const base = process.env.WEB_BASE_URL || (bellaris ? 'https://bellaris.sk' : 'https://chvostikovo.sk');
const urls = (bellaris ? ['/', '/cennik/', '/postup/'] : ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/', '/en/dog-daycare-kosice/']).map(route => new URL(route, base));
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
          // Shared Slovak Hero CTA: mobile pair, desktop single prominent info CTA.
          // Layout regression 320/375/390/1440 in Chromium and Safari WebKit.
          if (!bellaris && ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/'].includes(url.pathname)) {
            for (const width of [320, 375, 390, 1440]) {
              await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
              const hero = page.locator('section.hero-safe-top').first();
              const primary = hero.locator('.hero-cta-primary:visible').first();
              if (!await primary.isVisible()) throw new Error('Hero prominent CTA missing at ' + width);
              const ctaPair = hero.locator('.hero-cta-pair:visible');
              if (width < 1024) {
                if (!await ctaPair.isVisible()) throw new Error('Mobile Hero CTA pair missing at ' + width);
                const shape = await ctaPair.evaluate(el => {
                  const primary = el.querySelector('.hero-cta-primary');
                  const secondary = el.querySelector('.hero-cta-secondary');
                  const label = secondary?.querySelector('span');
                  const icon = secondary?.querySelector('.hero-cta-icon');
                  if (!primary || !secondary || !label || !icon) return null;
                  const b = el.getBoundingClientRect(), p = primary.getBoundingClientRect(), s = secondary.getBoundingClientRect();
                  return {
                    viewportWidth: window.innerWidth, left: b.left, right: b.right,
                    primaryWidth: p.width, secondaryWidth: s.width, text: secondary.textContent?.trim(),
                    nowrap: getComputedStyle(secondary).whiteSpace === 'nowrap',
                    labelRight: label.getBoundingClientRect().right,
                    iconLeft: icon.getBoundingClientRect().left,
                    iconRight: icon.getBoundingClientRect().right,
                    secondaryRight: s.right,
                  };
                });
                if (!shape || !shape.nowrap || !shape.text?.includes('Viac o škôlke'))
                  throw new Error('Mobile second CTA must stay in one line: ' + width);
                if (shape.primaryWidth <= shape.secondaryWidth * 1.35)
                  throw new Error('Mobile interest CTA must be wider: ' + width);
                if (shape.left < -1 || shape.right > shape.viewportWidth + 1)
                  throw new Error('CTA pair extends past viewport: ' + width);
                if (shape.labelRight > shape.iconLeft + 1 || shape.iconRight > shape.secondaryRight - 2)
                  throw new Error('CTA label or arrow overlaps: ' + width);
              } else {
                if (await ctaPair.count() !== 0) throw new Error('Desktop must hide the interest CTA pair');
                if (!(await primary.innerText()).includes('Viac o škôlke'))
                  throw new Error('Desktop Hero must only offer the prominent learn-more CTA');
                if (!await hero.locator('[data-lead-step-form]').first().isVisible())
                  throw new Error('Desktop guided form missing beside Hero');
              }
              if ((await primary.evaluate(el => getComputedStyle(el).boxShadow)) === 'none')
                throw new Error('Primary CTA glow missing: ' + width);
            }
            await page.setViewportSize({ width: 390, height: 844 });
            if (!restricted) {
              const entry = url.pathname === '/'
                ? page.locator('section.hero-safe-top .hero-cta-primary:visible').first()
                : page.locator('.mobile-dock .mobile-dock-apply').first();
              await entry.click();
              const modal = page.getByRole('dialog');
              await modal.waitFor({state: 'visible'});
              if (!await modal.locator('[data-lead-step-form]').count())
                throw new Error('Mobile interest CTA must open the guided enquiry modal');
              await page.keyboard.press('Escape');
              await modal.waitFor({state: 'hidden'});
            }
          }
          // New LEAD pilot: one question at a time without any real submission.
          if (!bellaris && !restricted && url.pathname === '/psia-skolka-kosice/') {
            const wizard = page.locator('#lead-form [data-lead-step-form]');
            if (!await wizard.isVisible()) throw new Error('Missing inline mobile lead wizard');
            if (await wizard.locator('input[name="zaujem"]').count() !== 3) throw new Error('Missing 3 interest cards');
            const next = wizard.getByRole('button', { name: 'Pokračovať' });
            if (await next.isEnabled()) throw new Error('Wizard preselected an interest');
            await wizard.getByText('informovať', { exact: true }).first().click();
            await next.click();
            if (!await wizard.getByRole('heading', { name: 'Kam sa vám môžeme ozvať?' }).isVisible()) throw new Error('Lead wizard did not advance to contact step');
            if (!await wizard.locator('input[name="meno"]').isVisible() || !await wizard.locator('input[name="telefon"]').isVisible())
              throw new Error('Lead contact fields missing');
            await wizard.getByRole('button', { name: 'Späť' }).click();
            if (!await wizard.locator('input[name="zaujem"]').first().isChecked()) throw new Error('Wizard lost selection after back');
            await page.setViewportSize({ width: 1440, height: 900 });
            if (!await page.locator('#lead-form-desktop [data-lead-step-form]').isVisible()) throw new Error('Missing desktop hero wizard');
            if (!await page.locator('#lead-form-pricing [data-lead-step-form]').count() || !await page.locator('[data-lead-step-form]').last().count()) throw new Error('Missing additional inline lead forms');
            await page.setViewportSize({ width: 390, height: 844 });
          }
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
                const heroPicker = productPage.locator('[data-stand-size-picker="hero"]');
                if (await heroPicker.locator('button').count() !== 2) throw new Error('Stand hero must have two size buttons');
                const labels = await heroPicker.locator('button').allTextContents();
                if (!labels.some(text => text.includes('malé plemená')) || !labels.some(text => text.includes('stredné/veľké'))) {
                  throw new Error('Stand breed labels missing from top size picker');
                }
                const checkPicker = async () => {
                  const buttons = heroPicker.locator('button');
                  const boxes = await Promise.all([buttons.nth(0).boundingBox(), buttons.nth(1).boundingBox()]);
                  if (!boxes[0] || !boxes[1] || Math.abs(boxes[0].y - boxes[1].y) > 2) throw new Error('Stand hero size buttons must stay in one row');
                  for (let n = 0; n < 2; n++) {
                    const overflows = await buttons.nth(n).evaluate(el => el.querySelector('span')?.scrollWidth > (el.clientWidth - 12));
                    if (overflows) throw new Error('Stand breed label overflows button');
                  }
                };
                await checkPicker();
                if (width === 390) {
                  await productPage.setViewportSize({width:320,height:760});
                  await checkPicker();
                  await productPage.setViewportSize({width:390,height:844});
                }
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
              const detailIntroText = route.includes('stojan')
                ? 'Vyberte si variant a objednajte si stojan pre svojho psíka.'
                : 'Vyberte si variant a objednajte si target pre svojho psíka.';
              const detailIntro = productPage.locator('h1 + p');
              if (await detailIntro.count() !== 1 || (await detailIntro.innerText()).trim() !== detailIntroText) {
                throw new Error('Product detail intro is not the short approved message: ' + route);
              }
              const valueSectionId = route.includes('stojan') ? 'stand-value-heading' : 'target-value-heading';
              const valueSection = productPage.locator('section[aria-labelledby="' + valueSectionId + '"]');
              if (await valueSection.count() !== 1) throw new Error('Product value section missing: ' + route);
              if (await valueSection.locator('article').count() !== 3) throw new Error('Product must show exactly three value cards: ' + route);
              const valueTitles = route.includes('stojan')
                ? ['Misky majú svoje miesto', 'Po jedle rýchlo upratané', 'Výšku nemusíte odhadovať']
                : ['Presný dotyk labkou', 'Rehabilitácia a fyzioterapia', 'Poslušnosť a zotrvanie na mieste'];
              for (const title of valueTitles) {
                if (!await valueSection.getByRole('heading', { name: title, exact: true }).isVisible()) {
                  throw new Error('Missing product-specific value card: ' + title);
                }
              }
              const heroHighlights = productPage.getByLabel('Tri praktické výhody výrobku');
              if (await heroHighlights.count() !== 1) throw new Error('Compact product value strip missing: ' + route);
              const shortValues = route.includes('stojan')
                ? ['Osobný barový pultík', 'Rýchla údržba', 'Výška podľa psa']
                : ['Kvalitné spracovanie', 'Protišmykový povrch', 'Ručná výroba'];
              for (const title of shortValues) {
                if (!await heroHighlights.getByText(title, { exact: true }).isVisible()) {
                  throw new Error('Missing compact product value: ' + title);
                }
              }
              const valueCard = heroHighlights.locator('div').first();
              const cardClasses = await valueCard.getAttribute('class');
              if (!cardClasses?.includes('bg-forest') || !cardClasses.includes('text-white')) {
                throw new Error('Product value strip must use forest green cards and white text: ' + route);
              }
              const carouselName = route.includes('stojan') ? 'stand' : 'target';
              const galleryTrack = productPage.locator('[data-photo-carousel="' + carouselName + '"]');
              if (await galleryTrack.count() !== 1) throw new Error('Carousel missing: ' + carouselName);
              if (await galleryTrack.locator('figure').count() !== (carouselName === 'stand' ? 13 : 8)) {
                throw new Error('Carousel must render each distinct photo exactly once: ' + carouselName);
              }
              if (carouselName === 'stand') {
                const titles = await galleryTrack.locator('figcaption').allTextContents();
                for (const name of ['MIA', 'CORI', 'WOODY', 'MLYNČEK', 'ARON', 'LOKI', 'PLANÉTKY', 'ALOY', 'STOJAN V PRAXI', 'MAYA', 'GAEL', 'LARA', 'SAFIRA']) {
                  if (!titles.some(title => title.startsWith(name + ' ·'))) throw new Error('Missing real stand caption: ' + name);
                }
              }
              if (await galleryTrack.getAttribute('data-carousel-motion') !== 'ping-pong') {
                throw new Error('Gallery must move back and forth without duplicated slides: ' + carouselName);
              }
              if (width === 390) {
                const galleryBox = await galleryTrack.boundingBox();
                if (!galleryBox || galleryBox.x > 2 || galleryBox.x + galleryBox.width < width - 2) {
                  throw new Error('Carousel must extend edge-to-edge on mobile: ' + carouselName);
                }
                const imgFit = await galleryTrack.locator('img').first().evaluate(node => getComputedStyle(node).objectFit);
                if (imgFit !== 'cover') throw new Error('Carousel images must fill their frame: ' + carouselName);
              }
              if (route.includes('stojan')) {
                if (await galleryTrack.locator('button[data-stand-photo-open]').count() !== 13) throw new Error('All stand photos must be openable');
                const cookieLayerBeforeGallery = productPage.locator('[aria-labelledby="cookie-consent-title"]');
                if (await cookieLayerBeforeGallery.isVisible()) {
                  await cookieLayerBeforeGallery.getByRole('button', { name: 'Len nevyhnutné', exact: true }).click();
                  await cookieLayerBeforeGallery.waitFor({state:'hidden'});
                }
                await galleryTrack.locator('button[data-stand-photo-open]').first().click();
                const lightbox = productPage.locator('[data-stand-lightbox]');
                await lightbox.waitFor({ state: 'visible' });
                if (await lightbox.locator('[data-stand-photo-viewport]').getAttribute('data-zoom') !== '1') throw new Error('Stand photo zoom must start at 100%');
                await lightbox.getByRole('button', { name: 'Priblížiť fotografiu' }).click();
                if (await lightbox.locator('[data-stand-photo-viewport]').getAttribute('data-zoom') !== '1.5') throw new Error('Stand photo zoom-in failed');
                await lightbox.getByRole('button', { name: 'Ďalšia fotografia' }).click();
                if (await lightbox.locator('[data-stand-photo-viewport]').getAttribute('data-zoom') !== '1') throw new Error('Stand photo navigation must reset zoom');
                await productPage.keyboard.press('Escape');
                await lightbox.waitFor({ state: 'hidden' });
                if (await productPage.locator('[data-stand-gallery="autoplay"]').count() !== 1) {
                  throw new Error('Stand realizations carousel missing');
                }
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
              const locationInput = productPage.locator('input[name="customer_location"]:visible');
              if (await locationInput.count() !== 1 || await locationInput.getAttribute('required') === null) {
                throw new Error('Product city and postal code field missing');
              }
              const productDialog = productPage.getByRole('dialog', { name: action });
              await productDialog.waitFor({ state: 'visible' });
              if (await productDialog.getAttribute('data-form-dialog') !== 'simple-v300') throw new Error('Product must use stable iOS modal');
              if (width === 390) {
                for (const input of await productDialog.locator('input:visible:not([type="checkbox"])').all()) {
                  const fontSize = await input.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
                  if (fontSize < 16) throw new Error('Product iOS input zoom risk: ' + (await input.getAttribute('name')));
                }
                const locked = await productPage.evaluate(() => document.body.style.position === 'fixed' && document.documentElement.style.overflow === 'hidden');
                if (!locked) throw new Error('Product form background scroll must be locked on iOS');
              }
              if (route.includes('stojan')) {
                // Independently test the size-card CTA from a fresh real customer view:
                // the hero CTA above was opened earlier to verify its fields.
                await productPage.goto(new URL(route, base).href);
                await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
                const cards = productPage.locator('[data-stand-sizes="carousel"]');
                if (await cards.locator('article').count() !== 2) throw new Error('Stand size carousel must show two sizes');
                if (width === 390) {
                  const swipeable = await cards.evaluate(el => el.scrollWidth > el.clientWidth + 30);
                  if (!swipeable) throw new Error('Stand sizes must swipe horizontally on mobile');
                }
                // Test the two customer journeys from independent fresh visits.
                // No Escape or modal cleanup can interfere with the next case.
                for (const [type, name] of [['large', 'väčší'], ['small', 'menší']]) {
                  await productPage.goto(new URL(route, base).href);
                  await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
                  // Fresh customer visits can display the consent overlay.
                  // Interact with it instead of forcing a click through the modal.
                  const consentChoice = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
                  if (await consentChoice.isVisible()) await consentChoice.click();
                  const sizeCta = productPage.locator('[data-stand-sizes="carousel"] article[data-stand-size="' + type + '"] button[type="button"]');
                  if (await sizeCta.count() !== 1) throw new Error('Missing unique size CTA: ' + type);
                  const label = await sizeCta.getAttribute('aria-label');
                  if (label !== 'Mám záujem o ' + name + ' stojan') {
                    throw new Error('Accessible size CTA label missing: ' + type + ', got ' + label);
                  }
                  await sizeCta.click();
                  // restore-cori-image.mjs intentionally converts the source's
                  // inline inquiry panel into a Radix ContentDialog at build.
                  // Assert the actual production dialog, not the removed
                  // #moznosti-objednavky-stojana source-only wrapper.
                  const inquiryDialog = productPage.getByRole('dialog', { name: 'Mám záujem o stojan' });
                  await inquiryDialog.waitFor({ state: 'visible', timeout: 10000 });
                  const modalPicker = inquiryDialog.locator('[data-stand-size-picker="inquiry"]');
                  if (await modalPicker.locator('button').count() !== 2) throw new Error('Inquiry needs two size options');
                  const modalBoxes = await Promise.all([modalPicker.locator('button').nth(0).boundingBox(), modalPicker.locator('button').nth(1).boundingBox()]);
                  if (!modalBoxes[0] || !modalBoxes[1] || Math.abs(modalBoxes[0].y - modalBoxes[1].y) > 2) {
                    throw new Error('Stand inquiry size options must be side by side');
                  }
                  const selectedSize = inquiryDialog.getByRole('button', {
                    name: type === 'large' ? /^Väčší/ : /^Menší/,
                  }).first();
                  const classes = await selectedSize.getAttribute('class', { timeout: 5000 });
                  if (!classes?.includes('border-coral')) {
                    throw new Error('Stand card did not preselect ' + type + ' in the real inquiry modal');
                  }
                  if (!await inquiryDialog.locator('input[name="customer_name"]:visible').count()) {
                    throw new Error('Stand size card did not open the existing product inquiry form');
                  }
                }
              }
              if (await productPage.locator('a[href="/kosik"], a[href="/objednavka"]').count()) throw new Error('Product inquiry points to retired checkout');
            }
            await productPage.goto(new URL('/blog/stojan-na-misky-pre-psa-vyhody-a-vyber/', base).href);
            await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
            const standFigure = productPage.locator('article section.flow-root figure').first();
            const standImage = standFigure.locator('img').first();
            if (!(await standImage.getAttribute('src'))?.includes('stand-mia-')) {
              throw new Error('Stand guide is not using restored MIA AVIF source');
            }
            const floatStyle = await standFigure.evaluate(el => ({
              float: getComputedStyle(el).float,
              background: getComputedStyle(el).backgroundColor,
            }));
            if (floatStyle.background !== 'rgba(0, 0, 0, 0)') throw new Error('Article photo still has a colored frame');
            if (width === 1440 && floatStyle.float !== 'right') throw new Error('Desktop blog cover must float beside the text');
            if (width === 390 && floatStyle.float !== 'none') throw new Error('Mobile blog cover must remain in reading flow');
            const relatedGrid = productPage.getByRole('heading', { name: 'Mohlo by vás zaujímať' }).locator('xpath=following-sibling::div[1]');
            const relatedCards = relatedGrid.locator(':scope > a');
            if (await relatedCards.count() !== 3) throw new Error('Three related blog cards expected');
            const firstCard = await relatedCards.nth(0).boundingBox();
            const secondCard = await relatedCards.nth(1).boundingBox();
            const thirdCard = await relatedCards.nth(2).boundingBox();
            if (!firstCard || !secondCard || !thirdCard) throw new Error('Missing related blog card geometry');
            if (width === 1440 && (Math.abs(firstCard.y - secondCard.y) > 3 || Math.abs(firstCard.y - thirdCard.y) > 3)) {
              throw new Error('Desktop related articles must appear side by side');
            }
            if (width === 390 && secondCard.y <= firstCard.y + 10) throw new Error('Mobile blog cards must stack naturally');
            const guideCarousel = productPage.locator('[data-stand-gallery="autoplay"]');
            if (await guideCarousel.count() !== 1) throw new Error('Stand guide carousel missing above product CTA');
            if (await guideCarousel.locator('figure').count() !== 13) throw new Error('Stand guide must show thirteen distinct realizations');
            if (await guideCarousel.locator('button[data-stand-photo-open]').count() !== 13) throw new Error('Guide stand photos must open too');
            const cookieLayerBeforeGuide = productPage.locator('[aria-labelledby="cookie-consent-title"]');
            if (await cookieLayerBeforeGuide.isVisible()) {
              await cookieLayerBeforeGuide.getByRole('button', { name: 'Len nevyhnutné', exact: true }).click();
              await cookieLayerBeforeGuide.waitFor({state:'hidden'});
            }
            await guideCarousel.locator('button[data-stand-photo-open]').first().click();
            const articleLightbox = productPage.locator('[data-stand-lightbox]');
            await articleLightbox.waitFor({state:'visible'});
            if (!await articleLightbox.locator('img').first().isVisible()) throw new Error('Guide lightbox has no photo');
            await productPage.keyboard.press('Escape');
            await articleLightbox.waitFor({state:'hidden'});
            if (width === 390) {
              const guideGalleryBox = await guideCarousel.boundingBox();
              if (!guideGalleryBox || guideGalleryBox.x > 2 || guideGalleryBox.x + guideGalleryBox.width < width - 2) {
                throw new Error('Stand guide gallery must use full mobile viewport');
              }
            }
            if (!(await productPage.getByRole('heading', { name: 'Pozrite si naše vyhotovenia', exact: true }).count())) {
              throw new Error('Simplified stand article CTA title missing');
            }
            if (width === 390) {
              const photoBox = await standImage.boundingBox();
              if (!photoBox || photoBox.height > 310) throw new Error('Stand article hero photo remains too tall on mobile');
            }
            await productPage.goto(new URL('/blog/kam-so-psom-pocas-pracovneho-dna/', base).href);
            const workdayOptions = productPage.locator('article section.flow-root').nth(1);
            const workdayPhoto = workdayOptions.locator('figure img');
            const workdayBullets = workdayOptions.locator('ul > li');
            if (await workdayBullets.count() !== 4) throw new Error('Workday care options list must retain all four bullets');
            const [photoBounds, firstBulletBounds, lastBulletBounds] = await Promise.all([
              workdayPhoto.boundingBox(), workdayBullets.first().boundingBox(), workdayBullets.last().boundingBox(),
            ]);
            if (!photoBounds || !firstBulletBounds || !lastBulletBounds) throw new Error('Workday image/list geometry missing');
            if (Math.abs(firstBulletBounds.x - lastBulletBounds.x) > 3) {
              throw new Error('Workday bullets shift horizontally around the photo');
            }
            if (width === 1440 && firstBulletBounds.x <= photoBounds.x + photoBounds.width + 12) {
              throw new Error('Desktop workday list must stay in the column beside the photo');
            }
            if (width === 390 && firstBulletBounds.y <= photoBounds.y + photoBounds.height - 2) {
              throw new Error('Mobile workday bullet list must follow the photo');
            }
            await productPage.goto(new URL('/strazenie-psov-kosice/', base).href);
            const dogHero = productPage.locator('section#top');
            const dogForm = productPage.locator('#informacie form');
            const dogHeading = dogHero.getByRole('heading', { level: 1 });
            if (!await dogHeading.isVisible() || !await dogForm.isVisible()) {
              throw new Error('Dog-sitting hero or inline inquiry form is missing');
            }
            const dogCity = dogHeading.locator('span').first();
            if (await dogCity.evaluate(el => getComputedStyle(el).display) !== 'block') {
              throw new Error('Dog-sitting city line must not wrap unpredictably');
            }
            const dogHeroBox = await dogHero.boundingBox();
            if (!dogHeroBox) throw new Error('Missing dog-sitting hero geometry');
            if (width === 1440 && dogHeroBox.height >= 850) {
              throw new Error('Dog-sitting desktop hero is too tall: ' + dogHeroBox.height);
            }
            await productPage.goto(new URL('/', base).href);
            await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({ state: 'attached' });
            const homeConsent = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
            if (await homeConsent.isVisible()) await homeConsent.click();
            // Contextual FAQ, article CTA and visibly readable hygiene cards.
            const introToggle = productPage.locator('#prva-navsteva').getByRole('button', { name: 'Zistite viac o úvodnej návšteve' });
            await introToggle.click();
            if (await introToggle.getAttribute('aria-expanded') !== 'true' ||
                !(await productPage.locator('#prva-navsteva').getByText('2–3 kratšie návštevy', { exact: false }).count())) {
              throw new Error('First-visit FAQ must open and explain the additional adaptation visits');
            }
            const careToggle = productPage.locator('#starostlivost').getByRole('button', { name: 'Ako dbáme na bezpečnosť psíkov?' });
            await careToggle.click();
            if (await careToggle.getAttribute('aria-expanded') !== 'true' ||
                !(await productPage.locator('#starostlivost').getByText('neustálym dohľadom', { exact: false }).count())) {
              throw new Error('Care safety FAQ must open with its detailed answer');
            }
            const careFaq = careToggle.locator('xpath=../..');
            const careLayout = productPage.locator('#starostlivost > .relative.z-10');
            const [faqBox, layoutBox] = await Promise.all([careFaq.boundingBox(), careLayout.boundingBox()]);
            if (!faqBox || !layoutBox || Math.abs(faqBox.width - (layoutBox.width - 32)) > 4) {
              throw new Error('Care FAQ should span the photo and benefit-text content width');
            }
            const repeatedTitle = careFaq.getByRole('heading', { name: 'Ako zabezpečujete bezpečnosť psíkov v škôlke?' });
            if (await repeatedTitle.count()) throw new Error('Care FAQ repeats a second heading inside its answer');
            const careAnswer = careToggle.locator('xpath=..').locator('div[id]').first();
            if (!await careAnswer.getByText('Bezpečnosť začína už vstupnou návštevou.', { exact: false }).count()) {
              throw new Error('Care FAQ answer missing after removing duplicated heading');
            }
            const whyArticle = productPage.locator('#preco a[href="/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/"]');
            if (await whyArticle.count() !== 1) throw new Error('Suitability article missing beside homepage benefits');
            const whyCta = productPage.locator('#preco').getByRole('button', { name: 'Chcem prihlásiť psíka' });
            const whyPhone = productPage.locator('#preco a[aria-label="Zavolajte nám"]');
            const [ctaBox, phoneBox] = await Promise.all([whyCta.boundingBox(), whyPhone.boundingBox()]);
            if (!ctaBox || !phoneBox || Math.abs(ctaBox.y + ctaBox.height / 2 - phoneBox.y - phoneBox.height / 2) > 5) {
              throw new Error('Interest CTA and round phone action must sit in the same row');
            }
            const mobileHygiene = productPage.locator('#priestory article[aria-label^="Čistota priestorov"]');
            const desktopHygiene = productPage.locator('#priestory article:not([aria-label])');
            if (await mobileHygiene.count() !== 3 || await desktopHygiene.count() !== 3) {
              throw new Error('The hygiene section needs three carousel slides and three desktop cards');
            }
            for (let card = 0; card < 3; card++) {
              if (await mobileHygiene.nth(card).isVisible() !== (width === 390) ||
                  await desktopHygiene.nth(card).isVisible() !== (width === 1440)) {
                throw new Error('Hygiene information is not openly readable at viewport ' + width);
              }
              const visibleCard = (width === 390 ? mobileHygiene : desktopHygiene).nth(card);
              const titleLayout = await visibleCard.evaluate(node => {
                const title = node.querySelector('h3, h4');
                const icon = title?.previousElementSibling;
                const row = title?.parentElement;
                const titleBox = title?.getBoundingClientRect();
                const iconBox = icon?.getBoundingClientRect();
                return {
                  flexRow: Boolean(row && icon && icon.parentElement === row && getComputedStyle(row).display === 'flex'),
                  centerDiff: titleBox && iconBox
                    ? Math.abs((titleBox.top + titleBox.height / 2) - (iconBox.top + iconBox.height / 2)) : 999,
                };
              });
              if (!titleLayout.flexRow || titleLayout.centerDiff > 9) {
                throw new Error('Hygiene emoji and heading must share one aligned row: ' + width + ' ' + card);
              }
              if (width === 390) {
                const label = await mobileHygiene.nth(card).locator('p').first().innerText();
                if (label.includes((card + 1) + '/3')) {
                  throw new Error('Hygiene mobile card must not display a slide counter: ' + label);
                }
              }
            }
            if (!(await productPage.locator('#priestory').getByText('Germicídna lampa s ozónom').count())) {
              throw new Error('Existing hygiene information must be retained');
            }
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
              const footer = productPage.locator('footer');
              const email = footer.locator('a[href^="mailto:"]');
              if (await email.count() !== 1) throw new Error('Footer email link missing');
              const emailLayout = await email.evaluate((link) => ({
                whiteSpace: getComputedStyle(link).whiteSpace,
                fragments: link.getClientRects().length,
                right: link.getBoundingClientRect().right,
                footerRight: link.closest('footer')?.querySelector('.bg-cream')?.getBoundingClientRect().right ?? 0,
              }));
              if (emailLayout.whiteSpace !== 'nowrap' || emailLayout.fragments !== 1 ||
                  emailLayout.right > emailLayout.footerRight - 8) {
                throw new Error('Desktop footer email must remain on one visible line: ' + JSON.stringify(emailLayout));
              }
              const dayBox = await footer.getByText('Pondelok – piatok', { exact: true }).boundingBox();
              const timeBox = await footer.getByText('7:00 – 17:00', { exact: true }).boundingBox();
              if (!dayBox || !timeBox || timeBox.y < dayBox.y + dayBox.height - 1 ||
                  Math.abs(dayBox.x - timeBox.x) > 2) {
                throw new Error('Footer hours must render on two aligned lines: day above time');
              }
              if (instagramBox.y <= dayBox.y) throw new Error('Desktop footer socials must be below opening hours');
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
            const sectionOrder = await productPage.evaluate(() => {
              const faq = document.querySelector('main #faq');
              const products = document.querySelector('main #produkty');
              const cards = [...(products?.querySelectorAll('article a[href]') ?? [])].map(el => el.getAttribute('href'));
              return {
                directlyAfterFaq: Boolean(faq && products && faq.nextElementSibling === products),
                heading: products?.querySelector('h2')?.textContent?.trim(),
                count: document.querySelectorAll('main #produkty').length,
                cards,
              };
            });
            const homepageStandCard = productPage.locator('#produkty a[href="/stojan-na-misky-pre-psa"]');
            if (await homepageStandCard.getByRole('heading', { name: 'Drevený stojan na misky pre psa', exact: true }).count() !== 1) {
              throw new Error('Homepage stand card title must match the catalogue');
            }
            if (width === 1440 && await homepageStandCard.getByText('Dve nerezové misky, výška podľa psíka a prevedenie s personalizáciou podľa vášho želania.', { exact: true }).count() !== 1) {
              throw new Error('Homepage stand card description must be short');
            }
            if (!sectionOrder.directlyAfterFaq || sectionOrder.heading !== 'Naše produkty' || sectionOrder.count !== 1) {
              throw new Error('Homepage product section must appear exactly once immediately below FAQ: ' + JSON.stringify(sectionOrder));
            }
            if (!sectionOrder.cards.includes('/stojan-na-misky-pre-psa') || !sectionOrder.cards.includes('/target-na-cvicenie-pre-psov')) {
              throw new Error('Homepage must preserve both existing product detail links');
            }
            if (width === 390) {
              const dock = productPage.locator('.mobile-dock[data-variant="main"]');
              const productsLink = dock.getByRole('link', { name: 'Produkty', exact: true });
              if (await productsLink.count() !== 1 || await productsLink.getAttribute('href') !== '/produkty') {
                throw new Error('Main mobile dock Products link must go to /produkty');
              }
              if (await dock.getByText('Priestory', { exact: true }).count()) {
                throw new Error('Retired Spaces shortcut should not occupy mobile dock');
              }
            }
            for (const route of ['/stojan-na-misky-pre-psa', '/target-na-cvicenie-pre-psov']) {
              const card = productPage.locator('#produkty article a').filter({ has: productPage.locator('h3') }).filter({ has: productPage.locator('img') }).filter({ hasText: route.includes('stojan') ? 'Drevený stojan' : 'Target na cvičenie' }).first();
              const box = await card.boundingBox();
              if (!box || Math.abs(box.width - box.height) > 3) throw new Error('Homepage product card must be square: ' + route);
            }
            if (width === 390) {
              await productPage.locator('.mobile-dock[data-variant="main"]').getByRole('link', { name: 'Produkty', exact: true }).click();
              await productPage.waitForURL(/\/produkty\/?$/);
              // Consent is a real blocking dialog; accept only the necessary cookies
              // before interacting, never force-click through the overlay.
              const catalogueConsent = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
              if (await catalogueConsent.isVisible()) await catalogueConsent.click();
              if (!await productPage.getByRole('heading', { level: 1, name: /Naše produkty pre psov/i }).count()) {
                throw new Error('Mobile dock did not open the existing products catalogue');
              }
              if (!await productPage.getByText('Praktické produkty, ktoré ručne vyrábame.', { exact: false }).count()) {
                throw new Error('Updated catalogue intro missing');
              }
              const catalog = productPage.locator('[data-products-carousel]');
              if (await catalog.locator('[data-product-card]').count() !== 2) throw new Error('Two products must be in one carousel');
              if (!await catalog.evaluate(el => el.scrollWidth > el.clientWidth + 40)) throw new Error('Catalogue must swipe horizontally on mobile');
              // Horizontal snap must not steal vertical gestures on either mobile browser.
              const catalogTouchAction = await catalog.evaluate(el => getComputedStyle(el).touchAction);
              if (catalogTouchAction !== 'auto') throw new Error('Product cards block vertical scrolling: ' + catalogTouchAction);
              const pageColors = await productPage.evaluate(() => ({
                meta: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
                root: getComputedStyle(document.documentElement).colorScheme,
              }));
              if (pageColors.meta !== 'only light' || !['only light', 'light only'].includes(pageColors.root)) {
                throw new Error('Android Auto Dark Theme opt-out is missing: ' + JSON.stringify(pageColors));
              }
              // Verify the short dock label on narrow Android-like viewports.
              await productPage.setViewportSize({ width: 320, height: 760 });
              const careDock = productPage.locator('.mobile-dock a[aria-label="Starostlivosť"]');
              if (!(await careDock.locator('.mobile-dock-label-short').isVisible())) throw new Error('Narrow dock must use readable care label');
              const narrowLabel = await careDock.locator('.mobile-dock-label-short').boundingBox();
              const narrowItem = await careDock.boundingBox();
              if (!narrowLabel || !narrowItem || narrowLabel.x < narrowItem.x || narrowLabel.x + narrowLabel.width > narrowItem.x + narrowItem.width + 1) {
                throw new Error('Care label overflows its narrow dock button');
              }
              await productPage.setViewportSize({ width: 390, height: 844 });
              const firstCard = catalog.locator('[data-product-card]').first();
              const cardBox = await firstCard.boundingBox();
              if (!cardBox || cardBox.height > 540) throw new Error('Mobile catalogue card must remain compact');
              const photo = firstCard.locator('[data-product-photo]');
              const photoBox = await photo.boundingBox();
              if (!photoBox || photoBox.height < 210 || photoBox.height > 260) throw new Error('Product photo must be taller on mobile');
              if (!await firstCard.getByRole('heading', { name: 'Drevený stojan na misky pre psa', exact: true }).count()) throw new Error('Catalogue stand title incorrect');
              if (!await firstCard.getByText('Stabilný ručne vyrábaný stojan s dvoma miskami.', { exact: false }).count()) {
                throw new Error('Catalogue stand description incorrect');
              }
              const badges = photo.locator('[data-product-photo-features] > span');
              if (await badges.count() !== 3) throw new Error('Three product benefits must overlay the photo');
              const imageBounds = await photo.boundingBox();
              const badgeBounds = await Promise.all([0,1,2].map(i => badges.nth(i).boundingBox()));
              if (badgeBounds.some(b => !b) || !imageBounds) throw new Error('Product photo benefits are missing geometry');
              if (badgeBounds.some(b => Math.abs(b.y - badgeBounds[0].y) > 2 || b.x < imageBounds.x - 1 || b.x + b.width > imageBounds.x + imageBounds.width + 1)) {
                throw new Error('Product photo benefits must fit within one horizontal row');
              }
              for (const feature of ['2 misky v cene', 'Personalizácia', 'Výška na mieru']) {
                if (!await badges.getByText(feature, { exact: true }).count()) throw new Error('Missing stand photo benefit: ' + feature);
              }
              for (const label of ['2 misky v cene', 'Personalizácia', 'Výška na mieru']) {
                const item = badges.filter({ hasText: label });
                if (await item.evaluate(el => el.scrollWidth > el.clientWidth + 2)) throw new Error('Product photo badge text overflows: ' + label);
              }
              const targetBadges = catalog.locator('[data-product-card]').nth(1).locator('[data-product-photo-features] > span');
              if (await targetBadges.count() !== 3) throw new Error('Target benefits must also overlay its photo');
              const nextProduct = productPage.getByRole('button', { name: 'Ďalší produkt' });
              const catalogueCookieLayer = productPage.locator('[aria-labelledby="cookie-consent-title"]');
              // The cookie modal can appear after hydration, including between
              // our first consent check and a swipe/arrow click. Never force-click.
              if (await catalogueCookieLayer.isVisible()) {
                await catalogueCookieLayer.getByRole('button', { name: 'Len nevyhnutné', exact: true }).click();
                await catalogueCookieLayer.waitFor({ state: 'hidden' });
              }
              try {
                await nextProduct.click({ timeout: 4000 });
              } catch (error) {
                if (!(await catalogueCookieLayer.isVisible())) throw error;
                await catalogueCookieLayer.getByRole('button', { name: 'Len nevyhnutné', exact: true }).click();
                await catalogueCookieLayer.waitFor({ state: 'hidden' });
                await nextProduct.click();
              }
              // Smooth scroll and snap update the counter asynchronously.
              await productPage.getByText('2 / 2', { exact: true }).waitFor({ state: 'visible', timeout: 6000 });
              await productPage.waitForFunction(
                () => {
                  const track = document.querySelector('[data-products-carousel]');
                  return track && track.scrollLeft > 30;
                },
                null,
                { timeout: 6000 },
              ).catch(() => { throw new Error('Product carousel did not complete horizontal smooth scroll'); });
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
              // Meta refresh / location.replace can race with Playwright's navigation
              // promise in WebKit, even while correctly moving to /produkty/.
              const aliasUrl = new URL(legacy, base).href;
              try {
                await productPage.goto(aliasUrl, { waitUntil: 'commit' });
              } catch (error) {
                // Tolerate only the specific verified redirect race, not a failed navigation.
                const expectedRedirect = new URL('/produkty/', base).href;
                const message = String(error);
                if (!message.includes(`Navigation to "${aliasUrl}" is interrupted by another navigation to "${expectedRedirect}"`)) {
                  throw error;
                }
              }
              // The real destination heading and path must still be present.
              await productPage.getByRole('heading', { name: 'Naše produkty pre psov', exact: true }).waitFor({ state: 'visible' });
              if (!['/produkty', '/produkty/'].includes(new URL(productPage.url()).pathname)) {
                throw new Error('Retired product alias did not redirect to /produkty: ' + legacy);
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
