const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// Run in CI, without submitting forms or emitting analytics traffic.
const bellaris = process.env.WEB_SITE === 'bellaris';
const { ARIA_ROUTES } = require('./public-web-impact.cjs');
const {readPublicContent}=require('./public-content-impact.cjs');
const runtimeScope = process.env.WEB_RUNTIME_SCOPE || 'full';
if(!['full','aria','aria-visual','navigation','content'].includes(runtimeScope)||bellaris&&runtimeScope!=='full')throw new Error('Invalid public web runtime scope');
const base = process.env.WEB_BASE_URL || (bellaris ? 'https://bellaris.sk' : 'https://chvostikovo.sk');
const fullRoutes = bellaris ? ['/', '/cennik/', '/postup/'] : ['/', '/psia-skolka-kosice/', '/psia-skolka-pre-steniatka/', '/strazenie-psov-kosice/', '/en/dog-daycare-kosice/', '/test-aria/'];
const urls = (runtimeScope === 'aria-visual' ? ['/psia-skolka-kosice/'] : runtimeScope === 'aria' ? ARIA_ROUTES : fullRoutes).map(route => new URL(route, base));
const brandPreviewCandidate = new URL(base).hostname === '127.0.0.1';
if(['aria-visual','navigation','content'].includes(runtimeScope)&&!brandPreviewCandidate)throw new Error('Visual assertions require a freshly built local candidate');
const out = process.env.RUNTIME_REPORT_DIR || 'runtime-report';
fs.mkdirSync(out, { recursive: true });
const results = [];
const failures = [];

// Optional independent engine runs. Default preserves the complete sequential
// suite for manual callers; invalid engine selection must fail closed.
const engineSelection = process.env.RUNTIME_ENGINE || "all";
const engines = [["chromium", chromium], ["webkit", webkit]];
if (!["all", "chromium", "webkit"].includes(engineSelection)) {
  throw new Error("Invalid RUNTIME_ENGINE: " + engineSelection);
}
const selectedEngines = engines.filter(([name]) => engineSelection === "all" || name === engineSelection);

// Fixed docks can cover WebKit's default nearest scroll target. Center only
// fixture interactions; keep actual pointer input and native validation.
function isPaidLeadFixture(page) { return new URL(page.url()).pathname==='/psia-skolka-kosice/'; }

async function centerFixtureControl(control) {
  await control.evaluate(async el=>{
    const result=el.scrollIntoView({block:'center',behavior:'instant'});
    if(result&&typeof result.then==='function')await result;
    await new Promise((resolve,reject)=>{
      const started=performance.now();let stableSince=started,last=null;
      const settle=now=>{
        if(!el.isConnected){reject(new Error('Fixture control detached while centering'));return;}
        const r=el.getBoundingClientRect(),current=[r.left,r.top,r.width,r.height,scrollX,scrollY];
        if(last&&current.some((value,index)=>Math.abs(value-last[index])>0.5))stableSince=now;
        last=current;
        if(now-stableSince>=150){resolve();return;}
        if(now-started>3000){reject(new Error('Fixture control did not settle before interaction'));return;}
        requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);
    });
  });
}

async function activateFixtureControl(control) {
  const page=control.page();
  // Native scroll triggered by Playwright's actionability check must not
  // race the site's smooth anchor scrolling. Scope the override to fixture
  // interaction only; keep real pointer input and native hit testing.
  const prior=await page.evaluate(()=>{
    const root=document.documentElement;
    const prior=[root.style.getPropertyValue('scroll-behavior'),root.style.getPropertyPriority('scroll-behavior')];
    root.style.setProperty('scroll-behavior','auto','important');
    return prior;
  });
  try {
    await centerFixtureControl(control);
    await control.evaluate(el=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=document.elementFromPoint(x,y);
      if(x<0||y<0||x>=innerWidth||y>=innerHeight||!hit||!el.contains(hit))
        throw new Error('Fixture touch target is outside the viewport or occluded: '+JSON.stringify({rect:r.toJSON(),hit:hit?.outerHTML?.slice(0,180)}));
    });
    // Let Playwright dispatch an actual touch action to the locator, not
    // stale viewport coordinates. Its actionability check must pass.
    if(await page.evaluate(()=>navigator.maxTouchPoints>0))await control.tap({timeout:5000});
    else await control.click({timeout:5000});
  }finally{
    await page.evaluate(([value,priority])=>{
      if(value)document.documentElement.style.setProperty('scroll-behavior',value,priority);
      else document.documentElement.style.removeProperty('scroll-behavior');
    },prior);
  }
}

// Exercise the actual visible radio and next button; settle scrolling before
// clicking so a moving viewport or fixed mobile dock cannot intercept it.
async function advanceLeadContact(form) {
  const choice=form.locator('label:has(input[name="zaujem"])').first();
  await activateFixtureControl(choice);
  await form.locator('input[name="zaujem"]').first().evaluate(el=>{
    if(!el.checked)throw new Error('Lead interest radio did not select');
  });
  const next=form.locator('button:not([disabled])').filter({hasText:/^Pokračovať$/});
  await next.waitFor({state:'visible',timeout:5000});
  await activateFixtureControl(next);
  await form.locator('[role="progressbar"][aria-valuenow="2"]').waitFor({state:'visible',timeout:5000}).catch(async error=>{
    const state=await form.evaluate(el=>({step:el.dataset.leadStep,section:el.closest('section')?.id,selected:!!el.querySelector('input[name="zaujem"]:checked'),rect:el.getBoundingClientRect().toJSON()}));
    throw new Error('Shared contact transition failed: '+JSON.stringify(state)+' '+String(error));
  });
  await form.locator('h3').filter({hasText:'Kontaktné údaje'}).waitFor({state:'visible',timeout:5000});
}

async function assertLeadContactIntro(form) {
  // Wait for the real React/CSS transition, especially on Safari WebKit.
  await form.getByRole('heading',{name:'Kontaktné údaje',exact:true}).waitFor({state:'visible',timeout:5000});
  if (await form.getAttribute('data-lead-step') !== '2' ||
      !await form.getByRole('heading', {name:'Kontaktné údaje', exact:true}).isVisible())
    throw new Error('Shared contact step must have its concise heading');
  const state=await form.evaluate(el=>{
    const shell=el.closest('[data-lead-form-shell]');
    const intro=shell?[...shell.querySelectorAll(':scope > [data-lead-form-intro]')]:[];
    const modalIntro=shell?.querySelector(':scope > [data-lead-dialog-intro]');
    const title=shell?.getAttribute('aria-labelledby');
    return {shell:!!shell, hidden:intro.every(node=>getComputedStyle(node).display==='none'),
      modal:!modalIntro||(modalIntro.getBoundingClientRect().height<=1&&!!document.getElementById(title)?.textContent)};
  });
  if(!state.shell||!state.hidden||!state.modal)throw new Error('Shared form introduction remains in contact layout: '+JSON.stringify(state));
}


// Shared public cookie styling and actual choice callbacks; no external writes.
async function assertCookieBrandSurface(page) {
  const dialog=page.locator('[data-cookie-consent][role="dialog"]');
  await dialog.locator('[data-aria-cookie-head]').evaluate(image=>image.decode());
  await dialog.locator('[data-cookie-action="accept"]').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
  const state=await dialog.evaluate(el=>{
    const panel=el.querySelector('[data-cookie-panel]'),actions=el.querySelector('[data-cookie-actions]');
    const accept=actions.querySelector('[data-cookie-action="accept"]'),necessary=actions.querySelector('[data-cookie-action="necessary"]'),customize=actions.querySelector('[data-cookie-action="customize"]');
    const a=accept.getBoundingClientRect(),n=necessary.getBoundingClientRect(),c=customize.getBoundingClientRect(),p=panel.getBoundingClientRect(),image=el.querySelector('[data-aria-cookie-head]');
    return {inside:p.left>=0&&p.right<=innerWidth+1&&p.top>=0&&p.bottom<=innerHeight+1,
      layout:Math.abs(a.left-n.left)<2&&Math.abs(a.right-c.right)<2&&Math.abs(n.top-c.top)<2&&n.top>=a.bottom+5&&n.right<c.left&&Math.abs(n.width-c.width)<2,
      targets:[a.height,n.height,c.height].every(h=>h>=44),overflow:panel.scrollWidth>panel.clientWidth+1,
      orange:getComputedStyle(accept).backgroundColor,dark:getComputedStyle(accept).color,pink:getComputedStyle(customize).backgroundColor,
      portrait:image.naturalWidth>=400&&image.naturalHeight>=400&&image.src.includes('aria-assistant-head-lead-')};
  });
  if(!state.inside||!state.layout||!state.targets||state.overflow||!state.portrait||!(state.orange==='rgb(255, 164, 20)'&&state.dark==='rgb(38, 50, 43)'||state.orange==='rgb(184, 46, 127)'&&state.dark==='rgb(255, 255, 255)')||state.pink!=='rgb(248, 221, 235)')throw new Error('Shared cookie brand/layout: '+JSON.stringify(state));
}

async function assertCookieChoices(page) {
  const dialog=page.locator('[data-cookie-consent][role="dialog"]');
  const open=async()=>{await page.evaluate(()=>window.dispatchEvent(new Event('chvostikovo-open-cookie-settings')));await dialog.waitFor({state:'visible'});};
  const assertChoices=async expected=>{
    const state=await dialog.getByRole('switch').evaluateAll(es=>es.map(e=>({checked:e.getAttribute('aria-checked')==='true',disabled:e.disabled})));
    if(state.length!==4||!state[0].checked||!state[0].disabled||state.slice(1).some((s,i)=>s.disabled||s.checked!==expected[i]))throw new Error('Cookie choices changed: '+JSON.stringify(state));
  };
  await open();await assertChoices([false,false,false]);
  await activateFixtureControl(dialog.getByRole('switch',{name:'Funkčné',exact:true}));
  await activateFixtureControl(dialog.locator('[data-cookie-action="customize"]'));
  await dialog.waitFor({state:'hidden'});
  await open();await assertChoices([true,false,false]);
  await activateFixtureControl(dialog.locator('[data-cookie-action="accept"]'));
  await dialog.waitFor({state:'hidden'});
  await open();await assertChoices([true,true,true]);
  await activateFixtureControl(dialog.locator('[data-cookie-action="necessary"]'));
  await dialog.waitFor({state:'hidden'});
  await open();await assertChoices([false,false,false]);
  await activateFixtureControl(dialog.locator('[data-cookie-action="necessary"]'));
  await dialog.waitFor({state:'hidden'});
}

// Campaign content-flow contract: preserve the shared cookie/funnel/widget checks,
// replace only the superseded section-order and hidden-form assertions below.
// Reuse the TEST chat on paid LEAD; verify only the new route wiring with isolated transports.
async function assertHeroAriaEntry(page) {
  const cta=page.locator('[data-aria-lead-hero-cta]');
  if((await cta.innerText()).trim()!=='Spoznajte našu škôlku'||await cta.getAttribute('aria-controls')!=='lead-pricing'||await cta.getAttribute('aria-haspopup'))throw new Error('Paid Hero CTA label or section semantics');
  await activateFixtureControl(cta);
  await page.waitForFunction(()=>{const r=document.getElementById('lead-pricing')?.getBoundingClientRect();return r&&r.top>=-2&&r.top<130;},null,{timeout:5000});
  if(await page.locator('[data-aria-chat]').isVisible())throw new Error('Paid Hero CTA must navigate without opening chat');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>scrollY<5);
}
async function assertPaidAriaAdEntry(page, freshConsent=false) {
  const url=new URL('/psia-skolka-kosice/?aria=open&utm_source=fixture&utm_campaign=aria&utm_content=aria_visual',base);
  if(freshConsent)url.searchParams.set('fixture_fresh','1');
  await page.goto(url.href,{waitUntil:'domcontentloaded'});
  const chat=page.locator('[data-aria-chat]');
  if(freshConsent){
    const cookies=page.locator('[data-cookie-consent][role="dialog"]');
    await cookies.waitFor({state:'visible'});
    if(await chat.isVisible())throw new Error('Aria ad entry must wait for cookie choice');
    await activateFixtureControl(cookies.locator('[data-cookie-action="necessary"]'));
    await cookies.waitFor({state:'hidden'});
  }
  await chat.waitFor({state:'visible',timeout:8000});
  if(!await page.evaluate(search=>location.search===search,url.search))throw new Error('Aria ad entry lost attribution query');
  await chat.getByRole('button',{name:'Close',exact:true}).click();
  await chat.waitFor({state:'hidden'});
  await page.evaluate(()=>window.dispatchEvent(new Event('chvostikovo-consent-changed')));
  await page.waitForTimeout(250);
  if(await chat.isVisible())throw new Error('Closed ad chat must not reopen on repeated consent event');
}
async function assertPaidAriaChat(page, {visualOnly=false}={}) {
  const posted=[];
  let failNext=false;
  const handler=async route=>{
    const headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
    if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    const data=route.request().postDataJSON();
    if(data.cta_source)posted.push(data);
    if(failNext && data.cta_source){failNext=false;await route.fulfill({status:500,contentType:'application/json',headers,body:'{"ok":false}'});return;}
    await route.fulfill({status:200,contentType:'application/json',headers,body:'{"ok":true}'});
  };
  if(!visualOnly)await page.route('**/functions/v1/web-form-submit',handler);
  try {
    const marketingAllowed=!visualOnly && await page.evaluate(()=>{
      let consent=null,storageAvailable=false;
      try { consent=localStorage.getItem('chvostikovo-cookies');storageAvailable=true; } catch { /* Preserve the blocked-storage scenario. */ }
      window.__ariaMetaAudit={consent,storageAvailable,fbq:window.fbq,calls:[]};
      window.fbq=(...args)=>window.__ariaMetaAudit.calls.push(args);
      if(storageAvailable){
        localStorage.setItem('chvostikovo-cookies',JSON.stringify({version:'2026-10-03-v2',savedAt:new Date().toISOString(),necessary:true,functional:false,analytics:false,marketing:true}));
        window.dispatchEvent(new CustomEvent('chvostikovo-consent-changed'));
      }
      return storageAvailable;
    });
    await assertHeroAriaEntry(page);
    if(!visualOnly){
      const audit=await page.evaluate(()=>window.__ariaMetaAudit.calls);
      const hero=audit.filter(call=>call[0]==='trackCustom'&&call[1]==='HeroLearnMore'&&call[2]?.source==='lead_landing_hero_aria_cta');
      if(hero.length!==(marketingAllowed?1:0)||audit.some(call=>call[0]==='track'&&call[1]==='Lead'))throw new Error('Hero Pricing click must be a consented custom event, never Meta Lead');
      if(posted.length)throw new Error('Opening chat must not submit a form');
    }
    const trigger=page.locator('[data-aria-lead-chat] [data-aria-chat-trigger]');
    const launcher=page.locator('[data-aria-lead-chat] [data-aria-bubble-question="pricing"]');
    // Use the same settled native touch/mouse fixture as the Hero entry.
    await activateFixtureControl(launcher);
    const chat=page.locator('[data-aria-chat]');
    await chat.waitFor({state:'visible',timeout:1500});
    const surface=await chat.evaluate(el=>({background:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).getPropertyValue('backdrop-filter')||getComputedStyle(el).getPropertyValue('-webkit-backdrop-filter')}));
    if(surface.background!=='rgba(255, 255, 255, 0.82)'||!surface.blur.includes('blur'))throw new Error('Paid chat must retain its lighter frosted surface');
    if(!await chat.locator('[data-aria-chat-status]').getByText('Labky na klávesnici').count())throw new Error('Paid chat presence label missing');
    if(await trigger.evaluate(el=>getComputedStyle(el).backgroundColor)!=='rgba(0, 0, 0, 0)')throw new Error('Expanded portrait inherited a colored navigation background');
    await chat.locator('[data-aria-chat-turn="person"]').getByText('Aký je cenník škôlky?',{exact:true}).waitFor({state:'visible'});
    const greeting=(await chat.locator('[id$="-intro"] > [aria-hidden="true"]').innerText()).replace(/\s+/g,' ').trim();
    if(greeting!=='Ahoj, volám sa Aria. Čo ťa zaujíma o našej škôlke?')throw new Error('Paid direct chat must show the full greeting without Haf');
    const typing=chat.locator('[data-aria-typing="true"]');
    await typing.locator('[data-aria-composing]').waitFor({state:'visible',timeout:2500});
    if(!await typing.locator('.aria-composing-dot').first().evaluate(el=>el.getAnimations().some(a=>a.playState==='running')))throw new Error('Paid composing dots are static');
    if(await typing.locator('.aria-composing-dot').evaluateAll(es=>new Set(es.map(e=>getComputedStyle(e).animationDelay)).size)!==3)throw new Error('Paid composing dots must animate in sequence');
    await page.waitForFunction(()=>{const t=document.querySelector('[data-aria-typing="true"]');return (t?.querySelector('[aria-hidden="true"]')?.textContent?.length||0)>12;},null,{timeout:5000});
    if(await chat.locator('[data-aria-chat-questions]').count())throw new Error('Paid FAQ exposed while typing');
    await chat.locator('[data-aria-chat-question="pricing"]').waitFor({state:'detached'});
    await chat.locator('[data-aria-chat-questions]').waitFor({state:'visible',timeout:20000});
    if(await chat.locator('[data-aria-chat-question]').count()!==4||!(await chat.innerText()).includes('20 €/deň'))throw new Error('Paid chat must reuse pricing answer and refill four FAQ');
    if(visualOnly){
      await chat.locator('[data-aria-chat-interest-cta]').click();
      const widget=chat.locator('[data-aria-chat-inline="interest"]');
      await widget.waitFor({state:'visible',timeout:20000});
      const viewport=page.viewportSize();
      for(const width of [320,390,1280]){
        await page.setViewportSize({width,height:844});
        await widget.evaluate(el=>el.getBoundingClientRect());
        const geometry=await widget.evaluate(el=>{
          const history=el.closest('[data-aria-chat-history]'),r=el.getBoundingClientRect(),h=history.getBoundingClientRect(),s=getComputedStyle(history);
          const left=h.left+history.clientLeft+parseFloat(s.paddingLeft),right=h.left+history.clientLeft+history.clientWidth-parseFloat(s.paddingRight);
          return {leftGap:r.left-left,rightGap:right-r.right,overflow:history.scrollWidth-history.clientWidth,widgetOverflow:el.scrollWidth-el.clientWidth,width:r.width};
        });
        if(Math.abs(geometry.leftGap)>2||Math.abs(geometry.rightGap)>2||geometry.overflow>2||geometry.widgetOverflow>2)throw new Error('Paid Aria inline card must fill chat at '+width+': '+JSON.stringify(geometry));
      }
      await page.setViewportSize(viewport);
      await chat.getByRole('button',{name:'Close',exact:true}).click();
      await chat.waitFor({state:'hidden'});
      await page.locator('[data-aria-bubble-question="requirements"]').click();
      await chat.locator('[data-aria-chat-requirements] article').first().waitFor({state:'visible',timeout:20000});
      if(await chat.locator('[data-aria-chat-requirements] article').count()!==4||await chat.locator('[data-aria-chat-question]').count()!==4)throw new Error('Requirements quick launcher must reuse the canonical cards and refill questions');
      await chat.getByRole('button',{name:'Close',exact:true}).click();
      await chat.waitFor({state:'hidden'});return;
    }
    await chat.locator('[data-aria-chat-other-cta]').click();
    const other=chat.locator('[data-aria-chat-other]');
    const question=other.locator('textarea[name="otazka"]');
    await question.waitFor({state:'visible'});
    await question.fill('Aké sú možnosti pre dvoch psíkov?');
    await other.getByRole('button',{name:'Pokračovať',exact:true}).click();
    await other.locator('input[name="meno"]').fill('Test Otázka');
    await other.locator('input[name="telefon"]').fill('+421901234567');
    await other.locator('input[name="email"]').fill('test@example.invalid');
    await other.locator('input[type="checkbox"]').check();
    await other.getByRole('button',{name:'Poslať',exact:true}).click();
    await other.locator('[data-home-faq-contact-success]').waitFor({state:'visible'});
    if(posted.length!==1||posted[0].cta_source!=='lead_landing_aria_chat_other'||posted[0].raw_payload?.['Otázka návštevníka']!=='Aké sú možnosti pre dvoch psíkov?')throw new Error('Paid question must retain the existing CRM contact source and text');
    if(await page.evaluate(()=>window.__ariaMetaAudit.calls.some(call=>call[0]==='track'&&call[1]==='Lead')))throw new Error('A plain chat question emitted a paid Lead');
    await chat.locator('[data-aria-chat-interest-cta]').click();
    const interest=chat.locator('[data-aria-chat-interest]');
    const form=interest.locator('[data-lead-step-form]');
    await advanceLeadContact(form);
    await form.locator('input[name="meno"]').fill('Test Záujem');
    await form.locator('input[name="plemeno"]').fill('Írsky vlkodav');
    await form.locator('input[name="telefon"]').fill('+421901234567');
    await form.locator('input[name="email"]').fill('test@example.invalid');
    await form.locator('input[type="checkbox"]').check();
    failNext=true;
    await form.getByRole('button',{name:'Odoslať záujem',exact:true}).click();
    await form.locator('[role="alert"]').waitFor({state:'visible'});
    if(await page.evaluate(()=>window.__ariaMetaAudit.calls.some(call=>call[0]==='track'&&call[1]==='Lead')))throw new Error('Failed chat interest emitted a Meta Lead');
    await form.getByRole('button',{name:'Odoslať záujem',exact:true}).click();
    await interest.locator('[data-lead-step-success]').waitFor({state:'visible'});
    if(await interest.locator('[data-lead-success-links]').count()||!await interest.getByText('Je toto telefónne číslo správne?').count()||await chat.locator('[data-aria-chat-followup-prompt]').count())throw new Error('Chat receipt must retain phone verification without page links or repeat prompt');
    if(posted.length!==3||posted[2].cta_source!=='lead_landing_aria_chat_interest'||posted[2].marketing_consent!==marketingAllowed)throw new Error('Paid chat source/consent: '+JSON.stringify(posted.map(p=>({source:p.cta_source,marketing:p.marketing_consent}))));
    const meta=await page.evaluate(()=>window.__ariaMetaAudit.calls.filter(call=>call[0]==='track'&&call[1]==='Lead'));
    if(marketingAllowed ? meta.length!==1||meta[0][3]?.eventID!==posted[2].meta_event_id : meta.length!==0)throw new Error('Chat Meta success must preserve consent and the server deduplication ID');
    await chat.getByRole('button',{name:'Close',exact:true}).click();
    await chat.waitFor({state:'hidden'});
    await trigger.click();
    await chat.waitFor({state:'visible'});
    if(await chat.locator('[data-aria-chat-inline]').count()!==2||!(await chat.innerText()).includes('20 €/deň'))throw new Error('Paid chat must preserve conversation history on reopen');
    const originalReduced=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
    await page.emulateMedia({reducedMotion:'reduce'});
    const calmerQuestion=chat.locator('[data-aria-chat-question="caretakers"]');
    await calmerQuestion.waitFor({state:'visible',timeout:10000});await calmerQuestion.click();
    const calmer=chat.locator('[data-aria-typing="true"]');
    await calmer.locator('.aria-composing-dot').first().waitFor({state:'visible'});
    if(await calmer.locator('.aria-composing-dot').first().evaluate(el=>getComputedStyle(el).animationName)!=='aria-composing-fade')throw new Error('Reduced-motion dots must use a gentle non-spatial pulse');
    await page.waitForFunction(()=>{const e=document.querySelector('[data-aria-chat-lead] [data-aria-typing="true"] [aria-hidden="true"]');return (e?.textContent?.length||0)>12;},null,{timeout:5000});
    const firstLength=await calmer.evaluate(el=>el.querySelector('[aria-hidden="true"]')?.textContent?.length||0);
    await page.waitForFunction(previous=>{const e=document.querySelector('[data-aria-chat-lead] [data-aria-typing="true"] [aria-hidden="true"]');return (e?.textContent?.length||0)>previous;},firstLength,{timeout:5000});
    await calmer.waitFor({state:'detached',timeout:20000});
    await page.emulateMedia({reducedMotion:originalReduced?'reduce':'no-preference'});
    await chat.getByRole('button',{name:'Close',exact:true}).click();
    await chat.waitFor({state:'hidden'});
  } finally {
    if(!visualOnly)await page.unroute('**/functions/v1/web-form-submit',handler);
    await page.evaluate(()=>{
      const audit=window.__ariaMetaAudit;if(!audit)return;
      if(audit.storageAvailable){
        if(audit.consent===null)localStorage.removeItem('chvostikovo-cookies');else localStorage.setItem('chvostikovo-cookies',audit.consent);
        window.dispatchEvent(new CustomEvent('chvostikovo-consent-changed'));
      }
      window.fbq=audit.fbq;delete window.__ariaMetaAudit;
    });
  }
}

