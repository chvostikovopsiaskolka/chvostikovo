const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 try{
  for(const width of [320,360,390,430]){
   const {page}=await fixture(browser,1,width,engine.name());
   await page.setViewportSize({width,height:540});
   await page.evaluate(()=>{showAuth('signup');loading(false)});
   const scroller=page.locator('#authView');
   await page.waitForTimeout(80);
   const before=await scroller.evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflow:getComputedStyle(el).overflowY,mode:el.dataset.authMode}));
   assert.equal(before.mode,'signup');assert.equal(before.overflow,'auto');
   assert(before.scrollHeight>before.clientHeight+50,'signup must actually overflow viewport at '+width+': '+JSON.stringify(before));
   await scroller.evaluate(el=>{el.scrollTop=el.scrollHeight});
   assert(await scroller.evaluate(el=>el.scrollTop)>50,'signup content must be scrollable to submit at '+width);
   assert(await page.locator('#signupForm [type="submit"]').isVisible(),'submit stays reachable at '+width);
   const menu=await page.locator('#customerLocaleInMenuV409').evaluate(el=>({direction:getComputedStyle(el).flexDirection,align:getComputedStyle(el).alignItems}));
   assert.equal(menu.direction,'column');assert.equal(menu.align,'center');
   const logoutBeforeLocale=await page.evaluate(()=>{const a=document.getElementById('menuLogout'),b=document.getElementById('customerLocaleInMenuV409');return Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)});
   assert(logoutBeforeLocale,'locale below logout at '+width);
   if(width===390){
    await page.evaluate(()=>{
     window.__v418AuthCalls=[];
     authFetch=async (path,opts)=>{
      __v418AuthCalls.push({path,payload:JSON.parse(opts.body)});
      if(path.includes('/token'))throw Object.assign(new Error('Email not confirmed'),{code:'email_not_confirmed',status:400});
      return {};
     };
     showAuth('login');loading(false);
    });
    await page.locator('#loginEmail').fill('  GaJl.TEST@GMAIL.com  '.trim());
    await page.locator('#loginPassword').fill('SyntheticPassword1');
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForFunction(()=>document.querySelector('#authMessage')?.textContent.includes('E-mail ešte nie je potvrdený'));
    assert.equal(await page.evaluate(()=>__v418AuthCalls[0].payload.email),'gajl.test@gmail.com','mixed case normalized before Supabase login');
    await page.locator('#resendConfirmationV418').click();
    await page.waitForFunction(()=>__v418AuthCalls.length===2);
    assert.equal(await page.evaluate(()=>__v418AuthCalls[1].payload.type),'signup');
    await page.locator('#resendConfirmationV418').click();
    assert.equal(await page.evaluate(()=>__v418AuthCalls.length),2,'cooldown prevents duplicate emails');
    await page.evaluate(()=>{showAuth('signup');loading(false)});
    assert.equal(await page.locator('.password-eye-v19').count(),0,'legacy signup eye is removed');
    for(const inputId of ['signupPassword','signupPasswordAgain']){
     const input=page.locator('#'+inputId),eye=page.locator('#'+inputId+' + button.password-eye-btn');
     assert.equal(await eye.count(),1,inputId+' has exactly one shared eye');
     assert.equal(await input.getAttribute('type'),'password',inputId+' starts masked');
     await eye.click();
     assert.equal(await input.getAttribute('type'),'text',inputId+' click reveals password');
     assert.equal(await eye.getAttribute('aria-pressed'),'true',inputId+' exposed toggled state');
     await eye.click();
     assert.equal(await input.getAttribute('type'),'password',inputId+' second click masks password');
     assert.equal(await eye.getAttribute('aria-pressed'),'false',inputId+' restored toggled state');
    }
   }
   await page.close();
  }
  console.log('PASS v418 signup actual scroll, menu layout + mock auth error/resend with SK on Chromium/WebKit');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
