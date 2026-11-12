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
              if (await hero.locator('.hero-cta-primary:visible').count() !== 1)
                throw new Error('Hero must display exactly one prominent CTA at ' + width);
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
                if (['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/'].includes(url.pathname)) {
                  // Benefit chips should start at the left edge of Hero copy,
                  // not float right. The EN hero was already left-aligned.
                  const benefits = hero.locator('[data-hero-benefits]').first();
                  if (!await benefits.isVisible()) throw new Error('Hero benefits missing on desktop');
                  const delta = await benefits.evaluate(row => {
                    // Main Hero renders a separate hidden mobile h1 first:
                    // select the actual visible heading at the active viewport.
                    const title = [...(row.closest('section')?.querySelectorAll('h1') || [])].find(node => {
                      const rect = node.getBoundingClientRect();
                      return rect.width > 0 && rect.height > 0;
                    });
                    if (!title) return null;
                    return Math.abs(row.getBoundingClientRect().left - title.getBoundingClientRect().left);
                  });
                  if (delta === null || delta > 8)
                    throw new Error('Desktop Hero benefit badges not aligned with text left edge: ' + delta);
                }
              }
              if ((await primary.evaluate(el => getComputedStyle(el).boxShadow)) === 'none')
                throw new Error('Primary CTA glow missing: ' + width);
            }
            await page.setViewportSize({ width: 390, height: 844 });
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
          // Check dialogs only after scrolling/carousels: Radix locks background
          // scroll while open. Keep the actual modal centered and scrollable.
          if (!bellaris && !restricted && ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/', '/en/dog-daycare-kosice/'].includes(url.pathname)) {
            const entry = url.pathname === '/'
              ? page.locator('section.hero-safe-top .hero-cta-primary:visible').first()
              : page.locator('.mobile-dock .mobile-dock-apply').first();
            await entry.click();
            const modal = page.getByRole('dialog');
            await modal.waitFor({ state: 'visible' });
            if (!await modal.locator('[data-lead-step-form]').count())
              throw new Error('Mobile interest CTA must open guided enquiry modal');
            const modalFrame = await modal.evaluate(el => {
              const rect = el.getBoundingClientRect();
              const inner = el.querySelector('.form-dialog-scroll');
              return {
                midpointOffset: Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2),
                top: rect.top, bottom: rect.bottom, viewport: window.innerHeight,
                innerScrollable: !!inner && getComputedStyle(inner).overflowY === 'auto',
              };
            });
            if (modalFrame.midpointOffset > 20 || modalFrame.top < -1 || modalFrame.bottom > modalFrame.viewport + 1 || !modalFrame.innerScrollable)
              throw new Error('Mobile FormDialog is not centered/scrollable: ' + JSON.stringify(modalFrame));
            await page.keyboard.press('Escape');
            await modal.waitFor({ state: 'hidden' });

            if (url.pathname === '/') {
              // This CTA says 'register', so it must open the full application,
              // not the two-step enquiry form. Never actually submit customer data.
              await page.locator('#preco').getByRole('button', { name: 'Chcem prihlásiť psíka' }).click();
              const application = page.getByRole('dialog');
              await application.waitFor({ state: 'visible' });
              if (!await application.getByRole('heading', { name: 'Prihlás svojho psíka ešte dnes' }).isVisible())
                throw new Error('Main Why CTA did not open the full application dialog');
              if (!await application.locator('input[name="pes"]').count() ||
                  !await application.locator('input[name="meno"]').count() ||
                  await application.locator('[data-lead-step-form]').count())
                throw new Error('Main Why CTA opened an inquiry instead of the full dog application');
              const applicationFrame = await application.evaluate(el => {
                const rect = el.getBoundingClientRect();
                const scroll = el.querySelector('.form-dialog-scroll');
                return {
                  midpointOffset: Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2),
                  top: rect.top, bottom: rect.bottom, viewport: window.innerHeight,
                  innerScrollable: !!scroll && scroll.scrollHeight > scroll.clientHeight + 25,
                };
              });
              if (applicationFrame.midpointOffset > 20 || applicationFrame.top < -1 ||
                  applicationFrame.bottom > applicationFrame.viewport + 1 || !applicationFrame.innerScrollable)
                throw new Error('Full dog registration modal must stay centered with inner scrolling: ' + JSON.stringify(applicationFrame));
              await page.keyboard.press('Escape');
              await application.waitFor({ state: 'hidden' });
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
              if (!await heroTitle.isVisible()) throw new Error('Product hero title missing: ' + route);
              const detailText = route.includes('stojan')
                ? 'Vyberte si variant a objednajte si stojan pre svojho psíka.'
                : 'Vyberte si variant a objednajte si target pre svojho psíka.';
              if ((await productPage.locator('h1 + p').innerText()).trim() !== detailText) {
                throw new Error('Short product hero subtitle missing: ' + route);
              }
              if (route.includes('stojan')) {
                const cards = productPage.locator('[data-product-stand-cards]');
                if (await cards.locator('article').count() !== 3) throw new Error('Exactly three stand variant cards required');
                if (width === 390 && !(await cards.evaluate(el => el.scrollWidth > el.clientWidth + 30))) {
                  throw new Error('Stand carousel must swipe on mobile');
                }
                const cases = [
                  {type:'small', label:'„S“ verzia', price:'40 €', photo:'MIA'},
                  {type:'large', label:'„M“ verzia', price:'45 €', photo:'CORI'},
                  {type:'extra_large', label:'„L“ verzia', price:'50 €', photo:'ROSE'},
                ];
                for (const item of cases) {
                  const card = cards.locator('article[data-stand-size="' + item.type + '"]');
                  const cardCount = await card.count();
                  const cardText = cardCount === 1 ? await card.textContent() : '(card not found)';
                  if (cardCount !== 1 || !cardText.includes(item.label) || !cardText.includes(item.price)) {
                    throw new Error('Stand card label/price wrong: '+item.label+
                      ' count='+cardCount+' text='+JSON.stringify(cardText.slice(0,250)));
                  }
                  if (!(await card.locator('img').getAttribute('alt')).includes(item.photo)) {
                    throw new Error('Stand card photo missing: ' + item.photo);
                  }
                  if (await card.locator('[aria-label="Vlastnosti stojana"] span').count() !== 3) {
                    throw new Error('Stand feature badges missing: '+item.label);
                  }
                }
                for (const type of ['small', 'large', 'extra_large']) {
                  const item = cards.locator('article[data-stand-size="' + type + '"]');
                  const photoHeight = await item.locator('img').evaluate(el => el.getBoundingClientRect().height);
                  if (photoHeight < 300) throw new Error('Stand photo should be tall enough to show whole stand: ' + type);
                  if (await item.locator('svg.lucide-star').count() !== 5) throw new Error('Five decorative filled stars must appear above first feature');
                  const fill=await item.locator('svg.lucide-star').first().getAttribute('class');
                  if (!fill?.includes('fill-current')) throw new Error('Product stars must be filled');
                  const heading=item.locator('[data-stand-card-heading]');
                  const label=heading.locator('p');
                  const stars=heading.locator('[data-stand-decorative-stars]');
                  const [labelBox,starBox,starStyle]=await Promise.all([
                    label.boundingBox(),stars.boundingBox(),stars.evaluate(el=>getComputedStyle(el).color)]);
                  if (!labelBox || !starBox || starBox.x<=labelBox.x+labelBox.width ||
                      Math.abs(starBox.y-labelBox.y)>9) {
                    throw new Error('Decorative stars must be at the right of S/M/L size label');
                  }
                  if (starStyle !== 'rgb(233, 182, 0)') throw new Error('Stand stars must be yellow, not coral');
                  const version=label.locator('span').nth(1);
                  if (await version.textContent() !== 'verzia' ||
                      await version.evaluate(el=>getComputedStyle(el).color) !== 'rgb(24, 24, 24)')
                    throw new Error('Stand version must be black beside the quoted size');
                }
                if (await productPage.getByText('Recenzie spokojných zákazníkov čoskoro').count()) throw new Error('No review teaser on stand detail');
                if (await productPage.getByText('Potiahnite do strany').count()) throw new Error('Obvious swipe instruction should be removed');
                const stepList=productPage.locator('[data-stand-benefit-steps] ol');
                const items=stepList.locator('[data-stand-benefit-step]');
                if (await items.count()!==3) throw new Error('Three stand benefits expected');
                const stepBoxes=await items.evaluateAll(nodes=>nodes.map(node=>{
                  const r=node.getBoundingClientRect();
                  return {x:r.x,y:r.y,width:r.width,height:r.height};
                }));
                if (width===390) {
                  if (!(stepBoxes[0].y+stepBoxes[0].height<stepBoxes[1].y+5 &&
                        stepBoxes[1].y+stepBoxes[1].height<stepBoxes[2].y+5))
                    throw new Error('Mobile stand benefits must stack vertically');
                  for(const item of await items.all()){
                    if(!await item.locator('img').isVisible()) throw new Error('Mobile stand benefit needs circular photo');
                    const round=await item.locator('img').evaluate(el=>{
                      const radius=getComputedStyle(el).borderTopLeftRadius;
                      const size=el.getBoundingClientRect().width;
                      return radius.includes('%') ? parseFloat(radius)>=50 : parseFloat(radius)>=size/2-1;
                    });
                    if(!round)throw new Error('Benefit photos must be circular');
                    const size=await item.locator('p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
                    if(size<14) throw new Error('Mobile benefit text too small');
                  }
                }else{
                  if (Math.abs(stepBoxes[0].y-stepBoxes[1].y)>5 ||
                      Math.abs(stepBoxes[1].y-stepBoxes[2].y)>5)
                    throw new Error('Desktop benefit timeline must remain horizontal');
                }
                if (await productPage.locator('section[data-stand-gallery-section]').count() !== 1
                    || await productPage.locator('section[data-stand-breeds]').count() !== 1
                    || await productPage.locator('section[data-stand-benefits]').count() !== 1) {
                  throw new Error('Stand content sections missing');
                }
                const order=await productPage.locator('section[data-stand-gallery-section],section[data-stand-breeds],section[data-stand-benefits]').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('data-stand-gallery-section') !== null?'gallery':el.hasAttribute('data-stand-breeds')?'breeds':'benefits'));
                if (order.join(',') !== 'gallery,breeds,benefits') throw new Error('Stand content order wrong: '+order);
                const captions=await productPage.locator('[data-photo-carousel="stand"] figcaption').allTextContents();
                for(const [n, name] of ['MIA','CORI','ROSE','BUNCA & LINDEN','ARCANA & AIDEN'].entries()){
                  if(!captions[n]?.startsWith(name))throw new Error('Newest stand gallery order wrong: '+name);
                }
                const card = cards.locator('article[data-stand-size="large"]');
                await card.getByRole('button', {name:/M verzia/i}).click();
                const dlg = productPage.getByRole('dialog',{name:'Mám záujem o stojan'});
                await dlg.waitFor({state:'visible'});
                if (await dlg.getAttribute('data-form-dialog') !== 'simple-v300') throw new Error('Stand needs stable iOS FormDialog');
                if (await dlg.locator('[data-product-inquiry-steps][data-step="1"]').count() !== 1) throw new Error('Stand step 1 missing');
                const progress = dlg.getByRole('progressbar',{name:'Priebeh formulára'});
                if (await progress.count() !== 1 || await progress.getAttribute('aria-valuenow') !== '1') throw new Error('Stand step progress missing');
                if (await dlg.locator('[aria-label="Postup dopytu"]').count()) throw new Error('Old three-box wizard still present');
                const selected = dlg.locator('[data-stand-size-picker="inquiry"] button[aria-pressed="true"]');
                if (!(await selected.innerText()).includes('M verzia')) throw new Error('Stand CTA did not preselect M');
                await dlg.getByPlaceholder('napr. 58').fill('65');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="2"]').count() !== 1) throw new Error('Stand personalization step missing');
                await dlg.getByPlaceholder('napr. Bella').fill('Rex');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="3"]').count() !== 1) throw new Error('Stand contact step missing');
              } else {
                const photo = productPage.locator('img[fetchpriority="high"]').first();
                const label = productPage.getByText('Vyberte veľkosť', { exact: true });
                const [headingBox, photoBox, sizeBox] = await Promise.all([
                  heroTitle.boundingBox(),photo.boundingBox(),label.boundingBox()]);
                if (!headingBox || !photoBox || !sizeBox) throw new Error('Target product regions missing');
                if (width === 1440 && !(photoBox.x + photoBox.width <= headingBox.x+8 && sizeBox.x >= headingBox.x-8)) throw new Error('Target desktop layout changed');
                if (width === 390 && !(headingBox.y < photoBox.y && photoBox.y < sizeBox.y)) throw new Error('Target mobile layout changed');
                await productPage.getByRole('button',{name:action}).first().click();
                const dlg=productPage.getByRole('dialog',{name:action});
                await dlg.waitFor({state:'visible'});
                if (await dlg.locator('[data-product-inquiry-steps][data-step="1"]').count() !== 1) throw new Error('Target step 1 missing');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="2"]').count() !== 1) throw new Error('Target step 2 missing');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="3"]').count() !== 1) throw new Error('Target contact step missing');
              }
              const formDialog = productPage.getByRole('dialog',{name:action});
              if (!await formDialog.locator('input[name="customer_name"]').count()
                || !await formDialog.locator('input[name="email"]').count()
                || !await formDialog.locator('input[name="customer_location"]').count()) {
                throw new Error('Product contact inputs missing');
              }
              if (await formDialog.locator('[type="checkbox"][required]').count() !== 1) throw new Error('Consent checkbox missing');
              const locationInput=formDialog.locator('input[name="customer_location"]');
              if (await locationInput.getAttribute('required') === null) throw new Error('City and postal code must remain mandatory');
              await formDialog.getByRole('button',{name:'Ako je to s doručením?'}).click();
              const deliveryDialog=productPage.getByRole('dialog',{name:'Doprava a doručenie'});
              await deliveryDialog.waitFor({state:'visible'});
              for(const label of ['Košice','Zadarmo','Okolie Košíc a Prešov','5 €','Vzdialenejšie lokality','Individuálne']) {
                if(!await deliveryDialog.getByText(label,{exact:true}).isVisible()) throw new Error('Shipping option missing '+label);
              }
              await productPage.keyboard.press('Escape');
              await deliveryDialog.waitFor({state:'hidden'});
              if (width === 390) {
                for(const field of await formDialog.locator('input:visible:not([type="checkbox"])').all()) {
                  if (await field.evaluate(el => parseFloat(getComputedStyle(el).fontSize)) < 16) throw new Error('Product input risks Safari zoom');
                }
              }
              await productPage.keyboard.press('Escape');
              await formDialog.waitFor({state:'hidden'});
              if (route.includes('stojan')) {
                const openForm=productPage.locator('[data-stand-inline-form]');
                if (!await openForm.locator('[data-product-inquiry-steps]').count()) throw new Error('Bottom inline stand form missing');
                if (await openForm.locator('[data-product-inquiry-steps]').getAttribute('data-step') !== '3') throw new Error('Bottom form and modal must share progress');
                if (await productPage.locator('section[data-stand-gallery-section] button:has-text("Mám záujem o stojan")').count()) throw new Error('Gallery should precede product explanation without stray CTA');
              }
              const galleryTrack=productPage.locator('[data-photo-carousel="' + (route.includes('stojan')?'stand':'target') + '"]');
              if (await galleryTrack.count() !== 1 || await galleryTrack.locator('figure').count() !== (route.includes('stojan')?16:8)) {
                throw new Error('Product gallery missing: '+route);
              }
              if (await productPage.locator('a[href="/kosik"], a[href="/objednavka"]').count()) throw new Error('Product routes to retired checkout');
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
            if (await guideCarousel.locator('figure').count() !== 16) throw new Error('Stand guide must show sixteen distinct realizations');
            if (await guideCarousel.locator('button[data-stand-photo-open]').count() !== 16) throw new Error('Guide stand photos must open too');
            const cookieLayerBeforeGuide = productPage.locator('[aria-labelledby="cookie-consent-title"]');
            if (await cookieLayerBeforeGuide.isVisible()) {
              await cookieLayerBeforeGuide.getByRole('button', { name: 'Len nevyhnutné', exact: true }).click();
              await cookieLayerBeforeGuide.waitFor({state:'hidden'});
            }
            await guideCarousel.locator('button[data-stand-photo-open]').first().click();
            const articleLightbox = productPage.locator('[data-stand-lightbox]');
            await articleLightbox.waitFor({state:'visible'});
            if (!await articleLightbox.locator('img').first().isVisible()) throw new Error('Guide lightbox has no photo');
            if (await articleLightbox.getByText('Priblížte si fotografiu').count())
              throw new Error('Obsolete zoom instructions visible');
            if (await articleLightbox.getByRole('button',{name:'Priblížiť fotografiu'}).count() ||
                await articleLightbox.getByRole('button',{name:'Oddialiť fotografiu'}).count())
              throw new Error('Stand viewer must not show zoom buttons');
            const viewport=articleLightbox.locator('[data-stand-photo-viewport]');
            if (await viewport.getAttribute('data-pinch-enabled')!=='true')
              throw new Error('Pinch-ready stand image viewport missing');
            if (await viewport.evaluate(el=>getComputedStyle(el).touchAction)!=='none')
              throw new Error('Touch viewport must allow custom pinch/pan');
            if (width===390) {
              const pinch=await viewport.evaluate(el=>{
                if (typeof Touch !== 'function' || typeof TouchEvent !== 'function') return 'unsupported';
                const r=el.getBoundingClientRect(), y=r.y+r.height/2, x=r.x+r.width/2;
                const t=(id,clientX,clientY)=>new Touch({
                  identifier:id,target:el,clientX,clientY,screenX:clientX,screenY:clientY,
                  pageX:clientX,pageY:clientY,
                });
                const emit=(name,touches)=>el.dispatchEvent(new TouchEvent(name,{
                  bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:touches,
                }));
                emit('touchstart',[t(1,x-35,y),t(2,x+35,y)]);
                emit('touchmove',[t(1,x-100,y),t(2,x+100,y)]);
                emit('touchend',[]);
                return Number(el.dataset.zoom);
              });
              if (pinch!=='unsupported' && (!Number.isFinite(pinch) || pinch<=1.3))
                throw new Error('Two-finger stand image pinch must actually scale');
              if (await productPage.locator('.mobile-dock').isVisible())
                throw new Error('Mobile dock must not obstruct photo viewer navigation');
            }

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