async function assertPaidReturnArrow(page) {
  // Paid-only scroll shortcut: same-document scroll, no chat open or CTA conversion.
  await page.setViewportSize({width:390,height:844});
  const back=page.locator('[data-aria-back-top]');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await back.waitFor({state:'hidden'});
  await page.waitForFunction(()=>window.scrollY<5);
  await page.evaluate(()=>window.scrollTo({top:650,behavior:'instant'}));
  await page.waitForFunction(()=>window.scrollY>160);
  await back.waitFor({state:'visible',timeout:4000}).catch(async error=>{throw new Error('Paid arrow idle visibility: '+JSON.stringify(await back.evaluate(el=>({scrollY,innerWidth,visible:el.dataset.visible,disabled:el.disabled,visibility:getComputedStyle(el).visibility,dialog:!!document.querySelector('[data-form-dialog], [role="dialog"][data-state="open"]')}))),{cause:error});});
  const arrowGeometry=await back.evaluate(el=>{const a=el.getBoundingClientRect(),p=document.querySelector('[data-aria-chat-trigger]').getBoundingClientRect();return a.height>=44&&a.width>=44&&a.bottom<=p.top-4&&Math.abs(a.left-p.left)<=2&&a.top>=0;});
  if(!arrowGeometry)throw new Error('Return arrow must sit above Aria without covering her');
  await page.evaluate(()=>window.scrollTo({top:450,behavior:'instant'}));
  await page.waitForFunction(()=>Math.abs(scrollY-450)<8);
  await back.waitFor({state:'visible'});
  // Fixed shortcut must be hit directly without centering/scrolling the document.
  const hit=await back.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;if(el.disabled||!el.contains(document.elementFromPoint(x,y)))throw new Error('Aria return arrow is occluded or disabled');return {x,y};});
  const prior=await page.evaluate(()=>({search:location.search,path:location.pathname}));
  if(await page.evaluate(()=>navigator.maxTouchPoints>0))await page.touchscreen.tap(hit.x,hit.y);else await page.mouse.click(hit.x,hit.y);
  await page.waitForFunction(()=>window.scrollY<5,null,{timeout:5000}).catch(async error=>{throw new Error('Paid return click did not reach top: '+JSON.stringify(await page.evaluate(()=>({scrollY,hash:location.hash,visible:document.querySelector('[data-aria-back-top]')?.dataset.visible}))),{cause:error});});
  if(!await page.evaluate(p=>location.search===p.search&&location.pathname===p.path&&!location.hash,prior))throw new Error('Arrow must preserve attribution and route');
  await back.waitFor({state:'hidden'});
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>window.scrollTo({top:650,behavior:'instant'}));
  await page.waitForFunction(()=>scrollY>160);
  if(await back.isVisible())throw new Error('Paid arrow must stay hidden on desktop');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>scrollY<5);
  if(await page.locator('[data-aria-chat-trigger]').getAttribute('aria-expanded')!=='false')throw new Error('Return arrow must not open chat');

}
async function assertPaidReturnNavigation(browser,engine) {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try {
    await context.addInitScript(()=>{if(new URLSearchParams(location.search).has('fixture_fresh'))localStorage.removeItem('chvostikovo-cookies');else localStorage.setItem('chvostikovo-cookies',JSON.stringify({version:'2026-10-03-v2',savedAt:new Date().toISOString(),necessary:true,functional:false,analytics:false,marketing:false}));});
    await context.route('**/*',route=>{const req=route.request(),u=new URL(req.url());return u.origin===new URL(base).origin&&['GET','HEAD'].includes(req.method())?route.continue():route.abort();});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(new URL('/psia-skolka-kosice/?utm_source=fixture&utm_campaign=arrow',base).href,{waitUntil:'domcontentloaded'});
    if(response?.status()!==200)throw new Error('Paid LEAD HTTP '+response?.status());
    await page.locator('[data-aria-speech] [data-aria-tail]').waitFor({state:'attached'});
    const cookie=page.getByRole('button',{name:/Len nevyhnutné|Odmietnuť/}).first();
    if(await cookie.isVisible())await cookie.click();
    await page.evaluate(()=>history.replaceState(history.state,'',location.pathname+location.search+'#lead-pricing'));
    await assertPaidReturnArrow(page);
    const interest=page.locator('[data-aria-bubble-interest-cta]');
    const requirements=page.locator('[data-aria-bubble-question="requirements"]');
    await requirements.waitFor({state:'visible'});
    await page.evaluate(()=>{const h=document.querySelector('main > section.hero-safe-top');scrollTo({top:scrollY+h.getBoundingClientRect().bottom+60,behavior:'instant'});});
    await interest.waitFor({state:'visible'});
    if(await requirements.isVisible()||await interest.innerText()!=='Mám záujem')throw new Error('Paid launcher must replace only the requirements choice after Hero');
    const style=await interest.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color,h:el.getBoundingClientRect().height}));
    if(style.bg!=='rgb(255, 164, 20)'||style.fg!=='rgb(255, 255, 255)'||style.h<44)throw new Error('Paid interest button styling/tap target '+JSON.stringify(style));
    await activateFixtureControl(interest);
    const modal=page.locator('[data-form-dialog]');
    await modal.waitFor({state:'visible'});
    await modal.locator('[data-lead-step-form]').waitFor({state:'visible'});
    if(await page.locator('[data-aria-chat]').isVisible())throw new Error('Interest must open direct form instead of chat');
    await page.keyboard.press('Escape');
    await modal.waitFor({state:'hidden'});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await requirements.waitFor({state:'visible'});
    if(await interest.isVisible())throw new Error('Return to Hero must restore original questions');
    await assertPaidAriaAdEntry(page);
    await assertPaidAriaAdEntry(page,true);
    // Explicit UA fixtures: standalone Safari changes only the photo focal points; Meta in-app retains them.
    for (const [ua, safari] of [['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',true],['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 [FBAN/FBIOS;FBAV/500.0]',false],['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 Instagram 350.0',false]]) {
      const fixture=await context.newPage();
      try {
        fixture.on('pageerror',e=>errors.push(e.message));
        await fixture.addInitScript(value=>Object.defineProperty(navigator,'userAgent',{get:()=>value,configurable:true}),ua);
        await fixture.goto(new URL('/psia-skolka-kosice/',base).href,{waitUntil:'domcontentloaded'});
        await fixture.locator('[data-aria-speech] [data-aria-tail]').waitFor({state:'attached'});
        await fixture.waitForFunction(value=>Boolean(document.querySelector('[data-lead-ios-safari]'))===value,safari);
        const positions=await fixture.locator('[data-lead-hero-photo] img').evaluateAll(imgs=>imgs.map(img=>getComputedStyle(img).objectPosition));
        if(JSON.stringify(positions)!==JSON.stringify(safari?['50% 30%','50% 18%']:['50% 58%','50% 58%']))throw new Error('Safari-only crop regression '+JSON.stringify(positions));
      } finally { await fixture.close(); }
    }
    if(errors.length)throw new Error('Paid navigation runtime errors: '+errors.join('; '));
    console.log('PASS paid LEAD mobile return arrow and desktop absence '+engine);
  }finally{await context.close();}
}

// Exercise a real lazy-loaded image only after the existing first-fold checks.
async function assertArrivalImage(map) {
  if((await map.innerText()).trim()!=='Otvoriť v Google Maps')throw new Error('Arrival map action label');
  const img=map.locator('img');
  await img.scrollIntoViewIfNeeded({timeout:10000});
  // A lazy image may temporarily report complete before a source is selected.
  // Wait for actual pixels rather than calling decode() during that race.
  await map.page().waitForFunction(el=>el.complete&&el.naturalWidth>0,
    await img.elementHandle({timeout:5000}),{timeout:10000}).catch(async error=>{
      const state=await img.evaluate(el=>({src:el.getAttribute('src'),currentSrc:el.currentSrc,complete:el.complete,width:el.naturalWidth,height:el.naturalHeight,rect:el.getBoundingClientRect().toJSON()}));
      throw new Error('Arrival image did not load: '+JSON.stringify(state),{cause:error});
    });
  return img.evaluate(el=>el.naturalWidth===1536&&el.naturalHeight===1024);
}

async function assertCampaignContentFlow(page, {visualOnly=false,trackedEvents=null}={}) {
  await page.locator('[data-aria-lead-chat] img[alt^="Aria"]').evaluate(async image=>{
    await image.decode();
    if(image.naturalWidth<400||image.naturalHeight<400)throw new Error("Paid Aria must use the approved high-resolution head");
  });
  const expected=readPublicContent();
  const structure=await page.evaluate(expected=>({
    order:[...document.querySelector('main').children].map(el=>el.id),
    faq:[...document.querySelectorAll('[data-lead-faq]')].map(el=>el.dataset.leadFaq),
    forms:document.querySelectorAll('main [data-lead-step-form]').length,
    benefits:document.querySelectorAll('[data-lead-benefits] h3').length,
    requirements:document.querySelectorAll('#lead-requirements article').length,
    carousel:document.querySelectorAll('#lead-photo-carousel [data-gesture-track="photos"]').length,
    checker:document.querySelector('#lead-knowledge')?.nextElementSibling?.id === 'aria-puppy-check',
    faqLast:document.querySelector('main')?.lastElementChild?.id === 'lead-faq',
    health:document.querySelector('#lead-requirements')?.textContent.includes(expected.health),
    mapLinks:[...document.querySelectorAll('#aria-mosaic a[href*="maps"], footer a[href*="maps"]')].map(a=>a.getAttribute('href')),
    inquiryHeadings:document.querySelector('#aria-hero-form h2')?.textContent.trim()===expected.INQUIRY_TITLE && document.querySelector('#lead-friendship-form h3')?.textContent.trim()===expected.INQUIRY_TITLE,
    inquirySubtitles:['#aria-hero-form','#lead-friendship-form'].every(id=>document.querySelector(id+' p[data-lead-form-intro], '+id+' [data-lead-form-intro] p')?.textContent.trim()===expected.INQUIRY_SUBTITLE),
    separated:!!document.querySelector('#lead-knowledge [data-lead-faq-cta]') && !document.querySelector('#lead-knowledge #lead-faq'),
    robots:document.querySelector('meta[name="robots"]')?.content,
    daily:document.querySelector('[data-lead-price-per-day]')?.textContent.replace(/\s+/g,' ').trim(),
    single:document.querySelector('#lead-pricing article')?.textContent,
  }),expected);
  if(structure.order.filter(id=>expected.order.includes(id)).join('|')!==expected.order.join('|')||
    structure.faq.join('|')!=='eligibility|supervision|first-visit|first-group|taxi|puppies'||structure.forms!==2||structure.benefits!==3||structure.requirements!==4||
    structure.carousel!==1||!structure.checker||!structure.faqLast||!structure.health||!structure.inquiryHeadings||!structure.inquirySubtitles||structure.mapLinks.length<2||structure.mapLinks.some(link=>link!==expected.MAP_LINK)||structure.robots!=='noindex, follow'||!structure.separated||structure.daily!=='20 € / deň'||
    structure.single.includes('10 vstupov')||!structure.single.includes('Pondelok – piatok'))throw new Error('Campaign content structure: '+JSON.stringify(structure));
  const arrival=page.locator('#aria-mosaic [data-daycare-arrival-map]');
  if(await arrival.getAttribute('href')!==expected.MAP_LINK)throw new Error('Campaign arrival map link');
  const locationBlock=page.locator('#aria-mosaic [data-daycare-location-copy]');
  const locationCopy=await locationBlock.innerText();
  const boldLocations=await locationBlock.locator('strong').allTextContents();
  if(await locationBlock.locator('p').count()!==3||JSON.stringify(boldLocations)!==JSON.stringify(['Poľskej 6','Starou nemocnicou a Verejným cintorínom','ulice Rastislavova pri autoumyvárke','zastávka Poľská','autobusy 12 a 54']))throw new Error('Location emphasis or paragraph structure');
  if(!['Poľskej 6','Rastislavova','autoumyvárke','12 a 54'].every(value=>locationCopy.includes(value))||locationCopy.includes('bezplatné parkovisko')||!(await page.locator('[data-aria-location-chips]').textContent()).includes('Bezplatné parkovanie'))throw new Error('Campaign location copy or parking chip');
  for(const [width,height] of [[320,720],[360,780],[375,667],[390,740],[430,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1864,891]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(160);
    const fold=await page.evaluate(()=>{
      const box=s=>{
        const node=document.querySelector(s);if(!node)return;
        if(getComputedStyle(node).display!=='contents')return node.getBoundingClientRect();
        const children=[...node.children].map(e=>e.getBoundingClientRect());
        const left=Math.min(...children.map(r=>r.left)),right=Math.max(...children.map(r=>r.right)),top=Math.min(...children.map(r=>r.top)),bottom=Math.max(...children.map(r=>r.bottom));
        return {left,right,top,bottom,width:right-left,height:bottom-top};
      };
      const title=box('main h1'),pills=box('[data-lead-hero-pills]'),photos=box('[data-lead-hero-photos]'),cta=box('[data-aria-lead-hero-cta]'),proof=box('#recenzie h2');
      const aria=box('[data-aria-message]'),dock=box('[data-aria-dock]'),face=box('[data-aria-dock] img[alt^="Aria"]');
      const visiblePills=[...document.querySelectorAll('[data-lead-hero-pill]')].filter(el=>getComputedStyle(el).display!=='none');
      const elements=[title,pills,photos,cta,proof];
      return {overflow:document.documentElement.scrollWidth>innerWidth+1,
        visible:elements.every(r=>r&&r.width>0&&r.top>=0&&r.bottom<=Math.min(aria.top,face.top,dock.top)+1),
        desktop:(()=>{if(innerWidth<1024)return true;
          const images=[...document.querySelectorAll('[data-lead-hero-photo]')].map(e=>e.getBoundingClientRect()),service=box('[data-aria-service-group]');
          const [a,b]=images;
          return images.length===2&&service.bottom<=title.top&&title.bottom<=photos.top&&
            Math.abs(a.top-b.top)<2&&Math.abs(a.bottom-b.bottom)<2&&Math.abs(a.width-b.width)<2&&a.right<b.left&&
            photos.bottom<=pills.top&&pills.bottom<=cta.top&&cta.bottom<=proof.top&&
            Math.abs(photos.left-pills.left)<2&&Math.abs(photos.right-pills.right)<2&&
            Math.abs(cta.left-pills.left)<2&&Math.abs(cta.right-pills.right)<2&&Math.abs(cta.right-box('[data-lead-hero-pill="3"]').right)<2&&
            images.every(r=>r.height>=216&&r.width/r.height<=1.2)&&parseFloat(getComputedStyle(document.querySelector('[data-lead-hero-pill]')).fontSize)>=14;
        })(),
        mobileOrder:(()=>{if(innerWidth>=640)return true;const service=box('[data-aria-service-group]');return service.bottom<=title.top&&title.bottom<=pills.top&&pills.bottom<=photos.top&&parseFloat(getComputedStyle(document.querySelector('[data-lead-hero-pill]')).fontSize)>=10;})(),
        admissionClear:(()=>{const h=box('#lead-requirements h2');return [...document.querySelectorAll('#lead-requirements > [aria-hidden="true"] svg')].every(e=>{const p=e.getBoundingClientRect();return p.right<=h.left||p.left>=h.right||p.bottom<=h.top||p.top>=h.bottom;});})(),
        galleryEdge:(()=>{const r=box('#lead-photo-carousel [data-gesture-track="photos"]');return Math.abs(r.left)<2&&Math.abs(r.right-document.documentElement.offsetWidth)<2;})(),
        locationBold:[...document.querySelectorAll('[data-aria-location-chips] > *')].every(e=>Number(getComputedStyle(e).fontWeight)>=700&&(innerWidth<1024||e.getBoundingClientRect().width>0&&getComputedStyle(e).backgroundColor==='rgb(255, 231, 184)')),
        arrivalLayout:(()=>{const map=document.querySelector('#aria-mosaic [data-daycare-arrival-map]'), gallery=map.nextElementSibling;const m=map.getBoundingClientRect(),g=gallery.getBoundingClientRect();return Math.abs(m.left-g.left)<2&&Math.abs(m.right-g.right)<2&&m.bottom<=g.top&&m.width>0&&map.scrollWidth<=map.clientWidth+1;})(),
        locationLayout:(()=>{const e=document.querySelector('#aria-mosaic [data-daycare-location-copy]');const p=e.querySelectorAll('p')[1];return p.textContent.trim().endsWith('autoumyvárke.')&&!e.textContent.includes('bezplatné parkovisko')&&getComputedStyle(p).whiteSpace==='pre-line'&&(innerWidth<1024||Math.abs(e.getBoundingClientRect().width-(e.parentElement.clientWidth-32))<2);})(),
        headingTwoLines:(()=>{const display=document.querySelector('[data-lead-title-display]'),flow=document.querySelector('[data-lead-title-flow]'),h=flow.closest('h1');if(innerWidth<1024)return getComputedStyle(display).display==='none'&&getComputedStyle(flow.querySelector('span')).color==='rgb(184, 46, 127)';const accent=flow.querySelector('span'),range=document.createRange();range.selectNode(flow.firstChild);const first=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);range.selectNodeContents(accent);const second=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);const b=h.getBoundingClientRect();return getComputedStyle(display).display==='none'&&getComputedStyle(flow).opacity==='1'&&getComputedStyle(accent).color==='rgb(184, 46, 127)'&&first.length>0&&second.length>0&&[first,second].every(rs=>new Set(rs.map(r=>Math.round(r.top))).size===1&&rs.every(r=>r.left>=b.left-1&&r.right<=b.right+1))&&second[0].top>first[0].top;})(),
        headingGeometry:(()=>{const d=document.querySelector('[data-lead-title-display]'),f=document.querySelector('[data-lead-title-flow]'),h=d.closest('h1');if(innerWidth<1024)return null;return {font:getComputedStyle(d).fontSize,heading:h.getBoundingClientRect().toJSON(),flow:f.getBoundingClientRect().toJSON(),display:d.getBoundingClientRect().toJSON(),scrollHeight:d.scrollHeight,clientHeight:h.clientHeight,lines:[...d.children].map(n=>{const r=document.createRange();r.selectNodeContents(n);return [...r.getClientRects()].map(x=>x.toJSON())})};})(),
        hoursRemoved:!document.querySelector('[data-lead-hero-hours]'),
        pairedBenefits:(()=>{const rows=[...document.querySelectorAll('[data-lead-benefits] > article')];return rows.length===3&&rows.every((e,i)=>{const image=e.querySelector('img').getBoundingClientRect(),text=e.querySelector('div').getBoundingClientRect();return image.right<text.left&&(!i||e.getBoundingClientRect().top>rows[i-1].getBoundingClientRect().bottom);});})(),
        cards:(()=>{const cards=[...document.querySelectorAll('[data-lead-price-card]')].map(el=>el.getBoundingClientRect());const taxi=box('#lead-pricing [data-aria-taxi]');return cards.length===2&&Math.abs(cards[0].top-cards[1].top)<2&&Math.abs(cards[0].bottom-cards[1].bottom)<2&&taxi.top>cards[0].bottom&&taxi.width>=cards[1].right-cards[0].left-2;})(),
        cleanSections:getComputedStyle(document.querySelector('#aria-puppy-check')).backgroundColor==='rgb(255, 255, 255)'&&document.querySelector('#lead-faq').parentElement.tagName==='MAIN',
        certificateWidth:(()=>{const e=document.querySelector('[data-safety-certificates]');return e.getBoundingClientRect().width>=e.parentElement.clientWidth-34;})(),
        pillCount:visiblePills.length,pillBg:visiblePills.every(el=>{const s=getComputedStyle(el);return s.backgroundColor==='rgb(255, 164, 20)'&&s.color==='rgb(38, 50, 43)'&&parseFloat(s.borderRadius)<=10;}),
        pillRows:new Set(visiblePills.map(el=>Math.round(el.getBoundingClientRect().top))).size,
        actionBg:getComputedStyle(document.querySelector('[data-aria-lead-hero-cta]')).backgroundColor,
        actionFg:getComputedStyle(document.querySelector('[data-aria-lead-hero-cta]')).color,
        actionBorder:getComputedStyle(document.querySelector('[data-aria-lead-hero-cta]')).borderTopColor,
        actionArrow:getComputedStyle(document.querySelector('[data-aria-lead-hero-cta]'),'::after').backgroundColor,
        actionArrowDecorative:getComputedStyle(document.querySelector('[data-aria-lead-hero-cta]'),'::after').pointerEvents==='none',
        pillBold:visiblePills.every(el=>Number(getComputedStyle(el).fontWeight)>=700),
        pillGap:parseFloat(getComputedStyle(document.querySelector('[data-lead-hero-pills]')).columnGap),
        photoCrop:(()=>{const imgs=[...document.querySelectorAll('[data-lead-hero-photo] img')],short=innerWidth<640&&innerHeight<=740;return imgs.length===2&&imgs.every(el=>getComputedStyle(el).objectFit==='cover'&&getComputedStyle(el).objectPosition===(innerWidth>=1024?'50% 0%':short?'50% 35%':innerWidth<640?'50% 58%':'50% 50%'))&&(!short||innerWidth<390||(imgs.every(el=>el.getBoundingClientRect().height>=108)&&cta.top-photos.bottom>=14));})(),
        reviewGap:parseFloat(getComputedStyle(document.querySelector('[data-aria-lead-review-spacing]')).marginTop),
        galleryBelow:box('#lead-photo-carousel').top>=innerHeight-2,
        greetingFit:(()=>{const p=document.querySelector('[data-aria-bubble-greeting]'),range=document.createRange();range.selectNodeContents(p);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);const expected=innerWidth<640?'Ahoj, volám sa Aria. Čo ťa zaujíma?':'Ahoj, volám sa Aria. Čo ťa zaujíma v našej škôlke?';return p.innerText.replace(/\s+/g,' ').trim()===expected&&new Set(rects.map(r=>Math.round(r.top))).size===1&&p.scrollWidth<=p.clientWidth+1&&Math.abs(p.getBoundingClientRect().right-Math.max(...rects.map(r=>r.right))-parseFloat(getComputedStyle(p).paddingRight))<=2&&(innerWidth>=640||face.left>=6&&face.left<=10);})(),
        compactLauncher:(()=>{const buttons=[...document.querySelectorAll('[data-aria-bubble-question]')],s=box('[data-aria-speech]'),rs=buttons.map(e=>e.getBoundingClientRect());return rs.length===2&&Math.abs(rs[0].top-rs[1].top)<2&&rs[0].right<rs[1].left&&rs.every(r=>r.height>=44&&r.left>=s.left&&r.right<=s.right)&&buttons.every(e=>e.scrollWidth<=e.clientWidth+1&&Math.abs(parseFloat(getComputedStyle(e).borderTopLeftRadius)-12)<0.5&&Math.abs(parseFloat(getComputedStyle(e).borderBottomRightRadius)-12)<0.5);})(),
        // Test a shorter in-app-sized viewport and the full review cards, not only their heading.
        mobileLauncherLayout:(()=>{if(innerWidth>=640)return true;const service=box('[data-aria-service-group]'),speech=box('[data-aria-speech]');const cards=[...document.querySelectorAll('#recenzie [data-review-card]')].map(e=>e.getBoundingClientRect());const cardBottom=Math.max(...cards.map(r=>r.bottom));const gap=Math.min(speech.top,face.top)-cardBottom;const guide=getComputedStyle(document.querySelector('[data-aria-guide]'));return cards.length>0&&service.top<=64&&parseFloat(guide.bottom)>=12&&speech.bottom<=innerHeight-12&&gap>=4;})(),
        dockInside:dock.top>=0&&dock.bottom<=innerHeight+1,
        ctaHeight:cta.height,proofBottom:proof.bottom,ariaTop:aria.top,faceWidth:face?.width,
        widget:(()=>{const speech=box('[data-aria-speech]');const tail=document.querySelector('[data-aria-speech] [data-aria-tail]');return dock.height<=1&&Math.abs(face.width-(innerWidth>=640?104:Math.min(84,Math.max(60,innerWidth*.2-4))))<2&&
          speech.left-face.right>=2&&speech.left-face.right<=5&&dock.top-speech.bottom>=8&&speech.left>=0&&speech.right<=innerWidth&&
          (innerWidth<1024||speech.width>=455&&speech.width<=482)&&!!tail&&Number(tail.dataset.tipX)<-8&&
          document.querySelectorAll('[data-aria-section-navigation]').length===0&&document.querySelectorAll('[data-aria-chat-trigger]').length===1&&document.querySelectorAll('[data-aria-panel], [data-aria-chat]').length===0;})()};
    });
    if(!fold.galleryEdge||!fold.mobileOrder||!fold.admissionClear||!fold.locationBold||!fold.arrivalLayout||!fold.locationLayout||!fold.headingTwoLines||!fold.hoursRemoved||!fold.desktop||!fold.pairedBenefits||!fold.cards||!fold.cleanSections||!fold.certificateWidth||fold.pillCount!==3||!fold.pillBg||fold.overflow||!fold.dockInside||!fold.widget||fold.actionBg!=='rgb(255, 255, 255)'||fold.actionFg!=='rgb(169, 84, 0)'||fold.actionBorder!=='rgb(255, 164, 20)'||fold.actionArrow!=='rgb(184, 46, 127)'||!fold.actionArrowDecorative||!fold.pillBold||fold.pillGap<5||!fold.photoCrop||!fold.greetingFit||!fold.compactLauncher||!fold.mobileLauncherLayout||width<640&&(!fold.galleryBelow||fold.reviewGap<24)||fold.ctaHeight<44||
      (width<640&&(!fold.visible||fold.pillRows>2)))throw new Error('Campaign first fold '+width+'x'+height+': '+JSON.stringify(fold));
  }
  await assertPaidReturnArrow(page);
  if(await page.locator('#lead-requirements h2').innerText()!=='Podmienky prijatia psíka')throw new Error('Campaign conditions heading differs');
  if(visualOnly){
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await assertPaidAriaChat(page,{visualOnly:true});
    if(!await assertArrivalImage(arrival))throw new Error('Campaign arrival map dimensions');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    return;
  }
  const inquiry=page.locator('[data-lead-faq-cta]');
  await centerFixtureControl(inquiry);await inquiry.hover();
  const inquiryHover=await inquiry.evaluate(el=>{
    const style=getComputedStyle(el), arrow=getComputedStyle(el,'::after');
    return {fill:style.backgroundColor,text:style.color,border:style.borderTopColor,arrow:arrow.backgroundColor,decorative:arrow.pointerEvents==='none'};
  });
  if(inquiryHover.fill!=='rgb(255, 255, 255)'||inquiryHover.text!=='rgb(169, 84, 0)'||inquiryHover.border!=='rgb(255, 164, 20)'||inquiryHover.arrow!=='rgb(184, 46, 127)'||!inquiryHover.decorative)throw new Error('Public inquiry CTA hover palette '+JSON.stringify(inquiryHover));
  await page.mouse.move(0,0);
  await page.setViewportSize({width:390,height:844});
  await centerFixtureControl(page.locator('[data-lead-faq="first-visit"] > button'));
  await page.locator('[data-lead-faq="first-visit"] > button').click();
  if(await page.locator('[data-lead-faq="first-visit"] a').getAttribute('href')!=='#lead-first-visit')throw new Error('Missing first visit detail anchor');
  await centerFixtureControl(page.locator('[data-lead-faq="puppies"] > button'));
  await page.locator('[data-lead-faq="puppies"] > button').click();
  const puppyLink=page.locator('[data-lead-faq="puppies"] a');
  if(await puppyLink.getAttribute('href')!=='#aria-puppy-check'||!await puppyLink.evaluate(el=>el.getBoundingClientRect().width>=el.parentElement.getBoundingClientRect().width-50))throw new Error('Puppy checker CTA must fill the mobile answer');
  await centerFixtureControl(puppyLink);
  await puppyLink.click();
  await page.waitForFunction(()=>Math.abs(document.getElementById('aria-puppy-check').getBoundingClientRect().top)<140);
  const beforeHeroSubmits=trackedEvents?.filter(e=>e.name==='form_submit').length;
  await assertHeroAriaEntry(page);
  if(trackedEvents){
    for(let i=0;i<15&&!trackedEvents.some(e=>e.name==='explore_daycare'&&e.source==='lead_landing_hero_aria_cta');i++)await page.waitForTimeout(100);
    if(!trackedEvents.some(e=>e.name==='explore_daycare'&&e.source==='lead_landing_hero_aria_cta')||trackedEvents.filter(e=>e.name==='form_submit').length!==beforeHeroSubmits)throw new Error('Hero CTA source missing or Pricing click emitted conversion');
  }
  await activateFixtureControl(page.locator('[data-lead-faq-cta]'));
  await page.waitForFunction(()=>{const r=document.getElementById('aria-hero-form').getBoundingClientRect();return r.top>=0&&r.top<130;},null,{timeout:5000});
  if(await page.getByRole('dialog').count())throw new Error('Campaign CTA must scroll to its in-page form');
  const form=page.locator('#aria-hero-form [data-lead-step-form]');
  const formCircle=await form.getByRole('button',{name:'Pokračovať',exact:true}).evaluate(el=>{const icon=getComputedStyle(el,'::after');return {width:parseFloat(icon.width),height:parseFloat(icon.height),end:parseFloat(icon.right),button:el.getBoundingClientRect().height,decorative:icon.pointerEvents==='none'};});
  if(formCircle.width!==36||formCircle.height!==36||formCircle.end!==5||formCircle.button<formCircle.height+2||!formCircle.decorative)throw new Error('Form CTA circle geometry '+JSON.stringify(formCircle));
  await advanceLeadContact(form);
  await assertLeadContactIntro(form);
  await form.getByRole('button',{name:'Späť',exact:true}).click();
  await form.getByRole('button',{name:'Pokračovať',exact:true}).waitFor({state:'visible'});
  await assertPaidAriaChat(page);
  if(!await assertArrivalImage(arrival))throw new Error('Campaign arrival map dimensions');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>scrollY<5,null,{timeout:5000});
}

