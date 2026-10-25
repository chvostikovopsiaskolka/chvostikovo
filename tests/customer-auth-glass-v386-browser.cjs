const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;for(const width of [320,360,390,430,844]){
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM).args:['--no-sandbox']}:{});
 try{const {page,context,errors}=await fixture(browser,1,width,type.name());
 await page.evaluate(()=>{state.session=null;state.data=null;showAuth('login');loading(false);document.documentElement.classList.remove('customer-design','customer-liquid-v364')});
 await page.waitForSelector('html.customer-auth-glass-v386');
 const material=page.locator('#authView>.auth-card>.lg-v3-material');await material.waitFor({state:'attached'});
 await page.waitForFunction(engine=>document.querySelector('#authView>.auth-card>.lg-v3-material')?.dataset.renderer===(engine==='webkit'?'webgl':'svg'),type.name(),{timeout:15000});
 assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts<=1,'login uses at most one context');
 assert(!await page.locator('.bottom-nav').isVisible());assert.equal(await page.locator('#loginForm').evaluate(el=>getComputedStyle(el).filter),'none');
 assert((await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('chvostikovo-paws-soft-v383.png'));
 if(width===390){fs.mkdirSync('/tmp/chvo-v386-auth',{recursive:true});await page.screenshot({path:`/tmp/chvo-v386-auth/login-${type.name()}.png`});}
 const before=await page.evaluate(()=>__calls.filter(u=>u.includes('/auth/v1/token')).length);await page.locator('#loginForm [type=submit]').click();
 assert.equal(await page.evaluate(()=>__calls.filter(u=>u.includes('/auth/v1/token')).length),before,'native required validation makes no auth request');
 await page.locator('#loginEmail').fill('synthetic@example.invalid');await page.locator('#loginPassword').fill('Synthetic1!');
 await page.evaluate(()=>window.__loginNode=document.getElementById('loginEmail'));
 await page.locator('#showSignup').click();assert(await page.locator('#signupForm').isVisible());assert.equal(await page.locator('#signupPassword').getAttribute('minlength'),'8');
 await material.waitFor({state:'visible'});if(width===390)await page.screenshot({path:`/tmp/chvo-v386-auth/signup-${type.name()}.png`});
 for(const id of ['signupName','signupEmail','signupPhone','signupDogName','signupPassword']){await page.locator('#'+id).focus();assert.equal(await page.locator('#'+id).evaluate(el=>getComputedStyle(el).filter),'none');assert(await page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().width>100));}
 await page.locator('#showLogin').click();assert(await page.evaluate(()=>document.getElementById('loginEmail')===__loginNode));assert.equal(await page.locator('#loginEmail').inputValue(),'synthetic@example.invalid');
 await page.locator('#loginEmail').focus();await page.keyboard.press('Tab');assert(await page.locator('#loginPassword').evaluate(el=>el===document.activeElement));
 await page.locator('#forgotPasswordBtn').click();assert(await page.locator('#forgotForm').isVisible());await page.locator('#backToLogin').click();
 assert(await page.locator('#loginForm').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts,0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(250);assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts<=1);
 if(type===chromium&&width===390){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});await page.waitForTimeout(120);assert.equal((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts,0);assert.equal(await material.evaluate(el=>getComputedStyle(el).backdropFilter),'none');await cdp.detach();}
 assert.deepEqual(errors,[]);console.log('PASS auth glass login/signup/validation/keyboard/recovery/resume',type.name(),width);await context.close();
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
