const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// Run in CI, without submitting forms or emitting analytics traffic.
const bellaris = process.env.WEB_SITE === 'bellaris';
const base = process.env.WEB_BASE_URL || (bellaris ? 'https://bellaris.sk' : 'https://chvostikovo.sk');
const urls = (bellaris ? ['/', '/cennik/', '/postup/'] : ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/', '/en/dog-daycare-kosice/', '/test-aria/']).map(route => new URL(route, base));
const brandPreviewCandidate = new URL(base).hostname === '127.0.0.1';
const out = process.env.RUNTIME_REPORT_DIR || 'runtime-report';
fs.mkdirSync(out, { recursive: true });
const results = [];
const failures = [];

// APP-01 static regression for the slider fill direction in both engines.
// Pseudo-element background images are not exposed consistently by getComputedStyle.
if (!bellaris && brandPreviewCandidate) {
  const styles = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
  const correctGradient = 'background: linear-gradient(to right, var(--color-coral) 0 var(--aria-puppy-progress, 0%), #e0e5e0 var(--aria-puppy-progress, 0%) 100%);';
  if (styles.split(correctGradient).length !== 3) {
    failures.push('Puppy age range must fill orange from left to thumb, gray from thumb to right in Chromium and Firefox');
  }
}

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
        // Record only synthetic events from this browser fixture. Prevent
        // automated interactions from polluting production campaign analytics.
        const trackedEvents = [];
        if (!bellaris && !restricted && ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/'].includes(url.pathname)) {
          await page.route('**/functions/v1/website-landing-event', async route => {
            const request = route.request();
            const data = request.method() === 'POST' ? request.postDataJSON() : {};
            if (data?.event_name) trackedEvents.push({ name: data.event_name, source: data.event_source, attemptId: data.attempt_id });
            await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
          });
        }
        try {
          const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 40000 });
          if (response?.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
          // APP-01: SSR must never display an unmeasured diagonal SVG tail.
          if (brandPreviewCandidate && !restricted &&
              ['/psia-skolka-kosice/', '/test-aria/'].includes(url.pathname)) {
            const serverHtml = await response.text();
            if (!serverHtml.includes('data-aria-outline-ready="false"') ||
                /<svg\b[^>]*\bdata-aria-tail\b/i.test(serverHtml))
              throw new Error('Aria SSR must show rounded fallback, not an unmeasured SVG tail');
          }
          // The server HTML is visible before effects run; wait for client hydration.
          await page.waitForTimeout(3000);
          const text = await page.locator('body').innerText();
          if (/This page didn.t load|Stránku sa nepodarilo načítať|Something went wrong on our end/i.test(text)) throw new Error('Root error boundary replaced the website');
          if (!await page.locator('h1').count()) throw new Error('Missing page heading');
          // Cookie preferences are installed by a client effect, so this also verifies hydration.
          const cookieButton = page.getByRole('button', { name: /Odmietnuť|Reject|Reject all|Len nevyhnutné|Necessary only/i }).first();
          await cookieButton.waitFor({ timeout: 10000 });
          if (brandPreviewCandidate && !bellaris && ['/test-aria/', '/psia-skolka-kosice/'].includes(url.pathname)) {
            const palette = await page.evaluate(() => {
              const exp = document.querySelector('[data-aria-brand-experiment]');
              const info = exp ? getComputedStyle(exp) : null;
              const headline = document.querySelector('[data-aria-hero-content] h1 span');
              const action = document.querySelector('#aria-hero-form .btn-coral');
              const badge = document.querySelector('[data-aria-service-badge]');
              return {
                variant: exp?.getAttribute('data-aria-brand-experiment') || null,
                rose: info?.getPropertyValue('--preview-cta-rose').trim() || '',
                sage: info?.getPropertyValue('--preview-sage').trim() || '',
                actionBg: action ? getComputedStyle(action).backgroundColor : '',
                badgeBg: badge ? getComputedStyle(badge).backgroundColor : '',
                badgeFg: badge ? getComputedStyle(badge).color : '',
                headline: headline ? getComputedStyle(headline).color : '',
                heroCopyBg: document.querySelector('[data-aria-hero-description]') ? getComputedStyle(document.querySelector('[data-aria-hero-description]')).backgroundColor : '',
                heroCopyFg: document.querySelector('[data-aria-hero-description]') ? getComputedStyle(document.querySelector('[data-aria-hero-description]')).color : '',
                earlyFaqBg: document.querySelector('#aria-early-faq details') ? getComputedStyle(document.querySelector('#aria-early-faq details')).backgroundColor : '',
                pricingBg: document.querySelector('#lead-pricing') ? getComputedStyle(document.querySelector('#lead-pricing')).backgroundColor : '',
                footerBg: document.querySelector('footer') ? getComputedStyle(document.querySelector('footer')).backgroundColor : '',
                benefitHeading: document.querySelector('#lead-benefits h3') ? getComputedStyle(document.querySelector('#lead-benefits h3')).color : '',
                greenPills: document.querySelector('[data-hero-benefits] .bg-forest') ? getComputedStyle(document.querySelector('[data-hero-benefits] .bg-forest')).backgroundColor : '',
                earlySectionBg: document.querySelector('#aria-early-faq') ? getComputedStyle(document.querySelector('#aria-early-faq')).backgroundColor : '',
                prices: [...document.querySelectorAll('#lead-pricing [data-lead-price]')].map(el => getComputedStyle(el).color),
                bestValueBg: document.querySelector('[data-lead-best-value]') ? getComputedStyle(document.querySelector('[data-lead-best-value]')).backgroundColor : '',
                bestValueFg: document.querySelector('[data-lead-best-value]') ? getComputedStyle(document.querySelector('[data-lead-best-value]')).color : '',
                taxiBg: document.querySelector('[data-aria-taxi]') ? getComputedStyle(document.querySelector('[data-aria-taxi]')).backgroundColor : '',
                requirementTitle: document.querySelector('#lead-requirements h3') ? getComputedStyle(document.querySelector('#lead-requirements h3')).color : '',
                requirementIcon: document.querySelector('#lead-requirements article svg') ? getComputedStyle(document.querySelector('#lead-requirements article svg')).color : '',
                firstVisitAction: document.querySelector('#aria-first-visit-form .btn-coral') ? getComputedStyle(document.querySelector('#aria-first-visit-form .btn-coral')).backgroundColor : '',
              };
            });
            if (url.pathname === '/test-aria/' || url.pathname === '/psia-skolka-kosice/') {
              if (palette.variant !== 'orange-rose' ||
                  palette.rose !== '#b82e7f' || palette.sage !== '#f3f8ef' ||
                  palette.actionBg !== 'rgb(184, 46, 127)' ||
                  palette.firstVisitAction !== 'rgb(184, 46, 127)' ||
                  palette.badgeBg !== (url.pathname === '/psia-skolka-kosice/' ? 'rgb(184, 46, 127)' : 'rgb(255, 164, 20)') ||
                  palette.badgeFg !== 'rgb(255, 255, 255)' ||
                  palette.headline !== 'rgb(255, 164, 20)' ||
                  palette.heroCopyBg !== 'rgb(255, 164, 20)' ||
                  palette.heroCopyFg !== (url.pathname === '/psia-skolka-kosice/' ? 'rgb(255, 255, 255)' : 'rgb(23, 28, 24)') ||
                  palette.earlyFaqBg !== 'rgb(255, 255, 255)' ||
                  palette.earlySectionBg !== 'rgba(255, 164, 20, 0.26)' ||
                  palette.pricingBg !== 'rgba(255, 164, 20, 0.26)' ||
                  palette.footerBg !== 'rgba(255, 164, 20, 0.26)' ||
                  palette.benefitHeading !== 'rgb(255, 164, 20)' ||
                  palette.requirementTitle !== 'rgb(255, 164, 20)' ||
                  palette.requirementIcon !== 'rgb(38, 50, 43)' ||
                  palette.prices.length !== 2 ||
                  palette.prices[0] !== 'rgb(255, 164, 20)' || palette.prices[1] !== 'rgb(184, 46, 127)' ||
                  palette.bestValueBg !== 'rgb(255, 164, 20)' ||
                  palette.bestValueFg !== 'rgb(255, 255, 255)' ||
                  palette.taxiBg !== 'rgb(184, 46, 127)' ||
                  palette.greenPills !== 'rgb(45, 118, 75)')
                throw new Error('Preview palette differs from approved orange/rose/soft-background contracts: '+JSON.stringify(palette));
            } else if (palette.variant || palette.rose || palette.sage) {
              throw new Error('Unexpected palette on non-lead page: '+JSON.stringify(palette));
            }
          }
          // The released lead URL and the noindex preview share Aria UI. The
          // production baseline may still show its pre-release landing.
          const isAriaPage = !bellaris && (url.pathname === '/test-aria/' || url.pathname === '/psia-skolka-kosice/') && await page.locator('[data-aria-guide]').count() > 0;
          // On current production this is the approved puppy rollout; the
          // informational pre-merge baseline may still use the old dock.
          const isPuppyAria = !bellaris && url.pathname === '/psia-skolka-pre-steniatka/' &&
            await page.locator('[data-aria-guide]').count() > 0;
          if (!bellaris && (isAriaPage || isPuppyAria)) {
            if (!await page.getByText(/Ahoj! Používame cookies 🍪/).count())
              throw new Error('Preview cookie greeting missing');
            const bubble = page.locator('[data-aria-cookie-bubble="true"]');
            await bubble.waitFor({ state: 'visible' });
            if (!await page.getByRole('button', { name: 'Prijať všetky' }).isVisible() ||
                !await page.getByRole('button', { name: 'Prispôsobiť' }).isVisible() ||
                !await cookieButton.isVisible())
              throw new Error('Aria cookie bubble lost equivalent accept, customize or reject options');
            const head = bubble.locator('xpath=..').locator('img[alt*="Aria"]');
            const geometry = await Promise.all([bubble.boundingBox(), head.boundingBox()]);
            if (!geometry[0] || !geometry[1] || geometry[1].y >= geometry[0].y || geometry[1].y + geometry[1].height <= geometry[0].y)
              throw new Error('Cookie portrait must gently overlap the card, not connect via a triangle');
            if (await bubble.locator('xpath=..').locator('svg[viewBox="0 0 56 32"]').count())
              throw new Error('Rejected cookie triangle resurfaced');
            const cookieHeader = await bubble.locator('#cookie-consent-title').evaluate(el => ({
              wraps: el.getBoundingClientRect().height > 62,
              overflows: el.scrollWidth > el.clientWidth + 2,
              nowrap: getComputedStyle(el).whiteSpace === 'nowrap',
            }));
            if (cookieHeader.wraps || cookieHeader.overflows || !cookieHeader.nowrap)
              throw new Error('Aria cookie title must fit in one row next to portrait');
            if (url.pathname === '/test-aria/') {
              const cookieGap = await bubble.evaluate(el => {
                const title = el.querySelector('#cookie-consent-title');
                const paragraph = title?.nextElementSibling;
                if (!title || !paragraph) return Infinity;
                return paragraph.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
              });
              if (cookieGap > 6 || cookieGap < -1)
                throw new Error('Aria cookie heading needs a compact gap before the description: ' + cookieGap);
            }
            const cookieLock = await page.evaluate(() => ({
              rootOverflow: document.documentElement.style.overflow,
              bodyPosition: document.body.style.position,
              bodyTop: document.body.style.top,
              scrollY: window.scrollY,
            }));
            if (cookieLock.rootOverflow !== 'hidden' || cookieLock.bodyPosition !== 'fixed')
              throw new Error('First-visit consent must lock iPhone background scrolling');
            // Playwright mobile WebKit does not support mouse.wheel; verify the
            // fixed-body/html lock in both engines and the actual wheel effect
            // in Chromium without disguising a browser driver limitation.
            if (engine === 'chromium') {
              await page.mouse.wheel(0, 460);
              const scrolledBehindCookie = await page.evaluate(() => window.scrollY);
              if (Math.abs(scrolledBehindCookie - cookieLock.scrollY) > 1)
                throw new Error('Cookie overlay allowed the background to scroll');
            }
          }
          await cookieButton.click();
          await page.waitForTimeout(300);
          // Candidate-only regression for the three unified Chvostíkovo galleries.
          // Production-baseline CI keeps testing its already published version.
          if (!bellaris && !restricted && new URL(base).hostname === '127.0.0.1') {
            const verifyLightbox = async (fullResolution = false) => {
              const modal = page.locator('[data-photo-lightbox]');
              await modal.waitFor({state:'visible'});
              if (fullResolution) {
                await page.waitForFunction(() => {
                  const image=document.querySelector('[data-photo-lightbox-image]');
                  return image && image.complete && image.naturalWidth >= 1100 && image.naturalHeight >= 1500;
                },null,{timeout:5000});
              }
              const measured = await modal.evaluate(node => {
                const photo = node.querySelector('[data-photo-lightbox-image]');
                const close = node.querySelector('[data-photo-lightbox-close]');
                const left = node.querySelector('[data-photo-lightbox-prev]');
                const right = node.querySelector('[data-photo-lightbox-next]');
                if (!photo || !close || !left || !right) return {missing:true};
                const img=photo.getBoundingClientRect(), x=close.getBoundingClientRect();
                const prev=left.getBoundingClientRect(), next=right.getBoundingClientRect();
                return {
                  src:photo.getAttribute('src'),
                  w:img.width,h:img.height,naturalWidth:photo.naturalWidth,naturalHeight:photo.naturalHeight,
                  dx:Math.abs(img.right-x.right),dy:x.top-img.top,
                  arrows:[prev.width,next.width],
                  centers:[Math.abs(prev.top+prev.height/2-img.top-img.height/2),Math.abs(next.top+next.height/2-img.top-img.height/2)],
                  gesture:getComputedStyle(node.querySelector('[data-photo-lightbox-frame]')).touchAction,
                  lock:document.body.style.overflow==='hidden'
                };
              });
              if (measured.missing || !measured.lock || measured.w < 100 ||
                  (fullResolution && (measured.h < 100 || measured.naturalWidth < 1100 || measured.naturalHeight < 1500)) ||
                  measured.gesture!=='pan-y' || measured.dx>18 ||
                  measured.dy<0 || measured.dy>50 ||
                  measured.arrows.some(w=>w>42) ||
                  (measured.naturalWidth > 0 && measured.centers.some(y=>y>14)))
                throw new Error('Photo controls must be small and anchored to photo: '+JSON.stringify(measured));
              if (fullResolution && !measured.src.includes('-full'))
                throw new Error('User photo modal must load full resolution, not thumbnail: '+measured.src);
              await modal.locator('[data-photo-lightbox-next]').click();
              const next=await modal.locator('[data-photo-lightbox-image]').getAttribute('src');
              if (next===measured.src) throw new Error('Next photo arrow did not advance gallery');
              await page.keyboard.press('ArrowLeft');
              await page.waitForFunction(initial=>document.querySelector('[data-photo-lightbox-image]')?.getAttribute('src')===initial,measured.src,{timeout:2500});
              // Dispatch an actual TouchEvent sequence in both Chromium and WebKit:
              // horizontal swipe must advance, vertical scrolling must not be hijacked.
              await modal.locator('[data-photo-lightbox-frame]').evaluate(frame => {
                // WebKit's desktop Playwright driver rejects the native Touch
                // constructor. Dispatch touch event types with array-shaped
                // TouchLists, matching the successful stand pinch regression.
                const emit=(name,touches,changed)=>{
                  const event=new Event(name,{bubbles:true,cancelable:true});
                  Object.defineProperty(event,'touches',{value:touches});
                  Object.defineProperty(event,'changedTouches',{value:changed});
                  frame.dispatchEvent(event);
                };
                const before={clientX:260,clientY:360},after={clientX:80,clientY:364};
                emit('touchstart',[before],[before]);
                emit('touchend',[],[after]);
              });
              await page.waitForFunction(initial=>document.querySelector('[data-photo-lightbox-image]')?.getAttribute('src')!==initial,measured.src,{timeout:2500});
              await modal.locator('[data-photo-lightbox-close]').click();
              await modal.waitFor({state:'hidden'});
              if (await page.evaluate(()=>document.body.style.overflow==='hidden'))
                throw new Error('Photo modal leaked body scroll lock');
            };
            if (isAriaPage) {
              const isPaidCarousel = url.pathname === '/psia-skolka-kosice/';
              if (isPaidCarousel) {
                // HERO-MOBILE-01: move the *existing moving carousel* under hero,
                // not the unrelated static mosaic. The two approved former
                // teaser photos appear once in the first set, and retain their
                // original hi-res files in the lightbox.
                const gallery = page.locator('#lead-photo-carousel [data-gesture-track="photos"]');
                const highlights = gallery.locator(':scope > div:first-child [data-aria-lead-highlight]');
                if (await gallery.count() !== 1 ||
                    await page.locator('[data-aria-review-photo], #aria-mosaic').count() !== 0 ||
                    await highlights.count() !== 2)
                  throw new Error('Paid LEAD must have one moved moving carousel and two unique teaser highlights');
                for (const [n, expected] of [['1', 'lead-review-border-collies'], ['2', 'lead-review-retrievers-aussie']]) {
                  const photo = highlights.filter({has:page.locator('img')}).filter({has:page.locator('img[src*="' + expected + '"]')});
                  if (await photo.count() !== 1 ||
                      await photo.getAttribute('data-aria-lead-highlight') !== n)
                    throw new Error('Missing or duplicated approved original teaser inside moving carousel: ' + expected);
                }
                const layout = await page.evaluate(() => {
                  const hero = document.querySelector('section.hero-safe-top');
                  const heading = hero?.querySelector('h1')?.getBoundingClientRect();
                  const badge = hero?.querySelector('[data-aria-service-group]')?.getBoundingClientRect();
                  const reviews = document.querySelector('#recenzie')?.getBoundingClientRect();
                  const gallery = document.querySelector('#lead-photo-carousel');
                  const track = gallery?.querySelector('[data-gesture-track="photos"]');
                  const form = document.querySelector('#aria-hero-form')?.getBoundingClientRect();
                  // The section shell can start near the fixed dock while the
                  // interactive form inside it must remain below the dock.
                  const formContent = document.querySelector('#aria-hero-form [data-lead-step-form]')?.getBoundingClientRect();
                  const dock = document.querySelector('[data-aria-guide]');
                  const cards = [...(track?.querySelectorAll(':scope > div:first-child button') ?? [])];
                  const highRes = cards.filter(card => card.hasAttribute('data-aria-lead-highlight'));
                  const gr = gallery?.getBoundingClientRect(), tr = track?.getBoundingClientRect();
                  return {
                    width: window.innerWidth,
                    cardCount: cards.length, highlightCount: highRes.length,
                    headingBottom: heading?.bottom, badgeTop: badge?.top,
                    reviewBottom: reviews?.bottom, galleryTop: gr?.top, trackTop: tr?.top, trackBottom: tr?.bottom,
                    menuBottom: dock?.getBoundingClientRect().bottom, formTop: form?.top, formContentTop: formContent?.top, formBottom: form?.bottom,
                    fixed: dock ? getComputedStyle(dock).position === 'fixed' && !hero.contains(dock) : false,
                    reviewSpacing: parseFloat(getComputedStyle(hero?.querySelector('[data-aria-lead-review-spacing]')).marginTop),
                  };
                });
                if (!layout.fixed || layout.cardCount !== 20 || layout.highlightCount !== 2 ||
                    layout.badgeTop < layout.headingBottom + 50 ||
                    layout.formTop < layout.reviewBottom + 12 ||
                    !Number.isFinite(layout.formContentTop) || layout.formContentTop < layout.menuBottom + 8 ||
                    layout.galleryTop < layout.formBottom - 8 ||
                    layout.trackTop < layout.formBottom - 8)
                  throw new Error('Paid hero → form → moving gallery layout regressed: ' + JSON.stringify(layout));
                if (layout.width < 640 && (layout.reviewSpacing < 24 || layout.reviewSpacing > 36))
                  throw new Error('Approved mobile review spacing regressed: ' + JSON.stringify(layout));
                await highlights.first().scrollIntoViewIfNeeded();
                await highlights.first().click();
                await verifyLightbox(true);
              } else {
                const cards = page.locator('[data-aria-review-photo]');
                if (await cards.count() !== 2) throw new Error('Aria preview must retain two standalone teaser photos');
                await cards.first().scrollIntoViewIfNeeded();
                await page.waitForFunction(() => [...document.querySelectorAll('[data-aria-review-photo] img')]
                  .every(img => img.complete && img.naturalWidth >= 640 && img.naturalHeight >= 850),
                  null, {timeout:5000});
                await cards.first().click();
                await verifyLightbox(true);
                const mosaic = page.locator('#aria-mosaic button[aria-label^="Otvoriť fotografiu"]');
                await mosaic.first().scrollIntoViewIfNeeded();
                await mosaic.first().click();
                await verifyLightbox();
              }
            }
            if (url.pathname==='/' || isAriaPage) {
              const moving=page.locator('[data-gesture-track="photos"] button[aria-label^="Otvoriť fotografiu"]');
              await moving.first().scrollIntoViewIfNeeded();
              await moving.first().click();
              await verifyLightbox();
            }
            if (url.pathname==='/') {
              const gallery=page.locator('#priestory button').first();
              await gallery.scrollIntoViewIfNeeded();
              await gallery.click();
              await verifyLightbox();
            }
            await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
          }

          if (!bellaris && (isAriaPage || isPuppyAria)) {
            const restoredScroll = await page.evaluate(() => ({
              rootOverflow: document.documentElement.style.overflow,
              bodyPosition: document.body.style.position,
            }));
            if (restoredScroll.rootOverflow === 'hidden' || restoredScroll.bodyPosition === 'fixed')
              throw new Error('Cookie scroll lock was not restored after saving preferences');
          }
          if (!bellaris && !restricted && ['/', '/psia-skolka-kosice/', '/test-aria/', '/en/dog-daycare-kosice/'].includes(url.pathname)) {
            // APP-01: the Google mark, author and five stars must occupy one
            // compact horizontal row aligned to the quote, in SK and EN.
            const reviewSelector = url.pathname === '/en/dog-daycare-kosice/' ? '#reviews' : '#recenzie';
            for (const reviewWidth of [390, 1280]) {
              await page.setViewportSize({ width: reviewWidth, height: 900 });
              const byline = await page.locator(reviewSelector + ' figure').first().evaluate(card => {
                const head = card.querySelector('[data-review-byline]');
                const logo = head?.querySelector('[data-google-review-logo]');
                const caption = head?.querySelector('figcaption');
                const stars = head?.querySelector('[data-review-stars]');
                const quote = card.querySelector('blockquote');
                if (!head || !logo || !caption || !stars || !quote) return null;
                const l = logo.getBoundingClientRect();
                const n = caption.getBoundingClientRect();
                const s = stars.getBoundingClientRect();
                const h = head.getBoundingClientRect();
                const q = quote.getBoundingClientRect();
                return {
                  withinRow: Math.max(l.bottom,n.bottom,s.bottom) - Math.min(l.top,n.top,s.top) <= 32,
                  order: l.right <= n.left + 2 && n.right <= s.left + 2,
                  aligns: Math.abs(h.left - q.left) <= 2,
                  fits: n.right <= h.right + 2 && s.right <= h.right + 2,
                  height: card.getBoundingClientRect().height,
                };
              });
              if (!byline || !byline.withinRow || !byline.order || !byline.aligns ||
                  !byline.fits || byline.height > 210)
                throw new Error('Google review byline no longer compact at '+reviewWidth+': '+JSON.stringify(byline));
            }
            await page.setViewportSize({ width: 390, height: 844 });
          }

          if (!bellaris && isAriaPage && !restricted) {
            // Desktop release regression: phone and desktop must share the same
            // approved liquid copy, paired photographs and stable Aria panels.
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 420); });
            await page.waitForTimeout(140);
            const desktop = await page.evaluate(() => {
              const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
              const photos = window.location.pathname === '/psia-skolka-kosice/'
                ? [...document.querySelectorAll('#lead-photo-carousel [data-gesture-track="photos"] > div:first-child button')].slice(0, 2)
                : [...document.querySelectorAll('[data-aria-review-gap-photos] [data-aria-review-photo]')];
              const badge = rect('[data-aria-service-badge]');
              const crown = rect('[data-aria-hero-dogs] [aria-hidden="true"]');
              const text = document.querySelector('[data-aria-hero-description]');
              const team = document.querySelector('[data-hero-benefits]');
              const teamBounds = team?.getBoundingClientRect();
              return {
                heroHeader: !!document.querySelector('header.fixed'),
                photos: photos.length,
                visiblePhotos: photos.filter(photo => {
                  const bounds = photo.getBoundingClientRect();
                  return bounds.width >= 140 && bounds.height >= 110 && getComputedStyle(photo).display !== 'none';
                }).length,
                dogsWidth: crown?.width ?? 0,
                dogsTouchBadge: !!badge && !!crown && Math.abs(crown.bottom - badge.top) <= 3,
                liquid: !!text && (window.location.pathname === '/psia-skolka-kosice/'
                  ? getComputedStyle(text).backgroundImage === 'none'
                  : getComputedStyle(text).backgroundImage.includes('radial-gradient')) &&
                  parseFloat(getComputedStyle(text).borderTopLeftRadius) >= 15,
                about: window.location.pathname === '/psia-skolka-kosice/'
                  ? !!document.querySelector('#aria-about [data-hero-benefits]') && !!document.querySelector('#aria-about [data-safety-certificates]') &&
                    ![...document.querySelectorAll('#aria-about h2')].some(h => h.textContent?.includes('Viac o nás a našej škôlke')) &&
                    !document.body.textContent.includes('Viac o nás a našej škôlke')
                  : !!document.querySelector('#aria-about') && document.querySelectorAll('#aria-about p').length >= 2,
                teamPills: team?.children.length ?? 0,
                teamContained: !!teamBounds && [...team.children].every(pill => {
                  const bounds = pill.getBoundingClientRect();
                  return bounds.left >= teamBounds.left - 2 && bounds.right <= teamBounds.right + 2 &&
                    bounds.bottom <= teamBounds.bottom + 2;
                }),
                sliderStyle: getComputedStyle(document.querySelector('.aria-puppy-range')).appearance,
              };
            });
            if (desktop.heroHeader || desktop.photos !== 2 || desktop.visiblePhotos !== 2 ||
                desktop.dogsWidth < 390 || !desktop.dogsTouchBadge || !desktop.liquid ||
                !desktop.about || desktop.teamPills !== 3 || !desktop.teamContained ||
                desktop.sliderStyle !== 'none')
              throw new Error('Desktop lead diverges from responsive contract: ' + JSON.stringify(desktop));
            const ariaDesktop = page.locator('[data-aria-guide]');
            const beforeOpen = await page.locator('[data-aria-service-badge]').evaluate(el => el.getBoundingClientRect().left);
            if (url.pathname === '/psia-skolka-kosice/') {
              const bubbleGeometry = await ariaDesktop.locator('[data-aria-speech]').evaluate(el => {
                const rect = el.getBoundingClientRect();
                const face = document.querySelector('[data-aria-dock] img[alt^="Aria"]')?.getBoundingClientRect();
                const textRect = el.querySelector('p')?.getBoundingClientRect();
                return {
                  bubbleLeft: rect.left, bubbleRight: rect.right,
                  width: rect.width, height: rect.height,
                  faceRight: face?.right ?? -1,
                  textLeft: textRect?.left ?? -1,
                  textSize: parseFloat(getComputedStyle(el.querySelector('p') ?? el).fontSize),
                };
              });
              if (bubbleGeometry.width < 420 || bubbleGeometry.height < 68 ||
                  bubbleGeometry.textSize < 16 ||
                  (bubbleGeometry.bubbleLeft - bubbleGeometry.faceRight < 2 || bubbleGeometry.bubbleLeft - bubbleGeometry.faceRight > 5) ||
                  bubbleGeometry.faceRight > bubbleGeometry.textLeft - 26 ||
                  await page.locator('#lead-section-menu').count())
                throw new Error('Paid desktop Aria must be large with portrait clear of speech and no page menu: ' +
                  JSON.stringify(bubbleGeometry));
              const nav = ariaDesktop.locator('[data-aria-section-navigation="true"]');
              if (await nav.locator('button').count() !== 5 || await ariaDesktop.locator('[data-aria-panel]').count())
                throw new Error('Paid LEAD should have five in-page shortcuts and no floating panel');
              for (const [label,id] of [['O nás','aria-about'],['Cenník škôlky','lead-pricing'],
                ['Podmienky prijatia','lead-requirements'],['Mám záujem o škôlku','aria-hero-form']]) {
                if (!await page.locator('#'+id).count()) throw new Error('Missing paid scroll target '+id);
                await nav.getByRole('button',{name:label,exact:true}).click();
                if (await ariaDesktop.locator('[data-aria-panel]').count())
                  throw new Error('Paid section shortcut must not open a floating panel');
              }
              const menuButton = nav.getByRole('button',{name:'Otvoriť menu',exact:true});
              await menuButton.click();
              if (!await ariaDesktop.locator('[data-aria-panel="menu"]').isVisible() ||
                  await menuButton.getAttribute('aria-expanded') !== 'true')
                throw new Error('Paid Menu must use existing accessible popover, not added page grid');
              await menuButton.click();
              if (await ariaDesktop.locator('[data-aria-panel]').count())
                throw new Error('Paid Menu must close on the second click');
              // APP-01: about begins at the actual team photo, not repeated content.
              await nav.getByRole('button',{name:'O nás',exact:true}).click();
              await page.waitForFunction(() => {
                const target = document.getElementById('aria-about');
                if (!target) return false;
                const top = target.getBoundingClientRect().top;
                return top > 62 && top < 112;
              }, null, {timeout: 9000});
              if (!await page.locator('#aria-about img[alt*="Majitelia"]').isVisible() ||
                  await nav.getByRole('button',{name:'O nás'}).locator('svg').count() !== 1)
                throw new Error('Paid about navigation must lead to the owners photo with outline icon');
              await page.waitForTimeout(1000);
              // APP-01: reproduce the exact screenshot scenario at the footer,
              // after Aria changes from intro to contact. A valid SVG path alone
              // does not prove the balloon does not cover the portrait.
              await page.evaluate(() => {
                document.documentElement.style.scrollBehavior = 'auto';
                window.scrollTo(0, document.documentElement.scrollHeight);
              });
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'contact', null, {timeout: 6000});
              await page.waitForFunction(() => document.querySelector('[data-aria-speech]')?.getAttribute('data-aria-outline-ready') === 'true');
              const footerBubble = await page.evaluate(() => {
                const speech = document.querySelector('[data-aria-speech]');
                const bubble = speech.getBoundingClientRect();
                const head = document.querySelector('[data-aria-dock] img[alt^="Aria"]').getBoundingClientRect();
                const dock = document.querySelector('[data-aria-dock]').getBoundingClientRect();
                const tipX = Number(speech.querySelector('svg[data-aria-tail]')?.dataset.tipX);
                return {
                  headGap: bubble.left - head.right,
                  dockGap: dock.top - bubble.bottom,
                  width: bubble.width,
                  right: bubble.right,
                  viewport: window.innerWidth,
                  tipX,
                };
              });
              if ((footerBubble.headGap < 2 || footerBubble.headGap > 5) || footerBubble.dockGap < 8 ||
                  footerBubble.width < 455 || footerBubble.right > footerBubble.viewport - 8 ||
                  footerBubble.tipX >= -8)
                throw new Error('Paid desktop footer speech overlaps head or dock: '+JSON.stringify(footerBubble));
              // Tablet formerly inherited only sm:pl-112px while its portrait
              // was centered in a much narrower dock. Guard this breakpoint.
              await page.setViewportSize({width:768, height:900});
              await page.evaluate(() => window.scrollTo(0,0));
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'intro', null, {timeout:6000});
              const tabletSpeech = await page.evaluate(() => {
                const bubble = document.querySelector('[data-aria-speech]').getBoundingClientRect();
                const head = document.querySelector('[data-aria-dock] img[alt^="Aria"]').getBoundingClientRect();
                const dock = document.querySelector('[data-aria-dock]').getBoundingClientRect();
                return {headGap: bubble.left-head.right, dockGap: dock.top-bubble.bottom,
                  left:bubble.left, right:bubble.right,viewport:window.innerWidth};
              });
              if ((tabletSpeech.headGap < 2 || tabletSpeech.headGap > 5) || tabletSpeech.dockGap < 8 ||
                  tabletSpeech.left < 0 || tabletSpeech.right > tabletSpeech.viewport)
                throw new Error('Paid tablet speech overlaps Aria head or dock: '+JSON.stringify(tabletSpeech));
            } else if (url.pathname === '/test-aria/') {
              // On the preview the dock is navigation, not three stacked
              // overlays. Each item must scroll to its real site section.
              for (const [name, id] of [
                ['Cenník škôlky', 'lead-pricing'],
                ['Podmienky prijatia', 'lead-requirements'],
                ['O nás', 'aria-about'],
                ['Mám záujem o škôlku', 'aria-first-visit-form'],
              ]) {
                await ariaDesktop.getByRole('button', { name, exact: true }).click();
                await page.waitForFunction((targetId) => {
                  const target = document.getElementById(targetId);
                  if (!target) return false;
                  const top = target.getBoundingClientRect().top;
                  return top > 62 && top < 112;
                }, id, { timeout: 9000 });
                if (await ariaDesktop.locator('[data-aria-panel="pricing"], [data-aria-panel="requirements"], [data-aria-panel="faq"]').count())
                  throw new Error('Preview dock ' + name + ' must scroll to ' + id + ', not open an overlay');
              }
              await ariaDesktop.getByRole('button', { name: 'Otvoriť menu' }).click();
              await ariaDesktop.locator('[data-aria-panel="menu"]').waitFor({ state: 'visible' });
              if (!await ariaDesktop.locator('[data-aria-menu-logo]').isVisible())
                throw new Error('Preview hamburger still needs the brand wordmark');
              await ariaDesktop.getByRole('button', { name: 'Zavrieť panel Arie' }).click();
            } else for (const [name, panel] of [['Otvoriť menu', 'menu'], ['Cenník škôlky', 'pricing'], ['Podmienky prijatia', 'requirements']]) {
              await ariaDesktop.getByRole('button', { name }).click();
              await ariaDesktop.locator('[data-aria-panel="' + panel + '"]').waitFor({ state: 'visible' });
              const afterOpen = await page.locator('[data-aria-service-badge]').evaluate(el => el.getBoundingClientRect().left);
              if (Math.abs(beforeOpen - afterOpen) > 1)
                throw new Error('Aria ' + panel + ' shifted the desktop document by ' + (afterOpen - beforeOpen) + 'px');
              if (panel === 'menu') {
                const wordmark = ariaDesktop.locator('[data-aria-menu-logo]');
                if (!await wordmark.isVisible())
                  throw new Error('Lead menu missing Chvostikovo wordmark');
              }
              await ariaDesktop.getByRole('button', { name: 'Zavrieť panel Arie' }).click();
              if (await page.evaluate(() => document.documentElement.style.overflow === 'hidden'))
                throw new Error('Aria panel did not restore page scrolling');
            }
            await page.evaluate(() => window.scrollTo(0, 0));
            if (url.pathname === '/test-aria/')
              await page.waitForTimeout(1650); // Let short-lived consent-saved notice clear before visual snapshots.
            for (const width of [320, 375, 390, 430]) {
              // Stop the previous smooth scroll without navigating: this fixture
              // explicitly clears localStorage on every fresh navigation to
              // test first-visit consent, so reload would reopen the cookie modal.
              await page.setViewportSize({ width, height: 844 });
              await page.evaluate(() => {
                document.documentElement.style.scrollBehavior = 'auto';
                document.body.style.scrollBehavior = 'auto';
                window.scrollTo(0, 0);
              });
              await page.waitForTimeout(160);
              await page.evaluate(() => window.scrollTo(0, 0));
              const aria = page.locator('[data-aria-guide]');
              await aria.waitFor({ state: 'visible' });
              // Calm first fold: form remains below the opening viewport, while
              // the fixed Aria dock has only a modest 90–160px post-review gap.
              // Google proof must remain a single row at 320–430px.
              const firstFold = await page.evaluate(() => {
                const form = document.getElementById('aria-hero-form');
                const reviews = document.getElementById('recenzie');
                const proof = reviews?.querySelector('[data-aria-review-proof]');
                const hero = document.querySelector('section.hero-safe-top');
                const content = hero?.querySelector('[data-aria-hero-content]');
                const topSpacer = hero?.querySelector('[data-aria-intro-top-space]');
                const headline = hero?.querySelector('h1');
                const serviceBadge = hero?.querySelector('[data-aria-service-badge]');
                const heroDogs = hero?.querySelector('[data-aria-hero-dogs] img');
                const crown = hero?.querySelector('[data-aria-hero-dogs] [aria-hidden="true"]');
                const serviceGroup = hero?.querySelector('[data-aria-service-group]');
                const description = hero?.querySelector('[data-aria-hero-description]');
                const spacer = window.location.pathname === '/psia-skolka-kosice/'
                  ? document.querySelector('[data-aria-lead-photos]')
                  : hero?.querySelector('[data-aria-intro-space]');
                const caretakers = document.getElementById('aria-caretakers');
                const caretakerHeading = caretakers?.querySelector('h2');
                const relocatedBenefits = caretakers?.querySelector('[data-hero-benefits]');
                const caretakersPhoto = caretakers?.querySelector('img');
                const firstVisitDogs = document.querySelector('#aria-first-visit-form [data-aria-first-visit-dogs] img');
                if (!form || !reviews || !proof || !hero || !content || !topSpacer ||
                    !headline || !serviceBadge || !heroDogs || !crown || !serviceGroup ||
                    !description || !spacer || !caretakerHeading || !relocatedBenefits ||
                    !caretakersPhoto || !firstVisitDogs) return { missing: true };
                const rect = proof.getBoundingClientRect();
                const badgeRect = serviceBadge.getBoundingClientRect();
                const crownRect = crown.getBoundingClientRect();
                const descriptionRect = description.getBoundingClientRect();
                const reviewsRect = reviews.getBoundingClientRect();
                const reviewCard = reviews.querySelector('figure');
                const reviewCardRect = reviewCard?.getBoundingClientRect();
                const headlineRect = headline.getBoundingClientRect();
                const caretakerHeadingRect = caretakerHeading.getBoundingClientRect();
                const caretakerHeadingLine = parseFloat(getComputedStyle(caretakerHeading).lineHeight);
                const contentTop = content.getBoundingClientRect().top;
                const reviewsBottom = reviews.getBoundingClientRect().bottom;
                const formTop = form.getBoundingClientRect().top;
                const formContentTop = form.querySelector('[data-lead-step-form]')?.getBoundingClientRect().top;
                const reviewBottom = reviews.getBoundingClientRect().bottom;
                const paidCarousel = window.location.pathname === '/psia-skolka-kosice/';
                const newPhotos = paidCarousel
                  ? document.querySelector('#lead-photo-carousel [data-gesture-track="photos"]')
                  : hero.querySelector('[data-aria-review-gap-photos]');
                const photoCards = paidCarousel
                  ? [...(newPhotos?.querySelectorAll(':scope > div:first-child button') ?? [])].slice(0, 2)
                  : [...(newPhotos?.querySelectorAll('[data-aria-review-photo]') ?? [])];
                const photoImages = paidCarousel
                  ? [...(newPhotos?.querySelectorAll(':scope > div:first-child [data-aria-lead-highlight] img') ?? [])]
                  : photoCards.map(card => card.querySelector('img'));
                const photoRects = photoCards.map(card => card.getBoundingClientRect());
                const photoFrame = newPhotos?.getBoundingClientRect();
                const floatingGuide = document.querySelector('[data-aria-guide]');
                const floatingDock = floatingGuide?.querySelector('[data-aria-dock]');
                const floatingBubble = floatingGuide?.querySelector('[data-aria-speech]');
                const reviewTrack = reviews.querySelector('[data-gesture-track="reviews"]');
                const lineHeight = parseFloat(getComputedStyle(proof).lineHeight);
                return {
                  missing: false,
                  formTop,
                  formContentTop,
                  reviewGap: formTop - reviewBottom,
                  photoCount: photoCards.length,
                  floatingDockFixed: !!floatingGuide && getComputedStyle(floatingGuide).position === 'fixed' && !hero.contains(floatingGuide),
                  floatingDockBottomOffset: floatingGuide ? window.innerHeight - floatingGuide.getBoundingClientRect().bottom : -1,
                  floatingReviewGap: floatingBubble && reviewCardRect ? floatingBubble.getBoundingClientRect().top - reviewCardRect.bottom : -1,
                  heroTopGap: headlineRect.top,
                  heroBalancedGaps: window.location.pathname !== '/psia-skolka-kosice/' ||
                    window.innerWidth < 375 || window.innerWidth > 430 ||
                    (!!floatingBubble && !!reviewCardRect &&
                      headlineRect.top >= 40 &&
                      floatingBubble.getBoundingClientRect().top - reviewCardRect.bottom >= 35 &&
                      Math.abs(headlineRect.top -
                        (floatingBubble.getBoundingClientRect().top - reviewCardRect.bottom)) <=
                        Math.max(56, window.innerHeight * 0.08)),
                  softenedShadowRoom: reviewTrack && reviewCardRect ? reviewTrack.getBoundingClientRect().bottom - reviewCardRect.bottom : -1,
                   raisedReview: window.location.pathname !== '/psia-skolka-kosice/' ||
                     (!!reviewCard && getComputedStyle(reviewCard).borderTopWidth === '1px' &&
                      getComputedStyle(reviewCard).boxShadow.includes('rgba(') &&
                      parseFloat(getComputedStyle(reviewTrack).paddingTop) >= 9),
                  reviewLinkSize: parseFloat(getComputedStyle(reviewTrack?.querySelector('figure button') || reviews).fontSize),
                  photoApprovedAssets: photoImages.length === 2 &&
                    !!photoImages[0]?.getAttribute('src')?.includes('lead-review-border-collies') &&
                    !!photoImages[1]?.getAttribute('src')?.includes('lead-review-retrievers-aussie') &&
                    photoImages.every(img => !!img?.getAttribute('alt')?.trim()) &&
                    photoImages[0]?.getAttribute('src') !== photoImages[1]?.getAttribute('src'),
                  paidPhotosBelowFloatingDock: window.location.pathname !== '/psia-skolka-kosice/' ||
                    (!!photoFrame && !!floatingGuide && formTop >= reviewsBottom + 12 &&
                     formTop >= window.innerHeight - 24 &&
                     formTop - reviewsBottom <= window.innerHeight * 0.44 &&
                     Number.isFinite(formContentTop) &&
                     formContentTop >= floatingGuide.getBoundingClientRect().bottom + 8 &&
                     // The form/gallery swap preserves natural document flow.
                     Math.abs(hero.getBoundingClientRect().bottom - formTop) <= 2 &&
                     Math.abs(form.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top) <= 2 &&
                     !hero.contains(newPhotos) && photoRects.every(rect => rect.top >= form.getBoundingClientRect().bottom - 2)),
                  heroCopyBlack: window.location.pathname === '/psia-skolka-kosice/'
                    ? (getComputedStyle(description).color === 'rgb(255, 255, 255)' &&
                       getComputedStyle(description.querySelector('strong')).color === 'rgb(255, 255, 255)')
                    : (getComputedStyle(description).color === 'rgb(23, 28, 24)' &&
                       getComputedStyle(description.querySelector('strong')).color === 'rgb(17, 17, 17)'),
                  mobileDescriptionMetrics: (() => {
                    const style = getComputedStyle(description);
                    const lineHeight = parseFloat(style.lineHeight);
                    const innerHeight = descriptionRect.height - parseFloat(style.paddingTop) -
                      parseFloat(style.paddingBottom) - parseFloat(style.borderTopWidth) -
                      parseFloat(style.borderBottomWidth);
                    return { fontSize: parseFloat(style.fontSize), lineCount: Math.round(innerHeight / lineHeight) };
                  })(),
                  paidDescriptionWhite: window.location.pathname !== '/psia-skolka-kosice/' ||
                    (getComputedStyle(description).color === 'rgb(255, 255, 255)' &&
                     getComputedStyle(description.querySelector('strong')).color === 'rgb(255, 255, 255)' &&
                     getComputedStyle(description).backgroundColor === 'rgb(255, 164, 20)'),
                  photoGeometry: photoRects.length === 2 && !!photoFrame &&
                    photoRects.every((rect, i) => rect.width > 80 && rect.height >= 110 &&
                      rect.left >= -1 && rect.right <= window.innerWidth + 1 &&
                      rect.top >= (paidCarousel ? form.getBoundingClientRect().bottom - 2 : reviewBottom - 2) &&
                      rect.bottom <= (paidCarousel ? caretakers.getBoundingClientRect().top + 2 : formTop + 2)) &&
                    Math.abs(photoRects[0].top - photoRects[1].top) <= (window.location.pathname === '/psia-skolka-kosice/' ? 32 : 2) &&
                    photoRects[0].right <= photoRects[1].left &&
                    photoFrame.width <= window.innerWidth + 2,
                  contentCenterY: (contentTop + reviewsBottom) / 2,
                  topSpacerHeight: topSpacer.getBoundingClientRect().height,
                  viewportHeight: window.innerHeight,
                  serviceBadgeBelowH1: badgeRect.top >= headlineRect.bottom + 55,
                  dogsRestOnOrange: serviceGroup.contains(crown) && Math.abs(crownRect.bottom - badgeRect.top) <= 2,
                  serviceBadgeFits: badgeRect.left >= -1 && badgeRect.right <= window.innerWidth + 1 &&
                    serviceBadge.scrollWidth <= serviceBadge.clientWidth + 2,
                  descriptionGap: descriptionRect.top - badgeRect.bottom,
                  reviewGapAbove: reviewsRect.top - descriptionRect.bottom,
                  focusedDescription: descriptionRect.width <=
                    (window.location.pathname === '/psia-skolka-kosice/'
                      ? Math.min(window.innerWidth - 30, 402)
                      : (window.innerWidth < 390 ? 322 : window.innerWidth < 640 ? 362 : 542)) &&
                    description.querySelectorAll('strong').length === 4 &&
                    [...description.querySelectorAll('strong')].every(node => getComputedStyle(node).fontWeight >= 700),
                  liquidFullDescription: (window.location.pathname === '/psia-skolka-kosice/'
                     ? getComputedStyle(description).backgroundImage === 'none'
                     : getComputedStyle(description).backgroundImage.includes('radial-gradient')) &&
                    parseFloat(getComputedStyle(description).borderTopLeftRadius) >= 15 &&
                    parseFloat(getComputedStyle(description).paddingLeft) >= 10,
                  naturalReviewBottom: getComputedStyle(reviews).overflowY !== 'hidden' &&
                    !!reviewCardRect && reviewsRect.bottom - reviewCardRect.bottom >= (window.location.pathname === '/psia-skolka-kosice/' ? 0 : 32),
                  noBenefitsInHero: hero.querySelectorAll('[data-hero-benefits]').length === 0,
                  relocatedBenefitsCount: relocatedBenefits.children.length,
                  caretakersHeadingFits: caretakerHeading.scrollWidth <= caretakerHeading.clientWidth + 2 &&
                    caretakerHeadingRect.height <= caretakerHeadingLine * 2.55,
                  whiteInfoBackground: getComputedStyle(form).backgroundColor === 'rgb(255, 255, 255)' &&
                    !!form.querySelector('.pointer-events-none.absolute.inset-0'),
                  groundedFirstVisit: !!document.querySelector('#aria-first-visit-form [data-crown-ground]'),
                  bothDogCrowns: heroDogs.getAttribute('src') === firstVisitDogs.getAttribute('src'),
                  proofLeft: rect.left,
                  proofRight: rect.right,
                  proofHeight: rect.height,
                  lineHeight,
                  textOverflows: proof.scrollWidth > proof.clientWidth + 2,
                };
              });
              if (firstFold.missing ||
                  // After LEAD form/gallery swap only the section shell may peek
                  // at the fold; actual form fields must stay clear of the dock.
                  (url.pathname === '/psia-skolka-kosice/'
                    ? !Number.isFinite(firstFold.formContentTop) || firstFold.formContentTop < firstFold.viewportHeight - 2
                    : firstFold.formTop < firstFold.viewportHeight - 2) ||
                  (url.pathname === '/test-aria/' && firstFold.topSpacerHeight < 0) ||
                  (url.pathname === '/test-aria/' && firstFold.contentCenterY < firstFold.viewportHeight * 0.36) ||
                  (url.pathname === '/test-aria/' && (firstFold.reviewGap < 90 || firstFold.reviewGap > 240)) ||
                  (url.pathname === '/psia-skolka-kosice/' && (!firstFold.floatingDockFixed ||
                     (width <= 430 && (firstFold.floatingDockBottomOffset < 12 || firstFold.floatingDockBottomOffset > 54)) ||
                     (width >= 390 && width <= 430 && firstFold.floatingReviewGap < 8) ||
                     !firstFold.paidPhotosBelowFloatingDock || !firstFold.paidDescriptionWhite ||
                     !firstFold.heroBalancedGaps || !firstFold.raisedReview ||
                     (width <= 430 && (firstFold.softenedShadowRoom < 28 || firstFold.reviewLinkSize > 13)))) ||
                  firstFold.photoCount !== 2 || !firstFold.photoApprovedAssets || (url.pathname === '/test-aria/' && !firstFold.photoGeometry) ||
                  !firstFold.serviceBadgeBelowH1 || !firstFold.dogsRestOnOrange ||
                  !firstFold.serviceBadgeFits ||
                  firstFold.descriptionGap > 35 || firstFold.descriptionGap < 5 ||
                  firstFold.reviewGapAbove > (url.pathname === '/psia-skolka-kosice/' ? 40 : 35) ||
                  !firstFold.heroCopyBlack || !firstFold.focusedDescription || !firstFold.liquidFullDescription ||
                  (url.pathname === '/psia-skolka-kosice/' &&
                   (firstFold.mobileDescriptionMetrics.fontSize < 15 ||
                    (width >= 390 && firstFold.mobileDescriptionMetrics.lineCount > 3) ||
                    firstFold.mobileDescriptionMetrics.lineCount > 5)) ||
                  !firstFold.naturalReviewBottom ||
                  !firstFold.noBenefitsInHero || firstFold.relocatedBenefitsCount !== 3 ||
                  !firstFold.caretakersHeadingFits || !firstFold.whiteInfoBackground ||
                  !firstFold.groundedFirstVisit || !firstFold.bothDogCrowns ||
                  firstFold.proofLeft < -1 || firstFold.proofRight > width + 1 ||
                  firstFold.textOverflows || firstFold.proofHeight > firstFold.lineHeight * 1.55)
                throw new Error('Aria first fold form or Google proof layout regressed at ' + width + ': ' + JSON.stringify(firstFold));

              // The puppy message starts at caretakers, never over the review gap
              // or the first contact form. Check both the live lead and preview.
              const leadInfoForm = page.locator('#aria-hero-form');
              await leadInfoForm.scrollIntoViewIfNeeded();
              await page.waitForFunction(() => document.getElementById('aria-hero-form')?.getBoundingClientRect().top < window.innerHeight);
              if (url.pathname === '/psia-skolka-kosice/') {
                const dockOffsetAfterScroll = await aria.evaluate(el => window.innerHeight - el.getBoundingClientRect().bottom);
                if (Math.abs(dockOffsetAfterScroll - firstFold.floatingDockBottomOffset) > 4)
                  throw new Error('Paid lead Aria dock must remain floating at the same viewport offset while scrolling: ' + dockOffsetAfterScroll);
              }
              if (await page.locator('[data-aria-guide]').getAttribute('data-aria-stage') !== 'intro')
                throw new Error('Aria puppy speech appeared before caretakers at ' + width);
              const caretakersTop = await page.evaluate(() => {
                const el = document.getElementById('aria-caretakers');
                return el ? window.scrollY + el.getBoundingClientRect().top : -1;
              });
              if (caretakersTop < 0) throw new Error('Aria caretaker section missing');
              const caretakerViewportHeight = await page.evaluate(() => window.innerHeight);
              // The caretaker section may first peek at the bottom; Aria
              // must remain in the intro until the heading is central.
              await page.evaluate((y) => window.scrollTo(0, y), caretakersTop - Math.round(caretakerViewportHeight * 0.68));
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'intro',
                null, {timeout: 2500});
              await page.evaluate((y) => window.scrollTo(0, y), caretakersTop - Math.round(caretakerViewportHeight * 0.44));
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'puppy',
                null, {timeout: 2500});
              if (!await page.locator('[data-aria-message]').getByText(/Máte šteniatko/).count())
                throw new Error('Aria must offer puppy suitability only at caretakers');
              await page.evaluate(() => window.scrollTo(0, 0));
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'intro',
                null, {timeout: 2500});
              await page.locator('[data-aria-guide][data-intro="true"]').waitFor({ state: 'visible' });
              if (!await aria.locator('[data-aria-message]').getByText(/Ahoj, volám sa Aria\./).count())
                throw new Error('Aria single-line greeting missing at ' + width);
              const welcome = await aria.locator('[data-aria-message] p').evaluate(el => ({
                fontSize: parseFloat(getComputedStyle(el).fontSize),
                overflows: el.scrollWidth > el.clientWidth + 2,
              }));
              if (welcome.fontSize < 10.5 || welcome.overflows)
                throw new Error('Aria greeting must remain readable without clipping at ' + width);
              const guidance = url.pathname === '/test-aria/'
                ? 'Klikni a zisti viac'
                : 'Zisti viac z našej ponuky nižšie.';
              if (!await aria.getByText(guidance).count())
                throw new Error('Aria introduction must show the offer guidance at ' + width);
              if (url.pathname === '/test-aria/' &&
                  await aria.locator('[data-aria-message]').getAttribute('data-aria-suppressed') !== 'false')
                throw new Error('Aria intro must actually be visible, not merely present in the DOM, at ' + width);
              const comicBubble = aria.locator('[data-aria-speech]');
              if (await comicBubble.getAttribute('data-aria-outline-ready') !== 'true')
                throw new Error('Aria speech must switch from SSR fallback to measured SVG after hydration');
              const portrait = aria.locator('[data-aria-dock] img[alt^="Aria"]');
              const tail = comicBubble.locator('svg[data-aria-tail]');
              const pathElement = tail.locator('path');
              // Changing stage after scroll recreates the bubble. Give
              // ResizeObserver the next layout frame to measure it, rather
              // than asserting on the transient SSR fallback.
              await pathElement.waitFor({ state: 'attached', timeout: 6000 });
              const [speechBox, headBox, paths] = await Promise.all([
                comicBubble.boundingBox(), portrait.boundingBox(), comicBubble.locator('svg[data-aria-tail] > path').count(),
              ]);
              if (!speechBox || !headBox || paths !== 1)
                throw new Error('Aria must render one outlined SVG path for speech and tail at ' + width +
                  ': ' + JSON.stringify({ speechBox, headBox, paths }));
              if (await pathElement.getAttribute('fill') !== 'var(--card)')
                throw new Error('Speech and tail must use the original card fill');
              const speechStyle = await comicBubble.evaluate(el => ({
                height: el.getBoundingClientRect().height,
                shadow: getComputedStyle(el).boxShadow,
              }));
              if (speechStyle.height < 39 || speechStyle.height > (width >= 1024 && url.pathname === '/psia-skolka-kosice/' ? 165 : 110) || speechStyle.shadow !== 'none')
                throw new Error('Speech must stay compact without stacked box shadows at ' + width);
              const tip = await tail.evaluate(el => ({
                x: Number(el.dataset.tipX), y: Number(el.dataset.tipY),
              }));
              const tipOnHead = speechBox.x + tip.x > headBox.x + 4 &&
                speechBox.x + tip.x < headBox.x + headBox.width - 4 &&
                speechBox.y + tip.y > headBox.y + 4 &&
                speechBox.y + tip.y < headBox.y + headBox.height - 4;
              if (!tipOnHead) throw new Error('One-piece speech tail must terminate at Aria portrait at ' + width);
              if (url.pathname === '/psia-skolka-kosice/') {
                const contour = await tail.evaluate(svg => {
                  const { width: w, height: h } = svg.viewBox.baseVal;
                  const d = svg.querySelector('path')?.getAttribute('d') || '';
                  return {
                    top: Number(svg.dataset.tailBaseTop),
                    bottom: Number(svg.dataset.tailBaseBottom),
                    roundedBottomRight: d.includes('L ' + (w - 1) + ' ' + (h - 16) +
                      ' Q ' + (w - 1) + ' ' + (h - 1) + ' ' + (w - 16) + ' ' + (h - 1)),
                    roundedBottomLeft: d.includes('L 16 ' + (h - 1) +
                      ' Q 1 ' + (h - 1) + ' 1 ' + (h - 16)),
                    height: h,
                  };
                });
                const dockSize = await aria.locator('[data-aria-dock]').boundingBox();
                if ((width >= 1024 && (dockSize.width < 550 || dockSize.height < 64)) ||
                    (width < 640 && Math.abs(dockSize.height - 58) > 1))
                  throw new Error('Paid dock must grow only on desktop: ' + JSON.stringify({width, dockSize}));
                const textMetrics = await comicBubble.evaluate(el => ({
                  fontSize: parseFloat(getComputedStyle(el.querySelector('p')).fontSize),
                  maxWidth: parseFloat(getComputedStyle(el).maxWidth),
                }));
                if (!contour.roundedBottomRight || !contour.roundedBottomLeft ||
                    contour.top < 16 || contour.bottom <= contour.top ||
                    contour.bottom > contour.height - 16 ||
                    // A pointer landing on the head never guarantees the
                    // rectangular speech body is outside the head image.
                    speechBox.x < headBox.x + headBox.width + 2 ||
                    speechBox.x > headBox.x + headBox.width + 5 ||
                    tip.x < -25 || contour.bottom - contour.top > 20 ||
                    speechBox.x < -1 || speechBox.x + speechBox.width > width + 2 ||
                    tip.x >= -8 ||
                    (width >= 1024 && (textMetrics.fontSize < 16 || textMetrics.maxWidth < 450)) ||
                    await aria.locator('[data-aria-chat-trigger], [data-aria-chat]').count())
                  throw new Error('Paid Aria must have a readable left-side head and intact right bubble: ' +
                    JSON.stringify({ width, contour, speechBox, headBox, textMetrics }));
              }

              if (url.pathname === '/test-aria/') {
                // APP-01: the right-side bubble must taper gently toward Aria.
                // Never substitute a triangle cut out of the bottom border.
                const contour = await tail.evaluate(svg => {
                  const { width: w, height: h } = svg.viewBox.baseVal;
                  const d = svg.querySelector('path')?.getAttribute('d') || '';
                  return {
                    top: Number(svg.dataset.tailBaseTop),
                    bottom: Number(svg.dataset.tailBaseBottom),
                    hasRoundedBottomRight: d.includes(
                      'L ' + (w - 1) + ' ' + (h - 16) +
                      ' Q ' + (w - 1) + ' ' + (h - 1) +
                      ' ' + (w - 16) + ' ' + (h - 1)),
                    height: h,
                  };
                });
                if (!contour.hasRoundedBottomRight || contour.top < 16 ||
                    contour.bottom <= contour.top || contour.bottom > contour.height - 16)
                  throw new Error('Test Aria tail must widen into the side while preserving the rounded bottom of the bubble at ' + width + ': ' + JSON.stringify(contour));
                const stableTail = await tail.evaluate(svg => {
                  const box = svg.viewBox.baseVal;
                  return { x: Number(svg.dataset.tipX), y: Number(svg.dataset.tipY),
                    top: Number(svg.dataset.tailBaseTop), bottom: Number(svg.dataset.tailBaseBottom),
                    width: box.width };
                });
                if (Math.abs(stableTail.x - (stableTail.width + 24)) > 1 ||
                    stableTail.y <= stableTail.top || stableTail.y >= stableTail.bottom ||
                    stableTail.bottom - stableTail.top < 15)
                  throw new Error('Preview tail geometry must have a stable outward tip and non-inverted neck: ' + JSON.stringify(stableTail));
                if (await aria.evaluate(el => getComputedStyle(el).position) !== 'fixed')
                  throw new Error('Test Aria menu must remain floating and fixed at ' + width);
                const trigger = aria.locator('[data-aria-chat-trigger]');
                if (!await trigger.isVisible()) throw new Error('Preview must make the Aria portrait a real chat control');
                const triggerBox = await trigger.boundingBox();
                const dockBox = await aria.locator('[data-aria-dock]').boundingBox();
                if (!triggerBox || !dockBox || triggerBox.y + triggerBox.height > dockBox.y - 4 ||
                    triggerBox.x + triggerBox.width > width + 4 ||
                    Math.abs((dockBox.x + dockBox.width / 2) - width / 2) > 12)
                  throw new Error('Aria portrait must float above the centered dock at ' + width);
                if (await trigger.evaluate(el => {
                  const style = getComputedStyle(el);
                  return style.webkitTapHighlightColor !== 'rgba(0, 0, 0, 0)' ||
                    style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                    style.webkitAppearance !== 'none';
                }))
                  throw new Error('Preview portrait must suppress the colored tap and click zone');
                if (width === 390) {
                  const chatCta = page.locator('[data-aria-bubble-chat-cta]');
                  if (!await chatCta.isVisible() ||
                      !await chatCta.getByText('Klikni a zisti viac').count())
                    throw new Error('Bubble must show generic discover-more CTA');
                  const bubbleGeometry = await page.locator('[data-aria-speech]').boundingBox();
                  const ctaGeometry = await chatCta.boundingBox();
                  if (!bubbleGeometry || !ctaGeometry || ctaGeometry.height < 43 ||
                      ctaGeometry.x < bubbleGeometry.x - 1 ||
                      ctaGeometry.x + ctaGeometry.width > bubbleGeometry.x + bubbleGeometry.width + 1)
                    throw new Error('Discover-more CTA must fit the bubble with a 44px touch target');
                  await chatCta.click();
                  const chat = page.locator('[data-aria-chat]');
                  await chat.waitFor({ state: 'visible' });
                  const chatWindow = await chat.boundingBox();
                  if (!chatWindow || chatWindow.x < -1 || chatWindow.x + chatWindow.width > width + 1)
                    throw new Error('Chat must fit mobile viewport');
                  const questionMenu = chat.locator('[data-aria-chat-questions]');
                  await questionMenu.waitFor({ state: 'visible', timeout: 10000 });
                  if (await questionMenu.locator('[data-aria-chat-question]').count() !== 7 ||
                      await questionMenu.locator('[data-aria-chat-other-cta]').count() !== 1 ||
                      await chat.locator('[data-aria-chat-turn="person"]').count())
                    throw new Error('Discover-more must show seven FAQs and Other without preselection');
                  // APP-01: FAQ is a fixed lower panel, never part of scrolling turns.
                  const composer = chat.locator('[data-aria-chat-composer]');
                  const disabledEntry = composer.locator('input');
                  if (await questionMenu.evaluate(el => !!el.closest('[data-aria-chat-history]')) ||
                      !await disabledEntry.isDisabled() ||
                      !await composer.locator('svg[viewBox="0 0 33 36"]').count())
                    throw new Error('Chat must pin FAQ above a pink-paw, read-only message composer');
                  const [questionsBox, composerBox, historyBox] = await Promise.all([
                    questionMenu.boundingBox(), composer.boundingBox(),
                    chat.locator('[data-aria-chat-history]').boundingBox(),
                  ]);
                  if (!questionsBox || !composerBox || !historyBox ||
                      questionsBox.y + questionsBox.height > composerBox.y + 3 ||
                      historyBox.y + historyBox.height > questionsBox.y + 3)
                    throw new Error('FAQ must stay below conversation and above the fake composer');
                  const puppyRow = questionMenu.locator('[data-aria-chat-last-row]');
                  const [puppyBox, otherBox] = await Promise.all([
                    puppyRow.locator('[data-aria-chat-question="puppy"]').boundingBox(),
                    puppyRow.locator('[data-aria-chat-other-cta]').boundingBox(),
                  ]);
                  if (!puppyBox || !otherBox || Math.abs(puppyBox.y - otherBox.y) > 5 ||
                      Math.abs(puppyBox.height - otherBox.height) > 5 ||
                      otherBox.x <= puppyBox.x)
                    throw new Error('Pink puppy and Other must share the final two-column FAQ row');
                  const pink = await questionMenu.locator('[data-aria-chat-question="puppy"]').evaluate(el => getComputedStyle(el).backgroundColor);
                  if (pink === 'rgb(255, 255, 255)' || pink === 'rgba(0, 0, 0, 0)')
                    throw new Error('Puppy FAQ must be highlighted pink');
                  await questionMenu.locator('[data-aria-chat-question="pricing"]').click();
                  const pricingPrompt = chat.locator('[data-aria-chat-turn="person"]');
                  await pricingPrompt.waitFor({ state: 'visible', timeout: 10000 });
                  if (!await pricingPrompt.getByText('Aký je cenník škôlky?').count())
                    throw new Error('Price answer must only open when FAQ selected');
                  const typing = chat.locator('[data-aria-chat-turn="aria"] [data-aria-typing="true"]');
                  await typing.waitFor({ state: 'visible', timeout: 10000 });
                  const initialTyped = await typing.evaluate(el => ({
                    rendered: el.querySelector('[aria-hidden="true"]')?.textContent?.length || 0,
                    full: el.querySelector('.sr-only')?.textContent?.length || 0,
                  }));
                  if (!initialTyped.full || initialTyped.rendered >= initialTyped.full)
                    throw new Error('Mobile Aria reply must visibly type instead of jumping to full text: ' + JSON.stringify(initialTyped));
                  await typing.waitFor({ state: 'hidden', timeout: 10000 });
                  if (await chat.locator('[data-aria-chat-turn="person"]').count() !== 1 ||
                      await chat.locator('[data-aria-chat-turn="aria"]').count() !== 1 ||
                      !await chat.getByText(/Jednorazový celodenný vstup stojí 25 €./).count() ||
                      !await chat.getByText(/permanentka za 200 €/).count() ||
                      !await chat.getByText(/ušetríš 50 €/).count() ||
                      !await chat.locator('[data-aria-chat-turn="aria"] strong').filter({ hasText: /vyplň nezáväzný formulár/ }).count() ||
                      !await chat.locator('[data-aria-chat-turn="person"] svg[viewBox="0 0 33 36"]').count())
                    throw new Error('Selected pricing must preserve 25 €/200 €, emphasis and pink profile paw');
                  const followup = chat.locator('[data-aria-chat-followup]');
                  await followup.waitFor({ state: 'visible' });
                  const interestCta = followup.locator('[data-aria-chat-interest-cta]');
                  const [interestBox, followupBox] = await Promise.all([interestCta.boundingBox(), followup.boundingBox()]);
                  if (!interestBox || !followupBox || interestBox.width < followupBox.width - 52)
                    throw new Error('Interest CTA after pricing must be full-width');
                  if (await chat.getByRole('button', { name: /Odpoveď mi stačí/ }).count())
                    throw new Error('Unnecessary thank-you CTA must not reappear');
                  if (await followup.locator('[data-aria-chat-question]').count() !== 6 ||
                      await followup.locator('[data-aria-chat-other-cta]').count() !== 1 ||
                      await followup.locator('[data-aria-chat-question="pricing"]').count())
                    throw new Error('Show all six unanswered topics with the Other tile in the dock after pricing');

                  await followup.locator('[data-aria-chat-question="requirements"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({ state: 'hidden', timeout: 10000 });
                  const requirementCards = chat.locator('[data-aria-chat-requirements] article');
                  await requirementCards.first().waitFor({ state: 'visible' });
                  if (await requirementCards.count() !== 4 ||
                      !await requirementCards.first().getByText('Očkovanie a prevencia').count())
                    throw new Error('Requirements must reuse four structured cards from existing modal');
                  const requirementsFit = await chat.locator('[data-aria-chat-requirements]').evaluate(el => {
                    const bubble = el.closest('[data-aria-chat-turn="aria"] > div');
                    const viewport = el.closest('[data-aria-chat-history]');
                    return !bubble || !viewport ? false :
                      bubble.getBoundingClientRect().right <= viewport.getBoundingClientRect().right + 1 &&
                      bubble.getBoundingClientRect().left >= viewport.getBoundingClientRect().left - 1;
                  });
                  if (!requirementsFit)
                    throw new Error('Four requirements cards must not overflow the mobile chat viewport');
                  if (await chat.locator('[data-aria-chat-followup] [data-aria-chat-question]').count() !== 5 ||
                      !await chat.locator('[data-aria-chat-followup] [data-aria-chat-interest-cta]').count())
                    throw new Error('After requirements show five remaining FAQs and working interest CTA');
                  const firstCardGeometry = await requirementCards.first().evaluate(el => {
                    const viewport = el.closest('[data-aria-chat-history]');
                    const card = el.getBoundingClientRect();
                    const frame = viewport?.getBoundingClientRect();
                    return frame ? { topGap: card.top - frame.top, bottomGap: frame.bottom - card.bottom,
                      cardHeight: card.height, viewportHeight: frame.height, scrollTop: viewport.scrollTop } : null;
                  });
                  if (!firstCardGeometry || firstCardGeometry.topGap < -2 ||
                      firstCardGeometry.topGap > 130 || firstCardGeometry.bottomGap < -5)
                    throw new Error('Finishing requirements must keep the first card visible: ' +
                      JSON.stringify(firstCardGeometry));
                  await chat.locator('[data-aria-chat-followup] [data-aria-chat-other-cta]').click();
                  const questionForm = chat.locator('[data-aria-chat-other]');
                  await questionForm.waitFor({ state: 'visible' });
                  if (!await questionForm.locator('textarea[name="otazka"]').count() ||
                      await questionForm.locator('a[href^="mailto:"]').count() ||
                      !await questionForm.getByLabel('E-mail *').count())
                    throw new Error('Other question must use a consented form and not a mailto link');
                  let askedPayload = null;
                  await page.route('**/functions/v1/web-form-submit', async route => {
                    if (route.request().method() === 'OPTIONS') {
                      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
                      return;
                    }
                    askedPayload = route.request().postDataJSON();
                    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true }) });
                  });
                  await questionForm.locator('input[name="meno"]').fill('Test Otázka');
                  await questionForm.locator('input[name="plemeno"]').fill('Kríženec');
                  // Contact questions are ordinary CRM leads with optional sex, not a new form type.
                  await questionForm.locator('label:has(input[name="pohlavie"][value="female"])').click();
                  await questionForm.locator('input[name="telefon"]').fill('+421901234567');
                  await questionForm.locator('input[name="email"]').fill('test@example.invalid');
                  await questionForm.locator('textarea[name="otazka"]').fill('Môj psík má špeciálne potreby?');
                  if (askedPayload) throw new Error('Question must not send before explicit consent');
                  await questionForm.locator('input[type="checkbox"]').check();
                  await questionForm.getByRole('button', { name: 'Odoslať otázku' }).click();
                  await questionForm.getByText('Ďakujeme za otázku.').waitFor({ state: 'visible' });
                  if (!askedPayload || askedPayload.interest_reason !== 'Chcem sa informovať o škôlke' ||
                      askedPayload.raw_payload?.['Otázka návštevníka'] !== 'Môj psík má špeciálne potreby?' ||
                      askedPayload.dog_breed !== 'Kríženec' || askedPayload.dog_sex !== 'female' ||
                      askedPayload.cta_source !== 'aria_preview_chat_other')
                    throw new Error('Other question must submit inside an existing consented lead payload');
                  await page.unroute('**/functions/v1/web-form-submit');
                  await chat.getByRole('button', { name: 'Späť k otázkam' }).click();
                  // APP-01: an embedded puppy checker must remain available.
                  if (await chat.locator('[data-aria-chat-questions] [data-aria-chat-question]').count() !== 5 ||
                      await chat.locator('[data-aria-chat-puppy-cta]').count() !== 0 ||
                      !await chat.locator('[data-aria-chat-questions] [data-aria-chat-question="puppy"]').isVisible())
                    throw new Error('Puppy checker must be a pink FAQ, not a duplicate CTA');
                  await chat.locator('[data-aria-chat-questions] [data-aria-chat-question="puppy"]').click();
                  const puppy = chat.locator('[data-aria-chat-puppy-check]');
                  await puppy.waitFor({ state: 'visible' });
                  if (!await puppy.getByRole('button', { name: 'Mám záujem' }).count())
                    throw new Error('Puppy answer must also offer interest CTA');
                  if (await page.getByRole('dialog', { name: 'Kontrola vhodnosti šteniatka' }).count())
                    throw new Error('Puppy checker must stay inside Aria chat, not open a nested dialog');
                  await puppy.getByRole('button', { name: /Pokračovať na očkovania/ }).click();
                  const continueToContact = puppy.getByRole('button', { name: /Pokračovať na kontakt/ });
                  if (await continueToContact.isEnabled())
                    throw new Error('Puppy checker must not accept unconfirmed vaccinations');
                  await puppy.getByRole('button', { name: 'Chcem sa informovať' }).click();
                  const needsInfo = chat.locator('[data-aria-chat-puppy-contact]');
                  await needsInfo.waitFor({ state: 'visible' });
                  if (!await needsInfo.getByText(/zatiaľ nespĺňa všetky orientačné podmienky/).count())
                    throw new Error('Unconfirmed puppy vaccines must offer individual consultation, not eligibility approval');
                  await needsInfo.getByRole('button', { name: 'Späť ku kontrole' }).click();
                  await puppy.locator('[data-aria-puppy-step="vaccines"]').waitFor({ state: 'visible' });
                  for (const group of await puppy.locator('fieldset').all()) {
                    await group.getByText('Áno', { exact: true }).click();
                  }
                  if (!await continueToContact.isEnabled())
                    throw new Error('All three confirmed vaccines must permit contact');
                  let puppyPosted = null;
                  await page.route('**/functions/v1/web-form-submit', async route => {
                    const request = route.request();
                    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
                    if (request.method() === 'OPTIONS') {
                      await route.fulfill({ status: 204, headers: cors });
                      return;
                    }
                    puppyPosted = request.postDataJSON();
                    await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ ok: true }) });
                  });
                  await continueToContact.click();
                  const puppyContact = chat.locator('[data-aria-chat-puppy-contact]');
                  await puppyContact.waitFor({ state: 'visible' });
                  if (puppyPosted !== null || !await puppyContact.locator('form').count())
                    throw new Error('Eligibility alone must not send a lead; consented contact is required');
                  await puppyContact.locator('input[name="meno"]').fill('Test Puppy Aria');
                  await puppyContact.locator('input[name="plemeno"]').fill('Labrador');
                  await puppyContact.locator('input[name="pes_meno"]').fill('Bella');
                  await puppyContact.locator('input[name="telefon"]').fill('+421901234567');
                  await puppyContact.locator('input[type="checkbox"]').check();
                  await puppyContact.getByRole('button', { name: 'Odoslať záujem' }).click();
                  await puppyContact.locator('[data-aria-chat-contact-success="true"]').waitFor({ state: 'visible' });
                  if (!puppyPosted || puppyPosted.puppy_check?.age_months !== 4 ||
                      !Object.values(puppyPosted.puppy_check?.vaccines || {}).every(value => value === 'yes') ||
                      puppyPosted.puppy_check?.dog_name !== 'Bella' ||
                      puppyPosted.puppy_check?.dog_breed !== 'Labrador' ||
                      puppyPosted.interest_reason !== 'Mám záujem o škôlku pre šteniatko')
                    throw new Error('Puppy enquiry must send the existing structured CRM payload after explicit consent');
                  await page.unroute('**/functions/v1/web-form-submit');
                  await puppyContact.getByRole('button', { name: 'Späť ku kontrole' }).click();
                  await chat.locator('[data-aria-chat-puppy-check] [data-aria-puppy-step="vaccines"]').waitFor({ state: 'visible' });
                  await chat.locator('[data-aria-chat-puppy-check]').getByRole('button', { name: 'Späť k otázkam' }).click();
                  await chat.locator('[data-aria-chat-questions] [data-aria-chat-question="location"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({ state: 'hidden', timeout: 10000 });
                  await chat.locator('[data-aria-chat-followup] [data-aria-chat-interest-cta]').click();
                  const interest = chat.locator('[data-aria-chat-interest]');
                  await interest.locator('[data-lead-step-form]').waitFor({ state: 'visible' });
                  if (await interest.locator('input[name="zaujem"]').count() !== 3 ||
                      !await interest.getByText('Krok 1 z 2').count())
                    throw new Error('Interest must reuse the two-step lead form');
                  // iOS/WebKit: the native radio is visually clipped (sr-only).
                  // Click its visible card, not the hidden input with force.
                  await interest.locator('label:has(input[name="zaujem"])').nth(1).click();
                  if (!await interest.locator('input[name="zaujem"]').nth(1).isChecked())
                    throw new Error('Visible interest card did not select the radio on ' + engine);
                  await interest.getByRole('button', { name: 'Pokračovať' }).click();
                  await interest.getByText('Krok 2 z 2').waitFor({ state: 'visible' });
                  await interest.locator('input[name="meno"]').fill('Test Aria');
                  await interest.locator('input[name="plemeno"]').fill('Írsky vlkodav');
                  await interest.locator('input[name="telefon"]').fill('+421901234567');
                  await interest.locator('input[name="email"]').fill('test@example.invalid');
                  await interest.locator('input[type="checkbox"]').check();
                  let posted = null;
                  await page.route('**/functions/v1/web-form-submit', async route => {
                    if (route.request().method() === 'OPTIONS') {
                      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
                      return;
                    }
                    posted = route.request().postDataJSON();
                    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true }) });
                  });
                  await interest.getByRole('button', { name: 'Odoslať záujem' }).click();
                  await interest.locator('[data-lead-step-success]').waitFor({ state: 'visible' });
                  if (!posted || posted.interest_reason !== 'Mám záujem využívať škôlku pravidelne' ||
                      posted.cta_source !== 'aria_preview_chat_interest')
                    throw new Error('Two-step lead form must preserve selection and attribution');
                  await page.unroute('**/functions/v1/web-form-submit');

                  await chat.getByRole('button', { name: 'Close' }).click();
                  await chat.waitFor({ state: 'hidden' });
                  if (await page.locator('html').evaluate(el => getComputedStyle(el).overflow === 'hidden'))
                    throw new Error('Chat left the page scroll locked');
                  await page.setViewportSize({ width: 1280, height: 900 });
                  await trigger.click();
                  await chat.waitFor({ state: 'visible' });
                  const desktopChat = await chat.boundingBox();
                  if (!desktopChat || desktopChat.width < 560 ||
                      Math.abs(desktopChat.x + desktopChat.width / 2 - 640) > 10)
                    throw new Error('Desktop Aria chat must be wider and centered: ' + JSON.stringify(desktopChat));
                  await chat.getByRole('button', { name: 'Close' }).click();
                  await chat.waitFor({ state: 'hidden' });
                  await page.setViewportSize({ width: 390, height: 844 });
                  // After a hard reload, the test route must hydrate and its
                  // lazy-loaded chat should open again (iOS fresh-document path).
                  await page.reload({ waitUntil: 'domcontentloaded' });
                  // Every fresh-document navigation gets a new consent fixture.
                  // Exercise a real user flow: dismiss cookie modal before
                  // clicking Aria, never force-click through an overlay.
                  const reloadedCookie = page.getByRole('button', { name: /Odmietnuť|Reject|Reject all|Len nevyhnutné|Necessary only/i }).first();
                  await reloadedCookie.waitFor({ state: 'visible', timeout: 10000 });
                  await reloadedCookie.click();
                  await page.locator('[aria-labelledby="cookie-consent-title"]').waitFor({ state: 'hidden' });
                  const freshTrigger = page.locator('[data-aria-chat-trigger]');
                  await freshTrigger.waitFor({ state: 'visible', timeout: 15000 });
                  if (await page.getByText("This page didn't load").count())
                    throw new Error('Preview displayed the root route failure after full reload');
                  await freshTrigger.click();
                  await page.locator('[data-aria-chat]').waitFor({ state: 'visible' });
                  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
                  await page.locator('[data-aria-chat]').waitFor({ state: 'hidden' });
                  // Browser-specific dialog close animations must finish before
                  // the next section scroll is tested. This is an app contract:
                  // closing chat must actually unlock the underlying page.
                  await page.waitForFunction(() => {
                    const html = getComputedStyle(document.documentElement);
                    const body = getComputedStyle(document.body);
                    return html.overflow !== 'hidden' && body.overflow !== 'hidden' && body.position !== 'fixed';
                  }, null, { timeout: 7000 });

                  // Simulate a stale/lost lazy chunk in a completely isolated
                  // browser context. Never pollute the normal page: its consent,
                  // scroll and modal state must remain intact for following tests.
                  const failureContext = await browser.newContext({
                    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
                  });
                  try {
                    await failureContext.route('**/*', route => {
                      const request = route.request();
                      if (!['GET', 'HEAD'].includes(request.method()) ||
                          new URL(request.url()).origin !== url.origin) return route.abort();
                      return route.continue();
                    });
                    await failureContext.route(/AriaGuidedChat-[^/]+\.js(?:\?.*)?$/, route => route.abort('failed'));
                    const failurePage = await failureContext.newPage();
                    await failurePage.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 40000 });
                    const failureConsent = failurePage.getByRole('button', { name: /Odmietnuť|Reject|Reject all|Len nevyhnutné|Necessary only/i }).first();
                    await failureConsent.waitFor({ state: 'visible', timeout: 10000 });
                    await failureConsent.click();
                    await failurePage.locator('[data-aria-chat-trigger]').click();
                    await failurePage.locator('[data-aria-chat-load-error]').waitFor({ state: 'visible', timeout: 12000 });
                    if (await failurePage.getByText("This page didn't load").count() ||
                        !await failurePage.locator('[data-aria-dock]').isVisible())
                      throw new Error('A failed lazy chat import must preserve the landing and dock');
                    await failurePage.getByRole('button', { name: 'Zavrieť' }).click();
                  } finally {
                    await failureContext.close();
                  }
                }
              }

              if (url.pathname === '/test-aria/') {
                await page.screenshot({ path: path.join(out, 'aria-' + engine + '-' + width + '-welcome.png') });
                const initialSpeech = await aria.locator('[data-aria-message]').evaluate(el => ({
                  visible: getComputedStyle(el).visibility === 'visible',
                  pointerEvents: getComputedStyle(el).pointerEvents,
                  suppressed: el.dataset.ariaSuppressed
                }));
                if (!initialSpeech.visible || initialSpeech.pointerEvents !== 'none' || initialSpeech.suppressed !== 'false')
                  throw new Error('Intro speech must be always visible but nonblocking at ' + width);
                await page.locator('#aria-hero-form').scrollIntoViewIfNeeded();
                await page.waitForTimeout(180);
                const overForm = await aria.locator('[data-aria-message]').evaluate(el =>
                  getComputedStyle(el).visibility === 'visible' && el.dataset.ariaSuppressed === 'false');
                if (!overForm) throw new Error('Aria speech flickers/hides over the lead form at ' + width);
                await page.screenshot({ path: path.join(out, 'aria-' + engine + '-' + width + '-form-visible.png') });
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.waitForTimeout(140);
              }
              const interestButton = aria.getByRole('button', { name: 'Mám záujem o škôlku' });
              if ((await interestButton.getAttribute('class') || '').includes('bg-coral/15'))
                throw new Error('Rejected special interest button highlight resurfaced');
              for (const choice of await aria.locator('[data-aria-dock] button:not([data-aria-chat-trigger])').all()) {
                const radius = await choice.evaluate(button => parseFloat(getComputedStyle(button).borderTopLeftRadius));
                if (!Number.isFinite(radius) || radius > 15)
                  throw new Error('Dock choices must be rounded rectangles, never circles');
              }
              const dockRadius = await aria.locator('[data-aria-dock]').evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius));
              if (dockRadius < 13 || dockRadius > 18)
                throw new Error('Dock frame and buttons need consistent rounded rectangles');
              const dock = await aria.locator('[data-aria-dock]').boundingBox();
              const portraitAboveDock = await aria.locator('[data-aria-dock] img[alt^="Aria"]').boundingBox();
              // HERO-MOBILE-01: both mobile docks keep a 10px visual gutter,
              // with Aria ABOVE the bar and no portrait clipped at 320px.
              if (!dock || !portraitAboveDock || Math.abs(dock.x - 10) > 2 ||
                  Math.abs(width - dock.x - dock.width - 10) > 2 ||
                  dock.width < width - 24 || dock.width > width - 16 ||
                  dock.height > 65 || portraitAboveDock.y + portraitAboveDock.height > dock.y - 4 ||
                  portraitAboveDock.x < -1 || portraitAboveDock.x + portraitAboveDock.width > width + 2)
                throw new Error('Aria inset mobile dock / portrait above dock regressed at ' + width + ': ' + JSON.stringify({dock, portraitAboveDock}));
              // The paid landing keeps one floating, viewport-anchored Aria dock.
              // Scrolling changes the contextual message, never its fixed
              // position or visibility (the former inline test is obsolete).
              if (url.pathname === '/psia-skolka-kosice/') {
                const stability = await page.evaluate(async () => {
                  const guide = document.querySelector('[data-aria-guide]');
                  const dock = guide?.querySelector('[data-aria-dock]');
                  const message = guide?.querySelector('[data-aria-message]');
                  if (!guide || !dock || !message) return ['missing Aria'];
                  const baseline = dock.getBoundingClientRect();
                  const baselineViewportY = baseline.y;
                  const failures = [];
                  for (const y of [150, 950, 2200, 3100, 1700, 3600, 110, 0]) {
                    window.scrollTo(0, y);
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    const box = dock.getBoundingClientRect();
                    const guideStyle = getComputedStyle(guide);
                    if (document.querySelector('[data-aria-dock]') !== dock ||
                        guideStyle.position !== 'fixed' || guideStyle.visibility !== 'visible' ||
                        guideStyle.opacity !== '1' ||
                        getComputedStyle(message).visibility !== 'visible' ||
                        message.dataset.ariaSuppressed !== 'false' ||
                        Math.abs(baselineViewportY - box.y) > 3 ||
                        Math.abs(baseline.height - box.height) > 2) {
                      failures.push({ y, stage: guide.dataset.ariaStage, dockY: box.y,
                        baselineY: baseline.y, message: getComputedStyle(message).visibility });
                    }
                  }
                  window.scrollTo(0, 0);
                  return failures;
                });
                if (stability.length) throw new Error('Paid Aria flicker/dock instability at ' + width + ': ' + JSON.stringify(stability));
                await page.screenshot({ path: path.join(out, 'lead-aria-' + engine + '-' + width + '-stable.png') });
              }
              const navFrames = await aria.locator('[data-aria-dock] button').evaluateAll(buttons =>
                buttons.every(button => getComputedStyle(button).boxShadow === 'none'));
              if (!navFrames) throw new Error('Only the overall Aria menu frame should be outlined, not each navigation item');

              if (url.pathname === '/test-aria/') {
                // Check that the speech switches to a real modal CTA only after
                // the requirements section, and that the dock does not jump.
                const requirementsEnd = await page.evaluate(() => {
                  const target = document.getElementById('lead-requirements');
                  if (!target) return -1;
                  return window.scrollY + target.getBoundingClientRect().bottom;
                });
                if (requirementsEnd < 0) throw new Error('Aria requirements boundary missing');
                await page.evaluate(y => window.scrollTo(0, y), requirementsEnd + 20);
                // Do not assume iOS/Chromium scroll + React useEffect settles
                // within 220ms after the dialog closes. Check the actual state.
                const contactReady = await page.waitForFunction(() => {
                  const dock = document.querySelector('[data-aria-guide]');
                  return dock?.getAttribute('data-aria-stage') === 'contact' &&
                    (dock.textContent || '').includes('Vyplňte nezáväzný formulár');
                }, null, { timeout: 7000 }).then(() => true).catch(() => false);
                if (!contactReady) {
                  const state = await page.evaluate(() => ({
                    stage: document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage'),
                    scrollY: window.scrollY,
                    bodyPosition: getComputedStyle(document.body).position,
                    rootOverflow: getComputedStyle(document.documentElement).overflow,
                    targetBottom: document.getElementById('lead-requirements')?.getBoundingClientRect().bottom,
                    viewportHeight: window.innerHeight,
                  }));
                  throw new Error('Contact offer should replace puppy text after requirements at ' + width + ': ' + JSON.stringify(state));
                }
                const contactDock = await aria.locator('[data-aria-dock]').boundingBox();
                if (!contactDock || Math.abs(contactDock.y - dock.y) > 3)
                  throw new Error('Aria fixed navigation jumped vertically on section change at ' + width);
                const contactCta = aria.getByRole('button', { name: 'Vyplniť', exact: true });
                for (const offset of [20, 200, 400, 650, 950, 1250, 1600]) {
                  if (await contactCta.isVisible()) break;
                  await page.evaluate(y => window.scrollTo(0, y), requirementsEnd + offset);
                  await page.waitForTimeout(140);
                }
                if (!await contactCta.isVisible())
                  throw new Error('Post-requirements modal CTA never becomes visible at ' + width);
                await page.screenshot({ path: path.join(out, 'aria-' + engine + '-' + width + '-contact.png') });
                await contactCta.click();
                if (url.pathname === '/test-aria/') {
                  await page.waitForFunction(() => {
                    const form = document.getElementById('aria-first-visit-form');
                    if (!form) return false;
                    const top = form.getBoundingClientRect().top;
                    return top >= 60 && top <= 112;
                  }, null, { timeout: 9000 });
                  if (await page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).count())
                    throw new Error('Test Aria contextual contact CTA must scroll to inline form instead of modal at ' + width);
                } else {
                  const contact = page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).last();
                  await contact.waitFor({ state: 'visible' });
                  await contact.getByRole('button', { name: 'Close' }).click();
                  await contact.waitFor({ state: 'hidden' });
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.waitForTimeout(190);
              }

              // Four widths receive screenshots and overlay checks. Run the
              // full wizard/modal journey at the original 320 and 390 widths.
              if (![320, 390].includes(width)) {
                const caretakerPromptY = await page.evaluate(() => {
                  const section = document.getElementById('aria-caretakers');
                  if (!section) return -1;
                  return window.scrollY + section.getBoundingClientRect().top - window.innerHeight * 0.44;
                });
                if (caretakerPromptY < 0) throw new Error('Caretakers section missing for Aria puppy prompt');
                await page.evaluate(y => window.scrollTo(0, y), caretakerPromptY);
                await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'puppy', null, {timeout:3000});
                if (!await page.locator('[data-aria-guide][data-intro="false"]').count() ||
                    await aria.locator('[data-aria-message]').getAttribute('data-aria-suppressed') !== 'false')
                  throw new Error('Aria puppy prompt should be visible at caretaker section at ' + width);
                if (url.pathname === '/test-aria/')
                  await page.screenshot({ path: path.join(out, 'aria-' + engine + '-' + width + '-puppy-prompt.png') });
                continue;
              }
              if (url.pathname === '/psia-skolka-kosice/') {
                const dockNav = aria.locator('[data-aria-section-navigation="true"]');
                if (await dockNav.locator('button').count() !== 5)
                  throw new Error('Paid mobile dock must contain five section shortcuts');
                for (const [label,id] of [['O nás','aria-about'],['Cenník škôlky','lead-pricing'],
                  ['Podmienky prijatia','lead-requirements'],['Mám záujem o škôlku','aria-hero-form']]) {
                  if (!await page.locator('#'+id).count()) throw new Error('Missing paid nav anchor '+id);
                  await dockNav.getByRole('button',{name:label,exact:true}).click();
                  if (await aria.locator('[data-aria-panel]').count())
                    throw new Error('Paid section shortcuts may not open floating panels');
                }
                if (await page.locator('#lead-section-menu').count() ||
                    await page.getByRole('heading',{name:'Prejsť na sekciu'}).count())
                  throw new Error('Removed section grid must not reappear on paid LEAD');
                await dockNav.getByRole('button',{name:'Otvoriť menu',exact:true}).click();
                const menu = aria.locator('[data-aria-panel="menu"]');
                if (!await menu.isVisible())
                  throw new Error('Paid mobile Menu must open existing floating menu');
                await menu.getByRole('button',{name:/Fotogaléria/}).click();
                await page.waitForFunction(() => {
                  const section = document.querySelector('#lead-photo-carousel');
                  const top = section?.getBoundingClientRect().top ?? -1;
                  return top >= 60 && top <= 112;
                }, null, {timeout:9000});
                if (await aria.locator('[data-aria-panel]').count())
                  throw new Error('Paid mobile Menu must close on gallery selection');
                await page.waitForTimeout(950);
              } else if (url.pathname === '/test-aria/') {
                const navItems = [
                  ['Cenník škôlky', 'lead-pricing'],
                  ['Podmienky prijatia', 'lead-requirements'],
                  ['O nás', 'aria-about'],
                  ['Mám záujem o škôlku', 'aria-first-visit-form'],
                ];
                for (const [name, targetId] of navItems) {
                  await aria.getByRole('button', { name, exact: true }).click();
                  await page.waitForFunction(id => {
                    const element = document.getElementById(id);
                    if (!element) return false;
                    const top = element.getBoundingClientRect().top;
                    return top >= 60 && top <= 112;
                  }, targetId, { timeout: 9000 });
                  if (await aria.locator('[data-aria-panel="pricing"], [data-aria-panel="requirements"], [data-aria-panel="faq"]').count() ||
                      await page.evaluate(() => document.documentElement.style.overflow === 'hidden'))
                    throw new Error('Preview nav must scroll to ' + targetId + ' without opening a modal or locking scroll at ' + width);
                }
                // The preview menu stays a compact navigation overlay. Its
                // "Chcem sa informovať" action now scrolls to the existing
                // inline form rather than opening another modal.
                await aria.getByRole('button', { name: 'Otvoriť menu' }).click();
                const menu = aria.locator('[data-aria-menu]');
                await menu.waitFor({ state: 'visible' });
                const puppyMenuLine = menu.getByText('Zistite, či vaše šteniatko spĺňa podmienky');
                if (!await menu.getByText('3 dôvody, prečo si vybrať nás').count() ||
                    !await puppyMenuLine.count() ||
                    await menu.getByText('Nastavenia cookies').count())
                  throw new Error('Preview menu descriptions or cookie removal regressed');
                await menu.getByRole('button', { name: /Chcem sa informovať/ }).click();
                await aria.locator('[data-aria-panel="menu"]').waitFor({ state: 'hidden' });
                await page.waitForFunction(() => {
                  const target = document.getElementById('aria-first-visit-form');
                  if (!target) return false;
                  const y = target.getBoundingClientRect().top;
                  return y >= 60 && y <= 112;
                }, null, { timeout: 9000 });
                if (await page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).count())
                  throw new Error('Preview menu enquiry must scroll to the form, not open a dialog');
              } else {
              await aria.getByRole('button', { name: 'Časté otázky' }).click();
              await aria.locator('[data-aria-panel="faq"]').waitFor({ state: 'visible' });
              const puppyQuestion = aria.getByRole('button', { name: 'Prijímate aj šteniatka?' });
              if (await puppyQuestion.getAttribute('aria-expanded') !== 'true') await puppyQuestion.click();
              await aria.getByRole('button', { name: 'Overiť vhodnosť šteniatka' }).click();
              const wizard = page.locator('[data-aria-puppy-embedded="true"]');
              await wizard.waitFor({ state: 'visible' });
              if (!await wizard.locator('[data-aria-puppy-step="age"]').count()) throw new Error('Puppy wizard age step missing');
              const ageSlider = wizard.getByRole('slider', { name: 'Vek šteniatka v mesiacoch' });
              await ageSlider.focus();
              await ageSlider.press('ArrowLeft');
              await ageSlider.press('ArrowLeft');
              if (!await wizard.getByText(/Zatiaľ nespĺňa/).count()) throw new Error('Age 1–3 must be blocked');
              await ageSlider.press('ArrowRight');
              await ageSlider.press('ArrowRight');
              await wizard.getByRole('button', { name: /Pokračovať na očkovania/ }).click();
              if (!await wizard.locator('[data-aria-puppy-step="vaccines"]').count()) throw new Error('Puppy vaccinations missing');
              for (let i = 0; i < 3; i++) await wizard.locator('fieldset').nth(i).getByText('Áno', { exact: true }).click();
              if (await wizard.getByText(/Plemeno \(voliteľné\)/).count() ||
                  await wizard.getByPlaceholder('Plemeno alebo kríženec').count())
                throw new Error('Puppy checker must collect only age and vaccines, not breed');
              await wizard.getByRole('button', { name: /Pokračovať na kontakt/ }).click();
              await page.locator('[role="dialog"] [data-lead-step-form]').last().getByText('Krok 2 z 2').waitFor({ state: 'visible' });
              // No dog/result intermediate step: the existing contact owns breed.
              const contactDialog = page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).last();
              const puppySummary = contactDialog.locator('[data-puppy-check-summary]');
              await puppySummary.waitFor({ state: 'visible' });
              const summary = await puppySummary.innerText();
              if (!summary.includes('4 mesiacov') || !/besnota:\s*áno/i.test(summary) ||
                  !/DHPPi\+L:\s*áno/i.test(summary) || !/kotercový kašeľ:\s*áno/i.test(summary))
                throw new Error('Age/vaccine answers were lost in contact: ' + summary);
              const breedInput = contactDialog.getByLabel('Plemeno psíka *');
              if (!await breedInput.isVisible() || await breedInput.inputValue() !== '')
                throw new Error('Puppy breed must be entered exactly once, at contact');
              await breedInput.fill('Írsky vlkodav');
              if (!await puppySummary.getByText(/Írsky vlkodav/).count())
                throw new Error('Contact breed must update the carried puppy summary');
              await contactDialog.getByRole('button', { name: 'Close' }).click();
              await contactDialog.waitFor({ state: 'hidden' });
              await aria.waitFor({ state: 'visible' });

              await aria.getByRole('button', { name: 'Cenník škôlky' }).click();
              const pricingPanel = aria.locator('[data-aria-panel="pricing"]');
              await pricingPanel.waitFor({ state: 'visible' });
              const cards = pricingPanel.locator('[data-aria-pricing] article');
              if (await cards.count() !== 2) throw new Error('Two Aria pricing cards required');
              if (!await pricingPanel.getByText('Permanentka – 10 vstupov').count() ||
                  !await pricingPanel.getByText('Platnosť 2 mesiace').count() ||
                  !await pricingPanel.getByText('Ušetríte 50 €').count())
                throw new Error('Preview modal pricing copy/layout incomplete');
              const cardBoxes = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()]);
              if (!cardBoxes[0] || !cardBoxes[1] || cardBoxes.some(box => box && box.height > 160))
                throw new Error('Aria pricing cards must be compact FAQ-like rows at ' + width);
              const backgroundLocked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden');
              if (!backgroundLocked) throw new Error('Expanded Aria panel must prevent background scrolling');
              const visitQuestion = pricingPanel.getByRole('button', { name: 'Ako prebieha návšteva?' });
              if (await visitQuestion.getAttribute('aria-expanded') !== 'true') await visitQuestion.click();
              await pricingPanel.locator('[data-aria-first-visit]').waitFor({ state: 'visible' });
              if (!await pricingPanel.isVisible()) throw new Error('First visit explanation must not redirect to FAQ');
              await aria.getByRole('button', { name: 'Podmienky prijatia' }).click();
              if (await aria.locator('[data-aria-requirements] article').count() !== 4)
                throw new Error('Aria must list the four conditions');
              if (!await aria.locator('[data-aria-requirements]').getByText(/Sučky počas hárania/).count() ||
                  !await aria.locator('[data-aria-requirements] strong').count())
                throw new Error('Preview-only hygiene/health wording or highlight missing');
              await aria.locator('[data-aria-requirements]').getByRole('button', { name: 'Chcem sa informovať o škôlke' }).click();
              await page.locator('[role="dialog"] [data-lead-step-form]').last().getByText('Krok 2 z 2').waitFor({ state: 'visible' });
              await page.keyboard.press('Escape');

              await aria.getByRole('button', { name: 'Otvoriť menu' }).click();
              const menu = aria.locator('[data-aria-menu]');
              const puppyMenuLine = menu.getByText('Zistite, či vaše šteniatko spĺňa podmienky');
              if (!await menu.getByText('3 dôvody, prečo si vybrať nás').count() ||
                  !await puppyMenuLine.count() ||
                  await menu.getByText('Nastavenia cookies').count())
                throw new Error('Aria menu descriptions or cookie removal missing');
              if (await puppyMenuLine.evaluate(el => el.scrollWidth > el.clientWidth + 1 || getComputedStyle(el).whiteSpace !== 'nowrap'))
                throw new Error('Puppy menu subtitle must fit on a single unclipped row at ' + width);
              await aria.getByRole('button', { name: 'Zavrieť panel Arie' }).click();

              }

              const cols = await page.locator('#lead-pricing .grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
              const pageCards = await Promise.all([page.locator('#lead-pricing article').nth(0).boundingBox(), page.locator('#lead-pricing article').nth(1).boundingBox()]);
              if (cols !== 2 || !pageCards[0] || !pageCards[1] || Math.abs(pageCards[0].height - pageCards[1].height) > 2 || Math.max(pageCards[0].height, pageCards[1].height) > 175)
                throw new Error('Preview webpage pricing must display equal height columns at ' + width);
              const valuePill = page.locator('#lead-pricing [data-lead-best-value]');
              const labelShape = await valuePill.evaluate(el => {
                const r = el.getBoundingClientRect(), card = el.closest('article')?.getBoundingClientRect();
                return { text: el.textContent.trim(), fits: el.scrollWidth <= el.clientWidth + 2,
                  row: r.height <= parseFloat(getComputedStyle(el).lineHeight) * 1.8,
                  inside: !!card && r.bottom <= card.bottom + 2 && r.top >= card.top };
              });
              if (labelShape.text !== 'Najvýhodnejšie. Ušetríte 50 €' || !labelShape.fits || !labelShape.row || !labelShape.inside)
                throw new Error('Permanentka value label must fit on one bottom line at ' + width + ': ' + JSON.stringify(labelShape));
              if (url.pathname === '/test-aria/' && !await page.getByRole('heading', { name: 'Takto vyzerá Chvostíkovo' }).count())
                throw new Error('Preview mosaic title regression');
              if (url.pathname === '/psia-skolka-kosice/') {
                // Paid LEAD has one compact free-visit note here: the factual
                // adaptation explanation now lives exactly once in 3 steps.
                const paidVisit = page.locator('#lead-pricing [data-first-visit-group]');
                if (await paidVisit.count() !== 1 ||
                    await paidVisit.locator('details').count() !== 0 ||
                    await paidVisit.getByText('Úvodná návšteva zadarmo', { exact: true }).count() !== 1)
                  throw new Error('Paid LEAD pricing must keep only free first-visit badge, no duplicated accordion');
              } else {
                const firstVisitCompact = await page.locator('#lead-pricing details').evaluate(el => {
                  const wrapper = el.parentElement;
                  if (!wrapper) return false;
                  const box = el.getBoundingClientRect();
                  const outer = wrapper.getBoundingClientRect();
                  return box.width <= outer.width + 2 &&
                    (window.innerWidth < 768 || box.width >= 480) &&
                    Math.abs((box.left + box.width / 2) - (outer.left + outer.width / 2)) <= 3;
                });
                if (!firstVisitCompact) throw new Error('Preview first-visit accordion must fit under its heading');
              }
              if (await page.locator('#lead-pricing article').first().getByText('1 vstup').count())
                throw new Error('Page one-off card must omit redundant 1 vstup');
              const visitGroup = page.locator('[data-first-visit-group]');
              if (await visitGroup.count() !== 1 || (url.pathname === '/test-aria/' &&
                  !await visitGroup.locator('details summary').getByText('Ako prebieha úvodná návšteva?').count()))
                throw new Error('First-visit free badge or preview-only accordion missing');
              if (await page.locator('#lead-requirements span').getByText('Podmienky prijatia', { exact: true }).count())
                throw new Error('Redundant preview requirements eyebrow resurfaced');
              const eligibilityCopy = page.locator('#aria-early-faq details').first();
              for (const phrase of ['stredné a veľké psy', 'nad 15 kg', 'očkované šteniatka', 'približne od 4 mesiacov', 'Vyžadujeme potrebné očkovania, dobrý zdravotný stav a vhodnosť do kolektívu']) {
                if (!await eligibilityCopy.locator('strong').getByText(phrase, { exact: true }).count())
                  throw new Error('Eligibility highlights missing: ' + phrase);
              }
              if (!await page.locator('#lead-requirements strong').getByText('besnote', { exact: true }).count() ||
                  !await page.locator('#lead-requirements strong').getByText('infekčným ochoreniam', { exact: true }).count() ||
                  !await page.locator('#lead-requirements strong').getByText('kotercovému kašľu', { exact: true }).count())
                throw new Error('Preview vaccination keywords must be emphasized');
              if (url.pathname === '/test-aria/') {
                const faqDetails = visitGroup.locator('details');
                await faqDetails.locator('summary').click();
                if (await faqDetails.locator('strong').count() < 4)
                  throw new Error('Preview-only first-visit explanation must remain highlighted');
              }
              const visitSteps = page.locator('#lead-first-visit [data-first-visit-step]');
              if (await visitSteps.count() !== 3 ||
                  !await visitSteps.nth(0).locator('strong').getByText('Pred nástupom do škôlky').count() ||
                  !await visitSteps.nth(1).locator('strong').getByText('Nie každý psík si zvykne rovnako rýchlo.').count() ||
                  !await visitSteps.nth(2).locator('strong').getByText(/pravdivo všetko/).count())
                throw new Error('Three first-visit steps must contain the meaningful emphasized adaptation explanation');
              if (url.pathname === '/psia-skolka-kosice/') {
                const softness = await page.locator('#recenzie [data-gesture-track="reviews"]').evaluate(track => {
                  const card = track.querySelector('[data-review-card]');
                  if (!card) return null;
                  const style = getComputedStyle(card);
                  return { border: style.borderTopWidth, shadow: style.boxShadow,
                    bottom: parseFloat(getComputedStyle(track).paddingBottom) };
                });
                if (!softness || softness.border !== '1px' || softness.bottom < 55 ||
                    softness.shadow === 'none' || softness.shadow.includes('inset'))
                  throw new Error('Paid review shadow clipped or too harsh: ' + JSON.stringify(softness));
              }
              if (url.pathname === '/test-aria/' &&
                  (await page.locator('[data-aria-location-chips] a').count() !== 1 ||
                   !await page.locator('[data-aria-location-chips]').getByText('Bezplatné parkovanie').count()))
                throw new Error('Preview static mosaic must preserve location and parking chips');
              if (!await page.locator('#lead-pricing [data-lead-best-value]').getByText('Najvýhodnejšie').count())
                throw new Error('Lead permanentka must retain the orange best-value label');
              if (await page.locator('#aria-mosaic img').count() !== (url.pathname === '/psia-skolka-kosice/' ? 0 : 8))
                throw new Error('Static mosaic must remain preview-only; paid LEAD uses moving carousel');
              // Compare document order rather than screen rects (some sections may be offscreen).
              const hasHeroFormAndCaretakerOrder = await page.evaluate((isPaidLead) => {
                const reviews = document.getElementById('recenzie');
                const form = document.getElementById('aria-hero-form');
                const team = document.getElementById('aria-caretakers');
                const leadHero = document.querySelector('section.hero-safe-top');
                const content = leadHero?.querySelector('[data-aria-hero-content]');
                const introTopSpace = leadHero?.querySelector('[data-aria-intro-top-space]');
                const heroHeading = content?.querySelector('h1');
                const headlineSpacer = content?.querySelector('[data-aria-hero-heading-spacer]');
                const serviceGroup = content?.querySelector('[data-aria-service-group]');
                const heroDogs = serviceGroup?.querySelector('[data-aria-hero-dogs]');
                const badge = serviceGroup?.querySelector('[data-aria-service-badge]');
                const leadDescription = content?.querySelector('[data-aria-hero-description]');
                const proof = reviews?.querySelector('[data-aria-review-proof]');
                const introSpace = isPaidLead ? document.querySelector('[data-aria-lead-photos]')
                  : leadHero?.querySelector('[data-aria-intro-space]');
                const benefits = team?.querySelector('[data-hero-benefits]');
                const inlineMenu = leadHero?.querySelector('[data-aria-hero-menu]');
                const floatingMenu = document.querySelector('[data-aria-guide]');
                const firstVisitDogs = document.querySelector('#aria-first-visit-form [data-aria-first-visit-dogs]');
                if (!reviews || !form || !team || !leadHero || !content || !introTopSpace ||
                    !headlineSpacer || !serviceGroup || !heroHeading || !heroDogs ||
                    !badge || !leadDescription || !proof || !introSpace ||
                    !benefits || !firstVisitDogs ||
                    !content.contains(reviews) || content.parentElement !== leadHero ||
                    form.parentElement !== leadHero.parentElement) return false;
                const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
                const heading = team.querySelector('h2');
                const photo = team.querySelector('img');
                const copy = team.querySelector('p');
                const commonOrder = follows(introTopSpace, headlineSpacer) && follows(headlineSpacer, heroHeading) &&
                  follows(heroHeading, serviceGroup) && follows(heroHeading, heroDogs) &&
                  follows(heroDogs, badge) && follows(badge, leadDescription) &&
                  follows(leadDescription, proof) &&
                  (isPaidLead ? (follows(reviews, form) && follows(form, introSpace) &&
                    !leadHero.contains(introSpace) && !inlineMenu && !!floatingMenu && !leadHero.contains(floatingMenu) &&
                    getComputedStyle(floatingMenu).position === 'fixed' && follows(reviews, form))
                  : (follows(reviews, introSpace) && follows(introSpace, form))) &&
                  follows(form, team) &&
                  !!heading && !!photo && !!copy &&
                  follows(heading, photo) && follows(photo, benefits) && follows(benefits, copy) &&
                  follows(team, firstVisitDogs);
                return commonOrder;
              }, url.pathname === '/psia-skolka-kosice/');
              if (!hasHeroFormAndCaretakerOrder) throw new Error('Aria H1/dogs/badge/liquid copy/reviews/lead form/photos or caretakers order changed');
              if (width >= 768) {
                const heights = await page.locator(url.pathname === '/psia-skolka-kosice/'
                  ? '#lead-photo-carousel [data-gesture-track="photos"] > div:first-child button'
                  : '[data-aria-review-photo]')
                  .evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
                if (heights.length < 2 || heights.some(h => h < 240))
                  throw new Error('Desktop photo gallery thumbnails too short: ' + JSON.stringify(heights));
              }
              const stacked = await page.locator('#aria-caretakers').evaluate(section => {
                const rect = query => section.querySelector(query)?.getBoundingClientRect();
                const photo=rect('img'), pills=rect('[data-hero-benefits]'), copy=rect('p');
                if (!photo || !pills || !copy) return false;
                const cx=window.innerWidth/2,centered=r=>Math.abs(r.left+r.width/2-cx)<15;
                return centered(photo)&&centered(pills)&&centered(copy)&&photo.bottom<=pills.top&&pills.bottom<=copy.top;
              });
              if (!stacked) throw new Error('Caretaker photo, badges and copy must be stacked and centered');
              if (await page.locator('#lead-first-visit').getByText('Úvodná návšteva zadarmo', { exact: true }).count())
                throw new Error('Duplicated first-visit ribbon returned to three-step section');
              const hero = page.locator('#aria-hero-form');
              if (!await hero.getByRole('heading', { name: 'Chceli by ste sa informovať o škôlke?' }).count())
                throw new Error('New compact hero form heading missing');
              const enquiry = hero.locator('[data-lead-step-form]');
              const choiceLabels = enquiry.locator('label:has(input[name="zaujem"])');
              if (await choiceLabels.count() !== 3) throw new Error('Aria enquiry lost its 3 interest choices');
              await choiceLabels.nth(1).click();
              await enquiry.getByRole('button', { name: 'Pokračovať' }).click();
              const breed = enquiry.locator('[data-inquiry-dog-fields]');
              if (!await breed.isVisible() || !await breed.getByLabel('Plemeno psíka *').count())
                throw new Error('Regular visit must show optional breed under owner name');
              const ownerName = await enquiry.locator('input[name="meno"]').boundingBox();
              const breedBox = await breed.boundingBox();
              const phoneBox = await enquiry.locator('input[name="telefon"]').boundingBox();
              if (!ownerName || !breedBox || !phoneBox || !(ownerName.y < breedBox.y && breedBox.y < phoneBox.y))
                throw new Error('Breed must be directly below owner name and before phone');
              await breed.getByLabel('Plemeno psíka *').fill('Írsky vlkodav');
              await enquiry.getByRole('button', { name: 'Späť' }).click();
              await choiceLabels.nth(2).click();
              await enquiry.getByRole('button', { name: 'Pokračovať' }).click();
              if (!await breed.isVisible() || !await breed.getByLabel('Plemeno psíka *').count())
                throw new Error('Occasional visit must offer the same optional breed field');
              await enquiry.getByRole('button', { name: 'Späť' }).click();
              await choiceLabels.nth(0).click();
              await enquiry.getByRole('button', { name: 'Pokračovať' }).click();
              if (!await breed.isVisible() || await breed.getByLabel('Plemeno psíka *').inputValue() !== 'Írsky vlkodav')
                throw new Error('Information-only enquiry must keep the same editable breed field and entered value');
              await enquiry.getByRole('button', { name: 'Späť' }).click();
              const hasCorrectOrder = await page.evaluate(() => {
                const ids = window.location.pathname === '/psia-skolka-kosice/'
                  ? ['recenzie', 'aria-hero-form', 'lead-photo-carousel', 'aria-caretakers', 'aria-about',
                     'aria-early-faq', 'lead-pricing', 'lead-requirements', 'lead-benefits',
                     'lead-faq', 'aria-puppy-check', 'lead-first-visit', 'aria-first-visit-form']
                  : ['recenzie', 'aria-caretakers', 'aria-about', 'aria-early-faq', 'aria-mosaic',
                     'lead-benefits', 'lead-pricing', 'lead-requirements', 'lead-faq',
                     'aria-puppy-check', 'lead-first-visit'];
                const elements = ids.map(id => document.getElementById(id));
                return elements.every((node, idx) => node && (idx === 0 || !!(elements[idx-1] && elements[idx-1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)));
              });
              if (!hasCorrectOrder) throw new Error('Preview section hierarchy differs from approved mobile layout');
              if (await page.locator('section video').count()) throw new Error('Video must be omitted from preview');


              const caretakerPromptY = await page.evaluate(() => {
                const section = document.getElementById('aria-caretakers');
                if (!section) return -1;
                return window.scrollY + section.getBoundingClientRect().top - window.innerHeight * 0.44;
              });
              if (caretakerPromptY < 0) throw new Error('Caretakers section not found before Aria prompt');
              await page.evaluate(y => window.scrollTo(0, y), caretakerPromptY);
              await page.waitForFunction(() => document.querySelector('[data-aria-guide]')?.getAttribute('data-aria-stage') === 'puppy', null, {timeout:3000});
              if (!await page.locator('[data-aria-guide][data-intro="false"]').count())
                throw new Error('Aria intro must yield to puppy prompt at caretaker section');
              if (await aria.locator('[data-aria-message]').getAttribute('data-aria-suppressed') !== 'false')
                throw new Error('Aria puppy speech should reappear away from important content');
              if (url.pathname === '/test-aria/')
                await page.screenshot({ path: path.join(out, 'aria-' + engine + '-' + width + '-puppy-prompt.png') });
              const overitRadius = await aria.getByRole('button', { name: 'Overiť', exact: true })
                .evaluate(button => parseFloat(getComputedStyle(button).borderTopLeftRadius));
              if (overitRadius < 10 || overitRadius > 13)
                throw new Error('Puppy check CTA must match the squared comic bubble shape');
              if (url.pathname !== '/psia-skolka-kosice/') {
                // The paid lead menu now ends inside the hero; after scrolling to
                // caretakers it is intentionally no longer a floating control.
                await aria.getByRole('button', { name: 'Overiť', exact: true }).click();
                await page.waitForTimeout(120);
                if (!await page.locator('#aria-puppy-check').count()) throw new Error('Scroll CTA must link to the puppy checker');
              }
            }
          }
          if (!restricted && isAriaPage && url.pathname === '/psia-skolka-kosice/') {
            // Campaign funnel smoke: mock every backend action. Active campaigns
            // must never receive synthetic web-form submissions or analytics.
            const submissions = [], recoveries = [];
            await page.route('**/functions/v1/web-form-submit', async route => {
              const data = route.request().postDataJSON() || {};
              if (data.action === 'recover_contact') {
                recoveries.push(data);
                await route.fulfill({ status: 200, contentType: 'application/json',
                  body: '{"recovery_saved":true}' });
                return;
              }
              submissions.push(data);
              const success = submissions.length === 2;
              await route.fulfill({ status: success ? 201 : 503,
                contentType: 'application/json',
                body: JSON.stringify(success ? { ok: true } : { ok: false, recovery_saved: false }) });
            });
            await page.setViewportSize({ width: 390, height: 844 });
            await page.locator('[data-aria-guide]').getByRole('button', { name: 'Mám záujem o škôlku' }).click();
            // Paid dock now scrolls to the existing inline shared form rather
            // than opening the retired modal. Preserve failure/retry tracking.
            const contact = page.locator('#aria-hero-form [data-lead-step-form]');
            await contact.waitFor({ state: 'visible' });
            await page.waitForFunction(() => {
              const r = document.querySelector('#aria-hero-form')?.getBoundingClientRect();
              return !!r && r.top < window.innerHeight && r.bottom > 0;
            });
            if (await page.locator('[role="dialog"] [data-lead-step-form]').count())
              throw new Error('Paid dock must scroll to inline form without opening a modal');
            await contact.locator('label:has(input[name="zaujem"])').first().click();
            await contact.getByRole('button', { name: 'Pokračovať' }).click();
            const breedInput = contact.getByLabel('Plemeno psíka *');
            if (!await breedInput.isVisible()) throw new Error('Active campaign form must ask for breed');
            await contact.locator('input[name="meno"]').fill('Testovací dopyt');
            await breedInput.fill('Írsky vlkodav');
            await contact.locator('input[name="telefon"]').fill('912345678');
            await contact.locator('input[type="checkbox"][required]').check();
            await contact.getByRole('button', { name: 'Odoslať záujem' }).click();
            await contact.getByRole('alert').waitFor({ state: 'visible' });
            if (trackedEvents.some(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline'))
              throw new Error('Backend error must NOT emit a paid Lead');
            await contact.getByRole('button', { name: 'Odoslať záujem' }).click();
            await page.locator('#aria-hero-form [data-lead-step-success]').waitFor({ state: 'visible' });
            for (let i = 0; i < 15 && !trackedEvents.some(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline'); i++)
              await page.waitForTimeout(100);
            const sent = trackedEvents.filter(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline');
            const cta = trackedEvents.filter(e => e.name === 'nav_click' && e.source === 'lead_landing_aria_interest');
            if (submissions.length !== 2 || recoveries.length !== 1 || sent.length !== 1 ||
                !cta.length || !submissions.every(data => data.form_type === 'lead' &&
                  data.cta_source === 'lead_landing_aria_hero_inline' &&
                  data.interest_reason === 'Chcem sa informovať o škôlke' &&
                  data.dog_breed === 'Írsky vlkodav' &&
                  data.raw_payload?.['Plemeno psíka'] === 'Írsky vlkodav')) {
              throw new Error('Campaign lead breed/source/conversion or recovery failed: ' +
                JSON.stringify({ submissions: submissions.length, recoveries: recoveries.length,
                  sent: sent.length, cta: cta.length, breeds: submissions.map(x => x.dog_breed) }));
            }
            await page.screenshot({ path: path.join(out, 'lead-aria-' + engine + '-390-mocked-success.png') });
            if (!await page.locator('#aria-hero-form [data-lead-step-success]').isVisible())
              throw new Error('Inline lead success receipt must remain visible');
          }
          if (!restricted && !bellaris && url.pathname === '/') {
            await page.setViewportSize({ width: 390, height: 844 });
            const checker = page.locator('[data-home-puppy-checker] [data-aria-puppy-step="age"]');
            await checker.scrollIntoViewIfNeeded();
            await checker.getByRole('button', { name: /Pokračovať na očkovania/ }).click();
            const vaccines = page.locator('[data-home-puppy-checker] [data-aria-puppy-step="vaccines"]');
            await vaccines.waitFor({ state: 'visible' });
            for (let i = 0; i < 3; i++) await vaccines.locator('fieldset').nth(i).getByText('Áno', { exact: true }).click();
            if (await vaccines.getByText(/Plemeno \(voliteľné\)/).count())
              throw new Error('Homepage puppy checker must defer breed until contact');
            const homeSubmissions = [];
            await page.route('**/functions/v1/web-form-submit', async route => {
              const data = route.request().postDataJSON() || {};
              if (data.action !== 'recover_contact') homeSubmissions.push(data);
              await route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
            });
            await vaccines.getByRole('button', { name: /Pokračovať na kontakt/ }).click();
            const contact = page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).last();
            await contact.waitFor({ state: 'visible' });
            const summary = await contact.locator('[data-puppy-check-summary]').innerText();
            if (!summary.includes('4 mesiacov') || !summary.includes('DHPPi+L'))
              throw new Error('Homepage vaccine answers missing in actual contact');
            await contact.locator('input[name="meno"]').fill('Testovací dopyt');
            await contact.getByLabel('Plemeno psíka *').fill('Írsky vlkodav');
            await contact.locator('input[name="telefon"]').fill('912345678');
            await contact.locator('input[type="checkbox"][required]').check();
            await contact.getByRole('button', { name: 'Odoslať záujem' }).click();
            await page.locator('[role="dialog"] [data-lead-step-success]').last().waitFor({ state: 'visible' });
            for (let i = 0; i < 12 && !trackedEvents.some(e => e.name === 'form_submit' && e.source === 'home_puppy_checker_eligible'); i++)
              await page.waitForTimeout(100);
            const accepted = trackedEvents.filter(e => e.name === 'form_submit' && e.source === 'home_puppy_checker_eligible');
            const payload = homeSubmissions[0];
            if (homeSubmissions.length !== 1 || accepted.length !== 1 || !payload ||
                payload.form_type !== 'lead' || payload.cta_source !== 'home_puppy_checker_eligible' ||
                payload.dog_breed !== 'Írsky vlkodav' ||
                payload.puppy_check?.age_months !== 4 ||
                !['rabies', 'dhppi', 'kennel'].every(k => payload.puppy_check?.vaccines?.[k] === 'yes'))
              throw new Error('Homepage puppy CRM handoff failed: ' + JSON.stringify({ saved: homeSubmissions.length,
                eventCount: accepted.length, source: payload?.cta_source, breed: payload?.dog_breed }));
            await page.screenshot({ path: path.join(out, 'home-puppy-' + engine + '-390-success.png') });
            const receipt = page.getByRole('dialog').last();
            await receipt.getByRole('button', { name: 'Close' }).click();
            await receipt.waitFor({ state: 'hidden' });
            await page.evaluate(() => window.scrollTo(0, 0));
          }
          if (/This page didn.t load|Stránku sa nepodarilo načítať/i.test(await page.locator('body').innerText())) throw new Error('Cookie selection crashed the page');
          if (isPuppyAria && !restricted) {
            const aria = page.locator('[data-aria-guide]');
            const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
            const robots = await page.locator('meta[name="robots"]').getAttribute('content');
            const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
            if (canonical !== 'https://chvostikovo.sk/psia-skolka-pre-steniatka/' ||
                robots !== 'index, follow' || !schema.some(value => value.includes('FAQPage')) ||
                !(await page.title()).includes('šteniatka'))
              throw new Error('Puppy organic SEO canonical, indexing or FAQ contract missing');
            if (await page.locator('.mobile-dock').count())
              throw new Error('Puppy route must not render the old mobile dock alongside Aria');
            for (const width of [320, 375, 390, 430]) {
              await page.setViewportSize({ width, height: 844 });
              // CSS scroll-behavior:smooth can leave the previous width's
              // animation active; deterministic geometry checks require an
              // immediate scroll, not an uncompleted multi-section animation.
              await page.evaluate(() => {
                document.documentElement.style.scrollBehavior = 'auto';
                document.body.style.scrollBehavior = 'auto';
                window.scrollTo(0, 0);
              });
              await page.waitForFunction(() =>
                window.scrollY < 2 && document.querySelector('[data-aria-guide]')?.dataset.ariaStage === 'intro');
              const speech = aria.locator('[data-aria-message]');
              if (await aria.getAttribute('data-aria-stage') !== 'intro' ||
                  !await speech.isVisible() || await speech.getAttribute('data-aria-suppressed') !== 'false')
                throw new Error('Puppy Aria introduction must remain visible at ' + width);
              const geometry = await aria.locator('[data-aria-dock]').boundingBox();
              if (!geometry || geometry.x < 0 || geometry.x + geometry.width > width + 2)
                throw new Error('Puppy Aria dock clipped on mobile at ' + width);
              const boundary = await page.evaluate(() => {
                const el = document.getElementById('puppy-first-visit');
                return el ? window.scrollY + el.getBoundingClientRect().bottom : null;
              });
              if (boundary == null) throw new Error('Puppy requirements/visit boundary missing');
              await page.evaluate(y => window.scrollTo(0, y), boundary + 36);
              await page.waitForFunction(() =>
                document.querySelector('[data-aria-guide]')?.dataset.ariaStage === 'contact');
              if (!await speech.isVisible() || await speech.getAttribute('data-aria-suppressed') !== 'false' ||
                  !await aria.getByRole('button', { name: 'Vyplniť' }).count())
                throw new Error('Puppy Aria must show persistent contact CTA after conditions at ' + width);
              // Flicker gate: the dock must remain the same fixed-position
              // node through fast scrolls, section changes and small Safari-
              // style oscillations around the contact threshold. The speech
              // is never hidden; only its message may change.
              const stability = await page.evaluate(async ({boundary}) => {
                const guide = document.querySelector('[data-aria-guide]');
                const dock = guide?.querySelector('[data-aria-dock]');
                const speech = guide?.querySelector('[data-aria-message]');
                if (!guide || !dock || !speech) return { error: 'missing Aria node' };
                const start = dock.getBoundingClientRect();
                const sequences = [
                  boundary + 20, boundary + 44, boundary + 32,
                  boundary + 52, boundary + 22, boundary + 35,
                  Math.max(0, boundary - 800), boundary + 110,
                  Math.max(0, boundary - 1100), boundary + 180,
                ];
                const failures = [];
                for (const y of sequences) {
                  window.scrollTo(0, y);
                  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                  const dockBox = dock.getBoundingClientRect();
                  const speechBox = speech.getBoundingClientRect();
                  const style = getComputedStyle(guide);
                  const speechStyle = getComputedStyle(speech);
                  if (document.querySelector('[data-aria-dock]') !== dock ||
                      style.position !== 'fixed' || style.display === 'none' ||
                      style.visibility !== 'visible' || style.opacity !== '1' ||
                      speechStyle.visibility !== 'visible' || speechBox.width < 80 ||
                      speech.dataset.ariaSuppressed !== 'false' ||
                      Math.abs(start.y - dockBox.y) > 3 ||
                      Math.abs(start.height - dockBox.height) > 2)
                    failures.push({ y, stage: guide.dataset.ariaStage,
                      dockY: Math.round(dockBox.y), baselineY: Math.round(start.y),
                      visible: speechStyle.visibility, position: style.position });
                }
                return { failures };
              }, { boundary });
              if (stability.error || stability.failures.length)
                throw new Error('Aria dock/speech flicker at ' + width + ': ' + JSON.stringify(stability));
              if (url.pathname === '/psia-skolka-pre-steniatka/' && width === 390)
                await page.screenshot({ path: path.join(out, 'puppy-aria-' + engine + '-390-contact.png') });
            }
            await page.setViewportSize({ width: 390, height: 844 });
            const inline = page.locator('#aria-puppy-check');
            await inline.scrollIntoViewIfNeeded();
            await inline.locator('[data-aria-puppy-step="age"]').waitFor({ state: 'visible' });
            if (await inline.getByText(/Plemeno \(voliteľné\)/).count())
              throw new Error('Breed must not be asked in puppy age step');
            await inline.getByRole('button', { name: /Pokračovať na očkovania/ }).click();
            if (!await inline.locator('[data-aria-puppy-step="vaccines"]').count())
              throw new Error('Vaccination step missing');
            for (let i = 0; i < 3; i++)
              await inline.locator('fieldset').nth(i).getByText('Áno', { exact: true }).click();
            await inline.getByRole('button', { name: /Pokračovať na kontakt/ }).click();
            const leadDialog = page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).last();
            await leadDialog.waitFor({ state: 'visible' });
            if (!await leadDialog.locator('[data-puppy-check-summary]').getByText(/4 mesiacov/).count())
              throw new Error('Puppy age did not transfer to actual contact form');
            if (!await leadDialog.getByLabel('Plemeno psíka *').isVisible())
              throw new Error('Breed field missing from final contact form');
            await leadDialog.getByLabel('Plemeno psíka *').fill('Írsky vlkodav');
            if (!await leadDialog.locator('[data-puppy-check-summary]').getByText(/Írsky vlkodav/).count())
              throw new Error('Puppy breed correction must update the attached summary');
            await page.screenshot({ path: path.join(out, 'puppy-aria-' + engine + '-390-contact-form.png') });
            await leadDialog.getByRole('button', { name: 'Close' }).click();
            await leadDialog.waitFor({ state: 'hidden' });
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(190);

            // The old mobile dock emitted both nav_click and a consent-gated
            // view_pricing. Aria additionally needs first-visit/FAQ reads.
            await aria.getByRole('button', { name: 'Cenník škôlky' }).click();
            await aria.getByRole('button', { name: 'Ako prebieha návšteva?' }).click();
            if (!await aria.locator('[data-aria-first-visit]').isVisible())
              throw new Error('First-visit pricing details did not open');
            await aria.getByRole('button', { name: 'Časté otázky' }).click();
            await aria.getByRole('button', { name: 'Ako prebieha prvá návšteva?' }).click();
            await aria.getByRole('button', { name: 'Otvoriť menu' }).click();
            await aria.getByRole('button', { name: /Prvá návšteva zadarmo/ }).click();

            // Simulate failed lead, separate recover_contact, then accepted
            // lead. Every POST is fulfilled within Playwright: no Supabase,
            // SMS, email, CRM or real marketing conversion is sent.
            const syntheticLeads = [];
            const syntheticRecoveries = [];
            await page.route('**/functions/v1/web-form-submit', async route => {
              const payload = route.request().postDataJSON();
              if (payload?.action === 'recover_contact') {
                syntheticRecoveries.push(payload);
                await route.fulfill({
                  status: 200, contentType: 'application/json',
                  body: JSON.stringify({ recovery_saved: true }),
                });
                return;
              }
              syntheticLeads.push(payload);
              const accepted = syntheticLeads.length > 1;
              await route.fulfill({
                status: accepted ? 201 : 503,
                contentType: 'application/json',
                body: JSON.stringify(accepted ? { ok: true } : { ok: false, recovery_saved: false }),
              });
            });
            await aria.getByRole('button', { name: 'Mám záujem o škôlku' }).click();
            const conversionDialog = page.locator('[role="dialog"]').filter({ has: page.locator('[data-lead-step-form]') }).last();
            await conversionDialog.waitFor({ state: 'visible' });
            await conversionDialog.locator('label:has(input[name="zaujem"])').first().click();
            await conversionDialog.getByRole('button', { name: 'Pokračovať' }).click();
            await conversionDialog.locator('input[name="meno"]').fill('Test návštevníka');
            await conversionDialog.locator('input[name="telefon"]').fill('912345678');
            await conversionDialog.locator('input[name="plemeno"]').fill('Kríženec');
            await conversionDialog.locator('input[type="checkbox"][required]').check();
            await conversionDialog.getByRole('button', { name: 'Odoslať záujem' }).click();
            await conversionDialog.getByRole('alert').waitFor({ state: 'visible' });
            if (trackedEvents.some(e => e.name === 'form_submit' && e.source === 'puppy_landing_aria_interest'))
              throw new Error('Failed synthetic lead must not count as conversion');
            await conversionDialog.getByRole('button', { name: 'Odoslať záujem' }).click();
            // On success the shared LeadStepForm intentionally replaces its
            // form node with a receipt. Keep the dialog selector independent
            // of the removed [data-lead-step-form] element.
            await page.locator('[role="dialog"] [data-lead-step-success]').last().waitFor({ state: 'visible' });
            for (let i = 0; i < 12 && !trackedEvents.some(e => e.name === 'form_submit' && e.source === 'puppy_landing_aria_interest'); i++)
              await page.waitForTimeout(100);
            const has = (name, source) => trackedEvents.some(e => e.name === name && e.source === source);
            for (const [name, source] of [
              ['nav_click', 'puppy_landing_aria_pricing'],
              ['nav_click', 'puppy_landing_aria_faq'],
              ['nav_click', 'puppy_landing_aria_first_visit'],
              ['nav_click', 'puppy_landing_aria_interest'],
              ['explore_daycare', 'puppy_landing_aria_first_visit_pricing_details'],
              ['explore_daycare', 'puppy_landing_aria_faq_first_visit'],
              ['inquiry_cta', 'puppy_landing_aria_interest'],
              ['form_submit', 'puppy_landing_aria_interest'],
            ]) {
              if (!has(name, source))
                throw new Error('Missing isolated CTA/funnel event ' + name + ':' + source);
            }
            const submitted = trackedEvents.filter(e => e.name === 'form_submit' && e.source === 'puppy_landing_aria_interest');
            if (submitted.length !== 1 || syntheticLeads.length !== 2 || syntheticRecoveries.length < 1 ||
                !syntheticLeads.every(data => data.form_type === 'lead' &&
                  data.cta_source === 'puppy_landing_aria_interest' &&
                  data.interest_reason === 'Chcem sa informovať o škôlke' &&
                  data.dog_breed === 'Kríženec'))
              throw new Error('Synthetic lead/recovery separation failed: ' + JSON.stringify({ leads: syntheticLeads.map(v => ({ action: v.action, type: v.form_type, source: v.cta_source, interest: v.interest_reason, breed: v.dog_breed })), recoveries: syntheticRecoveries.length, submitted: submitted.length }));
            const receiptDialog = page.getByRole('dialog').last();
            await receiptDialog.getByRole('button', { name: 'Close' }).click();
            await receiptDialog.waitFor({ state: 'hidden' });
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(120);
          }
          // Shared Slovak Hero CTA: approved home single interest CTA; other routes retain their pair.
          // Layout regression 320/375/390/1440 in Chromium and Safari WebKit.
          if (!bellaris && ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/'].includes(url.pathname) && !isAriaPage) {
            for (const width of [320, 375, 390, 1440]) {
              await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
              const hero = page.locator('section.hero-safe-top').first();
              const primary = hero.locator('.hero-cta-primary:visible').first();
              const mainInlineMobile = url.pathname === '/' && width < 1024;
              // A responsive Hero can settle a frame later after 390→1440
              // resize on Safari with restricted storage; keep a bounded gate.
              if (!mainInlineMobile) {
                try { await primary.waitFor({state:'visible',timeout:4500}); }
                catch (_) { throw new Error('Hero prominent CTA missing at ' + width); }
              }
              if (await hero.locator('.hero-cta-primary:visible').count() !== (mainInlineMobile ? 0 : 1))
                throw new Error('Main mobile uses inline form, other Heroes retain primary CTA at ' + width);
              const ctaPair = hero.locator('.hero-cta-pair:visible');
              if (url.pathname === '/') {
                if (width < 1024) {
                  const inline = hero.locator('[data-home-hero-inline-mobile] [data-lead-step-form]');
                  if (!await inline.isVisible() || await inline.locator('input[name="zaujem"]').count() !== 3 ||
                      await hero.locator('.hero-cta-pair:visible').count())
                    throw new Error('Main mobile Hero needs three shared interests directly: ' + width);
                } else {
                  if ((await primary.innerText()).trim() !== 'Chcem zistiť viac' || await hero.locator('.hero-cta-secondary').count())
                    throw new Error('Desktop home learn-more CTA changed: ' + width);
                  const centered = await primary.evaluate(el => {
                    const r=el.getBoundingClientRect(), parent=el.parentElement.getBoundingClientRect();
                    return Math.abs((r.left+r.right-parent.left-parent.right)/2) <= 2;
                  });
                  if (!centered) throw new Error('Desktop Home CTA not centered: ' + width);
                }
                if (width >= 1024 && !await hero.locator('[data-lead-step-form]:visible').first().isVisible())
                  throw new Error('Desktop home guided form missing');
                const layout = await page.evaluate(() => {
                  const ids=['top','preco-chvostikovo','o-nas','cennik','podmienky','home-early-faq','informujte-sa','starostlivost','priestory','psie-priatelstva','prva-navsteva','prva-navsteva-form','preco','faq'];
                  const nodes=ids.map(id=>document.getElementById(id));
                  const photo=document.querySelector('#o-nas img'), benefits=document.querySelector('#o-nas [data-hero-benefits]');
                  const cutout=document.querySelector('[data-schoolmates-cutout]');
                  const inputs=[...document.querySelectorAll('input[id]')].map(el=>el.id);
                  const included=document.querySelector('[data-home-included]').getBoundingClientRect();
                  const prices=document.querySelector('[data-home-prices]').getBoundingClientRect();
                  const taxi=document.querySelector('[data-home-taxi]');
                  const cards=[...document.querySelectorAll('[data-home-price-card]')].map(el=>el.getBoundingClientRect());
                  const benefitPills=[...document.querySelectorAll('#o-nas [data-hero-benefits] > span')].map(el=>el.getBoundingClientRect());
                  const aboutHeading=document.querySelector('#o-nas h2');
                  const aboutText=document.querySelector('#o-nas [data-about-expanded]');
                  const faq=document.querySelector('#home-early-faq');
                  const dock=document.querySelector('.mobile-dock[data-variant="main"]');
                  const heroCta=[...document.querySelectorAll('#top .hero-cta-primary')].find(el=>el.getBoundingClientRect().width>0);
                  const videoGrid=document.querySelector('[data-video-reasons-grid]');
                  const dogs=document.querySelector('[data-schoolmates-frame]').getBoundingClientRect();
                  const titleLine=document.querySelector('[data-home-hero-title-line]');
                  const lineRange=document.createRange();lineRange.selectNodeContents(titleLine);
                  const copy=document.querySelector('.home-hero-column .home-hero-copy').getBoundingClientRect();
                  return {
                    ordered:nodes.every((node,i)=>node && (!i || !!(nodes[i-1].compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING))),
                    reviewsInHero:document.getElementById('top').contains(document.getElementById('recenzie')),
                    tickerAbsent:!document.querySelector('main .info-ticker-track'),
                    benefitsMoved:!!photo && !!benefits && benefits.getBoundingClientRect().top>=photo.getBoundingClientRect().bottom && !document.querySelector('#top [data-hero-benefits]'),
                    forms:['informujte-sa','zaujem-po-priatelstvach','prva-navsteva-form'].every(id=>document.getElementById(id)?.querySelector('[data-lead-step-form]')),
                    uniqueFields:inputs.length===new Set(inputs).size,
                    cutout:!!cutout && cutout.complete && cutout.naturalWidth>0,
                    palette:document.body.classList.contains('site-brand') && getComputedStyle(document.querySelector('#top h1')).color==='rgb(184, 46, 127)',
                    copy:[...document.querySelectorAll('.home-hero-copy')].every(el=>getComputedStyle(el).backgroundColor==='rgb(255, 164, 20)' && getComputedStyle(el).color==='rgb(255, 255, 255)'),
                    noMobileSalesBox:innerWidth>=1024 || [...document.querySelectorAll('#top .home-hero-copy')].every(el=>el.getBoundingClientRect().height===0),
                    mobileOrangePhrase:innerWidth>=1024 || (() => {
                      const el=document.querySelector('[data-home-mobile-orange-phrase]');
                      return el?.textContent?.trim()==='váš psík zamiluje' &&
                        getComputedStyle(el).color==='rgb(255, 164, 20)';
                    })(),
                    heroGlassAndBreathingRoom:innerWidth>=1024 || (() => {
                      const panel=document.querySelector('#top [data-home-hero-inline-mobile]');
                      const heading=document.querySelector('#top h1');
                      const review=document.querySelector('#top #recenzie');
                      const paws=panel?.querySelectorAll('[aria-hidden="true"] svg');
                      if(!panel || !heading || !review || !paws?.length) return false;
                      const panelBox=panel.getBoundingClientRect(), titleBox=heading.getBoundingClientRect();
                      const reviewBox=review.getBoundingClientRect();
                      const style=getComputedStyle(panel);
                      const colorComponents=style.backgroundColor.match(/[0-9.]+/g) || [];
                      const alpha=Number(colorComponents[3]);
                      const headlineGap=panelBox.top-titleBox.bottom;
                      const reviewGap=reviewBox.top-panelBox.bottom;
                      return paws.length>=6 && alpha>0 && alpha<0.75 &&
                        parseFloat(style.borderTopWidth)>=1.25 &&
                        style.borderTopColor!=='rgba(255, 255, 255, 0.68)' &&
                        style.backdropFilter.includes('blur') &&
                        headlineGap>=21 && headlineGap<=54 &&
                        reviewGap>=19 && reviewGap<=58 &&
                        panelBox.left>=-1 && panelBox.right<=innerWidth+1;
                    })(),
                    reasonThirdNoRule:innerWidth>=640 || (() => {
                      const third=document.querySelectorAll('#preco-chvostikovo [data-video-reasons-copy] article')[2];
                      return !!third && getComputedStyle(third).borderTopWidth==='0px';
                    })(),
                    desktopCopy:innerWidth<1024 || (Math.abs(copy.right-lineRange.getBoundingClientRect().right)<9 && !!document.querySelector('.home-hero-column .home-hero-copy br')),
                    pricing:prices.left>=included.right+7 && Math.abs(prices.top-included.top)<2 && cards.length===2 && cards[1].top>=cards[0].bottom+7 && !document.querySelector('#cennik button'),
                    passPink:getComputedStyle(document.querySelector('[data-home-price-card="pass"]')).backgroundColor==='rgb(248, 221, 235)',
                    taxiBelowPass:!!taxi && !!taxi.closest('[data-home-prices]') && taxi.getBoundingClientRect().top>=cards[1].bottom &&
                      getComputedStyle(taxi).backgroundColor==='rgb(201, 44, 137)' && Math.abs(included.bottom-prices.bottom)<3,
                    compactIncludedHeading:document.querySelector('[data-home-included] h3')?.textContent?.trim()==='Čo je v cene zahrnuté',
                    aboutExpanded:!document.querySelector('#o-nas summary') && !!aboutText?.querySelector('strong') && aboutHeading.scrollWidth<=aboutHeading.clientWidth+2 &&
                      getComputedStyle(aboutText).textAlign==='left' && aboutText.getBoundingClientRect().width<=682,
                    aboutStack:!!photo && !!benefits && !!aboutText && aboutHeading.getBoundingClientRect().bottom<=photo.getBoundingClientRect().top+2 &&
                      benefits.getBoundingClientRect().bottom<=aboutText.getBoundingClientRect().top+2,
                    balancedPass:Math.abs((cards[1].top-cards[0].bottom)-(taxi.getBoundingClientRect().top-cards[1].bottom))<5,
                    faqAfterRequirements:document.getElementById('podmienky').nextElementSibling===faq &&
                      faq.querySelectorAll('details').length===3 && !document.querySelector('#podmienky a[href="#aria-puppy-check"]'),
                    orangeRequirementHeadings:[...document.querySelectorAll('#podmienky article h3')].every(el=>getComputedStyle(el).color==='rgb(255, 164, 20)'),
                    flatMainDock:getComputedStyle(dock.querySelector('.mobile-dock-bar')).boxShadow==='none',
                    mainMenuOrder:[...dock.querySelectorAll('.mobile-dock-bar > a')].map(el=>el.getAttribute('href')).join('|')==='/#o-nas|/#cennik|/#podmienky|/produkty',
                    benefitChipsSingleRow:benefitPills.length===3 && benefitPills.every(r=>Math.abs(r.top-benefitPills[0].top)<2),
                    certs:document.querySelectorAll('#o-nas [data-safety-certificates] img').length===2 &&
                      (() => {
                        const heading=document.querySelector('#o-nas [data-safety-heading]');
                        const icon=heading?.querySelector('svg');
                        const panel=document.querySelector('#o-nas [data-safety-certificates] > div');
                        const text=aboutText?.getBoundingClientRect(), box=panel?.getBoundingClientRect();
                        return !!heading && !!icon && !!text && !!box &&
                          icon.getBoundingClientRect().width>=27 &&
                          (innerWidth>=640 || parseFloat(getComputedStyle(heading).fontSize)<=14) &&
                          Math.abs(box.left-text.left)<=48 && Math.abs(box.right-text.right)<=48;
                      })(),
                    formDepth:getComputedStyle(document.querySelector('#informujte-sa [data-home-inquiry-card]')).boxShadow.includes('rgb'),
                    heroFormOrDesktopCta: innerWidth < 1024
                      ? !!document.querySelector('#top [data-home-hero-inline-mobile] [data-lead-step-form]') &&
                        !document.querySelector('#top .home-hero-cta')
                      : getComputedStyle(document.querySelector('#top .home-hero-desktop-cta .hero-cta-primary')).boxShadow==='none',
                    conditionsNext:document.getElementById('cennik').nextElementSibling.id==='podmienky',
                    opaqueCards:innerWidth<640 || getComputedStyle(videoGrid).backgroundColor==='rgba(0, 0, 0, 0)',
                    noCareCta:!document.querySelector('#preco-chvostikovo .relative.z-20 button') && dogs.top-videoGrid.getBoundingClientRect().bottom>=24,
                    homeMobileVideoLayout:(() => {
                      const video=document.querySelector('#preco-chvostikovo video')?.getBoundingClientRect();
                      const texts=[...document.querySelectorAll('#preco-chvostikovo [data-video-reasons-copy] article')].map(el=>el.getBoundingClientRect());
                      if (!video || texts.length!==3 || !document.querySelector('#preco-chvostikovo [data-home-video-layout]')) return false;
                      if (innerWidth>=640) return texts.every(r=>r.left>=video.right-2) &&
                        video.bottom>=texts[2].bottom-5;
                      // Mobile: first two reasons stacked beside video;
                      // third spans the full box underneath.
                      return texts[0].left>=video.right-2 &&
                        texts[1].left>=video.right-2 &&
                        texts[1].top>=texts[0].bottom-2 &&
                        texts[2].top>=video.bottom-2 &&
                        texts[2].left<=video.left+3 && texts[2].right>=texts[1].right-3 &&
                        document.querySelectorAll('#preco-chvostikovo [data-video-reasons-copy] strong').length>=4;
                    })(),
                    homeReviewSoftShadow:(() => {
                      const track=document.querySelector('#recenzie [data-gesture-track="reviews"]');
                      const card=track?.querySelector('[data-review-card]');
                      if (!track || !card) return false;
                      const style=getComputedStyle(card);
                      return style.borderTopWidth==='1px' && style.boxShadow!=='none' &&
                        !style.boxShadow.includes('inset') && parseFloat(getComputedStyle(track).paddingBottom)>=55;
                    })(),
                    firstVisitNotDuplicated:!document.querySelector('#prva-navsteva [aria-controls]') &&
                      document.querySelectorAll('#prva-navsteva [data-first-visit-step]').length===3 &&
                      document.querySelectorAll('#prva-navsteva [data-first-visit-step] strong').length>=5,
                    frostForm:(() => {
                      const el=document.querySelector('#informujte-sa [data-home-inquiry-card]');
                      const style=getComputedStyle(el);
                      return el.classList.contains('form-liquid-surface') &&
                        style.backdropFilter.includes('blur') &&
                        style.backgroundColor.includes('0.55') &&
                        !document.querySelector('#informujte-sa a[href^="tel:"]');
                    })(),
                    firstVisit:getComputedStyle(document.getElementById('prva-navsteva')).backgroundColor==='rgb(145, 64, 107)' && ![...document.querySelectorAll('#prva-navsteva button')].some(el=>el.textContent.includes('Dohodnúť úvodnú návštevu')),
                    pricingFits:[...document.querySelectorAll('[data-home-pricing-columns] *')].every(el=>el.scrollWidth<=el.clientWidth+2),
                    paws:!!document.querySelector('#top .paw-trail-background'),
                  };
                });
                if(Object.values(layout).some(value=>!value)) throw new Error('Home brand/layout regression: '+JSON.stringify(layout));
                if (width===320) {
                  // Narrow Android short viewport: review proof visible above
                  // the dock; controls remain >=44px despite compact mode.
                  await page.setViewportSize({width:320,height:760});
                  await page.locator('#top #recenzie').scrollIntoViewIfNeeded();
                  const narrow=await page.evaluate(()=>{
                    const review=document.querySelector('#top #recenzie [data-review-card]')?.getBoundingClientRect();
                    const dock=document.querySelector('.mobile-dock[data-variant="main"] .mobile-dock-bar')?.getBoundingClientRect();
                    const item=document.querySelector('.mobile-dock[data-variant="main"] .mobile-dock-item')?.getBoundingClientRect();
                    return {visible:review&&dock?Math.min(review.bottom,dock.top)-review.top:0, buttonHeight:item?.height};
                  });
                  if (narrow.visible<110 || narrow.buttonHeight<44 || narrow.buttonHeight>55)
                    throw new Error('Narrow Android reviews covered by dock: '+JSON.stringify(narrow));
                  await page.setViewportSize({width:320,height:844});
                  await page.evaluate(() => window.scrollTo(0, 0));
                }
                // ContextFaq mounts its CTA only while the disclosure is open:
                // verify the actual clickable link after user interaction,
                // rather than querying a deliberately unmounted child.
                const puppyToggle=page.locator('#home-early-faq summary').filter({hasText:'Čo ak chcete prihlásiť šteniatko?'});
                await puppyToggle.click();
                const puppyLink=page.locator('#home-early-faq a[href="#aria-puppy-check"].btn-coral');
                if (!await puppyLink.isVisible() ||
                    !(await page.locator('#aria-puppy-check h2').innerText()).includes('Spĺňa základné podmienky?'))
                  throw new Error('Expanded puppy FAQ must show a pink CTA linking to the real age/vaccination checker');
                await puppyToggle.click();
              } else if (width < 1024) {
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
                if (!await hero.locator('[data-lead-step-form]:visible').first().isVisible())
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
              // Mobile home has an inline 2-step form instead of the old CTA.
              // Check its real inputs above; don't wait for an absent button.
              // Preserve desktop and other landing routes' CTA shadow checks.
              if (!mainInlineMobile) {
                const primaryShadow = await primary.evaluate(el => getComputedStyle(el).boxShadow);
                if (url.pathname === '/' && width >= 1024) {
                  if (primaryShadow !== 'none') throw new Error('Main desktop CTA must be shadow-free: ' + width);
                } else if (primaryShadow === 'none') {
                  throw new Error('Landing primary CTA glow missing: ' + width);
                }
              }
            }
            if(url.pathname==='/' && !restricted) {
              await page.locator('#home-hero-learn-more').click();
              await page.waitForFunction(()=>{const y=document.getElementById('preco-chvostikovo').getBoundingClientRect().top;return y>=0&&y<260;});
              if(await page.getByRole('dialog').count()) throw new Error('Desktop learn-more action opened a dialog');
              await page.setViewportSize({width:390,height:844});
              const puppyFaq=page.locator('#home-early-faq summary').filter({hasText:'Čo ak chcete prihlásiť šteniatko?'});
               await puppyFaq.click();
               await page.locator('#home-early-faq a[href="#aria-puppy-check"]').click();
              await page.waitForFunction(()=>{const y=document.getElementById('aria-puppy-check').getBoundingClientRect().top;return y>=0&&y<200;});
              for(const id of ['informujte-sa','zaujem-po-priatelstvach','prva-navsteva-form']) {
                const inquiry=page.locator('#'+id+' [data-lead-step-form]');
                await inquiry.locator('label').first().click();
                await inquiry.getByRole('button',{name:'Pokračovať',exact:true}).click();
                await inquiry.locator('input[name="meno"]').waitFor({state:'visible',timeout:5000}).catch(() => { throw new Error('Inline contact step failed: '+id); });
                await inquiry.getByRole('button',{name:'Späť',exact:true}).click();
              }
              await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            }
            await page.setViewportSize({ width: 390, height: 844 });
          }
          // New LEAD pilot: one question at a time without any real submission.
          if (!bellaris && !restricted && url.pathname === '/psia-skolka-kosice/' && !isAriaPage) {
            const wizard = page.locator('#lead-form [data-lead-step-form]');
            if (!await wizard.isVisible()) throw new Error('Missing inline mobile lead wizard');
            // 19 Nov LEAD funnel: proof before first contact, editable inline entries,
            // and no regression to the existing wizard/backend contract.
            const order = await page.evaluate(() => {
              const ids = ['recenzie', 'lead-form', 'lead-benefits', 'lead-pricing', 'lead-requirements', 'lead-form-pricing'];
              return ids.map(id => {
                const el = document.getElementById(id);
                return el ? { id, top: window.scrollY + el.getBoundingClientRect().top } : null;
              });
            });
            if (order.some((item, index) => !item || (index > 0 && item.top <= order[index - 1].top)))
              throw new Error('LEAD funnel order must be reviews > first form > benefits > pricing > requirements > follow-up form: ' + JSON.stringify(order));
            if (!await page.locator('#lead-benefits [data-lead-step-form]').count())
              throw new Error('Benefits must show the guided form, not only a button');
            if (!await page.locator('#lead-form-pricing img').count())
              throw new Error('Requirements follow-up form must retain the four-dog crown');
            const video = page.locator('video[poster]').last();
            if (!await video.count() || await video.getAttribute('preload') !== 'metadata')
              throw new Error('Daycare video needs a preview and explicit in-app-browser playback');
            if (!await page.getByRole('button', { name: 'Prehrať video zo škôlky' }).count())
              throw new Error('Daycare video requires a direct user-gesture play control');
            // Prevent duplicate native Safari and custom play overlays before user interaction.
            if (await video.getAttribute('controls') !== null)
              throw new Error('Daycare video must not render native controls beneath the custom play button');
            // A real user click must start the clip wherever the browser supports MP4.
            // Some Playwright Linux images lack proprietary codecs; report that limitation.
            const supportsMp4 = await video.evaluate(el => el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
            if (supportsMp4) {
              await page.getByRole('button', { name: 'Prehrať video zo škôlky' }).click();
              let played = false;
              try {
                await page.waitForFunction(() => {
                  const el = document.querySelector('video[poster]');
                  return Boolean(el && !el.paused && el.currentTime > 0.05);
                }, null, { timeout: 6000 });
                played = true;
              } catch {
                const state = await video.evaluate(async el => {
                  let status = 0;
                  let contentType = null;
                  try {
                    const response = await fetch(el.currentSrc || el.src, { method: 'HEAD' });
                    status = response.status;
                    contentType = response.headers.get('content-type');
                  } catch { /* browser route or network policy */ }
                  return {
                    currentTime: el.currentTime, paused: el.paused, readyState: el.readyState,
                    networkState: el.networkState, error: el.error?.code ?? null,
                    status, contentType,
                  };
                });
                if (state.error === 4 && state.status === 200 && state.contentType?.includes('video/mp4')) {
                  console.log('Video source HTTP/MIME valid, but ' + engine + ' CI image cannot decode MP4: ' + JSON.stringify(state) + ' (physical iOS browser unverified)');
                } else {
                  throw new Error('Daycare video failed after explicit tap: ' + JSON.stringify(state));
                }
              }
              if (played && await video.getAttribute('controls') === null)
                throw new Error('Native controls must appear after playback starts');
              if (played) await video.evaluate(el => el.pause());
            } else {
              console.log('Video playback codec unavailable in ' + engine + ' CI browser; DOM-only video controls checked');
            }
            await page.locator('section.hero-safe-top .hero-cta-primary:visible').first().click();
            await page.waitForTimeout(1100);
            const placement = await page.evaluate(() => ({
              formTop: document.getElementById('lead-form').getBoundingClientRect().top,
              reviewBottom: document.getElementById('recenzie').getBoundingClientRect().bottom,
              height: window.innerHeight,
            }));
            if (placement.formTop < 115 || placement.formTop > placement.height * 0.5 || placement.reviewBottom < 110)
              throw new Error('Hero interest CTA must scroll to form with reviews still visible: ' + JSON.stringify(placement));

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
            if (url.pathname === '/') {
              // The previous mobile CTA/modal was deliberately replaced by a
              // compact shared two-step form. Exercise both steps, without
              // submitting a production lead, instead of clicking dead UI.
              const inline = page.locator('#top [data-home-hero-inline-mobile] [data-lead-step-form]');
              if (!await inline.isVisible()) throw new Error('Mobile home inquiry form is not visible');
              const choices = inline.locator('label:has(input[name="zaujem"])');
              if (await choices.count() !== 3) throw new Error('Mobile home must retain all three interest choices');
              await choices.nth(1).click();
              await inline.getByRole('button', { name: 'Pokračovať', exact: true }).click();
              if (!await inline.locator('input[name="meno"]').isVisible() ||
                  !await inline.locator('input[name="telefon"]').isVisible())
                throw new Error('Mobile hero inline interest did not advance to contact step');
              await inline.getByRole('button', { name: 'Späť', exact: true }).click();
              if (!await choices.nth(1).locator('input[name="zaujem"]').isChecked())
                throw new Error('Mobile hero interest selection was lost on back');
            } else {
              const entry = (isAriaPage || isPuppyAria)
                ? page.locator('[data-aria-guide]').getByRole('button', { name: 'Mám záujem o škôlku' })
                : page.locator('.mobile-dock .mobile-dock-apply').first();
              await entry.click();
              if (url.pathname === '/psia-skolka-kosice/') {
              // Approved paid-LEAD section navigation: the bottom interest button
              // scrolls to the existing inline form, never opens an above-dock dialog.
              const inline = page.locator('#aria-hero-form');
              await inline.waitFor({ state: 'visible', timeout: 5000 });
              // An earlier synthetic, consented form submission in this same
              // browser case may have replaced the form with its success receipt.
              // Both are legitimate *in-page* states, unlike the retired modal.
              if (!await inline.locator('[data-lead-step-form], [data-lead-step-success]').count())
                throw new Error('Paid LEAD interest target is missing form or prior submission receipt');
              await page.waitForFunction(() => {
                const form = document.querySelector('#aria-hero-form')?.getBoundingClientRect();
                return Boolean(form && form.top >= -8 && form.top <= window.innerHeight - 32);
              }, null, {timeout: 4500});
              if (await page.getByRole('dialog').count() !== 0 ||
                  await page.locator('[data-aria-panel]').count() !== 0)
                throw new Error('Paid LEAD interest shortcut must scroll to inline form without a modal');
            } else {
            const modal = page.getByRole('dialog');
            await modal.waitFor({ state: 'visible' });
            if (!await modal.locator('[data-lead-step-form]').count())
              throw new Error('Mobile interest CTA must open guided enquiry modal');
            if (!url.pathname.startsWith('/en/')) {
              const leadForm = modal.locator('[data-lead-step-form]');
              const cards = leadForm.locator('label:has(input[name="zaujem"])');
              if (await cards.count() !== 3) throw new Error('Every normal SK inquiry must retain exactly three interest choices');
              await cards.nth(1).click();
              await leadForm.getByRole('button', { name: 'Pokračovať' }).click();
              if (!await leadForm.locator('[data-inquiry-dog-fields]').isVisible())
                throw new Error('Regular SK interest must show optional breed on this page: ' + url.pathname);
            }
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
              }
            }

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
            for (const route of ['/produkty/', '/blog/', '/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/']) {
              await productPage.goto(new URL(route, base).href);
              const brand = await productPage.evaluate(() => ({
                scoped:document.body.classList.contains('site-brand'),
                title:getComputedStyle(document.querySelector('h1')).color,
                text:getComputedStyle(document.body).getPropertyValue('--forest').trim(),
                overflow:document.documentElement.scrollWidth>innerWidth+1,
              }));
              if (!brand.scoped || brand.title!=='rgb(184, 46, 127)' || brand.text!=='#26322b' || brand.overflow)
                throw new Error('Shared product/blog brand regression: '+route+' '+JSON.stringify(brand));
            }
            for (const [route, action] of [['/stojan-na-misky-pre-psa', 'Mám záujem o stojan'], ['/target-na-cvicenie-pre-psov', 'Mám záujem o target']]) {
              await productPage.goto(new URL(route, base).href);
              await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});
              const consent = productPage.getByRole('button', { name: 'Len nevyhnutné', exact: true });
              if (await consent.isVisible()) await consent.click();
              if (!await productPage.locator('body.site-brand').count()) throw new Error('Product palette scope missing: '+route);
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
                // The mobile dock can hydrate before the product CTA handlers.
                // Wait for this component's own client-ready marker instead.
                await productPage.locator('[data-product-stand-cards][data-stand-cards-hydrated="true"]').waitFor({state:'attached',timeout:8000});
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
                const targetCards=productPage.locator('[data-target-variant-cards]');
                if (await targetCards.locator('article').count() !== 2)
                  throw new Error('Target must have exactly two stand-style size cards');
                if (width===390 && !(await targetCards.evaluate(el=>el.scrollWidth>el.clientWidth+30)))
                  throw new Error('Target size cards must swipe on mobile');
                const variants=[
                  {type:'large',label:'„Veľký“ verzia',size:'40 × 20 cm',photo:'Veľký drevený target'},
                  {type:'small',label:'„Malý“ verzia',size:'25 × 25 cm',photo:'Malý drevený target'},
                ];
                for (const variant of variants){
                  const card=targetCards.locator('article[data-target-size="'+variant.type+'"]');
                  const content=await card.textContent();
                  if (!content?.includes(variant.label) || !content.includes(variant.size)
                    || !content.includes('20 €')) throw new Error('Target size/card copy wrong: '+variant.type);
                  if (!(await card.locator('img').getAttribute('alt'))?.includes(variant.photo))
                    throw new Error('Target photo missing: '+variant.type);
                  const cardImageHeight=await card.locator('img').evaluate(el=>el.getBoundingClientRect().height);
                  if (cardImageHeight < 300)throw new Error('Target photo needs tall product style');
                  const photoPosition=await card.locator('img').evaluate(el=>getComputedStyle(el).objectPosition);
                  if (photoPosition !== (variant.type === 'small' ? '50% 100%' : '50% 49%'))
                    throw new Error('Target crop mismatch; small should reveal feet and large stay unchanged: '+variant.type+' '+photoPosition);
                  const badges=card.locator('[aria-label="Vlastnosti targetu"] span');
                  if (await badges.count()!==3)throw new Error('Target needs three photo badges');
                  const stars=card.locator('[data-target-decorative-stars] svg.lucide-star');
                  if (await stars.count()!==5 ||
                      !(await stars.first().getAttribute('class'))?.includes('fill-current'))
                    throw new Error('Target needs five filled decorative stars');
                  const textColor=await card.locator('[data-target-decorative-stars]').evaluate(el=>getComputedStyle(el).color);
                  if(textColor!=='rgb(233, 182, 0)')throw new Error('Target stars must be yellow');
                  const heading=card.locator('[data-target-card-heading]');
                  const [labelBounds,starBounds]=await Promise.all([heading.locator('p').boundingBox(),
                    heading.locator('[data-target-decorative-stars]').boundingBox()]);
                  if(!labelBounds||!starBounds||starBounds.x<=labelBounds.x+labelBounds.width||
                    Math.abs(starBounds.y-labelBounds.y)>9)
                    throw new Error('Target stars must align to right of variant label');
                  const version=heading.locator('p span').nth(1);
                  if (await version.textContent()!=='verzia' ||
                      await version.evaluate(el=>getComputedStyle(el).color)!=='rgb(24, 24, 24)')
                    throw new Error('Target version must be black');
                }
                if (width===1440){
                  const [a,b]=await Promise.all([
                    targetCards.locator('article').first().boundingBox(),
                    targetCards.locator('article').nth(1).boundingBox()]);
                  if(!a||!b||Math.abs(a.y-b.y)>5)
                    throw new Error('Desktop Target variants must share a horizontal row');
                }
                // Select the SMALL card and make sure the original wizard receives that size,
                // rather than resetting to its former default LARGE.
                await targetCards.locator('[data-target-size="small"]')
                  .getByRole('button',{name:/malý target/i}).click();
                const dlg=productPage.getByRole('dialog',{name:action});
                await dlg.waitFor({state:'visible'});
                if (await dlg.locator('[data-product-inquiry-steps][data-step="1"]').count() !== 1)
                  throw new Error('Target step 1 missing');
                const selected=dlg.locator('button[aria-pressed="true"]');
                if (!(await selected.innerText()).includes('Malý'))
                  throw new Error('Target small-card CTA did not select small variant');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="2"]').count() !== 1)
                  throw new Error('Target step 2 missing');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="3"]').count() !== 1)
                  throw new Error('Target contact step missing');
              }
              const formDialog = productPage.getByRole('dialog',{name:action});
              const locationInput=formDialog.locator('input[name="customer_location"]:not([type="hidden"])');
              if (!await formDialog.locator('input[name="customer_name"]').count()
                || !await formDialog.locator('input[name="email"]').count()
                || await locationInput.count()!==1)
                throw new Error('Original single product location field missing');
              if (await formDialog.locator('[type="checkbox"][required]').count() !== 1)
                throw new Error('Shared privacy-policy acknowledgement must remain mandatory');
              if (await formDialog.locator('input[name="delivery_street"], input[name="delivery_postal"], input[name="delivery_city"], input[name="delivery_mode"]').count())
                throw new Error('Do not add extra delivery fields or choices');
              const privacyTrigger=formDialog.getByRole('button',{name:'zásadami ochrany osobných údajov'});
              if (await privacyTrigger.count()!==1)
                throw new Error('Product and daycare must reuse same privacy-policy component');
              await locationInput.fill('Hlavná 12, Košice, 040 01');
              if (!await locationInput.evaluate(el=>el.checkValidity()) ||
                  await locationInput.getAttribute('required')===null ||
                  !(await locationInput.getAttribute('placeholder'))?.includes('Hlavná 12'))
                throw new Error('Single product address field must accept street, city and postal code');
              await locationInput.fill('Košice, 040 01');
              if (!await locationInput.evaluate(el=>el.checkValidity()))
                throw new Error('Legacy city/postal format must remain valid');
              await locationInput.fill('Hlavná 12, Košice, 040 01');
              await formDialog.getByRole('button',{name:'Ako je to s doručením?'}).click();
              const deliveryDialog=productPage.getByRole('dialog',{name:'Doprava a doručenie'});
              await deliveryDialog.waitFor({state:'visible'});
              for(const label of ['Košice','Zadarmo','Okolie Košíc a Prešov','5 €','Vzdialenejšie lokality','Individuálne']) {
                if(!await deliveryDialog.getByText(label,{exact:true}).isVisible()) throw new Error('Shipping option missing '+label);
              }
              await productPage.keyboard.press('Escape');
              await deliveryDialog.waitFor({state:'hidden'});
              if (width === 390) {
                for(const field of await formDialog.locator('input:visible:not([type="checkbox"]):not([type="radio"])').all()) {
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
            // LIVE CDN may deliver the image after the dialog opens. Await
            // image availability before testing visibility, not vice versa.
            await productPage.waitForFunction(() => document.querySelector('[data-stand-photo-viewport] img')?.naturalWidth>0, null, {timeout:7500});
            await articleLightbox.locator('img').first().waitFor({state:'visible',timeout:7500});
            if (await articleLightbox.getByText('Priblížte si fotografiu').count())
              throw new Error('Obsolete zoom instructions visible');
            if (await articleLightbox.getByRole('button',{name:'Priblížiť fotografiu'}).count() ||
                await articleLightbox.getByRole('button',{name:'Oddialiť fotografiu'}).count())
              throw new Error('Stand viewer must not show zoom buttons');
            const viewport=articleLightbox.locator('[data-stand-photo-viewport]');
            await articleLightbox.locator('[data-stand-photo-viewport][data-pinch-ready="true"]').waitFor({state:'attached'});
            if (await viewport.getAttribute('data-pinch-enabled')!=='true')
              throw new Error('Pinch-ready stand image viewport missing');
            if (await viewport.evaluate(el=>getComputedStyle(el).touchAction)!=='none')
              throw new Error('Touch viewport must allow custom pinch/pan');
            // Radix opens the dialog with a short zoom-in animation. Measure
            // the real 44px touch target only after the transition settles,
            // not midway while the entire modal is temporarily scaled.
            await productPage.waitForFunction(() => {
              const control=document.querySelector('[data-stand-photo-previous]');
              return !!control && control.getBoundingClientRect().width>=43.9;
            }, null, {timeout:3000});
            // It can cross the 43.9px threshold in the last animation frame.
            // Wait for the completed 100% transform before the strict 44px check.
            await productPage.waitForTimeout(350);
            const tinyNav = await articleLightbox.evaluate(el => {
              const photo=el.querySelector('[data-stand-photo-viewport]')?.getBoundingClientRect();
              const prev=el.querySelector('[data-stand-photo-previous]')?.getBoundingClientRect();
              const next=el.querySelector('[data-stand-photo-next]')?.getBoundingClientRect();
              const close=[...el.children].find(node => node.tagName==='BUTTON')?.getBoundingClientRect();
              return photo && prev && next ? {
                arrows:[prev.width,next.width],centers:[prev.top+prev.height/2,next.top+next.height/2],
                center:photo.top+photo.height/2,closeTop:close?.top,photoTop:photo.top
              } : null;
            });
            if (!tinyNav || tinyNav.arrows.some(w=>w<44||w>52) ||
                tinyNav.centers.some(y=>Math.abs(y-tinyNav.center)>14) ||
                (tinyNav.closeTop!==undefined && Math.abs(tinyNav.closeTop-tinyNav.photoTop)>26))
              throw new Error('Stand photo must keep centered accessible navigation at picture edges: '+JSON.stringify(tinyNav));
            const fluidPhoto = await articleLightbox.evaluate(el => {
              const vp=el.querySelector('[data-stand-photo-viewport]')?.getBoundingClientRect();
              const image=el.querySelector('[data-stand-photo-viewport] img');
              const im=image?.getBoundingClientRect();
              const frame=el.getBoundingClientRect(), caption=el.querySelector('[data-stand-photo-caption]')?.getBoundingClientRect();
              const buttons=[el.querySelector('[data-stand-photo-previous]'),el.querySelector('[data-stand-photo-next]'),[...el.children].find(b=>b.tagName==='BUTTON')];
              if(!vp || !im || !image || !caption || buttons.some(b=>!b)) return null;
              return {
                natural: image.naturalWidth>0 && image.naturalHeight>0,
                ratioError: Math.abs(im.width/im.height-image.naturalWidth/image.naturalHeight),
                emptyWidth: Math.abs(vp.width-im.width),emptyHeight:Math.abs(vp.height-im.height),
                symmetry:Math.abs(im.left-frame.left-(frame.right-im.right)),
                captionGap:caption.top-im.bottom,
                buttons:buttons.map(b=>({width:b.getBoundingClientRect().width,background:getComputedStyle(b).backgroundColor,radius:parseFloat(getComputedStyle(b).borderRadius)}))
              };
            });
            if (!fluidPhoto || !fluidPhoto.natural || fluidPhoto.ratioError>0.03 ||
                fluidPhoto.emptyWidth>3 || fluidPhoto.emptyHeight>3 || fluidPhoto.symmetry>4 ||
                fluidPhoto.captionGap<5 || fluidPhoto.captionGap>25 ||
                fluidPhoto.buttons.some(b=>b.width<44 || b.background!=='rgba(0, 0, 0, 0)' || b.radius>1))
              throw new Error('Product lightbox must fit image with symmetric padding, caption and bare 44px controls: '+JSON.stringify(fluidPhoto));
            if (width===390) {
              const startingSrc=await viewport.locator('img').getAttribute('src');
              await viewport.evaluate(el => {
                const emit=(name,touches,changed)=>{
                  const event=new Event(name,{bubbles:true,cancelable:true});
                  Object.defineProperty(event,'touches',{value:{length:touches.length,item:i=>touches[i]??null}});
                  Object.defineProperty(event,'changedTouches',{value:{length:changed.length,item:i=>changed[i]??null}});
                  el.dispatchEvent(event);
                };
                emit('touchstart',[{clientX:240,clientY:300}],[{clientX:240,clientY:300}]);
                emit('touchend',[],[{clientX:80,clientY:306}]);
              });
              await productPage.waitForFunction(src => document.querySelector('[data-stand-photo-viewport] img')?.getAttribute('src')!==src,startingSrc,{timeout:2500});
              await articleLightbox.locator('[data-stand-photo-previous]').click();
              await productPage.waitForFunction(src => document.querySelector('[data-stand-photo-viewport] img')?.getAttribute('src')===src,startingSrc,{timeout:2500});
            }
            if (width===390) {
              const pinch=await viewport.evaluate(el=>{
                // Browser-independent synthetic touch-list input: WebKit desktop
                // rejects the Touch constructor, even when touch handlers work.
                // Dispatch real event types with the TouchList shape our handlers use.
                const r=el.getBoundingClientRect(), y=r.y+r.height/2, x=r.x+r.width/2;
                const emit=(name,points)=>{
                  const touches={length:points.length,item:index=>points[index]??null};
                  const event=new Event(name,{bubbles:true,cancelable:true});
                  Object.defineProperty(event,'touches',{value:touches});
                  return el.dispatchEvent(event);
                };
                emit('touchstart',[{clientX:x-35,clientY:y},{clientX:x+35,clientY:y}]);
                emit('touchmove',[{clientX:x-100,clientY:y},{clientX:x+100,clientY:y}]);
                const zoomAfterMove=Number(el.dataset.zoom);
                emit('touchend',[]);
                return {zoomAfterMove,zoomAfterEnd:Number(el.dataset.zoom)};
              });
              if (!Number.isFinite(pinch.zoomAfterMove) || pinch.zoomAfterMove<=1.3 ||
                  pinch.zoomAfterEnd<=1.3)
                throw new Error('Two-finger stand image pinch must actually scale: '+JSON.stringify(pinch));
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
            // Canonical first-visit details now live in three always-visible
            // steps. Verify the adaptation copy, truthful-owner emphasis and
            // absence of the former duplicate disclosure instead of clicking
            // a deliberately deleted button.
            const intro = productPage.locator('#prva-navsteva');
            const introSteps = intro.locator('[data-first-visit-step]');
            if (await introSteps.count() !== 3 ||
                await intro.getByRole('button', { name: 'Zistite viac o úvodnej návšteve' }).count() !== 0 ||
                !await introSteps.nth(0).locator('strong').getByText('Pred nástupom do škôlky').count() ||
                !await introSteps.nth(1).locator('strong').getByText('2–3 kratšie návštevy').count() ||
                !await introSteps.nth(2).locator('strong').getByText(/pravdivo všetko/).count()) {
              throw new Error('Three first-visit steps must visibly cover adaptation and truthful owner details without duplicate FAQ');
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
              const conditionsDock = productPage.locator('.mobile-dock[data-variant="main"] a[href="/#podmienky"]');
               if (!await conditionsDock.isVisible()) throw new Error('Narrow dock must expose the new conditions shortcut');
               const narrowLabel = await conditionsDock.locator('span').last().boundingBox();
               const narrowItem = await conditionsDock.boundingBox();
               if (!narrowLabel || !narrowItem || narrowLabel.x < narrowItem.x - 1 || narrowLabel.x + narrowLabel.width > narrowItem.x + narrowItem.width + 1) {
                 throw new Error('Conditions label overflows its narrow dock button');
               }
              await productPage.setViewportSize({ width: 390, height: 844 });
              const actionRows=await catalog.locator('[data-product-actions]').evaluateAll(nodes=>
                nodes.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
              if (actionRows.length!==2 || Math.abs(actionRows[0].bottom-actionRows[1].bottom)>2)
                throw new Error('Product target and stand CTA rows must share bottom alignment: '+JSON.stringify(actionRows));
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