// APP-01 static regression for the slider fill direction in both engines.
// Pseudo-element background images are not exposed consistently by getComputedStyle.
if (!bellaris && brandPreviewCandidate) {
  const styles = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
  const correctGradient = 'background: linear-gradient(to right, var(--color-coral) 0 var(--aria-puppy-progress, 0%), #e0e5e0 var(--aria-puppy-progress, 0%) 100%);';
  if (styles.split(correctGradient).length !== 3) {
    failures.push('Puppy age range must fill orange from left to thumb, gray from thumb to right in Chromium and Firefox');
  }
}

// Shared footer: test the real responsive wrapper and an isolated interactive
// iframe fixture. Never contact Google or send real consent/analytics requests.
// The shared application responds to the available form width, not the
// viewport alone (modal insets and the second-dog card reduce that width).
async function assertApplicationDogLayout(surface, engine, label) {
  const page=surface.page(), original=page.viewportSize();
  const form=surface.locator('form').filter({has:page.locator('input[name="pes"]')});
  await form.locator('input[name="pes"]').waitFor({state:'visible'});
  const two=form.getByRole('radio',{name:'Chcem prihlásiť dvoch psíkov'});
  const one=form.getByRole('radio',{name:'Chcem prihlásiť jedného psíka'});
  try {
    await activateFixtureControl(form.locator('label:has(input[name="pocet_psikov"][value="2"])'));
    if(!await two.isChecked())throw new Error('Two-dog choice did not select');
    await form.locator('input[name="pes2"]').waitFor({state:'visible'});
    for(const width of [320,375,390,430,1440]) {
      await page.setViewportSize({width,height:width>=1024?900:844});
      await page.evaluate(()=>document.fonts.ready);
      const sample=await form.evaluate(el=>{
        const expected=['identity','age-weight','sex-neuter'];
        const pairs=[['pes','plemeno'],['vek','vaha'],['pohlavie','kastrovana']];
        const rows=[...el.querySelectorAll('[data-application-dog-row]')];
        const checks=rows.map((row,i)=>{
          const [left,right]=row.children, a=left.getBoundingClientRect(),b=right.getBoundingClientRect(),r=row.getBoundingClientRect();
          const container=row.closest('.\\@container');
          const cs=getComputedStyle(container);
          const available=container.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
          const side=available>=350;
          const suffix=i>=3?'2':'';
          const names=[left,right].map(group=>group.querySelector('input')?.name);
          const correct=names.every((name,j)=>name===pairs[i%3][j]+suffix);
          const controls=[...row.querySelectorAll('.form-binary-choice-v292 > span')].map(node=>node.getBoundingClientRect());
          return {row:row.dataset.applicationDogRow,available,side,correct,
            geometry:side?Math.abs(a.bottom-b.bottom)<2&&a.right<=b.left+1:a.bottom<=b.top+1&&Math.abs(a.left-b.left)<2,
            fits:a.left>=r.left-1&&b.right<=r.right+1&&row.scrollWidth<=row.clientWidth+1,
            binary:controls.every(c=>c.height>=44&&c.width>=44)};
        });
        const options=[...el.querySelectorAll('input[name="duvod"]')];
        const cardRects=options.map(input=>input.parentElement.getBoundingClientRect());
        return {checks,order:rows.map(row=>row.dataset.applicationDogRow).join(',')===expected.concat(expected).join(','),
          choices:options.map(input=>input.value),required:options.every(input=>input.required&&!input.checked),
          usageLayout:cardRects.length===2&&cardRects[0].right<=cardRects[1].left+1&&Math.abs(cardRects[0].top-cardRects[1].top)<2,
          overflow:el.scrollWidth>el.clientWidth+2};
      });
      if(!sample.order||sample.checks.length!==6||sample.checks.some(c=>!c.correct||!c.geometry||!c.fits||!c.binary)||
          sample.choices.join('|')!=='Pravidelne – 1× alebo viackrát týždenne|Občas podľa potreby'||
          !sample.required||!sample.usageLayout||sample.overflow)
        throw new Error('Application layout '+label+' '+width+': '+JSON.stringify(sample));
      console.log('PASS application '+engine+' '+label+' '+width+' '+JSON.stringify(sample));
    }
    await page.setViewportSize(original);
    const next=form.getByRole('button',{name:'Pokračovať',exact:true});
    const owner=form.locator('input[name="meno"]');
    if(await owner.isVisible())throw new Error('Owner step visible before dog details');
    await activateFixtureControl(next);
    if(await form.getAttribute('data-application-step')!=='1')throw new Error('Incomplete dogs passed step validation');
    for(const suffix of ['', '2']){
      for(const [name,value] of [['pes','Fixture dog '+suffix],['plemeno','Labrador'],['vek','2 roky'],['vaha','25 kg'],['povaha','Fixture only']])await form.locator('[name="'+name+suffix+'"]').fill(value);
      for(const name of ['pohlavie','kastrovana'])await form.locator('label:has(input[name="'+name+suffix+'"])').first().click();
    }
    await form.locator('label:has(input[name="duvod"])').first().click();
    await activateFixtureControl(next);
    await owner.waitFor({state:'visible'});
    if(await form.locator('input[name="pes"]').isVisible())throw new Error('Both application steps visible');
    await owner.fill('Fixture owner');
    await form.locator('input[name="telefon"]').fill('912345678');
    const payload=await form.evaluate(el=>Object.fromEntries(new FormData(el)));
    if(payload.pes!=='Fixture dog '||payload.pes2!=='Fixture dog 2'||payload.meno!=='Fixture owner'||payload.duvod!=='Pravidelne – 1× alebo viackrát týždenne')throw new Error('Hidden step fields missing from application payload');
    await activateFixtureControl(form.getByRole('button',{name:'Späť',exact:true}));
    await form.locator('input[name="pes"]').waitFor({state:'visible'});
    if(await form.locator('input[name="pes2"]').inputValue()!=='Fixture dog 2'||await owner.inputValue()!=='Fixture owner')throw new Error('Step navigation lost application values');
    await activateFixtureControl(next);
    await owner.waitFor({state:'visible'});
    if(await owner.inputValue()!=='Fixture owner')throw new Error('Owner values lost on return');
    await activateFixtureControl(form.getByRole('button',{name:'Späť',exact:true}));
    await form.locator('input[name="pes"]').waitFor({state:'visible'});
    await activateFixtureControl(form.locator('label:has(input[name="pocet_psikov"][value="1"])'));
    if(!await one.isChecked())throw new Error('One-dog choice did not select');
    await form.locator('input[name="pes2"]').waitFor({state:'hidden',timeout:5000});
    console.log('PASS application step navigation and full FormData '+engine+' '+label);
  } catch(error) {
    // Do not mask the original failure by attempting to click a hidden dog
    // selector during cleanup (e.g. when step two remains active in WebKit).
    const state=await form.evaluate(el=>({step:el.dataset.applicationStep,selected:el.querySelector('input[name="pocet_psikov"]:checked')?.value,modal:!!el.closest('[role="dialog"]')})).catch(()=>null);
    throw new Error('Application interaction '+engine+' '+label+' '+JSON.stringify(state)+'; cause: '+(error?.stack||String(error)),{cause:error});
  } finally {
    await page.setViewportSize(original);
  }
}

async function assertBilingualLegalFooter(browser, engine) {
  const origin = new URL(base).origin;
  for (const language of ['sk','en']) {
    const english = language === 'en';
    const route = english ? '/en/dog-daycare-kosice/' : '/';
    const context = await browser.newContext({viewport:{width:320,height:844},isMobile:true,hasTouch:true});
    try {
      await context.route('**/*', route => {
        const request=route.request(), url=new URL(request.url());
        if (!['GET','HEAD'].includes(request.method()) || url.origin!==origin) return route.abort();
        return route.continue();
      });
      const page=await context.newPage();
      await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:40000});
      const reject=page.getByRole('button',{name:english?'Necessary only':'Len nevyhnutné',exact:true});
      await reject.waitFor({state:'visible',timeout:15000});
      const greeting=english?"My name is Aria and welcome to our website!":"Volám sa Aria a vítam ťa na našom webe!";
      const necessary=english?"Necessary cookies help the website work.":"Nevyhnutné cookies pomáhajú webu fungovať.";
      const optional=english?"You decide whether to allow functional, analytics and marketing cookies.":"O funkčných, analytických a marketingových cookies rozhoduješ ty.";
      const copy=page.locator('[data-cookie-panel] p').filter({hasText:greeting});
      if(await copy.count()!==1 || await copy.locator('br').count()!==2 ||
          Number(await copy.evaluate(el=>getComputedStyle(el).fontWeight))<500 ||
          !await copy.evaluate((el,expected)=>{
            const parts=[''];for(const node of el.childNodes){if(node.nodeName==='BR')parts.push('');else if(node.nodeType===3)parts[parts.length-1]+=node.textContent;}
            return parts.length===3&&parts.every((part,i)=>part.trim()===expected[i]);
          },[greeting,necessary,optional]))
        throw new Error('Bilingual cookie greeting/three separate sentences/weight missing: '+language);
      for(const width of [320,390,1440]){
        await page.setViewportSize({width,height:844});
        const portrait=await page.locator('[data-aria-cookie-head]').boundingBox();
        if(!portrait||Math.abs(portrait.width-(width>=640?94:80))>1)throw new Error('Cookie portrait size mismatch: '+language+' '+width);
        await assertCookieBrandSurface(page);
      }
      await page.setViewportSize({width:320,height:844});
      await activateFixtureControl(reject);
      const nav=page.locator('footer [data-footer-legal]');
      await nav.waitFor({state:'visible'});
      const privacy=nav.getByRole('link',{name:english?'Privacy policy – GDPR':'Ochrana osobných údajov – GDPR'});
      const privacyPath=english?'/en/privacy':'/ochrana-osobnych-udajov';
      if(await privacy.getAttribute('href')!==privacyPath)throw new Error('Privacy link changed: '+language);
      const complaint=nav.getByRole('button',{name:english?'Complaints policy – goods':'Reklamačný poriadok – tovar',exact:true});
      for(const width of [320,1440]) {
        await page.setViewportSize({width,height:844});
        if(!await nav.evaluate(el=>{const children=[...el.children].map(x=>x.getBoundingClientRect());return children.length===2&&children[0].left<children[1].left&&children[1].right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1;}))
          throw new Error('Legal footer columns overflow: '+language+' '+width);
        await activateFixtureControl(complaint);
        const dialog=page.locator('[role="dialog"]').filter({has:page.locator('[data-goods-complaints]')});
        await dialog.waitFor({state:'visible'});
        const content=dialog.locator('[data-goods-complaints]');
        if(await content.locator('section').count()!==7)throw new Error('Incomplete goods policy '+language);
        const adr=content.locator('a[href^="https://www.soi.sk/"]');
        if(await adr.count()!==1||await adr.getAttribute('target')!=='_blank')throw new Error('ADR link missing '+language);
        const pdf=content.locator('a[download]');
        const expected=english?'/documents/complaints-policy-goods-en.pdf':'/documents/reklamacny-poriadok-tovar.pdf';
        if(await pdf.getAttribute('href')!==expected)throw new Error('PDF language/path mismatch '+language);
        const response=await page.request.get(new URL(expected,base).href);
        if(!response.ok()||(await response.body()).subarray(0,5).toString()!=='%PDF-')throw new Error('PDF response invalid '+language);
        await page.keyboard.press('Escape');
        await dialog.waitFor({state:'hidden'});
      }
      const legal=await context.newPage();
      try {
        for(const target of [privacyPath,english?'/en/cookies':'/cookies']) {
          const response=await legal.goto(new URL(target+'/',base).href,{waitUntil:'domcontentloaded',timeout:40000});
          if(!response?.ok()||await legal.locator('main.site-brand h1').count()!==1)throw new Error('Legal route/brand missing '+target);
        }
      } finally {await legal.close();}
      results.push({engine,scope:'legal-footer',language,status:'PASS'});
    } finally {await context.close();}
  }
}

async function assertFooterMapGeometry(browser, engine) {
  const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const origin = new URL(base).origin;
  const routes = [...fullRoutes, '/produkty/', '/stojan-na-misky-pre-psa/', '/target-na-cvicenie-pre-psov/', '/blog/', '/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/'];
  try {
    await context.addInitScript(() => {
      localStorage.setItem('chvostikovo-cookies', JSON.stringify({
        version:'2026-10-03-v2',savedAt:new Date().toISOString(),necessary:true,
        functional:false,analytics:false,marketing:false
      }));
    });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method()==='GET' && url.origin==='https://www.google.com' &&
          url.pathname==='/maps' && url.searchParams.get('output')==='embed') {
        return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body style="margin:0;background:#dcebd5"><div style="position:fixed;inset:0;background:repeating-linear-gradient(40deg,transparent 0 35px,#fff 36px 43px)"></div><button style="position:fixed;bottom:16px;right:16px;min-height:44px" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\',this.getAttribute(\'aria-pressed\')===\'false\'?\'true\':\'false\')">Map fixture control</button></body></html>'});
      }
      if (!['GET','HEAD'].includes(request.method()) || url.origin!==origin) return route.abort();
      return route.continue();
    });
    for (const route of routes) {
      const page = await context.newPage();
      const label = route.replaceAll('/','_');
      try {
        await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:40000});
        const map = page.locator('footer [data-footer-map]');
        await map.waitFor({state:'visible'});
        if (await map.count()!==1 || await map.locator('iframe').count()!==0 ||
            await map.getByRole('button',{name:/Otvoriť nastavenia cookies|Open cookie settings/}).count()!==1)
          throw new Error('Footer map must preserve the functional-consent placeholder: '+route);
        const fallbackRadius=await map.evaluate(el=>{
          const card=el.closest('[data-footer-contact-card]'),style=getComputedStyle(card);
          return Math.abs(parseFloat(getComputedStyle(el).borderTopLeftRadius)-
            Math.max(0,parseFloat(style.borderTopLeftRadius)-parseFloat(style.paddingRight)))<1;
        });
        if(!fallbackRadius)throw new Error('Consent placeholder corners must match the card inset: '+route);
        await page.evaluate(()=>{
          const consent=JSON.parse(localStorage.getItem('chvostikovo-cookies'));
          consent.functional=true;
          localStorage.setItem('chvostikovo-cookies',JSON.stringify(consent));
          window.dispatchEvent(new CustomEvent('chvostikovo-consent-changed',{detail:consent}));
        });
        const iframe=map.locator('iframe');
        await iframe.waitFor({state:'visible',timeout:10000});
        const src=await iframe.getAttribute('src');
        if(!src?.startsWith('https://www.google.com/maps?') || !src.includes('output=embed') ||
            !await iframe.getAttribute('title') || await iframe.getAttribute('loading')!=='lazy')
          throw new Error('Footer map URL, accessible title or lazy loading changed: '+route);
        const address=page.locator('footer [data-footer-contact-card] a').filter({hasText:'Poľská 6, 040 01 Košice'});
        if(await address.count()!==1 || await address.getAttribute('target')!=='_blank' ||
            !/^https:\/\//.test(await address.getAttribute('href')||''))
          throw new Error('External map address link missing: '+route);
        // Main, paid landing and EN get the entire width matrix. Other shared
        // footer consumers get mobile and desktop geometry/readback.
        const widths=['/','/psia-skolka-kosice/','/en/dog-daycare-kosice/'].includes(route)
          ? [320,375,390,430,1440] : [390,1440];
        for(const width of widths) {
          await page.setViewportSize({width,height:width>=1024?900:844});
          await centerFixtureControl(map);
          const sample=await map.evaluate(el=>{
            const card=el.closest('[data-footer-contact-card]'),frame=el.querySelector('iframe');
            const c=card.getBoundingClientRect(),m=el.getBoundingClientRect(),f=frame.getBoundingClientRect();
            const cs=getComputedStyle(card),ms=getComputedStyle(el),fs=getComputedStyle(frame);
            const root=parseFloat(getComputedStyle(document.documentElement).fontSize);
            const pad=parseFloat(cs.paddingRight),outer=parseFloat(cs.borderTopRightRadius);
            const radius=Math.max(0,outer-pad);
            const corners=['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius'];
            const near=(a,b)=>Math.abs(a-b)<1.5;
            return {
              outer,pad,radius,inner:parseFloat(ms.borderTopRightRadius),
              preserved:near(outer,root*1.25+12)&&near(pad,root*(innerWidth>=640?1.75:1.25)),
              concentric:corners.every(key=>near(parseFloat(ms[key]),radius)),
              insets:near(c.right-m.right,pad)&&(innerWidth>=1024||
                near(m.left-c.left,pad)&&near(c.bottom-m.bottom,parseFloat(cs.paddingBottom))),
              frameFits:near(f.width,m.width)&&near(f.height,m.height)&&near(f.height,root*15)&&
                near(f.left,m.left)&&near(f.top,m.top),
              clipped:ms.overflowX==='hidden'&&ms.overflowY==='hidden',
              noOverflow:m.left>=0&&m.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1,
              interactive:fs.pointerEvents!=='none'&&document.elementFromPoint(m.left+m.width/2,m.top+m.height/2)===frame,
              cornerClipped:radius<8||document.elementFromPoint(m.left+1,m.top+1)!==frame
            };
          });
          if(!sample.preserved||!sample.concentric||!sample.insets||!sample.frameFits||
              !sample.clipped||!sample.noOverflow||!sample.interactive||!sample.cornerClipped)
            throw new Error('Footer map geometry '+route+' '+width+': '+JSON.stringify(sample));
          const control=page.frameLocator('footer [data-footer-map] iframe').getByRole('button',{name:'Map fixture control'});
          await control.waitFor({state:'visible',timeout:10000});
          const before=await control.getAttribute('aria-pressed');
          await control.click({timeout:5000});
          if(await control.getAttribute('aria-pressed')===before)
            throw new Error('Footer map iframe is not interactive: '+route+' '+width);
          await page.screenshot({path:path.join(out,'footer-map-'+engine+'-'+label+'-'+width+'.png')});
          console.log('PASS footer-map '+engine+' '+route+' '+width+' '+JSON.stringify(sample));
        }
        await page.evaluate(()=>{
          const consent=JSON.parse(localStorage.getItem('chvostikovo-cookies'));
          consent.functional=false;
          localStorage.setItem('chvostikovo-cookies',JSON.stringify(consent));
          window.dispatchEvent(new CustomEvent('chvostikovo-consent-changed',{detail:consent}));
        });
        await iframe.waitFor({state:'detached',timeout:5000});
        await map.getByRole('button',{name:/Otvoriť nastavenia cookies|Open cookie settings/}).waitFor({state:'visible'});
        results.push({engine,route:'footer-map '+route,status:'PASS',widths});
      } catch(error) {
        const failure={engine,route:'footer-map '+route,status:'FAIL',error:error.message};
        failures.push(failure);results.push(failure);
        console.error('FAIL '+JSON.stringify(failure));
        await page.screenshot({path:path.join(out,'footer-map-'+engine+'-'+label+'-failure.png')}).catch(()=>{});
      } finally {await page.close();}
    }
  } finally {await context.close();}
}



