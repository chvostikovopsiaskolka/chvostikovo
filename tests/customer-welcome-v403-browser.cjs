const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 try{
  for(const width of process.env.AUTH_TEST_WIDTH?[Number(process.env.AUTH_TEST_WIDTH)]:[320,360,390,430,844,1280]){
   const {page,context,errors}=await fixture(browser,1,width,type.name());
   assert.equal(await page.locator('#authView').getAttribute('data-auth-mode'),'welcome','cold unauthenticated startup chooses welcome');
   await page.evaluate(()=>{state.session=null;showAuth('welcome');loading(false)});
   assert(await page.locator('#authWelcomeBrandV403').isVisible());
   assert.equal(await page.locator('#authWelcomeBrandV403 img').count(),1,'one full logo on welcome');
   assert(!await page.locator('.auth-corner-brand-v403').isVisible());
   assert(!await page.locator('#loginForm').isVisible());
   assert(!await page.locator('#signupForm').isVisible());
   assert(!await page.locator('#authView').textContent().then(t=>t.includes('Vitajte v Chvostíkove')));
   await page.locator('#authView>.auth-card>.lg-v3-material').waitFor({state:'attached'});
   assert((await page.locator('#authCreateAccountV403').evaluate(el=>getComputedStyle(el).boxShadow))!=='none');
   assert(parseFloat(await page.locator('#authView>.auth-card').evaluate(el=>getComputedStyle(el).getPropertyValue('--lg-v3-milk')))<=.24);
   assert.equal(await page.evaluate(()=>__calls.filter(u=>u.includes('/auth/v1/')).length),0,'welcome makes no authentication request');
   await page.locator('#authCreateAccountV403').click();
   assert(await page.locator('#signupForm').isVisible());
   assert(!await page.locator('#authWelcomeBrandV403').isVisible());
   assert((await page.locator('.auth-corner-brand-v403').boundingBox()).width<=45);
   for(const id of ['signupName','signupEmail','signupPhone','signupDogName','signupPassword','signupPasswordAgain'])assert(await page.locator('#'+id).isVisible(),id+' retained');
   await page.locator('#signupName').fill('Synthetic owner');
   await page.locator('#signupPasswordAgain').scrollIntoViewIfNeeded();
   await page.locator('#authBackV403').scrollIntoViewIfNeeded();await page.locator('#authBackV403').click();
   assert(await page.locator('#authWelcomeV403').isVisible());
   await page.locator('#authHaveAccountV403').click();
   assert(await page.locator('#loginForm').isVisible());
   await page.locator('#loginEmail').fill('synthetic@example.invalid');
   await page.evaluate(()=>window.__loginNodeV403=document.getElementById('loginEmail'));
   await page.locator('#showSignup').click();assert.equal(await page.locator('#signupName').inputValue(),'Synthetic owner','switching preserves signup draft');
   await page.locator('#showLogin').click();assert(await page.evaluate(()=>document.getElementById('loginEmail')===__loginNodeV403),'existing form nodes retained');
   assert.equal(await page.locator('#loginEmail').inputValue(),'synthetic@example.invalid');
   await page.locator('#forgotPasswordBtn').click();assert(await page.locator('#forgotForm').isVisible());
   await page.locator('#authBackV403').click();assert(await page.locator('#loginForm').isVisible(),'forgot goes back to login');
   // Edge/system back must use the same visible close action without losing drafts.
   await page.locator('#showSignup').click();
   await page.evaluate(()=>{const start=new Event('touchstart',{bubbles:true,cancelable:true});Object.defineProperty(start,'touches',{value:[{clientX:8,clientY:160,identifier:1}]});document.body.dispatchEvent(start);const end=new Event('touchend',{bubbles:true,cancelable:true});Object.defineProperty(end,'changedTouches',{value:[{clientX:130,clientY:160,identifier:1}]});document.body.dispatchEvent(end)});
   assert(await page.locator('#authWelcomeV403').isVisible(),'edge back returns to welcome');
   if(width===390){
    if(process.env.NATIVE_BACK_CHECK){
     await page.locator('#authHaveAccountV403').click();
     assert.equal(await page.evaluate(()=>document.dispatchEvent(new CustomEvent('chvo-native-back',{cancelable:true}))),false,'Android back handled inside auth');
     assert(await page.locator('#authWelcomeV403').isVisible());
    }
    const dir=process.env.AUTH_EVIDENCE_DIR||path.join(os.tmpdir(),'chvo-v403-auth');fs.mkdirSync(dir,{recursive:true});
    await page.screenshot({path:path.join(dir,'welcome-'+type.name()+'.png'),fullPage:true});
    await page.locator('#authCreateAccountV403').click();
    await page.locator('#signupEmail').fill('synthetic@example.invalid');await page.locator('#signupPhone').fill('900000000');await page.locator('#signupDogName').fill('Synthetic dog');await page.locator('#signupPassword').fill('Synthetic1!');await page.locator('#signupPasswordAgain').fill('Different1!');await page.locator('#signupPrivacyAck').check();
    const before=await page.evaluate(()=>__calls.length);await page.locator('#signupForm [type=submit]').click();assert((await page.locator('#authMessage').textContent()).includes('Heslá sa nezhodujú.'),JSON.stringify(await page.evaluate(()=>({message:document.getElementById('authMessage').textContent,invalid:[...document.querySelectorAll('#signupForm :invalid')].map(el=>({id:el.id,message:el.validationMessage}))}))));assert.equal(await page.evaluate(()=>__calls.length),before,'password mismatch cannot submit');
    await page.evaluate(()=>{
     window.__signupV403=[];
     authFetch=async(url,options)=>{
      __signupV403.push({url,body:JSON.parse(options.body)});
      return {user:{identities:[{id:'synthetic'}]}};
     };
    });
    await page.locator('#signupPasswordAgain').fill('Synthetic1!');await page.locator('#signupForm [type=submit]').click();
    await page.waitForFunction(()=>document.getElementById('authView').dataset.authMode==='login');
    assert.equal(await page.locator('#loginEmail').inputValue(),'synthetic@example.invalid');assert((await page.locator('#authMessage').textContent()).includes('Potvrdzovací e-mail bol odoslaný'));
    assert.equal(await page.evaluate(()=>__signupV403[0].body.data.dog_name),'Synthetic dog');
    await page.screenshot({path:path.join(dir,'login-'+type.name()+'.png'),fullPage:true});
    await page.setViewportSize({width,height:420});await page.locator('#showSignup').click();await page.locator('#signupPasswordAgain').scrollIntoViewIfNeeded();assert(await page.locator('#signupPasswordAgain').isVisible());await page.locator('#signupForm [type=submit]').scrollIntoViewIfNeeded();assert(await page.locator('#signupForm [type=submit]').isVisible());
    await page.reload();assert(await page.locator('#loginForm').isVisible(),'pending signup email bypasses welcome');
    await page.evaluate(()=>{sessionStorage.setItem('chvostikovo_verified_email_return',JSON.stringify({email:'verified@example.invalid',at:Date.now()}));localStorage.removeItem('chvostikovo_pending_login_email')});
    await page.goto('https://inbox.fixture/?email_confirmed=1');assert(await page.locator('#loginForm').isVisible());assert.equal(await page.locator('#loginEmail').inputValue(),'verified@example.invalid','verified email callback goes directly to login');
    await page.goto('https://inbox.fixture/?recovery_fixture=1#access_token=synthetic-recovery&refresh_token=synthetic-refresh&type=recovery&expires_in=3600');assert(await page.locator('#newPasswordForm').isVisible());assert(!await page.locator('#authBackV403').isVisible(),'recovery cannot be hidden behind welcome');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');assert.deepEqual(errors,[]);
   await context.close();console.log('PASS welcome/forms/drafts/back/validation',type.name(),width);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
