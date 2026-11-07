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
              if (await galleryTrack.locator('figure').count() !== (carouselName === 'stand' ? 3 : 8)) {
                throw new Error('Carousel must render each distinct photo exactly once: ' + carouselName);
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
            const standImage = productPage.locator('article > figure img').first();
            if (!(await standImage.getAttribute('src'))?.includes('stand-mia-')) {
              throw new Error('Stand guide is not using restored MIA AVIF source');
            }
            const guideCarousel = productPage.locator('[data-stand-gallery="autoplay"]');
            if (await guideCarousel.count() !== 1) throw new Error('Stand guide carousel missing above product CTA');
            if (await guideCarousel.locator('figure').count() !== 3) throw new Error('Stand guide must show three unique product photos');
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
              if (!await productPage.getByRole('heading', { level: 1, name: /Naše produkty pre psov/i }).count()) {
                throw new Error('Mobile dock did not open the existing products catalogue');
              }
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