// APP-01: inset visual surfaces without shrinking navigation hit targets.
async function assertHomeDockSurface(page) {
  const state=await page.locator('.mobile-dock[data-home-dock] .mobile-dock-bar').evaluate(bar=>{
    const menu=bar.querySelector('[data-home-menu]'),language=menu.querySelector('[data-language-switch]'),selected=language.querySelector('[aria-current="page"]'),active=bar.querySelector('.mobile-dock-item.is-active');
    const m=menu.getBoundingClientRect(),lower=[...bar.querySelectorAll('.mobile-dock-item')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect()),lang=selected.getBoundingClientRect();
    const ms=getComputedStyle(innerWidth>=1024?menu.querySelector('.mobile-dock-compact-links'):menu),ls=getComputedStyle(selected),as=active&&getComputedStyle(active),bs=getComputedStyle(bar);
    return {gap:Math.min(...lower.map(r=>r.top))-m.bottom,tray:parseFloat(ms.borderRadius)>=12&&ms.backgroundImage.includes('gradient'),
      menuHeight:m.height,languageHeight:lang.height,languageWidth:lang.width,languageInset:parseFloat(ls.borderTopWidth),
      activeInset:!!as&&parseFloat(as.borderTopWidth)>=2&&as.backgroundClip==='padding-box',
      glass:bs.backgroundImage.includes('gradient')&&(bs.backdropFilter||bs.webkitBackdropFilter||'').includes('blur'),
      lowerTargets:lower.every(r=>r.height>=44)};
  });
  if(brandPreviewCandidate){
    const upper=await page.locator('[data-home-menu]').evaluate(el=>{const language=el.querySelector('[data-language-switch]'),selected=language.querySelector('[aria-current="page"]');return {radius:parseFloat(getComputedStyle(selected).borderTopLeftRadius),trackRadius:parseFloat(getComputedStyle(language,'::before').borderTopLeftRadius),desktop:innerWidth>=1024,labels:[...el.querySelectorAll('.mobile-dock-compact-links a span')].filter(s=>s.getClientRects().length).map(s=>({font:parseFloat(getComputedStyle(s).fontSize),nowrap:getComputedStyle(s).whiteSpace==='nowrap',fits:s.scrollWidth<=s.clientWidth+1}))};});
    if(upper.radius<8||upper.radius>14||upper.trackRadius<8||upper.trackRadius>14||upper.desktop&&upper.labels.some(l=>l.font!==12||!l.nowrap||!l.fits))throw new Error('Upper dock labels/language shape '+JSON.stringify(upper));
  }
  if(state.gap<1||!state.tray||state.menuHeight>46||state.languageHeight<44||state.languageWidth<44||state.languageInset<5||!state.activeInset||!state.glass||!state.lowerTargets)throw new Error('Compact liquid home dock '+JSON.stringify(state));
}

async function assertCompactHomeMenu(page,en) {
  const menu=page.locator('[data-home-menu]');
  await menu.waitFor({state:'visible'});
  const state=await menu.evaluate(el=>{
    const bar=el.closest('.mobile-dock-bar'),nav=bar.closest('.mobile-dock'),p=el.getBoundingClientRect(),d=bar.getBoundingClientRect();
    const links=[...el.querySelectorAll('.mobile-dock-compact-links a')].filter(a=>a.getClientRects().length);
    const phone=el.querySelector('[data-home-dock-phone]');
    return {hrefs:links.map(a=>new URL(a.href).hash),labels:links.map(a=>a.textContent.trim()),
      targets:[...links,phone,...el.querySelectorAll('[data-language-switch] a')].every(a=>a&&a.getBoundingClientRect().height>=44&&a.scrollWidth<=a.clientWidth+1),
      height:p.height,total:d.height,inside:d.left>=0&&d.right<=innerWidth+1&&d.top>=0&&d.bottom<=innerHeight+1,
      noOverflow:el.scrollWidth<=el.clientWidth+1,arrow:!!nav.querySelector('.mobile-dock-back-top'),phone:phone?.getAttribute('href'),
      main:[...bar.children].filter(a=>a.matches('a,button')&&a.getClientRects().length).map(a=>a.textContent.trim()),
      dialog:!!nav.querySelector('button[aria-haspopup="dialog"]'),reserve:parseFloat(getComputedStyle(document.body).paddingBottom)};
  });
  const main=en?['Home','Prices','Rules','Facilities','Apply']:['Domov','Cenník','Podmienky','Priestory','Produkty','Prihláška'];
  if(JSON.stringify(state.hrefs)!==JSON.stringify([en?'#about':'#o-nas','#aria-puppy-check','#faq'])||JSON.stringify(state.labels)!==JSON.stringify(en?['About','Have a puppy?','FAQ']:['O nás','Máte šteniatko?','Časté otázky'])||JSON.stringify(state.main)!==JSON.stringify(main)||!state.targets||!state.inside||!state.noOverflow||state.arrow||state.dialog||state.height>46||state.total>130||state.reserve<state.total||!state.phone?.startsWith('tel:'))throw new Error('Permanent home navigation '+JSON.stringify(state));
  if(await menu.locator('[data-desktop-only-shortcut]:visible').count())throw new Error('Desktop shortcuts must remain hidden on mobile');
  const crop=await page.locator('[data-home-hero-photo] img').evaluateAll(imgs=>imgs.map(img=>getComputedStyle(img).objectPosition));
  if(crop.join('|')!=='50% 0%|50% 50%')throw new Error('Only the collies photo should use the top-biased crop: '+crop.join('|'));
  if(await page.locator('[data-home-hero-phone]').count())throw new Error('Duplicate mobile Hero phone');
  if(!await page.evaluate(()=>!!(document.querySelector('[data-home-puppy-checker]')?.compareDocumentPosition(document.querySelector('[data-home-pricing-columns]'))&Node.DOCUMENT_POSITION_FOLLOWING)))throw new Error('Puppy checker must precede pricing');
}

// Active section color is the same for both home languages and both dock layouts.
async function assertHomeDockActivePink(page,en,section='top') {
  await page.waitForFunction(({en,section})=>{
    const active=document.querySelector('.mobile-dock[data-home-dock] .mobile-dock-item[aria-current="location"]');
    const href=active&&new URL(active.href,location.href);
    const expected=section==='top'?(en?'/en/dog-daycare-kosice':'/'):null;
    return !!active&&(expected?href.pathname.replace(/\/$/,'')===expected.replace(/\/$/,'')&&!href.hash:href.hash==='#'+section)
      &&getComputedStyle(active).backgroundColor==='rgb(248, 221, 236)';
  },{en,section},{timeout:5000});
}
async function assertApplicationPreview(page,en) {
  const form=page.locator('[data-home-friendship-form] form[data-application-form]');
  const toggle=form.locator('#home-friendship-application');
  const name=form.locator('[name="pes"]'),breed=form.locator('[name="plemeno"]');
  if(!await name.isVisible()||!await breed.isVisible()||await form.locator('[name="vek"]').isVisible()||await form.locator('[name="meno"]').isVisible()||await toggle.getAttribute('aria-expanded')!=='false')throw new Error('Application preview is not partial');
  await name.fill('Fixture');
  await breed.fill('Labrador');
  await form.evaluate(el=>el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  if(await form.getAttribute('data-application-step')!=='1')throw new Error('Collapsed form advanced or submitted');
  await activateFixtureControl(toggle);
  await form.locator('[name="vek"]').waitFor({state:'visible'});
  if(await name.inputValue()!=='Fixture'||await breed.inputValue()!=='Labrador'||await form.locator('[name="pes"]').count()!==1)throw new Error('Expanding lost preview data or duplicated fields');
  await activateFixtureControl(toggle);
  await form.locator('[name="vek"]').waitFor({state:'hidden'});
  if(!await name.isVisible()||await name.inputValue()!=='Fixture'||await form.locator('[name="meno"]').isVisible())throw new Error('Collapsing lost preview data or exposed owner step');
  await name.fill('');await breed.fill('');
  console.log('PASS application preview '+(en?'EN':'SK'));
}

async function assertBilingualNavigation(browser,engine,{navigationOnly=false}={}) {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const captured=[];
  try {
    await context.addInitScript(()=>{
      window.__bilingualDocument=String(Math.random());
      window.__bilingualPixel=[];window.fbq=(...args)=>window.__bilingualPixel.push(args);
      window.__bilingualGa=[];window.gtag=(...args)=>window.__bilingualGa.push(args);
      localStorage.setItem('chvostikovo-cookies',JSON.stringify({version:'2026-10-03-v2',savedAt:new Date().toISOString(),necessary:true,functional:false,analytics:false,marketing:false}));
    });
    await context.route('**/*',async route=>{
      const req=route.request(),u=new URL(req.url());
      if(u.origin===new URL(base).origin&&['GET','HEAD'].includes(req.method()))return route.continue();
      if(u.pathname.includes('/functions/v1/')) {
        if(req.method()==='POST')captured.push({path:u.pathname,body:req.postDataJSON()});
        return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'*','content-type':'application/json'},body:'{"ok":true}'});
      }
      return route.abort();
    });
    const page=await context.newPage();
    await page.goto(new URL('/?utm_source=fixture&utm_campaign=bilingual',base).href);
    await page.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});
    const doc=await page.evaluate(()=>window.__bilingualDocument);
    for(const width of [320,375,390,430]){
      await page.setViewportSize({width,height:844});
      await assertCompactHomeMenu(page,false);
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      await assertHomeDockActivePink(page,false);
      await assertHomeDockSurface(page);
      await page.screenshot({path:path.join(out,'compact-sk-menu-'+engine+'-'+width+'.png')});
    }
    await page.locator('[data-home-menu] [href$="#o-nas"]').click();
    await page.waitForFunction(()=>location.hash==='#o-nas'&&Math.abs(document.getElementById('o-nas').getBoundingClientRect().top-8)<16);
    await page.locator('.mobile-dock-item[data-mobile-only-home-item]').click();
    await assertHomeDockActivePink(page,false,'priestory');
    await page.locator('.mobile-dock').getByRole('link',{name:'Domov',exact:true}).click();
    await page.waitForFunction(()=>scrollY<5);
    if(!navigationOnly)await assertApplicationPreview(page,false);
    await page.locator('[data-home-menu] a[href="/#aria-puppy-check"]').click();
    await page.waitForFunction(()=>location.hash==='#aria-puppy-check');
    await page.locator('[data-home-menu] a[href="/#faq"]').click();
    await page.waitForFunction(()=>location.hash==='#faq');
    await page.locator('.mobile-dock').getByRole('link',{name:'Domov',exact:true}).click();
    await page.waitForFunction(()=>scrollY<5&&!location.hash&&location.search.includes('utm_campaign=bilingual'));
    if(await page.evaluate(()=>window.__bilingualDocument)!==doc)throw new Error('Home must scroll without reload or attribution loss');
    await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest?.('[data-home-dock-phone]'))e.preventDefault();},true));
    await activateFixtureControl(page.locator('[data-home-dock-phone]'));
    if(await page.evaluate(()=>window.__bilingualPixel.some(a=>a[0]==='track'&&a[1]==='Contact')))throw new Error('Unconsented phone Pixel');
    await page.locator('[data-home-menu] [data-language-switch] a[lang="en"]').click();
    await page.waitForURL(/\/en\/dog-daycare-kosice\/?$/);
    await page.waitForFunction(()=>document.documentElement.lang==='en');
    if(!navigationOnly)await assertApplicationPreview(page,true);
    if(captured.some(r=>r.path.endsWith('/web-form-submit')))throw new Error('Collapsed application posted to receiver');
    if(await page.evaluate(()=>window.__bilingualDocument)!==doc)throw new Error('Language switch reloaded document');
    if(await page.evaluate(()=>window.__bilingualPixel.some(a=>a[0]==='track')))throw new Error('Pixel fired without consent');
    for(const width of [320,375,390,430,1440]){
      await page.setViewportSize({width,height:width===1440?900:844});
      await page.locator('#top h1:visible').waitFor({state:'visible'});
      const ok=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
      if(!ok)throw new Error('EN overflow at '+width);
      if(width<1024){
        const menu=page.locator('[data-home-menu]');
        await menu.waitFor({state:'visible'});
        const selected=menu.locator('[data-language-switch] a[lang="en"]');
        if(await selected.getAttribute('aria-current')!=='page')throw new Error('EN active state missing');
        await assertCompactHomeMenu(page,true);
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await assertHomeDockActivePink(page,true);
        await assertHomeDockSurface(page);
        const buttons=await menu.locator('[data-language-switch] a').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
        if(buttons.some(b=>b.width<44||b.height<44))throw new Error('Language target too small');
        await page.screenshot({path:path.join(out,'bilingual-menu-'+engine+'-'+width+'.png')});
      }else{
        const desktopPhone=await page.locator('[data-home-hero-desktop-phone]').evaluate(el=>{
          const p=el.getBoundingClientRect(),a=el.parentElement.querySelector('#home-hero-learn-more').getBoundingClientRect();
          return {text:el.textContent.trim(),href:el.getAttribute('href'),aligned:Math.abs((p.top+p.bottom-a.top-a.bottom)/2)<3,fit:p.left>=a.right+4&&p.right<=innerWidth&&p.height>=44};
        });
        if(!desktopPhone.aligned||!desktopPhone.fit||desktopPhone.text!=='+421 951 069 395'||desktopPhone.href!=='tel:+421951069395')throw new Error('Desktop Hero phone '+JSON.stringify(desktopPhone));
        await page.screenshot({path:path.join(out,'bilingual-desktop-'+engine+'.png')});
      }
    }
    await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('chvostikovo-cookies'));c.marketing=true;c.analytics=true;localStorage.setItem('chvostikovo-cookies',JSON.stringify(c));window.dispatchEvent(new CustomEvent('chvostikovo-consent-changed',{detail:c}));});
    await page.waitForFunction(()=>window.__bilingualPixel.some(a=>a[0]==='track'&&a[1]==='PageView'));
    await page.setViewportSize({width:390,height:844});
    await activateFixtureControl(page.locator('[data-home-dock-phone]'));
    await page.waitForFunction(()=>window.__bilingualPixel.filter(a=>a[0]==='track'&&a[1]==='Contact'&&a[2]?.source==='en_mobile_dock_phone').length===1);
    if(await page.evaluate(()=>window.__bilingualGa.filter(a=>a[0]==='event'&&a[1]==='phone_click'&&a[2]?.cta_source==='en_mobile_dock_phone').length)!==1)throw new Error('EN phone GA4 must emit once');
    if(!captured.some(r=>r.body?.event_name==='phone_click'&&r.body?.event_source==='home_mobile_dock_phone')||!captured.some(r=>r.body?.event_name==='phone_click'&&r.body?.event_source==='en_mobile_dock_phone'))throw new Error('Cookieless phone sources missing');
    await page.locator('[data-home-menu] [href$="#about"]').click();
    await page.waitForFunction(()=>location.hash==='#about'&&Math.abs(document.getElementById('about').getBoundingClientRect().top-8)<16);
    await page.locator('.mobile-dock-item[data-mobile-only-home-item]').click();
    await assertHomeDockActivePink(page,true,'spaces');
    await page.setViewportSize({width:1440,height:900});
    const pv=await page.evaluate(()=>window.__bilingualPixel.filter(a=>a[0]==='track'&&a[1]==='PageView').length);
    await page.locator('[data-desktop-home-dock] [data-language-switch] a[lang="sk"]').click();
    await page.waitForURL(u=>u.pathname==='/');
    await page.waitForFunction(n=>window.__bilingualPixel.filter(a=>a[0]==='track'&&a[1]==='PageView').length===n+1,pv);
    if(await page.evaluate(()=>window.__bilingualDocument)!==doc)throw new Error('Desktop language switch reloaded document');
    if(await page.evaluate(()=>window.__bilingualPixel.some(a=>a[0]==='track'&&['Lead','CompleteRegistration'].includes(a[1]))))throw new Error('Language navigation emitted conversion');
    for(const en of [false,true]){
      if(en){await page.locator('[data-desktop-home-dock] [data-language-switch] a[lang="en"]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');}
      for(const width of [1024,1280,1440,1920]){
        await page.setViewportSize({width,height:900});
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        const dock=page.locator('[data-desktop-home-dock]');
        await dock.waitFor({state:'visible'});
        await page.waitForFunction(()=>document.querySelector('[data-desktop-home-dock]')?.getAttribute('data-desktop-floating')==='false');
        const geometry=await dock.evaluate(el=>{
          const bar=el.querySelector('.mobile-dock-bar'),r=bar.getBoundingClientRect(),slot=el.getBoundingClientRect(),logo=el.querySelector('[data-desktop-dock-logo]'),links=[...el.querySelectorAll('a,button')].filter(x=>x.getClientRects().length);
          const boxes=links.map(x=>x.getBoundingClientRect()), menu=el.querySelector('[data-home-menu]'), upper=menu.querySelector('.mobile-dock-compact-links').getBoundingClientRect(), phone=menu.querySelector('[data-home-dock-phone]').getBoundingClientRect(), lang=menu.querySelector('[data-language-switch]'), langBox=lang.getBoundingClientRect(), selected=lang.querySelector('[aria-current="page"]'), chip=selected.getBoundingClientRect(), chipStyle=getComputedStyle(selected), track=getComputedStyle(lang,'::before'), logoBox=logo.getBoundingClientRect(), lower=[...bar.querySelectorAll('.mobile-dock-item')].filter(x=>x.getClientRects().length).map(x=>x.getBoundingClientRect()), hero=el.previousElementSibling?.getBoundingClientRect();
          return {centered:Math.abs((upper.left+upper.right-r.left-r.right)/2)<2,rightControls:phone.left>=upper.right+4&&langBox.left>=phone.right&&Math.abs(langBox.right-(r.right-11))<=2&&Math.abs(phone.top-langBox.top)<2&&getComputedStyle(menu,'::after').backgroundImage.includes('gradient'),languageContained:chip.left+parseFloat(chipStyle.borderLeftWidth)>=langBox.left+parseFloat(track.left)+1&&chip.right-parseFloat(chipStyle.borderRightWidth)<=langBox.right-parseFloat(track.right)-1&&chip.top+parseFloat(chipStyle.borderTopWidth)>=langBox.top+parseFloat(track.top)+2&&chip.bottom-parseFloat(chipStyle.borderBottomWidth)<=langBox.bottom-parseFloat(track.bottom)-2&&chipStyle.backgroundClip==='padding-box',width:r.width<=980.5,shortcut:el.querySelector('[data-desktop-only-shortcut]')?.getBoundingClientRect().width>0,upperLinks:[...el.querySelectorAll('[data-home-menu] .mobile-dock-compact-links a')].filter(a=>a.getClientRects().length).map(a=>new URL(a.href).hash),fits:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&bar.scrollWidth<=bar.clientWidth+1&&r.bottom<=slot.bottom+1,targets:boxes.every(b=>b.height>=44),separate:boxes.every((b,i)=>boxes.every((a,j)=>i===j||a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1)),header:!!document.querySelector('header.fixed'),logo:Math.abs(logoBox.width-108)<1&&logoBox.right<=upper.left-4&&logoBox.bottom<=lower[0].top+1,rows:lower.length>=5&&lower.every(b=>b.top>=upper.bottom-1&&Math.abs(b.top-lower[0].top)<2),slot:el.previousElementSibling?.id==='top'&&slot.height>=108&&r.top>=hero.bottom-1};
        });
        await assertHomeDockActivePink(page,en);
        await assertHomeDockSurface(page);
        if(!geometry.centered||!geometry.rightControls||!geometry.languageContained||!geometry.width||!geometry.shortcut||geometry.upperLinks.join('|')!==('#aria-puppy-check|'+(en?'#en-benefits':'#preco-chvostikovo')+'|'+(en?'#spaces':'#priestory')+'|#faq')||!geometry.fits||!geometry.targets||!geometry.separate||geometry.header||!geometry.logo||!geometry.rows||!geometry.slot)throw new Error('Desktop home dock '+width+' '+JSON.stringify(geometry));
        await page.evaluate(()=>window.scrollTo({top:900,behavior:'instant'}));
        await page.waitForFunction(()=>document.querySelector('[data-desktop-home-dock]')?.getAttribute('data-desktop-floating')==='true');
        if(!await dock.evaluate(el=>Math.abs(innerHeight-el.querySelector('.mobile-dock-bar').getBoundingClientRect().bottom-12)<2))throw new Error('Desktop dock not floating at bottom');
        await page.screenshot({path:path.join(out,'desktop-home-dock-'+engine+'-'+(en?'en':'sk')+'-'+width+'.png')});
      }
      const priceId=en?'pricing':'cennik';
      await page.locator('[data-desktop-home-dock] .mobile-dock-item[href$="#'+priceId+'"]').click();
      await assertHomeDockActivePink(page,en,priceId);
      await page.locator('[data-desktop-home-dock] .mobile-dock-item[href$="#'+priceId+'"]').hover();
      await assertHomeDockActivePink(page,en,priceId);
      const why=page.locator('[data-desktop-home-dock] [data-desktop-only-shortcut][href$="#'+(en?'en-benefits':'preco-chvostikovo')+'"]');
      await why.click();
      await page.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top-8)<16,en?'en-benefits':'preco-chvostikovo');
      const spacesId=en?'spaces':'priestory';
      await page.locator('[data-desktop-home-dock] [data-desktop-only-shortcut][href$="#'+spacesId+'"]').click();
      await page.waitForFunction(id=>location.hash==='#'+id&&Math.abs(document.getElementById(id).getBoundingClientRect().top-8)<16,spacesId);
      const activeUpper=page.locator('[data-desktop-home-dock] [data-home-menu] a[href$="#'+spacesId+'"]');
      await activeUpper.waitFor({state:'visible'});
      await page.waitForFunction(id=>document.querySelector('[data-desktop-home-dock] [data-home-menu] a[href$="#'+id+'"]')?.getAttribute('aria-current')==='location',spacesId);
      const upperPaint=await activeUpper.evaluate(el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();const state={color:s.backgroundColor,clip:s.backgroundClip,border:parseFloat(s.borderTopWidth),top:b.top+3-p.top,bottom:p.bottom-b.bottom+3,left:b.left+3-p.left,right:p.right-b.right+3};return {...state,ok:state.color==='rgb(248, 221, 236)'&&state.clip==='padding-box'&&state.border>=3&&Math.min(state.top,state.bottom,state.left,state.right)>=2};});
      if(!upperPaint.ok)throw new Error('Active upper navigation chip exceeds tray '+JSON.stringify(upperPaint));
    }
    console.log('PASS bilingual navigation, responsive menu and consented PageView '+engine);
  } finally {await context.close();}
}


// The shared public-content scope verifies actual affected DOM and enquiry
// interaction in both engines, with external network and submissions blocked.
async function assertPublicContent(browser,engine){
  const expected=readPublicContent();
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try{
    await context.addInitScript(()=>localStorage.setItem('chvostikovo-cookies',JSON.stringify({version:'2026-10-03-v2',savedAt:new Date().toISOString(),necessary:true,functional:false,analytics:false,marketing:false})));
    await context.route('**/*',route=>{const req=route.request(),u=new URL(req.url());return u.origin===new URL(base).origin&&['GET','HEAD'].includes(req.method())?route.continue():route.abort();});
    for(const route of [...fullRoutes,'/produkty/','/stojan-na-misky-pre-psa/','/target-na-cvicenie-pre-psov/','/blog/','/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/']){
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        const res=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});if(res?.status()!==200)throw new Error('Content route HTTP '+route);
        const checkMap=async selector=>{const links=page.locator(selector+' a[href*="maps"]');if(await links.count()<1||!(await links.evaluateAll(es=>es.map(e=>e.getAttribute('href')))).every(h=>h===expected.MAP_LINK))throw new Error('Map differs '+route+' '+selector);};
        const checkCopy=async(selector,heading)=>{
          const box=page.locator(selector);await box.waitFor({state:'attached'});
          const actual=await box.locator('[data-lead-form-intro]').evaluateAll(es=>es.flatMap(e=>e.matches('h2,h3,p')?[e.textContent.trim()]:[...e.querySelectorAll('h2,h3,p')].map(n=>n.textContent.trim())));
          if(!actual.includes(heading)||!actual.includes(expected.INQUIRY_SUBTITLE))throw new Error('Enquiry copy '+route+' '+selector+' '+actual);
        };
        const checkHealth=async(selector,value)=>{if(!(await page.locator(selector).textContent()).includes(value))throw new Error('Admission content '+route);};
        const rejectCookie=async()=>{const button=page.getByRole('button',{name:/Len nevyhnutné|Odmietnuť|Necessary only|Reject/}).first();if(await button.isVisible())await activateFixtureControl(button);};
        const fit=async(selector)=>{const box=page.locator(selector);await box.waitFor({state:'visible'});const ok=await box.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+2;});if(!ok)throw Error('Content overflow '+route+' '+selector);};
        await checkMap('footer');
        if(route==='/'){
          await page.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});await rejectCookie();
          await checkMap('#priestory');await checkHealth('#podmienky',expected.health);await checkCopy('#informujte-sa',expected.INQUIRY_TITLE);await checkCopy('#prva-navsteva-form',expected.VISIT_INQUIRY_TITLE);
          await page.setViewportSize({width:320,height:844});
          await activateFixtureControl(page.locator('[data-home-hero-interest-cta]'));await checkCopy('#home-hero-interest',expected.INQUIRY_TITLE);await fit('#home-hero-interest [data-lead-form-shell]');
          const form=page.locator('#home-hero-interest [data-lead-step-form]');await advanceLeadContact(form);await assertLeadContactIntro(form);
          await page.setViewportSize({width:1440,height:900});await checkCopy('#home-hero-inline-form',expected.INQUIRY_TITLE);await fit('#home-hero-inline-form [data-lead-form-shell]');
        }else if(route==='/psia-skolka-kosice/'){
          await page.locator('[data-aria-speech] [data-aria-tail]').waitFor({state:'attached'});await rejectCookie();
          await checkMap('#aria-mosaic');await checkHealth('#lead-requirements',expected.health);await checkCopy('#aria-hero-form',expected.INQUIRY_TITLE);await checkCopy('#lead-friendship-form',expected.INQUIRY_TITLE);
          const order=await page.evaluate(ids=>[...document.querySelector('main').children].map(e=>e.id).filter(id=>ids.includes(id)).join('|')===ids.join('|'),expected.order);if(!order)throw Error('Paid section order');
          if(await page.locator('main [data-lead-step-form]').count()!==2)throw Error('Paid enquiry missing or duplicated');
          for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});await fit('#aria-hero-form [data-lead-form-shell]');await fit('#lead-friendship-form [data-lead-form-shell]');}
          await page.setViewportSize({width:390,height:844});
          await assertHeroAriaEntry(page);await activateFixtureControl(page.locator('[data-lead-faq-cta]'));await page.waitForFunction(()=>{const r=document.getElementById('aria-hero-form').getBoundingClientRect();return r.top>=0&&r.top<130;},null,{timeout:5000});
          const form=page.locator('#aria-hero-form [data-lead-step-form]');await advanceLeadContact(form);await assertLeadContactIntro(form);
          await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
          await page.waitForFunction(()=>scrollY<5);
          const launcher=page.locator('[data-aria-lead-chat] [data-aria-bubble-chat-cta]');
          const hit=await launcher.evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.bottom+2};});
          if(await page.evaluate(()=>navigator.maxTouchPoints>0))await page.touchscreen.tap(hit.x,hit.y);else await page.mouse.click(hit.x,hit.y);
          const chat=page.locator('[data-aria-chat]');await chat.waitFor({state:'visible'});
          await chat.locator('[data-aria-chat-question="requirements"]').click();
          await chat.locator('[data-aria-chat-requirements]').waitFor({state:'visible',timeout:20000});
          if(!(await chat.locator('[data-aria-chat-requirements]').textContent()).includes(expected.health))throw Error('Aria admission copy differs');
          await chat.getByRole('button',{name:'Close',exact:true}).click();
        }else if(route==='/test-aria/'){
          await checkMap('#aria-mosaic');await checkHealth('#lead-requirements',expected.health);await checkCopy('#aria-hero-form',expected.INQUIRY_TITLE);await checkCopy('#aria-first-visit-form',expected.VISIT_INQUIRY_TITLE);
        }else if(route==='/en/dog-daycare-kosice/'){
          await checkMap('#spaces');await checkHealth('#requirements',expected.englishHealth);
        }else{
          const health=page.locator('#podmienky,#lead-requirements');if(await health.count()===1)await checkHealth('#podmienky,#lead-requirements',expected.health);
        }
        if(errors.length)throw Error('Content runtime error '+route+' '+errors.join('; '));
        console.log('PASS public content '+engine+' '+route);
      }finally{await page.close();}
    }
  }finally{await context.close();}
}

(async () => {
  for (const [engine, browserType] of selectedEngines) {
    const browser = await browserType.launch();
    try {
    if(runtimeScope==='content'){
      await assertPublicContent(browser,engine);
      results.push({engine,scope:'content',status:'PASS'});
      continue;
    }
    if(runtimeScope==='navigation'){
      await assertBilingualNavigation(browser,engine,{navigationOnly:true});
      await assertPaidReturnNavigation(browser,engine);
      results.push({engine,scope:'navigation',status:'PASS'});
      continue;
    }
    if (!bellaris && brandPreviewCandidate && runtimeScope==='full') { await assertBilingualLegalFooter(browser, engine); await assertFooterMapGeometry(browser, engine); await assertBilingualNavigation(browser,engine); }
    for (const restricted of (runtimeScope==='aria-visual'?[false]:[false,true])) {
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
              throw new Error('Aria SSR must not show an unmeasured SVG tail');
            if(url.pathname==='/psia-skolka-kosice/'&&!serverHtml.includes('data-aria-initial-outline="true"'))
              throw new Error('Paid Aria must have a complete stable outline on first paint');
          }
          // The server HTML is visible before effects run; wait for client hydration.
          await page.waitForTimeout(3000);
          const text = await page.locator('body').innerText();
          if (/This page didn.t load|Stránku sa nepodarilo načítať|Something went wrong on our end/i.test(text)) throw new Error('Root error boundary replaced the website');
          if (!await page.locator('h1').count()) throw new Error('Missing page heading');
          // Cookie preferences are installed by a client effect, so this also verifies hydration.
          const cookieButton = page.getByRole('button', { name: /Odmietnuť|Reject|Reject all|Len nevyhnutné|Necessary only/i }).first();
          await cookieButton.waitFor({ timeout: 10000 });
          const revisedLead=url.pathname==='/psia-skolka-kosice/' && await page.locator('[data-lead-hero-pills]').count()>0;
          if (brandPreviewCandidate && !bellaris && !revisedLead && ['/test-aria/', '/psia-skolka-kosice/'].includes(url.pathname)) {
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
                  palette.actionBg !== 'rgb(255, 255, 255)' ||
                  palette.firstVisitAction !== 'rgb(255, 255, 255)' ||
                  palette.badgeBg !== (url.pathname === '/psia-skolka-kosice/' ? 'rgba(255, 181, 85, 0.38)' : 'rgb(255, 164, 20)') ||
                  palette.badgeFg !== (url.pathname === '/psia-skolka-kosice/' ? 'rgb(38, 50, 43)' : 'rgb(255, 255, 255)') ||
                  palette.headline !== 'rgb(255, 164, 20)' ||
                  (url.pathname === '/test-aria/' && (palette.heroCopyBg !== 'rgb(255, 164, 20)' || palette.heroCopyFg !== 'rgb(23, 28, 24)')) ||
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
          if (!bellaris && (brandPreviewCandidate || isAriaPage || isPuppyAria)) {
            const englishCookie=url.pathname.startsWith("/en/");
            if (!await page.getByText(englishCookie ? "We use cookies" : "Ahoj! Používame cookies 🍪",{exact:true}).count())
              throw new Error('Preview cookie greeting missing');
            const bubble = page.locator('[data-aria-cookie-bubble="true"]');
            await bubble.waitFor({ state: 'visible' });
            if (!await page.getByRole('button', { name: englishCookie ? 'Accept all' : 'Prijať všetky' }).isVisible() ||
                !await page.getByRole('button', { name: englishCookie ? 'Customize' : 'Prispôsobiť' }).isVisible() ||
                !await cookieButton.isVisible())
              throw new Error('Aria cookie bubble lost equivalent accept, customize or reject options');
            if(brandPreviewCandidate)await assertCookieBrandSurface(page);
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
          if(brandPreviewCandidate&&!bellaris&&url.pathname==='/')await assertCookieChoices(page);
          if(runtimeScope==='aria-visual'){
            if(!revisedLead)throw new Error('Visual scope requires the current LEAD fixture');
            await assertCampaignContentFlow(page,{visualOnly:true});
            results.push({engine,restricted,route:url.pathname,scope:'aria-visual',status:'PASS'});
            console.log('PASS LEAD visual geometry and chat surface '+engine);continue;
          }
          if(revisedLead) await assertCampaignContentFlow(page,{trackedEvents:restricted?null:trackedEvents});
          // Candidate-only regression for the three unified Chvostíkovo galleries.
          // Production-baseline CI keeps testing its already published version.
          if (!bellaris && !restricted && !revisedLead && new URL(base).hostname === '127.0.0.1') {
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
                    await page.locator('[data-aria-review-photo]').count() !== 0 ||
                    await page.locator('#aria-mosaic').count() !== 1 ||
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
                  const formNode = document.querySelector('#aria-hero-form');
                  const cta = hero?.querySelector('[data-aria-lead-hero-cta]')?.getBoundingClientRect();
                  const description = hero?.querySelector('[data-lead-hero-photos]')?.getBoundingClientRect();
                  const inner = formNode?.querySelector('[data-lead-inline-card]');
                  const lower = document.querySelector('#aria-first-visit-form .form-liquid-surface');
                  const ctaNode = hero?.querySelector('[data-aria-lead-hero-cta]');
                  const badgeNode = hero?.querySelector('[data-aria-service-badge]');
                  const dockNode = document.querySelector('[data-aria-dock]');
                  const liquidProperties = (node) => {
                    if (!node) return null;
                    const css = getComputedStyle(node);
                    return { fill: css.backgroundColor, image: css.backgroundImage,
                      border: css.borderTopColor, borderWidth: css.borderTopWidth,
                      shadow: css.boxShadow, filter: css.backdropFilter || css.webkitBackdropFilter };
                  };
                  const upperStyle = liquidProperties(inner);
                  const lowerStyle = liquidProperties(lower);
                  const liquidGlass = node => {
                    const css = node ? getComputedStyle(node) : null;
                    return !!css && css.backgroundColor.startsWith('rgba(') &&
                      ((css.backdropFilter || '').includes('blur(') || (css.webkitBackdropFilter || '').includes('blur('));
                  };
                  const heroDogs = formNode?.querySelector('[data-aria-hero-form-dogs]');
                  const firstVisitDogs = document.querySelector('#aria-first-visit-form [data-aria-first-visit-dogs]');
                  return {
                    width: window.innerWidth,
                    cardCount: cards.length, highlightCount: highRes.length,
                    headingBottom: heading?.bottom, badgeTop: badge?.top,
                    reviewBottom: reviews?.bottom, galleryTop: gr?.top, trackTop: tr?.top, trackBottom: tr?.bottom,
                    heroBottom: hero?.getBoundingClientRect().bottom,
                    menuBottom: dock?.getBoundingClientRect().bottom,
                    formHidden: !!formNode?.hidden, formTop: form?.top, formContentTop: formContent?.top, formBottom: form?.bottom,
                    ctaTop: cta?.top, ctaBottom: cta?.bottom, descBottom: description?.bottom,
                    matchingFormStyles: !!upperStyle && !!lowerStyle &&
                      Object.keys(upperStyle).every(k => upperStyle[k] === lowerStyle[k]) &&
                      !formNode.querySelector('div.rounded-4xl'),
                    dogCrownMatches: !!heroDogs && !!firstVisitDogs &&
                      heroDogs.querySelector('img')?.getAttribute('src') === firstVisitDogs.querySelector('img')?.getAttribute('src') &&
                      !!heroDogs.querySelector('[data-crown-ground]'),
                    liquidBadge: liquidGlass(badgeNode) && getComputedStyle(badgeNode).color === 'rgb(38, 50, 43)',
                    liquidCta: getComputedStyle(ctaNode).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(ctaNode).color === 'rgb(169, 84, 0)' && getComputedStyle(ctaNode,'::after').backgroundColor === 'rgb(184, 46, 127)' &&
                      cta.width >= 225 && cta.width <= 300 &&
                      ctaNode.getAttribute('aria-controls') === 'lead-pricing' && !ctaNode.getAttribute('aria-haspopup'),
                    liquidDock: liquidGlass(dockNode) &&
                      !!dockNode.querySelector('[data-aria-interest-cta]'),
                    fixed: dock ? getComputedStyle(dock).position === 'fixed' && !hero.contains(dock) : false,
                    reviewSpacing: parseFloat(getComputedStyle(hero?.querySelector('[data-aria-lead-review-spacing]')).marginTop),
                  };
                });
                if (!layout.fixed || layout.cardCount !== 20 || layout.highlightCount !== 2 ||
                    layout.badgeTop < layout.headingBottom + 8 ||
                    layout.ctaTop < layout.descBottom - 1 || layout.ctaBottom > layout.reviewBottom ||
                    !layout.matchingFormStyles || !layout.dogCrownMatches ||
                    !layout.liquidBadge || !layout.liquidCta || !layout.liquidDock ||
                    layout.galleryTop < layout.heroBottom - 8 || layout.trackTop < layout.heroBottom - 8 ||
                    (!layout.formHidden && (layout.formTop < layout.reviewBottom + 12 ||
                      layout.galleryTop < layout.formBottom - 8)))
                  throw new Error('Paid photo hero → amber liquid CTA → matching visit form + glass dock regressed: ' + JSON.stringify(layout));
                if (layout.width < 640 && (layout.reviewSpacing < 24 || layout.reviewSpacing > 36))
                  throw new Error('Approved mobile review spacing regressed: ' + JSON.stringify(layout));
                await highlights.first().scrollIntoViewIfNeeded();
                await highlights.first().click();
                await verifyLightbox(true);
                // Paid LEAD has both the original moving carousel AND the restored
                // two-column mosaic, which must open higher-res copies of the SAME
                // eight Wix gallery asset IDs. No new photos or static carousel clones.
                const mosaic = page.locator('#aria-mosaic');
                const tiles = mosaic.locator('button[aria-label^="Otvoriť fotografiu"]');
                if (await tiles.count() !== 8 ||
                    !await mosaic.getByRole('heading', {name:'Kde bude váš psík počas dňa?'}).count())
                  throw new Error('Paid LEAD mosaic must restore all eight approved photos below Prečo Chvostíkovo');
                const photoQuality = await mosaic.evaluate(el => {
                  const images = [...el.querySelectorAll('button img')];
                  return images.length === 8 && images.every(img =>
                    img.getAttribute('src')?.includes('/w_1600,h_1600,al_c,q_92,enc_auto/') &&
                    img.getAttribute('srcset')?.includes('/w_900,h_900,al_c,q_85,enc_auto/') &&
                    img.getAttribute('srcset')?.includes('/w_1600,h_1600,al_c,q_92,enc_auto/'));
                });
                if (!photoQuality) throw new Error('Restored mosaic must retain original photo IDs with 900w/1600w responsive CDN renditions');
                await tiles.first().scrollIntoViewIfNeeded();
                await tiles.first().click();
                await verifyLightbox();
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

          if (!bellaris && isAriaPage && !restricted && !revisedLead) {
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
                photoHero:document.querySelectorAll('[data-lead-hero-photo]').length===2&&!document.querySelector('.lead-brand-live [data-aria-hero-description],.lead-brand-live [data-aria-hero-dogs]'),
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
                (url.pathname === '/psia-skolka-kosice/' ? !desktop.photoHero : (desktop.dogsWidth < 390 || !desktop.dogsTouchBadge || !desktop.liquid)) ||
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
                const activeKey=id==='aria-about'?'about':id==='lead-pricing'?'pricing':id==='lead-requirements'?'requirements':'interest';
                await page.waitForFunction(key=>document.querySelector('[data-lead-nav-key="'+key+'"]')?.getAttribute('aria-current')==='location',activeKey,{timeout:5000});
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
                if(location.pathname==='/psia-skolka-kosice/'){
                  const hero=document.querySelector('section.hero-safe-top'), title=hero.querySelector('h1'), badge=hero.querySelector('[data-aria-service-badge]');
                  const frame=hero.querySelector('[data-lead-hero-photos]'), photos=[...hero.querySelectorAll('[data-lead-hero-photo]')], images=photos.map(el=>el.querySelector('img'));
                  const cta=hero.querySelector('[data-aria-lead-hero-cta]'), reviews=hero.querySelector('#recenzie'), proof=reviews?.querySelector('[data-aria-review-proof]');
                  const guide=document.querySelector('[data-aria-guide]'), form=document.getElementById('aria-hero-form'), carousel=document.getElementById('lead-photo-carousel');
                  const about=document.getElementById('aria-caretakers'), aboutHeading=about?.querySelector('h2'), benefits=about?.querySelector('[data-hero-benefits]');
                  if(!title||!badge||!frame||photos.length!==2||!cta||!reviews||!proof||!guide||!form||!carousel||!aboutHeading||!benefits)return {paidHero:true,checks:{elements:false}};
                  const t=title.getBoundingClientRect(),b=badge.getBoundingClientRect(),f=frame.getBoundingClientRect(),c=cta.getBoundingClientRect(),v=reviews.getBoundingClientRect(),q=proof.getBoundingClientRect();
                  const rects=photos.map(el=>el.getBoundingClientRect()), dockOffset=innerHeight-guide.getBoundingClientRect().bottom;
                  const reviewCard=reviews.querySelector('[data-review-card]'),track=reviews.querySelector('[data-gesture-track="reviews"]');
                  return {paidHero:true,floatingDockBottomOffset:dockOffset,checks:{
                    photoAssets:images[0]?.getAttribute('src')?.includes('lead-hero-user-1')&&images[1]?.getAttribute('src')?.includes('lead-hero-user-2')&&images.every(img=>!!img.alt.trim()&&img.complete&&img.naturalWidth>0),
                    minimalCopy:!hero.querySelector('[data-aria-hero-description],[data-aria-hero-dogs]'),
                    order:b.top>=t.bottom+8&&f.top>=b.bottom+8&&c.top>=f.bottom+8&&v.top>=c.bottom+8,
                    paired:Math.abs(rects[0].top-rects[1].top)<=2&&Math.abs(rects[0].width-rects[1].width)<=2&&rects[0].right<=rects[1].left&&rects.every(r=>r.left>=0&&r.right<=innerWidth+1&&r.height>=110),
                    fitting:title.scrollWidth<=title.clientWidth+2&&badge.scrollWidth<=badge.clientWidth+2&&cta.scrollWidth<=cta.clientWidth+2&&c.height>=44,
                    proof:q.left>=0&&q.right<=innerWidth+1&&q.height<=parseFloat(getComputedStyle(proof).lineHeight)*1.55&&proof.scrollWidth<=proof.clientWidth+2,
                    reviews:!!reviewCard&&!!track&&getComputedStyle(reviews).overflowY!=='hidden'&&getComputedStyle(reviewCard).boxShadow!=='none',
                    fixedDock:getComputedStyle(guide).position==='fixed'&&dockOffset>=6&&dockOffset<=54,
                    controlledChat:cta.getAttribute('aria-controls')==='lead-pricing'&&!cta.getAttribute('aria-haspopup')&&cta.textContent.trim()==='Spoznajte našu škôlku'&&!form.hidden,
                    carouselOrder:carousel.getBoundingClientRect().top>=(form.hidden?hero.getBoundingClientRect().bottom:form.getBoundingClientRect().bottom)-8,
                    caretakers:benefits.children.length===3&&aboutHeading.scrollWidth<=aboutHeading.clientWidth+2,
                    crownInForm:!!form.querySelector('[data-crown-ground]')&&!!document.querySelector('#aria-first-visit-form [data-crown-ground]')
                  }};
                }
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
                const paidCarousel = window.location.pathname === '/psia-skolka-kosice/';
                const formIsHidden = paidCarousel && form.hidden;
                const formTop = formIsHidden ? hero.getBoundingClientRect().bottom : form.getBoundingClientRect().top;
                const formContentTop = formIsHidden
                  ? window.innerHeight // no interactive form exists in the rendered flow while hidden
                  : form.querySelector('[data-lead-step-form]')?.getBoundingClientRect().top;
                const reviewBottom = reviews.getBoundingClientRect().bottom;
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
                  formIsHidden,
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
                  paidPhotosBelowFloatingDock: !paidCarousel ||
                    (!!photoFrame && !!floatingGuide && formTop >= reviewsBottom + 8 &&
                     formTop >= window.innerHeight - 24 &&
                     Number.isFinite(formContentTop) &&
                     (formIsHidden
                       ? Math.abs(hero.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top) <= 2
                       : Math.abs(form.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top) <= 2) &&
                     !hero.contains(newPhotos) &&
                     photoRects.every(rect => rect.top >= spacer.getBoundingClientRect().top - 2)),
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
                  reviewGapAbove: reviewsRect.top - (paidCarousel
                    ? (hero.querySelector('[data-aria-lead-hero-cta]')?.getBoundingClientRect().bottom ?? descriptionRect.bottom)
                    : descriptionRect.bottom),
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
                    !!form.querySelector('.pointer-events-none.absolute.inset-0') &&
                    (!paidCarousel ||
                      (!!form.querySelector('[data-lead-inline-card]') &&
                       !!form.querySelector('[data-aria-hero-form-dogs]') &&
                       !form.querySelector('div.rounded-4xl'))),
                  groundedFirstVisit: !!document.querySelector('#aria-first-visit-form [data-crown-ground]'),
                  bothDogCrowns: heroDogs.getAttribute('src') === firstVisitDogs.getAttribute('src'),
                  proofLeft: rect.left,
                  proofRight: rect.right,
                  proofHeight: rect.height,
                  lineHeight,
                  textOverflows: proof.scrollWidth > proof.clientWidth + 2,
                };
              });
              if(firstFold.paidHero){
                if(Object.values(firstFold.checks).some(value=>!value))throw new Error('Paid photo Hero regression at '+width+': '+JSON.stringify(firstFold));
              } else if (firstFold.missing ||
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
              if (url.pathname === '/psia-skolka-kosice/' && !await leadInfoForm.isVisible())
                 throw new Error('Paid direct inline form must remain available independently of Hero chat');
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
                if ((width >= 1024 && (dockSize.width < 450 || dockSize.width > 482)) ||
                    Math.abs(dockSize.height - 50) > 2)
                  throw new Error('Paid dock must stay narrower with 44px hit targets: ' + JSON.stringify({width, dockSize}));
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
                  const questionMenu=chat.locator('[data-aria-chat-questions]');
                  await questionMenu.waitFor({state:'visible',timeout:10000});
                  const ids=async()=>questionMenu.locator('[data-aria-chat-question]').evaluateAll(nodes=>
                    nodes.map(node=>node.getAttribute('data-aria-chat-question')));
                  if(JSON.stringify(await ids())!==JSON.stringify(['pricing','requirements','caretakers','puppy'])||
                     await chat.locator('[data-aria-chat-show-questions]').count()||
                     await chat.locator('[data-aria-chat-form-scroll]').count())
                    throw new Error('TEST Aria must start with four questions but no extra toggle or form panel');
                  const actions=chat.locator('[data-aria-chat-action-panel]');
                  const interestCta=actions.locator('[data-aria-chat-interest-cta]');
                  const otherCta=actions.locator('[data-aria-chat-other-cta]');
                  if(!await otherCta.getByText('Máš inú otázku?').count() ||
                     await interestCta.evaluate(el=>el.getBoundingClientRect().width<=el.previousElementSibling.getBoundingClientRect().width||el.getBoundingClientRect().left<=el.previousElementSibling.getBoundingClientRect().left))
                    throw new Error('CTA must rename the question and widen Mám záujem o škôlku');
                  await page.setViewportSize({width:320,height:720});
                  const size=await chat.evaluate(el=>{
                    const r=el.getBoundingClientRect(),h=el.querySelector('[data-aria-chat-history]');
                    const cards=[...el.querySelectorAll('[data-aria-chat-questions] button')].map(x=>x.getBoundingClientRect());
                    return {left:r.left,right:r.right,width:innerWidth,overflow:h.scrollWidth-h.clientWidth,
                      cards:cards.map(c=>({left:c.left,right:c.right,height:c.height}))};
                  });
                  if(size.left< -1||size.right>size.width+1||size.overflow>2||size.cards.length!==4||
                     size.cards.some(c=>c.left< -1||c.right>size.width+1||c.height<43))
                    throw new Error('320px TEST Aria must have 4 accessible FAQ bubbles without clipping: '+JSON.stringify(size));
                  await page.setViewportSize({width:390,height:844});
                  await questionMenu.locator('[data-aria-chat-question="pricing"]').click();
                  const typing=chat.locator('[data-aria-chat-turn="aria"] [data-aria-typing="true"]');
                  await typing.waitFor({state:'visible',timeout:10000});
                  await typing.locator('[data-aria-composing]').waitFor({state:'visible',timeout:2500});
                  if(await questionMenu.count())throw new Error('FAQ must wait until Aria finishes composing');
                  await page.waitForFunction(()=>{
                    const t=document.querySelector('[data-aria-chat-turn="aria"] [data-aria-typing="true"]');
                    return (t?.querySelector('[aria-hidden="true"]')?.textContent?.length||0)>12;
                  },null,{timeout:5000});
                  const sample=await typing.evaluate(el=>({
                    shown:el.querySelector('[aria-hidden="true"]')?.textContent?.length||0,
                    full:el.querySelector('.sr-only')?.textContent?.length||0,
                    top:el.getBoundingClientRect().top,
                    viewport:el.closest('[data-aria-chat-history]').getBoundingClientRect(),
                  }));
                  await page.waitForTimeout(230);
                  const afterSample=await typing.evaluate(el=>el.querySelector('[aria-hidden="true"]')?.textContent?.length||0);
                  if(sample.shown>=sample.full||afterSample<=sample.shown||
                    sample.top<sample.viewport.top-2||sample.top>sample.viewport.bottom)
                    throw new Error('iPhone reply text must progressively animate visibly rather than appear after auto scroll: '+JSON.stringify({sample,afterSample}));
                  await typing.waitFor({state:'hidden',timeout:20000});
                  if(!await chat.getByText(/20 €\/deň/).count()||
                     !await chat.getByText(/ušetríš 50 €/).count()||
                     !await chat.getByText(/200 €/).count())
                    throw new Error('Pass must state 20 €/day, saving 50 € and pass price 200 €');
                  if(JSON.stringify(await ids())!==JSON.stringify(['requirements','caretakers','puppy','eligibility'])||
                     await chat.locator('[data-aria-chat-followup-prompt]').count())
                    throw new Error('Four next unanswered questions must show without redundant followup');
                  await questionMenu.locator('[data-aria-chat-question="requirements"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  if(await chat.locator('[data-aria-chat-requirements] article').count()!==4||await questionMenu.locator('button').count()!==4)
                    throw new Error('Existing four requirement cards and four FAQ options must remain visible');
                  await questionMenu.locator('[data-aria-chat-question="puppy"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  const puppy=chat.locator('[data-aria-chat-puppy-check]');
                  await puppy.waitFor({state:'visible'});
                  if(!await puppy.locator('[data-aria-puppy-step="single"]').isVisible()||
                     !await puppy.getByText('Zistite, či vaše šteniatko spĺňa podmienky prijatia').count()||
                     await puppy.getByText('Máte šteniatko?',{exact:true}).count()||
                     await puppy.getByText(/Rýchle orientačné overenie/).count()||
                     await puppy.getByRole('button',{name:/Pokračovať na očkovania/}).count()||
                     await chat.locator('[data-aria-chat-form-scroll]').count()||
                     !await chat.locator('[data-aria-chat-history]').isVisible())
                    throw new Error('Puppy checker must be one compact inline chat step under the typed answer');
                  if(await puppy.getByRole('button',{name:/Pokračovať na kontakt/}).count())
                    throw new Error('Puppy check cannot approve unknown vaccines');
                  const fields=puppy.locator('fieldset');
                  if(await fields.count()!==3)throw new Error('Puppy checker must show all three vaccines');
                  for(const field of await fields.all()) await field.getByText('Áno',{exact:true}).click();
                  await puppy.getByRole('button',{name:/Pokračovať na kontakt/}).click();
                  const puppyContact=chat.locator('[data-aria-chat-puppy-contact]');
                  await puppyContact.waitFor({state:'visible'});
                  if(!await puppyContact.locator('form').count()||!await questionMenu.isVisible())
                    throw new Error('Puppy contact must extend the same conversation, not require going back');
                  await questionMenu.locator('[data-aria-chat-question="caretakers"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  if(JSON.stringify(await ids())!==JSON.stringify(['eligibility','first_visit','reservation','location']))
                    throw new Error('New questions must fill all 4 available slots after the first four selections');
                  await questionMenu.locator('[data-aria-chat-question="reservation"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  const booking=chat.locator('[data-aria-chat-turn="aria"]').last();
                  if(!await booking.locator('strong').filter({hasText:'do nedele 20:00'}).count()||
                     !await booking.locator('strong').filter({hasText:'vieme sa dohodnúť aj individuálne'}).count())
                    throw new Error('Booking must preserve approved Sunday deadline and individual agreement');
                  if(JSON.stringify(await ids())!==JSON.stringify(['eligibility','first_visit','location','space']))throw new Error('Reservation refills with space in correct order');
                  await questionMenu.locator('[data-aria-chat-question="eligibility"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  if(!(await chat.locator('[data-aria-chat-turn="aria"]').last().innerText()).includes('nad 15 kg')||JSON.stringify(await ids())!==JSON.stringify(['first_visit','location','space','taxi']))throw new Error('Eligibility answer and taxi refill must follow ten-question order');
                  await questionMenu.locator('[data-aria-chat-question="taxi"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  if(!(await chat.locator('[data-aria-chat-turn="aria"]').last().innerText()).includes('5 € za jednu jazdu')||JSON.stringify(await ids())!==JSON.stringify(['first_visit','location','space']))throw new Error('Taxi answer and final three remaining choices must be correct');
                  // Location answer always exposes the canonical map link, without third-party requests.
                  await questionMenu.locator('[data-aria-chat-question="location"]').click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  const locationMap=chat.locator('[data-aria-location-map]');
                  await locationMap.waitFor({state:'visible'});
                  const locationReply=await chat.locator('[data-aria-chat-turn="aria"]').last().innerText();
                  if(!['Poľskej 6','Rastislavova','autoumyvárke','bezplatné parkovisko','12 a 54'].every(value=>locationReply.includes(value))||await locationMap.locator('iframe').count()||await locationMap.locator('a').getAttribute('href')!==readPublicContent().MAP_LINK||!await assertArrivalImage(locationMap))throw new Error('Location answer or canonical map link');
                  await otherCta.click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  const other=chat.locator('[data-aria-chat-other]');
                  await other.waitFor({state:'visible'});
                  const wizard=other.locator('[data-home-faq-contact-form]');
                  if(await wizard.getAttribute('data-step')!=='1'||!await wizard.locator('textarea[name="otazka"]').isVisible()||
                     await wizard.locator('input[name="meno"]').isVisible()||!await chat.locator('[data-aria-chat-history]').isVisible())
                    throw new Error('Question-first contact must reuse homepage form INLINE and show no contact fields initially');
                  await wizard.locator('textarea[name="otazka"]').fill('Aké sú možnosti pre dvoch psíkov?');
                  await wizard.getByRole('button',{name:'Pokračovať'}).click();
                  if(await wizard.getAttribute('data-step')!=='2'||!await wizard.locator('input[name="meno"]').isVisible())
                    throw new Error('Contact fields must display in wizard step 2');
                  let askedPayload=null;
                  await page.route('**/functions/v1/web-form-submit',async route=>{
                    const cors={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
                    if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:cors});return;}
                    askedPayload=route.request().postDataJSON();
                    await route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({ok:true})});
                  });
                  await wizard.locator('input[name="meno"]').fill('Test Otázka');
                  await wizard.locator('input[name="telefon"]').fill('+421901234567');
                  await wizard.locator('input[name="email"]').fill('test@example.invalid');
                  await wizard.locator('input[type="checkbox"]').check();
                  await wizard.getByRole('button',{name:'Poslať'}).click();
                  await other.locator('[data-home-faq-contact-success]').waitFor({state:'visible'});
                  if(!askedPayload||askedPayload.cta_source!=='aria_preview_chat_other'||
                     askedPayload.raw_payload?.['Otázka návštevníka']!=='Aké sú možnosti pre dvoch psíkov?')
                    throw new Error('Inline question must preserve CRM contact source after explicit consent');
                  await page.unroute('**/functions/v1/web-form-submit');
                  await interestCta.click();
                  await chat.locator('[data-aria-typing="true"]').waitFor({state:'hidden',timeout:20000});
                  const interest=chat.locator('[data-aria-chat-interest]').last();
                  await interest.locator('[data-lead-step-form]').waitFor({state:'visible'});
                  if(!await chat.locator('[data-aria-chat-history]').isVisible()||
                     await chat.locator('[data-aria-chat-form-scroll]').count()||
                     !await interest.getByText('Krok 1 z 2').count())
                    throw new Error('Interest form must remain in conversation and reuse original 2-step experience');
                  await interest.locator('label:has(input[name="zaujem"])').nth(1).click();
                  await interest.getByRole('button',{name:'Pokračovať'}).click();
                  await interest.getByText('Krok 2 z 2').waitFor({state:'visible'});
                  await interest.locator('input[name="meno"]').fill('Test Aria');
                  await interest.locator('input[name="plemeno"]').fill('Írsky vlkodav');
                  await interest.locator('input[name="telefon"]').fill('+421901234567');
                  await interest.locator('input[type="checkbox"]').check();
                  let posted=null;
                  await page.route('**/functions/v1/web-form-submit',async route=>{
                    const cors={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
                    if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:cors});return;}
                    posted=route.request().postDataJSON();
                    await route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({ok:true})});
                  });
                  await interest.getByRole('button',{name:'Odoslať záujem'}).click();
                  await interest.locator('[data-lead-step-success]').waitFor({state:'visible'});
                  if(!posted||posted.cta_source!=='aria_preview_chat_interest')
                    throw new Error('Inline interest must preserve the original CRM tracking source');
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
              const dockMargin = url.pathname === '/psia-skolka-kosice/' ? 20 : 10;
              if (!dock || !portraitAboveDock || Math.abs(dock.x - dockMargin) > 2 ||
                  Math.abs(width - dock.x - dock.width - dockMargin) > 2 ||
                  dock.width < width - dockMargin*2 - 4 || dock.width > width - dockMargin*2 + 4 ||
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
              if (!await aria.locator('[data-aria-requirements]').getByText(/Hárajúce feny/).count() ||
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
                const extras=await page.locator('[data-lead-pricing-extras]').evaluate(el=>{
                  const v=el.querySelector('[data-first-visit-group]')?.getBoundingClientRect();
                  const t=el.querySelector('[data-aria-taxi]')?.getBoundingClientRect();
                  return !!v&&!!t&&Math.abs(v.width-t.width)<=2&&Math.abs(v.top-t.top)<=2&&
                    Math.abs(v.height-t.height)<=2&&v.right<=t.left&&
                    [...el.querySelectorAll('*')].filter(n=>n instanceof HTMLElement).every(n=>n.scrollWidth<=n.clientWidth+2);
                });
                if(!extras)throw new Error('Paid LEAD visit/taxi must share equal columns without overflow at '+width);
                for(const id of ['aria-hero-form','aria-first-visit-form']){
                  const inside=await page.locator('#'+id+' [data-lead-step-form]').evaluate(el=>{
                    const shell=el.closest('[data-lead-form-shell]');
                    return !!shell?.classList.contains('form-liquid-surface')&&
                      !!shell.querySelector(':scope > [data-lead-form-intro] h2');
                  });
                  if(!inside)throw new Error('Paid LEAD introduction must be inside the form card: '+id);
                }
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
              if (await page.locator('#aria-mosaic img').count() !== 8)
                throw new Error('Paid LEAD and preview must both reuse the original eight-photo mosaic');
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
                const photoHero = content?.querySelector('[data-lead-hero-photos]');
                const proof = reviews?.querySelector('[data-aria-review-proof]');
                const introSpace = isPaidLead ? document.querySelector('[data-aria-lead-photos]')
                  : leadHero?.querySelector('[data-aria-intro-space]');
                const benefits = team?.querySelector('[data-hero-benefits]');
                const inlineMenu = leadHero?.querySelector('[data-aria-hero-menu]');
                const floatingMenu = document.querySelector('[data-aria-guide]');
                const firstVisitDogs = document.querySelector('#aria-first-visit-form [data-aria-first-visit-dogs]');
                if (!reviews || !form || !team || !leadHero || !content || !introTopSpace ||
                    !headlineSpacer || !serviceGroup || !heroHeading ||
                    (!isPaidLead && (!heroDogs || !leadDescription)) ||
                    (isPaidLead && (!photoHero || heroDogs || leadDescription)) ||
                    !badge || !proof || !introSpace ||
                    !benefits || !firstVisitDogs ||
                    !content.contains(reviews) || content.parentElement !== leadHero ||
                    form.parentElement !== leadHero.parentElement) return false;
                const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
                const heading = team.querySelector('h2');
                const photo = team.querySelector('img');
                const copy = team.querySelector('p');
                const commonOrder = follows(introTopSpace, headlineSpacer) && follows(headlineSpacer, heroHeading) &&
                  follows(heroHeading, serviceGroup) &&
                  (isPaidLead ? (follows(badge, photoHero) && follows(photoHero, proof)) :
                    (follows(heroHeading, heroDogs) && follows(heroDogs, badge) && follows(badge, leadDescription) && follows(leadDescription, proof))) &&
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
              if (!await hero.getByRole('heading', { name: readPublicContent().INQUIRY_TITLE }).count())
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
                  ? ['recenzie', 'lead-photo-carousel', 'lead-pricing', 'lead-first-visit', 'aria-hero-form', 'aria-first-visit-form', 'aria-caretakers', 'aria-about',
                      'lead-benefits', 'lead-requirements', 'aria-puppy-check', 'aria-mosaic', 'lead-friendship-form', 'lead-faq']
                  : ['recenzie', 'aria-caretakers', 'aria-about', 'aria-early-faq', 'aria-mosaic',
                     'lead-benefits', 'lead-pricing', 'lead-requirements', 'lead-faq',
                     'aria-puppy-check', 'lead-first-visit'];
                const elements = ids.map(id => document.getElementById(id));
                return elements.every((node, idx) => node && (idx === 0 || !!(elements[idx-1] && elements[idx-1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)));
              });
              if (!hasCorrectOrder) throw new Error('LEAD/preview section hierarchy differs from approved mobile layout');
              if (url.pathname === '/psia-skolka-kosice/') {
                const adjacent = await page.evaluate(() => {
                  const benefits = document.getElementById('lead-benefits');
                  const mosaic = document.getElementById('aria-mosaic');
                  const faq = document.getElementById('lead-faq');
                  return !!benefits && !!mosaic && !!faq &&
                    benefits.nextElementSibling === mosaic && mosaic.nextElementSibling === faq &&
                    mosaic.scrollWidth <= document.documentElement.clientWidth + 2;
                });
                if (!adjacent) throw new Error('Mosaic must directly follow Prečo Chvostíkovo, without horizontal overflow');
              }
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
            const priorSubmits=trackedEvents.filter(e=>e.name==='form_submit').length;
            await assertHeroAriaEntry(page);
            for(let i=0;i<15&&!trackedEvents.some(e=>e.name==='explore_daycare'&&e.source==='lead_landing_hero_aria_cta');i++)await page.waitForTimeout(100);
            if(!trackedEvents.some(e=>e.name==='explore_daycare'&&e.source==='lead_landing_hero_aria_cta')||trackedEvents.filter(e=>e.name==='form_submit').length!==priorSubmits||submissions.length)throw new Error('Hero CTA source missing or Pricing click emitted conversion');
            // The FAQ CTA still scrolls to the direct inline form. Preserve failure/retry tracking.
            await activateFixtureControl(page.locator('[data-lead-faq-cta]'));
            const contact = page.locator('#aria-hero-form [data-lead-step-form]');
            await contact.waitFor({ state: 'visible' });
            await page.waitForFunction(() => {
              const r = document.querySelector('#aria-hero-form')?.getBoundingClientRect();
              return !!r && r.top < window.innerHeight && r.bottom > 0;
            });
            if (await page.locator('[role="dialog"] [data-lead-step-form]').count())
              throw new Error('Paid dock must scroll to inline form without opening a modal');
            await advanceLeadContact(contact);
            const breedInput = contact.getByLabel('Plemeno psíka *');
            if (!await breedInput.isVisible()) throw new Error('Active campaign form must ask for breed');
            await contact.locator('input[name="meno"]').fill('Testovací dopyt');
            await breedInput.fill('Írsky vlkodav');
            await contact.locator('input[name="telefon"]').fill('912345678');
            await centerFixtureControl(contact.locator('input[type="checkbox"][required]'));
            await contact.locator('input[type="checkbox"][required]').check();
            await contact.getByRole('button', { name: 'Odoslať záujem' }).click();
            await contact.getByRole('alert').waitFor({ state: 'visible' });
            if (trackedEvents.some(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline'))
              throw new Error('Backend error must NOT emit a paid Lead');
            await contact.getByRole('button', { name: 'Odoslať záujem' }).click();
            await page.locator('#aria-hero-form [data-lead-step-success]').waitFor({ state: 'visible' });
            if(await page.locator('#aria-hero-form [data-lead-success-links] a').count()!==2)throw new Error('Public form must keep both success links as button-like anchors');
            for (let i = 0; i < 15 && !trackedEvents.some(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline'); i++)
              await page.waitForTimeout(100);
            const sent = trackedEvents.filter(e => e.name === 'form_submit' && e.source === 'lead_landing_aria_hero_inline');
            const cta = trackedEvents.filter(e => e.name === 'explore_daycare' && e.source === 'lead_landing_hero_aria_cta');
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
            await page.setViewportSize({width:390,height:844});
            const faqForm=page.locator('[data-home-faq-contact-form]');
            const question=faqForm.locator('textarea[name="otazka"]');
            const faqPosts=[];
            const handler=async route=>{
              const cors={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
              if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:cors});return;}
              const payload=route.request().postDataJSON()||{};
              faqPosts.push(payload);
              await route.fulfill({status:201,contentType:'application/json',headers:cors,body:'{"ok":true}'});
            };
            await page.route('**/functions/v1/web-form-submit',handler);
            const faqNext=faqForm.getByRole('button',{name:'Pokračovať',exact:true});
            const faqBack=faqForm.getByRole('button',{name:'Späť',exact:true});
            const faqSend=faqForm.getByRole('button',{name:'Poslať',exact:true});
            const faqConsent=faqForm.locator('input[type="checkbox"][required]');
            await centerFixtureControl(question);
            await question.fill('Ako vyzerá deň v škôlke?');
            await centerFixtureControl(faqNext);
            await faqNext.click();
            await faqForm.locator('input[name="meno"]').waitFor({state:'visible',timeout:5000});
            await faqForm.locator('input[name="meno"]').fill('Testovací kontakt');
            await faqForm.locator('input[name="telefon"]').fill('912345678');
            await faqForm.locator('input[name="email"]').fill('test@example.com');
            await centerFixtureControl(faqBack);
            await faqBack.click();
            await question.waitFor({state:'visible',timeout:5000});
            if(await question.inputValue()!=='Ako vyzerá deň v škôlke?') throw new Error('FAQ question lost on Back');
            await centerFixtureControl(faqNext);
            await faqNext.click();
            await faqConsent.waitFor({state:'visible',timeout:5000});
            if(await faqForm.locator('input[name="meno"]').inputValue()!=='Testovací kontakt') throw new Error('FAQ contact lost on Back');
            if(await faqConsent.isChecked()) throw new Error('FAQ contact unexpectedly pre-consented');
            await centerFixtureControl(faqSend);
            await faqSend.click();
            if(faqPosts.length) throw new Error('FAQ contact accepted without consent');
            await centerFixtureControl(faqConsent);
            await faqConsent.check();
            if(!await faqConsent.isChecked()) throw new Error('FAQ contact consent did not select');
            const invalid=await faqForm.evaluate(el=>[...el.elements].filter(field=>field.willValidate&&!field.validity.valid).map(field=>({name:field.name,message:field.validationMessage})));
            if(invalid.length) throw new Error('FAQ contact invalid before submit: '+JSON.stringify(invalid));
            await centerFixtureControl(faqSend);
            await faqSend.click();
            await page.locator('[data-home-faq-contact-success]').waitFor({state:'visible',timeout:10000}).catch(async error=>{
              throw new Error('FAQ contact receipt missing: '+JSON.stringify({posts:faqPosts.length,alert:await faqForm.locator('[role="alert"]').allTextContents(),invalid:await faqForm.evaluate(el=>[...el.elements].filter(field=>field.willValidate&&!field.validity.valid).map(field=>({name:field.name,message:field.validationMessage}))).catch(()=>[]),cause:String(error)}));
            });
            for(let i=0;i<20&&!trackedEvents.some(e=>e.name==='explore_daycare'&&e.source==='home_faq_contact_submitted');i++) await page.waitForTimeout(100);
            const faqPayload=faqPosts[0];
            if(faqPosts.length!==1||faqPayload.cta_source!=='home_faq_contact'||faqPayload.marketing_consent!==false||faqPayload.email!=='test@example.com'||faqPayload.raw_payload?.['Otázka návštevníka']!=='Ako vyzerá deň v škôlke?'||faqPayload.dog_breed||trackedEvents.filter(e=>e.name==='explore_daycare'&&e.source==='home_faq_contact_submitted').length!==1||trackedEvents.some(e=>e.name==='form_submit'&&e.source==='home_faq_contact')) throw new Error('FAQ contact source, data, consent or non-conversion tracking regression');
            await page.unroute('**/functions/v1/web-form-submit',handler);
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
              const mainMobilePhotos = url.pathname === '/' && width < 1024;
              // A responsive Hero can settle a frame later after 390→1440
              // resize on Safari with restricted storage; keep a bounded gate.
              try { await primary.waitFor({state:'visible',timeout:4500}); }
              catch (_) { throw new Error('Hero prominent CTA missing at ' + width); }
              if (await hero.locator('.hero-cta-primary:visible').count() !== 1)
                throw new Error('Hero must retain one prominent CTA at ' + width);
              const ctaPair = hero.locator('.hero-cta-pair:visible');
              if (url.pathname === '/') {
                if (width < 1024) {
                  const pair = hero.locator('[data-home-hero-photo]');
                  const button = hero.locator('[data-home-hero-interest-cta]');
                  if (await pair.count() !== 2 || !await button.isVisible() ||
                      (await button.innerText()).trim() !== 'Mám záujem o škôlku' ||
                      await hero.locator('[data-lead-step-form]:visible').count() !== 0 ||
                      await page.locator('[data-home-hero-revealed-form]').count() !== 0 ||
                      await hero.locator('.hero-cta-pair:visible').count())
                    throw new Error('Mobile Hero must show two photos, CTA, then reviews, with form initially closed: ' + width);
                } else {
                  if ((await primary.innerText()).trim() !== 'Chcem zistiť viac' || await hero.locator('.hero-cta-secondary').count())
                    throw new Error('Desktop home learn-more CTA changed: ' + width);
                  const aligned = await primary.evaluate(el => {
                    const r=el.getBoundingClientRect(), copy=document.querySelector('.home-hero-column h1').getBoundingClientRect();
                    return Math.abs(r.left-copy.left)<=2;
                  });
                  if (!aligned) throw new Error('Desktop Home CTA must align with the copy left edge: ' + width);
                }
                if (width >= 1024 && !await hero.locator('[data-lead-step-form]:visible').first().isVisible())
                  throw new Error('Desktop home guided form missing');
                const layout = await page.evaluate(expectedTitle => {
                  const ids=['top','preco-chvostikovo','o-nas','aria-puppy-check','cennik','psie-priatelstva','podmienky','starostlivost','preco','priestory','prva-navsteva','prva-navsteva-form','faq','informujte-sa'];
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
                  const faq=document.querySelector('#faq');
                  const dock=document.querySelector('.mobile-dock[data-variant="main"]');
                  const heroCta=[...document.querySelectorAll('#top .hero-cta-primary')].find(el=>el.getBoundingClientRect().width>0);
                  const videoGrid=document.querySelector('[data-video-reasons-grid]');
                  const dogs=document.querySelector('[data-schoolmates-frame]').getBoundingClientRect();
                  return {
                    ordered:nodes.every((node,i)=>node && (!i || !!(nodes[i-1].compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING))),
                    reviewsInHero:document.getElementById('top').contains(document.getElementById('recenzie')),
                    tickerAbsent:!document.querySelector('main .info-ticker-track'),
                    benefitsMoved:!!photo && !!benefits && benefits.getBoundingClientRect().top>=photo.getBoundingClientRect().bottom && !document.querySelector('#top [data-hero-benefits]'),
                    bottomInquiry:document.querySelector('#kontakt #informujte-sa [data-lead-step-form]') && !document.querySelector('#kontakt [data-long-form]') && document.querySelector('#informujte-sa h3')?.textContent===expectedTitle,
                    aboutWidth:(()=>{const copy=document.querySelector('#o-nas [data-about-expanded]').getBoundingClientRect();const pictures=document.querySelector('#o-nas [data-about-expanded]').parentElement.nextElementSibling.getBoundingClientRect();return Math.abs(copy.width-pictures.width)<2;})(),
                    forms:['informujte-sa','prva-navsteva-form'].every(id=>document.getElementById(id)?.querySelector('[data-lead-step-form]')),
                    uniqueFields:inputs.length===new Set(inputs).size,
                    cutout:!!cutout && cutout.complete && cutout.naturalWidth>0,
                    palette:document.body.classList.contains('site-brand') && getComputedStyle(document.querySelector('#top h1')).color==='rgb(184, 46, 127)',
                    noHomeSalesBox:!document.querySelector('#top .home-hero-copy'),
                    noMobileSalesBox:innerWidth>=1024 || [...document.querySelectorAll('#top .home-hero-copy')].every(el=>el.getBoundingClientRect().height===0),
                    mobileOrangePhrase:innerWidth>=1024 || (() => {
                      const el=document.querySelector('[data-home-mobile-orange-phrase]');
                      return el?.textContent?.trim()==='váš psík zamiluje' &&
                        getComputedStyle(el).color==='rgb(255, 164, 20)';
                    })(),
                    mobileHeroPhotoOrder:innerWidth>=1024 || (() => {
                      const images=[...document.querySelectorAll('#top [data-home-hero-photo] img')];
                      const cta=document.querySelector('#top [data-home-hero-interest-cta]');
                      const reviews=document.querySelector('#top #recenzie');
                      if (images.length!==2 || !cta || !reviews) return false;
                      const a=images[0].getBoundingClientRect(), b=images[1].getBoundingClientRect();
                      const c=cta.getBoundingClientRect(), d=reviews.getBoundingClientRect();
                      return images.every(img=>img.complete && img.naturalWidth>0) &&
                        Math.abs(a.top-b.top)<2 && a.right<=b.left+2 &&
                        Math.min(a.width,b.width)>80 &&
                        c.top>=a.bottom+9 && d.top>=c.bottom+15 &&
                        a.left>=-1 && b.right<=innerWidth+1;
                    })(),
                    galleryImmediatelyAfterAbout:(() => {
                      const about=document.getElementById('o-nas');
                      const gallery=document.querySelector('main > section[aria-label="Fotogaléria zo psiej škôlky Chvostíkovo"]');
                      return !!about && !!gallery && about.nextElementSibling===gallery && gallery.nextElementSibling?.matches('[data-home-puppy-checker]') && gallery.nextElementSibling?.nextElementSibling?.id==='cennik';
                    })(),
                    mobileHeroBreathingAndThinCta:innerWidth>=640 || (() => {
                      const section=document.getElementById('top');
                      const title=section?.querySelector('h1')?.getBoundingClientRect();
                      const photos=section?.querySelector('[data-home-hero-photos]')?.getBoundingClientRect();
                      const cta=section?.querySelector('[data-home-hero-interest-cta]')?.getBoundingClientRect();
                      const reviews=section?.querySelector('#recenzie')?.getBoundingClientRect();
                      if(!section || !title || !photos || !cta || !reviews) return false;
                      const shortNarrow=innerWidth<380 && innerHeight<=800;
                      const topSpace=parseFloat(getComputedStyle(section).paddingTop);
                      return topSpace >= (shortNarrow ? 16 : 30) &&
                        photos.top>=title.bottom+14 && cta.top>=photos.bottom+12 &&
                        cta.height>=44 && cta.height<=49 &&
                        reviews.top>=cta.bottom+(shortNarrow ? 10 : 18);
                    })(),
                    reasonThirdNoRule:innerWidth>=640 || (() => {
                      const third=document.querySelectorAll('#preco-chvostikovo [data-video-reasons-copy] article')[2];
                      return !!third && getComputedStyle(third).borderTopWidth==='0px';
                    })(),
                    warmExplore:innerWidth<1024||(()=>{const style=getComputedStyle(document.getElementById('home-hero-learn-more'));return style.backgroundColor==='rgb(255, 255, 255)'&&style.color==='rgb(169, 84, 0)'&&style.boxShadow!=='none';})(),
                    desktopCtaWithinForm:innerWidth<1024||document.getElementById('home-hero-learn-more').getBoundingClientRect().bottom<=document.querySelector('#home-hero-inline-form [data-home-form-panel]').getBoundingClientRect().bottom+2,
                    friendshipInline:!!document.querySelector('[data-home-friendship-form] #home-friendship-application')&&!document.getElementById('zaujem-po-priatelstvach')&&!document.querySelector('#preco button')&&!!document.querySelector('#starostlivost #preco'),
                    freeVisitBadge:(()=>{const el=document.querySelector('#prva-navsteva [data-home-free-visit]');return !!el&&getComputedStyle(el).backgroundColor==='rgb(255, 164, 20)'&&parseFloat(getComputedStyle(el).paddingTop)>=10;})(),
                    pricing:cards.length===2 && Math.abs(cards[0].top-cards[1].top)<2 && Math.abs(cards[0].bottom-cards[1].bottom)<2 && cards[1].left>=cards[0].right+7 && included.top>=prices.bottom+7 && Math.abs(included.left-prices.left)<3 && Math.abs(included.right-prices.right)<3 && !document.querySelector('#cennik button'),
                     pricingAmounts:(()=>{const pass=document.querySelector('[data-home-price-card="pass"]');const value=pass?.querySelector('[data-home-price]');return !!value && /20\s*€\s*\/ deň/.test(value.textContent) && /200\s*€/.test(pass.textContent) && /10 vstupov/.test(pass.textContent) && !/Platí 2 mesiace/.test(pass.textContent) && /Ušetríte 50\s*€/.test(pass.textContent) && getComputedStyle(value).whiteSpace==='nowrap' && (()=>{const badge=pass.querySelector('[data-home-best-value]');const title=pass.querySelector('h3');if(!badge||!title)return false;const b=badge.getBoundingClientRect(),p=pass.getBoundingClientRect(),v=value.getBoundingClientRect();const single=document.querySelector('[data-home-price-card="single"]');const sv=single.querySelector('[data-home-price]');return title.textContent.trim()==='Permanentka' && single.querySelector('h3').textContent.trim()==='Jednorazový vstup' && getComputedStyle(title).whiteSpace==='nowrap' && getComputedStyle(single.querySelector('h3')).whiteSpace==='nowrap' && /25\s*€\s*\/ deň/.test(sv.textContent) && getComputedStyle(sv).whiteSpace==='nowrap' && /200\s*€\s*·\s*10 vstupov/.test(pass.querySelector('[data-home-pass-total]')?.textContent||'') && /Pondelok – piatok/.test(single.querySelector('[data-home-opening-hours]')?.textContent||'') && /od 7:00 do 17:00/.test(single.querySelector('[data-home-opening-hours]')?.textContent||'') && Math.abs(single.querySelector('h3').getBoundingClientRect().top-title.getBoundingClientRect().top)<2 && Math.abs(sv.getBoundingClientRect().top-v.top)<2 && getComputedStyle(sv).color==='rgb(255, 164, 20)' && title.getBoundingClientRect().bottom<=v.top+1 && b.top<p.bottom && b.bottom>p.bottom && b.left>=p.left-1 && b.right<=p.right+1 && b.bottom<included.top;})();})(),
                    passPink:getComputedStyle(document.querySelector('[data-home-price-card="pass"]')).backgroundColor==='rgb(248, 221, 235)',
                    taxiAcrossColumns:!!taxi && !taxi.closest('[data-home-included]') && taxi.getBoundingClientRect().top>=included.bottom+7 && !taxi.querySelector('br') && getComputedStyle(taxi.querySelector('span')).whiteSpace==='nowrap' && /5\s*€\s*\/ jazda/.test(taxi.textContent) &&
                      getComputedStyle(taxi).backgroundColor==='rgb(201, 44, 137)' && Math.abs(taxi.getBoundingClientRect().left-included.left)<3 && Math.abs(taxi.getBoundingClientRect().right-included.right)<3,
                    compactIncludedHeading:document.querySelector('[data-home-included] h3')?.textContent?.trim()==='Čo je v cene zahrnuté',
                    aboutExpanded:!document.querySelector('#o-nas summary') && !!aboutText?.querySelector('strong') && aboutHeading.scrollWidth<=aboutHeading.clientWidth+2 &&
                      getComputedStyle(aboutText).textAlign==='left' && parseFloat(getComputedStyle(aboutText).fontSize)===16 && aboutText.getBoundingClientRect().width<=812,
                    aboutNoOrphan:(()=>{const node=aboutText?.querySelector('p')?.lastChild;if(node?.nodeType!==Node.TEXT_NODE)return false;const words=[...node.textContent.matchAll(/\S+/g)].slice(-2);if(words.length!==2)return false;const tops=words.map(word=>{const range=document.createRange();range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);return range.getBoundingClientRect().top;});return Math.abs(tops[0]-tops[1])<2;})(),
                    aboutStack:!!photo && !!benefits && !!aboutText && aboutHeading.getBoundingClientRect().bottom<=photo.getBoundingClientRect().top+2 &&
                      benefits.getBoundingClientRect().bottom<=aboutText.getBoundingClientRect().top+2,
                    centeredFullWidthTaxi:Math.abs((taxi.getBoundingClientRect().left+taxi.getBoundingClientRect().right-included.left-prices.right)/2)<3,
                    faqContactResponsiveWidth:(()=>{const card=faq.querySelector('[data-home-faq-contact]'), question=faq.querySelector('button[aria-expanded]');if(!card||!question)return false;const c=card.getBoundingClientRect(),q=question.getBoundingClientRect();return c.width<=q.width+2 && (innerWidth>=1024?Math.abs(c.width-q.width)<2:c.width<=512+2) && card.scrollWidth<=card.clientWidth+2 && getComputedStyle(card).backgroundColor==='rgba(255, 252, 248, 0.94)';})(),
                    singleHomeFaq:!document.getElementById('home-early-faq') && faq.querySelectorAll('button[aria-expanded]').length===9 && !faq.querySelector('a[href="/caste-otazky"]') && !!faq.querySelector('[data-home-faq-contact]') && [...faq.querySelectorAll('button')].some(b=>b.textContent.includes('Pre koho je škôlka určená?')) && !document.querySelector('#starostlivost button[aria-expanded]') && !document.querySelector('#podmienky a[href="#aria-puppy-check"]'),
                    applicationAfterPricing:document.getElementById('cennik').nextElementSibling?.id==='psie-priatelstva' && document.querySelector('[data-home-puppy-checker]').nextElementSibling?.id==='cennik' && document.getElementById('psie-priatelstva').nextElementSibling?.id==='podmienky' && document.querySelectorAll('#aria-puppy-check').length===1,
                    orangeRequirementHeadings:[...document.querySelectorAll('#podmienky article h3')].every(el=>getComputedStyle(el).color==='rgb(255, 164, 20)'),
                    approvedMainDock:(()=>{const style=getComputedStyle(dock.querySelector('.mobile-dock-bar'));return style.boxShadow.includes('inset') && style.backgroundImage.includes('gradient') && (style.backdropFilter||style.webkitBackdropFilter||'').includes('blur');})(),
                    mainMenuOrder:[...dock.querySelectorAll('.mobile-dock-bar > a')].filter(el=>el.getClientRects().length).map(el=>el.getAttribute('href')).join('|')===(innerWidth<1024?'/|/#cennik|/#podmienky|/#priestory|/produkty':'/|/#o-nas|/#cennik|/#podmienky|/produkty') && dock.querySelector('.mobile-dock-apply')?.textContent.includes('Prihláška'),
                    benefitChipsSingleRow:benefitPills.length===3 && benefitPills.every(r=>Math.abs(r.top-benefitPills[0].top)<2),
                    certs:document.querySelectorAll('#o-nas [data-safety-certificates] img').length===2 &&
                      (() => {
                        const heading=document.querySelector('#o-nas [data-safety-heading]');
                        const icon=heading?.querySelector('svg');
                        const panel=document.querySelector('#o-nas [data-safety-certificates] > div');
                        const text=aboutText?.getBoundingClientRect(), box=panel?.getBoundingClientRect();
                        const label=heading?.querySelector('[data-safety-heading-copy]');
                        const explanation=panel?.querySelector('[data-safety-copy]')?.getBoundingClientRect();
                        const diplomas=panel?.querySelector('[data-safety-diplomas]')?.getBoundingClientRect();
                        const labelRange=document.createRange();if(label)labelRange.selectNodeContents(label);
                        return !!label&&new Set([...labelRange.getClientRects()].map(r=>Math.round(r.top))).size<=3&&
                          !!explanation&&!!diplomas&&explanation.top>=heading.getBoundingClientRect().bottom&&diplomas.top>=explanation.bottom&&
                          !!heading && !!icon && !!text && !!box &&
                          icon.getBoundingClientRect().width>=27 &&
                          (innerWidth>=640 || parseFloat(getComputedStyle(heading).fontSize)<=14) &&
                          Math.abs(box.left-text.left)<=48 && Math.abs(box.right-text.right)<=48;
                      })(),
                    formDepth:getComputedStyle(document.querySelector('#informujte-sa [data-home-inquiry-card]')).boxShadow.includes('rgb'),
                    heroFormOrDesktopCta: innerWidth < 1024
                      ? !!document.querySelector('#top [data-home-hero-interest-cta]') &&
                        [...document.querySelectorAll('#top [data-lead-step-form]')].every(el=>el.getBoundingClientRect().height===0)
                      : getComputedStyle(document.querySelector('#top .home-hero-desktop-cta .hero-cta-primary')).boxShadow!=='none',
                    conditionsNext:document.getElementById('psie-priatelstva').nextElementSibling?.id==='podmienky',
                    opaqueCards:innerWidth<640 || getComputedStyle(videoGrid).backgroundColor==='rgba(0, 0, 0, 0)',
                    noCareCta:!document.querySelector('#preco-chvostikovo .relative.z-20 button') && dogs.top-videoGrid.getBoundingClientRect().bottom>=24,
                    homeMobileVideoLayout:(() => {
                      const video=document.querySelector('#preco-chvostikovo video')?.getBoundingClientRect();
                      const texts=[...document.querySelectorAll('#preco-chvostikovo [data-video-reasons-copy] article')].map(el=>el.getBoundingClientRect());
                      if (!video || texts.length!==3 || !document.querySelector('#preco-chvostikovo [data-home-video-layout]')) return false;
                      if (innerWidth>=640) return texts.every(r=>r.left>=video.right-2) &&
                        video.bottom>=texts[2].bottom-5;
                      // Mobile: first two reasons stacked beside video;
                      // third stays in the same text column beside the matching photo.
                      return texts[0].left>=video.right-2 &&
                        texts[1].left>=video.right-2 &&
                        texts[1].top>=texts[0].bottom-2 &&
                        texts[2].top>=video.bottom-2 &&
                        texts[2].left>=video.right-2 && (()=>{const photo=document.querySelector('[data-home-reason-photo]')?.getBoundingClientRect();return !!photo && Math.abs(photo.width-video.width)<3 && photo.right<=texts[2].left+3 && Math.abs(video.top-texts[0].top)<3 && Math.abs(video.bottom-texts[1].bottom)<3 && Math.abs(photo.top-texts[2].top)<3 && Math.abs(photo.bottom-texts[2].bottom)<3;})() &&
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
                        style.backgroundColor === 'rgba(255, 252, 248, 0.94)' &&
                        parseFloat(style.borderTopWidth)>=1.4 &&
                        !document.querySelector('#informujte-sa a[href^="tel:"]');
                    })(),
                    firstVisit:getComputedStyle(document.getElementById('prva-navsteva')).backgroundColor==='rgb(145, 64, 107)' && ![...document.querySelectorAll('#prva-navsteva button')].some(el=>el.textContent.includes('Dohodnúť úvodnú návštevu')),
                    pricingFits:[...document.querySelectorAll('[data-home-pricing-columns] *')].every(el=>el.scrollWidth<=el.clientWidth+2),
                    paws:!!document.querySelector('#top .paw-trail-background'),
                  };
                },readPublicContent().INQUIRY_TITLE);
                if(Object.values(layout).some(value=>!value)) throw new Error('Home brand/layout regression at '+width+'px: '+JSON.stringify(layout));
                if(width>=1024){
                  const desktopForm=page.locator('#home-hero-inline-form [data-lead-step-form]');
                  const position=()=>page.locator('.home-hero-column').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height};});
                  const before=await position();
                  await desktopForm.locator('label').first().click();
                  await desktopForm.getByRole('button',{name:'Pokračovať',exact:true}).click();
                  await assertLeadContactIntro(desktopForm);
                  const after=await position();
                  if(Object.keys(before).some(key=>Math.abs(before[key]-after[key])>2))throw new Error('Growing contact form moved Home hero: '+JSON.stringify({width,before,after}));
                  await desktopForm.getByRole('button',{name:'Späť',exact:true}).click();
                  await page.locator('#home-hero-inline-form [data-lead-form-intro]').first().waitFor({state:'visible'});
                }
                if (width===320) {
                  // Narrow Android short viewport: review proof visible above
                  // the dock; controls remain >=44px despite compact mode.
                  await page.setViewportSize({width:320,height:760});
                  await page.locator('#top #recenzie').scrollIntoViewIfNeeded();
                  const narrow=await page.evaluate(()=>{
                    const review=document.querySelector('#top #recenzie [data-review-card]')?.getBoundingClientRect();
                    const dock=document.querySelector('.mobile-dock[data-variant="main"]')?.getBoundingClientRect();
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
                const puppyToggle=page.locator('#faq button').filter({hasText:'Prijímate aj šteniatka?'});
                await centerFixtureControl(puppyToggle);
                await puppyToggle.click();
                await page.locator('#faq a[href="#aria-puppy-check"]').waitFor({state:'visible',timeout:5000});
                const puppyLink=page.locator('#faq a[href="#aria-puppy-check"].btn-coral');
                if (!await puppyLink.isVisible() ||
                    !(await page.locator('#aria-puppy-check h2').innerText()).includes('Spĺňa základné podmienky?'))
                  throw new Error('Expanded puppy FAQ must show a pink CTA linking to the real age/vaccination checker');
                await centerFixtureControl(puppyToggle);
                await puppyToggle.click();
                await puppyLink.waitFor({state:'hidden',timeout:5000});
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
              if (!mainMobilePhotos) {
                const primaryShadow = await primary.evaluate(el => getComputedStyle(el).boxShadow);
                if (url.pathname === '/' && width >= 1024) {
                  if (primaryShadow === 'none') throw new Error('Main desktop amber CTA glow missing: ' + width);
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
              await page.locator('.mobile-dock[data-variant="main"] .mobile-dock-apply').click();
              const dockApplication=page.getByRole('dialog').last();
              await dockApplication.waitFor({state:'visible'});
              if(!await dockApplication.locator('input[name="pes"]').isVisible() || await dockApplication.locator('input[name="meno"]').isVisible()) throw new Error('Homepage mobile application must open dog step first');
              if(brandPreviewCandidate)await assertApplicationDogLayout(dockApplication,engine,'modal');
              await dockApplication.getByRole('button',{name:'Close'}).click();
              await dockApplication.waitFor({state:'hidden'});
              const locationFaq=page.locator('#faq button').filter({hasText:'Kde sa škôlka nachádza?'});
              await centerFixtureControl(locationFaq);await locationFaq.click();
              const locationCard=locationFaq.locator('..');
              const locationText=await locationCard.innerText();
              const homeLocation=page.locator('#priestory [data-daycare-location-copy]');
              if((await homeLocation.innerText()).includes('bezplatné parkovisko')||!(await page.locator('#priestory').innerText()).includes('Bezplatné parkovanie pri škôlke'))throw new Error('HOME parking should remain in chip only');
              if(await homeLocation.locator('p').count()!==3||JSON.stringify(await homeLocation.locator('strong').allTextContents())!==JSON.stringify((await locationCard.locator('strong').allTextContents()).filter(text=>text!=='bezplatné parkovisko')))throw new Error('HOME location section and FAQ emphasis differs');
              if(!['Poľskej 6','Rastislavova','autoumyvárke','bezplatné parkovisko','12 a 54'].every(value=>locationText.includes(value))||await locationCard.locator('a').getAttribute('href')!==readPublicContent().MAP_LINK)throw new Error('Homepage location FAQ differs');
              const puppyFaq=page.locator('#faq button').filter({hasText:'Prijímate aj šteniatka?'});
              // Center the real disclosure and link above the fixed mobile dock.
              if(await puppyFaq.getAttribute('aria-expanded')!=='true') {
                await centerFixtureControl(puppyFaq);
                await puppyFaq.click();
              }
              const homePuppyLink=page.locator('#faq a[href="#aria-puppy-check"]');
              await homePuppyLink.waitFor({state:'visible',timeout:5000});
              await centerFixtureControl(homePuppyLink);
              await homePuppyLink.click();
              await page.waitForFunction(()=>{const y=document.getElementById('aria-puppy-check').getBoundingClientRect().top;return y>=0&&y<200;});
              for(const id of ['informujte-sa','prva-navsteva-form']) {
                const inquiry=page.locator('#'+id+' [data-lead-step-form]');
                // APP-01 WebKit: radio labels and React change handlers may settle on
                // separate frames after responsive resize + smooth anchor scroll.
                // Assert the actual radio selection before expecting step 2;
                // never accept a click alone as evidence of a completed transition.
                const firstChoice=inquiry.locator('label:has(input[name="zaujem"])').first();
                await firstChoice.scrollIntoViewIfNeeded();
                await firstChoice.click();
                const radio=firstChoice.locator('input[name="zaujem"]');
                if(!await radio.isChecked()) await radio.check({force:true});
                await page.waitForFunction(targetId => {
                  const form=document.querySelector('#'+targetId+' [data-lead-step-form]');
                  const next=Array.from(form?.querySelectorAll('button') ?? []).find(x=>x.textContent?.trim()==='Pokračovať');
                  return !!form?.querySelector('input[name="zaujem"]:checked') && !!next && !next.disabled;
                }, id, {timeout:5000});
                await inquiry.getByRole('button',{name:'Pokračovať',exact:true}).click();
                await inquiry.locator('[role="progressbar"][aria-valuenow="2"]').waitFor({state:'attached',timeout:7000}).catch(() => { throw new Error('Inline contact step did not advance: '+id); });
                await inquiry.locator('input[name="meno"]').waitFor({state:'visible',timeout:7000}).catch(() => { throw new Error('Inline contact step not visible: '+id); });
                await inquiry.getByRole('button',{name:'Späť',exact:true}).click();
              }
              const application=page.locator('[data-home-friendship-form]');
              const toggle=application.locator('#home-friendship-application');
              const owner=application.locator('input[name="meno"]');
              if(await owner.isVisible() || !await application.locator('input[name="pes"]').isVisible() || !await application.locator('input[name="plemeno"]').isVisible() || await application.locator('input[name="vek"]').isVisible()) throw new Error('Collapsed application must show only count and first identity fields');
              await activateFixtureControl(toggle);
              await application.locator('input[name="pes"]').waitFor({state:'visible',timeout:5000});
              if(await owner.isVisible() || !await application.getByRole('radio',{name:'Fena',exact:true}).count() || await page.getByRole('dialog').count()) throw new Error('Inline application did not open dog step');
              if(brandPreviewCandidate)await assertApplicationDogLayout(application,engine,'inline');
              await activateFixtureControl(toggle);
              await application.locator('input[name="vek"]').waitFor({state:'hidden',timeout:5000});
              if(await owner.isVisible()) throw new Error('Inline application collapse exposed owner step');
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
            if (!await wizard.getByRole('heading', { name: 'Kontaktné údaje' }).isVisible()) throw new Error('Lead wizard did not advance to contact step');
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
              // Settle setup before measuring a real wheel; a pending smooth
              // anchor scroll can otherwise cancel the wheel and report 0 -> 0.
              await carousel.evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
              await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
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
              // CTA reveals a shared inline form AFTER Hero/reviews, without modal.
              // Validate real iPhone width, all three interests and step 2.
              await page.setViewportSize({width:390,height:844});
              await page.locator('#top [data-home-hero-interest-cta]').click();
              const revealed=page.locator('#home-hero-interest[data-home-hero-revealed-form]');
              await revealed.waitFor({state:'visible',timeout:5000});
              const inline=revealed.locator('[data-lead-step-form]');
              if (!await inline.isVisible() ||
                  await page.locator('#top [data-lead-step-form]:visible').count() ||
                  await page.getByRole('dialog').count())
                throw new Error('Home interest CTA must reveal the in-page form after Hero');
              const choices=inline.locator('label:has(input[name="zaujem"])');
              if (await choices.count()!==3) throw new Error('Revealed home form must retain all three interests');
              await centerFixtureControl(choices.nth(1));
              await choices.nth(1).click();
              if(!await choices.nth(1).locator('input').isChecked())throw new Error('Fixture failed to select visible interest');
              const continueButton=inline.getByRole('button', {name:'Pokračovať',exact:true});
              await centerFixtureControl(continueButton);
              await continueButton.click();
              await inline.locator('input[name="meno"]').waitFor({state:'visible',timeout:5000});
              await inline.locator('input[name="telefon"]').waitFor({state:'visible',timeout:5000});
              await inline.getByRole('button',{name:'Späť',exact:true}).click();
              if (!await choices.nth(1).locator('input[name="zaujem"]').isChecked())
                throw new Error('Revealed interest selection was lost on back');
            } else {
              const entry = url.pathname === '/psia-skolka-kosice/'
                ? page.locator('[data-lead-faq-cta]')
                : (isAriaPage || isPuppyAria)
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
            if (!await modal.locator(url.pathname.startsWith('/en/') ? '[data-application-form]' : '[data-lead-step-form]').count())
              throw new Error('Mobile CTA must open the correct shared form');
            if (!url.pathname.startsWith('/en/')) {
              const leadForm = modal.locator('[data-lead-step-form]');
              const cards = leadForm.locator('label:has(input[name="zaujem"])');
              if (await cards.count() !== 3) throw new Error('Every normal SK inquiry must retain exactly three interest choices');
              await cards.nth(1).click();
              await leadForm.getByRole('button', { name: 'Pokračovať' }).click();
              if (!await leadForm.locator('[data-inquiry-dog-fields]').isVisible())
                throw new Error('Regular SK interest must show optional breed on this page: ' + url.pathname);
            }
            if(brandPreviewCandidate && !url.pathname.startsWith('/en/')) await assertLeadContactIntro(modal.locator('[data-lead-step-form]'));
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
              // Verify the real inline registration, not a second form or modal.
              const application=page.locator('[data-home-friendship-form]');
              const toggle=application.locator('#home-friendship-application');
              await activateFixtureControl(toggle);
              await application.locator('input[name="pes"]').waitFor({state:'visible',timeout:5000});
              if(!await application.locator('input[name="pes"]').isVisible() || await application.locator('[data-lead-step-form]').count() || await page.getByRole('dialog').count()) throw new Error('Friendship must expand the existing application in-place');
              const fits=await application.evaluate(el=>{const b=el.getBoundingClientRect();return b.width<=innerWidth-16 && el.scrollWidth<=el.clientWidth+2 && (innerWidth<1024 || b.width>=800);});
              if(!fits)throw new Error('Inline application responsive width incorrect');
              await activateFixtureControl(toggle);
              await application.locator('input[name="vek"]').waitFor({state:'hidden',timeout:5000});
            }
          }
          if (errors.length) throw new Error(errors.join('; '));
          if(brandPreviewCandidate&&!bellaris&&!restricted){
            // Freeze DOM indices instead of re-resolving a changing :visible list
            // while WebKit scrolls/paints the previously revealed homepage forms.
            const homeRoute=url.pathname==='/';
            const forms=page.locator('[data-lead-step-form]');
            const visibleIndices=await forms.evaluateAll(nodes=>nodes.flatMap((node,index)=>node.getClientRects().length&&node.getBoundingClientRect().height>0?[index]:[]));
            for(const i of visibleIndices){
              const form=forms.nth(i);
              if(await form.getAttribute('data-lead-step')==='1'){
                if(homeRoute||isPaidLeadFixture(page)){
                  await advanceLeadContact(form);
                }else{
                  await activateFixtureControl(form.locator('label:has(input[type="radio"])').first());
                  await activateFixtureControl(form.getByRole('button',{name:url.pathname.startsWith('/en/')?'Continue':'Pokračovať',exact:true}));
                }
              }
              if(url.pathname.startsWith('/en/')) {
                await form.getByRole('heading',{name:'Contact details',exact:true}).waitFor({state:'visible'});
                if(await form.getAttribute('data-lead-step')!=='2')throw new Error('EN contact step missing');
              } else await assertLeadContactIntro(form);
              const sharedBack=form.getByRole('button',{name:url.pathname.startsWith('/en/')?'Back':'Späť',exact:true});
              if(homeRoute||isPaidLeadFixture(page))await activateFixtureControl(sharedBack);
              else await sharedBack.click();
              await form.getByRole('button',{name:url.pathname.startsWith('/en/')?'Continue':'Pokračovať',exact:true}).waitFor({state:'visible',timeout:5000});
              if(await form.getAttribute('data-lead-step')!=='1')throw new Error('Shared form back failed');
              const restored=await form.evaluate(el=>{const shell=el.closest('[data-lead-form-shell]');return [...shell.querySelectorAll(':scope > [data-lead-form-intro]')].every(node=>getComputedStyle(node).display!=='none');});
              if(!restored)throw new Error('Shared introduction not restored on back');
            }
          }
          results.push({ engine, restricted, route: url.pathname, status: 'PASS' });
          console.log(`PASS ${label}`);
        } catch (error) {
          const failure = { engine, restricted, route: url.pathname, status: 'FAIL', error: error.message, runtimeErrors: errors };
          results.push(failure); failures.push(failure);
          await page.screenshot({ path: path.join(out, `${label}.png`), fullPage: true }).catch(() => {});
          console.error(`FAIL ${label}: ${error.stack || error.message}`, errors);
        } finally { await page.close(); }
      }
      if (runtimeScope === 'full' && !bellaris && !restricted) {
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
              const relatedArticles = productPage.locator('[data-product-related-articles]');
              const relatedCarousel = relatedArticles.locator('[data-product-article-carousel]');
              for (const href of ['/blog/stojan-na-misky-pre-psa-vyhody-a-vyber/', '/blog/target-na-cvicenie-psov-prve-cviky/']) {
                if (await relatedCarousel.locator('a[href="'+href+'"]').count() !== 1) throw new Error('Missing shared product article '+href);
              }
              const relatedLayout = await relatedCarousel.evaluate(el => ({display:getComputedStyle(el).display,snap:getComputedStyle(el).scrollSnapType,scroll:el.scrollWidth,client:el.clientWidth,width:document.documentElement.scrollWidth,viewport:innerWidth}));
              if (relatedLayout.width>relatedLayout.viewport+1 || (width===390 ? relatedLayout.display!=='flex' || !relatedLayout.snap.startsWith('x') || relatedLayout.scroll<=relatedLayout.client : relatedLayout.display!=='grid')) throw new Error('Product article carousel/grid regression: '+JSON.stringify(relatedLayout));
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
                if (await dlg.locator('[data-lead-dialog-intro]').count() || !(await dlg.evaluate(el=>getComputedStyle(el).backgroundColor==='rgba(255, 252, 248, 0.94)'))) throw new Error('Stand step two must hide intro and keep shared light liquid');
                await dlg.getByPlaceholder('napr. Bella').fill('Rex');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="3"]').count() !== 1) throw new Error('Stand contact step missing');
              } else {
                const targetCards=productPage.locator('[data-target-variant-cards]');
                if (await targetCards.locator('article').count() !== 3)
                  throw new Error('Target must have exactly three stand-style size cards');
                if (width===390 && !(await targetCards.evaluate(el=>el.scrollWidth>el.clientWidth+30)))
                  throw new Error('Target size cards must swipe on mobile');
                const variants=[
                  {type:'large',label:'„Veľký“ verzia',size:'40 × 20 cm',photo:'Veľký drevený target'},
                  {type:'medium',label:'„Stredný“ verzia',size:'30 × 15 cm',photo:'Stredný drevený target'},
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
                  if (photoPosition !== (variant.type === 'small' ? '50% 100%' : '50% 90%'))
                    throw new Error('Target crop mismatch; all sizes should reveal the product: '+variant.type+' '+photoPosition);
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
                // Preserve the existing SMALL CTA regression as well as the new MEDIUM option.
                await targetCards.locator('[data-target-size="small"] button').click();
                const smallDialog=productPage.getByRole('dialog',{name:action});
                if(!(await smallDialog.locator('button[aria-pressed="true"]').innerText()).includes('Malý'))throw new Error('Small target CTA selection regressed');
                await productPage.keyboard.press('Escape');
                await smallDialog.waitFor({state:'hidden'});
                // Select the MEDIUM card and make sure the original wizard receives that size,
                // rather than resetting to its former default LARGE.
                await targetCards.locator('[data-target-size="medium"]')
                  .getByRole('button',{name:/stredný target/i}).click();
                const dlg=productPage.getByRole('dialog',{name:action});
                await dlg.waitFor({state:'visible'});
                if (await dlg.locator('[data-product-inquiry-steps][data-step="1"]').count() !== 1)
                  throw new Error('Target step 1 missing');
                const selected=dlg.locator('button[aria-pressed="true"]');
                if (!(await selected.innerText()).includes('Stredný'))
                  throw new Error('Target medium-card CTA did not select medium variant');
                await dlg.getByRole('button',{name:'Pokračovať'}).click();
                if (await dlg.locator('[data-product-inquiry-steps][data-step="2"]').count() !== 1)
                  throw new Error('Target step 2 missing');
                if(await dlg.locator('[data-lead-dialog-intro]').count() || !(await dlg.evaluate(el=>getComputedStyle(el).backgroundColor==='rgba(255, 252, 248, 0.94)'))) throw new Error('Target step two must hide intro and keep shared light liquid');
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
                if(await openForm.getByRole('heading',{name:'Máte záujem o stojan?',exact:true}).isVisible()) throw new Error('Inline stand introduction must be hidden after step one');
                if (await productPage.locator('section[data-stand-gallery-section] button:has-text("Mám záujem o stojan")').count()) throw new Error('Gallery should precede product explanation without stray CTA');
              }
              const galleryTrack=productPage.locator('[data-photo-carousel="' + (route.includes('stojan')?'stand':'target') + '"]');
              if (await galleryTrack.count() !== 1 || await galleryTrack.locator('figure').count() !== (route.includes('stojan')?16:10)) {
                throw new Error('Product gallery missing: '+route);
              }
              const edgeBounds=await galleryTrack.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:document.documentElement.offsetWidth};});
              if(Math.abs(edgeBounds.left)>2||Math.abs(edgeBounds.right-edgeBounds.width)>2)throw new Error('Product gallery must reach both edges: '+JSON.stringify(edgeBounds));
              if (!route.includes('stojan')) {
                if(await galleryTrack.locator('[data-target-photo-open]').count()!==10) throw new Error('All target photos must be openable');
                await galleryTrack.locator('[data-target-photo-open]').first().click();
                const targetLightbox=productPage.locator('[data-stand-lightbox]');
                await targetLightbox.waitFor({state:'visible'});
                const photo=targetLightbox.locator('[data-stand-photo-viewport] img');
                await productPage.waitForFunction(()=>document.querySelector('[data-stand-photo-viewport] img')?.naturalWidth>0,null,{timeout:8000});
                const fits=await photo.evaluate(img=>{const r=img.getBoundingClientRect();return r.width>0 && r.height>0 && Math.abs(r.width/r.height-img.naturalWidth/img.naturalHeight)<0.04 && getComputedStyle(img).objectFit==='contain';});
                if(!fits || !await targetLightbox.getByRole('heading',{name:/Fotografia targetu/}).count()) throw new Error('Target viewer must fit original aspect ratio with accessible product name');
                const src=await photo.getAttribute('src');
                await targetLightbox.getByRole('button',{name:'Ďalšia fotografia'}).click();
                await productPage.waitForFunction(old=>document.querySelector('[data-stand-photo-viewport] img')?.getAttribute('src')!==old,src,{timeout:5000});
                await productPage.keyboard.press('Escape');
                await targetLightbox.waitFor({state:'hidden'});
              }
              if (await productPage.locator('a[href="/kosik"], a[href="/objednavka"]').count()) throw new Error('Product routes to retired checkout');
            }
            // Test the same product wizard inline in the new article without sending real inquiries.
            await productPage.goto(new URL('/blog/target-pri-rehabilitacii-psa/', base).href);
            await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});
            const rehabConsent=productPage.getByRole('button',{name:'Len nevyhnutné',exact:true});
            if(await rehabConsent.isVisible())await rehabConsent.click();
            const rehabGallery=productPage.locator('[data-blog-target-gallery]');
            if(await rehabGallery.locator('figure').count()!==3)throw new Error('Rehab article three photos missing');
            const rehabForm=productPage.locator('[data-blog-target-inquiry]');
            if(await rehabForm.count()!==1)throw new Error('Rehab inline inquiry missing');
            const inquiryUrl='**/functions/v1/product-inquiry-submit';
            let rehabPayloads=[];
            const rehabMock=async route=>{
              const headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
              if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
              rehabPayloads.push(route.request().postDataJSON());
              await route.fulfill({status:200,headers,contentType:'application/json',body:'{"ok":true,"inquiry_id":1}'});
            };
            await productPage.route(inquiryUrl,rehabMock);
            try{
              await rehabForm.getByRole('button',{name:/Stredný/}).click();
              await rehabForm.getByPlaceholder('5',{exact:true}).fill('4');
              await rehabForm.getByRole('button',{name:'Pokračovať',exact:true}).click();
              await rehabForm.getByRole('button',{name:'Pokračovať',exact:true}).click();
              await rehabForm.locator('input[name="customer_name"]').fill('TEST Fixture');
              await rehabForm.locator('input[type="tel"]').fill('901234567');
              await rehabForm.locator('input[name="email"]').fill('test@example.com');
              await rehabForm.locator('input[name="customer_location"]').fill('Hlavná 12, Košice, 040 01');
              await rehabForm.locator('input[type="checkbox"][required]').check();
              await rehabForm.getByRole('button',{name:'Odoslať záujem',exact:true}).click();
              await rehabForm.getByRole('status').waitFor({state:'visible'});
              const payload=rehabPayloads[0];
              if(rehabPayloads.length!==1||payload?.configuration?.size!=='medium'||payload?.configuration?.height_cm!==4||payload?.source_ref!=='/blog/target-pri-rehabilitacii-psa/'||payload?.product_type!=='target')throw new Error('Rehab inquiry payload mismatch');
            }finally{await productPage.unroute(inquiryUrl,rehabMock);}
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
            const relatedCards = relatedGrid.locator(':scope > div > a');
            if (await relatedCards.count() < 3) throw new Error('Related blog cards missing');
            const firstCard = await relatedCards.nth(0).boundingBox();
            const secondCard = await relatedCards.nth(1).boundingBox();
            const thirdCard = await relatedCards.nth(2).boundingBox();
            if (!firstCard || !secondCard || !thirdCard) throw new Error('Missing related blog card geometry');
            if (width === 1440 && (Math.abs(firstCard.y - secondCard.y) > 3 || Math.abs(firstCard.y - thirdCard.y) > 3)) throw new Error('Desktop related cards must appear side by side');
            if (width === 390 && (Math.abs(firstCard.y-secondCard.y)>3 || secondCard.x<=firstCard.x || !(await relatedGrid.evaluate(el=>el.scrollWidth>el.clientWidth && getComputedStyle(el).scrollSnapType.startsWith('x'))))) throw new Error('Mobile related cards must swipe horizontally');
            if (await productPage.locator('[data-blog-article-header] a[href="/stojan-na-misky-pre-psa"], [data-blog-article-header] p').count()) throw new Error('Blog header must not contain product CTA or long intro');
            if (!(await productPage.locator('article section.flow-root p strong').count())) throw new Error('Blog editorial emphasis missing');
            const pair=productPage.locator('[data-blog-cta-pair]').first();
            const [ctaOne,ctaTwo]=await Promise.all([pair.locator('a').nth(0).boundingBox(),pair.locator('a').nth(1).boundingBox()]);
            if (!ctaOne||!ctaTwo||Math.abs(ctaOne.y-ctaTwo.y)>3||ctaTwo.x<=ctaOne.x) throw new Error('Article product CTA pair must be side by side');
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
            {
              const guideGalleryBox = await guideCarousel.boundingBox();
              if (!guideGalleryBox || guideGalleryBox.x > 2 || guideGalleryBox.x + guideGalleryBox.width < await productPage.evaluate(()=>document.documentElement.offsetWidth) - 2) {
                throw new Error('Stand guide gallery must use full layout width on mobile and desktop');
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
            if(brandPreviewCandidate){
              await productPage.locator('.mobile-dock[data-hydrated="true"]').waitFor({state:'attached'});
              const consent=productPage.getByRole('button',{name:'Len nevyhnutné',exact:true});
              if(await consent.isVisible())await consent.click();
              const blogForm=productPage.locator('#zaujem [data-lead-step-form]');
              await blogForm.locator('label').first().click();
              await blogForm.getByRole('button',{name:'Pokračovať',exact:true}).click();
              await assertLeadContactIntro(blogForm);
              if(await productPage.locator('#zaujem > p').isVisible())throw new Error('Blog contact introduction paragraph remains visible');
              await blogForm.getByRole('button',{name:'Späť',exact:true}).click();
            }
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
            const careToggle = productPage.locator('#faq').getByRole('button', { name: 'Ako zabezpečujete bezpečnosť psíkov v škôlke?', exact: true });
            if (await careToggle.count() !== 1 || await productPage.locator('#starostlivost').getByRole('button', { name: /Ako dbáme na bezpečnosť|Hrajú sa psíkovia/ }).count()) {
              throw new Error('Safety and daily-rhythm FAQ must live in the single homepage FAQ, not Care');
            }
            await careToggle.click();
            const careFaq = careToggle.locator('xpath=..');
            if (await careToggle.getAttribute('aria-expanded') !== 'true' ||
                !(await careFaq.getByText('neustálym dohľadom', { exact: false }).count())) {
              throw new Error('Consolidated safety FAQ must open with its detailed answer');
            }
            const faqBox = await careFaq.boundingBox();
            const faqLayout = await productPage.locator('#faq > .relative.z-10').boundingBox();
            if (!faqBox || !faqLayout || Math.abs(faqBox.width - (faqLayout.width - 32)) > 4) {
              throw new Error('Consolidated FAQ should span its content width');
            }
            if (await careFaq.getByRole('heading', { name: 'Ako zabezpečujete bezpečnosť psíkov v škôlke?' }).count()) throw new Error('FAQ repeats a second heading inside its answer');
            if (!await careFaq.getByText('Bezpečnosť začína už vstupnou návštevou.', { exact: false }).count()) {
              throw new Error('Safety FAQ answer missing after consolidation');
            }
            await careToggle.click();
            const eligibilityToggle = productPage.locator('#faq').getByRole('button', { name: 'Pre koho je škôlka určená?', exact: true });
            await eligibilityToggle.click();
            if (await eligibilityToggle.getAttribute('aria-expanded') !== 'true' || !(await eligibilityToggle.locator('xpath=..').locator('p').count())) throw new Error('Eligibility FAQ must retain its answer');
            await eligibilityToggle.click();
            for (const [name, phrases] of [
              ['Aký je cenník a treba si rezervovať miesto vopred?', ['25 €','200 €','2 mesiace','do nedele 20:00','deň vopred do 19:00']],
              ['Aké sú otváracie hodiny a ponúkate aj odvoz?', ['7:00 do 17:00','5 € za jednu jazdu']],
              ['Zabezpečujete aj stravu?', ['stravu nepodávame']],
            ]) {
              const item=productPage.locator('#faq').getByRole('button',{name,exact:true});
              await item.click();
              const answer=await item.locator('xpath=..').innerText();
              if(!phrases.every(p=>answer.includes(p))) throw new Error('Missing practical FAQ content: '+name);
              if(!await item.locator('xpath=..').locator('p strong').count()) throw new Error('FAQ must highlight essential facts: '+name);
              if(name.startsWith('Aký je cenník')&&!await item.locator('xpath=..').locator('a[href="/#cennik"]').isVisible()) throw new Error('Missing pricing link');
              await item.click();
            }
            const whyArticle = productPage.locator('#preco a[href="/blog/je-psia-skolka-vhodna-pre-kazdeho-psa/"]');
            if (await whyArticle.count() !== 1) throw new Error('Suitability article missing beside homepage benefits');
            if(await productPage.locator('#preco button, #preco a[href^="tel:"]').count()) throw new Error('Why must not duplicate application or phone CTA');
            if(!await productPage.locator('#psie-priatelstva').getByRole('button',{name:'Zobraziť celú prihlášku',exact:true}).isVisible() || !await productPage.locator('#psie-priatelstva p strong').getByText('pravidelne',{exact:true}).count()) throw new Error('Friendship application CTA and emphasized regular-visits explanation missing');
            const homeLayout=await productPage.locator('#priestory').evaluate(section=>{
              const heading=section.querySelector('h2'), chips=section.querySelector('[data-home-location-chips]'),intro=section.querySelector('[data-home-spaces-description]'),copy=section.querySelector('[data-daycare-location-copy]');
              const [h,k,p,c]=[heading,chips,intro,copy].map(e=>e.getBoundingClientRect());
              const style=getComputedStyle(intro),answer=getComputedStyle(copy.querySelector('p'));
              const range=document.createRange();range.selectNodeContents(heading);const lines=new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top)));
              return h.bottom<=k.top&&k.bottom<=p.top&&p.bottom<=c.top&&Math.abs(p.left-c.left)<2&&Math.abs(p.right-c.right)<2&&Math.abs(c.width-(copy.parentElement.clientWidth-32))<2&&style.fontSize===answer.fontSize&&style.fontFamily===answer.fontFamily&&style.lineHeight===answer.lineHeight&&(innerWidth<1024||lines.size===1);
            });
            if(!homeLayout)throw new Error('HOME location heading/chips/full-width matched type');
            const homeArrival=productPage.locator('#priestory [data-daycare-arrival-map]');
            if(await homeArrival.getAttribute('href')!==readPublicContent().MAP_LINK||!await assertArrivalImage(homeArrival)||!await homeArrival.evaluate(el=>{
              const b=el.getBoundingClientRect(),gallery=el.parentElement,g=gallery.getBoundingClientRect(),photos=[...gallery.querySelectorAll('[data-home-space-photo]')].map(e=>e.getBoundingClientRect());
              const last=photos.at(-1);
              return gallery.hasAttribute('data-home-spaces-mosaic')&&b.width>0&&el.scrollWidth<=el.clientWidth+1&&(innerWidth>=1024?Math.abs(b.top-last.top)<2&&Math.abs(b.bottom-last.bottom)<2&&Math.abs(b.width-last.width)<2&&b.left>last.right&&Math.abs(b.right-g.right)<2:Math.abs(b.left-g.left)<2&&Math.abs(b.right-g.right)<2&&b.bottom<=photos[0].top);
            }))throw new Error('HOME arrival map responsive grid/link/asset');
             const mosaicShape=await productPage.locator('[data-home-spaces-mosaic]').evaluate(el=>({
              columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,count:el.querySelectorAll('[data-home-space-photo]').length,
              paired:innerWidth>=1024||[...el.querySelectorAll('[data-home-mosaic-hygiene]')].every((card,i)=>{const photos=[...el.querySelectorAll('[data-home-space-photo]')].map(p=>p.getBoundingClientRect());const r=card.getBoundingClientRect();return Math.abs(photos[i*2].top-photos[i*2+1].top)<2 && r.top>=photos[i*2].bottom && r.top-photos[i*2].bottom<24 && (i===2||photos[i*2+2].top>=r.bottom && photos[i*2+2].top-r.bottom<24);}),quality:[...el.querySelectorAll('button img')].every(img=>img.getAttribute('src').includes('/w_1600,h_1600,al_c,q_92,enc_auto/')&&img.getAttribute('srcset').includes('900w'))
            }));
            if(mosaicShape.columns!==(width===390?2:3)||mosaicShape.count!==8||!mosaicShape.quality||!mosaicShape.paired)throw new Error('Homepage spaces mosaic regression: '+JSON.stringify(mosaicShape));
            const mobileHygiene = productPage.locator('#priestory article[aria-label^="Čistota priestorov"]');
            const desktopHygiene = productPage.locator('#priestory article:not([aria-label])');
            if (await mobileHygiene.count() !== 3 || await desktopHygiene.count() !== 3) {
              throw new Error('The hygiene section needs three interleaved mobile cards and three desktop cards');
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
              // Measure the related footer elements in one layout snapshot.
              // Independent boundingBox calls can straddle a late image/font reflow.
              await footer.getByText('Pondelok – piatok', {exact:true}).waitFor({state:'visible'});
              await footer.getByText('7:00 – 17:00', {exact:true}).waitFor({state:'visible'});
              await productPage.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
              const hours=await footer.evaluate(el=>{
                const find=text=>[...el.querySelectorAll('span')].find(node=>node.textContent.trim()===text&&node.getClientRects().length);
                const day=find('Pondelok – piatok'), time=find('7:00 – 17:00');
                const social=[...el.querySelectorAll('[data-social-links="footer"] a')].find(node=>node.getClientRects().length);
                return {day:day?.getBoundingClientRect().toJSON(),time:time?.getBoundingClientRect().toJSON(),social:social?.getBoundingClientRect().toJSON(),sameParent:!!day&&!!time&&day.parentElement===time.parentElement};
              });
              if (!hours.day || !hours.time || !hours.sameParent || hours.day.width<=0 || hours.time.width<=0 ||
                  hours.time.y < hours.day.y + hours.day.height - 1 ||
                  Math.abs(hours.day.x - hours.time.x) > 2) {
                throw new Error('Footer hours must render on two aligned lines: day above time '+JSON.stringify(hours));
              }
              if (!hours.social || hours.social.y <= hours.day.y) throw new Error('Desktop footer socials must be below opening hours '+JSON.stringify(hours));
            }
            if (width === 390) {
              await assertCompactHomeMenu(productPage,false);
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
              // PR538 restored the mobile-only Spaces shortcut before Products.
              const spacesLink = dock.getByRole('link', { name: 'Priestory', exact: true });
              if (await spacesLink.count() !== 1 || await spacesLink.getAttribute('href') !== '/#priestory' ||
                  !await spacesLink.isVisible() || !await spacesLink.evaluate(el=>el.getBoundingClientRect().height>=44)) {
                throw new Error('Approved mobile Spaces shortcut must remain visible and usable');
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
              await assertCompactHomeMenu(productPage,true);

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
            const faqAlias=new URL('/caste-otazky/',base).href;
            try { await productPage.goto(faqAlias,{waitUntil:'commit'}); }
            catch(error) {
              const message=String(error),expected=new URL('/#faq',base).href;
              if(!message.includes(`Navigation to "${faqAlias}" is interrupted by another navigation to "${expected}"`)) throw error;
            }
            await productPage.waitForURL(url=>url.pathname==='/'&&url.hash==='#faq');
            await productPage.locator('#faq [data-home-faq-contact]').waitFor({state:'visible'});
            if(await productPage.locator('#faq button[aria-expanded]').count()!==9) throw new Error('FAQ redirect did not land on consolidated home content');
            results.push({engine, restricted:false, route:'product-inquiries-' + width, status:'PASS'});
            console.log('PASS product inquiries and retired shop redirects ' + engine + ' ' + width);
          } catch (error) {
            const failure = {engine, width, route:'product-inquiries', status:'FAIL', error:error.message};
            failures.push(failure);
            results.push(failure);
            console.error('FAIL product inquiries and redirects ' + engine + ' ' + width + ': ' + (error.stack || error.message));
            await productPage.screenshot({path:path.join(out, 'products-' + engine + '-' + width + '.png'), fullPage:true}).catch(()=>{});
          } finally { await productPage.close(); }
        }
      }
      await context.close();
    }
    } finally { await browser.close(); }
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), base, results }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
